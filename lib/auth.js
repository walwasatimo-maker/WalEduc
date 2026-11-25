'use strict';
const crypto = require('crypto');

const hex = n => crypto.randomBytes(n).toString('hex');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const digits = s => String(s || '').replace(/\D/g, '');

function scrypt(pw, salt) {
  return new Promise((res, rej) => crypto.scrypt(String(pw).normalize('NFKC'), Buffer.from(salt, 'hex'), 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => e ? rej(e) : res(k)));
}
async function hashPw(pw) { const salt = hex(16); return { salt, hash: (await scrypt(pw, salt)).toString('hex') }; }
async function verifyPw(pw, salt, hash) {
  try { const k = await scrypt(pw, salt), h = Buffer.from(hash, 'hex'); return h.length === k.length && crypto.timingSafeEqual(k, h); } catch (e) { return false; }
}
function pwError(pw, username) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Use at least 8 characters for the password.';
  if (pw.length > 200) return 'That password is too long.';
  if (username && pw.toLowerCase() === String(username).toLowerCase()) return 'The password cannot be the same as the username.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Mix letters and numbers in the password.';
  return null;
}
const WORDS = ['Mango', 'River', 'Lake', 'Eagle', 'Maize', 'Sunny', 'Nile', 'Drum', 'Acacia', 'Lion', 'Coffee', 'Banana', 'Rain', 'Hill', 'Stone', 'Zebra'];
const tempPw = () => WORDS[crypto.randomInt(WORDS.length)] + WORDS[crypto.randomInt(WORDS.length)] + crypto.randomInt(100, 999);
function recoveryCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 16; i++) { s += a[crypto.randomInt(a.length)]; if (i % 4 === 3 && i < 15) s += '-'; } return s; }
function parseCookies(h) { const o = {}; String(h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }

const IDLE = 20 * 60 * 1000, ABSOLUTE = 12 * 3600 * 1000;
function createSessions(store) {
  const db = store.db;
  const ins = db.prepare('INSERT INTO sessions (hash, sid, user_id, must, created, last, ip, ua) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const get = db.prepare('SELECT s.*, u.username, u.name, u.role, u.owners, u.staff_id, u.active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.hash = ?');
  const touch = db.prepare('UPDATE sessions SET last = ? WHERE hash = ?');
  const del = db.prepare('DELETE FROM sessions WHERE hash = ?');
  return {
    create(userId, must, ip, ua) { const token = hex(32); ins.run(sha(token), hex(6), userId, must ? 1 : 0, Date.now(), Date.now(), String(ip).slice(0, 60), String(ua).slice(0, 200)); return token; },
    get(token, touchIt = true) {
      if (!token || token.length < 32) return null;
      const r = get.get(sha(token)); if (!r) return null;
      const now = Date.now();
      if (!r.active || now - r.last > IDLE || now - r.created > ABSOLUTE) { del.run(r.hash); return null; }
      if (touchIt && now - r.last > 30000) touch.run(now, r.hash);
      let owners = []; try { owners = JSON.parse(r.owners || '[]'); } catch (e) { /* none */ }
      return { hash: r.hash, sid: r.sid, must: !!r.must, user: { id: r.user_id, username: r.username, name: r.name, role: r.role, owners, staffId: r.staff_id } };
    },
    destroy(token) { del.run(sha(token)); },
    destroyUser(id) { db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id); },
    destroyOthers(id, keep) { db.prepare('DELETE FROM sessions WHERE user_id = ? AND hash != ?').run(id, keep); },
    clearMust(hash) { db.prepare('UPDATE sessions SET must = 0 WHERE hash = ?').run(hash); },
    prune() { const n = Date.now(); db.prepare('DELETE FROM sessions WHERE last < ? OR created < ?').run(n - IDLE, n - ABSOLUTE); }
  };
}
function createLimiter() {
  const m = new Map();
  return {
    check(k) { const e = m.get(k); return e && e.until > Date.now() ? Math.ceil((e.until - Date.now()) / 1000) : 0; },
    fail(k, max, lockMs) { const e = m.get(k) || { n: 0, until: 0, t: Date.now() }; if (Date.now() - e.t > 15 * 60000) { e.n = 0; e.t = Date.now(); } e.n++; if (e.n >= max) { e.until = Date.now() + lockMs; e.n = 0; } m.set(k, e); },
    ok(k) { m.delete(k); },
    sweep() { const n = Date.now(); for (const [k, e] of m) if (e.until < n && n - e.t > 15 * 60000) m.delete(k); }
  };
}
module.exports = { hashPw, verifyPw, pwError, tempPw, recoveryCode, parseCookies, digits, createSessions, createLimiter, hex, IDLE };
