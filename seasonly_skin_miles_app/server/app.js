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
const { createSkinAnalyzer } = require('./skin');
const { tr, langOf, LANGS } = require('./i18n');

const DAY = 864e5;
const SESSION_DAYS = 30;
const OTP_TTL = 10 * 60 * 1000;
const OTP_RESEND = 30 * 1000;
const OTP_ATTEMPTS = 5;
// Actions a signed-in user may run. Everything else (welcome bonus, referral credit, admin adjustments) is server-only.
const USER_ACTIONS = new Set(['checkin', 'tip', 'ritualStart', 'ritualComplete', 'scan', 'match', 'quiz', 'wheel', 'redeem', 'claim', 'checkout', 'book', 'cancel', 'profile', 'fav']);
// Booking times are Paris times.
if (!process.env.TZ) process.env.TZ = 'Europe/Paris';
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
  const skinAnalyzer = opts.skinAnalyzer !== undefined ? opts.skinAnalyzer : createSkinAnalyzer(env, log);
  const mediaDir = path.join(dataDir, 'media');
  // Share of a ritual video that must have played before its miles are credited (0 to 1).
  const watchShare = env.RITUAL_WATCH_SHARE !== undefined ? Math.min(1, Math.max(0, Number(env.RITUAL_WATCH_SHARE))) : Engine.WATCH_SHARE;
  const allow = sec.rateLimiter();
  const production = env.NODE_ENV === 'production';
  const showCodes = env.DEV_SHOW_CODES === '1' && !production;
  const secureCookies = production || env.SECURE_COOKIES === '1';
  const now = () => (opts.clock ? opts.clock() : new Date());
  // Per-IP limits (codes sent per hour, code checks per 10 minutes). Raise them behind a shared NAT if needed.
  const SEND_PER_IP = Number(env.OTP_SEND_PER_IP) || 10;
  const VERIFY_PER_IP = Number(env.OTP_VERIFY_PER_IP) || 30;
  // Codes are only texted to the countries Seasonly serves, so nobody can run up the SMS bill on premium numbers abroad.
  const SMS_PREFIXES = String(env.SMS_COUNTRIES || '+33,+32,+41,+352,+377').split(',').map((x) => x.trim()).filter(Boolean);

  /* ---------- Seed ---------- */
  if (!db.prepare('SELECT COUNT(*) AS n FROM products').get().n) {
    const ins = db.prepare('INSERT INTO products (id, data, updated_at) VALUES (?, ?, ?)');
    db.tx(() => Catalog.PRODUCTS.forEach((p) => ins.run(p.id, JSON.stringify(p), Date.now())));
  }
  // Products seeded before French descriptions existed get them from the catalog.
  db.prepare('SELECT id, data FROM products').all().forEach((r) => {
    const p = JSON.parse(r.data), c = Catalog.PRODUCTS.find((x) => x.id === r.id);
    if (c && p.subFr === undefined) db.prepare('UPDATE products SET data = ? WHERE id = ?').run(JSON.stringify({ ...p, subFr: c.subFr, descFr: c.descFr, statsFr: c.statsFr }), r.id);
  });
  if (!db.getSetting('referral')) db.setSetting('referral', Engine.DEFAULT_REFERRAL);
  if (!db.getSetting('collabsSeeded')) {
    const ins = db.prepare('INSERT INTO collabs (partner, kind, data, active, sort, created_at) VALUES (?, ?, ?, 1, ?, ?)');
    Catalog.COLLABS.forEach((c, i) => ins.run(c.partner, c.kind, JSON.stringify(c.data(new Date())), i, Date.now()));
    db.setSetting('collabsSeeded', true);
  }
  const adminEmail = (env.ADMIN_EMAIL || 'admin@seasonly.fr').toLowerCase();
  let adminHash = null;
  if (env.ADMIN_PASSWORD) adminHash = sec.hashPassword(env.ADMIN_PASSWORD);
  else if (env.NODE_ENV === 'development') { adminHash = sec.hashPassword('seasonly-admin'); log.warn?.('ADMIN_PASSWORD not set — using the development password "seasonly-admin".'); }
  // Otherwise the admin panel stays closed until ADMIN_PASSWORD is set.

  /* ---------- Helpers ---------- */
  const products = (all = false) => db.prepare('SELECT data FROM products').all().map((r) => JSON.parse(r.data))
    .filter((p) => all || p.active).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const getUser = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const stateOf = (u) => JSON.parse(u.state);
  const saveState = (id, state) => db.prepare('UPDATE users SET state = ?, first = ?, last = ? WHERE id = ?').run(JSON.stringify(state), state.profile.first, state.profile.last, id);
  const settings = () => ({ referral: db.getSetting('referral', Engine.DEFAULT_REFERRAL), hero: db.getSetting('hero', null) });
  const videoSecs = () => Object.fromEntries(Object.entries(db.getSetting('ritualVideos', {})).filter(([, x]) => x.secs).map(([id, x]) => [id, x.secs]));
  const ctxFor = () => ({ now: now(), products: products(), settings: settings(), codeFor: voucherCode, watchShare, videoSecs: videoSecs() });
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
      id: u.id, first: u.first, last: u.last, email: u.email, phone: u.phone, emailVerified: !!u.email_verified, phoneVerified: !!u.phone_verified, referralCode: u.referral_code,
      hasAvatar: !!u.avatar_id, avatarVersion: u.avatar_id ? u.avatar_id.slice(0, 8) : null, state, address: addressOf(u), gender: u.gender, lang: u.lang,
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
    // Emails and notifications follow the language the customer uses in the app.
    if (req.lang && req.lang !== user.lang) { db.prepare('UPDATE users SET lang = ? WHERE id = ?').run(req.lang, user.id); user.lang = req.lang; }
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
  // Each channel gets its own code, so the code entered tells us which contact detail the person controls.
  const newCode = () => String(crypto.randomInt(0, 1e6)).padStart(6, '0');
  async function sendCode(user, purpose, channel) {
    const id = sec.token(18);
    const codes = { sms: channel !== 'email' ? newCode() : null, email: channel !== 'sms' ? newCode() : null };
    if ((codes.sms && !user.phone) || (codes.email && !user.email)) bad('This code request expired. Start again.', 410);
    if (codes.sms && codes.email) while (codes.email === codes.sms) codes.email = newCode();
    db.prepare('DELETE FROM otps WHERE user_id = ? AND purpose = ?').run(user.id, purpose);
    db.prepare('INSERT INTO otps (id, user_id, purpose, sms_hash, email_hash, channel, attempts, sent_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)')
      .run(id, user.id, purpose, codes.sms && sec.sha256(id + codes.sms), codes.email && sec.sha256(id + codes.email), channel, Date.now(), Date.now() + OTP_TTL);
    await deliverCode(user, codes);
    return { id, codes };
  }
  async function deliverCode(user, codes) {
    const jobs = [];
    if (codes.sms) jobs.push(notifier.sms(user.phone, `Seasonly: ${tr('codeText', user.lang, codes.sms)}`));
    if (codes.email) { const m = tr('codeEmail', user.lang, user.first, codes.email); jobs.push(notifier.email(user.email, m.subject, m.text)); }
    const results = await Promise.allSettled(jobs);
    if (results.every((r) => r.status === 'rejected')) bad('We could not send your code. Check your details or try the other option.', 502);
    if (production && results.every((r) => r.status === 'fulfilled' && !r.value.delivered)) bad('Code delivery is not configured yet. Contact Seasonly support.', 503);
  }
  const pendingResponse = (user, otp, channel) => ({
    pending: otp.id, channel,
    sentTo: { sms: channel !== 'email' ? sec.maskPhone(user.phone) : null, email: channel !== 'sms' ? sec.maskEmail(user.email) : null },
    ...(showCodes ? { devCode: otp.codes.sms || otp.codes.email, ...(otp.codes.sms && otp.codes.email ? { devEmailCode: otp.codes.email } : {}) } : {}),
  });
  const channelOf = (c) => (['sms', 'email', 'both'].includes(c) ? c : 'sms');
  // Postal address, required so prizes and gifts can be shipped.
  const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Monaco'];
  function cleanAddress(a) {
    a = a || {};
    const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    const out = { line1: str(a.line1, 120), line2: str(a.line2, 120), postcode: str(a.postcode, 10).toUpperCase(), city: str(a.city, 60), country: str(a.country, 30) || 'France' };
    if (out.line1.length < 4) bad('Enter your street address so we can send you gifts.');
    if (!/^[A-Z0-9][A-Z0-9 -]{2,9}$/.test(out.postcode)) bad('Enter a valid postcode.');
    if (out.city.length < 2) bad('Enter your city.');
    if (!COUNTRIES.includes(out.country)) bad('We ship to France, Belgium, Switzerland, Luxembourg and Monaco.');
    return out;
  }
  const addressOf = (u) => { try { return u.address ? JSON.parse(u.address) : null; } catch { return null; } };

  /* ---------- App ---------- */
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY === '1' ? 1 : false);
  app.use(sec.headers);
  const api = express.Router();
  api.use(sec.csrf);
  api.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); req.lang = LANGS.includes(req.get('X-Lang')) ? req.get('X-Lang') : null; next(); });
  const json = express.json({ limit: '64kb' });
  const raw = express.raw({ type: ['image/jpeg', 'image/png', 'application/octet-stream'], limit: images.MAX_BYTES });

  api.get('/health', (req, res) => res.json({ ok: true, mode: 'server' }));
  api.get('/config', (req, res) => {
    const s = settings();
    res.json({ vapidPublicKey: notifier.vapidPublicKey, referral: s.referral, hero: s.hero ? `/api/images/${s.hero}` : null, channels: notifier.status,
      scan: skinAnalyzer ? 'server' : 'device', ritualVideos: ritualVideos() });
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
    if (!SMS_PREFIXES.some((pre) => phone.startsWith(pre))) bad('For now we can only send codes to mobile numbers in France, Belgium, Switzerland, Luxembourg and Monaco.');
    const address = cleanAddress(b.address);
    if (!Engine.GENDERS.includes(b.gender)) bad('Tell us how you identify: woman, man, other, or prefer not to say.');
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
    const owns = (u) => (u.email === email && u.email_verified) || (u.phone === phone && u.phone_verified);
    if (existing.some((u) => u.verified && owns(u))) bad('An account already exists with this email or phone number. Sign in instead.', 409);
    db.tx(() => existing.forEach((u) => {
      // Unconfirmed sign-ups with these details are replaced.
      if (!u.verified) return db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
      // A confirmed account that never proved this email or phone loses it: whoever proves it owns it.
      const s = stateOf(u);
      if (u.email === email && !u.email_verified) { db.prepare('UPDATE users SET email = NULL WHERE id = ?').run(u.id); s.profile.email = ''; }
      if (u.phone === phone && !u.phone_verified) { db.prepare('UPDATE users SET phone = NULL WHERE id = ?').run(u.id); s.profile.phone = ''; }
      saveState(u.id, s);
    }));
    const state = Engine.newState({ first, last, email, phone, referredBy, gender: b.gender }, now());
    const info = db.prepare('INSERT INTO users (first, last, email, phone, verified, referred_by, state, address, gender, lang, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)')
      .run(first, last, email, phone, referredBy, JSON.stringify(state), JSON.stringify(address), b.gender, langOf(req.lang), Date.now());
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
    const user = email
      ? db.prepare('SELECT * FROM users WHERE email = ? AND verified = 1 AND email_verified = 1').get(email)
      : db.prepare('SELECT * FROM users WHERE phone = ? AND verified = 1 AND phone_verified = 1').get(phone);
    const channel = email ? 'email' : 'sms';
    if (user && req.lang && req.lang !== user.lang) { db.prepare('UPDATE users SET lang = ? WHERE id = ?').run(req.lang, user.id); user.lang = req.lang; }
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
    const hash = sec.sha256(row.id + code);
    const proved = code.length !== 6 ? null
      : row.sms_hash && sec.safeEqual(hash, row.sms_hash) ? 'phone'
      : row.email_hash && sec.safeEqual(hash, row.email_hash) ? 'email' : null;
    if (!proved) {
      db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').run(row.id);
      const left = OTP_ATTEMPTS - row.attempts - 1;
      bad(left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Ask for a new one.', 401);
    }
    db.prepare('DELETE FROM otps WHERE id = ?').run(row.id);
    let user = getUser(row.user_id);
    if (!user) bad('This account no longer exists.', 410);
    if (!user[proved]) bad('This code request expired. Start again.', 410); // the detail was claimed by someone who proved it
    db.prepare(`UPDATE users SET ${proved === 'email' ? 'email_verified' : 'phone_verified'} = 1 WHERE id = ?`).run(user.id);
    user = getUser(user.id);
    if (row.purpose === 'signup' && !user.verified) {
      db.tx(() => {
        const code = referralCode(user.first);
        let state = stateOf(user);
        state.referral.code = code;
        state = Engine.apply(state, { type: 'welcome' }, ctxFor()).state;
        db.prepare('UPDATE users SET verified = 1, referral_code = ?, state = ? WHERE id = ?').run(code, JSON.stringify(state), user.id);
      });
      user = getUser(user.id);
      if (user.email_verified) { const m = tr('welcome', user.lang, user.first, user.referral_code, settings().referral); notifier.email(user.email, m.subject, m.text).catch(() => {}); }
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
  /* Run one engine action for a user, inside a transaction, and apply its side effects on other
     accounts (referral credit or reversal). Returns the engine output plus messages to send afterwards. */
  function runAction(userId, type, payload) {
    let out, user;
    const after = [];
    db.tx(() => {
      user = getUser(userId) || bad('Customer not found.', 404);
      try { out = Engine.apply(stateOf(user), { type, payload: payload || {} }, ctxFor()); }
      catch (e) { if (e.rule) bad(e.message, 422); throw e; }
      saveState(user.id, out.state);
      out.events.forEach((e) => {
        if (e.type !== 'referralQualified' && e.type !== 'referralRevoked') return;
        const referrer = db.prepare('SELECT * FROM users WHERE referral_code = ? AND verified = 1').get(e.code);
        if (!referrer) return;
        // A referral only counts for a friend who proved a real phone number: email-only accounts are free to create.
        if (e.type === 'referralQualified' && !user.phone_verified) return;
        const r = Engine.apply(stateOf(referrer), { type: e.type === 'referralQualified' ? 'referralCredit' : 'referralRevoke', payload: { name: user.first } }, ctxFor());
        saveState(referrer.id, r.state);
        after.push({ kind: e.type, referrer, discount: r.state.referral.discount, friend: user.first });
      });
    });
    after.forEach(({ kind, referrer, discount, friend }) => {
      if (kind !== 'referralQualified') return;
      notifier.push([referrer.id], { ...tr('referralPush', referrer.lang, friend, discount), url: '/#book' }).catch(() => {});
      mailMsg(referrer, tr('referralEmail', referrer.lang, referrer.first, friend, discount));
    });
    return { out, user: getUser(userId) };
  }
  // Emails only ever go to an address the customer confirmed.
  const mailTo = (u, subject, text) => { if (u && u.email && u.email_verified) notifier.email(u.email, subject, text).catch(() => {}); };
  const mailMsg = (u, m) => mailTo(u, m.subject, m.text);
  const mapsLink = (addr) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=transit`;
  const fmtWhen = (b) => `${new Date(b.startAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${b.slot}`;
  /* Push in each customer's language: groups the recipients by language. */
  async function pushLocal(target, make) {
    const rows = target === 'all'
      ? db.prepare('SELECT DISTINCT u.id, u.lang FROM push_subs s JOIN users u ON u.id = s.user_id').all()
      : target.length ? db.prepare(`SELECT id, lang FROM users WHERE id IN (${target.map(() => '?').join(',')})`).all(...target) : [];
    const total = { subscriptions: 0, sent: 0, failed: 0 };
    let calls = 0;
    for (const lang of LANGS) {
      const ids = rows.filter((r) => langOf(r.lang) === lang).map((r) => r.id);
      if (!ids.length) continue;
      const r = await notifier.push(ids, make(lang)); calls++;
      total.subscriptions += r.subscriptions; total.sent += r.sent; total.failed += r.failed;
    }
    // Nobody to reach: still recorded in the outbox, so the admin sees it was sent.
    if (!calls) return notifier.push(target === 'all' ? 'all' : [], make('fr'));
    return total;
  }

  api.post('/actions', auth, json, wrap(async (req, res) => {
    if (!allow('act:' + req.user.id, 120, 60 * 1000)) bad('Slow down a little and try again.', 429);
    const type = String((req.body || {}).type || '');
    if (!USER_ACTIONS.has(type)) bad('Unknown action.');
    const { out, user } = runAction(req.user.id, type, req.body.payload);
    const r = out.result || {};
    if (type === 'book' && r.booking) mailMsg(user, tr('booked', user.lang, user.first, r.booking, mapsLink(r.booking.addr)));
    if (type === 'checkout' && r.order) mailMsg(user, tr('ordered', user.lang, user.first, r.order));
    if (type === 'cancel' && r.item) {
      const it = r.item, what = it.service ? `${it.service} on ${fmtWhen(it)}` : `order ${it.id}`;
      if (it.status === 'refund_requested') {
        notifier.email(env.SUPPORT_EMAIL || 'hello@seasonly.fr', `Refund requested: ${it.id}`, `${user.first} ${user.last} (${user.email || user.phone}) asked for a refund of ${what}. Process it in the admin panel.`).catch(() => {});
        mailMsg(user, tr('refundRequested', user.lang, user.first, it));
      } else mailMsg(user, tr('cancelled', user.lang, user.first, it));
    }
    res.json({ state: out.state, events: out.events.filter((e) => !e.type.startsWith('referral')), result: out.result });
  }));

  api.put('/me/address', auth, json, (req, res) => {
    const a = cleanAddress((req.body || {}).address);
    db.prepare('UPDATE users SET address = ? WHERE id = ?').run(JSON.stringify(a), req.user.id);
    // Product gifts waiting for an address, or not shipped yet, go to the new one.
    db.prepare("UPDATE gifts SET address = ?, status = 'to_ship' WHERE user_id = ? AND kind = 'product' AND status IN ('needs_address', 'to_ship')").run(JSON.stringify(a), req.user.id);
    res.json({ user: publicUser(getUser(req.user.id)) });
  });

  /* ---------- Contests & gifts ---------- */
  const optionalUser = (req) => {
    const t = sec.parseCookies(req.headers.cookie).sid;
    const row = t && db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(sec.sha256(t), Date.now());
    const u = row && getUser(row.user_id);
    return u && u.verified ? u : null;
  };
  const contestView = (c, userId) => ({
    id: c.id, title: c.title, period: c.period, description: c.description, titleEn: c.title_en || '', descriptionEn: c.description_en || '', prizeKind: c.prize_kind, prizeLabel: c.prize_label, winners: c.winners,
    startsAt: c.starts_at, endsAt: c.ends_at, status: c.status,
    entries: db.prepare('SELECT COUNT(*) AS n FROM contest_entries WHERE contest_id = ?').get(c.id).n,
    entered: !!(userId && db.prepare('SELECT 1 FROM contest_entries WHERE contest_id = ? AND user_id = ?').get(c.id, userId)),
    won: !!(userId && c.winner_ids && JSON.parse(c.winner_ids).includes(userId)),
    winnerNames: c.winner_ids ? JSON.parse(c.winner_ids).map((id) => { const w = getUser(id); return w ? `${w.first} ${(w.last || '')[0] || ''}.`.replace(/ \.$/, '') : 'A member'; }) : [],
  });
  api.get('/contests', (req, res) => {
    const u = optionalUser(req);
    const rows = db.prepare("SELECT * FROM contests WHERE status = 'open' OR (status = 'drawn' AND ends_at > ?) ORDER BY ends_at ASC").all(Date.now() - 30 * 864e5);
    res.json({ contests: rows.map((c) => contestView(c, u && u.id)) });
  });
  api.post('/contests/:id/enter', auth, (req, res) => {
    const c = db.prepare('SELECT * FROM contests WHERE id = ?').get(Number(req.params.id));
    if (!c || c.status !== 'open' || c.ends_at < Date.now() || c.starts_at > Date.now()) bad('This contest is closed.', 422);
    if (!addressOf(req.user)) bad('Add your postal address in your profile first, so we can send you the prize.', 422);
    db.prepare('INSERT OR IGNORE INTO contest_entries (contest_id, user_id, created_at) VALUES (?, ?, ?)').run(c.id, req.user.id, Date.now());
    res.json({ contest: contestView(c, req.user.id) });
  });
  const giftView = (g, state) => {
    let status = g.status;
    if (g.kind === 'soin' && g.code) { const v = state.vouchers.find((x) => x.code === g.code); if (v && v.used) status = 'used'; else if (v && v.expires < Date.now()) status = 'expired'; }
    const m = /^contest:(\d+)$/.exec(g.source || '');
    const c = m && db.prepare('SELECT title, title_en FROM contests WHERE id = ?').get(Number(m[1]));
    return { id: g.id, kind: g.kind, label: g.label, source: m ? '' : g.source, contest: c ? { fr: c.title, en: c.title_en || c.title } : null, note: g.note, status, code: g.code, address: g.address ? JSON.parse(g.address) : null, createdAt: g.created_at, shippedAt: g.shipped_at };
  };
  api.get('/me/gifts', auth, (req, res) => {
    const st = stateOf(req.user);
    res.json({ gifts: db.prepare('SELECT * FROM gifts WHERE user_id = ? ORDER BY id DESC').all(req.user.id).map((g) => giftView(g, st)) });
  });
  /* Give a soin (free-treatment voucher, usable when booking) or a product (shipped to the saved address). */
  function giveGift(userId, { kind, ref, source, contestId, note }) {
    let gift;
    if (contestId) source = `contest:${contestId}`;
    db.tx(() => {
      const u = getUser(userId) || bad('Customer not found.', 404);
      let label, code = null;
      if (kind === 'soin') {
        const sv = Engine.SERVICES.find((x) => x.id === ref) || bad('Choose a treatment.');
        label = `${sv.name} · ${sv.mins} min`;
        code = 'GIFT-' + Array.from(crypto.randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
        const s = stateOf(u);
        s.vouchers.unshift({ id: `gift-${sv.id}`, season: Engine.seasonOf(now()).id, kind: 'service', title: `Gift · Free ${sv.name}`, note: contestId ? 'Contest prize' : source, cost: 0, value: 100, type: 'percent', code, used: false, expires: Date.now() + 180 * 864e5, gift: true });
        saveState(u.id, s);
      } else if (kind === 'product') {
        const p = products(true).find((x) => x.id === ref) || bad('Choose a product.');
        label = p.name;
      } else bad('Choose a treatment or a product.');
      const address = kind === 'product' ? addressOf(u) : null;
      const info = db.prepare('INSERT INTO gifts (user_id, kind, ref, label, source, note, status, code, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(u.id, kind, ref, label, source, note ? String(note).slice(0, 300) : null, kind === 'soin' ? 'available' : (address ? 'to_ship' : 'needs_address'), code, address ? JSON.stringify(address) : null, Date.now());
      gift = { id: info.lastInsertRowid, user: u, label, kind, code };
    });
    const u = gift.user;
    const ct = contestId && db.prepare('SELECT title, title_en FROM contests WHERE id = ?').get(contestId);
    const from = tr('giftSource', u.lang, ct ? { contest: u.lang === 'en' ? ct.title_en || ct.title : ct.title } : { text: source });
    notifier.push([u.id], { ...tr('giftPush', u.lang, gift.label), url: '/#gifts' }).catch(() => {});
    mailMsg(u, tr('giftEmail', u.lang, u.first, from, gift));
    return gift;
  }

  /* Support messages, feedback and feature ideas. */
  const TOPICS = ['Booking', 'Order', 'Account', 'Skin Miles', 'Other'];
  api.post('/support', auth, json, wrap(async (req, res) => {
    if (!allow('msg:' + req.user.id, 10, 60 * 60 * 1000)) bad('You sent several messages already. We will answer soon.', 429);
    const b = req.body || {};
    const topic = TOPICS.includes(b.topic) ? b.topic : 'Other';
    const body = String(b.message || '').trim().slice(0, 4000), ref = String(b.ref || '').trim().slice(0, 40);
    if (body.length < 5) bad('Write a few words so we can help.');
    const info = db.prepare("INSERT INTO messages (user_id, kind, topic, ref, body, status, created_at) VALUES (?, 'support', ?, ?, ?, 'open', ?)").run(req.user.id, topic, ref || null, body, Date.now());
    const u = req.user;
    notifier.email(env.SUPPORT_EMAIL || 'hello@seasonly.fr', `[Support #${info.lastInsertRowid}] ${topic}${ref ? ` · ${ref}` : ''}`, `From ${u.first} ${u.last} (${u.email || '—'} · ${u.phone || '—'})\n\n${body}`).catch(() => {});
    mailMsg(u, tr('supportReceived', u.lang, u.first, info.lastInsertRowid, body));
    res.status(201).json({ id: info.lastInsertRowid });
  }));
  api.post('/feedback', auth, json, wrap(async (req, res) => {
    if (!allow('msg:' + req.user.id, 10, 60 * 60 * 1000)) bad('Thank you! You sent several messages already.', 429);
    const b = req.body || {};
    const kind = b.kind === 'idea' ? 'idea' : 'feedback';
    const rating = b.rating === undefined || b.rating === null || b.rating === '' ? null : Math.round(Number(b.rating));
    if (rating !== null && !(rating >= 1 && rating <= 5)) bad('Choose between 1 and 5 stars.');
    const body = String(b.message || '').trim().slice(0, 4000);
    if (body.length < 3) bad('Write a few words first.');
    const info = db.prepare('INSERT INTO messages (user_id, kind, topic, rating, body, status, created_at) VALUES (?, ?, ?, ?, ?, \'open\', ?)').run(req.user.id, kind, kind === 'idea' ? 'Feature idea' : 'Feedback', rating, body, Date.now());
    res.status(201).json({ id: info.lastInsertRowid });
  }));
  api.get('/me/messages', auth, (req, res) => {
    res.json({ messages: db.prepare('SELECT id, kind, topic, ref, rating, body, status, reply, replied_at, created_at FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id) });
  });

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

  /* ---------- Skin scan ---------- */
  // The photo is analysed and forgotten: it is never written to disk or to the database.
  api.post('/skin-scan', auth, raw, wrap(async (req, res) => {
    if (!skinAnalyzer) bad('Skin scan runs on your phone.', 501);
    if (!allow('scan:' + req.user.id, 6, DAY)) bad('You scanned your skin several times today. Come back tomorrow.', 429);
    const { mime, data } = images.clean(req.body);
    if (mime !== 'image/jpeg') bad('Send a JPEG photo.');
    let scan;
    try { scan = await skinAnalyzer(data, { lang: req.user.lang, products: products() }); }
    catch (e) { log.warn?.(`[skin-scan] ${e.code || e.status || ''} ${e.message}`); bad('The scan did not work this time. Try again in better light.', 502); }
    if (!scan.face) return res.json({ scan });
    // Only products and rituals that exist, and scores in range.
    const ids = new Set(products().map((p) => p.id));
    scan.products = (Array.isArray(scan.products) ? scan.products : []).filter((id) => ids.has(id)).slice(0, 2);
    if (!Engine.RITUALS.some((r) => r.id === scan.ritual)) scan.ritual = Engine.RITUALS[0].id;
    scan.scores = Object.fromEntries(Engine.SCAN_KEYS.map((k) => [k, Math.max(0, Math.min(100, Math.round(Number((scan.scores || {})[k]) || 60)))]));
    scan.tips = (Array.isArray(scan.tips) ? scan.tips : []).map((x) => String(x).slice(0, 240)).slice(0, 3);
    const { out } = runAction(req.user.id, 'scan', { scores: scan.scores, skinType: scan.skinType });
    res.json({ scan, state: out.state, events: out.events, result: out.result });
  }));

  /* ---------- Collabs: brand collaborations and events ---------- */
  const collabView = (c, userId) => {
    const d = JSON.parse(c.data);
    const regs = db.prepare('SELECT COUNT(*) AS n FROM collab_regs WHERE collab_id = ?').get(c.id).n;
    return { id: c.id, partner: c.partner, kind: c.kind, ...d, image: c.image_id ? `/api/images/${c.image_id}` : null, active: !!c.active, sort: c.sort,
      registrations: regs, full: !!(d.capacity && regs >= d.capacity),
      registered: !!(userId && db.prepare('SELECT 1 FROM collab_regs WHERE collab_id = ? AND user_id = ?').get(c.id, userId)) };
  };
  api.get('/collabs', (req, res) => {
    const u = optionalUser(req);
    res.json({ collabs: db.prepare('SELECT * FROM collabs WHERE active = 1 ORDER BY sort, id').all().map((c) => collabView(c, u && u.id))
      .filter((c) => !c.endsAt || c.endsAt > Date.now()) });
  });
  api.post('/collabs/:id/join', auth, (req, res) => {
    const c = db.prepare('SELECT * FROM collabs WHERE id = ? AND active = 1').get(Number(req.params.id)) || bad('This collaboration has ended.', 404);
    const v = collabView(c, req.user.id);
    if (!v.rsvp) bad('No registration is needed for this one.');
    if (v.endsAt && v.endsAt < Date.now()) bad('This collaboration has ended.', 422);
    if (!v.registered && v.full) bad('This event is full. We will tell you about the next one.', 422);
    if (!v.registered) {
      db.prepare('INSERT OR IGNORE INTO collab_regs (collab_id, user_id, created_at) VALUES (?, ?, ?)').run(c.id, req.user.id, Date.now());
      const t = v[langOf(req.user.lang)] || v.fr;
      mailMsg(req.user, tr('collabJoined', req.user.lang, req.user.first, { title: t.title, when: t.when, place: v.place }));
    }
    res.json({ collab: collabView(c, req.user.id) });
  });
  api.delete('/collabs/:id/join', auth, (req, res) => {
    db.prepare('DELETE FROM collab_regs WHERE collab_id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
    const c = db.prepare('SELECT * FROM collabs WHERE id = ?').get(Number(req.params.id)) || bad('Not found.', 404);
    res.json({ collab: collabView(c, req.user.id) });
  });

  /* ---------- Ritual videos uploaded in the admin panel ---------- */
  const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
  const ritualVideos = () => {
    const v = db.getSetting('ritualVideos', {});
    return Object.fromEntries(Object.entries(v).map(([id, x]) => [id, `/api/media/${x.file}?v=${x.v}`]));
  };
  api.get('/media/:file', (req, res) => {
    const name = String(req.params.file);
    if (!/^ritual-[a-z0-9-]{2,30}\.(mp4|webm|mov)$/.test(name) || !fs.existsSync(path.join(mediaDir, name))) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(name, { root: mediaDir, dotfiles: 'deny' });
  });

  /* ---------- Admin ---------- */
  const admin = express.Router();
  admin.post('/login', json, (req, res) => {
    if (!allow('admin:' + ip(req), Number(env.ADMIN_LOGIN_PER_IP) || 10, 15 * 60 * 1000)) bad('Too many attempts. Wait 15 minutes.', 429);
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
      revenue: Math.round(sum((s) => s.orders.filter((o) => o.status === 'paid').reduce((a, o) => a + o.total, 0)) * 100) / 100,
      milesIssued: sum((s) => s.lifetime), milesBalance: sum((s) => s.miles),
      openMessages: db.prepare("SELECT COUNT(*) AS n FROM messages WHERE status = 'open'").get().n,
      refundRequests: sum((s) => [...s.orders, ...s.bookings].filter((x) => x.status === 'refund_requested').length),
      awaitingPayment: sum((s) => [...s.orders, ...s.bookings].filter((x) => ['pending', 'booked'].includes(x.status)).length),
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
    for (const [k, n] of [['sub', 120], ['desc', 2000], ['subFr', 120], ['descFr', 2000], ['size', 30], ['cat', 30], ['badge', 20]]) if (b[k] !== undefined) p[k] = str(b[k], n);
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
      friends: s.referral.friends, createdAt: u.created_at, lastLogin: u.last_login, address: addressOf(u), gender: u.gender, lang: u.lang,
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
  /* Payment confirmed or refund made: the engine credits or takes back the miles. */
  admin.post('/:kind(orders|bookings)/:userId/:id/:op(pay|refund)', (req, res) => {
    const kind = req.params.kind === 'orders' ? 'order' : 'booking';
    const { out, user } = runAction(Number(req.params.userId), req.params.op, { kind, id: req.params.id });
    const it = out.result.item;
    const amount = kind === 'order' ? it.total : it.price;
    if (req.params.op === 'pay') {
      notifier.push([user.id], { ...tr('paidPush', user.lang, it, kind), url: '/#profile' }).catch(() => {});
      mailMsg(user, tr('paidEmail', user.lang, user.first, it, amount));
    } else {
      notifier.push([user.id], { ...tr('refundPush', user.lang, it), url: '/#profile' }).catch(() => {});
      mailMsg(user, tr('refundEmail', user.lang, user.first, it, amount));
    }
    res.json({ item: it });
  });
  /* Contests */
  const PERIODS = { week: 'Contest of the week', month: 'Contest of the month', year: 'Contest of the year' };
  function periodEnd(period, from = new Date()) {
    if (period === 'week') { const d = Engine.addDays(Engine.mondayOf(from), 7); return d.getTime() - 1; }
    if (period === 'month') return new Date(from.getFullYear(), from.getMonth() + 1, 1).getTime() - 1;
    return new Date(from.getFullYear() + 1, 0, 1).getTime() - 1;
  }
  admin.get('/contests', (req, res) => {
    res.json({ contests: db.prepare('SELECT * FROM contests ORDER BY id DESC LIMIT 100').all().map((c) => ({ ...contestView(c, null), winnerIds: c.winner_ids ? JSON.parse(c.winner_ids) : [] })), periods: PERIODS,
      services: Engine.SERVICES.map((s) => ({ id: s.id, name: `${s.name} · ${s.mins} min` })), products: products(true).map((p) => ({ id: p.id, name: p.name })) });
  });
  admin.post('/contests', json, (req, res) => {
    const b = req.body || {};
    const period = PERIODS[b.period] ? b.period : bad('Choose week, month or year.');
    const kind = b.prizeKind === 'product' ? 'product' : 'soin';
    const ref = String(b.prizeRef || '');
    const label = kind === 'soin' ? ((Engine.SERVICES.find((x) => x.id === ref) || bad('Choose a treatment.')).name) : ((products(true).find((x) => x.id === ref) || bad('Choose a product.')).name);
    const title = String(b.title || '').trim().slice(0, 80) || `Gagnez un ${label}`;
    const titleEn = String(b.titleEn || '').trim().slice(0, 80) || (String(b.title || '').trim() ? '' : `Win a ${label}`);
    const winners = Math.min(20, Math.max(1, Math.round(Number(b.winners) || 1)));
    const endsAt = b.endsAt ? new Date(b.endsAt).getTime() : periodEnd(period);
    if (!(endsAt > Date.now())) bad('The end date must be in the future.');
    const info = db.prepare("INSERT INTO contests (title, period, description, prize_kind, prize_ref, prize_label, winners, starts_at, ends_at, status, created_at, title_en, description_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)")
      .run(title, period, String(b.description || '').trim().slice(0, 600), kind, ref, label, winners, Date.now(), endsAt, Date.now(), titleEn, String(b.descriptionEn || '').trim().slice(0, 600));
    if (b.announce) pushLocal('all', (lang) => ({ ...tr('contestPush', lang, period, lang === 'en' ? titleEn || title : title), url: '/#contests' })).catch(() => {});
    res.status(201).json({ contest: contestView(db.prepare('SELECT * FROM contests WHERE id = ?').get(info.lastInsertRowid), null) });
  });
  admin.post('/contests/:id/draw', (req, res) => {
    const c = db.prepare('SELECT * FROM contests WHERE id = ?').get(Number(req.params.id)) || bad('Contest not found.', 404);
    if (c.status !== 'open') bad('A winner was already drawn for this contest.');
    const entrants = db.prepare('SELECT user_id FROM contest_entries WHERE contest_id = ?').all(c.id).map((r) => r.user_id).filter((id) => { const u = getUser(id); return u && u.verified; });
    if (!entrants.length) bad('Nobody entered this contest yet.');
    // Fair draw with a cryptographic random generator.
    const pool = [...entrants], winners = [], count = Math.min(c.winners, pool.length);
    while (winners.length < count) winners.push(pool.splice(crypto.randomInt(pool.length), 1)[0]);
    db.prepare("UPDATE contests SET status = 'drawn', winner_ids = ? WHERE id = ?").run(JSON.stringify(winners), c.id);
    winners.forEach((id) => giveGift(id, { kind: c.prize_kind, ref: c.prize_ref, contestId: c.id }));
    res.json({ contest: contestView(db.prepare('SELECT * FROM contests WHERE id = ?').get(c.id), null), winners: winners.map((id) => { const u = getUser(id); return { id, name: `${u.first} ${u.last}`.trim(), email: u.email }; }) });
  });
  admin.post('/contests/:id/close', (req, res) => {
    db.prepare("UPDATE contests SET status = 'closed' WHERE id = ? AND status = 'open'").run(Number(req.params.id));
    res.json({ ok: true });
  });

  /* Gifts */
  admin.get('/gifts', (req, res) => {
    res.json({ gifts: db.prepare('SELECT g.*, u.first, u.last, u.email, u.phone, u.state FROM gifts g LEFT JOIN users u ON u.id = g.user_id ORDER BY g.id DESC LIMIT 300').all()
      .map((g) => ({ ...giftView(g, g.state ? JSON.parse(g.state) : { vouchers: [] }), customer: `${g.first || ''} ${g.last || ''}`.trim(), email: g.email, phone: g.phone, userId: g.user_id })) });
  });
  admin.post('/gifts', json, (req, res) => {
    const b = req.body || {};
    const u = db.prepare('SELECT * FROM users WHERE (email = ? OR id = ?) AND verified = 1').get(String(b.to || '').trim().toLowerCase(), Number(b.to) || -1) || bad('No confirmed customer with that email.');
    const g = giveGift(u.id, { kind: b.kind, ref: b.ref, source: String(b.reason || 'A gift from the Seasonly team').trim().slice(0, 80), note: b.note });
    res.status(201).json({ gift: { id: g.id, label: g.label } });
  });
  admin.post('/gifts/:id/shipped', (req, res) => {
    const g = db.prepare('SELECT * FROM gifts WHERE id = ?').get(Number(req.params.id)) || bad('Gift not found.', 404);
    if (g.kind !== 'product' || g.status !== 'to_ship') bad('Only product gifts waiting to ship can be marked as shipped.');
    db.prepare("UPDATE gifts SET status = 'shipped', shipped_at = ? WHERE id = ?").run(Date.now(), g.id);
    const u = getUser(g.user_id);
    if (u) { notifier.push([u.id], { ...tr('shippedPush', u.lang, g.label), url: '/#gifts' }).catch(() => {}); mailMsg(u, tr('shippedEmail', u.lang, u.first, g.label, JSON.parse(g.address))); }
    res.json({ ok: true });
  });

  admin.get('/messages', (req, res) => {
    const kind = ['support', 'feedback', 'idea'].includes(req.query.kind) ? req.query.kind : null;
    const rows = db.prepare(`SELECT m.*, u.first, u.last, u.email, u.phone FROM messages m LEFT JOIN users u ON u.id = m.user_id ${kind ? 'WHERE m.kind = ?' : ''} ORDER BY m.status = 'open' DESC, m.id DESC LIMIT 300`).all(...(kind ? [kind] : []));
    res.json({ messages: rows });
  });
  admin.post('/messages/:id/reply', json, (req, res) => {
    const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(Number(req.params.id)) || bad('Message not found.', 404);
    const body = String((req.body || {}).body || '').trim().slice(0, 4000);
    if (!body) bad('Write your reply first.');
    db.prepare("UPDATE messages SET reply = ?, replied_at = ?, status = 'resolved' WHERE id = ?").run(body, Date.now(), m.id);
    const u = m.user_id && getUser(m.user_id);
    if (u) {
      mailMsg(u, tr('supportReply', u.lang, u.first, m.id, body));
      notifier.push([u.id], { ...tr('supportReplyPush', u.lang, body), url: '/#support' }).catch(() => {});
    }
    res.json({ ok: true });
  });
  admin.post('/messages/:id/:status(resolve|reopen)', (req, res) => {
    db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(req.params.status === 'resolve' ? 'resolved' : 'open', Number(req.params.id));
    res.json({ ok: true });
  });
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
    // Optional English version for customers who use the app in English.
    const subjectEn = String(b.subjectEn || '').trim().slice(0, 150), bodyEn = String(b.bodyEn || '').trim().slice(0, 10000);
    const version = (u) => (u.lang === 'en' && subjectEn && bodyEn ? [subjectEn, bodyEn] : [subject, body]);
    // Never email an address the customer didn't confirm.
    const list = audience(b).filter((u) => u.email && u.email_verified);
    if (b.audience === 'one' && !list.length) bad('No confirmed customer with that email.');
    let sent = 0, failed = 0;
    for (const u of list) {
      const [sj, bd] = version(u);
      try { await notifier.email(u.email, sj, bd.replace(/\{first\}/g, u.first)); sent++; } catch { failed++; }
    }
    res.json({ recipients: list.length, sent, failed, delivered: notifier.status.email });
  }));
  admin.post('/push', json, wrap(async (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 80), body = String(b.body || '').trim().slice(0, 240);
    const url = /^\/[\w\-/#?=&.]*$/.test(b.url || '') ? b.url : '/';
    if (!title || !body) bad('Write a title and a message.');
    const titleEn = String(b.titleEn || '').trim().slice(0, 80), bodyEn = String(b.bodyEn || '').trim().slice(0, 240);
    const target = b.audience === 'all' ? 'all' : audience(b).map((u) => u.id);
    res.json(await pushLocal(target, (lang) => (lang === 'en' && titleEn && bodyEn ? { title: titleEn, body: bodyEn, url } : { title, body, url })));
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

  /* Collabs */
  const cleanCollab = (b) => {
    const str = (v, n) => String(v ?? '').trim().slice(0, n);
    const partner = str(b.partner, 60) || bad('Name the partner brand or event.');
    const kind = b.kind === 'event' ? 'event' : 'brand';
    const lang = (x = {}) => ({ title: str(x.title, 90), subtitle: str(x.subtitle, 140), body: str(x.body, 1500), cta: str(x.cta, 30), when: str(x.when, 80), offer: str(x.offer, 140) });
    const fr = lang(b.fr), en = lang(b.en);
    if (!fr.title && !en.title) bad('Give the collaboration a title.');
    const time = (v) => (v ? new Date(v).getTime() || null : null);
    const link = str(b.link, 300);
    if (link && !/^https:\/\//.test(link)) bad('The link must start with https://');
    return { partner, kind, data: { fr: fr.title ? fr : en, en: en.title ? en : fr, code: str(b.code, 30).toUpperCase(), link, place: str(b.place, 140), color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : '#C4806C',
      rsvp: !!b.rsvp, capacity: Math.max(0, Math.round(Number(b.capacity) || 0)), eventAt: time(b.eventAt), endsAt: time(b.endsAt) } };
  };
  admin.get('/collabs', (req, res) => {
    res.json({ collabs: db.prepare('SELECT * FROM collabs ORDER BY sort, id').all().map((c) => ({ ...collabView(c, null),
      attendees: db.prepare('SELECT u.first, u.last, u.email, u.phone, r.created_at FROM collab_regs r JOIN users u ON u.id = r.user_id WHERE r.collab_id = ? ORDER BY r.created_at').all(c.id) })) });
  });
  admin.post('/collabs', json, (req, res) => {
    const c = cleanCollab(req.body || {});
    const info = db.prepare('INSERT INTO collabs (partner, kind, data, active, sort, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(c.partner, c.kind, JSON.stringify(c.data), req.body.active === false ? 0 : 1, Math.floor(Number(req.body.sort)) || 0, Date.now());
    res.status(201).json({ collab: collabView(db.prepare('SELECT * FROM collabs WHERE id = ?').get(info.lastInsertRowid), null) });
  });
  admin.put('/collabs/:id', json, (req, res) => {
    const row = db.prepare('SELECT * FROM collabs WHERE id = ?').get(Number(req.params.id)) || bad('Not found.', 404);
    const c = cleanCollab(req.body || {});
    db.prepare('UPDATE collabs SET partner = ?, kind = ?, data = ?, active = ?, sort = ? WHERE id = ?').run(c.partner, c.kind, JSON.stringify(c.data), req.body.active === false ? 0 : 1, Math.floor(Number(req.body.sort)) || 0, row.id);
    res.json({ collab: collabView(db.prepare('SELECT * FROM collabs WHERE id = ?').get(row.id), null) });
  });
  admin.delete('/collabs/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM collabs WHERE id = ?').get(Number(req.params.id)) || bad('Not found.', 404);
    db.tx(() => { if (row.image_id) db.prepare('DELETE FROM images WHERE id = ?').run(row.image_id); db.prepare('DELETE FROM collabs WHERE id = ?').run(row.id); });
    res.json({ ok: true });
  });
  admin.post('/collabs/:id/image', raw, (req, res) => {
    const row = db.prepare('SELECT * FROM collabs WHERE id = ?').get(Number(req.params.id)) || bad('Not found.', 404);
    const id = publicImage(req.body, `collab:${row.id}`);
    db.tx(() => { if (row.image_id) db.prepare('DELETE FROM images WHERE id = ?').run(row.image_id); db.prepare('UPDATE collabs SET image_id = ? WHERE id = ?').run(id, row.id); });
    res.json({ collab: collabView(db.prepare('SELECT * FROM collabs WHERE id = ?').get(row.id), null) });
  });

  /* Ritual videos: an uploaded video replaces the animated guide for that ritual. */
  const rawVideo = express.raw({ type: Object.keys(VIDEO_TYPES), limit: '150mb' });
  admin.get('/rituals', (req, res) => {
    const v = ritualVideos();
    res.json({ rituals: Engine.RITUALS.map((r) => ({ id: r.id, name: r.name, steps: r.steps.length, secs: Engine.ritualSecs(r), video: v[r.id] || null })) });
  });
  admin.post('/rituals/:id/video', rawVideo, (req, res) => {
    const r = Engine.RITUALS.find((x) => x.id === req.params.id) || bad('Unknown ritual.', 404);
    const type = (req.get('Content-Type') || '').split(';')[0];
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    // Check the bytes, not just the declared type: MP4/MOV have "ftyp" at offset 4, WebM starts with the EBML header.
    const ok = VIDEO_TYPES[type] && buf.length > 1000 && (type === 'video/webm' ? buf.readUInt32BE(0) === 0x1a45dfa3 : buf.toString('latin1', 4, 8) === 'ftyp');
    if (!ok) bad('Upload an MP4, MOV or WebM video.');
    fs.mkdirSync(mediaDir, { recursive: true });
    const all = db.getSetting('ritualVideos', {});
    if (all[r.id]) fs.rmSync(path.join(mediaDir, all[r.id].file), { force: true });
    const file = `ritual-${r.id}.${VIDEO_TYPES[type]}`;
    fs.writeFileSync(path.join(mediaDir, file), buf);
    // Length in seconds, read by the admin panel from the file, so completion checks the right watch time.
    const secs = Math.round(Number(req.get('X-Duration')));
    all[r.id] = { file, v: Date.now().toString(36), secs: secs > 5 && secs < 3600 ? secs : null };
    db.setSetting('ritualVideos', all);
    res.json({ video: ritualVideos()[r.id] });
  });
  admin.delete('/rituals/:id/video', (req, res) => {
    const all = db.getSetting('ritualVideos', {});
    if (all[req.params.id]) { fs.rmSync(path.join(mediaDir, all[req.params.id].file), { force: true }); delete all[req.params.id]; db.setSetting('ritualVideos', all); }
    res.json({ ok: true });
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
    if (err.type === 'entity.too.large') return res.status(413).json({ error: req.path.includes('/video') ? 'Videos must be 150 MB or smaller.' : 'Photos must be 5 MB or smaller.' });
    res.status(status).json({ error: status >= 500 && !(err instanceof HttpError) ? 'Something went wrong. Try again.' : err.message });
  });

  /* Push a reminder about one hour before each treatment. Runs every minute from server/index.js. */
  async function runReminders(nowMs = Date.now()) {
    const due = [];
    db.tx(() => {
      db.prepare('SELECT id, state FROM users WHERE verified = 1').all().forEach((u) => {
        const s = JSON.parse(u.state);
        let changed = false;
        s.bookings.forEach((b) => {
          if (b.reminded || !['booked', 'paid'].includes(b.status) || !b.startAt) return;
          const left = b.startAt - nowMs;
          if (left > 0 && left <= 60 * 60 * 1000) { b.reminded = true; changed = true; due.push({ userId: u.id, b }); }
        });
        if (changed) db.prepare('UPDATE users SET state = ? WHERE id = ?').run(JSON.stringify(s), u.id);
      });
    });
    for (const { userId, b } of due) {
      await pushLocal([userId], (lang) => ({ ...tr('reminder', lang, b), url: `/#booking-${b.id}` })).catch(() => {});
    }
    return due.length;
  }

  return { app, db, notifier, runReminders };
}

module.exports = { createApp };
