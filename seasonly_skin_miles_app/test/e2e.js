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
// A 96×96 skin-coloured "selfie" for the on-device skin scan.
function skinPng() {
  const zlib = require('node:zlib');
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const W = 96, ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rows = [];
  for (let y = 0; y < W; y++) { rows.push(0); for (let x = 0; x < W; x++) { const v = ((x * 7 + y * 13) % 11) - 5; rows.push(214 + v, 165 + v, 140 + v); } }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from(rows))), chunk('IEND', Buffer.alloc(0))]);
}
// Words that must never show up in the French app (outside brand and product names).
const ENGLISH = /\b(the|your|you|and|with|Book|Shop|Rewards|Profile|Contest|Continue|Treatment|Settings|earned|Welcome|Daily|Start|Next|Step|Enter|Today|Share|Copy)\b/;

async function run(n, browser) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seasonly-e2e-'));
  const { app } = createApp({ dataDir, env: { DEV_SHOW_CODES: '1', OTP_SEND_PER_IP: '1000', OTP_VERIFY_PER_IP: '1000', ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password, RITUAL_WATCH_SHARE: '0', ADMIN_LOGIN_PER_IP: '100' }, log: { info() {}, warn() {}, error: console.error } });
  const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const photo = path.join(dataDir, 'me.png');
  fs.writeFileSync(photo, tinyPng());
  const selfie = path.join(dataDir, 'selfie.png');
  fs.writeFileSync(selfie, skinPng());
  const errors = [];
  const newPage = async (locale = 'en-GB') => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale, permissions: ['camera'] });
    const page = await ctx.newPage();
    // Controlled clock, so the ritual videos can be fast-forwarded.
    await page.clock.install();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) errors.push(m.text()); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS && n === 1) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  let doing = 'start';
  const step = (msg) => { console.log(`  [run ${n}] ${msg}`); doing = `after "${msg}"`; };
  const code = async (page) => (await page.textContent('.demo-code b')).trim();
  const tab = (page, name) => page.click(`.tab[aria-label="${name}"]`);
  const fillAddress = async (page, line1, postcode, city) => { await page.fill('#line1', line1); await page.fill('#postcode', postcode); await page.fill('#city', city); };
  // A section counts as "shown" when its anchor sits near the top of the scrolled app view.
  const sectionShown = (page, id) => page.waitForFunction((x) => { const el = document.getElementById(x); if (!el) return false; const r = el.getBoundingClientRect(); return r.top > -40 && r.top < 260; }, id, { timeout: 5000 });
  // Wait for the count-up animation to finish before reading the balance.
  const miles = async (page) => { await page.waitForFunction(() => !document.querySelector('[data-miles].bump'), null, { timeout: 5000 }); return Number((await page.textContent('[data-miles]')).replace(/\D/g, '')); };
  // Staff actions (mark a booking as paid) go through the admin API.
  const adminApi = async () => {
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'X-Seasonly': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(ADMIN) });
    const ck = r.headers.get('set-cookie').split(';')[0];
    return (m, u, b) => fetch(base + '/api/admin' + u, { method: m, headers: { 'X-Seasonly': '1', 'Content-Type': 'application/json', cookie: ck }, body: b ? JSON.stringify(b) : undefined }).then((x) => x.json());
  };

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
    await fillAddress(p, '12 rue de Turenne', '75004', 'Paris');
    await p.click('.seg label:has-text("Both")');
    await p.check('#consent');
    await p.click('button[type="submit"]');
    await p.waitForSelector('.form-error:has-text("woman, man")');
    await p.click('.seg.gender label:has-text("Woman")');
    await p.check('#consent');
    await shot(p, '02-signup');
    await p.click('button[type="submit"]');
    await p.waitForSelector('#code');
    assert.match(await p.textContent('.auth'), /by SMS to .* and by email to/);
    await shot(p, '03-verify');
    await p.fill('#code', '000000');
    await p.waitForSelector('.form-error');
    assert.match(await p.textContent('.form-error'), /not right/);
    await p.fill('#code', (await p.textContent('.demo-code b.email-code')).trim()); // confirms her email
    await p.waitForSelector('.stats');
    assert.equal(await miles(p), 300, 'welcome gift');
    assert.match(await p.$eval('.hero .hero-photo', (el) => el.style.backgroundImage), /img\/hero\.jpg/, 'campaign photo on home');
    await shot(p, '04-home');
    step('sign-up with code ✓');

    /* 2. Daily check-in and streak screen */
    await p.click('.checkin-banner');
    await p.waitForSelector('.celebrate .cel-num');
    assert.equal((await p.textContent('.cel-num')).trim(), '1');
    assert.match(await p.textContent('.celebrate'), /day in a row/);
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
    await p.waitForSelector('.miles-burst', { state: 'attached', timeout: 3000 }); // credit animation
    await p.waitForTimeout(500);
    assert.equal(await miles(p), 330);
    // Ritual video: plays with an animated guide, miles at the end of the video.
    await p.click('.ritual-card [data-a="ritual"]');
    await p.waitForSelector('.rv-face');
    assert.match(await p.textContent('.rv'), /Step 1 of 4[\s\S]*Cleanse/);
    await p.click('#rvPlay');
    await p.waitForSelector('.rv.playing');
    await p.clock.runFor(30000);
    await p.waitForFunction(() => /Serum/.test(document.getElementById('rvStepT').textContent), null, { timeout: 5000 });
    assert.equal(await miles(p), 330, 'no miles before the end of the video');
    await shot(p, '05b-ritual-video');
    for (let i = 0; i < 8; i++) await p.clock.runFor(15000);
    await p.waitForSelector('.rv-end', { timeout: 8000 });
    assert.match(await p.textContent('.rv-end'), /\+50 Skin Miles/);
    await p.click('.rv .btn-dark.wide[data-a="close"]');
    await p.waitForTimeout(400);
    assert.equal(await miles(p), 380);
    step('tip + ritual ✓');

    /* 4. Games */
    await tab(p, 'Rewards');
    // Contests sit right below the wallet in Rewards.
    assert.ok(await p.$('.contests-head .prize-ic'), 'contest icon');
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
    await p.click('.chip:has-text("Cleansers")');
    await p.click('[data-a="product"][data-arg="gelee-nettoyante-visage"].p-media');
    await p.waitForSelector('.pdp');
    assert.match(await p.textContent('.pdp'), /calendula/);
    await shot(p, '09-product');
    await p.click('[data-a="add-close"]');
    await p.click('.icon-btn[aria-label="Bag"]');
    await p.waitForSelector('[data-a="checkout"]');
    assert.match(await p.textContent('.sheet-card'), /€26/);
    // "Have miles? Redeem a seasonal voucher" opens Rewards right at the vouchers.
    await p.click('[data-a="go-rewards"]');
    await sectionShown(p, 'vouchers');
    await tab(p, 'Shop');
    await p.click('.icon-btn[aria-label="Bag"]');
    await p.waitForSelector('[data-a="checkout"]');
    const beforeOrder = await miles(p);
    await p.click('[data-a="checkout"]');
    await p.waitForSelector('text=Order received');
    assert.match(await p.textContent('.sheet-card'), /Awaiting payment/);
    await p.click('.sheet-card [data-a="close"]');
    assert.equal(await miles(p), beforeOrder, 'no miles before payment');
    step('boutique + order awaiting payment ✓');

    /* 6. Profile photo upload (protected) */
    await tab(p, 'Profile');
    await p.setInputFiles('#photoInput', photo);
    await p.waitForFunction(() => { const a = document.querySelector('.profile-card [data-avatar]'); return a && a.classList.contains('has-photo') && a.style.backgroundImage.startsWith('url("blob:'); }, null, { timeout: 15000 });
    assert.equal(await p.$('.profile-card img'), null, 'photo is not an <img>');
    assert.equal(await p.$eval('.profile-card .avatar', (el) => getComputedStyle(el).userSelect), 'none');
    await shot(p, '10-profile');
    assert.match(await p.textContent('#app'), /Latest purchases[\s\S]*Gelée Nettoyante[\s\S]*Awaiting payment/);
    step('profile photo + latest purchases ✓');

    /* 6b. Contact support and share an idea */
    await p.click('[data-a="support"]');
    await p.selectOption('#supTopic', 'Order');
    await p.fill('#supMsg', 'When will my cleansing jelly ship?');
    await p.click('button:has-text("Send to Seasonly")');
    await p.waitForSelector('text=Message sent');
    await p.click('.sheet-card [data-a="close"]');
    await p.click('[data-a="feedback"]');
    await p.click('[data-a="fb-kind"][data-arg="idea"]');
    await p.fill('#fbMsg', 'A night routine reminder would be lovely');
    await p.click('.sheet-card button:has-text("Send")');
    await p.waitForSelector('text=Idea received');
    await p.click('.sheet-card [data-a="close"]');
    step('support + feature idea ✓');

    /* 7. Referral code, then log out */
    await tab(p, 'Rewards');
    const refCode = (await p.textContent('.referral .code')).trim();
    await tab(p, 'Profile');
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
    await fillAddress(f, '8 rue du Plat', '69002', 'Lyon');
    await f.click('.seg.gender label:has-text("Prefer not to say")');
    await f.check('#consent');
    await f.click('button[type="submit"]');
    await f.waitForSelector('#code');
    assert.match(await f.textContent('.auth'), /by SMS to/);
    await f.fill('#code', await code(f));
    await f.waitForSelector('.stats');
    await tab(f, 'Book');
    assert.match(await f.textContent('#app'), /welcome offer/);
    await f.click('[data-a="pick-studio"][data-arg="canopee"]');
    await f.click('[data-a="pick-service"][data-arg="0:signature"]');
    await f.click('[data-a="step"][data-arg="3"]');
    await f.click('.slot:not([disabled]) >> nth=0');
    await f.click('[data-a="step"][data-arg="4"]');
    assert.match(await f.textContent('.summary'), /Welcome referral offer −10%/);
    assert.match(await f.textContent('.summary'), /€45/);
    await shot(f, '11-book-referral');
    await f.click('[data-a="confirm-booking"]');
    await f.waitForSelector('text=See you soon');
    const bookingId = (await f.textContent('.sheet-card')).match(/BK-[A-Z0-9]+/)[0];
    assert.ok(await f.$('.sheet-card a.route[href*="maps"]'), 'route link');
    await f.click('.sheet-card [data-a="close"]');
    step('friend signs up with link + books with −10% ✓');

    /* 8b. Staff marks the treatment as paid: Julie's miles are credited, the referral counts */
    const admin = await adminApi();
    const bk = (await admin('GET', '/bookings')).bookings.find((x) => x.id === bookingId);
    await tab(f, 'Home');
    const juliesBefore = await miles(f);
    const paid = await admin('POST', `/bookings/${bk.userId}/${bookingId}/pay`);
    const created = await admin('POST', '/contests', { period: 'week', prizeKind: 'soin', prizeRef: 'signature', winners: 2 });
    assert.ok(created.contest.id, 'contest created');
    assert.equal(paid.item.status, 'paid');
    await f.reload(); await f.waitForSelector('.stats');
    assert.equal(await miles(f), juliesBefore + 150);
    // The open contest stands out: banner on Home and a gift badge on the Rewards tab.
    await f.waitForSelector('.contest-hero .prize-ic');
    assert.match(await f.textContent('.contest-hero'), /Contest of the week[\s\S]*Win a Soin Signature/);
    assert.ok(await f.$('.tab[data-arg="rewards"] .tab-prize'), 'gift badge on the Rewards tab');
    await shot(f, '11a-contest-banner');
    await f.click('.contest-hero');
    await sectionShown(f, 'contests');
    await f.click('[data-a="enter-contest"]');
    await f.waitForSelector('#contestList .entered');
    await tab(f, 'Home');
    await f.waitForSelector('.contest-hero.in');
    // Collabs on Home: Seasonly x Blissim, and an event to register for.
    await f.waitForSelector('.collab-card');
    assert.match(await f.textContent('#collabList'), /Blissim/);
    await f.click('.collab-card:has-text("Glow Night")');
    await f.waitForSelector('.collab-view');
    await f.click('[data-a="collab-join"]');
    await f.waitForSelector(".collab-view .entered");
    await shot(f, '11c-collab');
    await f.click('.collab-view [data-a="close"] >> nth=0');
    // Reminder link from the push notification opens the booking with directions.
    await f.goto(`${base}/#booking-${bookingId}`);
    await f.waitForSelector('.sheet-card a.route');
    assert.match(await f.textContent('.sheet-card'), /Face Glow Bar La Canopée[\s\S]*4 passage de la Canopée/);
    await shot(f, '11b-booking-detail');
    await f.click('.sheet-card [data-a="close"]');
    assert.match(await f.textContent('#app'), /Upcoming treatments[\s\S]*Soin Signature[\s\S]*Paid/);
    step('payment credits miles + booking details from reminder link ✓');

    /* 9. Marie signs back in by SMS code and sees her reward */
    await p.click('text=I already have an account');
    await p.fill('#identifier', `marie${n}@example.fr`); // Marie confirmed her email at sign-up
    await p.click('button[type="submit"]');
    await p.waitForSelector('#code');
    await p.fill('#code', await code(p));
    await p.waitForSelector('.stats');
    // "Invite a friend" on Home opens Rewards at the Invite friends section.
    await p.click('.ref-teaser');
    await sectionShown(p, 'invite');
    const rewards = await p.textContent('.referral');
    assert.match(rewards, /1 friend has come in/);
    assert.match(rewards, /current reward −5%/);
    await shot(p, '12-rewards-referral');
    // Group booking: Marie books for herself and two friends.
    await tab(p, 'Book');
    await p.click('[data-a="pick-studio"] >> nth=0');
    await p.click('[data-a="pick-service"][data-arg="0:gym"]');
    await p.click('[data-a="party"][data-arg="1"]');
    await p.click('[data-a="party"][data-arg="1"]');
    assert.equal((await p.textContent('#partyN')).trim(), '3');
    await p.fill('#guest1', 'Inès');
    await p.click('[data-a="pick-service"][data-arg="2:glow"]');
    assert.equal(await p.inputValue('#guest1'), 'Inès', 'guest name kept');
    await shot(p, '12b-group');
    await p.click('[data-a="step"][data-arg="3"]');
    await p.click('.slot:not([disabled]) >> nth=0');
    await p.click('[data-a="step"][data-arg="4"]');
    const sum = await p.textContent('.summary');
    assert.match(sum, /Referral reward −5%/);
    assert.match(sum, /Inès[\s\S]*Soin Gym[\s\S]*Guest 2[\s\S]*Soin Glow/);
    assert.match(sum, /€73\.75/, 'reward on her own treatment, guests at list price');
    await p.click('[data-a="confirm-booking"]');
    await p.waitForSelector('text=See you soon');
    assert.match(await p.textContent('.sheet-card'), /\+250 Skin Miles once paid/);
    await p.click('.sheet-card [data-a="close"]');
    // Skin scan from a photo (analysed on the phone here).
    await tab(p, 'Home');
    const scanBefore = await miles(p);
    await p.click('.scan-card');
    await p.waitForSelector('text=How is my skin');
    await p.setInputFiles('#scanFile', selfie);
    await p.waitForSelector('.scan-photo');
    await p.clock.runFor(4000);
    await p.waitForSelector('text=Your skin today', { timeout: 10000 });
    assert.match(await p.textContent('.sheet-card'), /Hydration[\s\S]*Firmness[\s\S]*not a medical diagnosis/);
    assert.ok(await p.$('.sheet-card [data-a="ritual"]'), 'ritual suggested');
    await shot(p, '12c-scan');
    await p.click('.sheet-card .row [data-a="close"]');
    assert.equal(await miles(p), scanBefore + 15);
    // The camera opens too (fake camera in the test browser).
    await p.click('.scan-card');
    await p.click('[data-a="scan-camera"]');
    await p.waitForFunction(() => { const v = document.getElementById('scVideo'); return v && v.videoWidth > 0; }, null, { timeout: 8000 });
    await p.click('.sheet-card [data-a="close"]');
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
    assert.match(await a.textContent("#toast"), /1 of 1 email/); // only Marie confirmed her email
    await a.click('.nav button:has-text("Push notifications")');
    await a.fill('#pu-title', 'Vouchers are live'); await a.fill('#pu-body', 'Trade your miles now.');
    await a.click('button:has-text("Send notification")');
    await a.waitForFunction(() => /device/.test(document.getElementById('toast').textContent), null, { timeout: 15000 });
    await a.click('.nav button:has-text("Sent messages")');
    await a.waitForSelector('table');
    const outbox = await a.textContent('table');
    assert.match(outbox, /The autumn edit/); assert.match(outbox, /Vouchers are live/); assert.match(outbox, /is your Seasonly code/);
    await shot(a, '14-admin-outbox');
    // Marie enters this week's contest; the admin draws her as the winner.
    await tab(p, 'Rewards');
    await p.waitForSelector('[data-a="enter-contest"]');
    await p.click('[data-a="enter-contest"]');
    await p.waitForSelector('#contestList .entered');
    await a.click('.nav button:has-text("Contests")');
    await a.waitForSelector('[data-a="draw"]');
    await a.click('[data-a="draw"]');
    await a.waitForFunction(() => /Winner: .*Marie/.test(document.getElementById('toast').textContent), null, { timeout: 15000 });
    await a.click('.nav button:has-text("Inbox")');
    await a.waitForSelector('.msg-card');
    const inbox = await a.textContent('.main');
    assert.match(inbox, /When will my cleansing jelly ship\?/); assert.match(inbox, /night routine reminder/);
    await a.fill('form[data-form="reply"] textarea', 'It ships tomorrow!');
    await a.click('form[data-form="reply"] button');
    await a.waitForFunction(() => /Reply sent/.test(document.getElementById('toast').textContent), null, { timeout: 15000 });
    await a.click('.nav button:has-text("Customers")');
    await a.waitForSelector('tbody tr');
    assert.match(await a.textContent('table'), /Julie[\s\S]*Not said/);
    await a.click('.nav button:has-text("Collabs")');
    await a.waitForSelector('.main table b:has-text("Seasonly x Blissim")');
    assert.match(await a.textContent('.main'), /Registered: Julie/);
    await a.click('.nav button:has-text("Ritual videos")');
    await a.waitForSelector('text=Animated guide');
    await a.click('.nav button:has-text("Bookings")');
    await a.waitForSelector('tbody tr');
    assert.match(await a.textContent('table'), /Inès: Soin Gym/);
    step('admin: product + photo + email + push ✓');

    /* 11. Marie's prize is in her profile; the profile invite link opens Rewards */
    await p.reload();
    await p.waitForSelector('.stats');
    await tab(p, 'Profile');
    await p.waitForSelector('#giftList .gift');
    assert.match(await p.textContent('#giftList'), /Soin Signature[\s\S]*Ready to book/);
    assert.match(await p.textContent('.addr-card'), /12 rue de Turenne/);
    await shot(p, '15-gifts');
    await p.click('#app .ref-teaser');
    await sectionShown(p, 'invite');
    assert.match(await p.textContent('#contestList'), /You won/);
    step('contest won + gift in profile + section links ✓');
    /* 12. Shop shows the admin's new product */
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
    await d.fill('#first', 'Léa'); await d.fill('#email', 'lea@example.fr'); await d.fill('#phone', '0611223344');
    await fillAddress(d, '5 cours Mirabeau', '13100', 'Aix-en-Provence'); await d.click('.seg.gender label >> nth=0'); await d.check('#consent');
    await d.click('button[type="submit"]');
    await d.waitForSelector('.demo-code');
    await d.fill('#code', await code(d));
    await d.waitForSelector('.stats');
    await d.click('.checkin-banner'); await d.waitForSelector('.celebrate'); await d.click('.celebrate .btn-dark');
    await tab(d, 'Shop'); await d.click('.p-card .add-mini >> nth=0');
    await d.click('.icon-btn[aria-label="Bag"]'); await d.click('[data-a="checkout"]');
    await d.waitForSelector('text=Order received');
    const demoBefore = (await d.textContent('.sheet-card')).match(/\+(\d+) Skin Miles once paid/)[1];
    await d.click('[data-a="sim-pay"]');
    await d.waitForSelector('.sheet-card :text("Skin Miles credited")');
    assert.ok(Number(demoBefore) > 0);
    await d.click('.sheet-card [data-a="close"]');
    await tab(d, 'Profile'); await d.click('[data-a="logout"]'); await d.click('[data-a="logout-ok"]');
    await d.waitForSelector('text=Create my account');
    step('offline demo mode ✓');

    /* 13. The whole app in French, with no English left; then switched to English */
    const fr = await newPage('fr-FR');
    await fr.goto(base + '/');
    await fr.waitForSelector('text=Créer mon compte');
    await fr.click('text=Créer mon compte');
    await fr.fill('#first', 'Camille'); await fr.fill('#email', `camille${n}@example.fr`); await fr.fill('#phone', '06 55 44 33 2' + n);
    await fillAddress(fr, '3 place Bellecour', '69002', 'Lyon');
    await fr.click('.seg.gender label:has-text("Homme")');
    await fr.check('#consent');
    await fr.click('button[type="submit"]');
    await fr.waitForSelector('#code');
    await fr.fill('#code', await code(fr));
    await fr.waitForSelector('.stats');
    const visible = async () => fr.evaluate(() => document.getElementById('app').innerText + ' ' + (document.querySelector('.sheet-card') ? document.querySelector('.sheet-card').innerText : '') + ' ' + document.getElementById('tabbar').innerText);
    const checkFr = async (where) => {
      const txt = (await visible()).replace(/Face Glow Bar|Skin Miles|Seasonly x \w+|Glow Night|Soin (Gym|Glow|Winter|Signature)|TensioLift|Best-seller|Clean et vegan|Kobido|check-in|Check-in|Peau Neuve/g, '');
      const m = txt.match(ENGLISH);
      assert.equal(m, null, `English word "${m && m[0]}" in the French app (${where})`);
    };
    await fr.clock.runFor(3000);
    assert.match(await fr.textContent('.hero'), /Bonjour, Camille/);
    await checkFr('home');
    for (const [t, sel] of [['shop', '.p-grid'], ['book', '.studio'], ['rewards', '.wallet'], ['profile', '.profile-card']]) {
      await fr.click(`.tab[data-arg="${t}"]`); await fr.waitForSelector(sel); await fr.clock.runFor(1000); await checkFr(t);
    }
    await fr.click('.tab[data-arg="book"]'); await fr.click('[data-a="pick-studio"] >> nth=0'); await fr.click('[data-a="party"][data-arg="1"]'); await checkFr('booking people');
    await fr.click('.tab[data-arg="home"]'); await fr.click('[data-a="rituals"] >> nth=0'); await fr.waitForSelector('.ritual-card'); await checkFr('rituals');
    await fr.click('.sheet-card [data-a="ritual"] >> nth=1'); await fr.waitForSelector('.rv-face'); await checkFr('ritual video');
    assert.match(await fr.textContent('.rv'), /Étape 1 sur 4/);
    await fr.click('.rv [data-a="close"] >> nth=0');
    await fr.click('.scan-card'); await fr.waitForSelector('text=Ouvrir la caméra'); await checkFr('skin scan');
    await fr.click('.sheet-card [data-a="close"]');
    await fr.click('.collab-card >> nth=0'); await fr.waitForSelector('.collab-view'); await checkFr('collab');
    await fr.click('.collab-view [data-a="close"] >> nth=0');
    await fr.click('.icon-glass[data-a="bag"]'); await checkFr('bag'); await fr.click('.sheet-card [data-a="close"]');
    await shot(fr, '16-francais');
    assert.deepEqual(await fr.evaluate(() => [...window.__i18nMissing]), [], 'every text has its French version');
    // Switch to English from the profile: everything changes, nothing stays in French.
    await fr.click('.tab[data-arg="profile"]');
    await fr.click('.lang-switch button[data-arg="en"]');
    await fr.waitForSelector('text=Hello, ');
    assert.match(await fr.textContent('#tabbar'), /Home[\s\S]*Shop[\s\S]*Book[\s\S]*Rewards[\s\S]*Profile/);
    assert.doesNotMatch(await fr.textContent('#app'), /Bonjour|Réglages|Mes cadeaux|Se déconnecter/);
    await fr.reload(); await fr.waitForSelector('.stats');
    assert.match(await fr.textContent('.hero'), /Hello, Camille/, 'the choice is remembered');
    step('French everywhere, then switched to English ✓');

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
  const browser = await playwright.chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
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
