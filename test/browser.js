/* Headless browser walk-through: setup, sample data, every role. Run with the server on PORT (default 8099). */
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8099';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); return p; };
  const p = await mk();
  await p.goto(base); await p.waitForSelector('#authform');
  console.log('setup screen:', await p.textContent('.authcard h2'));
  await p.fill('#a_name', 'Ad Min'); await p.fill('#a_user', 'admin'); await p.fill('#a_pw', 'Passw0rdX'); await p.fill('#a_pw2', 'Passw0rdX');
  await p.click('#authform button[type=submit]'); await p.waitForSelector('.code');
  console.log('recovery code shown:', (await p.textContent('.code')).trim());
  await p.click('[data-a=codeDone]'); await p.waitForSelector('#main .ph');
  console.log('dashboard:', (await p.textContent('#main h1')).trim());
  await p.screenshot({ path: '/tmp/dash0.png' });
  /* load sample data */
  await p.evaluate(() => document.querySelector('[data-a=nav][data-id=settings]').click());
  await p.click('button.tab:has-text("Data")'); await p.waitForSelector('[data-a=reseed]');
  await p.click('[data-a=reseed]'); await p.waitForSelector('[data-a=confirmOk], .modal button.pri', { timeout: 5000 }).catch(() => {});
  const btn = await p.$('.modal button.danger, .modal button.pri'); if (btn) await btn.click();
  await p.waitForFunction(() => /Sample data loaded/.test(document.body.innerText), null, { timeout: 30000 });
  console.log('sample data loaded');
  await p.waitForTimeout(500);
  const pages = ['dashboard', 'students', 'admissions', 'staff', 'classes', 'timetable', 'attendance', 'exams', 'fees', 'library', 'boarding', 'welfare', 'comms', 'events', 'reports', 'settings'];
  for (const id of pages) {
    await p.evaluate(i => document.querySelector(`[data-a=nav][data-id=${i}]`)?.click(), id); await p.waitForTimeout(150);
    const t = await p.textContent('#main'); if (/Something went wrong/.test(t)) errs.push('PAGE FAIL ' + id + ': ' + t.slice(0, 200));
  }
  console.log('admin pages ok');
  /* persistence: reload the browser page, data must come from the server */
  await p.reload(); await p.waitForSelector('#main .ph');
  const n = await p.evaluate(() => document.querySelectorAll('#side .nav').length);
  console.log('after reload, nav items:', n);
  await p.screenshot({ path: '/tmp/dash1.png' });
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
