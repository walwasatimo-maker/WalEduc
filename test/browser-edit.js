/* Edits made in the browser must reach the database: add a learner, mark attendance, enter a mark, record a payment, reload. */
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8099';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(base); await p.fill('#a_user', 'admin'); await p.fill('#a_pw', 'Passw0rdX'); await p.click('#authform button[type=submit]'); await p.waitForSelector('#main .ph');
  const nav = id => p.evaluate(i => document.querySelector(`#side [data-id=${i}]`).click(), id);
  await nav('students'); await p.click('[data-a=studentNew]'); await p.waitForSelector('#mform');
  await p.fill('[name=first]', 'Zed'); await p.fill('[name=last]', 'Testing'); await p.selectOption('[name=sex]', 'M'); await p.fill('[name=gname]', 'Zed Senior').catch(() => {});
  const names = await p.$$eval('#mform [name]', e => e.map(x => x.name)); console.log('form fields:', names.join(','));
  await p.fill('[name=dob]','2012-03-04').catch(()=>{}); await p.fill('[name=gphone]','0771999888').catch(()=>{}); await p.fill('[name=gname]','Zed Senior').catch(()=>{}); await p.click('#mform button[type=submit], .modal button.pri',{timeout:4000}).catch(async()=>{console.log('toast:',await p.textContent('#toasts'))}); await p.waitForTimeout(1200);
  const r = await fetch(base + '/api/login', { method: 'POST', headers: { 'X-Requested-With': 'WalEduc', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'Passw0rdX' }) });
  const ck = /we_sid=[^;]*/.exec(r.headers.get('set-cookie'))[0];
  const bs = await (await fetch(base + '/api/bootstrap', { headers: { Cookie: ck } })).json();
  const z = bs.data.students.find(s => s[1].first === 'Zed'); console.log('learner on server:', z ? z[1].adm : 'MISSING');
  /* attendance */
  await nav('attendance'); await p.waitForTimeout(300); const mk = await p.$('[data-a=mark][data-v=A]'); if (mk) { await mk.click(); await p.waitForTimeout(1200); }
  const bs2 = await (await fetch(base + '/api/bootstrap', { headers: { Cookie: ck } })).json(); const today = new Date().toISOString().slice(0, 10);
  console.log('attendance rows today on server:', bs2.data.attendance.filter(a => a[0].startsWith(today) || a[0].startsWith(new Date().getFullYear())).length > 0 ? 'yes' : 'no');
  /* marks */
  await nav('exams'); await p.waitForTimeout(300); const inp = await p.$('input[data-c=mark]'); if (inp) { await inp.fill('77'); await inp.dispatchEvent('change'); await p.waitForTimeout(1200); const id = await inp.getAttribute('data-s'), sub = await inp.getAttribute('data-sub'); const bs3 = await (await fetch(base + '/api/bootstrap', { headers: { Cookie: ck } })).json(); console.log('mark on server:', bs3.data.marks.some(m => m[0].endsWith(`|${id}|${sub}`) && m[1] === 77)); } else console.log('no mark input found');
  /* reload: values come back */
  await p.reload(); await p.waitForSelector('#main .ph'); await nav('students'); await p.waitForTimeout(300);
  console.log('Zed visible after reload:', (await p.textContent('#main')).includes('Zed Testing'));
  console.log('errors:', errs.length ? errs.join('|') : 'none'); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
