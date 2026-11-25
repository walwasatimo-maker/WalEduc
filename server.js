'use strict';
/* WalEduc school management server.
   Zero dependencies. Needs Node.js 22.13 or newer (uses the built-in SQLite module). */
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\nWalEduc needs Node.js 22.13 or newer. This computer has Node.js ${process.versions.node}.\nDownload the current LTS from https://nodejs.org and try again.\n`);
  process.exit(1);
}
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { open, DEFS, validate, DEFAULT_SUBJECTS, DEFAULT_SLOTS } = require('./lib/db');
const policy = require('./lib/policy');
const auth = require('./lib/auth');

/* ---------- configuration ---------- */
const cfg = {
  port: Number(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  dataDir: path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data')),
  trustProxy: process.env.TRUST_PROXY === '1',
  tlsCert: process.env.TLS_CERT || '',
  tlsKey: process.env.TLS_KEY || ''
};
cfg.secureCookie = !!(cfg.tlsCert && cfg.tlsKey) || process.env.COOKIE_SECURE === '1';
const PUBLIC = path.join(__dirname, 'public');
const VERSION = require('./package.json').version;

const store = open(cfg.dataDir);
const sessions = auth.createSessions(store);
const limiter = auth.createLimiter();
const { STAFF, FAMILY, ROLE_LABEL, COLLS, SINGLE } = policy;
const digits = auth.digits;
const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);
const uid = p => p + crypto.randomBytes(6).toString('hex');

/* ---------- accounts ---------- */
const U = {
  count: store.db.prepare('SELECT COUNT(*) AS n FROM users'),
  byName: store.db.prepare('SELECT * FROM users WHERE username = ?'),
  byId: store.db.prepare('SELECT * FROM users WHERE id = ?'),
  all: store.db.prepare('SELECT id, username, name, role, owners, staff_id, must, active, last_login, created FROM users ORDER BY role, name'),
  insert: store.db.prepare('INSERT INTO users (id, username, name, role, owners, staff_id, salt, hash, must, active, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)'),
  setPw: store.db.prepare('UPDATE users SET salt = ?, hash = ?, must = ?, active = 1 WHERE id = ?'),
  setActive: store.db.prepare('UPDATE users SET active = ? WHERE id = ?'),
  login: store.db.prepare('UPDATE users SET last_login = ? WHERE id = ?'),
  del: store.db.prepare('DELETE FROM users WHERE id = ?'),
  adminCount: store.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1"),
  firstAdmin: store.db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created LIMIT 1"),
  delFamily: store.db.prepare("DELETE FROM users WHERE role IN ('parent','student')"),
  parents: store.db.prepare("SELECT username FROM users WHERE role = 'parent'"),
  students: store.db.prepare("SELECT owners FROM users WHERE role = 'student'")
};
const safeJson = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const publicUser = r => ({ id: r.id, username: r.username, name: r.name, role: r.role, owners: safeJson(r.owners, []), staffId: r.staff_id || null, must: !!r.must, active: !!r.active, last: r.last_login || null, created: r.created });
const me = (u, last) => ({ id: u.id, username: u.username, name: u.name, role: u.role, owners: u.owners || [], staffId: u.staffId || u.staff_id || null, last: last || null });

/* ---------- http helpers ---------- */
const clientIp = req => (cfg.trustProxy && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '';
class HttpError extends Error { constructor(status, msg, extra) { super(msg); this.status = status; this.extra = extra; } }
const fail = (status, msg, extra) => { throw new HttpError(status, msg, extra); };

function setHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  if (cfg.secureCookie) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
}
function sendJson(req, res, status, obj, headers) {
  let body = Buffer.from(JSON.stringify(obj));
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(headers || {}) };
  if (body.length > 1400 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { body = zlib.gzipSync(body); h['Content-Encoding'] = 'gzip'; h.Vary = 'Accept-Encoding'; }
  h['Content-Length'] = body.length;
  res.writeHead(status, h); res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0, dead = false;
    req.on('data', c => { if (dead) return; n += c.length; if (n > limit) { dead = true; reject(new HttpError(413, 'That upload is too large.')); } else chunks.push(c); });
    req.on('end', () => { if (!dead) resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}
async function readJson(req, limit = 1024 * 1024) {
  const b = await readBody(req, limit);
  if (!b.length) return {};
  try { const v = JSON.parse(b.toString('utf8')); return v && typeof v === 'object' ? v : {}; } catch (e) { fail(400, 'The request was not valid JSON.'); }
}
const cookieHeader = (token, maxAge) => `we_sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${cfg.secureCookie ? '; Secure' : ''}`;

/* ---------- images ---------- */
const ID_RE = /^[\w\-|. ]{1,90}$/;
const IMG_MAGIC = b => (b.length > 12 && ((b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) ? 'image/jpeg' :
  (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) ? 'image/png' :
  (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') ? 'image/webp' : null));
function dataUrlBuf(dataUrl, maxBytes) {
  const m = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  return buf.length <= maxBytes && IMG_MAGIC(buf) ? buf : null;
}
const KIND = { students: 'student', staff: 'staff' };
function savePhoto(coll, id, buf) { store.filePut(`${KIND[coll]}:${id}`, IMG_MAGIC(buf), buf); store.setPhoto(coll, id, Date.now()); }

/* ---------- numbering ---------- */
function newAdm() {
  const s = store.school(), code = String(s.code || 'SCH').replace(/[^\w-]/g, '') || 'SCH', year = Number(s.year) || new Date().getFullYear();
  let n = store.nextNumber('students', 'adm'), adm;
  do { adm = `${code}/${year}/${String(n++).padStart(4, '0')}`; } while (store.admTaken(adm));
  return adm;
}
function newRct() { let n = store.nextNumber('payments', 'rct'), r; do { r = 'RCT-' + String(n++).padStart(5, '0'); } while (store.rctTaken(r)); return r; }

/* ---------- field-level privacy ---------- */
const MEDICAL = new Set(['admin', 'head', 'dos', 'teacher', 'warden', 'registrar', 'sickbay']);
const CONTACTS = new Set(['admin', 'head', 'registrar', 'bursar', 'hrm']);
function redact(role, coll, d) {
  if (coll === 'students' && !MEDICAL.has(role)) return { ...d, medical: '' };
  if (coll === 'staff' && !CONTACTS.has(role)) return { ...d, phone: '', email: '' };
  return d;
}

/* ---------- small helpers ---------- */
const fdate = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
const fdt = v => { const t = Date.parse(v); return isNaN(t) ? '' : new Date(t + 3 * 3600 * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' (East Africa Time)'; };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DENY = m => ({ e: m || 'Your role is not allowed to change this.', denied: true });
const ANY_STAFF = new Set(STAFF.filter(r => r !== 'admin'));
const marksOpen = cfg => !!cfg && !!cfg.marksOpen && (!cfg.marksDeadline || Date.now() < Date.parse(cfg.marksDeadline));
const papersOpen = cfg => !!cfg && !!cfg.paperDeadline && Date.now() < Date.parse(cfg.paperDeadline);

/* A tiny validator for the JSON document collections.
   Types: s text, r required text, i integer [min,max], d optional date, D required date, b boolean, e enum, E required enum, t timestamp */
function cleanDoc(spec, d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { e: 'A record must be an object.' };
  const out = {};
  for (const [k, def] of Object.entries(spec)) {
    const [t, a, b] = def; let v = d[k];
    switch (t) {
      case 's': case 'r': v = v == null ? '' : String(v).trim(); if (v.length > (a || 200)) return { e: `${k} is too long.` }; if (t === 'r' && !v) return { e: `${k} is required.` }; break;
      case 'i': v = Math.round(Number(v) || 0); if (v < a || v > b) return { e: `${k} must be between ${a} and ${b}.` }; break;
      case 'd': case 'D': v = v == null ? '' : String(v); if (v === '' && t === 'd') break; if (!DATE_RE.test(v)) return { e: `${k} must be a date.` }; break;
      case 'b': v = v === true || v === 1 || v === '1'; break;
      case 'e': case 'E': v = v == null || v === '' ? (t === 'E' ? a[0] : '') : String(v); if (v !== '' && !a.includes(v)) return { e: `${k} is not valid.` }; break;
      case 't': v = v == null ? '' : String(v); if (v !== '' && (v.length > 40 || isNaN(Date.parse(v)))) return { e: `${k} must be a date and time.` }; break;
      default: break;
    }
    out[k] = v;
  }
  return { d: out };
}
const DOC_SPEC = {
  hr: { salary: ['i', 0, 1e9], payFreq: ['E', ['Monthly', 'Weekly', 'Termly']], allowances: ['i', 0, 1e9], bank: ['s', 80], bankAcct: ['s', 40], contract: ['E', ['Permanent', 'Fixed-term', 'Probation', 'Part-time', 'Volunteer']], contractStart: ['d'], contractEnd: ['d'], nssf: ['s', 40], tin: ['s', 40], qualification: ['s', 150], nextOfKin: ['s', 120], nextOfKinPhone: ['s', 40], notes: ['s', 1000] },
  staffatt: { date: ['D'], staffId: ['r', 90], mark: ['E', ['P', 'L', 'A', 'V', 'O']] },
  misconduct: { staffId: ['r', 90], date: ['D'], type: ['r', 80], details: ['s', 3000], action: ['s', 500], status: ['E', ['Open', 'Resolved']] },
  leaves: { staffId: ['r', 90], type: ['E', ['Annual', 'Sick', 'Maternity', 'Paternity', 'Study', 'Compassionate', 'Unpaid']], from: ['D'], to: ['D'], status: ['E', ['Pending', 'Approved', 'Rejected']], note: ['s', 500] },
  rollcall: { date: ['D'], session: ['E', ['Morning', 'Evening', 'Night']], studentId: ['r', 90], mark: ['E', ['P', 'A', 'E', 'S']] },
  examtt: { examId: ['r', 90], classId: ['r', 90], subject: ['r', 80], date: ['D'], start: ['s', 5], end: ['s', 5], venue: ['s', 80], invigilator: ['s', 80] },
  examcfg: { examId: ['r', 90], paperDeadline: ['t'], marksOpen: ['b'], marksDeadline: ['t'] }
};
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ---------- who a person is, for row-level rules ---------- */
function makeWorld(user) {
  const w = { staffId: user.staffId || null };
  w.classes = new Map(store.list('classes').map(c => [c.id, c.data]));
  w.stu = new Map(store.db.prepare('SELECT id, class_id, boarding, status FROM students').all().map(r => [r.id, { classId: r.class_id, boarding: r.boarding, status: r.status }]));
  w.subjects = store.list('subjects').map(r => r.data);
  w.ct = new Set([...w.classes.values()].filter(c => c.teacherId && c.teacherId === w.staffId).map(c => c.id));
  w.taught = new Set(w.subjects.filter(s => s.teacherId && s.teacherId === w.staffId).map(s => s.classId + '|' + s.name));
  w.taughtClasses = new Set(w.subjects.filter(s => s.teacherId && s.teacherId === w.staffId).map(s => s.classId));
  return w;
}
const FULL_DISCIPLINE = new Set(['admin', 'head', 'dos', 'registrar', 'teacher', 'warden', 'hrm']);
function rowVisible(user, coll, r, getW) {
  const R = user.role, d = r.data;
  switch (coll) {
    case 'students': return R !== 'warden' || (d.boarding === 'Boarding' && d.status !== 'Withdrawn');
    case 'discipline': case 'sickbay': case 'rollcall':
      if (R === 'warden' && coll !== 'rollcall') { const s = getW().stu.get(d.studentId); if (!s || s.boarding !== 'Boarding') return false; }
      if (coll === 'discipline' && !FULL_DISCIPLINE.has(R)) return d.byId === user.id;
      return true;
    case 'marks': {
      if (['head', 'dos', 'registrar', 'examoffice'].includes(R)) return true;
      if (R !== 'teacher') return false;
      const W = getW(), [, sid, sub] = r.id.split('|'), st = W.stu.get(sid); if (!st) return false;
      return W.ct.has(st.classId) || W.taught.has(st.classId + '|' + sub);
    }
    case 'comments': {
      if (['head', 'dos', 'registrar', 'examoffice'].includes(R)) return true;
      if (R !== 'teacher') return false;
      const W = getW(), st = W.stu.get(r.id.split('|')[1]); return !!st && W.ct.has(st.classId);
    }
    case 'attendance': {
      if (R !== 'teacher') return true;
      const W = getW(), st = W.stu.get(r.id.split('|')[1]); return !!st && W.ct.has(st.classId);
    }
    case 'tt': { if (R !== 'teacher') return true; const W = getW(); return W.ct.has(r.ref) || W.taughtClasses.has(r.ref); }
    case 'messages': return R === 'head' || d.byId === user.id;
    case 'inbox': return d.to === 'r:' + R || (!!user.staffId && d.to === 't:' + user.staffId);
    case 'papers': return R === 'examoffice' || (R === 'teacher' && !!user.staffId && d.teacherId === user.staffId);
    default: return true;
  }
}

/* ---------- notifications and effects ---------- */
const effects = [];
function notify(to, kind, title, body, extra) { const id = uid('i'); store.put('inbox', id, { id, to, kind, title: String(title).slice(0, 150), body: String(body).slice(0, 2000), at: nowIso(), ...(extra || {}) }); }
function notifyKid(sid, kind, title, body, parentsToo, extra) { notify('s:' + sid, kind, title, body, extra); if (parentsToo) notify('p:' + sid, kind, title, body, extra); }
function queueSms(phone, name, text, by) { if (phone) effects.push({ phone, name, text, by }); }
const schoolName = () => store.school().name || 'the school';
async function runEffects(user) {
  const list = effects.splice(0);
  if (!list.length) return;
  const conf = store.smsSecret(), live = conf.provider === 'africastalking' && conf.apiKey && conf.username;
  for (const e of list) {
    let status = 'Recorded';
    const num = intlPhone(e.phone);
    if (live && num) { try { const r = await atSend(conf, [num], e.text); status = r.sent ? 'Sent' : 'Failed'; } catch (x) { status = 'Failed'; } }
    else if (live && !num) status = 'No valid number';
    store.begin();
    try { const id = uid('m'); store.put('messages', id, { id, date: today(), channel: 'SMS', audience: `${e.name || 'Contact'} (${e.phone})`, n: 1, body: e.text, status, by: e.by || ROLE_LABEL[user.role] || '', byId: user.id }); store.commit(); }
    catch (x) { store.rollback(); }
  }
}

/* ---------- balances (used for audiences) ---------- */
function balanceFn() {
  const fees = store.fees().structure, lv = new Map(store.list('classes').map(c => [c.id, c.data.level]));
  const paid = new Map(store.db.prepare("SELECT student_id, SUM(amount) a FROM payments WHERE status = 'Approved' GROUP BY student_id").all().map(r => [r.student_id, r.a]));
  return s => (fees[(lv.get(s.classId) || 'O') + '-' + s.boarding] || 0) + (s.arrears || 0) - (s.bursary || 0) - (paid.get(s.id) || 0);
}

/* ---------- validation and authorisation of incoming changes ---------- */
const MARK_NOTE = 'A mark must be a whole number from 0 to 100.';
function sanitizeSingleton(coll, d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { e: 'Invalid settings.' };
  const out = {};
  if (coll === 'school') {
    for (const [k, v] of Object.entries(d)) {
      if (k === 'badge' || !/^\w{1,30}$/.test(k)) continue;
      if (typeof v === 'string' && v.length <= 300) out[k] = v;
      else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
      else if (typeof v === 'boolean' || v === null) out[k] = v;
    }
    return { d: out };
  }
  if (coll === 'fees') {
    const st = {};
    for (const [k, v] of Object.entries((d && d.structure) || {})) if (/^[\w-]{1,30}$/.test(k) && typeof v === 'number' && v >= 0 && v < 1e10) st[k] = Math.round(v);
    return { d: { structure: st } };
  }
  return { e: 'Not allowed.' };
}

/* Returns { d, changed, after } for a change that is allowed and valid, or { e, denied } otherwise.
   `after` runs once the record is saved (notifications, follow-up records). */
function prepare(user, coll, id, data, existing, getW, bypass) {
  const R = user.role, byName = user.name || ROLE_LABEL[R] || '';
  const isNew = existing == null, W = () => getW();
  const flat = (v, label) => v;
  /* ---- values stored as a single number or code ---- */
  if (coll === 'attendance') {
    if (!['P', 'L', 'A'].includes(data)) return { e: 'Attendance must be P, L or A.' };
    const [dt, sid] = id.split('|');
    if (!bypass) {
      const st = W().stu.get(sid); if (!st) return { e: 'Unknown learner.' };
      if (!W().ct.has(st.classId)) return DENY('Only the class teacher of this learner can take attendance, for the class the Director of Studies allocated to them.');
      if (!DATE_RE.test(dt) || dt > today()) return { e: 'Attendance cannot be taken for a future date.' };
    }
    return { d: data };
  }
  if (coll === 'marks') {
    if (typeof data !== 'number' || !Number.isInteger(data) || data < 0 || data > 100) return { e: MARK_NOTE };
    const [eid, sid, sub] = id.split('|');
    if (bypass) return { d: data };
    const ex = store.get('exams', eid); if (!ex) return { e: 'Unknown exam.' };
    const st = W().stu.get(sid); if (!st || st.status !== 'Active') return { e: 'Unknown learner.' };
    if (!W().taught.has(st.classId + '|' + sub)) return DENY(`Only the teacher the Director of Studies allocated to ${sub} for this class can enter these marks.`);
    if (!marksOpen(store.get('examcfg', eid))) return DENY('The marks portal is closed. Only the Examination Office can open it or extend the deadline.');
    return { d: data, after: () => { if (!store.exists('placements', eid + '|' + sid)) store.put('placements', eid + '|' + sid, { id: eid + '|' + sid, examId: eid, studentId: sid, classId: st.classId }); } };
  }
  if (coll === 'tt') {
    if (!Array.isArray(data) || data.length > 16 || !data.every(x => typeof x === 'string' && x.length < 60)) return { e: 'Invalid timetable row.' };
    const [cid, day] = id.split('|');
    if (!bypass) {
      if (!store.exists('classes', cid) || !(Number(day) >= 0 && Number(day) <= 6)) return { e: 'Unknown class or day.' };
      const names = new Set(store.list('subjects').filter(r => r.data.classId === cid).map(r => r.data.name));
      if (data.some(x => x && !names.has(x))) return { e: 'A lesson on the timetable is not one of this class\'s subjects.' };
    }
    return { d: data };
  }
  if (coll === 'comments') {
    if (!data || typeof data !== 'object' || typeof (data.ct || '') !== 'string' || typeof (data.ht || '') !== 'string' || (data.ct || '').length > 600 || (data.ht || '').length > 600) return { e: 'Invalid comment.' };
    const ex = existing || { ct: '', ht: '' }; let d;
    if (bypass) return { d: { ct: data.ct || '', ht: data.ht || '' } };
    const [eid, sid] = id.split('|'), exam = store.get('exams', eid);
    if (!exam) return { e: 'Unknown exam.' };
    if (exam.published) return DENY('Report cards have been released, so comments can no longer change.');
    if (R === 'head') d = { ct: ex.ct || '', ht: data.ht || '' };
    else if (R === 'teacher') { const st = W().stu.get(sid); if (!st || !W().ct.has(st.classId)) return DENY('Only the class teacher can write this comment.'); d = { ct: data.ct || '', ht: ex.ht || '' }; }
    else return DENY();
    return { d };
  }
  if (SINGLE.has(coll)) {
    if (coll === 'school' && R !== 'admin' && !bypass) return DENY('Only the administrator can change school details.');
    return sanitizeSingleton(coll, data);
  }
  if (['placements', 'inbox', 'prn', 'papers'].includes(coll)) { if (!bypass) return DENY(); return data && typeof data === 'object' ? { d: { ...data, id } } : { e: 'Invalid record.' }; }
  /* ---- JSON document collections ---- */
  if (DOC_SPEC[coll] || coll === 'subjects' || coll === 'ttcfg') return prepareDoc(user, coll, id, data, existing, getW, bypass);
  /* ---- table records ---- */
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { e: 'A record must be an object.' };
  if (JSON.stringify(data).length > 60000) return { e: 'That record is too large.' };
  let rec = validate(coll, { ...data, id }, false);
  if (rec.err) return { e: rec.err };
  rec = rec.rec;
  let changed = false, after = null;
  switch (coll) {
    case 'students': {
      if (bypass) { /* trusted import */ }
      else if (R === 'registrar') { rec.dorm = isNew ? '' : existing.dorm; rec.bursary = isNew ? 0 : existing.bursary; rec.arrears = isNew ? 0 : existing.arrears; if (rec.boarding === 'Day') rec.dorm = ''; }
      else if (R === 'warden' && !isNew) {
        if (existing.boarding !== 'Boarding') return DENY('Only boarding learners can be assigned to a dormitory.');
        if (rec.dorm) { const dm = store.get('dorms', rec.dorm); if (!dm) return { e: 'Unknown dormitory.' }; if (dm.sex !== existing.sex) return { e: 'That dormitory is for the other sex.' }; }
        rec = { ...existing, dorm: rec.dorm };
      } else if (R === 'bursar' && !isNew) rec = { ...existing, bursary: rec.bursary, arrears: rec.arrears };
      else return DENY('Only the Registrar can add a learner or change learner details.');
      if (!bypass && existing && !MEDICAL.has(R)) rec.medical = existing.medical;
      if (!existing && !rec.last) rec.last = '';
      if (!rec.adm || store.admTaken(rec.adm, id)) { rec.adm = existing && existing.adm && !store.admTaken(existing.adm, id) && !rec.adm ? existing.adm : newAdm(); changed = true; }
      if (isNew && !rec.admittedOn) { rec.admittedOn = today(); changed = true; }
      if (!bypass && existing && R === 'warden' && rec.dorm !== existing.dorm) {
        const dm = rec.dorm ? store.get('dorms', rec.dorm) : null;
        after = () => notifyKid(id, 'boarding', dm ? 'Dormitory assigned' : 'Dormitory removed', dm ? `You have been assigned to ${dm.name}. Please report to the warden or matron for your bed.` : 'You have been removed from your dormitory. Please see the warden or matron.', false);
      }
      break;
    }
    case 'staff': {
      if (!bypass && R === 'hrm') { /* may change everything */ }
      else if (!bypass && ['head', 'dos'].includes(R)) {
        if (isNew) return DENY('Only the Human Resource Manager can add a staff member.');
        rec = { ...existing, duties: rec.duties };
      } else if (!bypass) return DENY();
      if (existing && !bypass && !CONTACTS.has(R)) { rec.phone = existing.phone; rec.email = existing.email; }
      if (rec.duties.length > 12) return { e: 'Too many duties.' };
      break;
    }
    case 'classes': {
      if (!bypass && !['head', 'dos', 'registrar'].includes(R)) return DENY();
      if (!bypass && R === 'registrar') rec.teacherId = isNew ? null : existing.teacherId;
      if (isNew) after = () => { const list = rec.level === 'O' ? DEFAULT_SUBJECTS.O : (rec.stream === 'Sciences' ? DEFAULT_SUBJECTS.SCI : DEFAULT_SUBJECTS.ARTS); for (const name of list) { const sid = `${id}|${name}`; store.put('subjects', sid, { id: sid, classId: id, name, teacherId: '', periods: 4 }); } };
      if (!isNew && existing.teacherId !== rec.teacherId && rec.teacherId && !bypass) after = () => notify('t:' + rec.teacherId, 'duty', 'Class teacher', `You have been made the class teacher of ${rec.name}.`);
      break;
    }
    case 'dorms': if (!bypass && R !== 'warden') return DENY('Only the Warden or Matron can change dormitories.'); break;
    case 'applicants': {
      if (!bypass && R !== 'registrar') return DENY('Only the Registrar can handle admissions.');
      const from = existing ? existing.stage : null, to = rec.stage;
      if (!bypass && to !== from) {
        const okMoves = { null: ['Applied'], Applied: ['Interview', 'Admitted', 'Declined'], Interview: ['Admitted', 'Declined', 'Applied'], Admitted: ['Enrolled', 'Declined'], Declined: ['Applied'], Enrolled: [] };
        if (!(okMoves[from] || []).includes(to)) return { e: `An application cannot move from ${from} to ${to}.` };
        if (to === 'Interview' && !rec.interviewAt) return { e: 'Choose the interview date.' };
        const sch = schoolName(), name = rec.name, g = rec.guardian || 'Parent/Guardian';
        if (to === 'Interview') after = () => queueSms(rec.phone, rec.guardian, `Dear ${g}, ${name} is invited for an admission interview at ${sch} on ${fdate(rec.interviewAt)}${rec.interviewVenue ? ' (' + rec.interviewVenue + ')' : ''}. Please come with the applicant's school reports.`, byName);
        if (to === 'Admitted') after = () => queueSms(rec.phone, rec.guardian, from === 'Interview'
          ? `Congratulations! ${name} passed the interview and has been admitted to ${sch}${rec.applyingFor ? ' for ' + rec.applyingFor : ''}. The school will contact ${g} about the next steps.`
          : `Dear ${g}, we are pleased to confirm that ${name} has been admitted to ${sch}${rec.applyingFor ? ' for ' + rec.applyingFor : ''}. The school will contact you about the next steps.`, byName);
      }
      break;
    }
    case 'exams': {
      if (!bypass && R !== 'examoffice') return DENY('Only the Examination Office can manage exam sessions.');
      if (isNew && !bypass) after = () => { if (!store.exists('examcfg', id)) store.put('examcfg', id, { id, examId: id, paperDeadline: '', marksOpen: false, marksDeadline: '' }); };
      if (!isNew && !existing.published && rec.published && !bypass) after = () => { for (const s of store.list('students')) if (s.data.status === 'Active') { notify('s:' + s.id, 'results', 'Report card released', `The ${rec.name} report card (Term ${rec.term}, ${rec.year}) is now available in your portal.`); notify('p:' + s.id, 'results', 'Report card released', `The ${rec.name} report card (Term ${rec.term}, ${rec.year}) for ${s.data.first} is now available in the My child portal.`); } };
      break;
    }
    case 'payments': {
      if (!bypass && R !== 'bursar') return DENY('Only the Bursar can record or approve payments.');
      if (!store.exists('students', rec.studentId)) return { e: 'Choose a learner.' };
      if (isNew) {
        if (!bypass) { rec.source = 'Bursar'; rec.by = byName; }
        if (rec.status === 'Pending') rec.rct = 'PEND-' + id;
        else { rec.status = rec.status === 'Rejected' ? 'Rejected' : 'Approved'; if (rec.status === 'Approved') { rec.rct = !rec.rct || store.rctTaken(rec.rct, id) || rec.rct.startsWith('PEND-') ? newRct() : rec.rct; rec.approvedBy = byName; rec.approvedOn = today(); } else rec.rct = 'PEND-' + id; }
        changed = true;
      } else {
        rec.rct = existing.rct; rec.source = existing.source; rec.by = existing.by || rec.by;
        if (existing.status !== 'Approved' && rec.status === 'Approved') { rec.rct = newRct(); rec.approvedBy = byName; rec.approvedOn = today(); changed = true; }
        else { rec.approvedBy = existing.approvedBy; rec.approvedOn = existing.approvedOn; if (existing.status === 'Approved' && rec.status !== 'Approved') return { e: 'An approved payment cannot be reversed. Record a correction instead.' }; }
      }
      const was = existing ? existing.status : null;
      if (rec.status === 'Approved' && was !== 'Approved') after = () => {
        notifyKid(rec.studentId, 'fees', 'Payment approved', `Your payment of UGX ${rec.amount.toLocaleString('en-GB')} (${rec.method}) was approved. Receipt ${store.get('payments', id).rct} is ready to print in the Fees page.`, true);
        if (rec.prn) for (const p of store.docsRef('prn', [rec.studentId])) if (p.data.prn === rec.prn) store.put('prn', p.id, { ...p.data, status: 'Paid' });
      };
      if (rec.status === 'Rejected' && was !== 'Rejected') after = () => notifyKid(rec.studentId, 'fees', 'Payment not approved', `The payment of UGX ${rec.amount.toLocaleString('en-GB')} you submitted (reference ${rec.ref || '-'}) could not be confirmed. Please contact the bursar.`, true);
      break;
    }
    case 'expenses': if (!bypass && R !== 'bursar') return DENY(); if (!rec.by) rec.by = byName; break;
    case 'books': if (!bypass && R !== 'librarian') return DENY('Only the Librarian can change the library.'); break;
    case 'loans': {
      if (!bypass && R !== 'librarian') return DENY('Only the Librarian can change the library.');
      const book = store.get('books', rec.bookId);
      if (!book || !store.exists('students', rec.studentId)) return { e: 'Choose a book and a learner.' };
      if (isNew && !bypass) {
        const out = store.db.prepare('SELECT COUNT(*) n FROM loans WHERE book_id = ? AND returned IS NULL').get(rec.bookId).n;
        if (out >= book.copies) return { e: 'No copy of that book is available.' };
        after = () => notifyKid(rec.studentId, 'library', 'You borrowed a book', `${book.title} by ${book.author || 'unknown author'} (${book.cat}). Borrowed ${fdate(rec.out)}, due back ${fdate(rec.due)}. Issued by ${byName}.`, false);
      } else if (!bypass && existing && !existing.returned && rec.returned) after = () => notifyKid(rec.studentId, 'library', 'Book returned', `Thank you. ${book.title} was returned on ${fdate(rec.returned)}.`, false);
      break;
    }
    case 'discipline': {
      if (!bypass && !ANY_STAFF.has(R)) return DENY();
      if (isNew) { rec.by = byName + (R ? ' (' + ROLE_LABEL[R] + ')' : ''); rec.byId = user.id; }
      else {
        if (!bypass && existing.byId !== user.id && !['head', 'dos', 'registrar', 'warden'].includes(R)) return DENY('Only the person who recorded a case, or a senior officer, can update it.');
        rec.by = existing.by; rec.byId = existing.byId;
      }
      if (!store.exists('students', rec.studentId)) return { e: 'Choose a learner.' };
      if (!bypass && R === 'warden') { const st = W().stu.get(rec.studentId); if (!st || st.boarding !== 'Boarding') return DENY('The warden can only handle boarding learners.'); }
      if (!bypass) after = () => { if (isNew) notifyKid(rec.studentId, 'welfare', 'Discipline case recorded', `${rec.type}${rec.desc ? ': ' + rec.desc : ''}. Action taken: ${rec.action || 'none yet'}. Recorded by ${rec.by} on ${fdate(rec.date)}.`, true); else if (existing.status !== rec.status || existing.action !== rec.action) notifyKid(rec.studentId, 'welfare', 'Discipline case updated', `${rec.type}: status ${rec.status}. Action taken: ${rec.action || 'none'}.`, true); };
      changed = true;
      break;
    }
    case 'sickbay': {
      if (!bypass && R !== 'sickbay') return DENY('Only the sick bay attendants can record sick bay cases.');
      if (!store.exists('students', rec.studentId)) return { e: 'Choose a learner.' };
      rec.by = isNew ? byName : existing.by;
      if (!bypass) after = () => notifyKid(rec.studentId, 'health', isNew ? 'Sick bay visit' : 'Sick bay visit updated', `Complaint: ${rec.complaint}. Treatment: ${rec.treatment}. Outcome: ${rec.outcome}. Attended to by ${rec.by} on ${fdate(rec.date)}.`, true);
      changed = true;
      break;
    }
    case 'events': if (!bypass && !['head', 'registrar', 'dos'].includes(R)) return DENY('Only the Head Teacher, the Registrar and the Director of Studies can add calendar events.'); break;
    case 'notices': if (!bypass && !['head', 'dos', 'bursar', 'registrar'].includes(R)) return DENY(); if (isNew && !rec.by) rec.by = byName; break;
    case 'messages': if (!bypass) return DENY('Messages are sent from the Communication page.'); break;
    default: break;
  }
  return { d: rec, changed, after };
}

function prepareDoc(user, coll, id, data, existing, getW, bypass) {
  const R = user.role, isNew = existing == null;
  if (coll === 'subjects') {
    if (!bypass && !['head', 'dos', 'registrar'].includes(R)) return DENY('Only the Head Teacher, the Registrar and the Director of Studies can add or remove subjects.');
    const c = cleanDoc({ classId: ['r', 90], name: ['r', 60], teacherId: ['s', 90], periods: ['i', 0, 40] }, data); if (c.e) return c;
    const d = { id, ...c.d };
    if (id !== d.classId + '|' + d.name) return { e: 'Invalid subject.' };
    if (!store.exists('classes', d.classId)) return { e: 'Unknown class.' };
    if (!bypass && R !== 'dos') { d.teacherId = isNew ? '' : existing.teacherId; d.periods = isNew ? 4 : existing.periods; }
    if (d.teacherId && !store.exists('staff', d.teacherId)) return { e: 'Unknown teacher.' };
    const after = !bypass && d.teacherId && (!existing || existing.teacherId !== d.teacherId) ? () => { const c2 = store.get('classes', d.classId); notify('t:' + d.teacherId, 'timetable', 'Subject allocated', `You have been allocated ${d.name} for ${c2 ? c2.name : 'a class'}${d.periods ? ', ' + d.periods + ' lessons a week' : ''}.`); } : null;
    return { d, after };
  }
  if (coll === 'ttcfg') {
    if (!bypass && R !== 'dos') return DENY('Only the Director of Studies designs the timetable.');
    if (id !== 'main') return { e: 'Invalid id.' };
    const days = Array.isArray(data && data.days) ? [...new Set(data.days.map(Number))].filter(n => n >= 0 && n <= 6).sort() : [];
    const slots = Array.isArray(data && data.slots) ? data.slots : [];
    if (!days.length) return { e: 'Keep at least one school day.' };
    if (slots.length < 1 || slots.length > 24) return { e: 'Use between 1 and 24 time slots.' };
    const outSlots = [];
    for (const s of slots) {
      if (!s || !HHMM.test(s.from) || !HHMM.test(s.to) || s.from >= s.to) return { e: 'Each time slot needs a start time before its end time.' };
      outSlots.push({ type: s.type === 'break' ? 'break' : 'lesson', from: s.from, to: s.to, ...(s.type === 'break' ? { label: String(s.label || 'BREAK').slice(0, 30) } : {}) });
    }
    if (outSlots.filter(s => s.type === 'lesson').length > 16) return { e: 'At most 16 lessons a day.' };
    if (!outSlots.some(s => s.type === 'lesson')) return { e: 'Keep at least one lesson slot.' };
    return { d: { id: 'main', days, slots: outSlots } };
  }
  const spec = DOC_SPEC[coll];
  const roleOk = { hr: 'hrm', staffatt: 'hrm', misconduct: 'hrm', leaves: 'hrm', rollcall: 'warden', examtt: 'dos', examcfg: 'examoffice' }[coll];
  if (!bypass && R !== roleOk) return DENY({ hr: 'Only the Human Resource Manager can change staff records.', rollcall: 'Only the Warden or Matron can take roll calls.', examtt: 'Only the Director of Studies designs the exams timetable.', examcfg: 'Only the Examination Office controls exam deadlines.' }[coll]);
  const c = cleanDoc(spec, data); if (c.e) return c;
  const d = { id, ...c.d };
  if (['hr', 'staffatt', 'misconduct', 'leaves'].includes(coll)) {
    const sid = coll === 'hr' ? id : d.staffId; if (!store.exists('staff', sid)) return { e: 'Unknown staff member.' };
  }
  if (coll === 'staffatt') { if (id !== `${d.date}|${d.staffId}`) return { e: 'Invalid id.' }; if (d.date > today() && !bypass) return { e: 'Attendance cannot be recorded for a future date.' }; }
  if (coll === 'rollcall') {
    if (id !== `${d.date}|${d.session}|${d.studentId}`) return { e: 'Invalid id.' };
    const st = getW().stu.get(d.studentId); if (!st || st.boarding !== 'Boarding') return { e: 'Roll calls are for boarding learners only.' };
    if (d.date > today() && !bypass) return { e: 'A roll call cannot be taken for a future date.' };
  }
  if (coll === 'examtt') {
    if (!store.exists('exams', d.examId) || !store.exists('classes', d.classId)) return { e: 'Unknown exam or class.' };
    if (d.start && !HHMM.test(d.start) || d.end && !HHMM.test(d.end)) return { e: 'Use times such as 08:30.' };
  }
  let after = null;
  if (coll === 'examcfg') {
    if (id !== d.examId || !store.exists('exams', id)) return { e: 'Unknown exam.' };
    const prev = existing || { paperDeadline: '', marksOpen: false, marksDeadline: '' };
    if (d.marksOpen && (!prev.marksOpen || d.marksDeadline !== prev.marksDeadline) && !bypass) {
      if (!d.marksDeadline || Date.parse(d.marksDeadline) <= Date.now()) return { e: 'Set a marks deadline in the future before opening the marks portal.' };
    }
    if (!bypass) after = () => {
      const ex = store.get('exams', id) || { name: 'exam' };
      if (d.paperDeadline && d.paperDeadline !== prev.paperDeadline) notify('r:teacher', 'exams', 'Question papers', `Upload your question papers for ${ex.name} before ${fdt(d.paperDeadline)}.`);
      if (d.marksOpen && (!prev.marksOpen || d.marksDeadline !== prev.marksDeadline)) notify('r:teacher', 'exams', 'Marks portal open', `You can now enter marks for ${ex.name} until ${fdt(d.marksDeadline)}.`);
    };
  }
  return { d, after };
}

/* ---------- applying changes ---------- */
const ORDER = ['school', 'fees', 'staff', 'hr', 'classes', 'subjects', 'ttcfg', 'dorms', 'students', 'applicants', 'exams', 'examcfg', 'marks', 'comments', 'attendance', 'tt', 'examtt', 'placements', 'payments', 'prn', 'expenses', 'books', 'loans', 'discipline', 'sickbay', 'rollcall', 'staffatt', 'misconduct', 'leaves', 'events', 'notices', 'messages', 'inbox', 'papers'];
const orderOf = c => { const i = ORDER.indexOf(c); return i < 0 ? 99 : i; };
const FRIENDLY = { 'FOREIGN KEY constraint failed': 'That record refers to something that does not exist, or is still in use (for example a class with learners, or a learner who has payments).', 'UNIQUE constraint failed': 'That value is already used by another record.' };
const friendly = e => { const m = String(e.message || e); for (const k of Object.keys(FRIENDLY)) if (m.includes(k)) return FRIENDLY[k]; return 'That change could not be saved.'; };

function applyOp(user, coll, id, data, bypass, getW) {
  if (!COLLS.includes(coll) || coll === 'sms') return { e: 'Unknown collection.' };
  if (!bypass && !policy.canWrite(user.role, coll)) return DENY('Your role is not allowed to change this.');
  if (typeof id !== 'string' || !ID_RE.test(id)) return { e: 'Invalid id.' };
  if (SINGLE.has(coll) && id !== 'main') return { e: 'Invalid id.' };
  if (!getW) { let w = null; getW = () => w || (w = makeWorld(user)); }
  store.savepoint('op');
  try {
    const existing = store.get(coll, id);
    if (data === null) {
      if (SINGLE.has(coll)) { store.release('op'); return { e: 'This record cannot be deleted.' }; }
      if (!bypass) {
        const R = user.role;
        let bad = null;
        if (coll === 'students' && R !== 'registrar') bad = 'Only the Registrar can remove a learner.';
        else if (coll === 'staff' && R !== 'hrm') bad = 'Only the Human Resource Manager can remove a staff member.';
        else if (coll === 'payments' && R !== 'bursar') bad = 'Only the Bursar can change payments.';
        else if (coll === 'discipline' && existing && existing.byId !== user.id && R !== 'head') bad = 'Only the person who recorded a case, or the Head Teacher, can remove it.';
        else if (coll === 'marks') { const [eid, sid, sub] = id.split('|'), st = getW().stu.get(sid); if (!st || !getW().taught.has(st.classId + '|' + sub) || !marksOpen(store.get('examcfg', eid))) bad = 'You cannot change this mark now.'; }
        else if (coll === 'comments') bad = 'Comments cannot be removed.';
        else if (coll === 'attendance') { const st = getW().stu.get(id.split('|')[1]); if (!st || !getW().ct.has(st.classId)) bad = 'Only the class teacher can change attendance.'; }
        else if (coll === 'classes' && !['head', 'dos', 'registrar'].includes(R)) bad = 'Not allowed.';
        else if (['tt', 'ttcfg', 'examtt'].includes(coll) && R !== 'dos') bad = 'Only the Director of Studies designs timetables.';
        if (bad) { store.release('op'); return DENY(bad); }
        if (['hr', 'staffatt', 'misconduct', 'leaves'].includes(coll) && R !== 'hrm') { store.release('op'); return DENY(); }
        if (['subjects'].includes(coll) && !['head', 'dos', 'registrar'].includes(R)) { store.release('op'); return DENY('Only the Head Teacher, the Registrar and the Director of Studies can remove subjects.'); }
      }
      store.remove(coll, id);
      if (KIND[coll]) store.fileDel(`${KIND[coll]}:${id}`);
      if (coll === 'classes') for (const r of store.list('subjects')) if (r.data.classId === id) store.remove('subjects', r.id);
      if (coll === 'staff') { for (const r of store.list('subjects')) if (r.data.teacherId === id) store.put('subjects', r.id, { ...r.data, teacherId: '' }); for (const t of ['hr']) if (store.exists(t, id)) store.remove(t, id); }
      if (coll === 'exams') { for (const t of ['examcfg']) if (store.exists(t, id)) store.remove(t, id); for (const r of store.list('papers')) if (r.data.examId === id) { store.fileDel('paper:' + r.id); store.remove('papers', r.id); } for (const r of store.list('examtt')) if (r.data.examId === id) store.remove('examtt', r.id); for (const r of store.list('placements')) if (r.data.examId === id) store.remove('placements', r.id); }
      if (existing && ['students', 'staff', 'payments'].includes(coll)) store.audit(user.username, `Deleted ${coll.replace(/s$/, '')} ${existing.adm || existing.name || existing.rct || id}`);
      store.release('op');
      return { ok: true };
    }
    let photoBuf = null;
    if (KIND[coll] && data && typeof data === 'object' && typeof data.photo === 'string' && data.photo.startsWith('data:image/')) photoBuf = dataUrlBuf(data.photo, 400 * 1024);
    let badgeBuf = null;
    if (coll === 'school' && data && typeof data.badge === 'string' && data.badge.startsWith('data:image/')) badgeBuf = dataUrlBuf(data.badge, 600 * 1024);
    const p = prepare(user, coll, id, data, existing, getW, bypass);
    if (p.e) { store.release('op'); return p; }
    store.put(coll, id, p.d);
    if (photoBuf) savePhoto(coll, id, photoBuf);
    if (badgeBuf) { store.filePut('badge', IMG_MAGIC(badgeBuf), badgeBuf); store.put('school', 'main', { updated: Date.now() }); }
    if (p.after && !bypass) p.after();
    store.release('op');
    return { ok: true, fix: (p.changed || photoBuf || badgeBuf) ? store.get(coll, id) : null };
  } catch (e) {
    store.rollbackTo('op');
    if (!/constraint/i.test(String(e.message))) console.error(e);
    return { e: friendly(e) };
  }
}

function applyBatch(user, ops, bypass) {
  const results = [], rows = [];
  let w = null; const getW = () => w || (w = makeWorld(user));
  const idx = ops.map((op, i) => [op, i]);
  const del = idx.filter(([op]) => Array.isArray(op) && op.length > 2 && op[2] === null).sort((a, b) => orderOf(b[0][0]) - orderOf(a[0][0]));
  const up = idx.filter(([op]) => !(Array.isArray(op) && op.length > 2 && op[2] === null)).sort((a, b) => orderOf(Array.isArray(a[0]) ? a[0][0] : '') - orderOf(Array.isArray(b[0]) ? b[0][0] : ''));
  const fx = effects.length;
  store.begin();
  try {
    for (const [op, i] of [...del, ...up]) {
      if (!Array.isArray(op) || op.length < 3 || typeof op[0] !== 'string') { results.push([i, 'Invalid change.']); continue; }
      const r = applyOp(user, op[0], op[1], op[2], bypass, getW);
      if (r.e) results.push([i, r.e, r.denied ? 1 : 0]);
      else if (r.fix) rows.push([op[0], op[1], redact(user.role, op[0], r.fix)]);
    }
    store.commit();
  } catch (e) { store.rollback(); effects.length = fx; throw e; }
  return { results, rows };
}

/* ---------- views ---------- */
function kidIdsFor(user) {
  if (user.role === 'student') return (user.owners || []);
  return store.db.prepare("SELECT id, g_phone FROM students WHERE status != 'Withdrawn' AND g_phone != ''").all().filter(r => digits(r.g_phone) === user.username).map(r => r.id);
}
function familyView(user) {
  const kids = new Set(kidIdsFor(user)), mine = id => kids.has(id);
  const students = store.list('students').filter(s => mine(s.id));
  const classIds = [...new Set(students.map(s => s.data.classId))];
  const places = store.docsRef('placements', [...kids]);
  const allClassIds = new Set([...classIds, ...places.map(p => p.data.classId)]);
  const published = new Set(store.list('exams').filter(e => e.data.published).map(e => e.id));
  const out = {}, tup = r => [r.id, r.data];
  out.school = store.list('school').map(tup);
  out.fees = store.list('fees').map(tup);
  out.classes = store.list('classes').map(tup);
  out.exams = store.list('exams').map(tup);
  out.ttcfg = store.list('ttcfg').map(tup);
  out.subjects = store.list('subjects').filter(r => allClassIds.has(r.data.classId)).map(tup);
  out.students = students.map(s => [s.id, { ...s.data, _mine: true }]);
  out.staff = store.list('staff').map(r => [r.id, { id: r.id, name: r.data.name, role: r.data.role, type: r.data.type, subjects: r.data.subjects || [], duties: r.data.duties || [], status: r.data.status }]);
  const dormIds = new Set(students.map(s => s.data.dorm).filter(Boolean));
  out.dorms = store.list('dorms').filter(d => dormIds.has(d.id)).map(tup);
  out.marks = store.listBy('marks', [...kids]).filter(r => published.has(r.id.split('|')[0])).map(tup);
  out.comments = store.listBy('comments', [...kids]).filter(r => published.has(r.id.split('|')[0])).map(tup);
  out.placements = places.filter(p => published.has(p.data.examId)).map(tup);
  const from = new Date(Date.now() - 200 * 86400000).toISOString().slice(0, 10);
  out.attendance = store.attendanceFrom(from).filter(r => mine(r.ref)).map(tup);
  out.tt = store.list('tt').filter(r => classIds.includes(r.ref)).map(tup);
  out.examtt = store.list('examtt').filter(r => classIds.includes(r.data.classId)).map(tup);
  out.payments = store.listBy('payments', [...kids]).map(tup);
  out.prn = store.docsRef('prn', [...kids]).map(tup);
  const loans = store.listBy('loans', [...kids]), bookIds = new Set(loans.map(l => l.data.bookId));
  out.loans = loans.map(tup);
  out.books = store.list('books').filter(b => bookIds.has(b.id)).map(tup);
  out.discipline = store.listBy('discipline', [...kids]).map(tup);
  out.sickbay = store.listBy('sickbay', [...kids]).map(tup);
  out.events = store.list('events').map(tup);
  out.notices = store.list('notices').map(tup);
  const pref = user.role === 'student' ? 's:' : 'p:';
  out.inbox = store.docsRef('inbox', [...kids].map(k => pref + k)).sort((a, b) => String(b.data.at).localeCompare(String(a.data.at))).slice(0, 400).map(tup);
  const all = store.ranks([...published], [...allClassIds]), ranks = {};
  for (const [e, m] of Object.entries(all)) for (const [sid, r] of Object.entries(m)) if (kids.has(sid)) (ranks[e] = ranks[e] || {})[sid] = r;
  return { data: out, ranks };
}
const metaFor = user => ({ sample: store.meta('sample') === '1', epoch: Number(store.meta('epoch') || 0), version: VERSION, now: Date.now(), userCount: user.role === 'admin' ? U.count.get().n : undefined });
function bootstrap(user) {
  const seq = store.seq();
  if (FAMILY.includes(user.role)) { const f = familyView(user); return { me: me(user), seq, meta: metaFor(user), data: f.data, ranks: f.ranks }; }
  const data = {};
  let w = null; const getW = () => w || (w = makeWorld(user));
  for (const c of policy.readable(user.role)) {
    if (c === 'attendance') { const from = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10); data[c] = store.attendanceFrom(from).map(r => ({ id: r.id, ref: r.ref, data: r.data })).filter(r => rowVisible(user, c, r, getW)).map(r => [r.id, r.data]); continue; }
    data[c] = store.list(c).filter(r => rowVisible(user, c, r, getW)).map(r => [r.id, redact(user.role, c, r.data)]);
  }
  if (data.inbox) data.inbox = data.inbox.sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).slice(0, 400);
  return { me: me(user), seq, meta: metaFor(user), data };
}

/* ---------- account helpers ---------- */
async function createUser({ name, username, role, owners, staffId, pw }) {
  const password = pw || auth.tempPw(), h = await auth.hashPw(password);
  U.insert.run(uid('u'), username, name, role, JSON.stringify(owners || []), staffId || null, h.salt, h.hash, 1, today());
  return password;
}
const takenName = n => !!U.byName.get(n);

/* ---------- routes ---------- */
const routes = [];
const route = (method, pattern, opts, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opts, fn });

route('GET', '/api/health', { public: true }, async () => ({ ok: true, time: nowIso(), version: VERSION }));

route('GET', '/api/session', { public: true }, async (ctx) => {
  const n = U.count.get().n, school = store.school();
  return { state: n === 0 ? 'setup' : ctx.sess ? 'ok' : 'login', must: !!(ctx.sess && ctx.sess.must), me: ctx.user ? me(ctx.user) : null,
    school: { name: school.name || 'Your School', hasBadge: !!school.badge }, recovery: !!store.meta('recovery'), version: VERSION };
});

/* First-time structure: classes, their subjects, dormitories, the timetable layout and one exam session.
   Written by the server because the administrator, by design, cannot edit school records. */
function seedStructure(user) {
  const put = (coll, id, d) => applyOp(user, coll, id, d, true);
  store.begin();
  try {
    const classes = [];
    for (let l = 1; l <= 4; l++) for (const x of ['A', 'B']) classes.push({ id: `S${l}${x}`, name: `S.${l} ${x}`, level: 'O', form: l, stream: x, teacherId: null });
    classes.push({ id: 'S5ARTS', name: 'S.5 Arts', level: 'A', form: 5, stream: 'Arts', teacherId: null }, { id: 'S5SCI', name: 'S.5 Sciences', level: 'A', form: 5, stream: 'Sciences', teacherId: null },
      { id: 'S6ARTS', name: 'S.6 Arts', level: 'A', form: 6, stream: 'Arts', teacherId: null }, { id: 'S6SCI', name: 'S.6 Sciences', level: 'A', form: 6, stream: 'Sciences', teacherId: null });
    for (const c of classes) {
      if (!store.exists('classes', c.id)) put('classes', c.id, c);
      const list = c.level === 'O' ? DEFAULT_SUBJECTS.O : (c.stream === 'Sciences' ? DEFAULT_SUBJECTS.SCI : DEFAULT_SUBJECTS.ARTS);
      for (const name of list) { const sid = `${c.id}|${name}`; if (!store.exists('subjects', sid)) store.put('subjects', sid, { id: sid, classId: c.id, name, teacherId: '', periods: 4 }); }
    }
    [['d1', "Boys' Dormitory 1", 'M'], ['d2', "Boys' Dormitory 2", 'M'], ['d3', "Girls' Dormitory 1", 'F'], ['d4', "Girls' Dormitory 2", 'F']].forEach(([id, name, sex]) => { if (!store.exists('dorms', id)) put('dorms', id, { id, name, sex, cap: 40 }); });
    if (!store.get('ttcfg', 'main')) store.put('ttcfg', 'main', { id: 'main', days: [0, 1, 2, 3, 4], slots: DEFAULT_SLOTS });
    if (!store.exists('exams', 'ex1')) { put('exams', 'ex1', { id: 'ex1', name: 'Mid-Term', term: 3, year: 2026, status: 'Open', published: false }); store.put('examcfg', 'ex1', { id: 'ex1', examId: 'ex1', paperDeadline: '', marksOpen: false, marksDeadline: '' }); }
    const fees = store.fees().structure;
    if (!Object.keys(fees).length) store.put('fees', 'main', { structure: { 'O-Day': 450000, 'O-Boarding': 900000, 'A-Day': 550000, 'A-Boarding': 1050000 } });
    if (!store.setting('school.name')) store.put('school', 'main', { name: 'Pilkington College Muguluka', code: 'PCM', address: 'Muguluka, Jinja District, Uganda', motto: '', phone: '', email: '', po: '', head: 'Head Teacher', year: new Date().getFullYear(), term: 1, termStart: '', termEnd: '', nextTerm: '', payInfo: '' });
    store.commit();
  } catch (e) { store.rollback(); throw e; }
}
route('POST', '/api/setup', { public: true }, async (ctx) => {
  if (U.count.get().n > 0) fail(403, 'WalEduc is already set up.');
  const b = ctx.body, name = String(b.name || '').trim(), username = String(b.username || '').trim();
  if (!name || !username || username.length > 60 || name.length > 120) fail(400, 'Enter your name and a username.');
  const pe = auth.pwError(b.password, username); if (pe) fail(400, pe);
  const h = await auth.hashPw(b.password), id = uid('u');
  if (U.count.get().n > 0) fail(403, 'WalEduc is already set up.');
  U.insert.run(id, username, name, 'admin', '[]', null, h.salt, h.hash, 0, today());
  const code = auth.recoveryCode(), rh = await auth.hashPw(code);
  store.setMeta('recovery', JSON.stringify({ salt: rh.salt, hash: rh.hash, adminId: id }));
  store.audit(username, 'Administrator account created');
  seedStructure({ id, username, name, role: 'admin', owners: [] });
  const token = sessions.create(id, false, ctx.ip, ctx.ua);
  return { _cookie: cookieHeader(token, 12 * 3600), me: me({ id, username, name, role: 'admin', owners: [] }), code };
});

route('POST', '/api/login', { public: true }, async (ctx) => {
  const username = String(ctx.body.username || '').trim(), password = String(ctx.body.password || '');
  if (!username || !password || username.length > 80 || password.length > 200) fail(400, 'Enter your username and password.');
  const kIp = 'ip:' + ctx.ip, kU = 'u:' + username.toLowerCase();
  const wait = Math.max(limiter.check(kIp), limiter.check(kU));
  if (wait) fail(429, `Too many attempts. Try again in ${wait} seconds.`);
  let row = U.byName.get(username);
  if (!row && digits(username).length >= 7) { const r = U.byName.get(digits(username)); if (r && r.role === 'parent') row = r; }
  const ok = row ? await auth.verifyPw(password, row.salt, row.hash) : (await auth.verifyPw(password, '00'.repeat(16), '00'.repeat(64)), false);
  if (!ok) { limiter.fail(kIp, 30, 60000); limiter.fail(kU, 5, 30000); store.audit(username.slice(0, 60), 'Failed sign-in'); fail(401, 'Incorrect username or password.'); }
  if (!row.active) fail(403, 'This account is switched off. Contact the school administrator.');
  limiter.ok(kU);
  const prev = row.last_login;
  U.login.run(nowIso(), row.id);
  const token = sessions.create(row.id, !!row.must, ctx.ip, ctx.ua);
  store.audit(row.username, 'Signed in');
  return { _cookie: cookieHeader(token, 12 * 3600), me: me({ ...row, owners: safeJson(row.owners, []) }, prev), must: !!row.must };
});

route('POST', '/api/logout', { public: true }, async (ctx) => {
  if (ctx.token) sessions.destroy(ctx.token);
  return { _cookie: cookieHeader('', 0), ok: true };
});

route('POST', '/api/password', {}, async (ctx) => {
  const b = ctx.body, row = U.byId.get(ctx.user.id);
  const kU = 'pw:' + row.id, wait = limiter.check(kU); if (wait) fail(429, `Too many attempts. Try again in ${wait} seconds.`);
  if (!(await auth.verifyPw(String(b.current || ''), row.salt, row.hash))) { limiter.fail(kU, 5, 60000); fail(400, 'Your current password is not correct.'); }
  const pe = auth.pwError(b.password, row.username); if (pe) fail(400, pe);
  if (b.password === b.current) fail(400, 'Choose a password different from the current one.');
  const h = await auth.hashPw(b.password);
  U.setPw.run(h.salt, h.hash, 0, row.id);
  sessions.clearMust(ctx.sess.hash); sessions.destroyOthers(row.id, ctx.sess.hash);
  store.audit(row.username, 'Password changed');
  return { ok: true };
});

route('POST', '/api/recover', { public: true }, async (ctx) => {
  const kIp = 'rec:' + ctx.ip, wait = limiter.check(kIp);
  if (wait) fail(429, `Too many attempts. Try again in ${wait} seconds.`);
  const rec = store.meta('recovery'); if (!rec) fail(400, 'No recovery code has been set up.');
  const R = JSON.parse(rec), code = String(ctx.body.code || '').trim().toUpperCase();
  const pe = auth.pwError(ctx.body.password, ''); if (pe) fail(400, pe);
  if (!(await auth.verifyPw(code, R.salt, R.hash))) { limiter.fail(kIp, 5, 120000); store.audit('unknown', 'Failed recovery attempt'); fail(400, 'That recovery code is not correct.'); }
  const row = U.byId.get(R.adminId) || U.byId.get((U.firstAdmin.get() || {}).id);
  if (!row) fail(400, 'No administrator account was found.');
  const h = await auth.hashPw(ctx.body.password); U.setPw.run(h.salt, h.hash, 0, row.id); U.setActive.run(1, row.id);
  sessions.destroyUser(row.id);
  const nc = auth.recoveryCode(), nh = await auth.hashPw(nc);
  store.setMeta('recovery', JSON.stringify({ salt: nh.salt, hash: nh.hash, adminId: row.id }));
  limiter.ok(kIp); store.audit(row.username, 'Administrator password reset with recovery code');
  const token = sessions.create(row.id, false, ctx.ip, ctx.ua);
  return { _cookie: cookieHeader(token, 12 * 3600), me: me({ ...row, owners: safeJson(row.owners, []) }), code: nc };
});

route('GET', '/api/bootstrap', {}, async (ctx) => {
  const since = Number(ctx.url.searchParams.get('since'));
  if (FAMILY.includes(ctx.user.role) && since && since === store.seq()) return { unchanged: true, seq: store.seq() };
  return bootstrap(ctx.user);
});

route('GET', '/api/changes', { staff: true }, async (ctx) => {
  const since = Number(ctx.url.searchParams.get('since')) || 0, epoch = Number(ctx.url.searchParams.get('epoch')) || 0;
  if (epoch !== Number(store.meta('epoch') || 0) || since < store.tombFloor()) return { reload: true };
  const seq = store.seq();
  if (since === seq) return { seq, rows: [], meta: metaFor(ctx.user) };
  const rows = [], cut = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  let w = null; const getW = () => w || (w = makeWorld(ctx.user));
  for (const r of store.since(since)) {
    if (!policy.canRead(ctx.user.role, r.coll)) continue;
    if (r.coll === 'attendance' && !r.deleted && r.id.slice(0, 10) < cut) continue;
    if (!r.deleted && !rowVisible(ctx.user, r.coll, r, getW)) continue;
    rows.push([r.coll, r.id, r.deleted ? null : redact(ctx.user.role, r.coll, r.data)]);
  }
  return { seq, rows, meta: metaFor(ctx.user) };
});

route('POST', '/api/sync', { staff: true, limit: 12 * 1024 * 1024 }, async (ctx) => {
  const ops = Array.isArray(ctx.body.ops) ? ctx.body.ops : [];
  if (ops.length > 8000) fail(400, 'Too many changes in one request.');
  const out = applyBatch(ctx.user, ops, false);
  await runEffects(ctx.user);
  (Array.isArray(ctx.body.notes) ? ctx.body.notes : []).slice(0, 50).forEach(n => { if (typeof n === 'string' && n.trim()) store.audit(ctx.user.username, n.trim().slice(0, 300)); });
  return { ok: true, seq: store.seq(), results: out.results, rows: out.rows };
});

/* administrator-only data operations */
function clearAll(keepStructure) {
  for (const c of [...ORDER].reverse()) {
    if (['school', 'fees'].includes(c)) continue;
    if (keepStructure && ['classes', 'dorms', 'subjects', 'ttcfg'].includes(c)) continue;
    store.wipeColl(c);
  }
  if (keepStructure) for (const r of store.list('subjects')) if (r.data.teacherId) store.put('subjects', r.id, { ...r.data, teacherId: '' });
  store.fileDelPrefix('paper:');
  store.fileDelPrefix('student:'); store.fileDelPrefix('staff:');
  U.delFamily.run();
  store.db.prepare('DELETE FROM tombstones').run();
  store.db.prepare('UPDATE users SET staff_id = NULL').run();
}
route('POST', '/api/import', { admin: true, limit: 40 * 1024 * 1024 }, async (ctx) => {
  const ops = Array.isArray(ctx.body.ops) ? ctx.body.ops : [];
  if (ops.length > 80000) fail(400, 'That import is too large.');
  store.begin();
  let skipped = 0;
  try {
    clearAll(false);
    const up = ops.map((op, i) => [op, i]).filter(([op]) => Array.isArray(op) && op.length > 2 && op[2] !== null && typeof op[0] === 'string').sort((a, b) => orderOf(a[0][0]) - orderOf(b[0][0]));
    let w = null; const getW = () => w || (w = makeWorld(ctx.user));
    for (const [op] of up) { if (applyOp(ctx.user, op[0], op[1], op[2], true, getW).e) skipped++; }
    store.setMeta('sample', ctx.body.sample ? '1' : '0');
    store.setMeta('epoch', Number(store.meta('epoch') || 0) + 1);
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, ctx.body.sample ? 'Sample data loaded' : 'Records imported');
  return { ok: true, skipped, seq: store.seq() };
});

route('POST', '/api/wipe', { admin: true }, async (ctx) => {
  if (ctx.body.confirm !== 'WIPE') fail(400, 'Confirmation missing.');
  store.begin();
  try {
    clearAll(true);
    store.setMeta('sample', '0');
    store.setMeta('epoch', Number(store.meta('epoch') || 0) + 1);
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, 'All records cleared');
  return { ok: true };
});

/* learner import from a spreadsheet (CSV already parsed in the browser) */
route('POST', '/api/import/learners', { limit: 4 * 1024 * 1024 }, async (ctx) => {
  if (ctx.user.role !== 'registrar') fail(403, 'Only the Registrar can add learners.');
  const rows = Array.isArray(ctx.body.rows) ? ctx.body.rows.slice(0, 3000) : [];
  const classes = store.list('classes').map(c => c.data), added = [], errors = [];
  store.begin();
  try {
    rows.forEach((r, i) => {
      const cname = String(r.class || '').trim().toLowerCase();
      const c = classes.find(x => x.id.toLowerCase() === cname || x.name.toLowerCase() === cname);
      const sex = /^f/i.test(r.sex) ? 'F' : /^m/i.test(r.sex) ? 'M' : '';
      if (!c) { errors.push(`Row ${i + 2}: class "${r.class || ''}" was not found.`); return; }
      const rec = { id: uid('s'), first: r.first, last: r.last, sex, dob: /^\d{4}-\d{2}-\d{2}$/.test(r.dob || '') ? r.dob : '', classId: c.id, boarding: /^b/i.test(r.boarding) ? 'Boarding' : 'Day', status: 'Active',
        guardian: { name: r.guardianName || '', phone: r.guardianPhone || '', rel: r.guardianRel || '' }, address: r.address || '', prevSchool: r.prevSchool || '', appliedOn: today(), admittedOn: today(), adm: '' };
      const res = applyOp(ctx.user, 'students', rec.id, rec, false);
      if (res.e) errors.push(`Row ${i + 2}: ${res.e}`); else added.push(rec.id);
    });
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, `Imported ${added.length} learners from a spreadsheet`);
  return { added: added.length, errors: errors.slice(0, 30), seq: store.seq() };
});

/* backups */
const backupDir = () => { const d = path.join(cfg.dataDir, 'backups'); fs.mkdirSync(d, { recursive: true }); return d; };
route('GET', '/api/backup', { admin: true }, async (ctx) => {
  const tmpDir = path.join(cfg.dataDir, 'tmp'); fs.mkdirSync(tmpDir, { recursive: true });
  const dest = path.join(tmpDir, `backup-${Date.now()}.db`);
  store.backupTo(dest);
  store.audit(ctx.user.username, 'Database backup downloaded');
  return { _file: dest, _name: `WalEduc-backup-${today()}.db`, _delete: true };
});
route('GET', '/api/backups', { admin: true }, async () => ({
  files: fs.readdirSync(backupDir()).filter(f => f.endsWith('.db')).sort().reverse().map(f => { const s = fs.statSync(path.join(backupDir(), f)); return { name: f, size: s.size, time: s.mtime.toISOString() }; }),
  dir: backupDir(), stats: store.stats(), dbSize: fs.statSync(store.file).size
}));
route('POST', '/api/backups', { admin: true }, async (ctx) => { runBackup(true); store.audit(ctx.user.username, 'Backup created on the server'); return { ok: true }; });
route('GET', '/api/backups/:name', { admin: true }, async (ctx) => {
  const name = path.basename(ctx.params.name);
  if (!/^walEduc-\d+\.db$/.test(name)) fail(404, 'Not found.');
  const f = path.join(backupDir(), name); if (!fs.existsSync(f)) fail(404, 'Not found.');
  return { _file: f, _name: name };
});

/* SMS (Africa's Talking). Optional; messages are always recorded either way. */
route('POST', '/api/sms/config', { admin: true }, async (ctx) => {
  const b = ctx.body, provider = b.provider === 'africastalking' ? 'africastalking' : 'none';
  const data = { provider, username: String(b.username || '').slice(0, 60), sender: String(b.sender || '').slice(0, 20), sandbox: !!b.sandbox };
  if (typeof b.apiKey === 'string' && b.apiKey.trim()) data.apiKey = b.apiKey.trim().slice(0, 200);
  store.begin(); try { store.put('sms', 'main', data); store.commit(); } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, 'SMS settings updated');
  return { sms: store.smsPublic() };
});
function atSend(conf, to, message) {
  return new Promise(resolve => {
    const body = new URLSearchParams({ username: conf.username, to: to.join(','), message, ...(conf.sender ? { from: conf.sender } : {}) }).toString();
    const req = https.request({ hostname: conf.sandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com', path: '/version1/messaging', method: 'POST', timeout: 20000,
      headers: { apiKey: conf.apiKey, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
      const ch = []; res.on('data', c => ch.push(c));
      res.on('end', () => { try { const j = JSON.parse(Buffer.concat(ch).toString()); const rec = (j.SMSMessageData || {}).Recipients || []; resolve({ ok: res.statusCode < 300, sent: rec.filter(r => /success/i.test(r.status)).length, total: to.length, raw: (j.SMSMessageData || {}).Message || '' }); } catch (e) { resolve({ ok: false, sent: 0, total: to.length, raw: 'The SMS service gave an unexpected answer.' }); } });
    });
    req.on('error', e => resolve({ ok: false, sent: 0, total: to.length, raw: 'Could not reach the SMS service: ' + e.message }));
    req.on('timeout', () => { req.destroy(); });
    req.write(body); req.end();
  });
}
const intlPhone = p => { let d = digits(p); if (d.startsWith('0')) d = '256' + d.slice(1); else if (d.length === 9) d = '256' + d; return d.length >= 11 && d.length <= 13 ? '+' + d : null; };
/* ---------- communication ---------- */
const AUD_KINDS = {
  head: ['all', 'bal', 'c', 'stu_all', 'stu_bal', 'stu_c', 'staff', 'teachers', 'ct', 'ids'],
  dos: ['all', 'c', 'stu_all', 'stu_c', 'staff', 'teachers', 'ct'],
  registrar: ['all', 'c', 'stu_all', 'stu_c', 'staff', 'teachers', 'ct'],
  bursar: ['all', 'bal', 'c', 'stu_all', 'stu_bal', 'stu_c', 'ids'],
  hrm: ['staff', 'teachers', 'ct'],
  examoffice: ['teachers', 'ct']
};
const audKind = a => a.startsWith('stu_c:') ? 'stu_c' : a.startsWith('c:') ? 'c' : a;
const METHODS = ['MTN Mobile Money', 'Airtel Money', 'Cash', 'Bank deposit', 'Cheque'];
const personalise = (t, s, g, cls, bal) => t.replace(/\{child\}/g, `${s.first} ${s.last}`.trim()).replace(/\{guardian\}/g, (s.guardian && s.guardian.name) || 'Parent').replace(/\{class\}/g, cls || '').replace(/\{balance\}/g, 'UGX ' + Math.max(0, bal).toLocaleString('en-GB'));
route('POST', '/api/comms/send', { staff: true, limit: 512 * 1024 }, async (ctx) => {
  const b = ctx.body, aud = String(b.audience || ''), R = ctx.user.role;
  const body = String(b.body || '').trim().slice(0, 1000), title = String(b.title || '').trim().slice(0, 100);
  const channel = ['Portal', 'SMS', 'Notice board'].includes(b.channel) ? b.channel : 'Portal';
  if (!body) fail(400, 'Type a message first.');
  if (!(AUD_KINDS[R] || []).includes(audKind(aud))) fail(403, 'You cannot send to that audience.');
  if (channel === 'Notice board' && !policy.canWrite(R, 'notices')) fail(403, 'Your role cannot post on the notice board.');
  const kind = audKind(aud), toStudents = kind.startsWith('stu_'), toStaff = ['staff', 'teachers', 'ct'].includes(kind);
  if (channel === 'SMS' && toStudents) fail(400, 'Learners receive messages in their portal. Choose "Portal" for this audience.');
  const classes = new Map(store.list('classes').map(c => [c.id, c.data]));
  const active = store.list('students').map(r => r.data).filter(s => s.status === 'Active');
  const bal = balanceFn();
  let label = '', kids = [], staff = [];
  if (kind === 'all') { label = 'All parents and guardians'; kids = active; }
  else if (kind === 'bal') { label = 'Parents with fee balances'; kids = active.filter(s => bal(s) > 0); }
  else if (kind === 'c') { const c = classes.get(aud.slice(2)); if (!c) fail(400, 'Unknown class.'); label = 'Parents of ' + c.name; kids = active.filter(s => s.classId === c.id); }
  else if (kind === 'stu_all') { label = 'All learners'; kids = active; }
  else if (kind === 'stu_bal') { label = 'All learners with a fee balance'; kids = active.filter(s => bal(s) > 0); }
  else if (kind === 'stu_c') { const c = classes.get(aud.slice(6)); if (!c) fail(400, 'Unknown class.'); label = 'Learners of ' + c.name; kids = active.filter(s => s.classId === c.id); }
  else if (kind === 'ids') { const ids = new Set((Array.isArray(b.ids) ? b.ids : []).slice(0, 3000).map(String)); kids = active.filter(s => ids.has(s.id)); label = kids.length === 1 ? 'Parent of ' + `${kids[0].first} ${kids[0].last}`.trim() : 'Selected parents'; }
  else {
    const all = store.list('staff').map(r => r.data).filter(s => s.status === 'Active');
    if (kind === 'staff') { label = 'All staff'; staff = all; }
    else if (kind === 'teachers') { label = 'All teachers'; staff = all.filter(s => s.type === 'Teaching'); }
    else { label = 'All class teachers'; const ids = new Set([...classes.values()].map(c => c.teacherId).filter(Boolean)); staff = all.filter(s => ids.has(s.id)); }
  }
  const id = uid('m'), sender = `${ctx.user.name} (${ROLE_LABEL[R]})`, head = title || ('Message from ' + schoolName());
  const tokens = /\{(child|guardian|class|balance)\}/.test(body);
  const phones = new Map();
  store.begin();
  try {
    if (channel === 'Notice board') store.put('notices', uid('n'), { id: uid('n'), date: today(), title: title || 'Notice', body, by: ctx.user.name });
    else if (toStaff) for (const s of staff) { notify('t:' + s.id, 'message', head, body, { msgId: id, from: sender }); if (channel === 'SMS' && s.phone) phones.set(s.phone + '|' + s.id, { name: s.name, phone: s.phone, text: body }); }
    else for (const s of kids) {
      const text = tokens ? personalise(body, s, null, (classes.get(s.classId) || {}).name, bal(s)) : body;
      notify((toStudents ? 's:' : 'p:') + s.id, 'message', head, text, { msgId: id, from: sender });
      if (channel === 'SMS' && s.guardian && s.guardian.phone) phones.set(tokens ? s.guardian.phone + '|' + s.id : s.guardian.phone, { name: s.guardian.name, phone: s.guardian.phone, text });
    }
    const n = channel === 'Notice board' ? 0 : toStaff ? staff.length : (toStudents ? kids.length : new Set(kids.map(s => digits(s.guardian && s.guardian.phone) || s.id)).size);
    store.put('messages', id, { id, date: today(), channel, audience: channel === 'Notice board' ? 'Notice board (everyone)' : label, n, body: body.slice(0, 1000), status: 'Recorded', by: sender, byId: ctx.user.id });
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  let status = 'Delivered to portals', sent = 0;
  if (channel === 'Notice board') status = 'Posted';
  if (channel === 'SMS') {
    const conf = store.smsSecret(), live = conf.provider === 'africastalking' && conf.apiKey && conf.username, list = [...phones.values()].slice(0, 1500);
    if (!live) status = 'Portal only, SMS is not set up';
    else {
      const groups = new Map(); for (const p of list) { const num = intlPhone(p.phone); if (!num) continue; (groups.get(p.text) || groups.set(p.text, []).get(p.text)).push(num); }
      for (const [text, nums] of groups) for (let i = 0; i < nums.length; i += 100) { const r = await atSend(conf, [...new Set(nums.slice(i, i + 100))], text); sent += r.sent; }
      status = `Sent ${sent} of ${list.length} by SMS`;
    }
    store.begin(); try { const m = store.get('messages', id); store.put('messages', id, { ...m, status }); store.commit(); } catch (e) { store.rollback(); }
  }
  store.audit(ctx.user.username, `Message to ${label || 'notice board'}: ${status}`);
  return { id, audience: label, status, n: kids.length || staff.length, seq: store.seq() };
});

/* ---------- library reminders ---------- */
route('POST', '/api/library/remind', { staff: true }, async (ctx) => {
  if (ctx.user.role !== 'librarian') fail(403, 'Only the Librarian can send library reminders.');
  const ids = (Array.isArray(ctx.body.loanIds) ? ctx.body.loanIds : []).slice(0, 300).map(String);
  let n = 0;
  store.begin();
  try {
    for (const lid of ids) {
      const l = store.get('loans', lid); if (!l || l.returned || l.due >= today()) continue;
      const bk = store.get('books', l.bookId), s = store.get('students', l.studentId); if (!bk || !s) continue;
      const days = Math.round((Date.parse(today()) - Date.parse(l.due)) / 864e5);
      notifyKid(l.studentId, 'library', 'Please return your library book', `${bk.title} was due on ${fdate(l.due)} and is ${days} day${days === 1 ? '' : 's'} overdue. Please return it to the library.`, false);
      if (ctx.body.sms && s.guardian && s.guardian.phone) queueSms(s.guardian.phone, s.guardian.name, `Dear ${s.guardian.name || 'parent'}, ${s.first} has not returned the library book "${bk.title}" which was due on ${fdate(l.due)}. Please help return it. ${schoolName()}.`, ctx.user.name);
      n++;
    }
    store.commit();
  } catch (e) { store.rollback(); effects.length = 0; throw e; }
  await runEffects(ctx.user);
  store.audit(ctx.user.username, `Library reminders sent: ${n}`);
  return { sent: n };
});

/* ---------- question papers ---------- */
const PAPER_EXT = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
function paperType(name, buf) {
  const ext = (/\.(\w{2,5})$/.exec(String(name || '').toLowerCase()) || [])[1];
  if (!ext || !PAPER_EXT[ext] || buf.length < 8) return null;
  const h = buf;
  const ok = ext === 'pdf' ? h.toString('latin1', 0, 4) === '%PDF' : ext === 'docx' ? (h[0] === 0x50 && h[1] === 0x4B) : ext === 'doc' ? (h[0] === 0xD0 && h[1] === 0xCF && h[2] === 0x11 && h[3] === 0xE0) : !!IMG_MAGIC(h);
  return ok ? PAPER_EXT[ext] : null;
}
route('POST', '/api/papers', { staff: true, raw: true, limit: 16 * 1024 * 1024 }, async (ctx) => {
  const q = ctx.url.searchParams, exam = String(q.get('exam') || ''), cls = String(q.get('class') || ''), sub = String(q.get('subject') || ''), name = String(q.get('name') || 'paper').replace(/[^\w.\- ()]/g, '_').slice(0, 120);
  if (ctx.user.role !== 'teacher' || !ctx.user.staffId) fail(403, 'Only the subject teacher can upload a question paper.');
  const al = store.get('subjects', `${cls}|${sub}`);
  if (!al || al.teacherId !== ctx.user.staffId) fail(403, 'You are not the teacher allocated to this subject for this class.');
  const ex = store.get('exams', exam); if (!ex) fail(404, 'Unknown exam.');
  if (!papersOpen(store.get('examcfg', exam))) fail(403, 'Paper uploads are closed for this exam. Only the Examination Office can extend the deadline.');
  const mime = paperType(name, ctx.raw); if (!mime) fail(400, 'Upload a PDF, Word (.doc or .docx) or image file.');
  const id = `${exam}|${cls}|${sub}`, c = store.get('classes', cls);
  store.begin();
  try {
    store.filePut('paper:' + id, mime, ctx.raw);
    store.put('papers', id, { id, examId: exam, classId: cls, subject: sub, teacherId: ctx.user.staffId, teacherName: ctx.user.name, name, size: ctx.raw.length, mime, at: nowIso() });
    notify('r:examoffice', 'exams', 'Question paper received', `${sub} for ${c ? c.name : cls} (${ex.name}) from ${ctx.user.name}.`);
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, `Question paper uploaded: ${sub}, ${c ? c.name : cls}`);
  return { ok: true, paper: store.get('papers', id) };
});
route('GET', '/api/papers/:id/file', { staff: true }, async (ctx) => {
  if (ctx.user.role !== 'examoffice') fail(403, 'Question papers are visible only to the Examination Office.');
  const id = decodeURIComponent(ctx.params.id), meta = store.get('papers', id), f = store.fileGet('paper:' + id);
  if (!meta || !f) fail(404, 'Paper not found.');
  store.audit(ctx.user.username, `Question paper opened: ${meta.subject}, ${meta.classId}`);
  return { _blob: { mime: f.mime, data: Buffer.from(f.data), name: meta.name } };
});
route('DELETE', '/api/papers/:id', { staff: true }, async (ctx) => {
  const id = decodeURIComponent(ctx.params.id), meta = store.get('papers', id); if (!meta) fail(404, 'Paper not found.');
  const R = ctx.user.role;
  if (R === 'teacher') { if (meta.teacherId !== ctx.user.staffId) fail(403, 'Not allowed.'); if (!papersOpen(store.get('examcfg', meta.examId))) fail(403, 'Uploads are closed, so the paper can no longer be withdrawn.'); }
  else if (R !== 'examoffice') fail(403, 'Not allowed.');
  store.begin(); try { store.fileDel('paper:' + id); store.remove('papers', id); store.commit(); } catch (e) { store.rollback(); throw e; }
  return { ok: true };
});

/* ---------- learner and parent portal actions ---------- */
function portalKid(ctx) {
  const sid = String(ctx.body.studentId || ''); if (!FAMILY.includes(ctx.user.role)) fail(403, 'Not allowed.');
  if (!kidIdsFor(ctx.user).includes(sid)) fail(403, 'That learner is not linked to your account.');
  return store.get('students', sid);
}
route('POST', '/api/portal/prn', { limit: 20 * 1024 }, async (ctx) => {
  const s = portalKid(ctx), amount = Math.max(0, Math.min(1e9, Math.round(Number(ctx.body.amount) || 0)));
  const used = new Set(store.list('prn').map(r => r.data.prn));
  let prn; do { prn = '9' + String(crypto.randomInt(0, 1e12)).padStart(12, '0'); } while (used.has(prn));
  const sch = store.school(), id = uid('r');
  store.begin();
  try { store.put('prn', id, { id, studentId: s.id, prn, amount, purpose: `School fees, Term ${sch.term || ''} ${sch.year || ''}`.trim(), at: nowIso(), status: 'Open', by: ctx.user.name }); store.commit(); } catch (e) { store.rollback(); throw e; }
  return { ok: true, prn: store.get('prn', id) };
});
route('POST', '/api/portal/payment', { limit: 20 * 1024 }, async (ctx) => {
  const s = portalKid(ctx), b = ctx.body, amount = Math.round(Number(b.amount) || 0), ref = String(b.ref || '').trim().slice(0, 80);
  if (amount < 1 || amount > 1e9) fail(400, 'Enter the amount you paid.');
  if (!ref) fail(400, 'Enter the transaction or bank slip reference so the bursar can confirm the payment.');
  const method = METHODS.includes(b.method) ? b.method : 'Bank deposit', date = DATE_RE.test(b.date) && b.date <= today() ? b.date : today();
  const prn = String(b.prn || '').replace(/\D/g, '').slice(0, 20), id = uid('p');
  store.begin();
  try {
    store.put('payments', id, { id, rct: 'PEND-' + id, studentId: s.id, date, amount, method, ref, by: ctx.user.name, status: 'Pending', prn, approvedBy: '', approvedOn: '', source: 'Portal' });
    notify('r:bursar', 'fees', 'Payment awaiting approval', `${s.first} ${s.last}: UGX ${amount.toLocaleString('en-GB')} by ${method}, reference ${ref}.`);
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  return { ok: true };
});

/* ---------- timetable notices ---------- */
route('POST', '/api/timetable/publish', { staff: true }, async (ctx) => {
  if (ctx.user.role !== 'dos') fail(403, 'Only the Director of Studies publishes the timetable.');
  const subs = store.list('subjects').map(r => r.data), cls = store.list('classes').map(r => r.data);
  const teachers = new Set([...subs.map(s => s.teacherId), ...cls.map(c => c.teacherId)].filter(Boolean));
  store.begin();
  try {
    for (const t of teachers) {
      const mine = subs.filter(s => s.teacherId === t), ct = cls.filter(c => c.teacherId === t);
      notify('t:' + t, 'timetable', 'Your timetable is ready', `You teach ${[...new Set(mine.map(s => s.name))].join(', ') || 'no subjects yet'}${ct.length ? ' and you are class teacher of ' + ct.map(c => c.name).join(', ') : ''}. Open Timetable to see your lessons${ct.length ? ' and the full timetable of your class' : ''}.`);
    }
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, `Timetable published to ${teachers.size} teachers`);
  return { teachers: teachers.size };
});
route('POST', '/api/examtt/publish', { staff: true }, async (ctx) => {
  if (ctx.user.role !== 'dos') fail(403, 'Only the Director of Studies publishes the exams timetable.');
  const ex = store.get('exams', String(ctx.body.examId || '')); if (!ex) fail(404, 'Unknown exam.');
  const rows = store.list('examtt').map(r => r.data).filter(r => r.examId === ex.id), classIds = new Set(rows.map(r => r.classId));
  let n = 0;
  store.begin();
  try {
    notify('r:teacher', 'exams', 'Exams timetable', `The ${ex.name} timetable has been published. Open Timetable to see it.`);
    for (const s of store.list('students')) if (s.data.status === 'Active' && classIds.has(s.data.classId)) { notifyKid(s.id, 'exams', 'Exams timetable', `The ${ex.name} timetable for your class has been published.`, true); n++; }
    store.commit();
  } catch (e) { store.rollback(); throw e; }
  return { learners: n };
});


/* accounts */
route('GET', '/api/users', { admin: true }, async () => ({ users: U.all.all().map(publicUser) }));
route('POST', '/api/users', { admin: true }, async (ctx) => {
  const b = ctx.body, name = String(b.name || '').trim(), username = String(b.username || '').trim(), role = String(b.role || '');
  if (!name || !username || username.length > 60 || name.length > 120) fail(400, 'Enter a name and a username.');
  if (!STAFF.includes(role)) fail(400, 'Choose a staff role.');
  if (takenName(username)) fail(409, 'That username is already taken.');
  const staffId = b.staffId && store.exists('staff', String(b.staffId)) ? String(b.staffId) : null;
  if (role === 'teacher' && !staffId) fail(400, 'A teacher account must be linked to a staff record. Ask the Human Resource Manager to add the teacher first, then choose them from the list.');
  const pw = await createUser({ name, username, role, staffId });
  store.audit(ctx.user.username, `Account created for ${name} (${ROLE_LABEL[role]})`);
  return { pw, user: { name, username, role: ROLE_LABEL[role] } };
});
route('POST', '/api/users/bulk', { admin: true }, async (ctx) => {
  const students = store.list('students').filter(s => s.data.status !== 'Withdrawn');
  const hasStudent = new Set(U.students.all().map(u => safeJson(u.owners, [])[0]));
  const parentNames = new Set(U.parents.all().map(u => u.username));
  const jobs = [];
  for (const s of students) {
    if (!hasStudent.has(s.id) && s.data.adm && !takenName(s.data.adm)) { hasStudent.add(s.id); jobs.push({ name: `${s.data.first} ${s.data.last}`.trim(), username: s.data.adm, role: 'student', owners: [s.id] }); }
    const p = digits(s.data.guardian && s.data.guardian.phone);
    if (p.length >= 7 && !parentNames.has(p) && !takenName(p)) { parentNames.add(p); jobs.push({ name: s.data.guardian.name || 'Parent', username: p, role: 'parent', owners: [] }); }
  }
  const created = [];
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(jobs.slice(i, i + 6).map(async j => { const pw = await createUser(j); created.push({ name: j.name, role: ROLE_LABEL[j.role], username: j.username, pw }); }));
  }
  if (created.length) store.audit(ctx.user.username, `Created ${created.length} learner and parent accounts`);
  return { created };
});
route('POST', '/api/users/:id/link', { admin: true }, async (ctx) => {
  const row = U.byId.get(ctx.params.id); if (!row) fail(404, 'Account not found.');
  const sid = String(ctx.body.staffId || '');
  if (sid && !store.exists('staff', sid)) fail(400, 'That staff record does not exist.');
  store.db.prepare('UPDATE users SET staff_id = ? WHERE id = ?').run(sid || null, row.id); sessions.destroyUser(row.id);
  store.audit(ctx.user.username, `Account of ${row.name} linked to a staff record`);
  return { ok: true };
});
route('POST', '/api/users/:id/reset', { admin: true }, async (ctx) => {
  const row = U.byId.get(ctx.params.id); if (!row) fail(404, 'Account not found.');
  const pw = auth.tempPw(), h = await auth.hashPw(pw);
  U.setPw.run(h.salt, h.hash, 1, row.id); sessions.destroyUser(row.id);
  store.audit(ctx.user.username, `Password reset for ${row.name}`);
  return { pw, user: { name: row.name, username: row.username, role: ROLE_LABEL[row.role] } };
});
route('POST', '/api/users/:id/toggle', { admin: true }, async (ctx) => {
  const row = U.byId.get(ctx.params.id); if (!row) fail(404, 'Account not found.');
  if (row.id === ctx.user.id) fail(400, 'You cannot switch off your own account.');
  const next = row.active ? 0 : 1;
  if (!next && row.role === 'admin' && U.adminCount.get().n <= 1) fail(400, 'At least one administrator must stay active.');
  U.setActive.run(next, row.id); if (!next) sessions.destroyUser(row.id);
  store.audit(ctx.user.username, `Account ${next ? 'switched on' : 'switched off'}: ${row.name}`);
  return { ok: true, active: !!next };
});
route('DELETE', '/api/users/:id', { admin: true }, async (ctx) => {
  const row = U.byId.get(ctx.params.id); if (!row) fail(404, 'Account not found.');
  if (row.id === ctx.user.id) fail(400, 'You cannot remove your own account.');
  if (row.role === 'admin' && U.adminCount.get().n <= 1) fail(400, 'At least one administrator must stay active.');
  U.del.run(row.id);
  store.audit(ctx.user.username, `Account removed: ${row.name}`);
  return { ok: true };
});
route('GET', '/api/audit', { admin: true }, async (ctx) => ({ rows: store.auditList(Math.min(1000, Number(ctx.url.searchParams.get('limit')) || 300)) }));

/* photos and badge */
function photoColl(ctx) {
  const { kind, id } = ctx.params, coll = kind === 'student' ? 'students' : kind === 'staff' ? 'staff' : null;
  if (!coll || !ID_RE.test(id)) fail(400, 'Invalid request.');
  if (ctx.user.role !== (coll === 'students' ? 'registrar' : 'hrm')) fail(403, coll === 'students' ? 'Only the Registrar can change a learner\'s photo.' : 'Only the Human Resource Manager can change a staff photo.');
  if (!store.exists(coll, id)) fail(404, 'Save the record first, then add the photo.');
  return coll;
}
route('POST', '/api/photo/:kind/:id', { staff: true, raw: true, limit: 500 * 1024 }, async (ctx) => {
  const coll = photoColl(ctx);
  if (!IMG_MAGIC(ctx.raw)) fail(400, 'Choose a JPEG, PNG or WebP image.');
  store.begin(); try { savePhoto(coll, ctx.params.id, ctx.raw); store.commit(); } catch (e) { store.rollback(); throw e; }
  return { url: `/photo/${ctx.params.kind}/${ctx.params.id}?v=${store.rawRow(coll, ctx.params.id).photo_v}` };
});
route('DELETE', '/api/photo/:kind/:id', { staff: true }, async (ctx) => {
  const coll = photoColl(ctx);
  store.begin(); try { store.fileDel(`${ctx.params.kind}:${ctx.params.id}`); store.setPhoto(coll, ctx.params.id, null); store.commit(); } catch (e) { store.rollback(); throw e; }
  return { ok: true };
});
route('POST', '/api/badge', { admin: true, raw: true, limit: 700 * 1024 }, async (ctx) => {
  if (!IMG_MAGIC(ctx.raw)) fail(400, 'Choose a PNG, JPEG or WebP image.');
  store.begin(); try { store.filePut('badge', IMG_MAGIC(ctx.raw), ctx.raw); store.put('school', 'main', { updated: Date.now() }); store.commit(); } catch (e) { store.rollback(); throw e; }
  store.audit(ctx.user.username, 'School badge updated');
  return { url: store.school().badge };
});
route('DELETE', '/api/badge', { admin: true }, async (ctx) => {
  store.begin(); try { store.fileDel('badge'); store.put('school', 'main', { updated: Date.now() }); store.commit(); } catch (e) { store.rollback(); throw e; }
  return { ok: true };
});

/* ---------- request handling ---------- */
function sendFileBlob(res, f, priv) {
  const buf = Buffer.from(f.data);
  res.writeHead(200, { 'Content-Type': f.mime, 'Content-Length': buf.length, 'Cache-Control': priv ? 'private, max-age=3600' : 'public, max-age=3600' });
  res.end(buf);
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
function serveStatic(req, res, p) {
  let rel; try { rel = decodeURIComponent(p === '/' ? '/index.html' : p); } catch (e) { res.writeHead(400); return res.end(); }
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const etag = `"${st.size}-${Math.floor(st.mtimeMs)}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
    const ext = path.extname(file), h = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache', ETag: etag };
    if (['.html', '.js', '.css', '.svg'].includes(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      h['Content-Encoding'] = 'gzip'; h.Vary = 'Accept-Encoding'; res.writeHead(200, h);
      return fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    }
    h['Content-Length'] = st.size; res.writeHead(200, h);
    fs.createReadStream(file).pipe(res);
  });
}

async function handle(req, res) {
  setHeaders(res);
  const url = new URL(req.url, 'http://localhost'), p = url.pathname, method = req.method;
  const ip = clientIp(req), ua = req.headers['user-agent'] || '';
  const token = auth.parseCookies(req.headers.cookie).we_sid || '';
  const isPoll = p === '/api/changes' || (p === '/api/bootstrap' && url.searchParams.has('since'));
  const sess = sessions.get(token, !isPoll);
  const user = sess ? sess.user : null;

  if (p === '/badge' && method === 'GET') {
    const f = store.fileGet('badge'); if (!f) { res.writeHead(404); return res.end(); }
    return sendFileBlob(res, f, false);
  }
  const pm = /^\/photo\/(student|staff)\/([\w\-|. ]{1,90})$/.exec(p);
  if (pm && method === 'GET') {
    if (!user || sess.must) { res.writeHead(401); return res.end(); }
    if (FAMILY.includes(user.role) && (pm[1] !== 'student' || !kidIdsFor(user).includes(pm[2]))) { res.writeHead(403); return res.end(); }
    if (!FAMILY.includes(user.role) && !policy.canRead(user.role, pm[1] === 'student' ? 'students' : 'staff')) { res.writeHead(403); return res.end(); }
    const f = store.fileGet(`${pm[1]}:${pm[2]}`); if (!f) { res.writeHead(404); return res.end(); }
    return sendFileBlob(res, f, true);
  }
  if (!p.startsWith('/api/')) {
    if (method !== 'GET' && method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveStatic(req, res, p);
  }

  if (method !== 'GET') {
    const origin = req.headers.origin;
    if (req.headers['x-requested-with'] !== 'WalEduc') return sendJson(req, res, 403, { error: 'Blocked request.' });
    if (origin) { try { if (new URL(origin).host !== req.headers.host) return sendJson(req, res, 403, { error: 'Blocked request.' }); } catch (e) { return sendJson(req, res, 403, { error: 'Blocked request.' }); } }
  }
  let matched = null;
  for (const r of routes) { if (r.method !== method) continue; const m = r.re.exec(p); if (m) { matched = { r, params: m.groups || {} }; break; } }
  if (!matched) return sendJson(req, res, 404, { error: 'Not found.' });
  const { r, params } = matched, o = r.opts;
  try {
    if (!o.public) {
      if (!user) return sendJson(req, res, 401, { error: 'Please sign in.', code: 'auth' });
      if (sess.must && p !== '/api/password' && p !== '/api/logout') return sendJson(req, res, 403, { error: 'Choose a new password first.', code: 'must_change' });
      if (o.admin && user.role !== 'admin') return sendJson(req, res, 403, { error: 'Only the administrator can do this.' });
      if (o.staff && FAMILY.includes(user.role)) return sendJson(req, res, 403, { error: 'Not allowed.' });
    }
    const ctx = { req, url, params, ip, ua, user, sess, token, body: {} };
    if (o.raw) ctx.raw = await readBody(req, o.limit || 1024 * 1024);
    else if (method !== 'GET' && method !== 'DELETE') ctx.body = await readJson(req, o.limit || 1024 * 1024);
    const out = await r.fn(ctx);
    if (out && out._file) {
      const st = fs.statSync(out._file);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': st.size, 'Content-Disposition': `attachment; filename="${out._name}"`, 'Cache-Control': 'no-store' });
      const rs = fs.createReadStream(out._file); rs.pipe(res);
      rs.on('close', () => { if (out._delete) fs.unlink(out._file, () => {}); });
      return;
    }
    if (out && out._blob) {
      res.writeHead(200, { 'Content-Type': out._blob.mime, 'Content-Length': out._blob.data.length, 'Content-Disposition': `attachment; filename="${out._blob.name.replace(/"/g, '')}"`, 'Cache-Control': 'no-store' });
      return res.end(out._blob.data);
    }
    const headers = {}; if (out && out._cookie) { headers['Set-Cookie'] = out._cookie; delete out._cookie; }
    return sendJson(req, res, 200, out, headers);
  } catch (e) {
    if (e instanceof HttpError) return sendJson(req, res, e.status, { error: e.message, ...(e.extra || {}) });
    console.error(nowIso(), method, p, e);
    return sendJson(req, res, 500, { error: 'Something went wrong on the server.' });
  }
}

/* ---------- backups ---------- */
function runBackup(force) {
  try {
    const dir = backupDir();
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.db')).sort();
    const last = files[files.length - 1];
    if (!force && last && Date.now() - fs.statSync(path.join(dir, last)).mtimeMs < 20 * 3600 * 1000) return;
    const stamp = nowIso().slice(0, 19).replace(/[-:T]/g, '');
    store.backupTo(path.join(dir, `walEduc-${stamp}.db`));
    const all = fs.readdirSync(dir).filter(f => f.endsWith('.db')).sort();
    all.slice(0, Math.max(0, all.length - 14)).forEach(f => fs.unlink(path.join(dir, f), () => {}));
    console.log('Backup saved:', `walEduc-${stamp}.db`);
  } catch (e) { console.error('Backup failed:', e.message); }
}

/* ---------- command line: node server.js reset-admin [username] ---------- */
if (process.argv[2] === 'reset-admin') {
  (async () => {
    const name = process.argv[3], row = name ? U.byName.get(name) : U.byId.get((U.firstAdmin.get() || {}).id);
    if (!row || row.role !== 'admin') { console.error('No administrator account found' + (name ? ` named "${name}"` : '') + '.'); process.exit(1); }
    const pw = auth.tempPw(), h = await auth.hashPw(pw);
    U.setPw.run(h.salt, h.hash, 1, row.id); sessions.destroyUser(row.id);
    store.audit('console', `Administrator password reset from the server console for ${row.username}`);
    console.log(`\nAdministrator "${row.username}" can now sign in with the temporary password:\n\n    ${pw}\n\nThey will be asked to choose a new one straight away.\n`);
    store.close(); process.exit(0);
  })();
} else start();

function start() {
  const wrap = (q, s) => handle(q, s).catch(e => { console.error(e); try { s.end(); } catch (x) { /* ignore */ } });
  const server = (cfg.tlsCert && cfg.tlsKey) ? https.createServer({ cert: fs.readFileSync(cfg.tlsCert), key: fs.readFileSync(cfg.tlsKey) }, wrap) : http.createServer(wrap);
  server.requestTimeout = 60000; server.headersTimeout = 20000;
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `\nPort ${cfg.port} is already in use. Is WalEduc already running? You can pick another port, for example: PORT=8081 node server.js\n` : e); process.exit(1); });
  server.listen(cfg.port, cfg.host, () => {
    const proto = cfg.tlsCert ? 'https' : 'http';
    console.log(`\nWalEduc ${VERSION} is running.\n  On this computer:  ${proto}://localhost:${cfg.port}`);
    for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`  On the network:    ${proto}://${a.address}:${cfg.port}`);
    console.log(`  Data folder:       ${cfg.dataDir}\n  Press Ctrl+C to stop.\n`);
    runBackup(false);
  });
  setInterval(() => { runBackup(false); store.pruneTombstones(); }, 6 * 3600 * 1000).unref();
  setInterval(() => { sessions.prune(); limiter.sweep(); }, 10 * 60 * 1000).unref();
  const stop = () => { console.log('\nStopping…'); server.close(); store.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  module.exports = { server, store, cfg };
}
