'use strict';
const crypto = require('node:crypto');

const token = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  return safeEqual(crypto.scryptSync(pw, salt, 64).toString('hex'), hash);
}

/* Fixed-window rate limiter kept in memory (one process). */
function rateLimiter() {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, 60_000).unref();
  return function allow(key, limit, windowMs) {
    const now = Date.now();
    const v = hits.get(key);
    if (!v || v.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
    v.n += 1;
    return v.n <= limit;
  };
}

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
// Customer sessions use Lax so links from emails and notifications open signed in; admin sessions use Strict.
function cookie(name, value, { maxAge, secure, sameSite = 'Lax' }) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

/* Security headers for every response. */
function headers(req, res, next) {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

/* Mutating API calls must carry a custom header. Browsers can't add one cross-site without a
   CORS preflight we never allow, so together with SameSite cookies this blocks CSRF. */
function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Seasonly') !== '1') return res.status(403).json({ error: 'Request blocked. Refresh the app and try again.' });
  next();
}

function normalizePhone(raw) {
  let p = String(raw || '').replace(/[\s.\-()]/g, '');
  if (/^00\d+$/.test(p)) p = '+' + p.slice(2);
  if (/^0[1-9]\d{8}$/.test(p)) p = '+33' + p.slice(1); // French national format
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}
const normalizeEmail = (raw) => {
  const e = String(raw || '').trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(e) ? e : null;
};
const maskPhone = (p) => p.replace(/^(\+\d{2})\d+(\d{2})$/, '$1 •• •• •• $2');
const maskEmail = (e) => e.replace(/^(.)[^@]*(@.*)$/, '$1•••$2');

module.exports = { token, sha256, safeEqual, hashPassword, checkPassword, rateLimiter, parseCookies, cookie, headers, csrf, normalizePhone, normalizeEmail, maskPhone, maskEmail };
