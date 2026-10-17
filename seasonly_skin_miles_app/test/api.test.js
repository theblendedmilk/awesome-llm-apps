'use strict';
/* API tests: run with `npm test`. Each test file run starts a fresh in-memory server. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server/app');
const images = require('../server/images');

let server, base, ctx;
const quiet = { info() {}, warn() {}, error() {} };

before(async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seasonly-test-'));
  ctx = createApp({ dbFile: ':memory:', dataDir, env: { DEV_SHOW_CODES: '1', OTP_SEND_PER_IP: '1000', OTP_VERIFY_PER_IP: '1000', ADMIN_EMAIL: 'admin@seasonly.fr', ADMIN_PASSWORD: 'test-password-123' }, log: quiet });
  await new Promise((ok) => { server = ctx.app.listen(0, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((ok) => server.close(ok)));

/* A tiny client that keeps its own cookie, like one phone. */
function client() {
  let cookie = '';
  async function call(method, url, body, { raw, headers = {}, csrf = true } = {}) {
    const res = await fetch(base + url, {
      method,
      headers: { ...(csrf ? { 'X-Seasonly': '1' } : {}), ...(cookie ? { cookie } : {}), ...(raw ? { 'Content-Type': raw.type || 'image/jpeg' } : body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: raw ? raw.data : body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) { const [pair] = set.split(';'); cookie = pair.endsWith('=') ? '' : pair; }
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data, headers: res.headers };
  }
  return { call, get cookie() { return cookie; } };
}
let phoneN = 10;
async function signup(c, extra = {}) {
  phoneN += 1;
  const r = await c.call('POST', '/api/auth/signup', { first: 'Marie', last: 'Dupont', email: `user${phoneN}@example.fr`, phone: `06 12 34 56 ${phoneN}`, consent: true, channel: 'both', ...extra });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const v = await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devCode });
  assert.equal(v.status, 200, JSON.stringify(v.data));
  return v.data.user;
}
const act = (c, type, payload) => c.call('POST', '/api/actions', { type, payload });
async function adminClient() {
  const a = client();
  await a.call('POST', '/api/admin/login', { email: 'admin@seasonly.fr', password: 'test-password-123' });
  return a;
}
const adminOp = (a, kind, userId, id, op) => a.call('POST', `/api/admin/${kind}/${userId}/${encodeURIComponent(id)}/${op}`);
const miles = async (c) => (await c.call('GET', '/api/me')).data.user.state.miles;

// Minimal JPEG with an EXIF block carrying a fake GPS position, and a comment.
function jpegWithExif() {
  const seg = (marker, payload) => { const b = Buffer.alloc(4); b[0] = 0xff; b[1] = marker; b.writeUInt16BE(payload.length + 2, 2); return Buffer.concat([b, payload]); };
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1')),
    seg(0xe1, Buffer.from('Exif\0\0GPS 48.8566N 2.3522E SECRET-LOCATION', 'latin1')),
    seg(0xfe, Buffer.from('camera serial 12345', 'latin1')),
    seg(0xda, Buffer.from([0x00, 0x01, 0x00, 0x00, 0x3f, 0x00])),
    Buffer.from([0x12, 0x34, 0x56, 0x78, 0xff, 0xd9]),
  ]);
}

test('health, config and catalog', async () => {
  const c = client();
  assert.deepEqual((await c.call('GET', '/api/health')).data, { ok: true, mode: 'server' });
  const cfg = (await c.call('GET', '/api/config')).data;
  assert.ok(cfg.vapidPublicKey.length > 40);
  assert.deepEqual(cfg.referral, { perFriend: 5, cap: 20, welcome: 10 });
  const p = (await c.call('GET', '/api/products')).data.products;
  assert.equal(p.length, 16);
  assert.equal(p.find((x) => x.id === 'serum-tensiolift').price, 79);
  assert.equal(p.find((x) => x.id === 'gelee-nettoyante-visage').price, 26);
});

test('security headers and CSRF guard', async () => {
  const c = client();
  const r = await c.call('GET', '/');
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  const blocked = await c.call('POST', '/api/auth/login', { identifier: 'a@b.fr' }, { csrf: false });
  assert.equal(blocked.status, 403);
});

test('sign-up validation', async () => {
  const c = client();
  const bad = async (body, re) => { const r = await c.call('POST', '/api/auth/signup', { first: 'A', email: 'a@b.fr', phone: '0612345678', consent: true, ...body }); assert.equal(r.status, 400); assert.match(r.data.error, re); };
  await bad({ first: '' }, /first name/);
  await bad({ email: 'nope' }, /email/);
  await bad({ phone: '123' }, /mobile/);
  await bad({ consent: false }, /accept/);
  await bad({ referral: 'NOPE1234' }, /referral code/);
});

test('sign-up, wrong codes, confirmation and welcome gift', async () => {
  const c = client();
  const r = await c.call('POST', '/api/auth/signup', { first: 'Camille', email: 'camille@example.fr', phone: '+33 6 99 88 77 66', consent: true, channel: 'sms' });
  assert.equal(r.status, 200);
  assert.match(r.data.devCode, /^\d{6}$/);
  assert.equal(r.data.sentTo.sms, '+33 •• •• •• 66');
  assert.equal(r.data.sentTo.email, null);
  const wrong = String((Number(r.data.devCode) + 1) % 1e6).padStart(6, '0');
  const w = await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: wrong });
  assert.equal(w.status, 401);
  assert.match(w.data.error, /4 tries left/);
  assert.equal((await c.call('GET', '/api/me')).status, 401, 'no session before confirmation');
  const ok = await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devCode });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.isNew, true);
  assert.equal(ok.data.user.state.miles, 300);
  assert.match(ok.data.user.referralCode, /^CAMILL[A-Z2-9]{4}$/);
  assert.match(c.cookie, /^sid=/);
  // The code can't be reused.
  assert.equal((await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devCode })).status, 410);
  // Same confirmed phone again: refused.
  const dup = await client().call('POST', '/api/auth/signup', { first: 'X', email: 'other@example.fr', phone: '06 99 88 77 66', consent: true });
  assert.equal(dup.status, 409);
  // The code was "sent" by SMS and logged in the outbox (no provider configured).
  const sms = ctx.db.prepare("SELECT * FROM outbox WHERE channel = 'sms' AND to_addr = '+33699887766'").get();
  assert.ok(sms.body.includes(r.data.devCode));
  assert.equal(sms.status, 'logged');
});

test('an unconfirmed email or phone cannot be used to take over an account', async () => {
  // Attacker signs up with the victim's email but their own phone, and confirms only the SMS code.
  const attacker = client();
  const r = await attacker.call('POST', '/api/auth/signup', { first: 'Mallory', email: 'victim@example.fr', phone: '0655555501', consent: true, channel: 'sms' });
  const v = await attacker.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devCode });
  assert.equal(v.status, 200);
  assert.equal(v.data.user.emailVerified, false);
  assert.equal(v.data.user.phoneVerified, true);
  // Signing in with the unconfirmed email sends nothing.
  const probe = await client().call('POST', '/api/auth/login', { identifier: 'victim@example.fr' });
  assert.equal(probe.status, 200);
  assert.equal(probe.data.devCode, undefined);
  // The real owner can still sign up with their email and takes it over by proving it.
  const victim = client();
  const s = await victim.call('POST', '/api/auth/signup', { first: 'Vic', email: 'victim@example.fr', phone: '0655555502', consent: true, channel: 'email' });
  assert.equal(s.status, 200, 'not blocked by the attacker account');
  const sv = await victim.call('POST', '/api/auth/verify', { pending: s.data.pending, code: s.data.devCode });
  assert.equal(sv.status, 200);
  assert.equal(sv.data.user.email, 'victim@example.fr');
  assert.equal(sv.data.user.emailVerified, true);
  // The attacker's account no longer holds the email, and their session can't see the victim's account.
  const me = (await attacker.call('GET', '/api/me')).data.user;
  assert.equal(me.email, null);
  assert.notEqual(me.id, sv.data.user.id);
  // Once confirmed, the email is protected: nobody else can claim it.
  const again = await client().call('POST', '/api/auth/signup', { first: 'X', email: 'victim@example.fr', phone: '0655555503', consent: true });
  assert.equal(again.status, 409);
});

test('choosing both sends two different codes; each confirms its own channel', async () => {
  const c = client();
  const r = await c.call('POST', '/api/auth/signup', { first: 'Both', email: 'both@example.fr', phone: '0655555510', consent: true, channel: 'both' });
  assert.match(r.data.devEmailCode, /^\d{6}$/);
  assert.notEqual(r.data.devCode, r.data.devEmailCode);
  const v = await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devEmailCode });
  assert.equal(v.data.user.emailVerified, true);
  assert.equal(v.data.user.phoneVerified, false);
  const byPhone = await client().call('POST', '/api/auth/login', { identifier: '0655555510' });
  assert.equal(byPhone.data.devCode, undefined, 'unconfirmed phone cannot sign in');
  const byEmail = await client().call('POST', '/api/auth/login', { identifier: 'both@example.fr' });
  assert.match(byEmail.data.devCode, /^\d{6}$/);
});

test('five wrong codes lock the request', async () => {
  const c = client();
  const r = await c.call('POST', '/api/auth/signup', { first: 'Lock', email: 'lock@example.fr', phone: '0677777777', consent: true });
  const wrong = String((Number(r.data.devCode) + 7) % 1e6).padStart(6, '0');
  for (let i = 0; i < 5; i++) await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: wrong });
  const after = await c.call('POST', '/api/auth/verify', { pending: r.data.pending, code: r.data.devCode });
  assert.ok([410, 429].includes(after.status), `locked, got ${after.status}`);
});

test('sign in with a code, then log out', async () => {
  const c = client();
  const u = await signup(c);
  assert.equal((await c.call('POST', '/api/auth/logout')).status, 200);
  assert.equal((await c.call('GET', '/api/me')).status, 401);
  assert.equal((await c.call('GET', '/api/session')).data.user, null);
  // Unknown identifier answers the same way (no account enumeration) but no code works.
  const ghost = await c.call('POST', '/api/auth/login', { identifier: 'ghost@example.fr' });
  assert.equal(ghost.status, 200);
  assert.equal(ghost.data.devCode, undefined);
  // The helper confirmed the phone (SMS code), so that's the detail that signs in.
  const l = await c.call('POST', '/api/auth/login', { identifier: u.phone });
  assert.equal(l.data.channel, 'sms');
  const v = await c.call('POST', '/api/auth/verify', { pending: l.data.pending, code: l.data.devCode });
  assert.equal(v.status, 200);
  assert.equal(v.data.isNew, false);
  assert.equal(v.data.user.state.miles, 300, 'no second welcome gift');
  assert.equal((await c.call('GET', '/api/session')).data.user.id, u.id);
});

test('rewards run on the server', async () => {
  const c = client();
  await signup(c);
  let r = await act(c, 'checkin');
  assert.equal(r.status, 200);
  assert.equal(r.data.result.streak, 1);
  assert.equal(r.data.state.miles, 320);
  assert.equal((await act(c, 'checkin')).status, 422, 'one check-in a day');
  assert.equal((await act(c, 'tip', { id: 'hydration' })).data.state.miles, 330);
  assert.equal((await act(c, 'tip', { id: 'hydration' })).status, 422);
  // Quiz score is computed from the answers, not trusted from the client.
  const answers = [0, 1, 2, 3, 4].map((q) => ({ q, a: [0, 1, 0, 1, 1][q] }));
  r = await act(c, 'quiz', { answers, score: 99 });
  assert.equal(r.data.result.score, 5);
  assert.equal(r.data.result.earned, 50);
  assert.equal((await act(c, 'match', { moves: 2 })).status, 422, 'impossible memory result');
  r = await act(c, 'match', { moves: 8 });
  assert.equal(r.data.result.earned, 70);
  r = await act(c, 'wheel');
  assert.ok([10, 25, 5, 50, 15, 100, 20, 30].includes(r.data.result.earned));
  assert.equal((await act(c, 'wheel')).status, 422);
  for (let i = 0; i < 4; i++) r = await act(c, 'ritualStep', { id: 'evening-lift' });
  assert.ok(r.data.events.some((e) => e.type === 'miles' && e.amt === 50));
  // Server-only actions are refused.
  for (const type of ['welcome', 'referralCredit', 'referralRevoke', 'avatar', 'adjust', 'pay', 'refund']) assert.equal((await act(c, type, { name: 'x' })).status, 400, type);
});

test('vouchers, checkout with server prices, and booking', async () => {
  const c = client();
  const u = await signup(c);
  const season = require('../public/engine.js').seasonOf(new Date()).id;
  const v = require('../public/engine.js').VOUCHERS.find((x) => x.season === season && x.kind === 'product');
  assert.equal((await act(c, 'redeem', { id: v.id })).status, 422, 'not enough miles yet');
  // Admin gives miles.
  const a = client();
  await a.call('POST', '/api/admin/login', { email: 'admin@seasonly.fr', password: 'test-password-123' });
  assert.equal((await a.call('POST', `/api/admin/users/${u.id}/miles`, { amount: 2000, reason: 'Gift' })).status, 200);
  let r = await act(c, 'redeem', { id: v.id });
  assert.equal(r.status, 200);
  const code = r.data.result.voucher.code;
  assert.match(code, /^SEAS-[A-Z2-9]{6}$/);
  // The client can't set prices: it only sends ids and quantities.
  r = await act(c, 'checkout', { lines: [{ id: 'serum-tensiolift', qty: 1, price: 1 }], voucher: code });
  assert.equal(r.status, 200);
  const o = r.data.result.order;
  assert.equal(o.subtotal, 79);
  assert.equal(o.total, 79 - require('../public/engine.js').discount(v, 79));
  assert.equal((await act(c, 'checkout', { lines: [{ id: 'serum-tensiolift', qty: 1 }], voucher: code })).status, 422, 'voucher used once');
  assert.equal((await act(c, 'checkout', { lines: [{ id: 'does-not-exist', qty: 1 }] })).status, 422);
  r = await act(c, 'book', { studio: 'canopee', service: 'gym', day: 2, slot: '10:00' });
  assert.equal(r.status, 200);
  assert.equal(r.data.result.booking.price, 25);
  assert.equal((await act(c, 'book', { studio: 'canopee', service: 'gym', day: 0, slot: '10:00' })).status, 422);
});

test('miles are credited only after payment and taken back on refund', async () => {
  const c = client();
  const u = await signup(c, { channel: 'email' });
  const a = await adminClient();
  const start = await miles(c);
  // Order: nothing credited until paid.
  let r = await act(c, 'checkout', { lines: [{ id: 'serum-tensiolift', qty: 2 }] });
  const o = r.data.result.order;
  assert.equal(o.status, 'pending');
  assert.equal(o.miles, 158);
  assert.equal(await miles(c), start, 'no miles before payment');
  assert.ok(ctx.db.prepare('SELECT 1 FROM outbox WHERE to_addr = ? AND subject LIKE ?').get(u.email, `%order ${o.id}%`), 'order email');
  r = await adminOp(a, 'orders', u.id, o.id, 'pay');
  assert.equal(r.status, 200);
  assert.equal(r.data.item.credited, 158);
  assert.equal(await miles(c), start + 158);
  assert.equal((await adminOp(a, 'orders', u.id, o.id, 'pay')).status, 422, 'cannot pay twice');
  // Customer asks for a refund; staff refunds; miles are deducted.
  r = await act(c, 'cancel', { kind: 'order', id: o.id });
  assert.equal(r.data.result.item.status, 'refund_requested');
  assert.equal(await miles(c), start + 158, 'still credited until refunded');
  r = await adminOp(a, 'orders', u.id, o.id, 'refund');
  assert.equal(r.data.item.status, 'refunded');
  assert.equal(await miles(c), start, 'refund takes the miles back');
  const me = (await c.call('GET', '/api/me')).data.user.state;
  assert.ok(me.ledger.some((l) => l.kind === 'refund' && l.amt === -158));
  // Unpaid order cancelled: voucher comes back, no miles involved.
  await a.call('POST', `/api/admin/users/${u.id}/miles`, { amount: 2000, reason: 'Gift' });
  const E = require('../public/engine.js');
  const v = E.VOUCHERS.find((x) => x.season === E.seasonOf(new Date()).id && x.kind === 'product');
  const code = (await act(c, 'redeem', { id: v.id })).data.result.voucher.code;
  const o2 = (await act(c, 'checkout', { lines: [{ id: 'creme-riche', qty: 1 }], voucher: code })).data.result.order;
  r = await act(c, 'cancel', { kind: 'order', id: o2.id });
  assert.equal(r.data.result.item.status, 'cancelled');
  assert.equal(r.data.state.vouchers.find((x) => x.code === code).used, false, 'voucher restored');
  assert.equal((await act(c, 'cancel', { kind: 'order', id: o2.id })).status, 422);
  // Booking: confirmation email, credited when paid at the studio.
  const before = await miles(c);
  r = await act(c, 'book', { studio: 'canopee', service: 'glow', day: 2, slot: '13:00' });
  const b = r.data.result.booking;
  assert.equal(b.status, 'booked');
  assert.equal(await miles(c), before);
  const mail = ctx.db.prepare('SELECT * FROM outbox WHERE to_addr = ? AND subject LIKE ? ORDER BY id DESC').get(u.email, '%is booked%');
  assert.ok(mail && mail.body.includes('4 passage de la Canopée') && mail.body.includes('google.com/maps/dir'), 'booking confirmation with directions');
  await adminOp(a, 'bookings', u.id, b.id, 'pay');
  assert.ok(await miles(c) > before);
  // Up to 3 unpaid bookings at a time.
  for (let i = 0; i < 3; i++) assert.equal((await act(c, 'book', { studio: 'canopee', service: 'gym', day: 5 + i, slot: '10:00' })).status, 200);
  assert.equal((await act(c, 'book', { studio: 'canopee', service: 'gym', day: 9, slot: '10:00' })).status, 422);
});

test('booking confirmation is never emailed to an unconfirmed address', async () => {
  const c = client();
  const u = await signup(c); // phone confirmed only
  await act(c, 'book', { studio: 'canopee', service: 'gym', day: 2, slot: '10:00' });
  assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM outbox WHERE to_addr = ? AND subject LIKE ?').get(u.email, '%is booked%').n, 0);
});

test('push reminder one hour before the treatment', async () => {
  const c = client();
  const u = await signup(c);
  const b = (await act(c, 'book', { studio: 'canopee', service: 'gym', day: 1, slot: '10:00' })).data.result.booking;
  assert.equal(await ctx.runReminders(b.startAt - 2 * 3600 * 1000), 0, 'too early');
  assert.equal(await ctx.runReminders(b.startAt - 55 * 60 * 1000), 1, 'within the hour');
  assert.equal(await ctx.runReminders(b.startAt - 50 * 60 * 1000), 0, 'only once');
  const push = ctx.db.prepare("SELECT * FROM outbox WHERE channel = 'push' AND subject LIKE ? ORDER BY id DESC").get('%starts at 10:00%');
  assert.ok(push, 'reminder sent');
  const state = (await c.call('GET', '/api/me')).data.user.state;
  assert.equal(state.bookings.find((x) => x.id === b.id).reminded, true);
  // Cancelled bookings get no reminder.
  const b2 = (await act(c, 'book', { studio: 'canopee', service: 'gym', day: 1, slot: '13:00' })).data.result.booking;
  await act(c, 'cancel', { kind: 'booking', id: b2.id });
  assert.equal(await ctx.runReminders(b2.startAt - 30 * 60 * 1000), 0);
  assert.ok(u.id);
});

test('support, feedback and ideas reach the admin inbox', async () => {
  const c = client();
  const u = await signup(c, { channel: 'email' });
  assert.equal((await c.call('POST', '/api/support', { topic: 'Booking', message: 'hi' })).status, 400, 'too short');
  let r = await c.call('POST', '/api/support', { topic: 'Booking', ref: 'BK-1', message: 'Can I move my treatment to Friday?' });
  assert.equal(r.status, 201);
  assert.ok(ctx.db.prepare("SELECT 1 FROM outbox WHERE to_addr = 'hello@seasonly.fr' AND subject LIKE ?").get(`%Support #${r.data.id}%`), 'team notified');
  assert.equal((await c.call('POST', '/api/feedback', { kind: 'feedback', rating: 9, message: 'Great' })).status, 400);
  assert.equal((await c.call('POST', '/api/feedback', { kind: 'feedback', rating: 5, message: 'Love the rituals' })).status, 201);
  assert.equal((await c.call('POST', '/api/feedback', { kind: 'idea', message: 'A night routine timer please' })).status, 201);
  assert.equal((await client().call('POST', '/api/support', { message: 'anonymous message' })).status, 401);
  const a = await adminClient();
  const inbox = (await a.call('GET', '/api/admin/messages')).data.messages.filter((m) => m.user_id === u.id);
  assert.deepEqual(inbox.map((m) => m.kind).sort(), ['feedback', 'idea', 'support']);
  const sup = inbox.find((m) => m.kind === 'support');
  assert.equal((await a.call('POST', `/api/admin/messages/${sup.id}/reply`, { body: 'Of course, done!' })).status, 200);
  const mine = (await c.call('GET', '/api/me/messages')).data.messages.find((m) => m.id === sup.id);
  assert.equal(mine.reply, 'Of course, done!');
  assert.equal(mine.status, 'resolved');
  assert.ok(ctx.db.prepare('SELECT 1 FROM outbox WHERE to_addr = ? AND body LIKE ?').get(u.email, '%Of course, done!%'), 'reply emailed');
  assert.equal((await a.call('GET', '/api/admin/messages?kind=idea')).data.messages.every((m) => m.kind === 'idea'), true);
});

test('admin panel is closed without a password; codes only go to served countries', async () => {
  const fs2 = require('node:fs');
  const closed = createApp({ dbFile: ':memory:', dataDir: fs2.mkdtempSync(path.join(os.tmpdir(), 'seasonly-closed-')), env: { NODE_ENV: '', ADMIN_PASSWORD: '' }, log: quiet });
  const s2 = await new Promise((ok) => { const x = closed.app.listen(0, '127.0.0.1', () => ok(x)); });
  const res = await fetch(`http://127.0.0.1:${s2.address().port}/api/admin/login`, { method: 'POST', headers: { 'X-Seasonly': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@seasonly.fr', password: 'seasonly-admin' }) });
  assert.equal(res.status, 503);
  s2.close();
  const uk = await client().call('POST', '/api/auth/signup', { first: 'Al', email: 'al@example.co.uk', phone: '+447700900123', consent: true });
  assert.equal(uk.status, 400);
  assert.match(uk.data.error, /France/);
});

test('referral: friend gets 10%, referrer earns 5% per friend up to 20%', async () => {
  const ref = client();
  const a = await adminClient();
  const referrer = await signup(ref, { channel: 'email' }); // confirms the email, so the reward email can go out
  const friends = [];
  for (let i = 0; i < 5; i++) {
    const f = client();
    const fu = await signup(f, { referral: referrer.referralCode.toLowerCase() });
    assert.equal(fu.state.referral.welcome, 10);
    const b = await act(f, 'book', { studio: 'saint-lazare', service: 'signature', day: 3, slot: '14:30' });
    assert.equal(b.data.result.booking.price, 45, 'friend pays €50 − 10%');
    // Booking alone doesn't count: the friend must pay for the treatment.
    if (i === 0) assert.equal((await ref.call('GET', '/api/me')).data.user.state.referral.friends, 0);
    await adminOp(a, 'bookings', fu.id, b.data.result.booking.id, 'pay');
    // A second booking by the same friend doesn't count twice.
    const b2 = await act(f, 'book', { studio: 'saint-lazare', service: 'signature', day: 4, slot: '14:30' });
    assert.equal(b2.data.result.booking.price, 50);
    friends.push(f);
  }
  let me = (await ref.call('GET', '/api/me')).data.user.state;
  assert.equal(me.referral.friends, 5);
  assert.equal(me.referral.discount, 20, 'capped at 20%');
  assert.equal(me.miles, 300 + 5 * 200);
  const b = await act(ref, 'book', { studio: 'beaugrenelle', service: 'signature', day: 1, slot: '11:30' });
  assert.equal(b.data.result.booking.price, 40);
  me = (await ref.call('GET', '/api/me')).data.user.state;
  assert.equal(me.referral.discount, 0, 'reward used');
  // Own code is refused.
  const self = await client().call('POST', '/api/auth/signup', { first: 'Me', email: referrer.email, phone: '0600000099', consent: true, referral: referrer.referralCode });
  assert.equal(self.status, 400);
  // Referrer was notified by email.
  assert.ok(ctx.db.prepare('SELECT 1 FROM outbox WHERE to_addr = ? AND subject LIKE ?').get(referrer.email, '%reward is ready%'));
  // A refunded qualifying booking reverses the reward.
  const f = client();
  const fu = await signup(f, { referral: referrer.referralCode });
  const fb = (await act(f, 'book', { studio: 'canopee', service: 'gym', day: 2, slot: '10:00' })).data.result.booking;
  await adminOp(a, 'bookings', fu.id, fb.id, 'pay');
  let st = (await ref.call('GET', '/api/me')).data.user.state;
  assert.equal(st.referral.friends, 6);
  await adminOp(a, 'bookings', fu.id, fb.id, 'refund');
  st = (await ref.call('GET', '/api/me')).data.user.state;
  assert.equal(st.referral.friends, 5);
  assert.ok(st.ledger.some((l) => l.kind === 'refund' && l.amt === -200));
  // A friend with only an email confirmed (no phone proof) doesn't earn the referrer anything.
  const e = client();
  const eu = await signup(e, { referral: referrer.referralCode, channel: 'email' });
  const eb = (await act(e, 'book', { studio: 'canopee', service: 'gym', day: 3, slot: '10:00' })).data.result.booking;
  await adminOp(a, 'bookings', eu.id, eb.id, 'pay');
  assert.equal((await ref.call('GET', '/api/me')).data.user.state.referral.friends, 5);
});

test('profile photo: metadata stripped, encrypted at rest, owner-only', async () => {
  const c = client();
  const u = await signup(c);
  const up = await c.call('POST', '/api/me/avatar', null, { raw: { data: jpegWithExif(), type: 'image/jpeg' } });
  assert.equal(up.status, 200, JSON.stringify(up.data));
  assert.equal(up.data.user.hasAvatar, true);
  const row = ctx.db.prepare('SELECT * FROM images WHERE owner = ?').get(`user:${u.id}`);
  assert.equal(row.private, 1);
  assert.ok(!Buffer.from(row.data).includes(Buffer.from('JFIF')), 'stored encrypted');
  const got = await c.call('GET', '/api/me/avatar');
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.ok(got.data.includes(Buffer.from('JFIF')));
  assert.ok(!got.data.includes(Buffer.from('SECRET-LOCATION')), 'EXIF removed');
  assert.ok(!got.data.includes(Buffer.from('camera serial')), 'comment removed');
  // Nobody else can fetch it, and it isn't reachable through the public image route.
  assert.equal((await client().call('GET', '/api/me/avatar')).status, 401);
  const other = client(); await signup(other);
  assert.equal((await other.call('GET', '/api/me/avatar')).status, 404);
  assert.equal((await client().call('GET', `/api/images/${row.id}`)).status, 404);
  // Only real images, max 5 MB.
  assert.equal((await c.call('POST', '/api/me/avatar', null, { raw: { data: Buffer.from('<script>alert(1)</script>'), type: 'image/png' } })).status, 415);
  assert.equal((await c.call('POST', '/api/me/avatar', null, { raw: { data: Buffer.alloc(6 * 1024 * 1024, 1), type: 'image/jpeg' } })).status, 413);
  assert.equal((await c.call('DELETE', '/api/me/avatar')).data.user.hasAvatar, false);
  assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM images WHERE owner = ?').get(`user:${u.id}`).n, 0);
});

test('PNG metadata is stripped', () => {
  const crc = Buffer.alloc(4);
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); return Buffer.concat([len, Buffer.from(type, 'latin1'), data, crc]); };
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.alloc(13)), chunk('tEXt', Buffer.from('GPS secret')), chunk('IDAT', Buffer.alloc(4)), chunk('IEND', Buffer.alloc(0))]);
  const out = images.clean(png);
  assert.equal(out.mime, 'image/png');
  assert.ok(!out.data.includes(Buffer.from('GPS secret')));
  assert.ok(out.data.includes(Buffer.from('IDAT')));
});

test('push subscription and account deletion', async () => {
  const c = client();
  await signup(c);
  assert.equal((await c.call('POST', '/api/push/subscribe', { subscription: { endpoint: 'http://evil', keys: {} } })).status, 400);
  assert.equal((await c.call('POST', '/api/push/subscribe', { subscription: { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'x', auth: 'y' } } })).status, 200);
  assert.equal((await c.call('GET', '/api/me')).data.user.push, true);
  assert.equal((await c.call('DELETE', '/api/me')).status, 200);
  assert.equal((await c.call('GET', '/api/me')).status, 401);
  assert.equal(ctx.db.prepare("SELECT COUNT(*) AS n FROM push_subs WHERE endpoint = 'https://push.example.com/abc'").get().n, 0);
});

test('admin panel API', async () => {
  const a = client();
  assert.equal((await a.call('GET', '/api/admin/stats')).status, 401);
  assert.equal((await a.call('POST', '/api/admin/login', { email: 'admin@seasonly.fr', password: 'wrong' })).status, 401);
  assert.equal((await a.call('POST', '/api/admin/login', { email: 'admin@seasonly.fr', password: 'test-password-123' })).status, 200);
  const stats = (await a.call('GET', '/api/admin/stats')).data;
  assert.ok(stats.users >= 1);
  // Products: create, edit, photo, hide, delete.
  let r = await a.call('POST', '/api/admin/products', { name: 'Brume Saison', sub: 'Face mist', price: '24.5', size: '100 ml', cat: 'Crèmes', desc: 'A fresh mist.', stats: [['+30%', 'Hydration']] });
  assert.equal(r.status, 201);
  const id = r.data.product.id;
  assert.equal((await a.call('POST', '/api/admin/products', { name: 'Bad', price: -1 })).status, 400);
  r = await a.call('PUT', `/api/admin/products/${id}`, { price: 26, badge: 'New' });
  assert.equal(r.data.product.price, 26);
  r = await a.call('POST', `/api/admin/products/${id}/image`, null, { raw: { data: jpegWithExif(), type: 'image/jpeg' } });
  assert.equal(r.status, 200);
  const img = await client().call('GET', r.data.product.image);
  assert.equal(img.status, 200, 'product photos are public');
  assert.ok(!img.data.includes(Buffer.from('SECRET-LOCATION')));
  let pub = (await client().call('GET', '/api/products')).data.products;
  assert.ok(pub.find((p) => p.id === id && p.price === 26 && p.image));
  await a.call('PUT', `/api/admin/products/${id}`, { active: false });
  pub = (await client().call('GET', '/api/products')).data.products;
  assert.ok(!pub.find((p) => p.id === id), 'hidden products are not in the app');
  assert.equal((await a.call('DELETE', `/api/admin/products/${id}`)).status, 200);
  // Customers, bookings, orders, referrals.
  assert.ok((await a.call('GET', '/api/admin/users?q=example')).data.users.length >= 1);
  assert.ok(Array.isArray((await a.call('GET', '/api/admin/bookings')).data.bookings));
  assert.ok(Array.isArray((await a.call('GET', '/api/admin/orders')).data.orders));
  assert.ok(Array.isArray((await a.call('GET', '/api/admin/referrals')).data.referrals));
  // Email and push.
  r = await a.call('POST', '/api/admin/email', { audience: 'all', subject: 'Autumn edit', body: 'Bonjour {first},\n\nNew season!' });
  assert.equal(r.status, 200);
  assert.ok(r.data.recipients >= 1 && r.data.sent === r.data.recipients);
  const mail = ctx.db.prepare("SELECT * FROM outbox WHERE subject = 'Autumn edit' LIMIT 1").get();
  assert.ok(mail.body.startsWith('Bonjour ') && !mail.body.includes('{first}'));
  assert.equal((await a.call('POST', '/api/admin/email', { audience: 'one', to: 'nobody@x.fr', subject: 's', body: 'b' })).status, 400);
  r = await a.call('POST', '/api/admin/push', { audience: 'all', title: 'Hello', body: 'World', url: '/#book' });
  assert.equal(r.status, 200);
  assert.ok(ctx.db.prepare("SELECT 1 FROM outbox WHERE channel = 'push' AND subject = 'Hello'").get());
  assert.ok((await a.call('GET', '/api/admin/outbox')).data.outbox.length > 3);
  // Settings.
  assert.equal((await a.call('PUT', '/api/admin/settings', { referral: { perFriend: 5, cap: 90, welcome: 10 } })).status, 400);
  r = await a.call('PUT', '/api/admin/settings', { referral: { perFriend: 4, cap: 20, welcome: 15 } });
  assert.deepEqual(r.data.referral, { perFriend: 4, cap: 20, welcome: 15 });
  assert.equal((await client().call('GET', '/api/config')).data.referral.welcome, 15);
  await a.call('PUT', '/api/admin/settings', { referral: { perFriend: 5, cap: 20, welcome: 10 } });
  r = await a.call('POST', '/api/admin/settings/hero', null, { raw: { data: jpegWithExif(), type: 'image/jpeg' } });
  assert.match(r.data.hero, /^\/api\/images\//);
  assert.equal((await client().call('GET', '/api/config')).data.hero, r.data.hero);
  // Customers can't reach admin routes.
  const cust = client(); await signup(cust);
  assert.equal((await cust.call('GET', '/api/admin/stats')).status, 401);
  assert.equal((await a.call('POST', '/api/admin/logout')).status, 200);
  assert.equal((await a.call('GET', '/api/admin/stats')).status, 401);
});
