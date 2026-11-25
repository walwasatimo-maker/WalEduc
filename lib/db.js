'use strict';
/* WalEduc database layer.
   A normalised SQLite schema (foreign keys, CHECK constraints, indexes) with a thin mapping layer that
   presents each table to the application as "records" (the shapes the web app already uses).
   Uses the SQLite module built into Node.js 22.13+, so there is nothing to install. */
const fs = require('fs');
const path = require('path');
const _emit = process.emitWarning;
process.emitWarning = function (w, ...a) { const m = typeof w === 'string' ? w : (w && w.message) || ''; if (/SQLite is an experimental/i.test(m)) return; return _emit.call(process, w, ...a); };
const { DatabaseSync } = require('node:sqlite');

/* ------------------------------------------------------------------ schema */
const SCHEMA_V1 = `
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0);
CREATE TABLE files (key TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE audit (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, user TEXT NOT NULL, text TEXT NOT NULL);
CREATE TABLE tombstones (coll TEXT NOT NULL, id TEXT NOT NULL, seq INTEGER NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX idx_tomb_seq ON tombstones(seq);

CREATE TABLE staff (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  sex TEXT NOT NULL DEFAULT 'M' CHECK (sex IN ('M','F')),
  type TEXT NOT NULL DEFAULT 'Teaching' CHECK (type IN ('Teaching','Non-teaching')),
  role TEXT NOT NULL DEFAULT 'Teacher', dept TEXT NOT NULL DEFAULT '',
  subjects TEXT NOT NULL DEFAULT '[]', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  joined TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On leave','Left')),
  photo_v INTEGER, seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  owners TEXT NOT NULL DEFAULT '[]',
  staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  salt TEXT NOT NULL, hash TEXT NOT NULL,
  must INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT, created TEXT NOT NULL
);
CREATE TABLE sessions (
  hash TEXT PRIMARY KEY, sid TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  must INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, last INTEGER NOT NULL, ip TEXT, ua TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE TABLE classes (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('O','A')), form INTEGER NOT NULL, stream TEXT NOT NULL DEFAULT '',
  teacher_id TEXT REFERENCES staff(id) ON DELETE SET NULL, seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE dorms (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, sex TEXT NOT NULL CHECK (sex IN ('M','F')),
  cap INTEGER NOT NULL DEFAULT 40, seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE students (
  id TEXT PRIMARY KEY, adm TEXT NOT NULL UNIQUE,
  first TEXT NOT NULL, last TEXT NOT NULL DEFAULT '',
  sex TEXT NOT NULL CHECK (sex IN ('M','F')), dob TEXT NOT NULL DEFAULT '',
  class_id TEXT NOT NULL REFERENCES classes(id) ON UPDATE CASCADE,
  boarding TEXT NOT NULL DEFAULT 'Day' CHECK (boarding IN ('Day','Boarding')),
  dorm_id TEXT REFERENCES dorms(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Suspended','Transferred','Withdrawn','Completed')),
  address TEXT NOT NULL DEFAULT '', medical TEXT NOT NULL DEFAULT '',
  bursary INTEGER NOT NULL DEFAULT 0 CHECK (bursary >= 0), arrears INTEGER NOT NULL DEFAULT 0 CHECK (arrears >= 0),
  g_name TEXT NOT NULL DEFAULT '', g_phone TEXT NOT NULL DEFAULT '', g_rel TEXT NOT NULL DEFAULT '',
  photo_v INTEGER, seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_gphone ON students(g_phone);
CREATE INDEX idx_students_seq ON students(seq);
CREATE TABLE applicants (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, sex TEXT NOT NULL CHECK (sex IN ('M','F')), dob TEXT NOT NULL DEFAULT '',
  applying_for TEXT NOT NULL DEFAULT 'S1', prev_school TEXT NOT NULL DEFAULT '',
  guardian TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'Applied' CHECK (stage IN ('Applied','Interview','Admitted','Enrolled','Declined')),
  date TEXT NOT NULL DEFAULT '', student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE exams (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, term INTEGER NOT NULL CHECK (term BETWEEN 1 AND 3), year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
  published INTEGER NOT NULL DEFAULT 0, seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE marks (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL, score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  seq INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (exam_id, student_id, subject)
);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_seq ON marks(seq);
CREATE TABLE comments (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ct TEXT NOT NULL DEFAULT '', ht TEXT NOT NULL DEFAULT '', seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, student_id)
);
CREATE TABLE attendance (
  date TEXT NOT NULL, student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mark TEXT NOT NULL CHECK (mark IN ('P','L','A')), seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, student_id)
);
CREATE INDEX idx_att_student ON attendance(student_id, date);
CREATE INDEX idx_att_seq ON attendance(seq);
CREATE TABLE timetable (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 4), period INTEGER NOT NULL CHECK (period BETWEEN 0 AND 11),
  subject TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (class_id, day, period)
);
CREATE TABLE payments (
  id TEXT PRIMARY KEY, rct TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  date TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'Cash', ref TEXT NOT NULL DEFAULT '', by_user TEXT NOT NULL DEFAULT '',
  seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_pay_student ON payments(student_id);
CREATE INDEX idx_pay_seq ON payments(seq);
CREATE TABLE expenses (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Other', descr TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL CHECK (amount > 0), by_user TEXT NOT NULL DEFAULT '', seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE books (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL DEFAULT '', cat TEXT NOT NULL DEFAULT 'Other',
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0), seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE loans (
  id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  out_date TEXT NOT NULL, due TEXT NOT NULL, returned TEXT, seq INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_loans_student ON loans(student_id);
CREATE TABLE discipline (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Other', descr TEXT NOT NULL DEFAULT '', action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Resolved')), seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE sickbay (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL, complaint TEXT NOT NULL DEFAULT '', treatment TEXT NOT NULL DEFAULT '', outcome TEXT NOT NULL DEFAULT '',
  seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'term' CHECK (kind IN ('term','exam','sport','holiday')),
  details TEXT NOT NULL DEFAULT '', seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE notices (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  by_user TEXT NOT NULL DEFAULT '', seq INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE messages (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, channel TEXT NOT NULL, audience TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL DEFAULT 0, body TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Recorded',
  by_user TEXT NOT NULL DEFAULT '', seq INTEGER NOT NULL DEFAULT 0
);
`;

/* Version 2: new roles and workflows. Adds a general document table, new columns, a wider timetable,
   and upgrades the data of an existing v1 database in place. */
const SCHEMA_V2 = `
CREATE TABLE docs (
  coll TEXT NOT NULL, id TEXT NOT NULL, ref TEXT, data TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (coll, id)
);
CREATE INDEX idx_docs_seq ON docs(seq);
CREATE INDEX idx_docs_ref ON docs(coll, ref);
ALTER TABLE staff ADD COLUMN duties TEXT NOT NULL DEFAULT '[]';
ALTER TABLE students ADD COLUMN prev_school TEXT NOT NULL DEFAULT '';
ALTER TABLE students ADD COLUMN applied_on TEXT NOT NULL DEFAULT '';
ALTER TABLE students ADD COLUMN admitted_on TEXT NOT NULL DEFAULT '';
ALTER TABLE applicants ADD COLUMN interview_at TEXT NOT NULL DEFAULT '';
ALTER TABLE applicants ADD COLUMN interview_venue TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN status TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE payments ADD COLUMN prn TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN approved_by TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN approved_on TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN source TEXT NOT NULL DEFAULT 'Bursar';
ALTER TABLE discipline ADD COLUMN by_user TEXT NOT NULL DEFAULT '';
ALTER TABLE discipline ADD COLUMN by_id TEXT NOT NULL DEFAULT '';
ALTER TABLE sickbay ADD COLUMN by_user TEXT NOT NULL DEFAULT '';
ALTER TABLE messages ADD COLUMN by_id TEXT NOT NULL DEFAULT '';
CREATE TABLE timetable_new (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6), period INTEGER NOT NULL CHECK (period BETWEEN 0 AND 15),
  subject TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (class_id, day, period)
);
INSERT INTO timetable_new SELECT class_id, day, period, subject, seq FROM timetable;
DROP TABLE timetable;
ALTER TABLE timetable_new RENAME TO timetable;
`;
const DEFAULT_SLOTS = [
  { type: 'lesson', from: '08:00', to: '08:40' }, { type: 'lesson', from: '08:40', to: '09:20' }, { type: 'lesson', from: '09:20', to: '10:00' },
  { type: 'break', from: '10:00', to: '10:30', label: 'BREAK' },
  { type: 'lesson', from: '10:30', to: '11:10' }, { type: 'lesson', from: '11:10', to: '11:50' }, { type: 'lesson', from: '11:50', to: '12:30' },
  { type: 'break', from: '12:30', to: '14:00', label: 'LUNCH' },
  { type: 'lesson', from: '14:00', to: '14:40' }, { type: 'lesson', from: '14:40', to: '15:20' }];
const DEFAULT_SUBJECTS = {
  O: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'CRE'],
  ARTS: ['General Paper', 'Sub-ICT', 'History', 'Economics', 'Literature', 'Geography'],
  SCI: ['General Paper', 'Sub-ICT', 'Physics', 'Chemistry', 'Biology', 'Mathematics']
};
function upgradeV2(db) {
  db.exec(SCHEMA_V2);
  const put = (coll, id, ref, data) => db.prepare('INSERT OR REPLACE INTO docs (coll, id, ref, data, seq) VALUES (?, ?, ?, ?, 0)').run(coll, id, ref, JSON.stringify(data));
  const classes = db.prepare('SELECT * FROM classes ORDER BY rowid').all();
  const staff = db.prepare("SELECT * FROM staff WHERE type = 'Teaching'").all().map(t => ({ id: t.id, subjects: (() => { try { return JSON.parse(t.subjects || '[]'); } catch (e) { return []; } })() }));
  /* per-class subject lists with the teacher the old version derived */
  classes.forEach((c, ci) => {
    const list = c.level === 'O' ? DEFAULT_SUBJECTS.O : (c.stream === 'Sciences' ? DEFAULT_SUBJECTS.SCI : DEFAULT_SUBJECTS.ARTS);
    for (const name of list) {
      const ts = staff.filter(t => t.subjects.includes(name));
      const teacherId = ts.length ? ts[ci % ts.length].id : '';
      const id = `${c.id}|${name}`;
      put('subjects', id, c.id, { id, classId: c.id, name, teacherId, periods: 4 });
    }
  });
  /* default timetable layout, matching the old fixed grid */
  put('ttcfg', 'main', null, { id: 'main', days: [0, 1, 2, 3, 4], slots: [
    { type: 'lesson', from: '08:00', to: '08:40' }, { type: 'lesson', from: '08:40', to: '09:20' }, { type: 'lesson', from: '09:20', to: '10:00' },
    { type: 'break', from: '10:00', to: '10:30', label: 'BREAK' },
    { type: 'lesson', from: '10:30', to: '11:10' }, { type: 'lesson', from: '11:10', to: '11:50' }, { type: 'lesson', from: '11:50', to: '12:30' },
    { type: 'break', from: '12:30', to: '14:00', label: 'LUNCH' },
    { type: 'lesson', from: '14:00', to: '14:40' }, { type: 'lesson', from: '14:40', to: '15:20' }] });
  /* exam settings: open sessions stay open, with no deadline, until the exam office decides */
  for (const e of db.prepare('SELECT * FROM exams').all()) put('examcfg', e.id, null, { id: e.id, examId: e.id, paperDeadline: '', marksOpen: e.status === 'Open', marksDeadline: '' });
  /* remember which class each learner was in when the marks were entered */
  db.exec(`INSERT OR IGNORE INTO docs (coll, id, ref, data, seq)
    SELECT 'placements', m.exam_id || '|' || m.student_id, m.student_id,
      json_object('id', m.exam_id || '|' || m.student_id, 'examId', m.exam_id, 'studentId', m.student_id, 'classId', s.class_id), 0
    FROM (SELECT DISTINCT exam_id, student_id FROM marks) m JOIN students s ON s.id = m.student_id`);
  /* applicants who were already enrolled: carry their application details across */
  db.exec(`UPDATE students SET prev_school = COALESCE((SELECT prev_school FROM applicants a WHERE a.student_id = students.id), ''),
    applied_on = COALESCE((SELECT date FROM applicants a WHERE a.student_id = students.id), '')`);
  /* make the next sign-in of every open browser reload everything */
  db.prepare("INSERT INTO meta (key, value) VALUES ('epoch', '1') ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1").run();
}
const MIGRATIONS = [SCHEMA_V1, upgradeV2];
const DOC_REF = {
  subjects: d => d.classId, hr: d => d.id, staffatt: d => d.staffId, misconduct: d => d.staffId, leaves: d => d.staffId,
  rollcall: d => d.studentId, examtt: d => d.classId, examcfg: d => d.examId, ttcfg: () => null, placements: d => d.studentId,
  inbox: d => d.to, prn: d => d.studentId, papers: d => d.teacherId
};
const DOC_COLLS = Object.keys(DOC_REF);


/* ------------------------------------------------- field mapping tables */
const D = /^\d{4}-\d{2}-\d{2}$/;
const S = (k, col, o) => ({ k, col, t: 's', ...o });
const N = (k, col, o) => ({ k, col, t: 'n', ...o });     /* '' <-> NULL */
const Z = (k, col, o) => ({ k, col, t: 'z', ...o });     /* null <-> NULL */
const I = (k, col, o) => ({ k, col, t: 'i', ...o });
const B = (k, col, o) => ({ k, col, t: 'b', ...o });
const J = (k, col, o) => ({ k, col, t: 'j', ...o });
const Dt = (k, col, o) => ({ k, col, t: 'd', ...o });
const Dz = (k, col, o) => ({ k, col, t: 'dz', ...o });
const ID = S('id', 'id', { max: 90, label: 'Id' });
const SEX = { enum: ['M', 'F'], label: 'Sex' };

const DEFS = {
  students: { table: 'students', photo: 'student', ref: 'id', fields: [ID, S('adm', 'adm', { max: 40, label: 'Admission number' }),
    S('first', 'first', { req: 1, max: 80, label: 'First name' }), S('last', 'last', { max: 80, label: 'Surname' }), S('sex', 'sex', { ...SEX, req: 1 }), Dt('dob', 'dob', { label: 'Date of birth' }),
    S('classId', 'class_id', { req: 1, max: 90, label: 'Class' }), S('boarding', 'boarding', { enum: ['Day', 'Boarding'], label: 'Section' }), N('dorm', 'dorm_id', { max: 90 }),
    S('status', 'status', { enum: ['Active', 'Suspended', 'Transferred', 'Withdrawn', 'Completed'], label: 'Status' }), S('address', 'address', { max: 200 }), S('medical', 'medical', { max: 2000 }),
    I('bursary', 'bursary', { min: 0, max: 1e9 }), I('arrears', 'arrears', { min: 0, max: 1e9 }),
    S('guardian.name', 'g_name', { max: 120, label: 'Guardian name' }), S('guardian.phone', 'g_phone', { max: 40, label: 'Guardian phone' }), S('guardian.rel', 'g_rel', { max: 40 }),
    S('prevSchool', 'prev_school', { max: 120 }), Dt('appliedOn', 'applied_on', {}), Dt('admittedOn', 'admitted_on', {})] },
  staff: { table: 'staff', photo: 'staff', ref: null, fields: [ID, S('name', 'name', { req: 1, max: 120, label: 'Name' }), S('sex', 'sex', SEX), S('type', 'type', { enum: ['Teaching', 'Non-teaching'] }),
    S('role', 'role', { max: 80 }), S('dept', 'dept', { max: 80 }), J('subjects', 'subjects', {}), S('phone', 'phone', { max: 40 }), S('email', 'email', { max: 120 }), Dt('joined', 'joined', {}),
    S('status', 'status', { enum: ['Active', 'On leave', 'Left'] }), J('duties', 'duties', {})] },
  classes: { table: 'classes', ref: null, fields: [ID, S('name', 'name', { req: 1, max: 80 }), S('level', 'level', { enum: ['O', 'A'], req: 1 }), I('form', 'form', { min: 1, max: 6 }), S('stream', 'stream', { max: 40 }), Z('teacherId', 'teacher_id', { max: 90 })] },
  dorms: { table: 'dorms', ref: null, fields: [ID, S('name', 'name', { req: 1, max: 80 }), S('sex', 'sex', { ...SEX, req: 1 }), I('cap', 'cap', { min: 1, max: 5000 })] },
  applicants: { table: 'applicants', ref: null, fields: [ID, S('name', 'name', { req: 1, max: 120 }), S('sex', 'sex', { ...SEX, req: 1 }), Dt('dob', 'dob', {}), S('applyingFor', 'applying_for', { max: 10 }),
    S('prevSchool', 'prev_school', { max: 120 }), S('guardian', 'guardian', { max: 120 }), S('phone', 'phone', { max: 40 }),
    S('stage', 'stage', { enum: ['Applied', 'Interview', 'Admitted', 'Enrolled', 'Declined'] }), Dt('date', 'date', {}), Z('studentId', 'student_id', { max: 90 }),
    Dt('interviewAt', 'interview_at', {}), S('interviewVenue', 'interview_venue', { max: 120 })] },
  exams: { table: 'exams', ref: null, fields: [ID, S('name', 'name', { req: 1, max: 80 }), I('term', 'term', { min: 1, max: 3 }), I('year', 'year', { min: 2000, max: 2100 }), S('status', 'status', { enum: ['Open', 'Closed'] }), B('published', 'published', {})] },
  payments: { table: 'payments', ref: 'student_id', fields: [ID, S('rct', 'rct', { max: 40 }), S('studentId', 'student_id', { req: 1, max: 90 }), Dt('date', 'date', { req: 1 }), I('amount', 'amount', { min: 1, max: 1e10, req: 1 }),
    S('method', 'method', { max: 40 }), S('ref', 'ref', { max: 80 }), S('by', 'by_user', { max: 120 }),
    S('status', 'status', { enum: ['Approved', 'Pending', 'Rejected'] }), S('prn', 'prn', { max: 30 }), S('approvedBy', 'approved_by', { max: 120 }), Dt('approvedOn', 'approved_on', {}), S('source', 'source', { max: 20 })] },
  expenses: { table: 'expenses', ref: null, fields: [ID, Dt('date', 'date', { req: 1 }), S('category', 'category', { max: 60 }), S('desc', 'descr', { max: 300 }), I('amount', 'amount', { min: 1, max: 1e10, req: 1 }), S('by', 'by_user', { max: 120 })] },
  books: { table: 'books', ref: null, fields: [ID, S('title', 'title', { req: 1, max: 200 }), S('author', 'author', { max: 150 }), S('cat', 'cat', { max: 60 }), I('copies', 'copies', { min: 0, max: 10000 })] },
  loans: { table: 'loans', ref: 'student_id', fields: [ID, S('bookId', 'book_id', { req: 1, max: 90 }), S('studentId', 'student_id', { req: 1, max: 90 }), Dt('out', 'out_date', { req: 1 }), Dt('due', 'due', { req: 1 }), Dz('returned', 'returned', {})] },
  discipline: { table: 'discipline', ref: 'student_id', fields: [ID, S('studentId', 'student_id', { req: 1, max: 90 }), Dt('date', 'date', { req: 1 }), S('type', 'type', { max: 60 }), S('desc', 'descr', { max: 2000 }), S('action', 'action', { max: 500 }), S('status', 'status', { enum: ['Open', 'Resolved'] }), S('by', 'by_user', { max: 120 }), S('byId', 'by_id', { max: 90 })] },
  sickbay: { table: 'sickbay', ref: 'student_id', fields: [ID, S('studentId', 'student_id', { req: 1, max: 90 }), Dt('date', 'date', { req: 1 }), S('complaint', 'complaint', { max: 300 }), S('treatment', 'treatment', { max: 500 }), S('outcome', 'outcome', { max: 100 }), S('by', 'by_user', { max: 120 })] },
  events: { table: 'events', ref: null, fields: [ID, S('title', 'title', { req: 1, max: 150 }), Dt('date', 'date', { req: 1 }), S('kind', 'kind', { enum: ['term', 'exam', 'sport', 'holiday'] }), S('details', 'details', { max: 1000 })] },
  notices: { table: 'notices', ref: null, fields: [ID, Dt('date', 'date', { req: 1 }), S('title', 'title', { req: 1, max: 150 }), S('body', 'body', { max: 4000 }), S('by', 'by_user', { max: 120 })] },
  messages: { table: 'messages', ref: null, fields: [ID, Dt('date', 'date', { req: 1 }), S('channel', 'channel', { max: 30 }), S('audience', 'audience', { max: 200 }), I('n', 'n', { min: 0, max: 1e6 }), S('body', 'body', { max: 4000 }), S('status', 'status', { max: 80 }), S('by', 'by_user', { max: 120 }), S('byId', 'by_id', { max: 90 })] }
};
const ROW_COLLS = Object.keys(DEFS);
for (const [name, d] of Object.entries(DEFS)) {
  d.name = name; d.byKey = Object.fromEntries(d.fields.map(f => [f.k, f]));
  d.cols = d.fields.map(f => f.col);
  d.upsert = null;
}
const getPath = (o, p) => { let v = o; for (const k of p.split('.')) { if (v == null) return undefined; v = v[k]; } return v; };
const setPath = (o, p, val) => { const ks = p.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]] = t[ks[i]] || {}; t[ks[ks.length - 1]] = val; };

/* Convert and validate one value. Returns { v } or { err }. */
function coerce(f, v) {
  const label = f.label || f.k;
  switch (f.t) {
    case 's': case 'n': case 'd': {
      if (v == null) v = '';
      if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
      if (typeof v !== 'string') return { err: `${label} must be text.` };
      v = v.trim();
      if (v.length > (f.max || 300)) return { err: `${label} is too long.` };
      if (f.req && !v) return { err: `${label} is required.` };
      if (f.enum && v === '') v = f.enum[0];
      if (f.enum && v !== '' && !f.enum.includes(v)) return { err: `${label} is not valid.` };
      if (f.t === 'd' && v !== '' && !D.test(v)) return { err: `${label} must be a date.` };
      return { v };
    }
    case 'z': case 'dz': {
      if (v == null || v === '') return { v: null };
      if (typeof v !== 'string' || v.length > (f.max || 90)) return { err: `${label} is not valid.` };
      if (f.t === 'dz' && !D.test(v)) return { err: `${label} must be a date.` };
      return { v };
    }
    case 'i': {
      if (v === '' || v == null) v = 0;
      v = Number(v);
      if (!Number.isFinite(v)) return { err: `${label} must be a number.` };
      v = Math.round(v);
      if (f.min !== undefined && v < f.min) return { err: `${label} must be at least ${f.min}.` };
      if (f.max !== undefined && v > f.max) return { err: `${label} is too large.` };
      return { v };
    }
    case 'b': return { v: v === true || v === 1 || v === '1' };
    case 'j': {
      if (v == null) return { v: [] };
      if (!Array.isArray(v) || v.length > 40 || !v.every(x => typeof x === 'string' && x.length <= 80)) return { err: `${label} is not valid.` };
      return { v: v.map(x => x.trim()).filter(Boolean) };
    }
    default: return { v };
  }
}

/* Validate a whole record, or just the supplied keys (partial). Returns { rec } or { err }. */
function validate(coll, rec, partial) {
  const d = DEFS[coll], out = {};
  for (const f of d.fields) {
    let raw = getPath(rec, f.k);
    if (raw === undefined) {
      if (partial) continue;
      raw = f.t === 'i' ? 0 : f.t === 'b' ? false : f.t === 'j' ? [] : (f.t === 'z' || f.t === 'dz') ? null : '';
    }
    const r = coerce(f, raw);
    if (r.err) return { err: r.err };
    setPath(out, f.k, r.v);
  }
  return { rec: out };
}

function rowToRec(d, row) {
  const rec = {};
  for (const f of d.fields) {
    let v = row[f.col];
    if (f.t === 'n') v = v == null ? '' : v;
    else if (f.t === 'b') v = !!v;
    else if (f.t === 'j') { try { v = JSON.parse(v || '[]'); } catch (e) { v = []; } }
    else if (f.t === 'i') v = v == null ? 0 : Number(v);
    else if (f.t === 's' || f.t === 'd') v = v == null ? '' : v;
    setPath(rec, f.k, v);
  }
  if (d.photo && row.photo_v) rec.photo = `/photo/${d.photo}/${row.id}?v=${row.photo_v}`;
  return rec;
}
function recToParams(d, rec) {
  return d.fields.map(f => {
    let v = getPath(rec, f.k);
    if (f.t === 'n') return v === '' || v == null ? null : v;
    if (f.t === 'b') return v ? 1 : 0;
    if (f.t === 'j') return JSON.stringify(v || []);
    if (f.t === 'z' || f.t === 'dz') return v == null || v === '' ? null : v;
    if (v === undefined) return f.t === 'i' ? 0 : '';
    return v;
  });
}

/* ------------------------------------------------------------ the store */
function open(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'walEduc.db');
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  const ver = db.prepare('PRAGMA user_version').get().user_version;
  for (let i = ver; i < MIGRATIONS.length; i++) {
    db.exec('BEGIN'); try { if (typeof MIGRATIONS[i] === 'function') MIGRATIONS[i](db); else db.exec(MIGRATIONS[i]); db.exec(`PRAGMA user_version = ${i + 1}`); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  const q = (sql) => db.prepare(sql);
  const st = {
    metaGet: q('SELECT value FROM meta WHERE key = ?'),
    metaSet: q('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    setGet: q('SELECT value FROM settings WHERE key = ?'),
    setAll: q("SELECT key, value FROM settings WHERE key LIKE ?"),
    setPut: q('INSERT INTO settings (key, value, seq) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, seq = excluded.seq'),
    setSince: q('SELECT key FROM settings WHERE seq > ? AND key LIKE ? LIMIT 1'),
    fileGet: q('SELECT mime, data FROM files WHERE key = ?'), filePut: q('INSERT INTO files (key, mime, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET mime = excluded.mime, data = excluded.data, updated = excluded.updated'),
    fileDel: q('DELETE FROM files WHERE key = ?'), fileDelPrefix: q("DELETE FROM files WHERE key LIKE ? || '%'"),
    auditIns: q('INSERT INTO audit (ts, user, text) VALUES (?, ?, ?)'), auditList: q('SELECT ts, user, text FROM audit ORDER BY id DESC LIMIT ?'),
    tombIns: q('INSERT INTO tombstones (coll, id, seq, ts) VALUES (?, ?, ?, ?)'), tombSince: q('SELECT coll, id FROM tombstones WHERE seq > ?')
  };
  let seqVal = Number(((st.metaGet.get('seq')) || {}).value || 0);
  const nextSeq = () => ++seqVal;
  const persistSeq = () => st.metaSet.run('seq', String(seqVal));
  const quote = c => `"${c}"`;
  for (const d of Object.values(DEFS)) {
    const cols = d.cols.map(quote).join(', '), ph = d.cols.map(() => '?').join(', ');
    const sets = d.cols.filter(c => c !== 'id').map(c => `${quote(c)} = excluded.${quote(c)}`).join(', ');
    d.sUpsert = q(`INSERT INTO ${d.table} (${cols}, seq) VALUES (${ph}, ?) ON CONFLICT(id) DO UPDATE SET ${sets}, seq = excluded.seq`);
    d.sGet = q(`SELECT * FROM ${d.table} WHERE id = ?`);
    d.sAll = q(`SELECT * FROM ${d.table}`);
    d.sSince = q(`SELECT * FROM ${d.table} WHERE seq > ?`);
    d.sDel = q(`DELETE FROM ${d.table} WHERE id = ?`);
    d.sWipe = q(`DELETE FROM ${d.table}`);
  }
  const DQ = {
    up: q('INSERT INTO docs (coll, id, ref, data, seq) VALUES (?, ?, ?, ?, ?) ON CONFLICT(coll, id) DO UPDATE SET ref = excluded.ref, data = excluded.data, seq = excluded.seq'),
    get: q('SELECT * FROM docs WHERE coll = ? AND id = ?'), all: q('SELECT * FROM docs WHERE coll = ?'), since: q('SELECT * FROM docs WHERE seq > ?'),
    del: q('DELETE FROM docs WHERE coll = ? AND id = ?'), wipe: q('DELETE FROM docs WHERE coll = ?')
  };
  const docRow = r => ({ id: r.id, ref: r.ref, data: JSON.parse(r.data) });
  const C = {
    marksUp: q('INSERT INTO marks (exam_id, student_id, subject, score, seq) VALUES (?, ?, ?, ?, ?) ON CONFLICT(exam_id, student_id, subject) DO UPDATE SET score = excluded.score, seq = excluded.seq'),
    marksDel: q('DELETE FROM marks WHERE exam_id = ? AND student_id = ? AND subject = ?'), marksAll: q('SELECT * FROM marks'), marksSince: q('SELECT * FROM marks WHERE seq > ?'), marksWipe: q('DELETE FROM marks'),
    cmUp: q('INSERT INTO comments (exam_id, student_id, ct, ht, seq) VALUES (?, ?, ?, ?, ?) ON CONFLICT(exam_id, student_id) DO UPDATE SET ct = excluded.ct, ht = excluded.ht, seq = excluded.seq'),
    cmDel: q('DELETE FROM comments WHERE exam_id = ? AND student_id = ?'), cmAll: q('SELECT * FROM comments'), cmSince: q('SELECT * FROM comments WHERE seq > ?'), cmWipe: q('DELETE FROM comments'), cmGet: q('SELECT * FROM comments WHERE exam_id = ? AND student_id = ?'),
    attUp: q('INSERT INTO attendance (date, student_id, mark, seq) VALUES (?, ?, ?, ?) ON CONFLICT(date, student_id) DO UPDATE SET mark = excluded.mark, seq = excluded.seq'),
    attDel: q('DELETE FROM attendance WHERE date = ? AND student_id = ?'), attFrom: q('SELECT * FROM attendance WHERE date >= ?'), attOn: q('SELECT * FROM attendance WHERE date = ?'),
    attSince: q('SELECT * FROM attendance WHERE seq > ?'), attWipe: q('DELETE FROM attendance'),
    ttUp: q('INSERT INTO timetable (class_id, day, period, subject, seq) VALUES (?, ?, ?, ?, ?) ON CONFLICT(class_id, day, period) DO UPDATE SET subject = excluded.subject, seq = excluded.seq'),
    ttDel: q('DELETE FROM timetable WHERE class_id = ? AND day = ? AND period = ?'), ttAll: q('SELECT * FROM timetable'), ttSince: q('SELECT DISTINCT class_id, day FROM timetable WHERE seq > ?'),
    ttRow: q('SELECT period, subject FROM timetable WHERE class_id = ? AND day = ?'), ttWipe: q('DELETE FROM timetable')
  };

  const store = {
    db, file, DEFS,
    close() { try { persistSeq(); db.close(); } catch (e) { /* already closed */ } },
    begin() { db.exec('BEGIN IMMEDIATE'); }, commit() { persistSeq(); db.exec('COMMIT'); }, rollback() { try { db.exec('ROLLBACK'); } catch (e) { /* none */ } },
    savepoint(n) { db.exec(`SAVEPOINT ${n}`); }, release(n) { db.exec(`RELEASE ${n}`); }, rollbackTo(n) { db.exec(`ROLLBACK TO ${n}`); db.exec(`RELEASE ${n}`); },
    meta(k) { const r = st.metaGet.get(k); return r ? r.value : null; }, setMeta(k, v) { st.metaSet.run(k, String(v)); },
    seq() { return seqVal; },
    isRow: c => !!DEFS[c],
    isDoc: c => !!DOC_REF[c],

    /* ---- record access ---- */
    list(coll) {
      if (DEFS[coll]) { const d = DEFS[coll]; return d.sAll.all().map(r => ({ id: r.id, ref: d.ref ? r[d.ref] : null, data: rowToRec(d, r) })); }
      if (DOC_REF[coll]) return DQ.all.all(coll).map(docRow);
      switch (coll) {
        case 'school': return [{ id: 'main', ref: null, data: store.school() }];
        case 'fees': return [{ id: 'main', ref: null, data: store.fees() }];
        case 'sms': return [{ id: 'main', ref: null, data: store.smsPublic() }];
        case 'marks': return C.marksAll.all().map(r => ({ id: `${r.exam_id}|${r.student_id}|${r.subject}`, ref: r.student_id, data: r.score }));
        case 'comments': return C.cmAll.all().map(r => ({ id: `${r.exam_id}|${r.student_id}`, ref: r.student_id, data: { ct: r.ct, ht: r.ht } }));
        case 'attendance': return C.attFrom.all('0000-00-00').map(r => ({ id: `${r.date}|${r.student_id}`, ref: r.student_id, data: r.mark }));
        case 'tt': { const m = new Map(); for (const r of C.ttAll.all()) { const k = `${r.class_id}|${r.day}`; if (!m.has(k)) m.set(k, { id: k, ref: r.class_id, data: Array(16).fill('') }); m.get(k).data[r.period] = r.subject; } return [...m.values()]; }
        default: return [];
      }
    },
    attendanceFrom(date) { return C.attFrom.all(date).map(r => ({ id: `${r.date}|${r.student_id}`, ref: r.student_id, data: r.mark })); },
    attendanceOn(date) { return C.attOn.all(date).map(r => ({ id: `${r.date}|${r.student_id}`, ref: r.student_id, data: r.mark })); },
    /* rows of a collection where a reference column is one of the given ids */
    listBy(coll, ids) {
      const set = new Set(ids);
      return store.list(coll).filter(r => set.has(r.ref));
    },
    get(coll, id) {
      if (DEFS[coll]) { const r = DEFS[coll].sGet.get(id); return r ? rowToRec(DEFS[coll], r) : null; }
      if (DOC_REF[coll]) { const r = DQ.get.get(coll, id); return r ? JSON.parse(r.data) : null; }
      if (coll === 'marks') { const [e, s, sub] = id.split('|'); const r = db.prepare('SELECT score FROM marks WHERE exam_id = ? AND student_id = ? AND subject = ?').get(e, s, sub); return r ? r.score : null; }
      if (coll === 'attendance') { const [dt, s] = id.split('|'); const r = db.prepare('SELECT mark FROM attendance WHERE date = ? AND student_id = ?').get(dt, s); return r ? r.mark : null; }
      if (coll === 'school') return store.school();
      if (coll === 'fees') return store.fees();
      if (coll === 'sms') return store.smsPublic();
      if (coll === 'comments') { const [e, s] = id.split('|'); const r = C.cmGet.get(e, s); return r ? { ct: r.ct, ht: r.ht } : null; }
      return null;
    },
    rawRow(coll, id) { return DEFS[coll] ? DEFS[coll].sGet.get(id) : null; },
    put(coll, id, data) {
      const sq = nextSeq();
      if (DEFS[coll]) { const d = DEFS[coll]; d.sUpsert.run(...recToParams(d, data), sq); return; }
      if (DOC_REF[coll]) { DQ.up.run(coll, id, DOC_REF[coll](data) || null, JSON.stringify(data), sq); return; }
      switch (coll) {
        case 'marks': { const [e, s, sub] = id.split('|'); C.marksUp.run(e, s, sub, data, sq); return; }
        case 'comments': { const [e, s] = id.split('|'); C.cmUp.run(e, s, data.ct || '', data.ht || '', sq); return; }
        case 'attendance': { const [dt, s] = id.split('|'); C.attUp.run(dt, s, data, sq); return; }
        case 'tt': { const [c, day] = id.split('|'); data.forEach((sub, p) => { if (sub) C.ttUp.run(c, Number(day), p, sub, sq); else C.ttDel.run(c, Number(day), p); }); return; }
        case 'school': { for (const [k, v] of Object.entries(data)) st.setPut.run('school.' + k, JSON.stringify(v), sq); return; }
        case 'fees': { for (const [k, v] of Object.entries(data.structure || {})) st.setPut.run('fee.' + k, JSON.stringify(v), sq); return; }
        case 'sms': { for (const [k, v] of Object.entries(data)) st.setPut.run('sms.' + k, JSON.stringify(v), sq); return; }
        default: throw new Error('Unknown collection ' + coll);
      }
    },
    remove(coll, id) {
      const sq = nextSeq();
      if (DEFS[coll]) DEFS[coll].sDel.run(id);
      else if (DOC_REF[coll]) DQ.del.run(coll, id);
      else if (coll === 'marks') { const [e, s, sub] = id.split('|'); C.marksDel.run(e, s, sub); }
      else if (coll === 'comments') { const [e, s] = id.split('|'); C.cmDel.run(e, s); }
      else if (coll === 'attendance') { const [dt, s] = id.split('|'); C.attDel.run(dt, s); }
      else return;
      st.tombIns.run(coll, id, sq, Date.now());
    },
    wipeColl(coll) {
      if (DEFS[coll]) DEFS[coll].sWipe.run();
      else if (DOC_REF[coll]) DQ.wipe.run(coll);
      else if (coll === 'marks') C.marksWipe.run(); else if (coll === 'comments') C.cmWipe.run(); else if (coll === 'attendance') C.attWipe.run(); else if (coll === 'tt') C.ttWipe.run();
    },
    docsRef(coll, refs) { const out = []; for (let i = 0; i < refs.length; i += 400) { const part = refs.slice(i, i + 400); if (!part.length) break; out.push(...db.prepare(`SELECT * FROM docs WHERE coll = ? AND ref IN (${part.map(() => '?').join(',')})`).all(coll, ...part).map(docRow)); } return out; },
    exists(coll, id) { return DEFS[coll] ? !!DEFS[coll].sGet.get(id) : DOC_REF[coll] ? !!DQ.get.get(coll, id) : false; },
    count(coll) { return DEFS[coll] ? db.prepare(`SELECT COUNT(*) n FROM ${DEFS[coll].table}`).get().n : 0; },

    /* ---- singletons stored in settings ---- */
    school() {
      const out = {};
      for (const r of st.setAll.all('school.%')) { try { out[r.key.slice(7)] = JSON.parse(r.value); } catch (e) { /* skip */ } }
      const b = store.fileInfo('badge'); out.badge = b ? `/badge?v=${b.updated}` : null;
      return out;
    },
    fees() {
      const structure = {};
      for (const r of st.setAll.all('fee.%')) { try { structure[r.key.slice(4)] = JSON.parse(r.value); } catch (e) { /* skip */ } }
      return { structure };
    },
    smsPublic() {
      const o = {};
      for (const r of st.setAll.all('sms.%')) { try { o[r.key.slice(4)] = JSON.parse(r.value); } catch (e) { /* skip */ } }
      const hasKey = !!o.apiKey; delete o.apiKey;
      return { provider: o.provider || 'none', username: o.username || '', sender: o.sender || '', sandbox: !!o.sandbox, hasKey };
    },
    smsSecret() { const o = {}; for (const r of st.setAll.all('sms.%')) { try { o[r.key.slice(4)] = JSON.parse(r.value); } catch (e) { /* skip */ } } return o; },
    setting(k) { const r = st.setGet.get(k); if (!r) return null; try { return JSON.parse(r.value); } catch (e) { return null; } },

    /* ---- change feed ---- */
    since(seq) {
      const rows = [];
      for (const [name, d] of Object.entries(DEFS)) for (const r of d.sSince.all(seq)) rows.push({ coll: name, id: r.id, ref: d.ref ? r[d.ref] : null, data: rowToRec(d, r) });
      for (const r of DQ.since.all(seq)) rows.push({ coll: r.coll, id: r.id, ref: r.ref, data: JSON.parse(r.data) });
      for (const r of C.marksSince.all(seq)) rows.push({ coll: 'marks', id: `${r.exam_id}|${r.student_id}|${r.subject}`, ref: r.student_id, data: r.score });
      for (const r of C.cmSince.all(seq)) rows.push({ coll: 'comments', id: `${r.exam_id}|${r.student_id}`, ref: r.student_id, data: { ct: r.ct, ht: r.ht } });
      for (const r of C.attSince.all(seq)) rows.push({ coll: 'attendance', id: `${r.date}|${r.student_id}`, ref: r.student_id, data: r.mark });
      for (const r of C.ttSince.all(seq)) { const arr = Array(16).fill(''); for (const x of C.ttRow.all(r.class_id, r.day)) arr[x.period] = x.subject; rows.push({ coll: 'tt', id: `${r.class_id}|${r.day}`, ref: r.class_id, data: arr }); }
      if (st.setSince.get(seq, 'school.%')) rows.push({ coll: 'school', id: 'main', ref: null, data: store.school() });
      if (st.setSince.get(seq, 'fee.%')) rows.push({ coll: 'fees', id: 'main', ref: null, data: store.fees() });
      if (st.setSince.get(seq, 'sms.%')) rows.push({ coll: 'sms', id: 'main', ref: null, data: store.smsPublic() });
      for (const t of st.tombSince.all(seq)) rows.push({ coll: t.coll, id: t.id, ref: null, data: null, deleted: true });
      return rows;
    },
    pruneTombstones() {
      const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
      const r = db.prepare('SELECT MAX(seq) m FROM tombstones WHERE ts < ?').get(cutoff);
      if (r && r.m) { db.prepare('DELETE FROM tombstones WHERE seq <= ?').run(r.m); store.setMeta('tomb_floor', r.m); }
    },
    tombFloor() { return Number(store.meta('tomb_floor') || 0); },

    /* ---- numbering ---- */
    nextNumber(table, col) {
      const r = db.prepare(`SELECT MAX(CAST(SUBSTR(${col}, LENGTH(RTRIM(${col}, '0123456789')) + 1) AS INTEGER)) m FROM ${table}`).get();
      return ((r && r.m) || 0) + 1;
    },
    admTaken(adm, exceptId) { const r = db.prepare('SELECT id FROM students WHERE adm = ?').get(adm); return !!r && r.id !== exceptId; },
    rctTaken(rct, exceptId) { const r = db.prepare('SELECT id FROM payments WHERE rct = ?').get(rct); return !!r && r.id !== exceptId; },

    /* ---- positions (published results) ---- */
    ranks(examIds, classIds) {
      const out = {};
      if (!examIds.length || !classIds.length) return out;
      const e = examIds.map(() => '?').join(','), c = classIds.map(() => '?').join(',');
      const rows = db.prepare(`SELECT m.exam_id e, COALESCE(json_extract(d.data, '$.classId'), s.class_id) c, m.student_id s, AVG(m.score) a FROM marks m JOIN students s ON s.id = m.student_id LEFT JOIN docs d ON d.coll = 'placements' AND d.id = m.exam_id || '|' || m.student_id WHERE s.status = 'Active' AND m.exam_id IN (${e}) AND COALESCE(json_extract(d.data, '$.classId'), s.class_id) IN (${c}) GROUP BY m.exam_id, m.student_id`).all(...examIds, ...classIds);
      const groups = {};
      for (const r of rows) (groups[r.e + '|' + r.c] = groups[r.e + '|' + r.c] || []).push(r);
      for (const g of Object.values(groups)) for (const r of g) { (out[r.e] = out[r.e] || {})[r.s] = { pos: 1 + g.filter(x => x.a > r.a).length, of: g.length }; }
      return out;
    },

    /* ---- files (photos, badge) ---- */
    fileInfo(key) { const r = db.prepare('SELECT updated FROM files WHERE key = ?').get(key); return r || null; },
    fileGet(key) { return st.fileGet.get(key) || null; },
    filePut(key, mime, buf) { const v = Date.now(); st.filePut.run(key, mime, buf, v); return v; },
    fileDel(key) { st.fileDel.run(key); }, fileDelPrefix(p) { st.fileDelPrefix.run(p); },
    setPhoto(coll, id, v) { db.prepare(`UPDATE ${DEFS[coll].table} SET photo_v = ?, seq = ? WHERE id = ?`).run(v, nextSeq(), id); },

    /* ---- audit ---- */
    audit(user, text) { try { st.auditIns.run(new Date().toISOString(), String(user || 'System').slice(0, 80), String(text).slice(0, 400)); } catch (e) { /* never block on audit */ } },
    auditList(n) { return st.auditList.all(n).map(r => ({ t: r.ts, u: r.user, a: r.text })); },

    /* ---- backups ---- */
    backupTo(dest) {
      try { fs.unlinkSync(dest); } catch (e) { /* none */ }
      db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
    },
    integrity() { return db.prepare('PRAGMA integrity_check').get().integrity_check; },
    stats() {
      const o = {};
      for (const c of ROW_COLLS) o[c] = store.count(c);
      return o;
    }
  };
  store.pruneTombstones();
  return store;
}

module.exports = { open, DEFS, DOC_COLLS, DEFAULT_SUBJECTS, DEFAULT_SLOTS, ROW_COLLS, validate, coerce, rowToRec, getPath, setPath };
