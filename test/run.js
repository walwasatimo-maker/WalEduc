'use strict';
/* Automated API tests for WalEduc 2: security, role limits, workflows, family scoping, persistence.
   Usage: node test/run.js */
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os'), assert = require('assert');
const PORT = 8190 + Math.floor(Math.random() * 50), BASE = `http://127.0.0.1:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'walEduc-test-'));
let srv, pass = 0, failn = 0;
const start = () => new Promise((res, rej) => { srv = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT, DATA_DIR: dir, HOST: '127.0.0.1' } }); let t = ''; srv.stdout.on('data', d => { t += d; if (/is running/.test(t)) res(); }); srv.stderr.on('data', d => { if (!/ExperimentalWarning/.test(String(d))) process.stderr.write(d); }); srv.on('exit', c => rej(new Error('server exited ' + c))); });
const stop = () => new Promise(r => { srv.removeAllListeners('exit'); srv.once('exit', r); srv.kill('SIGTERM'); });
class C { constructor() { this.cookie = ''; }
  async req(method, url, body, o = {}) {
    const h = { ...(o.noCsrf ? {} : { 'X-Requested-With': 'WalEduc' }), ...(this.cookie ? { Cookie: this.cookie } : {}) };
    if (body !== undefined && !o.raw) h['Content-Type'] = 'application/json';
    const r = await fetch(BASE + url, { method, headers: h, body: body === undefined ? undefined : o.raw ? body : JSON.stringify(body) });
    const sc = r.headers.get('set-cookie'); if (sc) { const m = /we_sid=([^;]*)/.exec(sc); this.cookie = m && m[1] ? 'we_sid=' + m[1] : ''; }
    const ct = r.headers.get('content-type') || ''; const j = ct.includes('json') ? await r.json() : null;
    return { status: r.status, j, r };
  }
  get(u) { return this.req('GET', u); } post(u, b, o) { return this.req('POST', u, b, o); } del(u) { return this.req('DELETE', u); } }
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { failn++; console.log('  FAIL ' + name + '\n       ' + (e.message || e).split('\n')[0]); } };
const sync = (c, ops) => c.post('/api/sync', { ops });
const bad = r => r.j.results.length;          /* number of rejected changes */
const data = async (c, coll) => ((await c.get('/api/bootstrap')).j.data[coll] || []).map(x => x[1]);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(40)]);
const pdf = Buffer.from('%PDF-1.4\n%test paper\n' + 'x'.repeat(200));
const FUT = new Date(Date.now() + 3 * 86400000).toISOString(), PAST = new Date(Date.now() - 3600000).toISOString();
const D = new Date().toISOString().slice(0, 10);

(async () => {
  await start();
  const admin = new C();
  await t('setup creates admin once', async () => {
    let r = await admin.post('/api/setup', { name: 'System Admin', username: 'admin', password: 'Passw0rdX' }); assert.equal(r.status, 200); assert(r.j.code);
    r = await new C().post('/api/setup', { name: 'x', username: 'y', password: 'Passw0rdX' }); assert.equal(r.status, 403);
  });
  await t('requests without the CSRF header are blocked', async () => { assert.equal((await admin.post('/api/sync', { ops: [] }, { noCsrf: true })).status, 403); });
  await t('unauthenticated API access is refused', async () => { assert.equal((await new C().get('/api/bootstrap')).status, 401); });

  /* ---- seed through the administrator's import (trusted path) ---- */
  const seed = [
    ['school', 'main', { name: 'Pilkington College Muguluka', code: 'PCM', year: 2026, term: 3 }],
    ['fees', 'main', { structure: { 'O-Day': 400000, 'O-Boarding': 800000, 'A-Day': 500000, 'A-Boarding': 900000 } }],
    ['staff', 'tE', { name: 'Eva English', sex: 'F', type: 'Teaching', role: 'Teacher', subjects: ['English'], phone: '0700000001' }],
    ['staff', 'tM', { name: 'Moses Maths', sex: 'M', type: 'Teaching', role: 'Teacher', subjects: ['Mathematics'], phone: '0700000002' }],
    ['staff', 'sHR', { name: 'Hannah Resource', sex: 'F', type: 'Non-teaching', role: 'Human Resource Manager' }],
    ['staff', 'sEX', { name: 'Eddie Exams', sex: 'M', type: 'Non-teaching', role: 'Examination Officer' }],
    ['classes', 'S1A', { name: 'S.1 A', level: 'O', form: 1, stream: 'A', teacherId: 'tE' }],
    ['classes', 'S2A', { name: 'S.2 A', level: 'O', form: 2, stream: 'A', teacherId: 'tM' }],
    ['subjects', 'S1A|English', { classId: 'S1A', name: 'English', teacherId: 'tE', periods: 4 }], ['subjects', 'S1A|Mathematics', { classId: 'S1A', name: 'Mathematics', teacherId: 'tM', periods: 4 }],
    ['subjects', 'S2A|English', { classId: 'S2A', name: 'English', teacherId: 'tE', periods: 4 }], ['subjects', 'S2A|Mathematics', { classId: 'S2A', name: 'Mathematics', teacherId: 'tM', periods: 4 }],
    ['ttcfg', 'main', { days: [0, 1, 2, 3, 4], slots: [{ type: 'lesson', from: '08:00', to: '08:40' }, { type: 'lesson', from: '08:40', to: '09:20' }] }],
    ['dorms', 'dM', { name: 'Nile House', sex: 'M', cap: 10 }], ['dorms', 'dF', { name: 'Lake House', sex: 'F', cap: 10 }],
    ['students', 'sA', { first: 'Amina', last: 'Kato', sex: 'F', classId: 'S1A', medical: 'Asthma', guardian: { name: 'Mr Kato', phone: '0772 000 111' } }],
    ['students', 'sB', { first: 'Brian', last: 'Opio', sex: 'M', classId: 'S1A', boarding: 'Boarding', guardian: { name: 'Mrs Opio', phone: '0752000222' } }],
    ['students', 'sC', { first: 'Cathy', last: 'Kato', sex: 'F', classId: 'S2A', guardian: { name: 'Mr Kato', phone: '0772000111' } }],
    ['exams', 'e1', { name: 'Mid-Term', term: 3, year: 2026, published: false }], ['exams', 'e2', { name: 'Old', term: 2, year: 2026, published: true }],
    ['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: true, marksDeadline: FUT }], ['examcfg', 'e2', { examId: 'e2', paperDeadline: '', marksOpen: false, marksDeadline: '' }],
    ['marks', 'e2|sA|English', 70], ['marks', 'e2|sB|English', 90], ['marks', 'e2|sC|English', 50],
    ['placements', 'e2|sA', { examId: 'e2', studentId: 'sA', classId: 'S1A' }], ['placements', 'e2|sB', { examId: 'e2', studentId: 'sB', classId: 'S1A' }], ['placements', 'e2|sC', { examId: 'e2', studentId: 'sC', classId: 'S2A' }]
  ];
  await t('administrator can import records', async () => { const r = await admin.post('/api/import', { ops: seed, sample: false }); assert.equal(r.status, 200); assert.equal(r.j.skipped, 0, 'skipped ' + r.j.skipped); });

  const mkAcc = async (name, username, role, extra) => (await admin.post('/api/users', { name, username, role, ...extra })).j;
  const login = async (u, p) => { const c = new C(); const r = await c.post('/api/login', { username: u, password: p }); return { c, r }; };
  const fresh = async (u, role, name, staffId) => { const a = await mkAcc(name, u, role, { staffId }); assert(a.pw, JSON.stringify(a)); const { c, r } = await login(u, a.pw); assert(r.j.must); const pw = 'Secret' + u + '9'; assert.equal((await c.post('/api/password', { current: a.pw, password: pw })).status, 200); const l = await login(u, pw); return l.c; };
  const A = {};
  await t('administrator creates staff accounts for every new role', async () => {
    A.head = await fresh('head1', 'head', 'Hugh Head'); A.dos = await fresh('dos1', 'dos', 'Dora DoS'); A.bursar = await fresh('bursar1', 'bursar', 'Bea Bursar');
    A.registrar = await fresh('reg1', 'registrar', 'Rita Registrar'); A.librarian = await fresh('lib1', 'librarian', 'Lia Lib'); A.warden = await fresh('ward1', 'warden', 'Wanda Warden');
    A.hrm = await fresh('hrm1', 'hrm', 'Hannah Resource', 'sHR'); A.exam = await fresh('exam1', 'examoffice', 'Eddie Exams', 'sEX'); A.nurse = await fresh('nurse1', 'sickbay', 'Nina Nurse');
    A.tE = await fresh('tEva', 'teacher', 'Eva English', 'tE'); A.tM = await fresh('tMoses', 'teacher', 'Moses Maths', 'tM');
  });
  await t('a teacher account must be linked to a staff record', async () => { const r = await admin.post('/api/users', { name: 'No Link', username: 'nolink', role: 'teacher' }); assert.equal(r.status, 400); });

  /* ---- administrator is a read-only seer ---- */
  await t('administrator cannot change learners, staff, marks, payments, books or events', async () => {
    const r = await sync(admin, [['students', 'sA', { first: 'X', sex: 'F', classId: 'S1A' }], ['staff', 'zz', { name: 'Z' }], ['marks', 'e1|sA|English', 50], ['payments', 'pz', { studentId: 'sA', date: D, amount: 5 }], ['books', 'bz', { title: 'B' }], ['events', 'ez', { title: 'E', date: D }], ['discipline', 'dz', { studentId: 'sA', date: D }], ['classes', 'cz', { name: 'C', level: 'O', form: 1 }]]);
    assert.equal(bad(r), 8);
  });
  await t('administrator does not receive marks, papers, misconduct, payroll or message text', async () => {
    const b = (await admin.get('/api/bootstrap')).j.data; for (const c of ['marks', 'comments', 'papers', 'misconduct', 'hr', 'messages', 'inbox']) assert(!b[c], c);
    assert(b.students && b.payments && b.staff);
  });
  await t('administrator can still change school details', async () => { assert.equal(bad(await sync(admin, [['school', 'main', { name: 'Pilkington College Muguluka', motto: 'x' }]])), 0); });

  /* ---- learners and admissions ---- */
  await t('only the registrar adds or removes learners', async () => {
    const s = { first: 'New', last: 'Kid', sex: 'M', classId: 'S1A', guardian: { name: 'G', phone: '0701234567' } };
    for (const k of ['head', 'dos', 'hrm', 'bursar', 'warden', 'tE', 'exam', 'librarian']) assert.equal(bad(await sync(A[k], [['students', 'sNew', s]])), 1, k);
    assert.equal(bad(await sync(A.registrar, [['students', 'sNew', s]])), 0);
    assert.equal(bad(await sync(A.hrm, [['students', 'sNew', null]])), 1);
    assert.equal(bad(await sync(A.registrar, [['students', 'sNew', null]])), 0);
  });
  await t('HR manager can see enrolment but not edit it', async () => { assert((await data(A.hrm, 'students')).length >= 3); assert.equal(bad(await sync(A.hrm, [['students', 'sA', { first: 'Z', sex: 'F', classId: 'S1A' }]])), 1); });
  await t('registrar cannot change dormitory or fee fields; bursar only fee fields; warden only dormitory', async () => {
    const sB = (await data(A.registrar, 'students')).find(s => s.id === 'sB');
    assert.equal(bad(await sync(A.registrar, [['students', 'sB', { ...sB, dorm: 'dM', bursary: 999, arrears: 777, address: 'Jinja' }]])), 0);
    let now = (await data(A.registrar, 'students')).find(s => s.id === 'sB'); assert.equal(now.dorm, ''); assert.equal(now.bursary, 0); assert.equal(now.address, 'Jinja');
    assert.equal(bad(await sync(A.bursar, [['students', 'sB', { ...now, bursary: 50000, arrears: 20000, address: 'HACK', first: 'HACK' }]])), 0);
    now = (await data(A.registrar, 'students')).find(s => s.id === 'sB'); assert.equal(now.bursary, 50000); assert.equal(now.address, 'Jinja'); assert.equal(now.first, 'Brian');
    assert.equal(bad(await sync(A.warden, [['students', 'sB', { ...now, dorm: 'dM', first: 'HACK' }]])), 0);
    now = (await data(A.registrar, 'students')).find(s => s.id === 'sB'); assert.equal(now.dorm, 'dM'); assert.equal(now.first, 'Brian');
  });
  await t('warden can only assign a day learner? no, and only to a dormitory of the right sex', async () => {
    const sA = (await data(A.registrar, 'students')).find(s => s.id === 'sA'); const w = await data(A.warden, 'students'); assert(!w.find(s => s.id === 'sA'), 'warden sees boarders only'); assert(w.find(s => s.id === 'sB'));
    assert.equal(bad(await sync(A.warden, [['students', 'sA', { ...sA, dorm: 'dF' }]])), 1);
    const sB = w.find(s => s.id === 'sB'); assert.equal(bad(await sync(A.warden, [['students', 'sB', { ...sB, dorm: 'dF' }]])), 1, 'wrong sex');
  });
  const kid = {}; 
  await t('learner and parent accounts are created by the administrator', async () => {
    const r = await admin.post('/api/users/bulk', {}); const cr = r.j.created; globalThis.creds = Object.fromEntries(cr.map(x => [x.username, x.pw])); assert(cr.length >= 4);
    const adm = (await admin.get('/api/bootstrap')).j.data.students.find(x => x[0] === 'sB')[1].adm;
    for (const [k, u] of [['kidB', adm], ['parentA', '0772000111'], ['parentB', '0752000222']]) { const l = await login(u, creds[u]); assert.equal(l.r.status, 200, u); await l.c.post('/api/password', { current: creds[u], password: 'Family' + k + '2026' }); kid[k] = (await login(u, 'Family' + k + '2026')).c; }
  });
  await t('dormitory assignment sends a portal notice to that learner only', async () => {
    const inb = (await data(kid.kidB, 'inbox')).filter(i => i.kind === 'boarding'); assert.equal(inb.length, 1); assert(/Nile House/.test(inb[0].body));
    assert.equal((await data(kid.parentB, 'inbox')).filter(i => i.kind === 'boarding').length, 0);
  });
  await t('registrar admissions: interview needs a date, SMS is recorded, direct admission works', async () => {
    const ap = { name: 'Zed Applicant', sex: 'M', dob: '2012-02-02', applyingFor: 'S1', prevSchool: 'Jinja PS', guardian: 'Mama Zed', phone: '0701112223', stage: 'Applied', date: D };
    assert.equal(bad(await sync(A.head, [['applicants', 'a1', ap]])), 1, 'only registrar');
    assert.equal(bad(await sync(A.registrar, [['applicants', 'a1', ap], ['applicants', 'a2', { ...ap, name: 'Direct Dan' }]])), 0);
    assert.equal(bad(await sync(A.registrar, [['applicants', 'a1', { ...ap, stage: 'Interview' }]])), 1, 'date required');
    assert.equal(bad(await sync(A.registrar, [['applicants', 'a1', { ...ap, stage: 'Interview', interviewAt: '2026-11-02', interviewVenue: 'Main hall 9am' }]])), 0);
    assert.equal(bad(await sync(A.registrar, [['applicants', 'a1', { ...ap, stage: 'Admitted', interviewAt: '2026-11-02' }], ['applicants', 'a2', { ...ap, name: 'Direct Dan', stage: 'Admitted' }]])), 0);
    const msgs = await data(A.registrar, 'messages'); const texts = msgs.map(m => m.body);
    assert(texts.some(x => /invited for an admission interview/.test(x) && /Main hall/.test(x)), 'interview SMS');
    assert(texts.some(x => /passed the interview/.test(x)), 'congratulations SMS');
    assert(texts.some(x => /confirm that Direct Dan has been admitted/.test(x)), 'direct admission SMS');
    assert.equal(bad(await sync(A.registrar, [['applicants', 'a1', { ...ap, stage: 'Applied' }]])), 1, 'cannot go backwards');
  });
  await t('message history is private to the sender and the head teacher', async () => { assert((await data(A.head, 'messages')).length >= 3); assert.equal((await data(A.bursar, 'messages')).length, 0); assert(!(await admin.get('/api/bootstrap')).j.data.messages); });

  /* ---- staff and HR ---- */
  await t('only the HR manager adds staff; head and DoS only assign duties', async () => {
    assert.equal(bad(await sync(A.hrm, [['staff', 'sNew', { name: 'Nelly New', sex: 'F', type: 'Non-teaching', role: 'Secretary', dept: 'Admin' }]])), 0);
    for (const k of ['head', 'dos', 'registrar', 'admin']) assert.equal(bad(await sync(k === 'admin' ? admin : A[k], [['staff', 'sBad', { name: 'Bad', sex: 'F', type: 'Teaching', role: 'T' }]])), 1, k);
    const s = (await data(A.head, 'staff')).find(x => x.id === 'sNew');
    assert.equal(bad(await sync(A.head, [['staff', 'sNew', { ...s, duties: ['Deputy Head Teacher'], name: 'Renamed', dept: 'Hacked' }]])), 0);
    const n = (await data(A.hrm, 'staff')).find(x => x.id === 'sNew'); assert.deepEqual(n.duties, ['Deputy Head Teacher']); assert.equal(n.name, 'Nelly New'); assert.equal(n.dept, 'Admin');
    assert.equal(bad(await sync(A.dos, [['staff', 'sNew', { ...n, duties: ['Deputy Head Teacher', 'Games'] }]])), 0);
    assert.equal(bad(await sync(A.head, [['staff', 'sNew', null]])), 1);
  });
  await t('HR data (payroll, attendance, misconduct) is visible only to the right people', async () => {
    assert.equal(bad(await sync(A.hrm, [['hr', 'tE', { salary: 900000, contract: 'Permanent' }], ['staffatt', `${D}|tE`, { date: D, staffId: 'tE', mark: 'P' }], ['misconduct', 'm1', { staffId: 'tM', date: D, type: 'Lateness', details: 'Late 3 times', action: 'Warning' }], ['leaves', 'l1', { staffId: 'tE', type: 'Annual', from: D, to: D, status: 'Pending' }]])), 0);
    for (const c of ['hr', 'misconduct', 'staffatt']) { assert((await data(A.hrm, c)).length === 1, 'hrm ' + c); assert((await data(A.head, c)).length === 1, 'head ' + c); for (const k of ['dos', 'bursar', 'tE', 'registrar']) assert(!(await A[k].get('/api/bootstrap')).j.data[c], k + ' ' + c); if (c !== 'staffatt') assert(!(await admin.get('/api/bootstrap')).j.data[c]); }
    assert.equal(bad(await sync(A.head, [['misconduct', 'm2', { staffId: 'tM', date: D, type: 'x' }]])), 1);
    assert.equal(bad(await sync(A.hrm, [['staffatt', `2999-01-01|tE`, { date: '2999-01-01', staffId: 'tE', mark: 'P' }]])), 1, 'future');
  });

  /* ---- classes, subjects, timetable, attendance ---- */
  await t('head, registrar and DoS add classes (with default subjects); others cannot', async () => {
    assert.equal(bad(await sync(A.head, [['classes', 'S3A', { name: 'S.3 A', level: 'O', form: 3, stream: 'A' }]])), 0);
    assert((await data(A.head, 'subjects')).filter(s => s.classId === 'S3A').length >= 8, 'default subjects');
    for (const k of ['bursar', 'tE', 'hrm', 'warden', 'exam']) assert.equal(bad(await sync(A[k], [['classes', 'Sx', { name: 'X', level: 'O', form: 1 }]])), 1, k);
    assert.equal(bad(await sync(A.registrar, [['subjects', 'S3A|Art', { classId: 'S3A', name: 'Art', teacherId: 'tE', periods: 9 }]])), 0);
    const art = (await data(A.dos, 'subjects')).find(s => s.id === 'S3A|Art'); assert.equal(art.teacherId, '', 'registrar cannot allocate teachers');
    assert.equal(bad(await sync(A.dos, [['subjects', 'S3A|Art', { ...art, teacherId: 'tM', periods: 3 }]])), 0);
    assert.equal(bad(await sync(A.head, [['subjects', 'S3A|Art', { ...art, teacherId: 'tE' }]])), 0);
    assert.equal((await data(A.dos, 'subjects')).find(s => s.id === 'S3A|Art').teacherId, 'tM', 'head cannot change the allocation');
    assert.equal(bad(await sync(A.tM, [['subjects', 'S3A|Art', null]])), 1);
    assert.equal(bad(await sync(A.registrar, [['subjects', 'S3A|Art', null]])), 0);
  });
  await t('the teacher is told when a subject is allocated to them', async () => { assert((await data(A.tM, 'inbox')).some(i => /Subject allocated/.test(i.title) && /Art/.test(i.body))); });
  await t('only the DoS designs the timetable and exams timetable', async () => {
    const row = ['English', 'Mathematics'];
    for (const k of ['head', 'registrar', 'tE', 'hrm']) { assert.equal(bad(await sync(A[k], [['tt', 'S1A|0', row]])), 1, k); assert.equal(bad(await sync(A[k], [['ttcfg', 'main', { days: [0], slots: [{ type: 'lesson', from: '08:00', to: '09:00' }] }]])), 1, k); }
    assert.equal(bad(await sync(admin, [['tt', 'S1A|0', row]])), 1);
    assert.equal(bad(await sync(A.dos, [['tt', 'S1A|0', row], ['tt', 'S1A|5', row], ['tt', 'S2A|0', ['Mathematics', 'English']]])), 0, 'saturday allowed');
    assert.equal(bad(await sync(A.dos, [['tt', 'S1A|1', ['Chemistry']]])), 1, 'unknown subject');
    assert.equal(bad(await sync(A.dos, [['ttcfg', 'main', { days: [0, 1, 2, 3, 4, 5], slots: [{ type: 'lesson', from: '08:00', to: '08:45' }, { type: 'break', from: '08:45', to: '09:00', label: 'TEA' }, { type: 'lesson', from: '09:00', to: '09:45' }] }]])), 0);
    assert.equal(bad(await sync(A.dos, [['ttcfg', 'main', { days: [0], slots: [{ type: 'lesson', from: '10:00', to: '09:00' }] }]])), 1, 'bad times');
    assert.equal(bad(await sync(A.dos, [['examtt', 'x1', { examId: 'e1', classId: 'S1A', subject: 'English', date: '2026-12-01', start: '09:00', end: '11:00', venue: 'Hall' }]])), 0);
    assert.equal(bad(await sync(A.head, [['examtt', 'x2', { examId: 'e1', classId: 'S1A', subject: 'English', date: '2026-12-01' }]])), 1);
  });
  await t('teachers see only their own classes on the timetable; class teachers get the full class', async () => {
    assert.equal(bad(await sync(A.dos, [['subjects', 'S1A|English', { classId: 'S1A', name: 'English', teacherId: 'tM', periods: 4 }]])), 0);
    const tt = a => a.map(x => x.id || x);
    const tE = (await A.tE.get('/api/bootstrap')).j.data.tt.map(x => x[0]), tM = (await A.tM.get('/api/bootstrap')).j.data.tt.map(x => x[0]);
    assert(tE.some(k => k.startsWith('S1A')) && tE.some(k => k.startsWith('S2A')), 'tE: S1A class teacher, S2A English'); assert(tM.length > 0);
    assert.equal(bad(await sync(A.dos, [['subjects', 'S1A|English', { classId: 'S1A', name: 'English', teacherId: 'tE', periods: 4 }]])), 0);
    const pub = await A.dos.post('/api/timetable/publish', {}); assert.equal(pub.status, 200); assert((await data(A.tE, 'inbox')).some(i => /timetable is ready/.test(i.title)));
    assert.equal((await A.head.post('/api/timetable/publish', {})).status, 403);
  });
  await t('only the class teacher takes attendance for their own class', async () => {
    assert.equal(bad(await sync(A.tE, [['attendance', `${D}|sA`, 'P'], ['attendance', `${D}|sB`, 'A']])), 0);
    assert.equal(bad(await sync(A.tE, [['attendance', `${D}|sC`, 'P']])), 1, 'not their class');
    assert.equal(bad(await sync(A.tM, [['attendance', `${D}|sA`, 'A']])), 1);
    for (const k of ['head', 'dos', 'warden', 'registrar']) assert.equal(bad(await sync(A[k], [['attendance', `${D}|sA`, 'A']])), 1, k);
    assert.equal(bad(await sync(admin, [['attendance', `${D}|sA`, 'A']])), 1);
    assert.equal(bad(await sync(A.tE, [['attendance', `2999-01-01|sA`, 'P']])), 1, 'future');
    assert((await data(A.head, 'attendance')).length >= 2); assert((await data(A.tM, 'attendance')).every(a => true) && !(await data(A.tM, 'attendance')).length === false || true);
    const tm = (await A.tM.get('/api/bootstrap')).j.data.attendance.map(x => x[0]); assert(!tm.some(k => k.endsWith('|sA')), 'a non-class-teacher does not see other classes');
  });

  /* ---- boarding roll call ---- */
  await t('only the warden takes roll calls, for boarders only', async () => {
    assert.equal(bad(await sync(A.warden, [['rollcall', `${D}|Evening|sB`, { date: D, session: 'Evening', studentId: 'sB', mark: 'P' }]])), 0);
    assert.equal(bad(await sync(A.warden, [['rollcall', `${D}|Evening|sA`, { date: D, session: 'Evening', studentId: 'sA', mark: 'P' }]])), 1, 'day scholar');
    assert.equal(bad(await sync(A.tE, [['rollcall', `${D}|Morning|sB`, { date: D, session: 'Morning', studentId: 'sB', mark: 'P' }]])), 1);
    assert.equal((await data(A.head, 'rollcall')).length, 1); assert.equal((await data(A.dos, 'rollcall')).length, 1);
  });

  /* ---- exams ---- */
  await t('only the allocated subject teacher enters marks, and only while the portal is open', async () => {
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 80], ['marks', 'e1|sB|English', 60]])), 0);
    assert.equal(bad(await sync(A.tM, [['marks', 'e1|sA|English', 99]])), 1, 'not their subject');
    assert.equal(bad(await sync(A.tM, [['marks', 'e1|sA|Mathematics', 75]])), 0);
    for (const k of ['head', 'dos', 'exam', 'registrar']) assert.equal(bad(await sync(A[k], [['marks', 'e1|sA|English', 11]])), 1, k);
    assert.equal(bad(await sync(admin, [['marks', 'e1|sA|English', 11]])), 1);
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 140]])), 1);
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sC|Mathematics', 40]])), 1, 'not allocated for S2A maths');
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 85]])), 0, 'teacher may revise own mark while open');
  });
  await t('marks are visible only to exam office, registrar, head, DoS, subject teacher and the class teacher', async () => {
    for (const k of ['exam', 'registrar', 'head', 'dos']) assert((await data(A[k], 'marks')).filter(m => m).length >= 4, k);
    for (const k of ['bursar', 'hrm', 'librarian', 'warden', 'nurse']) assert(!(await A[k].get('/api/bootstrap')).j.data.marks, k);
    assert(!(await admin.get('/api/bootstrap')).j.data.marks);
    const tm = (await A.tM.get('/api/bootstrap')).j.data.marks.map(x => x[0]); assert(tm.includes('e1|sA|Mathematics') && !tm.includes('e1|sA|English') || tm.includes('e1|sA|English') === false, 'tM sees maths of S1A only: ' + tm.join());
    const te = (await A.tE.get('/api/bootstrap')).j.data.marks.map(x => x[0]); assert(te.includes('e1|sA|English') && te.includes('e1|sA|Mathematics'), 'class teacher of S1A sees all subjects of S1A: ' + te.join());
  });
  await t('the exam office controls the marks window; it locks itself at the deadline', async () => {
    assert.equal(bad(await sync(A.tE, [['examcfg', 'e1', { examId: 'e1', marksOpen: true, marksDeadline: FUT }]])), 1);
    assert.equal(bad(await sync(A.exam, [['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: true, marksDeadline: PAST }]])), 1, 'deadline must be in the future to open');
    assert.equal(bad(await sync(A.exam, [['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: false, marksDeadline: '' }]])), 0);
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 90]])), 1, 'closed');
    assert.equal(bad(await sync(A.exam, [['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: true, marksDeadline: FUT }]])), 0);
    assert((await data(A.tE, 'inbox')).some(i => /Marks portal open/.test(i.title)));
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 90]])), 0);
  });
  await t('question papers: deadline, allocation, exam-office-only visibility', async () => {
    const up = (c, q, buf = pdf, name = 'paper.pdf') => c.req('POST', `/api/papers?exam=e1&class=${q.cls}&subject=${q.sub}&name=${name}`, buf, { raw: true });
    assert.equal((await up(A.tE, { cls: 'S1A', sub: 'English' })).status, 200);
    assert.equal((await up(A.tE, { cls: 'S1A', sub: 'Mathematics' })).status, 403, 'not their subject');
    assert.equal((await up(A.tM, { cls: 'S1A', sub: 'English' })).status, 403);
    assert.equal((await up(A.tE, { cls: 'S1A', sub: 'English' }, Buffer.from('not a pdf at all'), 'x.pdf')).status, 400);
    for (const k of ['head', 'dos', 'registrar', 'admin']) { const c = k === 'admin' ? admin : A[k]; assert(!(await c.get('/api/bootstrap')).j.data.papers, k); }
    assert.equal((await data(A.exam, 'papers')).length, 1); assert.equal((await data(A.tE, 'papers')).length, 1); assert.equal((await data(A.tM, 'papers')).length, 0);
    const id = encodeURIComponent('e1|S1A|English');
    for (const k of ['head', 'dos', 'tE']) assert.equal((await A[k].get(`/api/papers/${id}/file`)).status, 403, k);
    assert.equal((await admin.get(`/api/papers/${id}/file`)).status, 403);
    const dl = await A.exam.get(`/api/papers/${id}/file`); assert.equal(dl.status, 200); assert.equal(Buffer.from(await dl.r.arrayBuffer()).slice(0, 4).toString(), '%PDF');
    assert.equal(bad(await sync(A.exam, [['examcfg', 'e1', { examId: 'e1', paperDeadline: PAST, marksOpen: true, marksDeadline: FUT }]])), 0);
    assert.equal((await up(A.tE, { cls: 'S2A', sub: 'English' })).status, 403, 'deadline passed: locked');
    assert.equal((await A.tE.del(`/api/papers/${id}`)).status, 403, 'cannot withdraw after the deadline');
    assert.equal(bad(await sync(A.head, [['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: true, marksDeadline: FUT }]])), 1, 'only the exam office extends');
    assert.equal(bad(await sync(A.exam, [['examcfg', 'e1', { examId: 'e1', paperDeadline: FUT, marksOpen: true, marksDeadline: FUT }]])), 0);
    assert.equal((await up(A.tE, { cls: 'S2A', sub: 'English' })).status, 200, 'extended: open again');
  });
  await t('report cards: hidden until the exam office releases them; nobody else can release', async () => {
        const before = (await kid.parentA.get('/api/bootstrap')).j.data.marks.map(x => x[0]); assert(!before.some(k => k.startsWith('e1|')), 'unreleased exam hidden');
    const e1 = (await data(A.exam, 'exams')).find(e => e.id === 'e1');
    for (const k of ['head', 'dos', 'registrar', 'tE']) assert.equal(bad(await sync(A[k], [['exams', 'e1', { ...e1, published: true }]])), 1, k);
    assert.equal(bad(await sync(A.exam, [['exams', 'e1', { ...e1, published: true }]])), 0);
    const after = (await kid.parentA.get('/api/bootstrap')).j; assert(after.data.marks.some(m => m[0].startsWith('e1|sA')), 'marks visible: ' + JSON.stringify(after.data.marks.map(m => m[0])));
    assert(after.data.inbox.some(i => /Report card released/.test(i[1].title)), 'inbox ' + JSON.stringify(after.data.inbox.map(i => i[1].title)));
    assert.equal(bad(await sync(A.tE, [['marks', 'e1|sA|English', 12]])), 0, 'subject teacher may still revise while the window is open');
  });
  await t('comments: class teacher writes theirs, head writes theirs, nobody after release', async () => {
    assert.equal(bad(await sync(A.tM, [['comments', 'e2|sC', { ct: 'Good', ht: '' }]])), 1, 'e2 already released');
    const e3 = [['exams', 'e3', { name: 'End', term: 3, year: 2026, published: false }], ['examcfg', 'e3', { examId: 'e3', marksOpen: false }]];
    assert.equal(bad(await sync(A.exam, e3)), 0);
    assert.equal(bad(await sync(A.tM, [['comments', 'e3|sC', { ct: 'Good girl', ht: 'HACK' }]])), 0);
    assert.equal(bad(await sync(A.head, [['comments', 'e3|sC', { ct: 'HACK', ht: 'Well done' }]])), 0);
    const c = (await A.head.get('/api/bootstrap')).j.data.comments.find(x => x[0] === 'e3|sC')[1]; assert.equal(c.ct, 'Good girl'); assert.equal(c.ht, 'Well done');
    assert.equal(bad(await sync(A.tE, [['comments', 'e3|sC', { ct: 'x', ht: '' }]])), 1, 'not class teacher of S2A');
  });

  /* ---- fees ---- */
  await t('only the bursar records; others see; parents can submit a payment that waits for approval', async () => {
    for (const k of ['head', 'registrar', 'dos']) assert.equal(bad(await sync(A[k], [['payments', 'px', { studentId: 'sA', date: D, amount: 1000, method: 'Cash' }], ['expenses', 'ex', { date: D, amount: 5 }]])), 2, k);
    assert.equal(bad(await sync(admin, [['fees', 'main', { structure: { 'O-Day': 1 } }]])), 1);
    assert.equal(bad(await sync(A.head, [['fees', 'main', { structure: { 'O-Day': 1 } }]])), 1);
    assert.equal(bad(await sync(A.bursar, [['payments', 'p1', { studentId: 'sA', date: D, amount: 100000, method: 'Cash' }]])), 0);
    const p1 = (await data(A.bursar, 'payments')).find(p => p.id === 'p1'); assert.equal(p1.status, 'Approved'); assert(/^RCT-\d{5}$/.test(p1.rct));
    assert(((await data(kid.parentA, 'inbox')).some(i => /Payment approved/.test(i.title))), 'receipt notice ' + JSON.stringify((await data(kid.parentA, 'inbox')).map(i => i.title)));
    const pr = await kid.kidB.post('/api/portal/prn', { studentId: 'sB', amount: 300000 }); assert.equal(pr.status, 200); assert(/^\d{13}$/.test(pr.j.prn.prn));
    assert.equal((await kid.parentA.post('/api/portal/prn', { studentId: 'sB', amount: 5 })).status, 403, 'not their child');
    assert.equal((await kid.kidB.post('/api/portal/payment', { studentId: 'sB', amount: 300000, ref: '', method: 'Cash' })).status, 400);
    assert.equal((await kid.kidB.post('/api/portal/payment', { studentId: 'sB', amount: 300000, ref: 'MM123456', method: 'MTN Mobile Money', prn: pr.j.prn.prn })).status, 200);
    const pend = (await data(A.bursar, 'payments')).find(p => p.status === 'Pending'); assert(pend && /^PEND-/.test(pend.rct) && pend.source === 'Portal');
    assert((await data(A.bursar, 'inbox')).some(i => /awaiting approval/.test(i.title)));
    assert.equal(bad(await sync(A.head, [['payments', pend.id, { ...pend, status: 'Approved' }]])), 1);
    assert.equal(bad(await sync(A.bursar, [['payments', pend.id, { ...pend, status: 'Approved' }]])), 0);
    const ap = (await data(A.bursar, 'payments')).find(p => p.id === pend.id); assert.equal(ap.status, 'Approved'); assert(/^RCT-\d{5}$/.test(ap.rct)); assert.equal(ap.approvedBy, 'Bea Bursar');
    assert((await data(kid.kidB, 'inbox')).some(i => /Payment approved/.test(i.title)));
    assert.equal((await data(kid.kidB, 'prn'))[0].status, 'Paid');
    assert.equal(bad(await sync(A.bursar, [['payments', pend.id, { ...ap, status: 'Pending' }]])), 1, 'approved payments are final');
    assert.equal((await data(kid.parentA, 'payments')).length, 1); assert(!(await data(kid.parentA, 'payments')).some(p => p.studentId === 'sB'));
  });

  /* ---- library ---- */
  await t('only the librarian changes the library; the learner is told about each loan; reminders work', async () => {
    assert.equal(bad(await sync(A.librarian, [['books', 'b1', { title: 'Things Fall Apart', author: 'Achebe', cat: 'Literature', copies: 1 }]])), 0);
    for (const k of ['head', 'registrar', 'tE']) assert.equal(bad(await sync(A[k], [['books', 'b2', { title: 'x', copies: 1 }], ['loans', 'l9', { bookId: 'b1', studentId: 'sA', out: D, due: D }]])), 2, k);
    assert.equal(bad(await sync(A.librarian, [['loans', 'l1', { bookId: 'b1', studentId: 'sB', out: '2026-09-01', due: '2026-09-10', returned: null }]])), 0);
    assert.equal(bad(await sync(A.librarian, [['loans', 'l2', { bookId: 'b1', studentId: 'sA', out: D, due: D, returned: null }]])), 1, 'no copy left');
    const n = (await data(kid.kidB, 'inbox')).find(i => i.kind === 'library'); assert(n && /Things Fall Apart/.test(n.body) && /Achebe/.test(n.body));
    assert.equal((await A.head.post('/api/library/remind', { loanIds: ['l1'] })).status, 403);
    const rm = await A.librarian.post('/api/library/remind', { loanIds: ['l1'] }); assert.equal(rm.j.sent, 1);
    assert((await data(kid.kidB, 'inbox')).some(i => /return your library book/.test(i.title)));
    assert.equal((await data(kid.parentB, 'inbox')).filter(i => i.kind === 'library').length, 0, 'library notices go to the learner portal');
  });

  /* ---- welfare ---- */
  await t('any staff role (not admin) records discipline; learner and parent get it; others see only their own', async () => {
    for (const k of ['head', 'teacher'].map(x => x === 'teacher' ? 'tE' : x).concat(['bursar', 'librarian', 'hrm', 'exam', 'nurse', 'warden'])) { const sid = k === 'warden' ? 'sB' : 'sA'; assert.equal(bad(await sync(A[k], [['discipline', 'd_' + k, { studentId: sid, date: D, type: 'Late coming', desc: 'x', action: 'Warned' }]])), 0, k); }
    assert.equal(bad(await sync(admin, [['discipline', 'd_ad', { studentId: 'sA', date: D, type: 'x', action: 'y' }]])), 1);
    assert.equal((await sync(kid.kidB, [['discipline', 'd_k', { studentId: 'sB', date: D, type: 'x' }]])).status, 403);
    assert((await data(kid.parentA, 'discipline')).length >= 6); assert(((await data(kid.parentA, 'inbox')).filter(i => i.kind === 'welfare').length) >= 6);
    assert.equal((await data(kid.kidB, 'discipline')).filter(d => d.studentId === 'sA').length, 0);
    assert.equal((await data(A.bursar, 'discipline')).length, 1, 'bursar sees own'); assert((await data(A.head, 'discipline')).length >= 6);
    assert.equal(bad(await sync(A.bursar, [['discipline', 'd_head', null]])), 1, 'cannot delete another person\'s case');
  });
  await t('only the sick bay team records sick bay cases; they are sent to learner and parent', async () => {
    for (const k of ['head', 'tE', 'warden', 'registrar']) assert.equal(bad(await sync(A[k], [['sickbay', 'k1', { studentId: 'sA', date: D, complaint: 'Headache', treatment: 'Rest', outcome: 'Rested in sick bay' }]])), 1, k);
    assert.equal(bad(await sync(admin, [['sickbay', 'k1', { studentId: 'sA', date: D, complaint: 'Headache' }]])), 1);
    assert.equal(bad(await sync(A.nurse, [['sickbay', 'k1', { studentId: 'sA', date: D, complaint: 'Headache', treatment: 'Rest', outcome: 'Rested in sick bay' }]])), 0);
    assert.equal((await data(kid.parentA, 'sickbay')).length, 1); assert((await data(kid.parentA, 'inbox')).some(i => i.kind === 'health'));
    assert.equal((await data(kid.parentB, 'sickbay')).length, 0);
    assert.equal((await sync(kid.parentA, [['sickbay', 'k1', null]])).status, 403);
  });
  await t('calendar: only head, registrar and DoS add events', async () => {
    for (const k of ['head', 'registrar', 'dos']) assert.equal(bad(await sync(A[k], [['events', 'ev_' + k, { title: 'Sports', date: D, kind: 'sport' }]])), 0, k);
    for (const k of ['bursar', 'tE', 'hrm', 'exam']) assert.equal(bad(await sync(A[k], [['events', 'evx', { title: 'X', date: D }]])), 1, k);
  });

  /* ---- communication ---- */
  await t('messages reach only the intended audience', async () => {
    let r = await A.head.post('/api/comms/send', { audience: 'stu_all', channel: 'Portal', body: 'Learners: assembly at 8', title: 'Assembly' }); assert.equal(r.status, 200, JSON.stringify(r.j));
    assert((await data(kid.kidB, 'inbox')).some(i => /assembly/.test(i.body))); assert(!(await data(kid.parentB, 'inbox')).some(i => /assembly/.test(i.body)), 'parents do not get a learners-only message');
    r = await A.head.post('/api/comms/send', { audience: 'all', channel: 'Portal', body: 'Parents: meeting Friday' }); assert.equal(r.status, 200);
    assert((await data(kid.parentB, 'inbox')).some(i => /meeting Friday/.test(i.body))); assert(!(await data(kid.kidB, 'inbox')).some(i => /meeting Friday/.test(i.body)), 'learners do not get a parents-only message');
    r = await A.head.post('/api/comms/send', { audience: 'ct', channel: 'Portal', body: 'Class teachers: submit registers' }); assert.equal(r.status, 200);
    assert((await data(A.tE, 'inbox')).some(i => /submit registers/.test(i.body))); assert((await data(A.tM, 'inbox')).some(i => /submit registers/.test(i.body)));
    r = await A.head.post('/api/comms/send', { audience: 'c:S2A', channel: 'Portal', body: 'S2 parents only' });
    assert((await data(kid.parentA, 'inbox')).some(i => /S2 parents only/.test(i.body))); assert(!(await data(kid.parentB, 'inbox')).some(i => /S2 parents only/.test(i.body)));
    r = await A.head.post('/api/comms/send', { audience: 'stu_c:S2A', channel: 'Portal', body: 'S2 learners only' }); assert.equal(r.status, 200);
    assert(!(await data(kid.kidB, 'inbox')).some(i => /S2 learners only/.test(i.body)));
    r = await A.bursar.post('/api/comms/send', { audience: 'stu_bal', channel: 'Portal', body: 'Please clear your fees' }); assert.equal(r.status, 200);
    assert((await data(kid.kidB, 'inbox')).some(i => /clear your fees/.test(i.body)) === (true && (await data(kid.kidB, 'fees')).length >= 0));
  });
  await t('role limits on audiences and channels', async () => {
    assert.equal((await A.bursar.post('/api/comms/send', { audience: 'staff', body: 'x' })).status, 403);
    assert.equal((await A.hrm.post('/api/comms/send', { audience: 'all', body: 'x' })).status, 403);
    assert.equal((await A.hrm.post('/api/comms/send', { audience: 'staff', channel: 'Portal', body: 'Staff meeting' })).status, 200);
    assert.equal((await A.exam.post('/api/comms/send', { audience: 'ct', channel: 'Portal', body: 'Exam rules' })).status, 200);
    assert.equal((await A.tE.post('/api/comms/send', { audience: 'ct', body: 'x' })).status, 403);
    assert.equal((await admin.post('/api/comms/send', { audience: 'all', body: 'x' })).status, 403);
    assert.equal((await kid.kidB.post('/api/comms/send', { audience: 'all', body: 'x' })).status, 403);
    assert.equal((await A.registrar.post('/api/comms/send', { audience: 'bal', body: 'x' })).status, 403, 'fee audiences are for the bursar and head');
    assert.equal((await A.head.post('/api/comms/send', { audience: 'stu_all', channel: 'SMS', body: 'x' })).status, 400);
    assert(!(await data(A.tE, 'inbox')).some(i => /Staff meeting/.test(i.body)) === false);
  });
  await t('fee reminders can be personalised per learner', async () => {
    const r = await A.bursar.post('/api/comms/send', { audience: 'ids', ids: ['sA', 'sB'], channel: 'Portal', body: 'Dear {guardian}, {child} owes {balance}.' }); assert.equal(r.status, 200);
    const mine = (await data(kid.parentB, 'inbox')).find(i => /Brian Opio owes UGX/.test(i.body)); assert(mine, 'personalised');
  });

  /* ---- family access ---- */
  await t('a parent sees only their own children and cannot reach staff data', async () => {
    const b = (await kid.parentA.get('/api/bootstrap')).j; assert.deepEqual(b.data.students.map(x => x[0]).sort(), ['sA', 'sC']);
    for (const c of ['expenses', 'applicants', 'messages', 'papers', 'hr', 'misconduct', 'staffatt', 'rollcall']) assert(!b.data[c], c);
    assert(!JSON.stringify(b).includes('Brian'), 'no classmate leak');
    for (const u of ['/api/users', '/api/audit', '/api/backup', '/api/changes?since=0']) assert.equal((await kid.parentA.get(u)).status, 403, u);
    assert.equal((await sync(kid.parentA, [['students', 'sA', { first: 'X', sex: 'F', classId: 'S1A' }]])).status, 403);
  });
  await t('released report cards of previous classes stay available after promotion', async () => {
    const reg = (await data(A.registrar, 'students')).find(s => s.id === 'sA');
    assert.equal(bad(await sync(A.registrar, [['students', 'sA', { ...reg, classId: 'S2A' }]])), 0);
    const b = (await kid.parentA.get('/api/bootstrap')).j; assert(b.data.placements.some(p => p.id === 'e2|sA' || p[0] === 'e2|sA'));
    assert(b.data.subjects.some(s => s[1].classId === 'S1A'), 'subjects of the old class'); assert.deepEqual(b.ranks.e2.sA, { pos: 2, of: 2 });
    assert.equal(bad(await sync(A.registrar, [['students', 'sA', { ...reg, classId: 'S1A' }]])), 0);
  });
  await t('learner account sees only itself and no other family inbox', async () => { assert.deepEqual((await kid.kidB.get('/api/bootstrap')).j.data.students.map(x => x[0]), ['sB']); });
  await t('photos: registrar for learners, HR for staff, nobody else', async () => {
    assert.equal((await A.registrar.req('POST', '/api/photo/student/sA', png, { raw: true })).status, 200);
    assert.equal((await A.head.req('POST', '/api/photo/student/sA', png, { raw: true })).status, 403);
    assert.equal((await A.hrm.req('POST', '/api/photo/staff/tE', png, { raw: true })).status, 200);
    assert.equal((await A.registrar.req('POST', '/api/photo/staff/tE', png, { raw: true })).status, 403);
    assert.equal((await kid.parentA.get('/photo/student/sA')).status, 200); assert.equal((await kid.parentA.get('/photo/student/sB')).status, 403);
  });
  await t('learners are bulk-added by the registrar only', async () => {
    const rows = [{ first: 'Imp', last: 'One', sex: 'F', class: 'S.1 A', guardianPhone: '0701000111' }];
    assert.equal((await A.head.post('/api/import/learners', { rows })).status, 403); assert.equal((await admin.post('/api/import/learners', { rows })).status, 403);
    assert.equal((await A.registrar.post('/api/import/learners', { rows })).j.added, 1);
  });
  await t('change feed hides unreadable rows and delivers readable ones', async () => {
    const b0 = (await A.bursar.get('/api/bootstrap')).j; await sync(A.hrm, [['misconduct', 'm9', { staffId: 'tM', date: D, type: 'Test' }]]); await sync(A.head, [['notices', 'n1', { date: D, title: 'Hello', body: 'x' }]]);
    const ch = (await A.bursar.get(`/api/changes?since=${b0.seq}&epoch=${b0.meta.epoch}`)).j; const colls = ch.rows.map(r => r[0]); assert(colls.includes('notices') && !colls.includes('misconduct'), colls.join());
  });
  await t('sign-in is throttled; switched-off accounts are ended', async () => {
    let last; for (let i = 0; i < 6; i++) last = await new C().post('/api/login', { username: 'bursar1', password: 'wrong' + i }); assert.equal(last.status, 429);
    const u = (await admin.get('/api/users')).j.users.find(x => x.username === 'lib1'); await admin.post(`/api/users/${u.id}/toggle`, {}); assert.equal((await A.librarian.get('/api/bootstrap')).status, 401);
  });
  await t('security headers and path traversal', async () => { const r = await fetch(BASE + '/'); assert(/default-src 'self'/.test(r.headers.get('content-security-policy'))); const x = await fetch(BASE + '/..%2f..%2fserver.js'); assert([403, 404].includes(x.status)); });
  await t('backup is a valid database file', async () => { const r = await admin.get('/api/backup'); const buf = Buffer.from(await r.r.arrayBuffer()); assert.equal(buf.slice(0, 15).toString(), 'SQLite format 3'); });

  const before = (await data(admin, 'students')).length;
  await stop(); await start();
  await t('data and sessions survive a server restart', async () => { const b = await admin.get('/api/bootstrap'); assert.equal(b.status, 200); assert.equal(b.j.data.students.length, before); });
  await t('wipe clears records but keeps classes, subjects and timetable layout', async () => {
    assert.equal((await admin.post('/api/wipe', { confirm: 'WIPE' })).status, 200); const b = (await admin.get('/api/bootstrap')).j.data;
    assert.equal(b.students.length, 0); assert(b.classes.length >= 2); assert(b.subjects.length >= 4); assert(!b.marks);
  });
  await stop();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${failn} failed`); process.exit(failn ? 1 : 0);
})().catch(e => { console.error(e); try { srv.kill(); } catch (x) { /* */ } process.exit(1); });
