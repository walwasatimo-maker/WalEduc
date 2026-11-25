'use strict';
/* Who may read and write what. Enforced on the server for every request.
   This file holds the collection-level rules. Row-level and field-level rules (for example "a teacher may only
   enter marks for the subject allocated to them") are in server.js, in authorize() and visibleRows(). */
const STAFF = ['admin', 'head', 'dos', 'bursar', 'registrar', 'teacher', 'librarian', 'warden', 'hrm', 'examoffice', 'sickbay'];
const FAMILY = ['parent', 'student'];
const ROLE_LABEL = {
  admin: 'Administrator', head: 'Head Teacher', dos: 'Director of Studies', bursar: 'Bursar', registrar: 'Registrar', teacher: 'Teacher',
  librarian: 'Librarian', warden: 'Warden / Matron', hrm: 'Human Resource Manager', examoffice: 'Examination Office', sickbay: 'Sick Bay Attendant',
  parent: 'Parent / Guardian', student: 'Learner'
};
/* collections stored in typed tables */
const ROW = ['students', 'staff', 'classes', 'dorms', 'applicants', 'exams', 'payments', 'expenses', 'books', 'loans', 'discipline', 'sickbay', 'events', 'notices', 'messages'];
/* collections stored as JSON documents (table "docs") */
const DOC = ['subjects', 'hr', 'staffatt', 'misconduct', 'leaves', 'rollcall', 'examtt', 'examcfg', 'ttcfg', 'placements', 'inbox', 'prn', 'papers'];
const SINGLE = new Set(['school', 'fees', 'sms']);
const COLLS = [...ROW, ...DOC, 'marks', 'comments', 'attendance', 'tt', 'school', 'fees', 'sms'];
/* written only by the server itself (as the result of an action), never directly by a browser */
const SERVER_ONLY = new Set(['messages', 'placements', 'inbox', 'prn', 'papers']);

const COMMON = ['school', 'events', 'notices', 'classes', 'staff', 'subjects', 'ttcfg', 'inbox'];
const READ = {
  admin: ['school', 'fees', 'sms', 'students', 'staff', 'classes', 'dorms', 'applicants', 'exams', 'examcfg', 'payments', 'expenses', 'books', 'loans', 'discipline', 'sickbay', 'events', 'notices',
    'attendance', 'tt', 'ttcfg', 'subjects', 'examtt', 'staffatt', 'rollcall', 'placements', 'prn'],
  head: [...COMMON, 'fees', 'students', 'dorms', 'applicants', 'exams', 'examcfg', 'payments', 'expenses', 'books', 'loans', 'discipline', 'sickbay', 'tt', 'attendance', 'marks', 'comments', 'examtt', 'messages',
    'hr', 'staffatt', 'misconduct', 'leaves', 'rollcall', 'placements', 'prn'],
  dos: [...COMMON, 'students', 'dorms', 'tt', 'attendance', 'exams', 'examcfg', 'marks', 'comments', 'examtt', 'discipline', 'sickbay', 'messages', 'rollcall', 'placements', 'loans', 'books'],
  bursar: [...COMMON, 'students', 'dorms', 'fees', 'payments', 'expenses', 'messages', 'prn', 'discipline'],
  registrar: [...COMMON, 'students', 'dorms', 'applicants', 'exams', 'examcfg', 'marks', 'comments', 'placements', 'messages', 'discipline', 'attendance', 'tt', 'examtt'],
  teacher: [...COMMON, 'students', 'dorms', 'tt', 'attendance', 'exams', 'examcfg', 'marks', 'comments', 'examtt', 'discipline', 'sickbay', 'placements', 'papers'],
  librarian: [...COMMON, 'students', 'books', 'loans', 'discipline'],
  warden: [...COMMON, 'students', 'dorms', 'rollcall', 'discipline', 'sickbay'],
  hrm: [...COMMON, 'students', 'dorms', 'hr', 'staffatt', 'misconduct', 'leaves', 'discipline', 'messages'],
  examoffice: [...COMMON, 'students', 'exams', 'examcfg', 'marks', 'comments', 'papers', 'examtt', 'placements', 'messages', 'discipline'],
  sickbay: [...COMMON, 'students', 'dorms', 'sickbay', 'discipline']
};
const WRITE = {
  admin: ['school'],
  head: ['classes', 'subjects', 'events', 'notices', 'discipline', 'staff', 'comments'],
  dos: ['classes', 'subjects', 'tt', 'ttcfg', 'examtt', 'events', 'notices', 'discipline', 'staff'],
  bursar: ['payments', 'expenses', 'fees', 'notices', 'students', 'discipline'],
  registrar: ['students', 'applicants', 'classes', 'subjects', 'events', 'notices', 'discipline'],
  teacher: ['marks', 'comments', 'attendance', 'discipline'],
  librarian: ['books', 'loans', 'discipline'],
  warden: ['dorms', 'students', 'rollcall', 'discipline'],
  hrm: ['staff', 'hr', 'staffatt', 'misconduct', 'leaves', 'discipline'],
  examoffice: ['exams', 'examcfg', 'discipline'],
  sickbay: ['sickbay', 'discipline']
};
const canRead = (role, coll) => !!READ[role] && READ[role].includes(coll);
const canWrite = (role, coll) => !!WRITE[role] && WRITE[role].includes(coll) && !SERVER_ONLY.has(coll);
const readable = role => READ[role] || [];
module.exports = { STAFF, FAMILY, ROLE_LABEL, ROW, DOC, COLLS, SINGLE, SERVER_ONLY, READ, WRITE, canRead, canWrite, readable };
