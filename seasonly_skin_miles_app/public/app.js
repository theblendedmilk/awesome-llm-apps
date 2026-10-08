/* Seasonly · Skin Miles — vanilla JS single-page app.
   Runs against the Node backend when it is served by it (accounts, codes by SMS/email, push, rewards
   computed server-side), and falls back to an offline demo mode that keeps everything on this device. */
(() => {
  'use strict';
  const E = window.SkinMiles;
  const C = window.SeasonlyCatalog;

  /* ---------- Icons (lucide-style strokes) ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    share: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M5 12v7.5h14V12"/>',
    play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7"/>',
    book: '<path d="M3.5 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8.5-.5v13c-2.5-1-5.5-1-8.5.5-3-1.5-6-1.5-8.5-.5v-13Z"/><path d="M12 6v13"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5S10.5 4 8 4.5 7 8.5 12 8.5ZM12 8.5S13.5 4 16 4.5 17 8.5 12 8.5Z"/>',
    ticket: '<path d="M3.5 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4V19h17v-3a2 2 0 0 1 0-4 2 2 0 0 0 0-4V5h-17v3Z"/><path d="M14 5v14" stroke-dasharray="2 2.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"/><path d="M19 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    quiz: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.3"/><path d="M12 16.8h.01"/>',
    wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3.5v6.9M12 13.6v6.9M3.5 12h6.9M13.6 12h6.9M6 6l4.9 4.9M13.1 13.1 18 18M18 6l-4.9 4.9M10.9 13.1 6 18"/>',
    flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.8 3.4-5.4 3.8-9.4 2.2 1.4 3.1 3.4 3 5.4 1-.6 1.6-1.6 1.8-2.8 1.9 1.6 3.4 4 3.4 6.8 0 3.2-2.4 5.6-6 5.6Z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4.5a3 3 0 0 0 3.6 4M16 6h3.5a3 3 0 0 1-3.6 4M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
    leaf: '<path d="M5 19c0-8 5-13.5 14.5-14-.2 9.5-5.8 14.5-13.5 14.5"/><path d="M5 19c3-4 6-6.5 9.5-8"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11.5H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6 6 0 0 1 3 5.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  };
  const ic = (n, s = 20, sw = 1.6) =>
    `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ---------- Illustrations ---------- */
  function productArt(p, big = false) {
    const c = p.art || { kind: 'dropper', glass: '#E7EBEA', liquid: '#F1EEE6', label: '#FBFBF9', cap: '#F4F4F2', collar: '#DADAD6', ink: '#3A3532' };
    const ty = c.kind === 'tube' ? 92 : 84;
    const label = `<text x="50" y="${ty}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9" fill="${c.ink}">seasonly</text>
      <text x="50" y="${ty + 8}" text-anchor="middle" font-family="Inter, sans-serif" font-size="3" letter-spacing=".6" fill="${c.ink}" opacity=".7">PARIS</text>
      <rect x="36" y="${ty + 14}" width="28" height="1.4" rx=".7" fill="${c.ink}" opacity=".35"/>
      <rect x="39" y="${ty + 18}" width="22" height="1.4" rx=".7" fill="${c.ink}" opacity=".25"/>`;
    let body;
    if (c.kind === 'dropper') {
      body = `<rect x="43" y="6" width="14" height="24" rx="7" fill="${c.cap}"/><rect x="37" y="28" width="26" height="14" rx="3" fill="${c.collar}"/>
        <rect x="24" y="40" width="52" height="112" rx="12" fill="${c.glass}"/><rect x="24" y="96" width="52" height="56" rx="12" fill="${c.liquid}" opacity=".55"/>
        <rect x="30" y="70" width="40" height="44" rx="3" fill="${c.label}"/>${label}<rect x="28" y="46" width="4.5" height="98" rx="2.2" fill="#fff" opacity=".45"/>`;
    } else if (c.kind === 'tube') {
      body = `<path d="M28 18h44l-4 118a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6L28 18Z" fill="${c.glass}"/><rect x="26" y="10" width="48" height="10" rx="2" fill="${c.cap}"/>
        <rect x="38" y="142" width="24" height="12" rx="3" fill="${c.cap}"/>${label}<path d="M33 24l3 108" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
    } else if (c.kind === 'jar') {
      body = `<rect x="20" y="64" width="60" height="18" rx="5" fill="${c.cap}"/><rect x="18" y="80" width="64" height="66" rx="14" fill="${c.glass}"/>
        <rect x="28" y="96" width="44" height="34" rx="3" fill="${c.label}"/>
        <text x="50" y="112" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9" fill="${c.ink}">seasonly</text>
        <text x="50" y="120" text-anchor="middle" font-family="Inter, sans-serif" font-size="3" letter-spacing=".6" fill="${c.ink}" opacity=".7">PARIS</text>
        <rect x="22" y="86" width="4.5" height="52" rx="2.2" fill="#fff" opacity=".45"/>`;
    } else {
      body = `<path d="M50 30c18 0 30 14 30 34 0 10-6 18-12 26-6 8-8 18-8 30v14c0 6-4 10-10 10s-10-4-10-10v-14c0-12-2-22-8-30-6-8-12-16-12-26 0-20 12-34 30-34Z" fill="${c.glass}"/>
        <path d="M50 46c10 0 17 8 17 19" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".45"/>
        <path d="M30 64c0-12 8-24 20-26" stroke="${c.cap}" stroke-width="2" fill="none" opacity=".6"/>`;
    }
    return `<svg class="pa${big ? ' big' : ''}" viewBox="0 0 100 160" aria-hidden="true"><ellipse cx="50" cy="155" rx="30" ry="4" fill="#3b2a20" opacity=".12"/>${body}</svg>`;
  }
  function productVisual(p, big = false) {
    return p.image ? `<img class="p-img${big ? ' big' : ''}" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" draggable="false">` : productArt(p, big);
  }

  // Illustrated portrait used until a campaign photo is uploaded in the admin panel.
  function faceArt() {
    return `<svg class="face-art" viewBox="0 0 400 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7EFE9"/><stop offset="1" stop-color="#EBD7CB"/></linearGradient>
        <linearGradient id="fskin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EDCDB8"/><stop offset=".55" stop-color="#DFB295"/><stop offset="1" stop-color="#C9967A"/></linearGradient>
        <radialGradient id="fblush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#D98C77" stop-opacity=".45"/><stop offset="1" stop-color="#D98C77" stop-opacity="0"/></radialGradient>
        <linearGradient id="fhair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A342A"/><stop offset="1" stop-color="#2A1D17"/></linearGradient>
        <radialGradient id="fwood" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#E4C6A5"/><stop offset="1" stop-color="#B98A63"/></radialGradient>
      </defs>
      <rect width="400" height="380" fill="url(#fbg)"/>
      <path d="M196 30C230-20 380-30 410 40V380H330C340 300 330 250 318 200 300 120 250 70 196 30Z" fill="url(#fhair)"/>
      <path d="M205 38C196 70 186 100 188 128 189 136 194 140 193 146 186 162 168 180 160 194 156 202 162 208 172 209L182 212C183 218 175 222 174 228 176 233 184 233 183 237 178 241 176 246 180 251 186 255 190 258 187 266 183 276 184 288 196 296 214 306 246 308 268 300 270 330 262 360 258 380H338C342 320 336 260 320 200 302 130 262 70 205 38Z" fill="url(#fskin)"/>
      <ellipse cx="236" cy="205" rx="44" ry="34" fill="url(#fblush)"/>
      <path d="M296 168C312 160 326 178 320 198 316 212 302 216 296 208" fill="#D4A385" stroke="#B9876B" stroke-width="1.2"/>
      <path d="M202 128C214 120 232 118 246 124" fill="none" stroke="#4A342A" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M204 150C212 157 226 158 238 151" fill="none" stroke="#3A2A22" stroke-width="2" stroke-linecap="round"/>
      <g stroke="#3A2A22" stroke-width="1.3" stroke-linecap="round"><path d="M208 154l-3 5"/><path d="M215 157l-2 6"/><path d="M223 158l-1 6"/><path d="M231 156l1 6"/></g>
      <path d="M182 212C183 218 175 222 174 228 176 233 184 233 183 237 178 241 176 246 180 251 186 252 193 246 193 239 193 230 189 220 182 212Z" fill="#C27C6B"/>
      <path d="M180 236C184 237 189 237 193 235" stroke="#9E5D50" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M232 60C280 80 312 130 326 190" stroke="#6B4B3C" stroke-width="2" fill="none" opacity=".5"/>
      <g transform="translate(230 250) rotate(28)">
        <rect x="58" y="-6" width="120" height="12" rx="6" fill="#C9A27F"/><rect x="18" y="-3" width="44" height="6" rx="3" fill="#B98A63"/>
        <circle cx="0" cy="-22" r="22" fill="url(#fwood)"/><circle cx="10" cy="24" r="17" fill="url(#fwood)"/><circle cx="-7" cy="-30" r="6" fill="#fff" opacity=".35"/>
      </g></svg>`;
  }

  /* ---------- Utils ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const nf = (n) => Math.round(n).toLocaleString('en-US');
  const eur = (n) => `€${Number.isInteger(n) ? n : Number(n).toFixed(2).replace('.', ',')}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const pad = (n) => String(n).padStart(2, '0');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };

  /* ---------- Backends ---------- */
  // Server mode: everything goes through the API, with an httpOnly session cookie.
  function serverBackend() {
    async function call(method, url, body, raw) {
      const res = await fetch('/api' + url, {
        method, credentials: 'same-origin',
        headers: raw ? { 'X-Seasonly': '1', 'Content-Type': raw.type || 'image/jpeg' } : { 'X-Seasonly': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: raw || (body ? JSON.stringify(body) : undefined),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Try again.'), { status: res.status });
      return data;
    }
    let avatarUrl = null;
    return {
      mode: 'server',
      async init() {
        const [config, prods] = await Promise.all([call('GET', '/config'), call('GET', '/products')]);
        const { user } = await call('GET', '/session');
        return { config, products: prods.products, user };
      },
      signup: (d) => call('POST', '/auth/signup', d),
      login: (identifier) => call('POST', '/auth/login', { identifier }),
      resend: (pending, channel) => call('POST', '/auth/resend', { pending, channel }),
      verify: (pending, code) => call('POST', '/auth/verify', { pending, code }),
      logout: () => call('POST', '/auth/logout'),
      deleteAccount: () => call('DELETE', '/me'),
      act: (type, payload) => call('POST', '/actions', { type, payload }),
      uploadAvatar: (blob) => call('POST', '/me/avatar', null, blob),
      deleteAvatar: () => call('DELETE', '/me/avatar'),
      async avatar(user) {
        if (!user.hasAvatar) return null;
        if (avatarUrl && avatarUrl.v === user.avatarVersion) return avatarUrl.url;
        const res = await fetch('/api/me/avatar', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) return null;
        if (avatarUrl) URL.revokeObjectURL(avatarUrl.url);
        avatarUrl = { v: user.avatarVersion, url: URL.createObjectURL(await res.blob()) };
        return avatarUrl.url;
      },
      pushSubscribe: (subscription) => call('POST', '/push/subscribe', { subscription }),
      pushUnsubscribe: (endpoint) => call('POST', '/push/unsubscribe', { endpoint }),
    };
  }

  // Demo mode: the same engine and flows, stored on this device. Codes are shown on screen.
  function demoBackend() {
    const KEY = 'seasonly.demo.v2';
    const db = store.get(KEY, { users: {}, session: null, pending: {} });
    const save = () => store.set(KEY, db);
    const err = (m) => Promise.reject(new Error(m));
    const normPhone = (raw) => { let p = String(raw || '').replace(/[\s.\-()]/g, ''); if (/^0[1-9]\d{8}$/.test(p)) p = '+33' + p.slice(1); return /^\+[1-9]\d{7,14}$/.test(p) ? p : null; };
    const normEmail = (raw) => { const e = String(raw || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : null; };
    const pub = (u) => ({ id: u.id, first: u.state.profile.first, last: u.state.profile.last, email: u.email, phone: u.phone, referralCode: u.code,
      hasAvatar: !!u.avatar, avatarVersion: u.avatar ? String(u.avatar.length) : null, state: u.state, push: false });
    const ctx = () => ({ now: new Date(), products: C.PRODUCTS, settings: { referral: E.DEFAULT_REFERRAL } });
    const findBy = (f) => Object.values(db.users).find(f);
    function newCode(userId, purpose, channel) {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      db.pending = { [id]: { userId, purpose, channel, code, sent: Date.now(), attempts: 0 } };
      save();
      return { id, code };
    }
    const resp = (u, otp, channel) => ({ pending: otp.id, channel, devCode: otp.code,
      sentTo: { sms: channel !== 'email' ? u.phone.replace(/^(\+\d{2})\d+(\d{2})$/, '$1 •• •• •• $2') : null, email: channel !== 'sms' ? u.email.replace(/^(.)[^@]*(@.*)$/, '$1•••$2') : null } });
    return {
      mode: 'demo',
      async init() {
        const u = db.session && db.users[db.session];
        return { config: { referral: E.DEFAULT_REFERRAL, hero: null, vapidPublicKey: null }, products: C.PRODUCTS, user: u && u.verified ? pub(u) : null };
      },
      async signup(d) {
        const first = String(d.first || '').trim(), email = normEmail(d.email), phone = normPhone(d.phone);
        if (!first) return err('Enter your first name.');
        if (!email) return err('Enter a valid email address.');
        if (!phone) return err('Enter a valid mobile number, for example 06 12 34 56 78.');
        if (d.consent !== true) return err('Please accept the terms and privacy policy to continue.');
        let referredBy = null;
        if (d.referral) {
          const code = String(d.referral).trim().toUpperCase();
          const r = findBy((u) => u.code === code && u.verified);
          if (!r) return err('This referral code does not exist. Check it or leave the field empty.');
          if (r.email === email || r.phone === phone) return err('You cannot use your own referral code.');
          referredBy = code;
        }
        if (findBy((u) => u.verified && (u.email === email || u.phone === phone))) return err('An account already exists with this email or phone number. Sign in instead.');
        Object.keys(db.users).forEach((k) => { const u = db.users[k]; if (!u.verified && (u.email === email || u.phone === phone)) delete db.users[k]; });
        const id = 'u' + Date.now().toString(36);
        db.users[id] = { id, email, phone, verified: false, code: null, avatar: null, state: E.newState({ first, last: String(d.last || '').trim(), email, phone, referredBy }, new Date()) };
        const channel = ['sms', 'email', 'both'].includes(d.channel) ? d.channel : 'sms';
        return resp(db.users[id], newCode(id, 'signup', channel), channel);
      },
      async login(identifier) {
        const email = normEmail(identifier), phone = email ? null : normPhone(identifier);
        if (!email && !phone) return err('Enter the email or mobile number of your account.');
        const u = findBy((x) => x.verified && (email ? x.email === email : x.phone === phone));
        if (!u) return err('No account on this device with these details. Create one first.');
        const channel = email ? 'email' : 'sms';
        return resp(u, newCode(u.id, 'login', channel), channel);
      },
      async resend(pending, channel) {
        const p = db.pending[pending];
        if (!p) return err('This code request expired. Start again.');
        if (Date.now() - p.sent < 30000) return err('Wait a few seconds before asking for a new code.');
        const ch = p.purpose === 'signup' ? channel || p.channel : p.channel;
        return resp(db.users[p.userId], newCode(p.userId, p.purpose, ch), ch);
      },
      async verify(pending, code) {
        const p = db.pending[pending];
        if (!p) return err('This code has expired. Ask for a new one.');
        if (String(code).replace(/\D/g, '') !== p.code) {
          p.attempts += 1; save();
          const left = 5 - p.attempts;
          if (left <= 0) { delete db.pending[pending]; save(); return err('Too many wrong codes. Ask for a new one.'); }
          return err(`That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.`);
        }
        delete db.pending[pending];
        const u = db.users[p.userId];
        const isNew = !u.verified;
        if (isNew) {
          u.verified = true;
          u.code = (u.state.profile.first.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) || 'SEASON') + Math.random().toString(36).slice(2, 6).toUpperCase();
          u.state.referral.code = u.code;
          u.state = E.apply(u.state, { type: 'welcome' }, ctx()).state;
        }
        db.session = u.id; save();
        return { user: pub(u), isNew };
      },
      async logout() { db.session = null; save(); return { ok: true }; },
      async deleteAccount() { delete db.users[db.session]; db.session = null; save(); return { ok: true }; },
      async act(type, payload) {
        const u = db.users[db.session];
        if (!u) return err('Please sign in again.');
        let out;
        try { out = E.apply(u.state, { type, payload }, ctx()); } catch (e) { return err(e.message); }
        u.state = out.state;
        out.events.filter((e) => e.type === 'referralQualified').forEach((e) => {
          const r = findBy((x) => x.code === e.code && x.verified);
          if (r) r.state = E.apply(r.state, { type: 'referralCredit', payload: { name: u.state.profile.first } }, ctx()).state;
        });
        save();
        return { state: out.state, events: out.events.filter((e) => e.type !== 'referralQualified'), result: out.result };
      },
      async uploadAvatar(blob) {
        const u = db.users[db.session];
        u.avatar = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(blob); });
        save();
        return { user: pub(u) };
      },
      async deleteAvatar() { const u = db.users[db.session]; u.avatar = null; save(); return { user: pub(u) }; },
      async avatar() { const u = db.users[db.session]; return u && u.avatar; },
    };
  }

  /* ---------- App state ---------- */
  let B = null;            // backend
  let CONFIG = {};
  let PRODUCTS = [];
  let U = null;            // signed-in user (public fields + state)
  let S = null;            // rewards state (U.state)
  let avatarSrc = null;
  const ui = { tab: 'home', cat: 'Anti-aging', q: '', step: 1, bk: { studio: null, service: null, day: 1, slot: null, voucher: null },
    auth: 'welcome', form: {}, pending: null, busy: false, error: '' };
  const app = $('#app'), tabbar = $('#tabbar'), sheet = $('#sheet'), toastWrap = $('#toast');
  const bag = { get: () => store.get('seasonly.bag', []), set: (b) => store.set('seasonly.bag', b) };
  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const today = () => new Date();
  const doneToday = (id) => E.doneOn(S, id, today());
  const bagCount = () => bag.get().reduce((a, b) => a + b.qty, 0);

  function setUser(user) {
    U = user; S = user ? user.state : null;
    if (user && B) B.avatar(user).then((src) => { avatarSrc = src; paintAvatars(); }).catch(() => {});
    else avatarSrc = null;
  }

  /* Run a rewards action (server-side when online), then show what happened. */
  async function act(type, payload = {}, { quiet = false } = {}) {
    try {
      const out = await B.act(type, payload);
      S = out.state; U.state = S;
      if (!quiet) out.events.forEach(showEvent);
      return out;
    } catch (e) { toast(e.message, '', 'error'); throw e; }
  }
  function showEvent(e) {
    if (e.type === 'miles') toast(`+${nf(e.amt)} miles`, e.label);
    else if (e.type === 'badge') toast('Badge unlocked', e.name, 'badge');
    else if (e.type === 'tier') toast(`Welcome to ${e.name}`, `Earn ×${e.mult} miles from now on`, 'tier');
    else if (e.type === 'referral') toast(`${e.name} booked`, `You now have ${e.discount}% off your next booking`, 'tier');
  }

  /* ---------- Render ---------- */
  function render() {
    const scroll = app.scrollTop;
    if (!U) {
      app.innerHTML = AUTH[ui.auth]();
      app.dataset.tab = 'auth';
      tabbar.hidden = true;
    } else {
      app.innerHTML = VIEWS[ui.tab]();
      app.dataset.tab = ui.tab;
      tabbar.hidden = false;
      tabbar.innerHTML = [['home', 'home', 'Home'], ['shop', 'bag', 'Shop'], ['book', 'calendar', 'Book'], ['rewards', 'heart', 'Rewards'], ['profile', 'user', 'Profile']]
        .map(([id, icon, label]) => `<button class="tab${ui.tab === id ? ' on' : ''}" data-a="tab" data-arg="${id}" aria-label="${label}">${ic(icon, 22)}<span>${label}</span>${id === 'rewards' && E.canCheckIn(S, today()) ? '<i class="dot"></i>' : ''}</button>`).join('');
    }
    if (ui.keepScroll) app.scrollTop = scroll;
    ui.keepScroll = false;
    paintAvatars();
  }
  const rerender = () => { ui.keepScroll = true; render(); };

  // Photos render as CSS backgrounds under a transparent shield: no "save image" target, no drag.
  function paintAvatars() {
    document.querySelectorAll('[data-avatar]').forEach((el) => {
      el.style.backgroundImage = avatarSrc ? `url("${avatarSrc}")` : '';
      el.classList.toggle('has-photo', !!avatarSrc);
    });
  }
  const avatar = (size = 52) => `<span class="avatar protected" data-avatar style="width:${size}px;height:${size}px;font-size:${size / 2}px"><b>${esc((U.first || '?')[0])}</b><i class="shield-layer"></i></span>`;

  /* ---------- Shared pieces ---------- */
  const sectionHead = (title, link, action, arg = '') =>
    `<div class="sec-head"><h2>${title}</h2>${link ? `<button class="link" data-a="${action}" data-arg="${arg}">${link} →</button>` : ''}</div>`;
  function ring(done, total, size = 64) {
    const r = size / 2 - 4, c = 2 * Math.PI * r, pct = total ? done / total : 0;
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--ring-track)" stroke-width="4" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--accent)" stroke-width="4" fill="none" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span>${done}/${total}</span></div>`;
  }
  function milesCard() {
    const nt = E.nextTier(S.lifetime), t = E.tierOf(S.lifetime);
    const pct = nt ? Math.min(100, ((S.lifetime - t.min) / (nt.min - t.min)) * 100) : 100;
    return `<button class="miles-card glass" data-a="tab" data-arg="rewards">
      <span class="star-badge">${ic('star', 18)}</span>
      <span class="mc-body"><span class="eyebrow muted">Your Seasonly miles</span>
        <span class="mc-num">${nf(S.miles)} <small>${nt ? `/ ${nf(nt.min)} lifetime to ${nt.name}` : `${t.name} · top tier`}</small></span>
        <span class="bar"><i style="width:${pct}%"></i></span></span></button>`;
  }
  function productCard(p) {
    return `<article class="p-card"><div class="p-wrap">
      <button class="p-media" data-a="product" data-arg="${esc(p.id)}" style="background:${esc(p.bg)}" aria-label="${esc(p.name)}">
        ${p.badge ? `<span class="pill-badge${p.badge === 'New' ? ' light' : ''}">${esc(p.badge)}</span>` : ''}${productVisual(p)}</button>
      <button class="add-mini" data-a="add" data-arg="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">${ic('plus', 16, 2)}</button></div>
      <h3 data-a="product" data-arg="${esc(p.id)}">${esc(p.name)}</h3>
      <p class="muted sm">${esc(p.sub)}</p>
      <p class="p-price"><span>${eur(p.price)}${p.compareAt ? ` <s class="muted">${eur(p.compareAt)}</s>` : ''}</span><span class="muted">${esc(p.size)}</span></p>
    </article>`;
  }
  const field = (id, label, attrs = '', value = '') => `<label class="field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" value="${esc(value)}" ${attrs}></label>`;

  /* ---------- Auth screens ---------- */
  const heroBg = () => (CONFIG.hero ? `<div class="hero-photo" style="background-image:url('${esc(CONFIG.hero)}')"></div>` : `<div class="hero-art">${faceArt()}</div>`);
  const AUTH = {
    welcome() {
      return `<section class="welcome">
        <div class="welcome-hero">${heroBg()}<div class="logo">seasonly<small>PARIS</small></div></div>
        <div class="welcome-body">
          <p class="eyebrow accent">Skin Miles</p>
          <h1 class="display">Your skin in <em>balance</em>,<br>this season.</h1>
          <p class="muted">Earn miles for every ritual, treatment and order, and trade them for seasonal vouchers.</p>
          <div class="gift-line">${ic('gift', 18)} <span><b>300 Skin Miles</b> welcome gift when you confirm your account</span></div>
          <button class="btn-dark wide" data-a="auth" data-arg="signup">Create my account</button>
          <button class="btn-ghost wide" data-a="auth" data-arg="login">I already have an account</button>
          ${B.mode === 'demo' ? '<p class="demo-note">Demo mode: accounts and codes stay on this device. No real SMS or email is sent.</p>' : ''}
        </div></section>`;
    },
    signup() {
      const f = ui.form;
      const ch = f.channel || 'sms';
      return `<div class="pad top auth">
        <button class="icon-btn" data-a="auth" data-arg="welcome" aria-label="Back">${ic('back', 18)}</button>
        <p class="eyebrow accent mt16">Step 1 of 2</p>
        <h1 class="serif-h">Create your <em class="accent">account</em></h1>
        <form class="stack" data-form="signup" novalidate>
          <div class="two">${field('first', 'First name', 'autocomplete="given-name" required maxlength="40"', f.first)}${field('last', 'Last name', 'autocomplete="family-name" maxlength="40"', f.last)}</div>
          ${field('email', 'Email', 'type="email" autocomplete="email" inputmode="email" required', f.email)}
          ${field('phone', 'Mobile number', 'type="tel" autocomplete="tel" inputmode="tel" placeholder="06 12 34 56 78" required', f.phone)}
          ${field('referral', 'Referral code (optional)', 'autocomplete="off" autocapitalize="characters" maxlength="12"', f.referral)}
          <fieldset class="seg"><legend>Send my confirmation code by</legend>
            ${[['sms', 'SMS'], ['email', 'Email'], ['both', 'Both']].map(([v, l]) => `<label class="${ch === v ? 'on' : ''}"><input type="radio" name="channel" value="${v}" ${ch === v ? 'checked' : ''}>${l}</label>`).join('')}
          </fieldset>
          <label class="check"><input type="checkbox" name="consent" id="consent" ${f.consent ? 'checked' : ''}><span>I accept the terms of use and the privacy policy. Seasonly uses my details to manage my account and rewards.</span></label>
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Sending…' : 'Send my code'}</button>
        </form>
        <p class="muted sm center mt16">Already a member? <button class="link" data-a="auth" data-arg="login">Sign in</button></p>
      </div>`;
    },
    login() {
      return `<div class="pad top auth">
        <button class="icon-btn" data-a="auth" data-arg="welcome" aria-label="Back">${ic('back', 18)}</button>
        <p class="eyebrow accent mt16">Sign in</p>
        <h1 class="serif-h">Welcome <em class="accent">back</em></h1>
        <p class="muted">We'll send a 6-digit code to confirm it's you. No password needed.</p>
        <form class="stack" data-form="login" novalidate>
          ${field('identifier', 'Email or mobile number', 'autocomplete="username" required', ui.form.identifier)}
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Sending…' : 'Send my code'}</button>
        </form>
        <p class="muted sm center mt16">New to Seasonly? <button class="link" data-a="auth" data-arg="signup">Create an account</button></p>
      </div>`;
    },
    verify() {
      const p = ui.pending || {};
      const to = [p.sentTo && p.sentTo.sms ? `by SMS to <b>${esc(p.sentTo.sms)}</b>` : '', p.sentTo && p.sentTo.email ? `by email to <b>${esc(p.sentTo.email)}</b>` : ''].filter(Boolean).join(' and ');
      const wait = Math.max(0, 30 - Math.floor((Date.now() - (p.at || 0)) / 1000));
      return `<div class="pad top auth">
        <button class="icon-btn" data-a="auth" data-arg="${p.purpose === 'login' ? 'login' : 'signup'}" aria-label="Back">${ic('back', 18)}</button>
        <p class="eyebrow accent mt16">${p.purpose === 'login' ? 'Sign in' : 'Step 2 of 2'}</p>
        <h1 class="serif-h">Confirm your <em class="accent">${p.channel === 'email' ? 'email' : 'number'}</em></h1>
        <p class="muted">We sent a 6-digit code ${to}. It expires in 10 minutes.</p>
        ${p.devCode ? `<div class="demo-code">${ic('phone', 18)}<span>${B.mode === 'demo' ? 'Demo mode — no real message is sent.' : 'Development mode.'} Your code is <b>${esc(p.devCode)}</b></span></div>` : ''}
        <form class="stack" data-form="verify" novalidate>
          <label class="field otp" for="code"><span>Confirmation code</span>
            <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="••••••" required></label>
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Checking…' : 'Confirm'}</button>
        </form>
        <div class="resend">
          <button class="link" data-a="resend" ${wait ? 'disabled' : ''} id="resendBtn">${wait ? `Send a new code in ${wait}s` : 'Send a new code'}</button>
          ${p.purpose === 'signup' && p.channel !== 'both' ? `<button class="link" data-a="resend" data-arg="${p.channel === 'sms' ? 'email' : 'sms'}" ${wait ? 'disabled' : ''}>Send it by ${p.channel === 'sms' ? 'email' : 'SMS'} instead</button>` : ''}
        </div>
      </div>`;
    },
  };
  let resendTimer = null;
  function startResendTimer() {
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      const b = $('#resendBtn');
      if (!b || ui.auth !== 'verify') return clearInterval(resendTimer);
      const wait = Math.max(0, 30 - Math.floor((Date.now() - ui.pending.at) / 1000));
      b.textContent = wait ? `Send a new code in ${wait}s` : 'Send a new code';
      document.querySelectorAll('[data-a="resend"]').forEach((x) => { x.disabled = !!wait; });
      if (!wait) clearInterval(resendTimer);
    }, 1000);
  }

  /* ---------- Main views ---------- */
  const VIEWS = {
    home() {
      const s = E.seasonOf(today()), main = E.RITUALS[0], prog = E.ritualProgress(S, main.id, today());
      const tip = E.TIPS[new Date().getDate() % E.TIPS.length];
      const recent = S.ledger.filter((l) => l.kind === 'ritual' && Date.now() - l.t < 14 * 864e5).length;
      const radiance = Math.min(42, 6 + recent * 4);
      return `
      <section class="hero">
        ${heroBg()}
        <div class="hero-top">
          <div class="logo">seasonly<small>PARIS</small></div>
          <div class="row g8">
            <span class="chip-glass">${s.name} · W${E.isoWeek(new Date())}</span>
            <button class="icon-glass" data-a="bag" aria-label="Bag">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button>
            <button class="icon-glass dark" data-a="tab" data-arg="rewards" aria-label="Rewards">${ic('bell', 18)}</button>
          </div>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Bonjour, ${esc(U.first)}</p>
          <h1 class="display">Your skin in <em>balance</em>,<br>this season.</h1>
        </div>
      </section>
      <button class="stats glass" data-a="tab" data-arg="rewards">
        <span class="stat"><span class="stat-ic">${ic('star', 16)}</span><b>${nf(S.miles)}</b><small>Miles</small></span>
        <span class="stat"><span class="stat-ic">${ic('clock', 16)}</span><b>${S.streak}</b><small>Day streak</small></span>
        <span class="stat"><span class="stat-ic">${ic('eye', 16)}</span><b>+${radiance}%</b><small>Radiance</small></span>
      </button>
      <div class="pad">
        ${E.canCheckIn(S, today()) ? `<button class="checkin-banner" data-a="checkin">
          <span class="flame">${ic('flame', 20)}</span>
          <span><b>Daily check-in</b><small>${S.streak ? `Keep your ${S.streak}-day streak alive` : 'Start your streak today'}</small></span>
          <span class="pill-accent">+20 miles</span></button>` : ''}
        <article class="card tip" data-a="tip" data-arg="${tip.id}">
          <div class="row between"><span class="row g6 muted sm">${ic('book', 16)} Daily wellness tip</span>
            ${doneToday('tip-' + tip.id) ? `<span class="pill-done">${ic('check', 12, 2.4)} Read</span>` : '<span class="pill-dark">New</span>'}</div>
          <h3 class="t-title">${tip.title}</h3><p class="muted">${tip.lead}</p>
          <p class="t-cta">${doneToday('tip-' + tip.id) ? 'Earned today · come back tomorrow' : 'Tap to read & earn 10 miles →'}</p>
        </article>
        ${sectionHead("Today's ritual", 'See all', 'rituals')}
        <article class="card ritual-card">
          ${ring(prog, main.steps.length)}
          <div class="grow"><p class="eyebrow accent">${main.eyebrow}</p><h3 class="serif-t">${main.name}</h3>
            <p class="muted sm">${main.steps.length} steps · ${main.mins} min · ${doneToday('ritual-' + main.id) ? 'earned' : `+${main.miles} miles`}</p></div>
          <button class="btn-dark sm" data-a="ritual" data-arg="${main.id}">${doneToday('ritual-' + main.id) ? 'Again' : prog ? 'Resume' : 'Start'} ${ic('play', 14)}</button>
        </article>
        ${referralTeaser()}
        ${sectionHead(`Curated for ${s.name.toLowerCase()}`, 'More', 'rituals')}
      </div>
      <div class="hscroll">
        ${E.RITUALS.slice(1).map((r, i) => `<button class="curated c${i}" data-a="ritual" data-arg="${r.id}">
          <span class="curated-art">${productArt(PRODUCTS.find((p) => p.art && p.art.kind === ['guasha', 'dropper', 'tube'][i]) || PRODUCTS[0], true)}</span>
          <span class="curated-copy"><span class="eyebrow">${r.eyebrow}</span><span class="serif-xl">${r.name}</span>
          <span class="miles-chip">${doneToday('ritual-' + r.id) ? 'Earned today' : `+${r.miles} miles`}</span></span></button>`).join('')}
      </div>
      <div class="pad">${sectionHead('From the laboratoire', 'Shop all', 'tab', 'shop')}</div>
      <div class="hscroll small">${PRODUCTS.slice(0, 8).map(productCard).join('')}</div>
      <div class="spacer"></div>`;
    },

    shop() {
      const q = ui.q.trim().toLowerCase();
      const list = PRODUCTS.filter((p) => (ui.cat === 'All' || p.cat === ui.cat || (p.tags || []).includes(ui.cat)) &&
        (!q || `${p.name} ${p.sub} ${p.desc} ${p.cat}`.toLowerCase().includes(q)));
      return `<div class="pad top">
        <div class="row between">
          <p class="eyebrow accent">Boutique</p>
          <div class="row g8"><button class="icon-btn" data-a="focus-search" aria-label="Search">${ic('search', 18)}</button>
          <button class="icon-btn" data-a="bag" aria-label="Bag">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button></div>
        </div>
        <label class="search glass" for="search">${ic('search', 16)}<input id="search" type="search" placeholder="Search the laboratoire…" value="${esc(ui.q)}" autocomplete="off"></label>
      </div>
      <div class="chips">${C.CATS.map((c) => `<button class="chip${ui.cat === c ? ' on' : ''}" data-a="cat" data-arg="${c}">${c}</button>`).join('')}</div>
      <div class="pad">
        ${milesCard()}
        ${sectionHead(ui.cat === 'All' ? 'The full collection' : ui.cat === 'Anti-aging' ? 'The TensioLift edit' : ui.cat, `${list.length} items`, 'cat', 'All')}
        ${list.length ? `<div class="p-grid">${list.map(productCard).join('')}</div>` : '<p class="empty">Nothing matches that search yet.</p>'}
      </div><div class="spacer"></div>`;
    },

    book() {
      const titles = { 1: ['Choose your', 'Face Glow Bar'], 2: ['Choose your', 'soin'], 3: ['Pick your', 'moment'], 4: ['Confirm your', 'visit'] };
      const [a, b] = titles[ui.step];
      let body = '';
      if (ui.step === 1) {
        body = E.STUDIOS.map((s, i) => `<button class="studio card" data-a="pick-studio" data-arg="${s.id}">
          <span class="studio-img s${i}">${ic('leaf', 26, 1.2)}</span>
          <span class="grow"><span class="serif-t">${s.name}</span><span class="muted sm block">${s.addr}</span>
          <span class="sm block mt4"><i class="live"></i><b>${s.hours}</b> <span class="muted">· ${s.dist}</span></span></span>
          <span class="round-dark">${ic('chevron', 16, 2)}</span></button>`).join('');
      } else if (ui.step === 2) {
        body = E.SERVICES.map((s) => `<button class="card svc${ui.bk.service === s.id ? ' sel' : ''}" data-a="pick-service" data-arg="${s.id}">
          <span class="grow"><span class="serif-t">${s.name}</span><span class="muted sm block">${s.desc}</span>
          <span class="sm block mt4"><b>${eur(s.price)}</b> <span class="muted">· ${s.mins} min · +150 miles</span></span></span>
          <span class="round-dark">${ic('chevron', 16, 2)}</span></button>`).join('');
      } else if (ui.step === 3) {
        const days = Array.from({ length: 7 }, (_, i) => E.addDays(new Date(), i + 1));
        body = `<div class="days">${days.map((d, i) => `<button class="day${ui.bk.day === i + 1 ? ' on' : ''}" data-a="pick-day" data-arg="${i + 1}">
            <small>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</small><b>${d.getDate()}</b></button>`).join('')}</div>
          <p class="eyebrow muted mt16">Available</p>
          <div class="slots">${E.SLOTS.map((t, i) => { const off = (i + ui.bk.day) % 4 === 3; return `<button class="slot${ui.bk.slot === t ? ' on' : ''}${off ? ' off' : ''}" data-a="pick-slot" data-arg="${t}" ${off ? 'disabled' : ''}>${t}</button>`; }).join('')}</div>
          <button class="btn-dark wide mt16" data-a="step" data-arg="4" ${ui.bk.slot ? '' : 'disabled'}>Continue</button>`;
      } else {
        const st = E.STUDIOS.find((x) => x.id === ui.bk.studio), sv = E.SERVICES.find((x) => x.id === ui.bk.service);
        const day = E.addDays(new Date(), ui.bk.day);
        const usable = S.vouchers.filter((v) => !v.used && v.kind === 'service' && v.expires > Date.now());
        // Preview the price with the same engine the server uses.
        let preview = null;
        try { preview = E.apply(S, { type: 'book', payload: { studio: st.id, service: sv.id, day: ui.bk.day, slot: ui.bk.slot, voucher: ui.bk.voucher } }, { now: new Date(), settings: { referral: CONFIG.referral } }).result.booking; } catch { /* shown on confirm */ }
        body = `<div class="card summary">
            <div class="sum-row"><span class="muted">Face Glow Bar</span><b>${st.name}</b></div>
            <div class="sum-row"><span class="muted">Soin</span><b>${sv.name} · ${sv.mins} min</b></div>
            <div class="sum-row"><span class="muted">Moment</span><b>${day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${ui.bk.slot}</b></div>
            <hr>
            ${usable.length ? `<p class="eyebrow muted">Apply a Skin Miles voucher</p>
              <div class="v-pick">${usable.map((v) => `<button class="v-opt${ui.bk.voucher === v.code ? ' on' : ''}" data-a="bk-voucher" data-arg="${v.code}">${ic('ticket', 16)} ${v.title}</button>`).join('')}</div><hr>` : ''}
            <div class="sum-row"><span class="muted">Price</span><b>${eur(sv.price)}</b></div>
            ${preview ? preview.lines.map((l) => `<div class="sum-row"><span class="muted">${esc(l.label)}</span><b class="accent">−${eur(-l.amount)}</b></div>`).join('') : ''}
            <div class="sum-row big"><span>Total at the Face Glow Bar</span><b>${eur(preview ? preview.price : sv.price)}</b></div>
          </div>
          <button class="btn-dark wide mt16" data-a="confirm-booking" ${ui.busy ? 'disabled' : ''}>Confirm · +150 miles</button>`;
      }
      const steps = ['Studio', 'Soin', 'Date', 'Confirm'];
      return `<div class="pad top">
        ${ui.step > 1 ? `<button class="icon-btn" data-a="step" data-arg="${ui.step - 1}" aria-label="Back">${ic('back', 18)}</button>` : '<div class="icon-spacer"></div>'}
        <p class="eyebrow accent mt16">Step ${ui.step} of 4</p>
        <h1 class="serif-h">${a} <em class="accent">${b}</em></h1>
        ${refBanner()}
        <div class="stepper glass">${steps.map((s, i) => `<span class="${i + 1 < ui.step ? 'done' : i + 1 === ui.step ? 'on' : ''}"><i>${i + 1 < ui.step ? '✓' : i + 1}</i>${s}</span>`).join('<b></b>')}</div>
        <div class="stack">${body}</div>
      </div><div class="spacer"></div>`;
    },

    rewards() {
      const t = E.tierOf(S.lifetime), nt = E.nextTier(S.lifetime), s = E.seasonOf(today());
      const pct = nt ? Math.min(100, ((S.lifetime - t.min) / (nt.min - t.min)) * 100) : 100;
      const games = [['match', 'grid', 'Glow Match', 'Pair the actives', 'up to 80'], ['quiz', 'quiz', 'Skin Quiz', '5 questions', 'up to 50'],
        ['wheel', 'wheel', 'Glow Wheel', 'One spin a day', '5–100'], ['ritual', 'sparkle', 'Rituals', 'Guided massage', '30–50']];
      const seasonV = E.VOUCHERS.filter((v) => v.season === s.id), nextV = E.VOUCHERS.filter((v) => v.season === s.next.id);
      const myV = S.vouchers.filter((v) => !v.used && v.expires > Date.now());
      return `<div class="pad top">
        <p class="eyebrow accent">Skin Miles</p>
        <h1 class="serif-h">Your <em class="accent">rewards</em></h1>
        <section class="wallet">
          <div class="row between"><span class="eyebrow">${t.name} member</span><span class="chip-glass dark">${s.name} · W${E.isoWeek(new Date())}</span></div>
          <div class="wallet-num">${nf(S.miles)}<small>miles</small></div>
          <div class="bar light"><i style="width:${pct}%"></i></div>
          <p class="wallet-note">${nt ? `${nf(nt.min - S.lifetime)} lifetime miles to <b>${nt.name}</b> · earn ×${nt.mult}` : 'Top tier reached · earn ×1.5 on everything'}</p>
        </section>
        <section class="card week">
          <div class="row between"><div><b class="streak-n">${S.streak}</b> <span class="muted">day streak</span></div><span class="muted sm">Best ${S.bestStreak}</span></div>
          ${weekRow()}
          ${E.canCheckIn(S, today()) ? '<button class="btn-dark wide" data-a="checkin">Check in today · +20 miles</button>' : `<p class="muted sm center">Checked in today. See you tomorrow.<br>Next bonus at ${nextMilestone()} days.</p>`}
        </section>
        ${sectionHead('Play & earn')}
        <div class="games">${games.map(([id, icon, name, sub, rew]) => {
          const done = id === 'ritual' ? E.RITUALS.every((r) => doneToday('ritual-' + r.id)) : doneToday(id);
          return `<button class="game card" data-a="${id === 'ritual' ? 'rituals' : 'game'}" data-arg="${id}">
            <span class="game-ic">${ic(icon, 22)}</span><b>${name}</b><small class="muted">${sub}</small>
            <span class="${done ? 'pill-done' : 'pill-accent'}">${done ? `${ic('check', 12, 2.4)} Done today` : `+${rew}`}</span></button>`;
        }).join('')}</div>
        ${referralCard()}
        ${sectionHead('Challenges')}
        <div class="card stack-tight">${E.challengeList(S, today()).map((c) => {
          const claimed = S.claimed.includes(c.key), full = c.v >= c.max;
          return `<div class="chal"><div class="row between g8"><span class="sm"><b>${c.name}</b></span>
            ${claimed ? `<span class="pill-done">${ic('check', 12, 2.4)} Claimed</span>` : full ? `<button class="btn-dark xs" data-a="claim" data-arg="${c.key}">Claim +${c.rew}</button>` : `<span class="sm muted">${c.v}/${c.max} · ${c.rew} mi</span>`}</div>
            <div class="bar"><i style="width:${(c.v / c.max) * 100}%"></i></div></div>`;
        }).join('')}</div>
        ${sectionHead(`${s.name} vouchers`)}
        <p class="muted sm mb12">Trade your miles for seasonal products and Face Glow Bar treatments. Valid until ${fmtDate(s.end)}.</p>
        <div class="stack">${seasonV.map((v) => voucherCard(v, true)).join('')}</div>
        ${myV.length ? `${sectionHead('My vouchers')}<div class="stack">${myV.map(myVoucher).join('')}</div>` : ''}
        ${sectionHead(`Coming in ${s.next.name.toLowerCase()}`)}
        <div class="stack">${nextV.map((v) => voucherCard(v, false)).join('')}</div>
        ${sectionHead('Badges')}
        <div class="badges">${E.BADGES.map((b) => `<div class="badge${S.badges.includes(b.id) ? ' on' : ''}"><span>${ic(S.badges.includes(b.id) ? 'trophy' : 'lock', 22)}</span><small>${b.name}</small></div>`).join('')}</div>
      </div><div class="spacer"></div>`;
    },

    profile() {
      const t = E.tierOf(S.lifetime);
      const pushOk = B.mode === 'server' && 'serviceWorker' in navigator && 'PushManager' in window && CONFIG.vapidPublicKey;
      return `<div class="pad top">
        <p class="eyebrow accent">Profile</p>
        <h1 class="serif-h">Bonjour, <em class="accent">${esc(U.first)}</em></h1>
        <div class="card profile-card mt16">
          <button class="avatar-btn" data-a="photo" aria-label="Change profile photo">${avatar(72)}<span class="cam">${ic('camera', 14, 2)}</span></button>
          <div class="grow"><b>${esc(U.first)} ${esc(U.last || '')}</b><small class="muted block">${t.name} · ${nf(S.lifetime)} lifetime miles</small>
            <small class="muted block">${esc(U.email)} · ${esc(U.phone)}</small></div>
          <button class="link" data-a="rename">Edit</button>
        </div>
        <input type="file" id="photoInput" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" hidden>
        <p class="privacy-note">${ic('shield', 16)} <span>Your photo is resized on your phone, its location data is removed, and it is stored encrypted. Only you can see it.</span></p>
        ${referralCard()}
        ${S.bookings.length ? `${sectionHead('My visits')}<div class="stack">${S.bookings.slice(0, 3).map((b) => `<div class="card">
          <b class="serif-t">${esc(b.service)}</b><small class="muted block">${esc(b.studio)} · ${new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${esc(b.slot)}</small>
          <small class="block">${eur(b.price)}${b.price < b.list ? ` <s class="muted">${eur(b.list)}</s>` : ''}</small></div>`).join('')}</div>` : ''}
        ${sectionHead('Settings')}
        <div class="card settings">
          ${pushOk ? `<div class="set-row"><span>${ic('bell', 18)} <span><b>Notifications</b><small class="muted block">Rewards, new seasons, referral news</small></span></span>
            <button class="switch${U.push ? ' on' : ''}" data-a="push" role="switch" aria-checked="${U.push ? 'true' : 'false'}" aria-label="Notifications"><i></i></button></div>` : ''}
          ${U.hasAvatar ? `<button class="set-row" data-a="photo-remove"><span>${ic('trash', 18)} <b>Remove my photo</b></span>${ic('chevron', 16)}</button>` : ''}
          <button class="set-row" data-a="logout"><span>${ic('logout', 18)} <b>Log out</b></span>${ic('chevron', 16)}</button>
        </div>
        ${sectionHead('Miles history')}
        <div class="card ledger">${S.ledger.slice(0, 25).map((l) => `<div class="led">
          <span><b>${esc(l.label)}</b><small class="muted block">${new Date(l.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span>
          <b class="${l.amt > 0 ? 'accent' : ''}">${l.amt > 0 ? '+' : ''}${nf(l.amt)}</b></div>`).join('')}</div>
        ${sectionHead('How Skin Miles work')}
        <div class="card how">
          <p><b>Daily check-in</b> +20 · bonus at 7, 14, 30, 100 and 365 days</p>
          <p><b>Wellness tip</b> +10 each, daily · <b>Rituals</b> +30 to +50</p>
          <p><b>Games</b> Glow Match, Skin Quiz & Glow Wheel, once a day</p>
          <p><b>Orders</b> 1 mile per €1 · <b>Face Glow Bar visits</b> +150</p>
          <p class="muted">Tiers multiply every non-purchase reward: Éclat ×1.1, Rayonnance ×1.25, Lumière ×1.5.</p>
        </div>
        <button class="btn-ghost wide mt16 danger" data-a="delete-account">Delete my account</button>
        ${B.mode === 'demo' ? '<p class="demo-note">Demo mode: your account lives on this device only.</p>' : ''}
      </div><div class="spacer"></div>`;
    },
  };

  /* ---------- Referral ---------- */
  const refRules = () => CONFIG.referral || E.DEFAULT_REFERRAL;
  function referralTeaser() {
    const r = refRules();
    return `<button class="ref-teaser" data-a="tab" data-arg="rewards">${ic('users', 20)}
      <span><b>Invite a friend, get up to ${r.cap}% off</b><small>${r.perFriend}% off your next treatment for each friend who books</small></span>${ic('chevron', 16)}</button>`;
  }
  function refBanner() {
    const parts = [];
    if (S.referral.welcome && !S.bookings.length) parts.push(`your −${S.referral.welcome}% welcome offer`);
    if (S.referral.discount) parts.push(`your −${S.referral.discount}% referral reward`);
    const text = parts.join(' and ');
    return parts.length ? `<p class="ref-banner">${ic('gift', 16)} <span>${text[0].toUpperCase() + text.slice(1)} will apply when you confirm.</span></p>` : '';
  }
  function referralCard() {
    const r = refRules();
    const steps = Array.from({ length: Math.ceil(r.cap / r.perFriend) }, (_, i) => (i + 1) * r.perFriend <= S.referral.discount);
    return `${sectionHead('Invite friends')}
      <section class="card referral">
        <p class="muted sm">Your friend gets <b>${r.welcome}% off</b> their first Face Glow Bar treatment. When they confirm their account and book, you get <b>${r.perFriend}% off</b> your next booking, up to <b>${r.cap}%</b>, plus 200 Skin Miles.</p>
        <div class="ref-code"><span class="code big">${esc(U.referralCode || S.referral.code)}</span>
          <button class="btn-ghost xs" data-a="copy-ref">${ic('copy', 14)} Copy</button><button class="btn-dark xs" data-a="share-ref">${ic('share', 14)} Share</button></div>
        <div class="ref-steps">${steps.map((on, i) => `<span class="${on ? 'on' : ''}">−${(i + 1) * r.perFriend}%</span>`).join('')}</div>
        <p class="sm"><b>${S.referral.friends}</b> ${S.referral.friends === 1 ? 'friend has' : 'friends have'} booked · ${S.referral.discount ? `current reward <b class="accent">−${S.referral.discount}%</b> on your next booking` : 'your reward starts with the first friend who books'}</p>
      </section>`;
  }
  const refLink = () => `${location.origin}${location.pathname}#ref-${U.referralCode || S.referral.code}`;
  const refText = () => `Join me on Seasonly and get ${refRules().welcome}% off your first Face Glow Bar treatment. My code: ${U.referralCode || S.referral.code}`;

  /* ---------- Streak ---------- */
  const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  const nextMilestone = () => Object.keys(E.MILESTONES).map(Number).find((m) => m > S.streak) || '∞';
  function weekRow(celebrate = false) {
    const now = new Date(), dow = (now.getDay() + 6) % 7, monday = E.addDays(now, -dow);
    return `<div class="weekrow${celebrate ? ' cel' : ''}">${DAYS_FR.map((d, i) => {
      const k = E.dkey(E.addDays(monday, i)), isToday = i === dow, on = S.checkins.includes(k);
      return `<div class="wd${isToday ? ' today' : ''}"><small>${d}</small><span class="${on ? 'on' : ''}">${on ? ic(isToday && celebrate ? 'gift' : 'check', isToday && celebrate ? 18 : 14, isToday && celebrate ? 1.8 : 2.6) : ''}</span></div>`;
    }).join('')}</div>`;
  }
  async function checkIn() {
    if (ui.busy) return;
    ui.busy = true;
    try {
      const out = await act('checkin', {}, { quiet: true });
      out.events.filter((e) => e.type !== 'miles').forEach(showEvent);
      celebrate(out.result.earned);
      rerender();
    } catch { /* toast shown */ } finally { ui.busy = false; }
  }
  // Streak screen in the app's own language: cream, serif numeral, terracotta ring.
  function celebrate(amt) {
    const msgs = { 1: 'A fresh start. Your skin loves consistency.', 7: 'One full week of rituals. Your glow is showing.', 30: 'A whole month of care. You are a model of perseverance.', 365: 'Une année entière de bien-être : vous êtes un modèle de persévérance !' };
    const msg = msgs[S.streak] || (S.streak % 7 === 0 ? `${S.streak / 7} weeks in a row. Magnifique.` : 'Every day counts. Come back tomorrow to keep your streak.');
    const target = Number(nextMilestone()) || S.streak;
    const prev = [...Object.keys(E.MILESTONES).map(Number)].reverse().find((m) => m <= S.streak) || 0;
    const pct = target > prev ? (S.streak - prev) / (target - prev) : 1;
    const r = 118, c = 2 * Math.PI * r;
    const petals = Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 6) * 0.15}s;background:${['#C4806C', '#E3B9A6', '#D9C3B0', '#0E0E10'][i % 4]}"></i>`).join('');
    openSheet(`<div class="celebrate">
      <div class="petals">${petals}</div>
      <div class="cel-top"><span class="logo sm">seasonly<small>PARIS</small></span></div>
      <div class="cel-mid">
        <div class="cel-ring">
          <svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="${r}" stroke="var(--ring-track)" stroke-width="3" fill="none"/>
            <circle class="cel-arc" cx="130" cy="130" r="${r}" stroke="var(--accent)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" style="--c:${c}" transform="rotate(-90 130 130)"/></svg>
          <div class="cel-num"><span>${S.streak}</span></div>
        </div>
        <p class="eyebrow accent">Day streak</p>
        <h2 class="serif-h cel-title"><em>jours de suite</em></h2>
        <span class="pill-accent big">+${nf(amt)} Skin Miles</span>
        <div class="card glass cel-card">${weekRow(true)}<p class="muted center">${msg}</p>
          <p class="sm center">${target > S.streak ? `Next bonus at <b>${target} days</b>` : 'You reached the top milestone'}</p></div>
      </div>
      <button class="btn-dark wide" data-a="close">Continuer</button>
    </div>`, 'full plain');
  }

  /* ---------- Vouchers ---------- */
  function voucherCard(v, active) {
    const afford = S.miles >= v.cost;
    return `<div class="voucher${active ? '' : ' locked'}">
      <div class="v-left"><span class="v-kind">${v.kind === 'service' ? 'Soin' : 'Produit'}</span>${ic(v.kind === 'service' ? 'calendar' : 'bag', 22)}</div>
      <div class="v-body"><b>${v.title}</b><small class="muted block">${v.note}</small><span class="v-cost">${ic('star', 13, 2)} ${nf(v.cost)} miles</span></div>
      ${active ? `<button class="btn-dark xs" data-a="redeem" data-arg="${v.id}" ${afford ? '' : 'disabled'}>${afford ? 'Redeem' : `${nf(v.cost - S.miles)} to go`}</button>` : `<span class="lock">${ic('lock', 16)}</span>`}
    </div>`;
  }
  function myVoucher(v) {
    return `<div class="voucher mine">
      <div class="v-left"><span class="v-kind">${v.kind === 'service' ? 'Soin' : 'Produit'}</span>${ic('ticket', 22)}</div>
      <div class="v-body"><b>${v.title}</b><small class="muted block">Use ${v.kind === 'service' ? 'when booking' : 'in your bag'} · until ${fmtDate(v.expires)}</small><span class="code">${v.code}</span></div>
      <button class="btn-ghost xs" data-a="${v.kind === 'service' ? 'use-service' : 'bag'}">Use</button></div>`;
  }
  function redeem(id) {
    const v = E.VOUCHERS.find((x) => x.id === id);
    if (!v || S.miles < v.cost) return;
    openSheet(`<div class="sheet-pad">
      <p class="eyebrow accent">Redeem voucher</p><h2 class="serif-h sm">${v.title}</h2>
      <p class="muted">${v.note}. Valid until ${fmtDate(E.seasonOf(today()).end)}.</p>
      <div class="card row between mt16"><span class="muted">Cost</span><b>${nf(v.cost)} miles</b></div>
      <div class="card row between mt8"><span class="muted">Balance after</span><b>${nf(S.miles - v.cost)} miles</b></div>
      <button class="btn-dark wide mt16" data-a="redeem-ok" data-arg="${v.id}">Confirm redemption</button>
      <button class="btn-ghost wide mt8" data-a="close">Not now</button></div>`);
  }
  async function redeemOk(id) {
    let out;
    try { out = await act('redeem', { id }); } catch { return closeSheet(); }
    const v = out.result.voucher;
    openSheet(`<div class="sheet-pad center">
      <div class="ticket-big">${ic('ticket', 40, 1.3)}</div>
      <p class="eyebrow accent mt16">Voucher unlocked</p><h2 class="serif-h sm">${v.title}</h2>
      <div class="code big">${v.code}</div>
      <p class="muted">Saved in Rewards → My vouchers. Use it ${v.kind === 'service' ? 'at the confirm step when you book a soin' : 'at checkout in your bag'}.</p>
      <button class="btn-dark wide mt16" data-a="${v.kind === 'service' ? 'use-service' : 'bag'}">${v.kind === 'service' ? 'Book a soin' : 'Open my bag'}</button>
      <button class="btn-ghost wide mt8" data-a="close">Done</button></div>`);
    rerender();
  }

  /* ---------- Bag ---------- */
  let bagVoucher = null;
  function addToBag(id) {
    const b = bag.get(), line = b.find((l) => l.id === id);
    if (line) line.qty += 1; else b.push({ id, qty: 1 });
    bag.set(b);
    toast('Added to bag', product(id).name, 'bag');
    rerender();
  }
  function bagView() {
    const lines = bag.get().map((l) => ({ ...l, p: product(l.id) })).filter((l) => l.p);
    const subtotal = Math.round(lines.reduce((a, l) => a + l.p.price * l.qty, 0) * 100) / 100;
    const usable = S.vouchers.filter((v) => !v.used && v.kind === 'product' && v.expires > Date.now());
    if (bagVoucher && !usable.find((v) => v.code === bagVoucher)) bagVoucher = null;
    const v = usable.find((x) => x.code === bagVoucher);
    const disc = v ? E.discount(v, subtotal) : 0;
    const total = Math.max(0, Math.round((subtotal - disc) * 100) / 100);
    return `<div class="sheet-pad">
      <div class="row between"><div><p class="eyebrow accent">Your bag</p><h2 class="serif-h sm">Le panier</h2></div>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
      ${lines.length ? `<div class="stack mt16">${lines.map((l) => `<div class="bag-line card">
          <span class="bag-thumb" style="background:${esc(l.p.bg)}">${productVisual(l.p)}</span>
          <span class="grow"><b>${esc(l.p.name)}</b><small class="muted block">${esc(l.p.size)} · ${eur(l.p.price)}</small></span>
          <span class="qty"><button data-a="qty" data-arg="${esc(l.id)}:-1" aria-label="Less">${ic('minus', 14, 2)}</button><b>${l.qty}</b><button data-a="qty" data-arg="${esc(l.id)}:1" aria-label="More">${ic('plus', 14, 2)}</button></span></div>`).join('')}</div>
        ${usable.length ? `<p class="eyebrow muted mt16">Skin Miles vouchers</p><div class="v-pick">${usable.map((x) => `<button class="v-opt${bagVoucher === x.code ? ' on' : ''}" data-a="bag-voucher" data-arg="${x.code}">${ic('ticket', 16)} ${x.title}</button>`).join('')}</div>`
          : `<button class="hint card mt16" data-a="go-rewards">${ic('gift', 18)} <span>Have miles? Redeem a seasonal voucher in Rewards →</span></button>`}
        <div class="card summary mt16">
          <div class="sum-row"><span class="muted">Subtotal</span><b>${eur(subtotal)}</b></div>
          ${disc ? `<div class="sum-row"><span class="muted">Voucher ${v.code}</span><b class="accent">−${eur(disc)}</b></div>` : ''}
          <div class="sum-row"><span class="muted">Delivery</span><b>${subtotal >= 69 ? 'Free' : 'Free from €69'}</b></div>
          <div class="sum-row big"><span>Total</span><b>${eur(total)}</b></div>
        </div>
        <button class="btn-dark wide mt16" data-a="checkout" ${ui.busy ? 'disabled' : ''}>Checkout · earn ${nf(Math.floor(total))} miles</button>`
      : `<div class="empty-bag"><span>${ic('bag', 36, 1.2)}</span><p class="serif-t">Your bag is empty</p><p class="muted sm">Every €1 you spend earns 1 Skin Mile.</p>
         <button class="btn-dark mt16" data-a="go-shop">Visit the boutique</button></div>`}
    </div>`;
  }
  async function checkout() {
    const lines = bag.get();
    if (!lines.length || ui.busy) return;
    ui.busy = true; refreshSheet();
    let out;
    try { out = await act('checkout', { lines, voucher: bagVoucher }); } catch { ui.busy = false; refreshSheet(); return; }
    ui.busy = false;
    bag.set([]); bagVoucher = null;
    const o = out.result.order;
    openSheet(`<div class="sheet-pad center">
      <div class="ticket-big">${ic('check', 40, 1.6)}</div>
      <p class="eyebrow accent mt16">Merci !</p><h2 class="serif-h sm">Order confirmed</h2>
      <p class="muted">Order ${o.id} · ${eur(o.total)}${o.discount ? ` · you saved ${eur(o.discount)}` : ''}. You earned <b>${nf(Math.floor(o.total))} Skin Miles</b>.</p>
      <button class="btn-dark wide mt16" data-a="close">Continue</button></div>`);
    rerender();
  }

  /* ---------- Product detail ---------- */
  function productView(id) {
    const p = product(id);
    if (!p) return '<div class="sheet-pad">This product is no longer available.</div>';
    const fav = S.favs.includes(id);
    return `<div class="pdp">
      <div class="pdp-hero" style="background:${esc(p.bg)}">
        <div class="row between pdp-bar"><button class="icon-glass light" data-a="close" aria-label="Back">${ic('back', 18)}</button>
          <div class="row g8"><button class="icon-glass light" data-a="share" aria-label="Share">${ic('share', 18)}</button>
          <button class="icon-glass light${fav ? ' fav' : ''}" data-a="fav" data-arg="${esc(p.id)}" aria-label="Favourite">${ic('heart', 18)}</button></div></div>
        <div class="row g6 pdp-badges">${p.badge ? `<span class="pill-dark">★ ${esc(p.badge)}</span>` : ''}<span class="pill-light">Clean & vegan</span></div>
        ${productVisual(p, true)}
        ${p.size ? `<span class="size-pill">${esc(p.size)}</span>` : ''}
      </div>
      <div class="pdp-body">
        <p class="eyebrow accent">${esc(p.cat)}${p.tags && p.tags[0] ? ` · ${esc(p.tags[0])}` : ''}</p>
        <h1 class="serif-h">${esc(p.name)}<br><em>${esc(p.sub)}</em></h1>
        <p class="muted">${esc(p.desc)}</p>
        ${p.stats && p.stats.length ? `<div class="pstats card">${p.stats.map(([v, l]) => `<span><b class="serif-t">${esc(v)}</b><small class="muted">${esc(l)}</small></span>`).join('')}</div>` : ''}
        <div class="earn-note">${ic('star', 16)} Earn <b>${Math.floor(p.price)} Skin Miles</b> with this purchase</div>
      </div>
      <div class="buybar glass">
        <div><b class="serif-t">${eur(p.price)}</b>${p.compareAt ? ` <s class="muted">${eur(p.compareAt)}</s>` : ''}<small class="muted block">${esc((p.size || '').toUpperCase())}</small></div>
        <button class="btn-dark" data-a="add-close" data-arg="${esc(p.id)}">Add — bag</button>
      </div></div>`;
  }

  /* ---------- Rituals ---------- */
  let ritualTimer = null;
  function ritualsList() {
    return `<div class="sheet-pad">
      <div class="row between"><div><p class="eyebrow accent">Rituals</p><h2 class="serif-h sm">Guided <em class="accent">care</em></h2></div>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
      <div class="stack mt16">${E.RITUALS.map((r) => `<button class="card ritual-card" data-a="ritual" data-arg="${r.id}">
        ${ring(E.ritualProgress(S, r.id, today()), r.steps.length, 54)}
        <span class="grow"><span class="eyebrow accent block">${r.eyebrow}</span><span class="serif-t block">${r.name}</span>
        <small class="muted">${r.steps.length} steps · ${r.mins} min · ${doneToday('ritual-' + r.id) ? 'earned today' : `+${r.miles} miles`}</small></span>
        <span class="round-dark">${ic('play', 12)}</span></button>`).join('')}</div></div>`;
  }
  function ritualView(id) {
    const r = E.RITUALS.find((x) => x.id === id);
    const step = E.ritualProgress(S, id, today());
    if (step >= r.steps.length) {
      return `<div class="sheet-pad center">
        <div class="ticket-big">${ic('sparkle', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">Ritual complete</p><h2 class="serif-h sm">${r.name}</h2>
        <p class="muted">Beautiful work. See you for the next one.</p>
        <button class="btn-dark wide mt16" data-a="close">Continuer</button>
        <button class="btn-ghost wide mt8" data-a="ritual-restart" data-arg="${id}">Do it again</button></div>`;
    }
    const [title, how, secs] = r.steps[step];
    return `<div class="sheet-pad ritual-play">
      <div class="row between"><button class="icon-btn" data-a="rituals" aria-label="Back">${ic('back', 18)}</button>
        <span class="muted sm">${doneToday('ritual-' + id) ? 'Practice mode' : `+${r.miles} miles on completion`}</span>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
      <p class="eyebrow accent mt16">${r.eyebrow} · Step ${step + 1} of ${r.steps.length}</p>
      <h2 class="serif-h">${title}</h2>
      <div class="timer-wrap">${ring(0, 1, 200)}<span class="timer" id="timer" data-total="${secs}">${fmtSecs(secs)}</span></div>
      <p class="how">${how}</p>
      <div class="dots">${r.steps.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="row g8 mt16"><button class="btn-ghost grow" data-a="timer" id="timerBtn">Start timer</button>
      <button class="btn-dark grow" data-a="ritual-next" data-arg="${id}">${step + 1 === r.steps.length ? 'Finish' : 'Next step'}</button></div></div>`;
  }
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  function startTimer() {
    const el = $('#timer'); if (!el) return;
    clearInterval(ritualTimer);
    const total = +el.dataset.total; let left = total;
    const circle = $('.timer-wrap circle:last-child'); const c = parseFloat(circle.getAttribute('stroke-dasharray'));
    $('#timerBtn').textContent = 'Running…';
    circle.setAttribute('stroke-dashoffset', c);
    ritualTimer = setInterval(() => {
      left -= 1;
      const t = $('#timer'); if (!t) return clearInterval(ritualTimer);
      t.textContent = fmtSecs(Math.max(left, 0));
      circle.setAttribute('stroke-dashoffset', c * (left / total));
      if (left <= 0) { clearInterval(ritualTimer); $('#timerBtn').textContent = 'Time ✓'; if (navigator.vibrate) navigator.vibrate(120); }
    }, 1000);
  }

  /* ---------- Games ---------- */
  let G = {};
  const gameHead = (title, sub) => `<div class="game-head"><div class="row between"><div><p class="eyebrow accent">Play & earn</p><h2 class="serif-h sm">${title}</h2></div>
    <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>${sub ? `<p class="muted sm">${sub}</p>` : ''}</div>`;
  const MATCH_TILES = [['🍊', 'Vitamin C'], ['🌺', 'Hibiscus'], ['💧', 'Hyaluronic'], ['🌿', 'Calendula'], ['🫒', 'Squalane'], ['🍯', 'Propolis']];
  function newMatch() {
    const deck = [...MATCH_TILES, ...MATCH_TILES].map((t, i) => ({ k: t[0], name: t[1], id: i }));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    G = { type: 'match', deck, open: [], matched: [], moves: 0, lock: false, over: false };
  }
  function matchView() {
    if (G.type !== 'match') newMatch();
    const played = doneToday('match') && !G.over;
    const reward = Math.max(20, 80 - Math.max(0, G.moves - 6) * 5);
    return `<div class="sheet-pad">${gameHead('Glow Match', played ? 'Practice round. Miles already earned today.' : 'Pair the six actives. 6 moves = 80 miles, each extra move −5 (min 20).')}
      <div class="row between mt12"><span class="pill-light">Moves · ${G.moves}</span><span class="pill-accent">${played ? 'Practice' : `+${reward} if you finish now`}</span></div>
      <div class="match">${G.deck.map((c, i) => {
        const up = G.open.includes(i) || G.matched.includes(c.k);
        return `<button class="mcard${up ? ' up' : ''}${G.matched.includes(c.k) ? ' ok' : ''}" data-a="flip" data-arg="${i}" aria-label="${up ? c.name : 'Hidden card'}">
          <span class="back">s</span><span class="front"><em>${c.k}</em><small>${c.name}</small></span></button>`;
      }).join('')}</div>
      ${G.over ? `<div class="card center mt12"><p class="serif-t">Matched in ${G.moves} moves</p><p class="muted sm">${G.earned ? `+${G.earned} miles earned` : 'Practice round complete'}</p>
        <button class="btn-dark wide mt12" data-a="match-again">Play again</button></div>` : ''}</div>`;
  }
  async function flip(i) {
    i = +i;
    if (G.lock || G.over || G.open.includes(i) || G.matched.includes(G.deck[i].k)) return;
    G.open.push(i);
    if (G.open.length === 2) {
      G.moves++;
      const [a, b] = G.open;
      if (G.deck[a].k === G.deck[b].k) { G.matched.push(G.deck[a].k); G.open = []; }
      else { G.lock = true; setTimeout(() => { G.open = []; G.lock = false; refreshSheet(); }, 750); }
      if (G.matched.length === MATCH_TILES.length) {
        G.over = true;
        try { const out = await act('match', { moves: G.moves }); G.earned = out.result.earned; } catch { /* toast shown */ }
        rerender();
      }
    }
    refreshSheet();
  }
  function newQuiz() {
    const idx = E.QUIZ.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 5);
    G = { type: 'quiz', idx, i: 0, picks: [], picked: null, over: false };
  }
  function quizView() {
    if (G.type !== 'quiz') newQuiz();
    if (G.over) {
      return `<div class="sheet-pad center">${gameHead('Skin Quiz', '')}
        <div class="score-num">${G.score}<small>/5</small></div>
        <p class="serif-t">${G.score >= 4 ? 'Expert de la peau !' : G.score >= 2 ? 'Bien joué' : 'Keep learning'}</p>
        <p class="muted">${G.earned ? `+${G.earned} miles earned` : 'Practice round. Come back tomorrow for miles.'}</p>
        <button class="btn-dark wide mt16" data-a="quiz-again">New questions</button></div>`;
    }
    const [q, opts, ans] = E.QUIZ[G.idx[G.i]];
    return `<div class="sheet-pad">${gameHead('Skin Quiz', doneToday('quiz') ? 'Practice round. Miles already earned today.' : '+10 miles per correct answer.')}
      <div class="dots mt12">${G.idx.map((_, i) => `<i class="${i < G.i ? 'done' : i === G.i ? 'on' : ''}"></i>`).join('')}</div>
      <h3 class="serif-t q">${q}</h3>
      <div class="stack">${opts.map((o, i) => {
        let cls = '';
        if (G.picked !== null) cls = i === ans ? ' right' : i === G.picked ? ' wrong' : ' dim';
        return `<button class="answer card${cls}" data-a="answer" data-arg="${i}" ${G.picked !== null ? 'disabled' : ''}>${o}</button>`;
      }).join('')}</div>
      ${G.picked !== null ? `<button class="btn-dark wide mt16" data-a="quiz-next">${G.i === 4 ? 'See my score' : 'Next question'}</button>` : ''}</div>`;
  }
  async function quizNext() {
    G.picks.push({ q: G.idx[G.i], a: G.picked });
    if (G.i < 4) { G.i++; G.picked = null; return refreshSheet(); }
    try { const out = await act('quiz', { answers: G.picks }); G.score = out.result.score; G.earned = out.result.earned; }
    catch { G.score = G.picks.filter((p) => E.QUIZ[p.q][2] === p.a).length; }
    G.over = true;
    rerender(); refreshSheet();
  }
  function wheelView() {
    const played = doneToday('wheel') && !G.spinning;
    const n = E.WHEEL.length, seg = 360 / n;
    const colors = ['#F3E3DA', '#E9C8B3', '#F6EDE6', '#C4806C', '#EFD9CB', '#0E0E10', '#F3E3DA', '#DDB096'];
    const slices = E.WHEEL.map((v, i) => {
      const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180;
      const dark = ['#C4806C', '#0E0E10'].includes(colors[i]);
      return `<path d="M100 100 L${100 + 96 * Math.cos(a0)} ${100 + 96 * Math.sin(a0)} A96 96 0 0 1 ${100 + 96 * Math.cos(a1)} ${100 + 96 * Math.sin(a1)}Z" fill="${colors[i]}" stroke="#fff" stroke-width="1.5"/>
        <text x="100" y="30" transform="rotate(${(i + 0.5) * seg} 100 100)" text-anchor="middle" font-family="Inter" font-weight="700" font-size="14" fill="${dark ? '#fff' : '#0E0E10'}">${v}</text>`;
    }).join('');
    return `<div class="sheet-pad center">${gameHead('Glow Wheel', played ? `Today's spin is done${S.wheelWin ? `: you won ${S.wheelWin} miles` : ''}. A new spin unlocks tomorrow.` : 'One free spin every day. Every slice is a win.')}
      <div class="wheel-wrap"><span class="pointer"></span>
        <svg id="wheel" class="wheel" viewBox="0 0 200 200" style="transform:rotate(${G.rot || 0}deg)">${slices}<circle cx="100" cy="100" r="16" fill="#fff"/><text x="100" y="104" text-anchor="middle" font-family="Cormorant Garamond" font-size="12" fill="#0E0E10">s</text></svg></div>
      <button class="btn-dark wide" data-a="spin" ${played || G.spinning ? 'disabled' : ''}>${played ? 'Come back tomorrow' : G.spinning ? 'Spinning…' : 'Spin the wheel'}</button></div>`;
  }
  async function spin() {
    if (doneToday('wheel') || G.spinning) return;
    G = { type: 'wheel', spinning: true, rot: 0 };
    refreshSheet();
    let out;
    try { out = await act('wheel', {}, { quiet: true }); } catch { G.spinning = false; return refreshSheet(); }
    const seg = 360 / E.WHEEL.length;
    G.rot = 360 * 6 + (360 - (out.result.idx + 0.5) * seg);
    const w = $('#wheel'); if (w) { void w.getBoundingClientRect(); w.style.transform = `rotate(${G.rot}deg)`; }
    setTimeout(() => { G.spinning = false; out.events.forEach(showEvent); rerender(); refreshSheet(); }, 4200);
  }

  /* ---------- Profile photo ---------- */
  // Resize and re-encode on the device: this drops EXIF data (GPS, device) before anything is sent.
  async function preparePhoto(file) {
    if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Choose a photo (JPEG or PNG).');
    if (file.size > 20 * 1024 * 1024) throw new Error('This photo is too large. Choose one under 20 MB.');
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch {
      src = await new Promise((ok, ko) => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => ko(new Error('This photo format is not supported. Try a JPEG.')); img.src = URL.createObjectURL(file); });
    }
    const size = 640, w = src.width, h = src.height, side = Math.min(w, h);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    canvas.getContext('2d').drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('This photo could not be processed.'))), 'image/jpeg', 0.86));
  }
  async function uploadPhoto(file) {
    try {
      toast('Uploading your photo…', '', 'bag');
      const blob = await preparePhoto(file);
      const out = await B.uploadAvatar(blob);
      setUser({ ...out.user, state: S });
      toast('Photo updated', 'Only you can see it', 'tier');
      rerender();
    } catch (e) { toast(e.message, '', 'error'); }
  }

  /* ---------- Push notifications ---------- */
  async function togglePush() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      if (U.push && existing) {
        await B.pushUnsubscribe(existing.endpoint); await existing.unsubscribe();
        U.push = false; toast('Notifications off', '', 'bag');
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') throw new Error('Allow notifications for Seasonly in your browser settings.');
        const key = Uint8Array.from(atob(CONFIG.vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - CONFIG.vapidPublicKey.length % 4) % 4)), (c) => c.charCodeAt(0));
        const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        await B.pushSubscribe(sub.toJSON());
        U.push = true; toast('Notifications on', 'We will tell you about rewards and new seasons', 'tier');
      }
      rerender();
    } catch (e) { toast(e.message || 'Notifications are not available here.', '', 'error'); }
  }

  /* ---------- Sheet & toast ---------- */
  let sheetRender = null;
  function openSheet(html, mode = '') {
    sheetRender = typeof html === 'function' ? html : null;
    sheet.className = `sheet open ${mode}`;
    sheet.setAttribute('aria-hidden', 'false');
    sheet.innerHTML = `<div class="sheet-scrim" data-a="close"></div><div class="sheet-card" role="dialog" aria-modal="true">${sheetRender ? sheetRender() : html}</div>`;
  }
  function refreshSheet() {
    if (!sheetRender) return;
    const card = sheet.querySelector('.sheet-card'); if (!card) return;
    const st = card.scrollTop; card.innerHTML = sheetRender(); card.scrollTop = st;
  }
  function closeSheet() {
    clearInterval(ritualTimer);
    sheet.className = 'sheet'; sheet.setAttribute('aria-hidden', 'true');
    sheetRender = null;
    setTimeout(() => { if (!sheet.classList.contains('open')) sheet.innerHTML = ''; }, 300);
    if (U) rerender();
  }
  const toastQueue = []; let toastBusy = false;
  function toast(title, sub = '', kind = 'miles') { toastQueue.push([title, sub, kind]); if (!toastBusy) nextToast(); }
  function nextToast() {
    const item = toastQueue.shift();
    if (!item) { toastBusy = false; return; }
    toastBusy = true;
    const [title, sub, kind] = item;
    const el = document.createElement('div');
    el.className = `toast t-${kind}`;
    el.innerHTML = `<span class="t-ic">${ic({ bag: 'bag', badge: 'trophy', tier: 'sparkle', error: 'close' }[kind] || 'star', 16, 2)}</span><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    toastWrap.appendChild(el);
    const hold = toastQueue.length ? 1500 : kind === 'error' ? 3200 : 2300;
    setTimeout(() => el.classList.add('out'), hold);
    setTimeout(() => { el.remove(); nextToast(); }, hold + 350);
  }

  /* ---------- Actions ---------- */
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied', text.length > 40 ? 'Paste it in a message to your friend' : text, 'bag'); }
    catch { openSheet(`<div class="sheet-pad"><p class="eyebrow accent">Copy your code</p><p class="muted">Select the text below and copy it.</p><textarea class="copy-box" readonly>${esc(text)}</textarea><button class="btn-dark wide mt16" data-a="close">Done</button></div>`); setTimeout(() => { const t = $('.copy-box'); if (t) t.select(); }, 350); }
  }
  const A = {
    tab(arg) { if (sheet.classList.contains('open')) closeSheet(); ui.tab = arg; render(); app.scrollTop = 0; },
    auth(arg) { ui.auth = arg; ui.error = ''; render(); app.scrollTop = 0; },
    async resend(arg) {
      try {
        const out = await B.resend(ui.pending.pending, arg || undefined);
        ui.pending = { ...ui.pending, ...out, at: Date.now() };
        ui.error = ''; render(); startResendTimer();
        toast('New code sent', '', 'bag');
      } catch (e) { ui.error = e.message; render(); }
    },
    bag() { openSheet(bagView); },
    'go-shop'() { closeSheet(); A.tab('shop'); },
    'go-rewards'() { closeSheet(); A.tab('rewards'); },
    'use-service'() { closeSheet(); ui.step = 1; A.tab('book'); },
    close: closeSheet,
    cat(arg) { ui.cat = arg; rerender(); },
    'focus-search'() { const s = $('#search'); if (s) s.focus(); },
    product(arg) { openSheet(() => productView(arg), 'full'); },
    add(arg) { addToBag(arg); },
    'add-close'(arg) { closeSheet(); addToBag(arg); },
    async fav(arg) { await act('fav', { id: arg }, { quiet: true }).catch(() => {}); refreshSheet(); },
    share() { const fb = () => toast('Sharing is not available here', '', 'bag'); if (navigator.share) navigator.share({ title: 'Seasonly Paris', url: location.href }).catch(fb); else fb(); },
    qty(arg) {
      const [id, d] = arg.split(':'); const b = bag.get(); const l = b.find((x) => x.id === id); if (!l) return;
      l.qty += +d; bag.set(l.qty <= 0 ? b.filter((x) => x.id !== id) : b);
      refreshSheet(); rerender();
    },
    'bag-voucher'(arg) { bagVoucher = bagVoucher === arg ? null : arg; refreshSheet(); },
    checkout,
    tip(arg) {
      const t = E.TIPS.find((x) => x.id === arg), done = doneToday('tip-' + t.id);
      openSheet(`<div class="sheet-pad"><div class="row between"><p class="eyebrow accent">Daily wellness tip</p>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
        <h2 class="serif-h">${t.title}</h2><p class="muted">${t.lead}</p>
        <ol class="tip-list">${t.body.map((b) => `<li>${b}</li>`).join('')}</ol>
        <button class="btn-dark wide mt16" data-a="tip-done" data-arg="${t.id}" ${done ? 'disabled' : ''}>${done ? 'Already earned today' : 'I read it · +10 miles'}</button></div>`);
    },
    async 'tip-done'(arg) { await act('tip', { id: arg }).catch(() => {}); closeSheet(); },
    checkin: checkIn,
    rituals() { clearInterval(ritualTimer); openSheet(ritualsList); },
    ritual(arg) { clearInterval(ritualTimer); openSheet(() => ritualView(arg)); },
    async 'ritual-next'(arg, el) { clearInterval(ritualTimer); el.disabled = true; await act('ritualStep', { id: arg }).catch(() => {}); refreshSheet(); rerender(); },
    async 'ritual-restart'(arg) { await act('ritualRestart', { id: arg }, { quiet: true }).catch(() => {}); A.ritual(arg); },
    timer: startTimer,
    game(arg) { G = {}; openSheet(() => (arg === 'match' ? matchView() : arg === 'quiz' ? quizView() : wheelView())); },
    flip,
    'match-again'() { newMatch(); refreshSheet(); },
    answer(i) { if (G.picked !== null) return; G.picked = +i; refreshSheet(); },
    'quiz-next': quizNext,
    'quiz-again'() { newQuiz(); refreshSheet(); },
    spin,
    redeem,
    'redeem-ok': redeemOk,
    async claim(arg) { await act('claim', { key: arg }).catch(() => {}); rerender(); },
    step(arg) { ui.step = +arg; rerender(); app.scrollTop = 0; },
    'pick-studio'(arg) { ui.bk.studio = arg; A.step(2); },
    'pick-service'(arg) { ui.bk.service = arg; A.step(3); },
    'pick-day'(arg) { ui.bk.day = +arg; ui.bk.slot = null; rerender(); },
    'pick-slot'(arg) { ui.bk.slot = arg; rerender(); },
    'bk-voucher'(arg) { ui.bk.voucher = ui.bk.voucher === arg ? null : arg; rerender(); },
    async 'confirm-booking'() {
      if (ui.busy) return;
      ui.busy = true; rerender();
      let out;
      try { out = await act('book', { studio: ui.bk.studio, service: ui.bk.service, day: ui.bk.day, slot: ui.bk.slot, voucher: ui.bk.voucher }); }
      catch { ui.busy = false; rerender(); return; }
      ui.busy = false;
      const bk = out.result.booking;
      ui.step = 1; ui.bk = { studio: null, service: null, day: 1, slot: null, voucher: null };
      openSheet(`<div class="sheet-pad center"><div class="ticket-big">${ic('calendar', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">À bientôt</p><h2 class="serif-h sm">${esc(bk.service)}</h2>
        <p class="muted">${esc(bk.studio)}<br>${new Date(bk.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(bk.slot)}</p>
        <p class="serif-t mt8">${eur(bk.price)}${bk.price < bk.list ? ` <s class="muted">${eur(bk.list)}</s>` : ''}</p>
        ${bk.lines.map((l) => `<p class="accent sm">${esc(l.label)}</p>`).join('')}
        <button class="btn-dark wide mt16" data-a="close">Done</button></div>`);
    },
    rename() {
      openSheet(`<div class="sheet-pad"><p class="eyebrow accent">Profile</p><h2 class="serif-h sm">Your name</h2>
        <form class="stack" data-form="rename">${field('nameFirst', 'First name', 'maxlength="40" autocomplete="given-name" required', U.first)}${field('nameLast', 'Last name', 'maxlength="40" autocomplete="family-name"', U.last)}
        <button class="btn-dark wide" type="submit">Save</button></form>
        <button class="btn-ghost wide mt8" data-a="close">Cancel</button></div>`);
    },
    photo() { const i = $('#photoInput'); if (i) { i.value = ''; i.click(); } },
    async 'photo-remove'() { try { const out = await B.deleteAvatar(); setUser({ ...out.user, state: S }); avatarSrc = null; toast('Photo removed', '', 'bag'); rerender(); } catch (e) { toast(e.message, '', 'error'); } },
    push: togglePush,
    'copy-ref'() { copyText(U.referralCode || S.referral.code); },
    'share-ref'() { if (navigator.share) navigator.share({ title: 'Seasonly', text: refText(), url: refLink() }).catch(() => copyText(`${refText()} ${refLink()}`)); else copyText(`${refText()} ${refLink()}`); },
    logout() {
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">Log out</p><h2 class="serif-h sm">See you soon, ${esc(U.first)}</h2>
        <p class="muted">Your miles, vouchers and streak stay safe in your account.</p>
        <button class="btn-dark wide mt16" data-a="logout-ok">Log out</button><button class="btn-ghost wide mt8" data-a="close">Stay signed in</button></div>`);
    },
    async 'logout-ok'() {
      try { await B.logout(); } catch { /* the session ends locally anyway */ }
      closeSheet(); setUser(null); ui.tab = 'home'; ui.auth = 'welcome'; ui.form = {}; bag.set([]); render();
      toast('You are logged out', '', 'bag');
    },
    'delete-account'() {
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">Delete account</p><h2 class="serif-h sm">Delete everything?</h2>
        <p class="muted">This permanently deletes your account, photo, miles, vouchers and history. It cannot be undone.</p>
        <button class="btn-dark wide mt16 danger-fill" data-a="delete-ok">Delete my account</button><button class="btn-ghost wide mt8" data-a="close">Keep my account</button></div>`);
    },
    async 'delete-ok'() {
      try { await B.deleteAccount(); } catch (e) { return toast(e.message, '', 'error'); }
      closeSheet(); setUser(null); ui.auth = 'welcome'; render(); toast('Your account was deleted', '', 'bag');
    },
  };

  /* ---------- Forms ---------- */
  const FORMS = {
    async signup(f) {
      const d = { first: f.first.value, last: f.last.value, email: f.email.value, phone: f.phone.value, referral: f.referral.value.trim(), channel: f.channel.value, consent: f.consent.checked };
      ui.form = d;
      const out = await B.signup(d);
      ui.pending = { ...out, purpose: 'signup', at: Date.now() };
      ui.auth = 'verify';
    },
    async login(f) {
      ui.form = { identifier: f.identifier.value };
      const out = await B.login(f.identifier.value);
      ui.pending = { ...out, purpose: 'login', at: Date.now() };
      ui.auth = 'verify';
    },
    async verify(f) {
      const out = await B.verify(ui.pending.pending, f.code.value);
      setUser(out.user);
      ui.pending = null; ui.form = {}; ui.tab = 'home';
      if (out.isNew) setTimeout(() => toast(`Bienvenue ${out.user.first}`, '+300 Skin Miles welcome gift', 'tier'), 300);
      history.replaceState(null, '', location.pathname);
    },
    async rename(f) {
      await act('profile', { first: f.nameFirst.value, last: f.nameLast.value }, { quiet: true });
      U.first = S.profile.first; U.last = S.profile.last;
      closeSheet();
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el.dataset.arg, el); }
  });
  document.addEventListener('submit', async (e) => {
    const name = e.target.dataset.form;
    if (!name) return;
    e.preventDefault();
    if (ui.busy) return;
    ui.busy = true; ui.error = '';
    const authForm = name !== 'rename';
    if (authForm) render();
    try { await FORMS[name](e.target.closest('form') || e.target); }
    catch (err) { ui.error = err.message; if (!authForm) toast(err.message, '', 'error'); }
    ui.busy = false;
    if (authForm) { render(); if (ui.auth === 'verify' && !U) { startResendTimer(); const c = $('#code'); if (c) c.focus(); } }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'photoInput' && e.target.files[0]) uploadPhoto(e.target.files[0]);
    if (e.target.name === 'channel') { ui.form.channel = e.target.value; document.querySelectorAll('.seg label').forEach((l) => l.classList.toggle('on', l.contains(e.target))); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'code' && e.target.value.replace(/\D/g, '').length === 6) e.target.form.requestSubmit();
    if (e.target.id !== 'search') return;
    ui.q = e.target.value;
    const pos = e.target.selectionStart;
    if (ui.q && ui.cat !== 'All') ui.cat = 'All';
    rerender();
    const s = $('#search'); s.focus(); s.setSelectionRange(pos, pos);
  });
  // Deter saving personal photos: no context menu or drag on protected elements.
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('.protected')) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target.closest('.protected')) e.preventDefault(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet(); });

  /* ---------- Boot ---------- */
  async function detectServer() {
    if (location.protocol === 'file:') return false;
    try {
      const res = await fetch('/api/health', { cache: 'no-store', headers: { 'X-Seasonly': '1' } });
      if (!res.ok) return false;
      return (await res.json()).mode === 'server';
    } catch { return false; }
  }
  (async function boot() {
    const ref = (location.hash.match(/^#ref-([A-Za-z0-9]{4,12})$/) || [])[1];
    if (ref) { ui.form.referral = ref.toUpperCase(); ui.auth = 'signup'; }
    if (location.hash === '#book') ui.tab = 'book';
    B = (await detectServer()) ? serverBackend() : demoBackend();
    try {
      const init = await B.init();
      CONFIG = init.config; PRODUCTS = init.products; setUser(init.user);
    } catch (e) {
      B = demoBackend();
      const init = await B.init();
      CONFIG = init.config; PRODUCTS = init.products; setUser(init.user);
    }
    if (U && ref) ui.auth = 'welcome';
    render();
    if (B.mode === 'server' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  })();
})();
