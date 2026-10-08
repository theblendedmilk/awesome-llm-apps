'use strict';
/* End-to-end test: drives the real app in Chromium against a fresh server.
   Usage: node test/e2e.js [--runs 3] [--shots <dir>]   (needs Playwright: npm i -D playwright) */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
const { createApp } = require('../server/app');

const args = process.argv.slice(2);
const RUNS = Number(args[args.indexOf('--runs') + 1]) || 1;
const SHOTS = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const ADMIN = { email: 'admin@seasonly.fr', password: 'e2e-password-123' };

function tinyPng() {
  // 2×2 PNG with a tEXt chunk, generated without dependencies.
  const zlib = require('node:zlib');
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(2, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.from([0, 196, 128, 108, 14, 14, 16, 0, 245, 232, 230, 196, 128, 108]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('tEXt', Buffer.from('Comment\0GPS 48.85N')), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function run(n, browser) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seasonly-e2e-'));
  const { app } = createApp({ dataDir, env: { DEV_SHOW_CODES: '1', OTP_SEND_PER_IP: '1000', OTP_VERIFY_PER_IP: '1000', ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password }, log: { info() {}, warn() {}, error: console.error } });
  const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const photo = path.join(dataDir, 'me.png');
  fs.writeFileSync(photo, tinyPng());
  const errors = [];
  const newPage = async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) errors.push(m.text()); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS && n === 1) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  let doing = 'start';
  const step = (msg) => { console.log(`  [run ${n}] ${msg}`); doing = `after "${msg}"`; };
  const code = async (page) => (await page.textContent('.demo-code b')).trim();
  const tab = (page, name) => page.click(`.tab[aria-label="${name}"]`);
  const miles = async (page) => Number((await page.textContent('.stats .stat b')).replace(/\D/g, ''));

  try {
    /* 1. Sign up with SMS code */
    const p = await newPage();
    await p.goto(base + '/');
    await p.waitForSelector('text=Create my account');
    await shot(p, '01-welcome');
    await p.click('text=Create my account');
    await p.click('button[type="submit"]');
    await p.waitForSelector('.form-error');
    assert.match(await p.textContent('.form-error'), /first name/, 'validation shows');
    await p.fill('#first', 'Marie'); await p.fill('#last', 'Dupont');
    await p.fill('#email', `marie${n}@example.fr`); await p.fill('#phone', '06 12 34 56 7' + n);
    await p.check('#consent');
    await shot(p, '02-signup');
    await p.click('button[type="submit"]');
    await p.waitForSelector('#code');
    assert.match(await p.textContent('.auth'), /by SMS to/);
    await shot(p, '03-verify');
    await p.fill('#code', '000000');
    await p.waitForSelector('.form-error');
    assert.match(await p.textContent('.form-error'), /not right/);
    await p.fill('#code', await code(p));
    await p.waitForSelector('.stats');
    assert.equal(await miles(p), 300, 'welcome gift');
    assert.match(await p.$eval('.hero .hero-photo', (el) => el.style.backgroundImage), /img\/hero\.jpg/, 'campaign photo on home');
    await shot(p, '04-home');
    step('sign-up with code ✓');

    /* 2. Daily check-in and streak screen */
    await p.click('.checkin-banner');
    await p.waitForSelector('.celebrate .cel-num');
    assert.equal((await p.textContent('.cel-num')).trim(), '1');
    assert.match(await p.textContent('.celebrate'), /jours de suite/);
    assert.equal(await p.$eval('.cel-num span', (el) => getComputedStyle(el).fontFamily.includes('Cormorant')), true, 'streak uses the app serif');
    await p.waitForTimeout(1500);
    await shot(p, '05-streak');
    await p.click('.celebrate .btn-dark');
    await p.waitForTimeout(400);
    assert.equal(await miles(p), 320);
    assert.equal(await p.$('.checkin-banner'), null, 'banner gone after check-in');
    step('check-in + streak screen ✓');

    /* 3. Wellness tip and a full ritual */
    await p.click('.card.tip');
    await p.click('[data-a="tip-done"]');
    await p.waitForTimeout(500);
    assert.equal(await miles(p), 330);
    await p.click('.ritual-card [data-a="ritual"]');
    for (let i = 0; i < 4; i++) { await p.waitForSelector('[data-a="ritual-next"]:not([disabled])'); await p.click('[data-a="ritual-next"]'); await p.waitForTimeout(200); }
    await p.waitForSelector('text=Ritual complete');
    await p.click('.sheet-card [data-a="close"]');
    await p.waitForTimeout(400);
    assert.equal(await miles(p), 380);
    step('tip + ritual ✓');

    /* 4. Games */
    await tab(p, 'Rewards');
    await p.click('[data-a="game"][data-arg="quiz"]');
    for (let i = 0; i < 5; i++) { await p.click('.answer >> nth=0'); await p.click('[data-a="quiz-next"]'); }
    await p.waitForSelector('.score-num');
    await shot(p, '06-quiz');
    await p.click('.sheet-card [data-a="close"]');
    await p.click('[data-a="game"][data-arg="match"]');
    await p.waitForSelector('.mcard');
    const deck = await p.$$eval('.mcard .front small', (els) => els.map((e) => e.textContent));
    const seen = new Set();
    for (let i = 0; i < deck.length; i++) {
      if (seen.has(i)) continue;
      const j = deck.findIndex((name, k) => k > i && name === deck[i]);
      seen.add(i); seen.add(j);
      await p.click(`.mcard >> nth=${i}`); await p.click(`.mcard >> nth=${j}`);
      await p.waitForTimeout(80);
    }
    await p.waitForSelector('text=Matched in 6 moves');
    assert.match(await p.textContent('.sheet-card'), /\+80 miles earned/);
    await shot(p, '07-match');
    await p.click('.sheet-card [data-a="close"]');
    await p.click('[data-a="game"][data-arg="wheel"]');
    await p.click('[data-a="spin"]');
    await p.waitForSelector('text=Come back tomorrow', { timeout: 15000 });
    await p.click('.sheet-card [data-a="close"]');
    step('quiz + memory + wheel ✓');

    /* 5. Boutique: no "La maison", real catalog, checkout */
    await tab(p, 'Shop');
    const shopText = await p.textContent('#app');
    assert.ok(!/La maison/i.test(shopText), 'La maison removed');
    assert.match(shopText, /Sérum TensioLift/);
    assert.match(shopText, /€79/);
    await shot(p, '08-shop');
    await p.click('.chip:has-text("Nettoyants")');
    await p.click('[data-a="product"][data-arg="gelee-nettoyante-visage"].p-media');
    await p.waitForSelector('.pdp');
    assert.match(await p.textContent('.pdp'), /calendula/);
    await shot(p, '09-product');
    await p.click('[data-a="add-close"]');
    await p.click('.icon-btn[aria-label="Bag"]');
    await p.waitForSelector('[data-a="checkout"]');
    assert.match(await p.textContent('.sheet-card'), /€26/);
    await p.click('[data-a="checkout"]');
    await p.waitForSelector('text=Order confirmed');
    await p.click('.sheet-card [data-a="close"]');
    step('boutique + checkout ✓');

    /* 6. Profile photo upload (protected) */
    await tab(p, 'Profile');
    await p.setInputFiles('#photoInput', photo);
    await p.waitForFunction(() => { const a = document.querySelector('.profile-card [data-avatar]'); return a && a.classList.contains('has-photo') && a.style.backgroundImage.startsWith('url("blob:'); }, null, { timeout: 15000 });
    assert.equal(await p.$('.profile-card img'), null, 'photo is not an <img>');
    assert.equal(await p.$eval('.profile-card .avatar', (el) => getComputedStyle(el).userSelect), 'none');
    await shot(p, '10-profile');
    step('profile photo ✓');

    /* 7. Referral code, then log out */
    const refCode = (await p.textContent('.referral .code')).trim();
    assert.match(refCode, /^MARIE[A-Z2-9]{4}$/);
    await p.click('[data-a="logout"]');
    await p.click('[data-a="logout-ok"]');
    await p.waitForSelector('text=Create my account');
    assert.equal(await p.isVisible('#tabbar'), false);
    await p.reload();
    await p.waitForSelector('text=Create my account');
    step('log out ✓');

    /* 8. A friend signs up with the referral link and books */
    const f = await newPage();
    await f.goto(`${base}/#ref-${refCode}`);
    await f.waitForSelector('#referral');
    assert.equal(await f.inputValue('#referral'), refCode);
    await f.fill('#first', 'Julie'); await f.fill('#email', `julie${n}@example.fr`); await f.fill('#phone', '07 11 22 33 4' + n);
    await f.click('.seg label:has-text("Email")');
    await f.check('#consent');
    await f.click('button[type="submit"]');
    await f.waitForSelector('#code');
    assert.match(await f.textContent('.auth'), /by email to/);
    await f.fill('#code', await code(f));
    await f.waitForSelector('.stats');
    await tab(f, 'Book');
    assert.match(await f.textContent('#app'), /welcome offer/);
    await f.click('[data-a="pick-studio"][data-arg="canopee"]');
    await f.click('[data-a="pick-service"][data-arg="signature"]');
    await f.click('.slot:not([disabled]) >> nth=0');
    await f.click('[data-a="step"][data-arg="4"]');
    assert.match(await f.textContent('.summary'), /Welcome referral offer −10%/);
    assert.match(await f.textContent('.summary'), /€45/);
    await shot(f, '11-book-referral');
    await f.click('[data-a="confirm-booking"]');
    await f.waitForSelector('text=À bientôt');
    step('friend signs up with link + books with −10% ✓');

    /* 9. Marie signs back in by email code and sees her reward */
    await p.click('text=I already have an account');
    await p.fill('#identifier', `marie${n}@example.fr`);
    await p.click('button[type="submit"]');
    await p.waitForSelector('#code');
    await p.fill('#code', await code(p));
    await p.waitForSelector('.stats');
    await tab(p, 'Rewards');
    const rewards = await p.textContent('.referral');
    assert.match(rewards, /1 friend has booked/);
    assert.match(rewards, /current reward −5%/);
    await shot(p, '12-rewards-referral');
    await tab(p, 'Book');
    await p.click('[data-a="pick-studio"] >> nth=0');
    await p.click('[data-a="pick-service"][data-arg="gym"]');
    await p.click('.slot:not([disabled]) >> nth=0');
    await p.click('[data-a="step"][data-arg="4"]');
    assert.match(await p.textContent('.summary'), /Referral reward −5%/);
    step('referrer reward applied ✓');

    /* 10. Admin panel: product, photo, email, push */
    const a = await newPage();
    await a.goto(base + '/admin/');
    await a.fill('#a-email', ADMIN.email); await a.fill('#a-password', 'wrong');
    await a.click('button:has-text("Sign in")');
    await a.waitForSelector('.error');
    await a.fill('#a-password', ADMIN.password);
    await a.click('button:has-text("Sign in")');
    await a.waitForSelector('.kpis');
    assert.match(await a.textContent('.kpis'), /Customers\s*2/);
    await shot(a, '13-admin');
    await a.click('.nav button:has-text("Products")');
    await a.waitForSelector('table');
    assert.equal((await a.$$('tbody tr')).length, 16);
    await a.click('text=Add a product');
    await a.fill('#p-name', 'Brume Saison'); await a.fill('#p-sub', 'Face mist'); await a.fill('#p-price', '24.50'); await a.fill('#p-size', '100 ml');
    await a.fill('#p-desc', 'A fresh face mist for autumn.');
    await a.click('button:has-text("Create product")');
    await a.waitForSelector('#pimg', { state: 'attached' });
    await a.setInputFiles('#pimg', photo);
    await a.waitForFunction(() => document.querySelector('.modal .img-preview').style.backgroundImage.includes('/api/images/'));
    await a.click('[data-a="modal-close"]');
    const prods = await (await fetch(base + '/api/products')).json();
    assert.ok(prods.products.find((x) => x.name === 'Brume Saison' && x.price === 24.5 && x.image), 'new product live with photo');
    await a.click('.nav button:has-text("Email")');
    await a.fill('#em-subject', 'The autumn edit'); await a.fill('#em-body', 'Bonjour {first},\n\nNew vouchers are live.');
    await a.click('button:has-text("Send email")');
    await a.waitForFunction(() => /email/.test(document.getElementById('toast').textContent), null, { timeout: 15000 });
    assert.match(await a.textContent('#toast'), /2 of 2 email/);
    await a.click('.nav button:has-text("Push notifications")');
    await a.fill('#pu-title', 'Vouchers are live'); await a.fill('#pu-body', 'Trade your miles now.');
    await a.click('button:has-text("Send notification")');
    await a.waitForFunction(() => /device/.test(document.getElementById('toast').textContent), null, { timeout: 15000 });
    await a.click('.nav button:has-text("Sent messages")');
    await a.waitForSelector('table');
    const outbox = await a.textContent('table');
    assert.match(outbox, /The autumn edit/); assert.match(outbox, /Vouchers are live/); assert.match(outbox, /is your Seasonly code/);
    await shot(a, '14-admin-outbox');
    await a.click('.nav button:has-text("Customers")');
    await a.waitForSelector('tbody tr');
    assert.match(await a.textContent('table'), /Julie/);
    step('admin: product + photo + email + push ✓');

    /* 11. Shop shows the admin's new product */
    await p.reload();
    await p.waitForSelector('.stats');
    await tab(p, 'Shop');
    await p.click('.chip:has-text("All")');
    await p.fill('#search', 'Brume');
    await p.waitForSelector('text=Brume Saison');
    assert.ok(await p.$('.p-card img.p-img'), 'product photo shown');
    step('new product visible in the app ✓');

    /* 12. Offline demo mode (no backend) */
    const d = await newPage();
    await d.goto('file://' + path.join(__dirname, '..', 'public', 'index.html'));
    await d.waitForSelector('text=Demo mode');
    await d.click('text=Create my account');
    await d.fill('#first', 'Léa'); await d.fill('#email', 'lea@example.fr'); await d.fill('#phone', '0611223344'); await d.check('#consent');
    await d.click('button[type="submit"]');
    await d.waitForSelector('.demo-code');
    await d.fill('#code', await code(d));
    await d.waitForSelector('.stats');
    await d.click('.checkin-banner'); await d.waitForSelector('.celebrate'); await d.click('.celebrate .btn-dark');
    await tab(d, 'Profile'); await d.click('[data-a="logout"]'); await d.click('[data-a="logout-ok"]');
    await d.waitForSelector('text=Create my account');
    step('offline demo mode ✓');

    assert.deepEqual(errors, [], 'no page errors');
  } catch (e) {
    e.message = `${e.message}\n  (failed ${doing})`;
    throw e;
  } finally {
    server.close();
  }
}

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await playwright.chromium.launch();
  let failed = 0;
  for (let n = 1; n <= RUNS; n++) {
    console.log(`E2E run ${n}/${RUNS}`);
    try { await run(n, browser); console.log(`E2E run ${n}: PASS`); }
    catch (e) { failed++; console.error(`E2E run ${n}: FAIL\n`, e); }
  }
  await browser.close();
  if (failed) { console.error(`${failed} of ${RUNS} run(s) failed`); process.exit(1); }
  console.log(`All ${RUNS} run(s) passed`);
})();
