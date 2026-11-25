/* After browser.js and browser-roles.js: real workflows through the screens. */
const { chromium } = require('playwright');
const REF='MM-'+Date.now(), base = process.env.BASE || 'http://localhost:8099', PW = 'Changed2026x';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const errs = [], out = [];
  const H = { 'X-Requested-With': 'WalEduc', 'Content-Type': 'application/json' };
  const lg = await fetch(base + '/api/login', { method: 'POST', headers: H, body: JSON.stringify({ username: 'admin', password: 'Passw0rdX' }) });
  const ck = /we_sid=[^;]*/.exec(lg.headers.get('set-cookie'))[0];
  const parentU = (await (await fetch(base + '/api/users', { headers: { ...H, Cookie: ck } })).json()).users.find(u => u.role === 'parent' && !u.must).username;
  const login = async (u) => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }), p = await c.newPage();
    p.on('pageerror', e => errs.push(u + ' PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(u + ' CONSOLE ' + m.text()));
    await p.goto(base); await p.fill('#a_user', u); await p.fill('#a_pw', PW); await p.click('#authform button[type=submit]'); await p.waitForSelector('#main .ph', { timeout: 15000 }); return p; };
  const nav = async (p, id) => { await p.evaluate(i => document.querySelector(`#side [data-id=${i}]`).click(), id); await p.waitForTimeout(250); };
  const tab = async (p, t) => { await p.click(`button.tab:has-text("${t}")`); await p.waitForTimeout(200); };
  const ok = (n, c) => { out.push((c ? 'PASS ' : 'FAIL ') + n); if (!c) errs.push('FAIL ' + n); };
  const txt = p => p.textContent('#main');
  /* parent: PRN and payment */
  const par = await login(parentU); await nav(par, 'p_fees');
  await par.click('[data-a=prnNew]'); await par.fill('#f_amount', '120000'); await par.click('[data-a=submitForm]'); await par.waitForTimeout(1200);
  ok('parent got a PRN', /9\d{12}/.test(await txt(par)));
  await par.click('[data-a=paySubmit]'); await par.fill('#f_amount', '120000'); await par.fill('#f_ref', REF); await par.click('[data-a=submitForm]'); await par.waitForTimeout(1200);
  ok('payment awaits approval', /Awaiting approval/.test(await txt(par)));
  /* bursar approves */
  const bur = await login('bursar9'); await nav(bur, 'fees'); await tab(bur, 'Payments');
  ok('bursar sees pending', /Payments waiting for approval/.test(await txt(bur)));
  await bur.click(`tr:has-text("${REF}") [data-a=payApprove]`); await bur.click('[data-a=doConfirm]'); await bur.waitForTimeout(1500);
  ok('bursar approved', !(await bur.$(`tr:has-text("${REF}") [data-a=payApprove]`)));
  await par.reload(); await par.waitForSelector('#main .ph'); await nav(par, 'p_fees');
  ok('parent can open receipt', !!(await par.$(`tr:has-text("${REF}") [data-a=receipt]`)));
  await par.click(`tr:has-text("${REF}") [data-a=receipt]`); await par.waitForSelector('.rc'); ok('receipt shows number', /RCT|PCM|R\d/.test(await par.textContent('.rc')));
  /* registrar cannot edit fees; bursar cannot add learners */
  ok('bursar has no add learner', !(await (async () => { await nav(bur, 'students'); return bur.$('[data-a=studentNew]'); })()));
  /* warden roll call */
  const wd = await login('warden9'); await nav(wd, 'boarding'); await tab(wd, 'Roll call'); await wd.click('[data-a=rcAll]'); await wd.waitForTimeout(1200);
  await tab(wd, 'Summary report'); ok('roll call summary has present', /Present/.test(await txt(wd)));
  /* hrm adds staff */
  const hr = await login('hrm9'); await nav(hr, 'staff'); await hr.click('[data-a=staffNew]'); await hr.fill('#f_name', 'Test Newstaff'); await hr.fill('#f_role', 'Teacher'); await hr.click('[data-a=submitForm]'); await hr.waitForTimeout(1500);
  ok('hrm added staff', /Test Newstaff/.test(await txt(hr)));
  const dos = await login('dos9'); await nav(dos, 'staff'); await dos.waitForTimeout(7500);
  ok('dos sees new staff, cannot add', /Test Newstaff/.test(await txt(dos)) && !(await dos.$('[data-a=staffNew]')));
  /* head sends a message to a class's students, a student sees it */
  const hd = await login('head9'); await nav(hd, 'comms'); const opt = await hd.$$eval('#aud option', o => o.find(x => x.value.startsWith('stu_c:'))?.value);
  await hd.selectOption('#aud', opt); await hd.fill('#msg', 'Assembly tomorrow at 8am'); await hd.click('[data-a=sendMsg]'); await hd.waitForTimeout(1500);
  ok('message recorded', /Assembly tomorrow/.test(await txt(hd)));
  /* registrar admissions page + exam office controls */
  const ex = await login('exam9'); await nav(ex, 'exams'); ok('exam office sees controls', /Control|control|deadline/i.test(await txt(ex)));
  console.log(out.join('\n')); console.log('ERRORS:', errs.length ? '\n' + errs.join('\n') : 'none'); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
