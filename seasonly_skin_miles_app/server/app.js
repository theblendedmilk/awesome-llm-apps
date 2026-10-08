'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

const Engine = require('../public/engine.js');
const Catalog = require('../public/catalog.js');
const { openDb } = require('./db');
const sec = require('./security');
const images = require('./images');
const { createNotifier } = require('./notify');

const DAY = 864e5;
const SESSION_DAYS = 30;
const OTP_TTL = 10 * 60 * 1000;
const OTP_RESEND = 30 * 1000;
const OTP_ATTEMPTS = 5;
// Actions a signed-in user may run. Everything else (welcome bonus, referral credit, admin adjustments) is server-only.
const USER_ACTIONS = new Set(['checkin', 'tip', 'ritualStep', 'ritualRestart', 'match', 'quiz', 'wheel', 'redeem', 'claim', 'checkout', 'book', 'profile', 'fav']);
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg, status = 400) => { throw new HttpError(status, msg); };
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function loadKey(dataDir, env) {
  if (env.IMAGE_KEY) {
    const k = Buffer.from(env.IMAGE_KEY, 'hex');
    if (k.length !== 32) throw new Error('IMAGE_KEY must be 64 hex characters (32 bytes).');
    return k;
  }
  const file = path.join(dataDir, 'image.key');
  if (fs.existsSync(file)) return Buffer.from(fs.readFileSync(file, 'utf8').trim(), 'hex');
  const k = crypto.randomBytes(32);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, k.toString('hex'), { mode: 0o600 });
  return k;
}

function createApp(opts = {}) {
  const env = { ...process.env, ...(opts.env || {}) };
  const dataDir = opts.dataDir || env.DATA_DIR || path.join(__dirname, '..', 'data');
  const db = openDb(opts.dbFile || path.join(dataDir, 'seasonly.db'));
  const imageKey = opts.imageKey || loadKey(dataDir, env);
  const log = opts.log || console;
  const notifier = createNotifier(db, env, log);
  const allow = sec.rateLimiter();
  const production = env.NODE_ENV === 'production';
  const showCodes = env.DEV_SHOW_CODES === '1' && !production;
  const secureCookies = production || env.SECURE_COOKIES === '1';
  const now = () => (opts.clock ? opts.clock() : new Date());
  // Per-IP limits (codes sent per hour, code checks per 10 minutes). Raise them behind a shared NAT if needed.
  const SEND_PER_IP = Number(env.OTP_SEND_PER_IP) || 10;
  const VERIFY_PER_IP = Number(env.OTP_VERIFY_PER_IP) || 30;

  /* ---------- Seed ---------- */
  if (!db.prepare('SELECT COUNT(*) AS n FROM products').get().n) {
    const ins = db.prepare('INSERT INTO products (id, data, updated_at) VALUES (?, ?, ?)');
    db.tx(() => Catalog.PRODUCTS.forEach((p) => ins.run(p.id, JSON.stringify(p), Date.now())));
  }
  if (!db.getSetting('referral')) db.setSetting('referral', Engine.DEFAULT_REFERRAL);
  const adminEmail = (env.ADMIN_EMAIL || 'admin@seasonly.fr').toLowerCase();
  let adminHash = null;
  if (env.ADMIN_PASSWORD) adminHash = sec.hashPassword(env.ADMIN_PASSWORD);
  else if (!production) { adminHash = sec.hashPassword('seasonly-admin'); log.warn?.('ADMIN_PASSWORD not set — using the development password "seasonly-admin".'); }

  /* ---------- Helpers ---------- */
  const products = (all = false) => db.prepare('SELECT data FROM products').all().map((r) => JSON.parse(r.data))
    .filter((p) => all || p.active).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const getUser = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const stateOf = (u) => JSON.parse(u.state);
  const saveState = (id, state) => db.prepare('UPDATE users SET state = ?, first = ?, last = ? WHERE id = ?').run(JSON.stringify(state), state.profile.first, state.profile.last, id);
  const settings = () => ({ referral: db.getSetting('referral', Engine.DEFAULT_REFERRAL), hero: db.getSetting('hero', null) });
  const ctxFor = () => ({ now: now(), products: products(), settings: settings(), codeFor: voucherCode });
  const ip = (req) => req.ip || req.socket.remoteAddress || 'unknown';

  function voucherCode() {
    let code;
    do { code = 'SEAS-' + Array.from(crypto.randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join(''); }
    while (db.prepare("SELECT 1 FROM users WHERE state LIKE ?").get(`%"${code}"%`));
    return code;
  }
  function referralCode(first) {
    const base = first.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) || 'SEASON';
    let code;
    do { code = base + Array.from(crypto.randomBytes(4), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join(''); }
    while (db.prepare('SELECT 1 FROM users WHERE referral_code = ?').get(code));
    return code;
  }

  function publicUser(u) {
    const state = stateOf(u);
    return {
      id: u.id, first: u.first, last: u.last, email: u.email, phone: u.phone, referralCode: u.referral_code,
      hasAvatar: !!u.avatar_id, avatarVersion: u.avatar_id ? u.avatar_id.slice(0, 8) : null, state,
      push: !!db.prepare('SELECT 1 FROM push_subs WHERE user_id = ?').get(u.id),
    };
  }

  /* ---------- Sessions ---------- */
  function startSession(res, userId) {
    const t = sec.token();
    db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(sec.sha256(t), userId, Date.now(), Date.now() + SESSION_DAYS * DAY);
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), userId);
    res.setHeader('Set-Cookie', sec.cookie('sid', t, { maxAge: SESSION_DAYS * 86400, secure: secureCookies }));
  }
  function auth(req, res, next) {
    const t = sec.parseCookies(req.headers.cookie).sid;
    const row = t && db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(sec.sha256(t), Date.now());
    const user = row && getUser(row.user_id);
    if (!user || !user.verified) return res.status(401).json({ error: 'Please sign in again.' });
    req.user = user; req.sessionHash = row.token_hash;
    next();
  }
  function adminAuth(req, res, next) {
    const t = sec.parseCookies(req.headers.cookie).aid;
    const row = t && db.prepare('SELECT * FROM admin_sessions WHERE token_hash = ? AND expires_at > ?').get(sec.sha256(t), Date.now());
    if (!row) return res.status(401).json({ error: 'Admin sign-in required.' });
    req.adminHash = row.token_hash;
    next();
  }

  /* ---------- One-time codes ---------- */
  async function sendCode(user, purpose, channel) {
    const id = sec.token(18);
    const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
    db.prepare('DELETE FROM otps WHERE user_id = ? AND purpose = ?').run(user.id, purpose);
    db.prepare('INSERT INTO otps (id, user_id, purpose, code_hash, channel, attempts, sent_at, expires_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
      .run(id, user.id, purpose, sec.sha256(id + code), channel, Date.now(), Date.now() + OTP_TTL);
    await deliverCode(user, channel, code);
    return { id, code };
  }
  async function deliverCode(user, channel, code) {
    const text = `${code} is your Seasonly code. It expires in 10 minutes. Never share it — Seasonly will never ask you for it.`;
    const jobs = [];
    if (channel === 'sms' || channel === 'both') jobs.push(notifier.sms(user.phone, `Seasonly: ${text}`));
    if (channel === 'email' || channel === 'both') jobs.push(notifier.email(user.email, `${code} is your Seasonly code`, `Bonjour ${user.first},\n\n${text}\n\nIf you didn't ask for this code, you can ignore this email.`));
    const results = await Promise.allSettled(jobs);
    if (results.every((r) => r.status === 'rejected')) bad('We could not send your code. Check your details or try the other option.', 502);
    if (production && results.every((r) => r.status === 'fulfilled' && !r.value.delivered)) bad('Code delivery is not configured yet. Contact Seasonly support.', 503);
  }
  const pendingResponse = (user, otp, channel) => ({
    pending: otp.id, channel,
    sentTo: { sms: channel !== 'email' ? sec.maskPhone(user.phone) : null, email: channel !== 'sms' ? sec.maskEmail(user.email) : null },
    ...(showCodes ? { devCode: otp.code } : {}),
  });
  const channelOf = (c) => (['sms', 'email', 'both'].includes(c) ? c : 'sms');

  /* ---------- App ---------- */
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY === '1' ? 1 : false);
  app.use(sec.headers);
  const api = express.Router();
  api.use(sec.csrf);
  api.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  const json = express.json({ limit: '64kb' });
  const raw = express.raw({ type: ['image/jpeg', 'image/png', 'application/octet-stream'], limit: images.MAX_BYTES });

  api.get('/health', (req, res) => res.json({ ok: true, mode: 'server' }));
  api.get('/config', (req, res) => {
    const s = settings();
    res.json({ vapidPublicKey: notifier.vapidPublicKey, referral: s.referral, hero: s.hero ? `/api/images/${s.hero}` : null, channels: notifier.status });
  });
  api.get('/products', (req, res) => res.json({ products: products().map((p) => ({ ...p, image: p.imageId ? `/api/images/${p.imageId}` : null })) }));
  api.get('/images/:id', (req, res) => {
    const img = db.prepare('SELECT * FROM images WHERE id = ? AND private = 0').get(req.params.id);
    if (!img) return res.status(404).end();
    res.setHeader('Content-Type', img.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(img.data);
  });

  /* Sign up: create (or refresh) an unverified account and send a code. */
  api.post('/auth/signup', json, wrap(async (req, res) => {
    if (!allow('send:' + ip(req), SEND_PER_IP, 60 * 60 * 1000)) bad('Too many codes requested. Try again in an hour.', 429);
    const b = req.body || {};
    const first = String(b.first || '').trim().slice(0, 40), last = String(b.last || '').trim().slice(0, 40);
    const email = sec.normalizeEmail(b.email), phone = sec.normalizePhone(b.phone);
    if (!first) bad('Enter your first name.');
    if (!email) bad('Enter a valid email address.');
    if (!phone) bad('Enter a valid mobile number, for example 06 12 34 56 78.');
    if (b.consent !== true) bad('Please accept the terms and privacy policy to continue.');
    if (!allow('send:' + phone, 5, 60 * 60 * 1000) || !allow('send:' + email, 5, 60 * 60 * 1000)) bad('Too many codes requested. Try again in an hour.', 429);
    let referredBy = null;
    if (b.referral) {
      const code = String(b.referral).trim().toUpperCase();
      const referrer = db.prepare('SELECT * FROM users WHERE referral_code = ? AND verified = 1').get(code);
      if (!referrer) bad('This referral code does not exist. Check it or leave the field empty.');
      if (referrer.email === email || referrer.phone === phone) bad('You cannot use your own referral code.');
      referredBy = code;
    }
    const existing = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').all(email, phone);
    if (existing.some((u) => u.verified)) bad('An account already exists with this email or phone number. Sign in instead.', 409);
    // Unverified leftovers with these details are replaced.
    existing.forEach((u) => db.prepare('DELETE FROM users WHERE id = ?').run(u.id));
    const state = Engine.newState({ first, last, email, phone, referredBy }, now());
    const info = db.prepare('INSERT INTO users (first, last, email, phone, verified, referred_by, state, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)')
      .run(first, last, email, phone, referredBy, JSON.stringify(state), Date.now());
    const user = getUser(info.lastInsertRowid);
    const channel = channelOf(b.channel);
    const otp = await sendCode(user, 'signup', channel);
    res.json(pendingResponse(user, otp, channel));
  }));

  /* Sign in: always answers the same way so the response doesn't reveal who has an account. */
  api.post('/auth/login', json, wrap(async (req, res) => {
    if (!allow('send:' + ip(req), SEND_PER_IP, 60 * 60 * 1000)) bad('Too many codes requested. Try again in an hour.', 429);
    const id = String((req.body || {}).identifier || '').trim();
    const email = sec.normalizeEmail(id), phone = email ? null : sec.normalizePhone(id);
    if (!email && !phone) bad('Enter the email or mobile number of your account.');
    if (!allow('send:' + (email || phone), 5, 60 * 60 * 1000)) bad('Too many codes requested. Try again in an hour.', 429);
    const user = db.prepare(`SELECT * FROM users WHERE ${email ? 'email' : 'phone'} = ? AND verified = 1`).get(email || phone);
    const channel = email ? 'email' : 'sms';
    if (!user) {
      return res.json({ pending: sec.token(18), channel, sentTo: email ? { email: sec.maskEmail(email) } : { sms: sec.maskPhone(phone) } });
    }
    const otp = await sendCode(user, 'login', channel);
    res.json(pendingResponse(user, otp, channel));
  }));

  api.post('/auth/resend', json, wrap(async (req, res) => {
    const b = req.body || {};
    const row = db.prepare('SELECT * FROM otps WHERE id = ?').get(String(b.pending || ''));
    if (!row) bad('This code request expired. Start again.', 410);
    if (Date.now() - row.sent_at < OTP_RESEND) bad('Wait a few seconds before asking for a new code.', 429);
    if (!allow('send:' + ip(req), SEND_PER_IP, 60 * 60 * 1000)) bad('Too many codes requested. Try again in an hour.', 429);
    const user = getUser(row.user_id);
    if (!user) bad('This code request expired. Start again.', 410);
    const channel = row.purpose === 'signup' ? channelOf(b.channel || row.channel) : row.channel;
    const otp = await sendCode(user, row.purpose, channel);
    res.json(pendingResponse(user, otp, channel));
  }));

  api.post('/auth/verify', json, wrap(async (req, res) => {
    if (!allow('verify:' + ip(req), VERIFY_PER_IP, 10 * 60 * 1000)) bad('Too many attempts. Wait 10 minutes and try again.', 429);
    const b = req.body || {};
    const code = String(b.code || '').replace(/\D/g, '');
    const row = db.prepare('SELECT * FROM otps WHERE id = ?').get(String(b.pending || ''));
    if (!row || row.expires_at < Date.now()) bad('This code has expired. Ask for a new one.', 410);
    if (row.attempts >= OTP_ATTEMPTS) { db.prepare('DELETE FROM otps WHERE id = ?').run(row.id); bad('Too many wrong codes. Ask for a new one.', 429); }
    if (code.length !== 6 || !sec.safeEqual(sec.sha256(row.id + code), row.code_hash)) {
      db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').run(row.id);
      const left = OTP_ATTEMPTS - row.attempts - 1;
      bad(left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Ask for a new one.', 401);
    }
    db.prepare('DELETE FROM otps WHERE id = ?').run(row.id);
    let user = getUser(row.user_id);
    if (!user) bad('This account no longer exists.', 410);
    if (row.purpose === 'signup' && !user.verified) {
      db.tx(() => {
        const code = referralCode(user.first);
        let state = stateOf(user);
        state.referral.code = code;
        state = Engine.apply(state, { type: 'welcome' }, ctxFor()).state;
        db.prepare('UPDATE users SET verified = 1, referral_code = ?, state = ? WHERE id = ?').run(code, JSON.stringify(state), user.id);
      });
      user = getUser(user.id);
      notifier.email(user.email, 'Welcome to Seasonly', `Bonjour ${user.first},\n\nYour account is confirmed and 300 Skin Miles are waiting for you.\n\nYour referral code is ${user.referral_code}. Share it: your friends get ${settings().referral.welcome}% off their first Face Glow Bar treatment, and you earn ${settings().referral.perFriend}% off your next booking for each friend who books (up to ${settings().referral.cap}%).`).catch(() => {});
    }
    startSession(res, user.id);
    res.json({ user: publicUser(user), isNew: row.purpose === 'signup' });
  }));

  api.post('/auth/logout', (req, res) => {
    const t = sec.parseCookies(req.headers.cookie).sid;
    if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sec.sha256(t));
    res.setHeader('Set-Cookie', sec.cookie('sid', '', { maxAge: 0, secure: secureCookies }));
    res.json({ ok: true });
  });

  api.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
  // Like /me but answers 200 when signed out, so the app can check without an error.
  api.get('/session', (req, res) => {
    const t = sec.parseCookies(req.headers.cookie).sid;
    const row = t && db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(sec.sha256(t), Date.now());
    const user = row && getUser(row.user_id);
    res.json({ user: user && user.verified ? publicUser(user) : null });
  });

  api.delete('/me', auth, (req, res) => {
    db.tx(() => {
      if (req.user.avatar_id) db.prepare('DELETE FROM images WHERE id = ?').run(req.user.avatar_id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    });
    res.setHeader('Set-Cookie', sec.cookie('sid', '', { maxAge: 0, secure: secureCookies }));
    res.json({ ok: true });
  });

  /* Rewards: the server runs the shared engine on the stored state. */
  api.post('/actions', auth, json, wrap(async (req, res) => {
    if (!allow('act:' + req.user.id, 120, 60 * 1000)) bad('Slow down a little and try again.', 429);
    const type = String((req.body || {}).type || '');
    if (!USER_ACTIONS.has(type)) bad('Unknown action.');
    let out;
    const referrals = [];
    db.tx(() => {
      const user = getUser(req.user.id);
      try { out = Engine.apply(stateOf(user), { type, payload: req.body.payload || {} }, ctxFor()); }
      catch (e) { if (e.rule) bad(e.message, 422); throw e; }
      saveState(user.id, out.state);
      // A referred friend confirmed their account and booked: credit the referrer.
      out.events.filter((e) => e.type === 'referralQualified').forEach((e) => {
        const referrer = db.prepare('SELECT * FROM users WHERE referral_code = ? AND verified = 1').get(e.code);
        if (!referrer) return;
        const r = Engine.apply(stateOf(referrer), { type: 'referralCredit', payload: { name: user.first } }, ctxFor());
        saveState(referrer.id, r.state);
        referrals.push({ referrer, discount: r.state.referral.discount, friend: user.first });
      });
    });
    referrals.forEach(({ referrer, discount, friend }) => {
      notifier.push([referrer.id], { title: 'Your friend booked 🎉', body: `${friend} booked a Face Glow Bar treatment. You now have ${discount}% off your next booking.`, url: '/#book' }).catch(() => {});
      notifier.email(referrer.email, `${friend} just booked — your reward is ready`, `Bonjour ${referrer.first},\n\n${friend} confirmed their Seasonly account and booked a treatment with your code.\n\nYou now have ${discount}% off your next Face Glow Bar booking, plus 200 Skin Miles.`).catch(() => {});
    });
    res.json({ state: out.state, events: out.events.filter((e) => e.type !== 'referralQualified'), result: out.result });
  }));

  /* Profile photo: validated, stripped of metadata, encrypted at rest, only ever served to its owner. */
  api.post('/me/avatar', auth, raw, wrap(async (req, res) => {
    if (!allow('avatar:' + req.user.id, 10, 60 * 60 * 1000)) bad('Too many uploads. Try again later.', 429);
    const { mime, data } = images.clean(req.body);
    const enc = images.encrypt(imageKey, data);
    const id = sec.token(24);
    db.tx(() => {
      if (req.user.avatar_id) db.prepare('DELETE FROM images WHERE id = ?').run(req.user.avatar_id);
      db.prepare('INSERT INTO images (id, owner, mime, private, iv, tag, data, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)')
        .run(id, `user:${req.user.id}`, mime, enc.iv, enc.tag, enc.data, Date.now());
      db.prepare('UPDATE users SET avatar_id = ? WHERE id = ?').run(id, req.user.id);
    });
    res.json({ user: publicUser(getUser(req.user.id)) });
  }));
  api.get('/me/avatar', auth, (req, res) => {
    const img = req.user.avatar_id && db.prepare('SELECT * FROM images WHERE id = ? AND owner = ?').get(req.user.avatar_id, `user:${req.user.id}`);
    if (!img) return res.status(404).end();
    res.setHeader('Content-Type', img.mime);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.end(images.decrypt(imageKey, img));
  });
  api.delete('/me/avatar', auth, (req, res) => {
    if (req.user.avatar_id) db.prepare('DELETE FROM images WHERE id = ?').run(req.user.avatar_id);
    db.prepare('UPDATE users SET avatar_id = NULL WHERE id = ?').run(req.user.id);
    res.json({ user: publicUser(getUser(req.user.id)) });
  });

  api.post('/push/subscribe', auth, json, (req, res) => {
    const s = (req.body || {}).subscription || {};
    const endpoint = String(s.endpoint || ''), keys = s.keys || {};
    if (!/^https:\/\//.test(endpoint) || !keys.p256dh || !keys.auth) bad('Invalid push subscription.');
    db.prepare('INSERT INTO push_subs (user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth')
      .run(req.user.id, endpoint.slice(0, 1000), String(keys.p256dh).slice(0, 200), String(keys.auth).slice(0, 100), Date.now());
    res.json({ ok: true });
  });
  api.post('/push/unsubscribe', auth, json, (req, res) => {
    db.prepare('DELETE FROM push_subs WHERE user_id = ? AND endpoint = ?').run(req.user.id, String((req.body || {}).endpoint || ''));
    res.json({ ok: true });
  });

  /* ---------- Admin ---------- */
  const admin = express.Router();
  admin.post('/login', json, (req, res) => {
    if (!allow('admin:' + ip(req), 10, 15 * 60 * 1000)) bad('Too many attempts. Wait 15 minutes.', 429);
    const b = req.body || {};
    if (!adminHash) bad('Set ADMIN_PASSWORD on the server to enable the admin panel.', 503);
    const okEmail = sec.safeEqual(String(b.email || '').trim().toLowerCase(), adminEmail);
    const okPw = sec.checkPassword(String(b.password || ''), adminHash);
    if (!okEmail || !okPw) bad('Wrong email or password.', 401);
    const t = sec.token();
    db.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').run(sec.sha256(t), Date.now() + 12 * 3600 * 1000);
    res.setHeader('Set-Cookie', sec.cookie('aid', t, { maxAge: 12 * 3600, secure: secureCookies, sameSite: 'Strict' }));
    res.json({ ok: true, email: adminEmail });
  });
  admin.post('/logout', (req, res) => {
    const t = sec.parseCookies(req.headers.cookie).aid;
    if (t) db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sec.sha256(t));
    res.setHeader('Set-Cookie', sec.cookie('aid', '', { maxAge: 0, secure: secureCookies, sameSite: 'Strict' }));
    res.json({ ok: true });
  });
  admin.use(adminAuth);
  admin.get('/me', (req, res) => res.json({ email: adminEmail, channels: notifier.status }));

  admin.get('/stats', (req, res) => {
    const users = db.prepare('SELECT state, verified FROM users').all();
    const verified = users.filter((u) => u.verified).map((u) => JSON.parse(u.state));
    const sum = (f) => verified.reduce((a, s) => a + f(s), 0);
    res.json({
      users: verified.length, pending: users.length - verified.length,
      bookings: sum((s) => s.bookings.length), orders: sum((s) => s.orders.length),
      revenue: Math.round(sum((s) => s.orders.reduce((a, o) => a + o.total, 0)) * 100) / 100,
      milesIssued: sum((s) => s.lifetime), milesBalance: sum((s) => s.miles),
      vouchers: sum((s) => s.vouchers.length), referrals: sum((s) => s.referral.friends),
      pushSubscribers: db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM push_subs').get().n,
      products: products(true).length,
    });
  });

  const cleanProduct = (b, existing = {}) => {
    const p = { ...existing };
    const str = (v, n) => String(v ?? '').trim().slice(0, n);
    if (b.name !== undefined) p.name = str(b.name, 80);
    if (!p.name) bad('Give the product a name.');
    for (const [k, n] of [['sub', 120], ['desc', 2000], ['size', 30], ['cat', 30], ['badge', 20]]) if (b[k] !== undefined) p[k] = str(b[k], n);
    if (b.price !== undefined) { p.price = Math.round(Number(b.price) * 100) / 100; if (!(p.price > 0 && p.price < 10000)) bad('Enter a price above €0.'); }
    if (b.compareAt !== undefined) p.compareAt = b.compareAt === '' || b.compareAt === null ? null : Math.round(Number(b.compareAt) * 100) / 100;
    if (b.active !== undefined) p.active = !!b.active;
    if (b.tags !== undefined) p.tags = (Array.isArray(b.tags) ? b.tags : String(b.tags).split(',')).map((t) => str(t, 30)).filter(Boolean).slice(0, 6);
    if (b.stats !== undefined) p.stats = (Array.isArray(b.stats) ? b.stats : []).slice(0, 3).map((s) => [str(s[0], 12), str(s[1], 30)]).filter((s) => s[0]);
    if (b.sort !== undefined) p.sort = Math.floor(Number(b.sort)) || 0;
    p.cat = p.cat || 'Sérums'; p.tags = p.tags || []; p.stats = p.stats || []; p.size = p.size || ''; p.sub = p.sub || ''; p.desc = p.desc || '';
    p.art = p.art || { kind: 'dropper', glass: '#E7EBEA', liquid: '#F1EEE6', label: '#FBFBF9', cap: '#F4F4F2', collar: '#DADAD6', ink: '#3A3532' };
    p.bg = p.bg || 'linear-gradient(160deg,#F1E3D4,#E9D3BF)';
    if (p.price === undefined) bad('Enter a price above €0.');
    return p;
  };
  admin.get('/products', (req, res) => res.json({ products: products(true).map((p) => ({ ...p, image: p.imageId ? `/api/images/${p.imageId}` : null })) }));
  admin.post('/products', json, (req, res) => {
    const p = cleanProduct(req.body || {}, { active: true, sort: products(true).length });
    p.id = (p.name.normalize('NFD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/\s+/g, '-') || 'product') + '-' + crypto.randomBytes(2).toString('hex');
    db.prepare('INSERT INTO products (id, data, updated_at) VALUES (?, ?, ?)').run(p.id, JSON.stringify(p), Date.now());
    res.status(201).json({ product: p });
  });
  admin.put('/products/:id', json, (req, res) => {
    const row = db.prepare('SELECT data FROM products WHERE id = ?').get(req.params.id);
    if (!row) bad('Product not found.', 404);
    const p = cleanProduct(req.body || {}, JSON.parse(row.data));
    db.prepare('UPDATE products SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(p), Date.now(), p.id);
    res.json({ product: p });
  });
  admin.delete('/products/:id', (req, res) => {
    const row = db.prepare('SELECT data FROM products WHERE id = ?').get(req.params.id);
    if (!row) bad('Product not found.', 404);
    const p = JSON.parse(row.data);
    db.tx(() => {
      if (p.imageId) db.prepare('DELETE FROM images WHERE id = ?').run(p.imageId);
      db.prepare('DELETE FROM products WHERE id = ?').run(p.id);
    });
    res.json({ ok: true });
  });
  const publicImage = (buf, owner) => {
    const { mime, data } = images.clean(buf);
    const id = sec.token(18);
    db.prepare('INSERT INTO images (id, owner, mime, private, data, created_at) VALUES (?, ?, ?, 0, ?, ?)').run(id, owner, mime, data, Date.now());
    return id;
  };
  admin.post('/products/:id/image', raw, (req, res) => {
    const row = db.prepare('SELECT data FROM products WHERE id = ?').get(req.params.id);
    if (!row) bad('Product not found.', 404);
    const p = JSON.parse(row.data);
    const id = publicImage(req.body, `product:${p.id}`);
    db.tx(() => {
      if (p.imageId) db.prepare('DELETE FROM images WHERE id = ?').run(p.imageId);
      p.imageId = id;
      db.prepare('UPDATE products SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(p), Date.now(), p.id);
    });
    res.json({ product: { ...p, image: `/api/images/${id}` } });
  });

  admin.get('/users', (req, res) => {
    const q = `%${String(req.query.q || '').trim()}%`;
    const rows = db.prepare('SELECT * FROM users WHERE first LIKE ? OR last LIKE ? OR email LIKE ? OR phone LIKE ? OR referral_code LIKE ? ORDER BY created_at DESC LIMIT 200').all(q, q, q, q, q);
    res.json({ users: rows.map((u) => { const s = stateOf(u); return {
      id: u.id, first: u.first, last: u.last, email: u.email, phone: u.phone, verified: !!u.verified, referralCode: u.referral_code, referredBy: u.referred_by,
      miles: s.miles, lifetime: s.lifetime, tier: Engine.tierOf(s.lifetime).name, streak: s.streak, bookings: s.bookings.length, orders: s.orders.length,
      friends: s.referral.friends, createdAt: u.created_at, lastLogin: u.last_login,
      push: !!db.prepare('SELECT 1 FROM push_subs WHERE user_id = ?').get(u.id) }; }) });
  });
  admin.post('/users/:id/miles', json, (req, res) => {
    const amount = Math.round(Number((req.body || {}).amount));
    const reason = String((req.body || {}).reason || 'Adjustment by Seasonly').trim().slice(0, 80);
    if (!amount || Math.abs(amount) > 100000) bad('Enter a number of miles, for example 100 or -50.');
    db.tx(() => {
      const u = getUser(req.params.id) || bad('Customer not found.', 404);
      const s = stateOf(u);
      if (s.miles + amount < 0) bad('The balance cannot go below zero.');
      s.miles += amount; if (amount > 0) s.lifetime += amount;
      s.ledger.unshift({ t: Date.now(), label: reason, amt: amount, kind: 'adjust' });
      saveState(u.id, s);
    });
    res.json({ ok: true });
  });

  const flat = (key) => db.prepare('SELECT id, first, last, email, state FROM users WHERE verified = 1').all()
    .flatMap((u) => JSON.parse(u.state)[key].map((x) => ({ ...x, customer: `${u.first} ${u.last}`.trim(), email: u.email, userId: u.id })))
    .sort((a, b) => b.t - a.t);
  admin.get('/bookings', (req, res) => res.json({ bookings: flat('bookings') }));
  admin.get('/orders', (req, res) => res.json({ orders: flat('orders') }));
  admin.get('/referrals', (req, res) => {
    const rows = db.prepare('SELECT first, last, email, referral_code, referred_by, state, created_at FROM users WHERE verified = 1 AND referred_by IS NOT NULL ORDER BY created_at DESC').all();
    res.json({ referrals: rows.map((r) => { const s = JSON.parse(r.state); const ref = db.prepare('SELECT first, last, email FROM users WHERE referral_code = ?').get(r.referred_by);
      return { friend: `${r.first} ${r.last}`.trim(), friendEmail: r.email, code: r.referred_by, referrer: ref ? `${ref.first} ${ref.last}`.trim() : '—', booked: s.bookings.length > 0, createdAt: r.created_at }; }) });
  });

  const audience = (b) => {
    if (b.audience === 'one') {
      const u = db.prepare('SELECT * FROM users WHERE (email = ? OR id = ?) AND verified = 1').get(String(b.to || '').toLowerCase(), Number(b.to) || -1);
      if (!u) bad('No confirmed customer with that email.');
      return [u];
    }
    if (b.audience === 'referrers') return db.prepare('SELECT * FROM users WHERE verified = 1 AND referral_code IN (SELECT referred_by FROM users WHERE referred_by IS NOT NULL)').all();
    return db.prepare('SELECT * FROM users WHERE verified = 1').all();
  };
  admin.post('/email', json, wrap(async (req, res) => {
    const b = req.body || {};
    const subject = String(b.subject || '').trim().slice(0, 150), body = String(b.body || '').trim().slice(0, 10000);
    if (!subject || !body) bad('Write a subject and a message.');
    const list = audience(b);
    let sent = 0, failed = 0;
    for (const u of list) {
      try { await notifier.email(u.email, subject, body.replace(/\{first\}/g, u.first)); sent++; } catch { failed++; }
    }
    res.json({ recipients: list.length, sent, failed, delivered: notifier.status.email });
  }));
  admin.post('/push', json, wrap(async (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 80), body = String(b.body || '').trim().slice(0, 240);
    const url = /^\/[\w\-/#?=&.]*$/.test(b.url || '') ? b.url : '/';
    if (!title || !body) bad('Write a title and a message.');
    const target = b.audience === 'all' ? 'all' : audience(b).map((u) => u.id);
    res.json(await notifier.push(target, { title, body, url }));
  }));
  admin.get('/outbox', (req, res) => res.json({ outbox: db.prepare('SELECT * FROM outbox ORDER BY id DESC LIMIT 200').all() }));

  admin.get('/settings', (req, res) => res.json({ ...settings(), hero: settings().hero ? `/api/images/${settings().hero}` : null }));
  admin.put('/settings', json, (req, res) => {
    const r = (req.body || {}).referral || {};
    const n = (v, min, max) => { const x = Math.round(Number(v)); if (!(x >= min && x <= max)) bad(`Referral values must be between ${min} and ${max}%.`); return x; };
    db.setSetting('referral', { perFriend: n(r.perFriend, 1, 50), cap: n(r.cap, 1, 50), welcome: n(r.welcome, 0, 50) });
    res.json(settings());
  });
  admin.post('/settings/hero', raw, (req, res) => {
    const old = db.getSetting('hero');
    const id = publicImage(req.body, 'site:hero');
    if (old) db.prepare('DELETE FROM images WHERE id = ?').run(old);
    db.setSetting('hero', id);
    res.json({ hero: `/api/images/${id}` });
  });
  admin.delete('/settings/hero', (req, res) => {
    const old = db.getSetting('hero');
    if (old) db.prepare('DELETE FROM images WHERE id = ?').run(old);
    db.setSetting('hero', null);
    res.json({ hero: null });
  });

  api.use('/admin', admin);
  app.use('/api', api);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use('/admin', express.static(path.join(__dirname, '..', 'admin'), { index: 'index.html' }));
  app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html', setHeaders: (res, file) => { if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache'); } }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500 && status !== 502 && status !== 503) log.error?.(err);
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Photos must be 5 MB or smaller.' });
    res.status(status).json({ error: status >= 500 && !(err instanceof HttpError) ? 'Something went wrong. Try again.' : err.message });
  });

  return { app, db, notifier };
}

module.exports = { createApp };
