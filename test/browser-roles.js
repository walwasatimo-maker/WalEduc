/* After test/browser.js has set up the server with sample data: sign in as bursar, teacher and a parent and open every page they can see. */
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8099';
const H = { 'X-Requested-With': 'WalEduc', 'Content-Type': 'application/json' };
(async () => {
  const lg = await fetch(base + '/api/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'admin', password: 'Passw0rdX' }) });
  const ck = /we_sid=[^;]*/.exec(lg.headers.get('set-cookie'))[0]; const A = (m, u, b) => fetch(base + u, { method: m, headers: { ...H, Cookie: ck }, body: b ? JSON.stringify(b) : undefined }).then(r => r.json());
  const ex = (await A('GET', '/api/bootstrap')).data.exams; await A('POST', '/api/sync', { ops: ex.map(e => ['exams', e[0], { ...e[1], published: true }]) });
  const staff = (await A('GET', '/api/bootstrap')).data.staff.map(x => x[1]); const cls = (await A('GET', '/api/bootstrap')).data.classes.map(x => x[1]);
  const ct = staff.find(t => cls.some(c => c.teacherId === t.id)) || staff.find(t => t.type === 'Teaching');
  const accts = {}; for (const [u, role] of [['bursar9', 'bursar'], ['teacher9', 'teacher'], ['warden9', 'warden'], ['reg9', 'registrar'], ['head9', 'head'], ['dos9', 'dos'], ['hrm9', 'hrm'], ['exam9', 'examoffice'], ['sick9', 'sickbay'], ['lib9', 'librarian']]) { const r = await A('POST', '/api/users', { name: u + ' User', username: u, role, staffId: role === 'teacher' ? ct.id : undefined }); if (!r.pw) console.log('CREATE FAIL', u, JSON.stringify(r)); accts[u] = r.pw; }
  const bulk = await A('POST', '/api/users/bulk', {}); const parent = bulk.created.find(x => x.role.startsWith('Parent')), learner = bulk.created.find(x => x.role === 'Learner');
  accts[parent.username] = parent.pw; accts[learner.username] = learner.pw;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const errs = [];
  for (const [u, pw] of Object.entries(accts)) {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await c.newPage();
    p.on('pageerror', e => errs.push(u + ' PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(u + ' CONSOLE ' + m.text()));
    await p.goto(base); await p.fill('#a_user', u); await p.fill('#a_pw', pw); await p.click('#authform button[type=submit]');
    await p.waitForSelector('#a_pw2'); const np = 'Changed2026x'; await p.fill('#a_pw', np); await p.fill('#a_pw2', np); await p.click('#authform button[type=submit]');
    await p.waitForSelector('#main .ph', { timeout: 15000 });
    const navs = await p.$$eval('#side .nav', e => e.map(x => x.dataset.id)); let bad = 0;
    for (const id of navs) { await p.evaluate(i => document.querySelector(`#side [data-id=${i}]`).click(), id); await p.waitForTimeout(120); const t = await p.textContent('#main'); if (/Something went wrong/.test(t)) { bad++; errs.push(u + ' PAGE FAIL ' + id + ' ' + t.slice(0, 160)); } }
    console.log(u.padEnd(10), 'pages:', navs.join(','), bad ? 'FAILED' : 'ok');
    if (u === parent.username) {
      await p.evaluate(() => document.querySelector('#side [data-id=p_results]').click()); await p.waitForTimeout(200);
      await p.click('[data-a=portalCard]'); await p.waitForSelector('.rc'); console.log('  report card:', (await p.textContent('.rc')).replace(/\s+/g, ' ').match(/Position \d+ of \d+/)?.[0]);
      await p.screenshot({ path: '/tmp/parent.png' });
    }
    await c.close();
  }
  console.log('ERRORS:', errs.length ? '\n' + errs.join('\n') : 'none'); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
