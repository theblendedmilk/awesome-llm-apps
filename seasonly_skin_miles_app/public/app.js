/* Seasonly · Skin Miles — vanilla JS single-page app, in French and English.
   Runs against the Node backend when it is served by it (accounts, codes by SMS/email, push, rewards
   computed server-side), and falls back to an offline demo mode that keeps everything on this device. */
(() => {
  'use strict';
  const E = window.SkinMiles;
  const C = window.SeasonlyCatalog;
  const I = window.SeasonlyI18n;

  /* ---------- Language ---------- */
  // Every visible string goes through t() (interface) or tx() (text coming from the engine or server).
  // English is the key; French comes from i18n.js. Nothing is ever shown half in one language.
  const LANG_KEY = 'seasonly.lang';
  let LANG = (() => {
    try { const v = localStorage.getItem(LANG_KEY); if (v === 'fr' || v === 'en') return v; } catch { /* storage blocked */ }
    return /^fr\b/i.test(navigator.language || '') ? 'fr' : (navigator.language ? 'en' : 'fr');
  })();
  const missing = (window.__i18nMissing = window.__i18nMissing || new Set());
  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)) : s);
  function t(key, vars) {
    if (LANG === 'en') return fill(key, vars);
    const fr = I.FR[key];
    if (fr === undefined) { missing.add(key); return fill(key, vars); }
    return fill(typeof fr === 'function' ? fr(gender()) : fr, vars);
  }
  // Plural: tn('{n} friend', '{n} friends', n)
  const tn = (one, many, n, vars) => t(n === 1 ? one : many, { n, ...vars });
  const tx = (text) => (LANG === 'en' || !text ? text : I.translate(String(text), gender()));
  const gender = () => (S && S.profile && S.profile.gender) || (ui && ui.form && ui.form.gender) || 'undisclosed';
  const loc = () => (LANG === 'fr' ? 'fr-FR' : 'en-GB');
  // Catalogue content (rituals, tips, quiz, vouchers…) in the current language.
  const cx = (kind, id, field, fallback) => (LANG === 'fr' && I.CONTENT[kind] && I.CONTENT[kind][id] && I.CONTENT[kind][id][field] !== undefined ? I.CONTENT[kind][id][field] : fallback);
  const pick = (obj) => (obj ? obj[LANG] || obj.fr || obj.en : null);
  function setLang(l) {
    LANG = l === 'en' ? 'en' : 'fr';
    try { localStorage.setItem(LANG_KEY, LANG); } catch { /* storage blocked */ }
    document.documentElement.lang = LANG;
    paintStatic();
  }
  function paintStatic() {
    document.documentElement.lang = LANG;
    document.title = t('Seasonly · Skin Miles');
    const sub = document.querySelector('.stage-title p'); if (sub) sub.textContent = t('Skin Miles — liquid glass edition');
    const nav = document.getElementById('tabbar'); if (nav) nav.setAttribute('aria-label', t('Main'));
  }

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
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
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
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M9 10h.01M15 10h.01M9.5 14.5c1.4 1.2 3.6 1.2 5 0"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6 6 0 0 1 3 5.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.4.4-2.8 1.9-2.8h1.6a3.5 3.5 0 0 0 3.5-3.5c0-4.7-3.8-8.5-8.5-8.5Z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>',
    feather: '<path d="M20 4c-7 0-12 4.5-12 11v5"/><path d="M8 15c4 0 8-2.5 9.5-7M5 20l5-5"/>',
    mountain: '<path d="m3 19 6.5-11 4 6.5 2-3L21 19H3Z"/>',
  };
  const ic = (n, s = 20, sw = 1.6) =>
    `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  // The contest icon: a prize box whose lid hops, with twinkling sparkles (still when motion is reduced).
  const prizeIcon = (size = 46) => `<svg class="prize-ic" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
    <g class="pz-spark"><path d="M8 9c.4 2.4 1.3 3.3 3.7 3.7-2.4.4-3.3 1.3-3.7 3.7-.4-2.4-1.3-3.3-3.7-3.7C6.7 12.3 7.6 11.4 8 9Z"/><path d="M40 4c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8C39 6.5 39.7 5.8 40 4Z"/><circle cx="42" cy="22" r="1.4"/></g>
    <rect class="pz-box" x="11" y="24" width="26" height="18" rx="3"/><rect class="pz-ribbon" x="22" y="24" width="4" height="18"/>
    <g class="pz-lid"><rect x="8.5" y="17" width="31" height="8" rx="2.5"/><rect class="pz-ribbon" x="22" y="17" width="4" height="8"/>
    <path class="pz-bow" d="M24 17s-3-6-6.5-5.2C15 12.4 16.5 17 24 17Zm0 0s3-6 6.5-5.2C33 12.4 31.5 17 24 17Z"/></g></svg>`;

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

  /* ---------- Utils ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const nf = (n) => Math.round(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-GB').replace(/ | /g, ' ');
  const eur = (n) => {
    const v = Number.isInteger(n) ? String(n) : Number(n).toFixed(2);
    return LANG === 'fr' ? `${v.replace('.', ',')} €` : `€${v}`;
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => new Date(d).toLocaleDateString(loc(), { day: 'numeric', month: 'short' });
  const longDate = (d) => new Date(d).toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long' });
  const slotTxt = (s) => (LANG === 'fr' ? s.replace(':', 'h') : s);
  const pad = (n) => String(n).padStart(2, '0');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  // Localised catalogue fields.
  const pSub = (p) => (LANG === 'fr' && p.subFr ? p.subFr : p.sub);
  const pDesc = (p) => (LANG === 'fr' && p.descFr ? p.descFr : p.desc);
  const pStats = (p) => (LANG === 'fr' && p.statsFr && p.statsFr.length ? p.statsFr : p.stats);
  const catName = (c) => (LANG === 'en' ? I.CAT_EN[c] || c : t(c));
  const svcDesc = (s) => cx('services', s.id, 'desc', s.desc);
  const ritName = (r) => cx('rituals', r.id, 'name', r.name);
  const ritEyebrow = (r) => cx('rituals', r.id, 'eyebrow', r.eyebrow);
  const ritStep = (r, i) => { const st = r.steps[i]; const fr = cx('rituals', r.id, 'steps', null); return fr ? [fr[i][0], fr[i][1], st[2], st[3]] : st; };
  const tipOf = (tp) => ({ id: tp.id, title: cx('tips', tp.id, 'title', tp.title), lead: cx('tips', tp.id, 'lead', tp.lead), body: cx('tips', tp.id, 'body', tp.body) });
  const seasonName = (s) => t(s.name);
  const vTitle = (v) => (v.gift ? tx(v.title) : cx('vouchers', v.id, 'title', v.title));
  const vNote = (v) => (v.gift ? tx(v.note) : cx('vouchers', v.id, 'note', v.note));
  const badgeName = (b) => I.badge(b.id, LANG, gender()) || b.name;
  const badgeByName = (name) => { const b = E.BADGES.find((x) => x.name === name); return b ? badgeName(b) : tx(name); };
  const tierName = (x) => x.name;

  /* ---------- Backends ---------- */
  // Server mode: everything goes through the API, with an httpOnly session cookie.
  function serverBackend() {
    async function call(method, url, body, raw) {
      const res = await fetch('/api' + url, {
        method, credentials: 'same-origin',
        headers: { 'X-Seasonly': '1', 'X-Lang': LANG, ...(raw ? { 'Content-Type': raw.type || 'image/jpeg' } : body ? { 'Content-Type': 'application/json' } : {}) },
        body: raw || (body ? JSON.stringify(body) : undefined),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(tx(data.error || 'Something went wrong. Try again.')), { status: res.status });
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
      saveAddress: (address) => call('PUT', '/me/address', { address }),
      contests: async () => (await call('GET', '/contests')).contests,
      enterContest: async (id) => (await call('POST', `/contests/${id}/enter`)).contest,
      gifts: async () => (await call('GET', '/me/gifts')).gifts,
      collabs: async () => (await call('GET', '/collabs')).collabs,
      joinCollab: async (id, on) => (await call(on ? 'POST' : 'DELETE', `/collabs/${id}/join`)).collab,
      skinScan: (blob) => call('POST', '/skin-scan', null, blob),
      syncLang: () => call('GET', '/me').catch(() => {}),
      async avatar(user) {
        if (!user.hasAvatar) return null;
        if (avatarUrl && avatarUrl.v === user.avatarVersion) return avatarUrl.url;
        const res = await fetch('/api/me/avatar', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) return null;
        if (avatarUrl) URL.revokeObjectURL(avatarUrl.url);
        avatarUrl = { v: user.avatarVersion, url: URL.createObjectURL(await res.blob()) };
        return avatarUrl.url;
      },
      support: (d) => call('POST', '/support', d),
      feedback: (d) => call('POST', '/feedback', d),
      messages: async () => (await call('GET', '/me/messages')).messages,
      pushSubscribe: (subscription) => call('POST', '/push/subscribe', { subscription }),
      pushUnsubscribe: (endpoint) => call('POST', '/push/unsubscribe', { endpoint }),
    };
  }

  // Demo mode: the same engine and flows, stored on this device. Codes are shown on screen.
  function demoBackend() {
    const KEY = 'seasonly.demo.v2';
    const db = store.get(KEY, { users: {}, session: null, pending: {} });
    const save = () => store.set(KEY, db);
    const err = (m) => Promise.reject(new Error(tx(m)));
    const normPhone = (raw) => { let p = String(raw || '').replace(/[\s.\-()]/g, ''); if (/^0[1-9]\d{8}$/.test(p)) p = '+33' + p.slice(1); return /^\+[1-9]\d{7,14}$/.test(p) ? p : null; };
    const normEmail = (raw) => { const e = String(raw || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : null; };
    const pub = (u) => ({ id: u.id, first: u.state.profile.first, last: u.state.profile.last, email: u.email, phone: u.phone, referralCode: u.code,
      emailVerified: true, phoneVerified: true, address: u.address || null, gender: u.state.profile.gender, lang: LANG,
      hasAvatar: !!u.avatar, avatarVersion: u.avatar ? String(u.avatar.length) : null, state: u.state, push: false });
    const checkAddress = (a) => {
      a = a || {};
      const out = { line1: String(a.line1 || '').trim(), line2: String(a.line2 || '').trim(), postcode: String(a.postcode || '').trim().toUpperCase(), city: String(a.city || '').trim(), country: a.country || 'France' };
      if (out.line1.length < 4) throw new Error(tx('Enter your street address so we can send you gifts.'));
      if (!/^[A-Z0-9][A-Z0-9 -]{2,9}$/.test(out.postcode)) throw new Error(tx('Enter a valid postcode.'));
      if (out.city.length < 2) throw new Error(tx('Enter your city.'));
      return out;
    };
    // The demo plays rituals at full length too; the share of the video to watch is the engine default.
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
    const me = () => db.users[db.session] || {};
    // Sample collaborations, the same ones the server seeds.
    const demoCollabs = () => C.COLLABS.map((c, i) => {
      const d = c.data(new Date());
      const reg = !!(me().collabs || {})[i + 1];
      return { id: i + 1, partner: c.partner, kind: c.kind, ...d, image: null, registrations: (c.kind === 'event' ? 11 : 0) + (reg ? 1 : 0), full: false, registered: reg };
    });
    return {
      mode: 'demo',
      async init() {
        const u = db.session && db.users[db.session];
        return { config: { referral: E.DEFAULT_REFERRAL, hero: null, vapidPublicKey: null, scan: 'device', ritualVideos: {} }, products: C.PRODUCTS, user: u && u.verified ? pub(u) : null };
      },
      async signup(d) {
        const first = String(d.first || '').trim(), email = normEmail(d.email), phone = normPhone(d.phone);
        if (!first) return err('Enter your first name.');
        if (!email) return err('Enter a valid email address.');
        if (!phone) return err('Enter a valid mobile number, for example 06 12 34 56 78.');
        let address;
        try { address = checkAddress(d.address); } catch (e) { return Promise.reject(e); }
        if (!E.GENDERS.includes(d.gender)) return err('Tell us how you identify: woman, man, other, or prefer not to say.');
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
        db.users[id] = { id, email, phone, address, verified: false, code: null, avatar: null, state: E.newState({ first, last: String(d.last || '').trim(), email, phone, referredBy, gender: d.gender }, new Date()) };
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
      async support(d) { const u = me(); u.messages = [{ id: Date.now(), kind: 'support', topic: d.topic, ref: d.ref, body: d.message, status: 'open', created_at: Date.now() }, ...(u.messages || [])]; save(); return { id: u.messages[0].id }; },
      async feedback(d) { const u = me(); u.messages = [{ id: Date.now(), kind: d.kind, rating: d.rating, body: d.message, status: 'open', created_at: Date.now() }, ...(u.messages || [])]; save(); return { id: u.messages[0].id }; },
      async messages() { return me().messages || []; },
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
        return { state: out.state, events: out.events.filter((e) => !['referralQualified', 'referralRevoked'].includes(e.type)), result: out.result };
      },
      async uploadAvatar(blob) {
        const u = me();
        u.avatar = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(blob); });
        save();
        return { user: pub(u) };
      },
      async deleteAvatar() { const u = me(); u.avatar = null; save(); return { user: pub(u) }; },
      async saveAddress(a) { const u = me(); u.address = checkAddress(a); save(); return { user: pub(u) }; },
      // Demo: one sample contest so testers can see how contests look. Draws happen in the admin panel of the real server.
      async contests() {
        const u = me();
        const end = E.addDays(E.mondayOf(new Date()), 7).getTime() - 1;
        return [{ id: 1, title: 'Gagnez un Soin Signature', titleEn: 'Win a Soin Signature', period: 'week',
          description: 'Tentez de gagner un Soin Signature de 30 minutes dans le Face Glow Bar de votre choix.', descriptionEn: 'Enter for a chance to win a 30-minute Soin Signature at the Face Glow Bar of your choice.',
          prizeKind: 'soin', prizeLabel: 'Soin Signature', winners: 1, endsAt: end, status: 'open', entries: 128 + (u.entered1 ? 1 : 0), entered: !!u.entered1, won: false, winnerNames: [] }];
      },
      async enterContest() { const u = me(); if (!u.address) return err('Add your postal address in your profile first, so we can send you the prize.'); u.entered1 = true; save(); return (await this.contests())[0]; },
      async gifts() { return []; },
      async collabs() { return demoCollabs(); },
      async joinCollab(id, on) { const u = me(); u.collabs = { ...(u.collabs || {}), [id]: !!on }; save(); return demoCollabs().find((c) => c.id === id); },
      async skinScan() { throw Object.assign(new Error('device'), { status: 501 }); },
      async syncLang() {},
      async avatar() { const u = me(); return u && u.avatar; },
    };
  }

  /* ---------- App state ---------- */
  let B = null;            // backend
  let CONFIG = {};
  let PRODUCTS = [];
  let U = null;            // signed-in user (public fields + state)
  let S = null;            // rewards state (U.state)
  let avatarSrc = null;
  const newBk = () => ({ studio: null, party: [{ service: null, name: '' }], day: 1, slot: null, voucher: null });
  const ui = { tab: 'home', cat: 'Anti-aging', q: '', step: 1, bk: newBk(), auth: 'welcome', form: {}, pending: null, busy: false, error: '' };
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
    if (e.type === 'miles') { toast(`+${nf(e.amt)} miles`, tx(e.label)); milesBurst(e.amt); }
    else if (e.type === 'deduct') toast(`−${nf(e.amt)} miles`, tx(e.label), 'error');
    else if (e.type === 'badge') toast(t('Badge unlocked'), badgeByName(e.name), 'badge');
    else if (e.type === 'tier') toast(t('Welcome to {name}', { name: e.name }), t('Earn ×{mult} miles from now on', { mult: String(e.mult).replace('.', LANG === 'fr' ? ',' : '.') }), 'tier');
    else if (e.type === 'referral') toast(t('{name} booked', { name: e.name }), t('You now have {d}% off your next booking', { d: e.discount }), 'tier');
  }

  /* Short celebration when miles are credited: a glass pill rises with sparkles while the counters count up. */
  let burstTimer = null;
  function milesBurst(amt) {
    if (!(amt > 0)) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const host = document.querySelector('.device') || document.body;
    const el = document.createElement('div');
    el.className = 'miles-burst';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<div class="mb-pill">${ic('star', 20, 2)}<b>+${nf(amt)}</b><span>Skin Miles</span></div>${reduce ? '' : Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${60 + (i % 3) * 22}px;animation-delay:${(i % 4) * 40}ms"></i>`).join('')}`;
    host.appendChild(el);
    setTimeout(() => el.remove(), reduce ? 1200 : 1700);
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => countUp(amt, reduce), 120);
  }
  function countUp(amt, reduce) {
    const target = S ? S.miles : 0, from = target - amt;
    document.querySelectorAll('[data-miles]').forEach((n) => {
      if (reduce) { n.textContent = nf(target); return; }
      const t0 = performance.now(), dur = 900;
      const step = (tm) => { const k = Math.min(1, (tm - t0) / dur); n.textContent = nf(from + (target - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      n.textContent = nf(from); requestAnimationFrame(step);
      n.classList.add('bump'); setTimeout(() => n.classList.remove('bump'), 900);
    });
  }

  /* ---------- Render ---------- */
  const openContest = () => (CONTESTS || []).find((c) => c.status === 'open' && !c.entered);
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
        .map(([id, icon, label]) => `<button class="tab${ui.tab === id ? ' on' : ''}" data-a="tab" data-arg="${id}" aria-label="${t(label)}">${ic(icon, 22)}<span>${t(label)}</span>${id === 'rewards' ? (openContest() ? `<i class="tab-prize" title="${t('A contest is open')}">${ic('gift', 11, 2.2)}</i>` : E.canCheckIn(S, today()) ? '<i class="dot"></i>' : '') : ''}</button>`).join('');
    }
    if (U && !ui.keepScroll && ['home', 'rewards'].includes(ui.tab)) loadContests();
    if (U && ui.tab === 'home' && !ui.keepScroll) loadCollabs();
    if (U && ui.tab === 'profile' && !ui.keepScroll) loadGifts();
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
  function ring(done, total, size = 64, label) {
    const r = size / 2 - 4, c = 2 * Math.PI * r, pct = total ? done / total : 0;
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--ring-track)" stroke-width="4" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--accent)" stroke-width="4" fill="none" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span>${label !== undefined ? label : `${done}/${total}`}</span></div>`;
  }
  function milesCard() {
    const nt = E.nextTier(S.lifetime), tr = E.tierOf(S.lifetime);
    const pct = nt ? Math.min(100, ((S.lifetime - tr.min) / (nt.min - tr.min)) * 100) : 100;
    return `<button class="miles-card glass" data-a="tab" data-arg="rewards">
      <span class="star-badge">${ic('star', 18)}</span>
      <span class="mc-body"><span class="eyebrow muted">${t('Your Seasonly miles')}</span>
        <span class="mc-num"><span data-miles>${nf(S.miles)}</span> <small>${nt ? t('/ {n} lifetime to {tier}', { n: nf(nt.min), tier: nt.name }) : t('{tier} · top tier', { tier: tr.name })}</small></span>
        <span class="bar"><i style="width:${pct}%"></i></span></span></button>`;
  }
  const badgeLabel = (b) => (b ? t(b) : '');
  function productCard(p) {
    return `<article class="p-card"><div class="p-wrap">
      <button class="p-media" data-a="product" data-arg="${esc(p.id)}" style="background:${esc(p.bg)}" aria-label="${esc(p.name)}">
        ${p.badge ? `<span class="pill-badge${p.badge === 'New' ? ' light' : ''}">${esc(badgeLabel(p.badge))}</span>` : ''}${productVisual(p)}</button>
      <button class="add-mini" data-a="add" data-arg="${esc(p.id)}" aria-label="${esc(t('Add {name} to bag', { name: p.name }))}">${ic('plus', 16, 2)}</button></div>
      <h3 data-a="product" data-arg="${esc(p.id)}">${esc(p.name)}</h3>
      <p class="muted sm">${esc(pSub(p))}</p>
      <p class="p-price"><span>${eur(p.price)}${p.compareAt ? ` <s class="muted">${eur(p.compareAt)}</s>` : ''}</span><span class="muted">${esc(sizeTxt(p.size))}</span></p>
    </article>`;
  }
  const sizeTxt = (s) => (LANG === 'fr' ? String(s || '').replace('1 piece', '1 pièce').replace('2 products', '2 produits') : s || '');
  const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Monaco'];
  const countryName = (c) => (LANG === 'en' ? { Belgique: 'Belgium', Suisse: 'Switzerland' }[c] || c : c);
  const countrySelect = (id, value) => `<label class="field" for="${id}"><span>${t('Country')}</span><select id="${id}" name="${id}" autocomplete="country-name">${COUNTRIES.map((c) => `<option value="${c}" ${c === (value || 'France') ? 'selected' : ''}>${esc(countryName(c))}</option>`).join('')}</select></label>`;
  const addrText = (a) => (a ? [a.line1, a.line2, `${a.postcode} ${a.city}`, countryName(a.country)].filter(Boolean).map(esc).join('<br>') : '');
  const field = (id, label, attrs = '', value = '') => `<label class="field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" value="${esc(value)}" ${attrs}></label>`;
  const GENDER_LABEL = { female: 'Woman', male: 'Man', other: 'Other', undisclosed: 'Prefer not to say' };
  const genderPicker = (value, name = 'gender') => `<fieldset class="seg wrap gender"><legend>${t('I am')}</legend>
    ${E.GENDERS.map((g) => `<label class="${value === g ? 'on' : ''}"><input type="radio" name="${name}" value="${g}" ${value === g ? 'checked' : ''}>${t(GENDER_LABEL[g])}</label>`).join('')}</fieldset>`;
  const langSwitch = (cls = '') => `<div class="lang-switch ${cls}" role="group" aria-label="${t('Language')}">${['fr', 'en'].map((l) => `<button class="${LANG === l ? 'on' : ''}" data-a="lang" data-arg="${l}" aria-pressed="${LANG === l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>`;

  /* ---------- Auth screens ---------- */
  // Campaign photo: the one uploaded in the admin panel, else the bundled Seasonly photo.
  const HERO_DEFAULT = 'img/hero.jpg';
  const heroBg = () => `<div class="hero-photo" role="img" aria-label="${t('Seasonly skincare ritual')}" style="background-image:url('${esc(CONFIG.hero || HERO_DEFAULT)}')"></div>`;
  const AUTH = {
    welcome() {
      return `<section class="welcome">
        <div class="welcome-hero">${heroBg()}<div class="logo">seasonly<small>PARIS</small></div>${langSwitch('on-photo')}</div>
        <div class="welcome-body">
          <p class="eyebrow accent">Skin Miles</p>
          <h1 class="display">${t('Your skin in <em>balance</em>,<br>this season.')}</h1>
          <p class="muted">${t('Earn miles for every ritual, treatment and order, and trade them for seasonal vouchers.')}</p>
          <div class="gift-line">${ic('gift', 18)} <span>${t('<b>300 Skin Miles</b> welcome gift when you confirm your account')}</span></div>
          <button class="btn-dark wide" data-a="auth" data-arg="signup">${t('Create my account')}</button>
          <button class="btn-ghost wide" data-a="auth" data-arg="login">${t('I already have an account')}</button>
          ${B.mode === 'demo' ? `<p class="demo-note">${t('Demo mode: accounts and codes stay on this device. No real SMS or email is sent.')}</p>` : ''}
        </div></section>`;
    },
    signup() {
      const f = ui.form;
      const ch = f.channel || 'sms';
      return `<div class="pad top auth">
        <div class="row between"><button class="icon-btn" data-a="auth" data-arg="welcome" aria-label="${t('Back')}">${ic('back', 18)}</button>${langSwitch()}</div>
        <p class="eyebrow accent mt16">${t('Step 1 of 2')}</p>
        <h1 class="serif-h">${t('Create your <em class="accent">account</em>')}</h1>
        <form class="stack" data-form="signup" novalidate>
          <div class="two">${field('first', t('First name'), 'autocomplete="given-name" required maxlength="40"', f.first)}${field('last', t('Last name'), 'autocomplete="family-name" maxlength="40"', f.last)}</div>
          ${genderPicker(f.gender)}
          ${field('email', t('Email'), 'type="email" autocomplete="email" inputmode="email" required', f.email)}
          ${field('phone', t('Mobile number'), 'type="tel" autocomplete="tel" inputmode="tel" placeholder="06 12 34 56 78" required', f.phone)}
          <fieldset class="addr"><legend>${t('Postal address')} <small>${t('· so we can send you gifts and prizes')}</small></legend>
            ${field('line1', t('Street and number'), 'autocomplete="address-line1" required maxlength="120"', (f.address || {}).line1)}
            ${field('line2', t('Apartment, floor (optional)'), 'autocomplete="address-line2" maxlength="120"', (f.address || {}).line2)}
            <div class="two">${field('postcode', t('Postcode'), 'autocomplete="postal-code" inputmode="numeric" required maxlength="10"', (f.address || {}).postcode)}${field('city', t('City'), 'autocomplete="address-level2" required maxlength="60"', (f.address || {}).city)}</div>
            ${countrySelect('country', (f.address || {}).country)}
          </fieldset>
          ${field('referral', t('Referral code (optional)'), 'autocomplete="off" autocapitalize="characters" maxlength="12"', f.referral)}
          <fieldset class="seg"><legend>${t('Send my confirmation code by')}</legend>
            ${[['sms', 'SMS'], ['email', 'Email'], ['both', 'Both']].map(([v, l]) => `<label class="${ch === v ? 'on' : ''}"><input type="radio" name="channel" value="${v}" ${ch === v ? 'checked' : ''}>${t(l)}</label>`).join('')}
          </fieldset>
          <label class="check"><input type="checkbox" name="consent" id="consent" ${f.consent ? 'checked' : ''}><span>${t('I accept the terms of use and the privacy policy. Seasonly uses my details to manage my account and rewards.')}</span></label>
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? t('Sending…') : t('Send my code')}</button>
        </form>
        <p class="muted sm center mt16">${t('Already a member?')} <button class="link" data-a="auth" data-arg="login">${t('Sign in')}</button></p>
      </div>`;
    },
    login() {
      return `<div class="pad top auth">
        <div class="row between"><button class="icon-btn" data-a="auth" data-arg="welcome" aria-label="${t('Back')}">${ic('back', 18)}</button>${langSwitch()}</div>
        <p class="eyebrow accent mt16">${t('Sign in')}</p>
        <h1 class="serif-h">${t('Welcome <em class="accent">back</em>')}</h1>
        <p class="muted">${t("We'll send a 6-digit code to confirm it's you. No password needed.")}</p>
        <form class="stack" data-form="login" novalidate>
          ${field('identifier', t('Email or mobile number'), 'autocomplete="username" required', ui.form.identifier)}
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? t('Sending…') : t('Send my code')}</button>
        </form>
        <p class="muted sm center mt16">${t('New to Seasonly?')} <button class="link" data-a="auth" data-arg="signup">${t('Create an account')}</button></p>
      </div>`;
    },
    verify() {
      const p = ui.pending || {};
      const to = [p.sentTo && p.sentTo.sms ? t('by SMS to <b>{to}</b>', { to: esc(p.sentTo.sms) }) : '', p.sentTo && p.sentTo.email ? t('by email to <b>{to}</b>', { to: esc(p.sentTo.email) }) : ''].filter(Boolean).join(t(' and '));
      const wait = Math.max(0, 30 - Math.floor((Date.now() - (p.at || 0)) / 1000));
      return `<div class="pad top auth">
        <button class="icon-btn" data-a="auth" data-arg="${p.purpose === 'login' ? 'login' : 'signup'}" aria-label="${t('Back')}">${ic('back', 18)}</button>
        <p class="eyebrow accent mt16">${p.purpose === 'login' ? t('Sign in') : t('Step 2 of 2')}</p>
        <h1 class="serif-h">${p.channel === 'email' ? t('Confirm your <em class="accent">email</em>') : t('Confirm your <em class="accent">number</em>')}</h1>
        <p class="muted">${t('We sent a 6-digit code {to}.', { to })} ${p.channel === 'both' ? t('Each one gets its own code: enter either of them.') : ''} ${t('It expires in 10 minutes.')}</p>
        ${p.devCode ? `<div class="demo-code">${ic('phone', 18)}<span>${B.mode === 'demo' ? t('Demo mode — no real message is sent.') : t('Development mode.')} ${p.devEmailCode ? t('SMS code <b>{sms}</b> · email code <b class="email-code">{email}</b>', { sms: esc(p.devCode), email: esc(p.devEmailCode) }) : t('Your code is <b>{code}</b>', { code: esc(p.devCode) })}</span></div>` : ''}
        <form class="stack" data-form="verify" novalidate>
          <label class="field otp" for="code"><span>${t('Confirmation code')}</span>
            <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="••••••" required></label>
          ${ui.error ? `<p class="form-error" role="alert">${esc(ui.error)}</p>` : ''}
          <button class="btn-dark wide" type="submit" ${ui.busy ? 'disabled' : ''}>${ui.busy ? t('Checking…') : t('Confirm')}</button>
        </form>
        <div class="resend">
          <button class="link" data-a="resend" ${wait ? 'disabled' : ''} id="resendBtn">${wait ? t('Send a new code in {s}s', { s: wait }) : t('Send a new code')}</button>
          ${p.purpose === 'signup' && p.channel !== 'both' ? `<button class="link" data-a="resend" data-arg="${p.channel === 'sms' ? 'email' : 'sms'}" ${wait ? 'disabled' : ''}>${p.channel === 'sms' ? t('Send it by email instead') : t('Send it by SMS instead')}</button>` : ''}
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
      b.textContent = wait ? t('Send a new code in {s}s', { s: wait }) : t('Send a new code');
      document.querySelectorAll('[data-a="resend"]').forEach((x) => { x.disabled = !!wait; });
      if (!wait) clearInterval(resendTimer);
    }, 1000);
  }

  /* ---------- Main views ---------- */
  const VIEWS = {
    home() {
      const s = E.seasonOf(today()), main = E.RITUALS[0];
      const tip = tipOf(E.TIPS[new Date().getDate() % E.TIPS.length]);
      const recent = S.ledger.filter((l) => l.kind === 'ritual' && Date.now() - l.t < 14 * 864e5).length;
      const radiance = Math.min(42, 6 + recent * 4);
      return `
      <section class="hero">
        ${heroBg()}
        <div class="hero-top">
          <div class="logo">seasonly<small>PARIS</small></div>
          <div class="row g8">
            <span class="chip-glass">${seasonName(s)} · ${t('W')}${E.isoWeek(new Date())}</span>
            <button class="icon-glass" data-a="bag" aria-label="${t('Bag')}">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button>
            <button class="icon-glass dark" data-a="tab" data-arg="rewards" aria-label="${t('Rewards')}">${ic('bell', 18)}</button>
          </div>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">${t('Hello, {name}', { name: esc(U.first) })}</p>
          <h1 class="display">${t('Your skin in <em>balance</em>,<br>this season.')}</h1>
        </div>
      </section>
      <button class="stats glass" data-a="tab" data-arg="rewards">
        <span class="stat"><span class="stat-ic">${ic('star', 16)}</span><b data-miles>${nf(S.miles)}</b><small>${t('Miles')}</small></span>
        <span class="stat"><span class="stat-ic">${ic('clock', 16)}</span><b>${S.streak}</b><small>${t('Day streak')}</small></span>
        <span class="stat"><span class="stat-ic">${ic('eye', 16)}</span><b>+${radiance}%</b><small>${t('Radiance')}</small></span>
      </button>
      <div class="pad">
        <div id="contestHero">${contestHero()}</div>
        ${E.canCheckIn(S, today()) ? `<button class="checkin-banner" data-a="checkin">
          <span class="flame">${ic('flame', 20)}</span>
          <span><b>${t('Daily check-in')}</b><small>${S.streak ? t('Keep your {n}-day streak alive', { n: S.streak }) : t('Start your streak today')}</small></span>
          <span class="pill-accent">+20 miles</span></button>` : ''}
        <button class="scan-card card" data-a="scan">
          <span class="scan-face">${ic('scan', 30, 1.4)}<i></i></span>
          <span class="grow"><span class="eyebrow accent block">${t('New · 10 seconds')}</span><b class="serif-t block">${t('How is my skin today?')}</b>
            <small class="muted">${S.scans && S.scans[0] ? t('Last scan {date} · glow score {n}', { date: fmtDate(S.scans[0].t), n: glowScore(S.scans[0].scores) }) : t('A playful selfie skin check, with tips and a ritual for you')}</small></span>
          <span class="pill-accent">${doneToday('scan') ? ic('check', 12, 2.4) : `+${E.REWARDS.scan}`}</span></button>
        <article class="card tip" data-a="tip" data-arg="${tip.id}">
          <div class="row between"><span class="row g6 muted sm">${ic('book', 16)} ${t('Daily wellness tip')}</span>
            ${doneToday('tip-' + tip.id) ? `<span class="pill-done">${ic('check', 12, 2.4)} ${t('Read')}</span>` : `<span class="pill-dark">${t('New')}</span>`}</div>
          <h3 class="t-title">${tip.title}</h3><p class="muted">${tip.lead}</p>
          <p class="t-cta">${doneToday('tip-' + tip.id) ? t('Earned today · come back tomorrow') : t('Tap to read & earn 10 miles →')}</p>
        </article>
        ${sectionHead(t("Today's ritual"), t('See all'), 'rituals')}
        <article class="card ritual-card">
          <span class="rit-thumb">${ic('play', 18)}</span>
          <div class="grow"><p class="eyebrow accent">${ritEyebrow(main)}</p><h3 class="serif-t">${ritName(main)}</h3>
            <p class="muted sm">${t('Video · {m} min', { m: Math.ceil(E.ritualSecs(main) / 60) })} · ${doneToday('ritual-' + main.id) ? t('earned') : `+${main.miles} miles`}</p></div>
          <button class="btn-dark sm" data-a="ritual" data-arg="${main.id}">${doneToday('ritual-' + main.id) ? t('Again') : t('Watch')} ${ic('play', 14)}</button>
        </article>
        ${referralTeaser()}
        <div class="anchor" id="collabs"></div>
        <div id="collabList">${collabList()}</div>
        ${sectionHead(t('Curated for {season}', { season: seasonName(s).toLowerCase() }), t('More'), 'rituals')}
      </div>
      <div class="hscroll">
        ${E.RITUALS.slice(1).map((r, i) => `<button class="curated c${i}" data-a="ritual" data-arg="${r.id}">
          <span class="curated-art">${productArt(PRODUCTS.find((p) => p.art && p.art.kind === ['guasha', 'dropper', 'tube'][i]) || PRODUCTS[0], true)}</span>
          <span class="curated-copy"><span class="eyebrow">${ritEyebrow(r)}</span><span class="serif-xl">${ritName(r)}</span>
          <span class="miles-chip">${doneToday('ritual-' + r.id) ? t('Earned today') : `+${r.miles} miles`}</span></span></button>`).join('')}
      </div>
      <div class="pad">${sectionHead(t('From the laboratoire'), t('Shop all'), 'tab', 'shop')}</div>
      <div class="hscroll small">${PRODUCTS.slice(0, 8).map(productCard).join('')}</div>
      <div class="spacer"></div>`;
    },

    shop() {
      const q = ui.q.trim().toLowerCase();
      const list = PRODUCTS.filter((p) => (ui.cat === 'All' || p.cat === ui.cat || (p.tags || []).includes(ui.cat)) &&
        (!q || `${p.name} ${pSub(p)} ${pDesc(p)} ${p.cat} ${catName(p.cat)}`.toLowerCase().includes(q)));
      return `<div class="pad top">
        <div class="row between">
          <p class="eyebrow accent">${t('Boutique')}</p>
          <div class="row g8"><button class="icon-btn" data-a="focus-search" aria-label="${t('Search')}">${ic('search', 18)}</button>
          <button class="icon-btn" data-a="bag" aria-label="${t('Bag')}">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button></div>
        </div>
        <label class="search glass" for="search">${ic('search', 16)}<input id="search" type="search" placeholder="${t('Search the laboratoire…')}" value="${esc(ui.q)}" autocomplete="off"></label>
      </div>
      <div class="chips">${C.CATS.map((c) => `<button class="chip${ui.cat === c ? ' on' : ''}" data-a="cat" data-arg="${c}">${esc(catName(c))}</button>`).join('')}</div>
      <div class="pad">
        ${milesCard()}
        ${sectionHead(ui.cat === 'All' ? t('The full collection') : ui.cat === 'Anti-aging' ? t('The TensioLift edit') : esc(catName(ui.cat)), tn('{n} item', '{n} items', list.length), 'cat', 'All')}
        ${list.length ? `<div class="p-grid">${list.map(productCard).join('')}</div>` : `<p class="empty">${t('Nothing matches that search yet.')}</p>`}
      </div><div class="spacer"></div>`;
    },

    book() {
      const titles = { 1: ['Choose your <em class="accent">Face Glow Bar</em>'], 2: ['Who is <em class="accent">coming</em>?'], 3: ['Pick your <em class="accent">moment</em>'], 4: ['Confirm your <em class="accent">visit</em>'] };
      const party = ui.bk.party;
      let body = '';
      if (ui.step === 1) {
        body = E.STUDIOS.map((s, i) => `<button class="studio card" data-a="pick-studio" data-arg="${s.id}">
          <span class="studio-img s${i}">${ic('leaf', 26, 1.2)}</span>
          <span class="grow"><span class="serif-t">${s.name}</span><span class="muted sm block">${s.addr}</span>
          <span class="sm block mt4"><i class="live"></i><b>${t('Today · 10am–8pm')}</b> <span class="muted">· ${s.dist.replace('.', LANG === 'fr' ? ',' : '.')}</span></span></span>
          <span class="round-dark">${ic('chevron', 16, 2)}</span></button>`).join('');
      } else if (ui.step === 2) {
        const ready = party.every((p) => p.service);
        body = `<div class="card party-size">
            <div class="row between"><span><b>${t('Number of people')}</b><small class="muted block">${t('Up to {n}, all at the same time', { n: E.MAX_PARTY })}</small></span>
            <span class="qty big"><button data-a="party" data-arg="-1" aria-label="${t('One less')}" ${party.length <= 1 ? 'disabled' : ''}>${ic('minus', 14, 2)}</button><b id="partyN">${party.length}</b><button data-a="party" data-arg="1" aria-label="${t('One more')}" ${party.length >= E.MAX_PARTY ? 'disabled' : ''}>${ic('plus', 14, 2)}</button></span></div>
          </div>
          ${party.map((p, i) => `<section class="person card${p.service ? ' done' : ''}">
            <div class="row between g8"><b class="serif-t">${i === 0 ? t('You') : t('Guest {n}', { n: i })}</b>${i > 0 ? `<button class="link sm" data-a="party-remove" data-arg="${i}">${t('Remove')}</button>` : ''}</div>
            ${i > 0 ? field(`guest${i}`, t('First name (optional)'), `maxlength="40" autocomplete="off" data-guest="${i}"`, p.name) : ''}
            <div class="svc-pick">${E.SERVICES.map((s) => `<button class="svc-opt${p.service === s.id ? ' on' : ''}" data-a="pick-service" data-arg="${i}:${s.id}">
              <b>${s.name}</b><small>${s.mins} min · ${eur(s.price)}</small></button>`).join('')}</div>
            ${p.service ? `<p class="muted sm">${svcDesc(E.SERVICES.find((x) => x.id === p.service))}</p>` : ''}
          </section>`).join('')}
          <p class="muted sm center">${party.length > 1 ? t('You earn {a} miles, plus {b} for each guest, once paid.', { a: E.REWARDS.booking, b: E.REWARDS.guest }) : t('+{a} miles once paid.', { a: E.REWARDS.booking })}</p>
          <button class="btn-dark wide" data-a="step" data-arg="3" ${ready ? '' : 'disabled'}>${ready ? t('Continue') : t('Choose a treatment for each person')}</button>`;
      } else if (ui.step === 3) {
        const days = Array.from({ length: 7 }, (_, i) => E.addDays(new Date(), i + 1));
        body = `${party.length > 1 ? `<p class="muted sm">${t('Times shown have room for {n} people.', { n: party.length })}</p>` : ''}
          <div class="days">${days.map((d, i) => `<button class="day${ui.bk.day === i + 1 ? ' on' : ''}" data-a="pick-day" data-arg="${i + 1}">
            <small>${d.toLocaleDateString(loc(), { weekday: 'short' })}</small><b>${d.getDate()}</b></button>`).join('')}</div>
          <p class="eyebrow muted mt16">${t('Available')}</p>
          <div class="slots">${E.SLOTS.map((tm, i) => { const off = (i + ui.bk.day) % 4 === 3 || (party.length > 3 && i % 3 === 1); return `<button class="slot${ui.bk.slot === tm ? ' on' : ''}${off ? ' off' : ''}" data-a="pick-slot" data-arg="${tm}" ${off ? 'disabled' : ''}>${slotTxt(tm)}</button>`; }).join('')}</div>
          <button class="btn-dark wide mt16" data-a="step" data-arg="4" ${ui.bk.slot ? '' : 'disabled'}>${t('Continue')}</button>`;
      } else {
        const st = E.STUDIOS.find((x) => x.id === ui.bk.studio);
        const day = E.addDays(new Date(), ui.bk.day);
        const usable = S.vouchers.filter((v) => !v.used && v.kind === 'service' && v.expires > Date.now());
        // Preview the price with the same engine the server uses.
        let preview = null;
        try { preview = E.apply(S, { type: 'book', payload: bookPayload() }, { now: new Date(), settings: { referral: CONFIG.referral } }).result.booking; } catch { /* shown on confirm */ }
        body = `<div class="card summary">
            <div class="sum-row"><span class="muted">Face Glow Bar</span><b>${st.name}</b></div>
            <div class="sum-row"><span class="muted">${t('Moment')}</span><b>${longDate(day)} · ${slotTxt(ui.bk.slot)}</b></div>
            <hr>
            ${party.map((p, i) => { const sv = E.SERVICES.find((x) => x.id === p.service); return `<div class="sum-row"><span class="muted">${i === 0 ? t('You') : esc(p.name || t('Guest {n}', { n: i }))}</span><b>${sv.name} · ${sv.mins} min · ${eur(sv.price)}</b></div>`; }).join('')}
            <hr>
            ${usable.length ? `<p class="eyebrow muted">${t('Apply a Skin Miles voucher')}${party.length > 1 ? ` <small>${t('(on your treatment)')}</small>` : ''}</p>
              <div class="v-pick">${usable.map((v) => `<button class="v-opt${ui.bk.voucher === v.code ? ' on' : ''}" data-a="bk-voucher" data-arg="${v.code}">${ic('ticket', 16)} ${esc(vTitle(v))}</button>`).join('')}</div><hr>` : ''}
            <div class="sum-row"><span class="muted">${t('Price')}</span><b>${eur(preview ? preview.list : 0)}</b></div>
            ${preview ? preview.lines.map((l) => `<div class="sum-row"><span class="muted">${esc(tx(l.label))}</span><b class="accent">−${eur(-l.amount)}</b></div>`).join('') : ''}
            <div class="sum-row big"><span>${t('Total at the Face Glow Bar')}</span><b>${eur(preview ? preview.price : 0)}</b></div>
          </div>
          <p class="muted sm center mt12">${t('You pay at the Face Glow Bar. {n} Skin Miles are credited once it is paid.', { n: preview ? preview.miles : E.REWARDS.booking })}</p>
          <button class="btn-dark wide mt12" data-a="confirm-booking" ${ui.busy ? 'disabled' : ''}>${party.length > 1 ? t('Confirm for {n} people', { n: party.length }) : t('Confirm my booking')}</button>`;
      }
      const steps = ['Studio', 'People', 'Date', 'Confirm'];
      return `<div class="pad top">
        ${ui.step > 1 ? `<button class="icon-btn" data-a="step" data-arg="${ui.step - 1}" aria-label="${t('Back')}">${ic('back', 18)}</button>` : '<div class="icon-spacer"></div>'}
        <p class="eyebrow accent mt16">${t('Step {n} of 4', { n: ui.step })}</p>
        <h1 class="serif-h">${t(titles[ui.step][0])}</h1>
        ${refBanner()}
        <div class="stepper glass">${steps.map((s, i) => `<span class="${i + 1 < ui.step ? 'done' : i + 1 === ui.step ? 'on' : ''}"><i>${i + 1 < ui.step ? '✓' : i + 1}</i>${t(s)}</span>`).join('<b></b>')}</div>
        <div class="stack">${body}</div>
      </div><div class="spacer"></div>`;
    },

    rewards() {
      const tr = E.tierOf(S.lifetime), nt = E.nextTier(S.lifetime), s = E.seasonOf(today());
      const pct = nt ? Math.min(100, ((S.lifetime - tr.min) / (nt.min - tr.min)) * 100) : 100;
      const games = [['scan', 'scan', 'Skin scan', 'Selfie check-up', String(E.REWARDS.scan)], ['ritual', 'play', 'Rituals', 'Guided videos', '30–50'],
        ['match', 'grid', 'Glow Match', 'Pair the actives', 'up to 80'], ['quiz', 'quiz', 'Skin Quiz', '5 questions', 'up to 50'],
        ['wheel', 'wheel', 'Glow Wheel', 'One spin a day', '5–100']];
      const seasonV = E.VOUCHERS.filter((v) => v.season === s.id), nextV = E.VOUCHERS.filter((v) => v.season === s.next.id);
      const myV = S.vouchers.filter((v) => !v.used && v.expires > Date.now());
      return `<div class="pad top">
        <p class="eyebrow accent">Skin Miles</p>
        <h1 class="serif-h">${t('Your <em class="accent">rewards</em>')}</h1>
        <section class="wallet">
          <div class="row between"><span class="eyebrow">${t('{tier} member', { tier: tr.name })}</span><span class="chip-glass dark">${seasonName(s)} · ${t('W')}${E.isoWeek(new Date())}</span></div>
          <div class="wallet-num"><span data-miles>${nf(S.miles)}</span><small>miles</small></div>
          <div class="bar light"><i style="width:${pct}%"></i></div>
          <p class="wallet-note">${nt ? t('{n} lifetime miles to <b>{tier}</b> · earn ×{mult}', { n: nf(nt.min - S.lifetime), tier: nt.name, mult: String(nt.mult).replace('.', LANG === 'fr' ? ',' : '.') }) : t('Top tier reached · earn ×1.5 on everything')}</p>
        </section>
        <div class="anchor" id="contests"></div>
        <div class="sec-head contests-head"><h2>${prizeIcon(30)} ${t('Contests')}</h2><span class="st-pill soft">${t('Free to enter')}</span></div>
        <div id="contestList">${contestList()}</div>
        <section class="card week">
          <div class="row between"><div><b class="streak-n">${S.streak}</b> <span class="muted">${t('day streak')}</span></div><span class="muted sm">${t('Best {n}', { n: S.bestStreak })}</span></div>
          ${weekRow()}
          ${E.canCheckIn(S, today()) ? `<button class="btn-dark wide" data-a="checkin">${t('Check in today · +20 miles')}</button>` : `<p class="muted sm center">${t('Checked in today. See you tomorrow.')}<br>${t('Next bonus at {n} days.', { n: nextMilestone() })}</p>`}
        </section>
        ${sectionHead(t('Play & earn'))}
        <div class="games">${games.map(([id, icon, name, sub, rew]) => {
          const done = id === 'ritual' ? E.RITUALS.every((r) => doneToday('ritual-' + r.id)) : doneToday(id);
          return `<button class="game card" data-a="${id === 'ritual' ? 'rituals' : id === 'scan' ? 'scan' : 'game'}" data-arg="${id}">
            <span class="game-ic">${ic(icon, 22)}</span><b>${t(name)}</b><small class="muted">${t(sub)}</small>
            <span class="${done ? 'pill-done' : 'pill-accent'}">${done ? `${ic('check', 12, 2.4)} ${t('Done today')}` : `+${t(rew)}`}</span></button>`;
        }).join('')}</div>
        <div class="anchor" id="invite"></div>
        ${referralCard()}
        ${sectionHead(t('Challenges'))}
        <div class="card stack-tight">${E.challengeList(S, today()).map((c) => {
          const claimed = S.claimed.includes(c.key), full = c.v >= c.max;
          return `<div class="chal"><div class="row between g8"><span class="sm"><b>${esc(tx(c.name))}</b></span>
            ${claimed ? `<span class="pill-done">${ic('check', 12, 2.4)} ${t('Claimed')}</span>` : full ? `<button class="btn-dark xs" data-a="claim" data-arg="${c.key}">${t('Claim +{n}', { n: c.rew })}</button>` : `<span class="sm muted">${c.v}/${c.max} · ${c.rew} mi</span>`}</div>
            <div class="bar"><i style="width:${(c.v / c.max) * 100}%"></i></div></div>`;
        }).join('')}</div>
        <div class="anchor" id="vouchers"></div>
        ${sectionHead(t('{season} vouchers', { season: seasonName(s) }))}
        <p class="muted sm mb12">${t('Trade your miles for seasonal products and Face Glow Bar treatments. Valid until {date}.', { date: fmtDate(s.end) })}</p>
        <div class="stack">${seasonV.map((v) => voucherCard(v, true)).join('')}</div>
        ${myV.length ? `${sectionHead(t('My vouchers'))}<div class="stack">${myV.map(myVoucher).join('')}</div>` : ''}
        ${sectionHead(t('Coming in {season}', { season: seasonName(s.next).toLowerCase() }))}
        <div class="stack">${nextV.map((v) => voucherCard(v, false)).join('')}</div>
        ${sectionHead(t('Badges'))}
        <div class="badges">${E.BADGES.map((b) => `<div class="badge${S.badges.includes(b.id) ? ' on' : ''}"><span>${ic(S.badges.includes(b.id) ? 'trophy' : 'lock', 22)}</span><small>${esc(badgeName(b))}</small></div>`).join('')}</div>
      </div><div class="spacer"></div>`;
    },

    profile() {
      const tr = E.tierOf(S.lifetime);
      const pushOk = B.mode === 'server' && 'serviceWorker' in navigator && 'PushManager' in window && CONFIG.vapidPublicKey;
      return `<div class="pad top">
        <p class="eyebrow accent">${t('Profile')}</p>
        <h1 class="serif-h">${t('Hello, <em class="accent">{name}</em>', { name: esc(U.first) })}</h1>
        <div class="card profile-card mt16">
          <button class="avatar-btn" data-a="photo" aria-label="${t('Change profile photo')}">${avatar(72)}<span class="cam">${ic('camera', 14, 2)}</span></button>
          <div class="grow"><b>${esc(U.first)} ${esc(U.last || '')}</b><small class="muted block">${tr.name} · ${t('{n} lifetime miles', { n: nf(S.lifetime) })}</small>
            <small class="muted block">${[U.email, U.phone].filter(Boolean).map(esc).join(' · ')}</small></div>
          <button class="link" data-a="rename">${t('Edit')}</button>
        </div>
        <input type="file" id="photoInput" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" hidden>
        <p class="privacy-note">${ic('shield', 16)} <span>${t('Your photo is resized on your phone, its location data is removed, and it is stored encrypted. Only you can see it.')}</span></p>
        ${upcomingSection()}
        ${purchasesSection()}
        <div class="anchor" id="gifts"></div>
        ${sectionHead(t('My gifts'))}
        <div id="giftList">${giftList()}</div>
        ${sectionHead(t('Shipping address'))}
        <button class="card addr-card" data-a="address">${ic('pin', 18)}<span class="grow">${U.address ? addrText(U.address) : `<b>${t('Add your address')}</b><small class="muted block">${t('Needed to receive gifts and contest prizes')}</small>`}</span><span class="link">${U.address ? t('Edit') : t('Add')}</span></button>
        ${referralTeaser()}
        ${sectionHead(t('Help & ideas'))}
        <div class="card settings">
          <button class="set-row" data-a="support"><span>${ic('mail', 18)} <span><b>${t('Contact support')}</b><small class="muted block">${t('A question about a booking, an order or your account')}</small></span></span>${ic('chevron', 16)}</button>
          <button class="set-row" data-a="feedback"><span>${ic('sparkle', 18)} <span><b>${t('Share feedback or an idea')}</b><small class="muted block">${t('Tell us what to improve or what to build next')}</small></span></span>${ic('chevron', 16)}</button>
        </div>
        ${sectionHead(t('Settings'))}
        <div class="card settings">
          <div class="set-row"><span>${ic('globe', 18)} <span><b>${t('Language')}</b><small class="muted block">${LANG === 'fr' ? 'Français' : 'English'}</small></span></span>${langSwitch()}</div>
          ${pushOk ? `<div class="set-row"><span>${ic('bell', 18)} <span><b>${t('Notifications')}</b><small class="muted block">${t('Rewards, new seasons, referral news')}</small></span></span>
            <button class="switch${U.push ? ' on' : ''}" data-a="push" role="switch" aria-checked="${U.push ? 'true' : 'false'}" aria-label="${t('Notifications')}"><i></i></button></div>` : ''}
          ${U.hasAvatar ? `<button class="set-row" data-a="photo-remove"><span>${ic('trash', 18)} <b>${t('Remove my photo')}</b></span>${ic('chevron', 16)}</button>` : ''}
          <button class="set-row" data-a="logout"><span>${ic('logout', 18)} <b>${t('Log out')}</b></span>${ic('chevron', 16)}</button>
        </div>
        ${sectionHead(t('Miles history'))}
        <div class="card ledger">${S.ledger.slice(0, 25).map((l) => `<div class="led">
          <span><b>${esc(tx(l.label))}</b><small class="muted block">${new Date(l.t).toLocaleDateString(loc(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span>
          <b class="${l.amt > 0 ? 'accent' : ''}">${l.amt > 0 ? '+' : ''}${nf(l.amt)}</b></div>`).join('')}</div>
        ${sectionHead(t('How Skin Miles work'))}
        <div class="card how">
          <p>${t('<b>Daily check-in</b> +20 · bonus at 7, 14, 30, 100 and 365 days')}</p>
          <p>${t('<b>Wellness tip</b> +10 each, daily · <b>Ritual videos</b> +30 to +50 · <b>Skin scan</b> +15')}</p>
          <p>${t('<b>Games</b> Glow Match, Skin Quiz & Glow Wheel, once a day')}</p>
          <p>${t('<b>Orders</b> 1 mile per €1 · <b>Face Glow Bar visits</b> +150, +50 per guest, credited once paid. A refund takes them back.')}</p>
          <p class="muted">${t('Tiers multiply every non-purchase reward: Éclat ×1.1, Rayonnance ×1.25, Lumière ×1.5.')}</p>
        </div>
        <button class="btn-ghost wide mt16 danger" data-a="delete-account">${t('Delete my account')}</button>
        ${B.mode === 'demo' ? `<p class="demo-note">${t('Demo mode: your account lives on this device only.')}</p>` : ''}
      </div><div class="spacer"></div>`;
    },
  };
  const bookPayload = () => ({ studio: ui.bk.studio, party: ui.bk.party.map((p) => ({ service: p.service, name: p.name })), day: ui.bk.day, slot: ui.bk.slot, voucher: ui.bk.voucher });

  /* ---------- Bookings & orders ---------- */
  const STATUS = {
    booked: ['grey', 'Pay at the Face Glow Bar'], pending: ['grey', 'Awaiting payment'], paid: ['ok', 'Paid'],
    refund_requested: ['soft', 'Refund requested'], refunded: ['soft', 'Refunded'], cancelled: ['grey', 'Cancelled'],
  };
  const statusPill = (it) => { const [c, l] = STATUS[it.status] || ['grey', 'Paid']; return `<span class="st-pill ${c}">${t(l)}</span>`; };
  const milesNote = (it) => (it.status === 'paid' || it.status === 'refund_requested' ? t('+{n} Skin Miles credited', { n: nf(it.credited) })
    : it.status === 'refunded' ? (it.credited ? t('{n} Skin Miles deducted', { n: nf(it.credited) }) : t('Refunded'))
    : it.status === 'cancelled' ? t('No miles') : t('+{n} Skin Miles once paid', { n: nf(it.miles || 0) }));
  const whenTxt = (b) => `${longDate(b.startAt || b.date)} · ${slotTxt(b.slot)}`;
  const partyTxt = (b) => (b.people > 1 ? ` · ${t('{n} people', { n: b.people })}` : '');
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function routeLinks(addr) {
    const g = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=transit`;
    const a = `https://maps.apple.com/?daddr=${encodeURIComponent(addr)}&dirflg=r`;
    const link = (href, cls, label) => `<a class="${cls} wide route" href="${href}" target="_blank" rel="noopener">${ic('locate', 16)} ${label}</a>`;
    return isIOS() ? link(a, 'btn-dark', t('Fastest route')) + link(g, 'btn-ghost', t('Open in Google Maps'))
      : link(g, 'btn-dark', t('Fastest route')) + link(a, 'btn-ghost', t('Open in Apple Maps'));
  }
  const upcoming = () => S.bookings.filter((b) => ['booked', 'paid'].includes(b.status) && (b.startAt || 0) > Date.now() - (b.mins || 15) * 60000).sort((a, b) => a.startAt - b.startAt);
  function upcomingSection() {
    const list = upcoming();
    return `${sectionHead(t('Upcoming treatments'))}${list.length ? `<div class="stack">${list.slice(0, 3).map((b) => `<button class="card item-row" data-a="booking" data-arg="${esc(b.id)}">
      <span class="item-ic">${ic(b.people > 1 ? 'users' : 'calendar', 20)}</span>
      <span class="grow"><b class="serif-t block">${esc(b.service)}${b.people > 1 ? ` <small class="muted">+${b.people - 1}</small>` : ''}</b><small class="muted block">${esc(whenTxt(b))}</small><small class="muted block">${esc(b.studio)}</small></span>
      <span class="item-side">${statusPill(b)}<small class="muted">${eur(b.price)}</small></span></button>`).join('')}</div>`
      : `<button class="card empty-row" data-a="tab" data-arg="book">${ic('calendar', 18)} <span>${t('No treatment booked yet. <b>Book a Face Glow Bar session</b>')}</span></button>`}`;
  }
  function purchasesSection() {
    return `${sectionHead(t('Latest purchases'))}${S.orders.length ? `<div class="stack">${S.orders.slice(0, 5).map((o) => `<button class="card item-row" data-a="order" data-arg="${esc(o.id)}">
      <span class="item-ic">${ic('bag', 20)}</span>
      <span class="grow"><b class="block">${esc(o.lines.map((l) => `${l.qty > 1 ? `${l.qty} × ` : ''}${l.name}`).join(', '))}</b><small class="muted block">${new Date(o.t).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' })} · ${esc(o.id)}</small></span>
      <span class="item-side">${statusPill(o)}<small class="muted">${eur(o.total)}</small></span></button>`).join('')}</div>`
      : `<button class="card empty-row" data-a="tab" data-arg="shop">${ic('bag', 18)} <span>${t('No purchase yet. <b>Visit the boutique</b>')}</span></button>`}`;
  }
  function bookingDetail(id, fresh = false) {
    const b = S.bookings.find((x) => x.id === id);
    if (!b) return `<div class="sheet-pad center"><p class="muted">${t('This booking is no longer in your account.')}</p><button class="btn-dark wide mt16" data-a="close">${t('Close')}</button></div>`;
    const canCancel = ['booked', 'paid'].includes(b.status) && b.startAt > Date.now();
    const party = b.party && b.party.length > 1 ? b.party : null;
    return `<div class="sheet-pad">
      <div class="row between"><p class="eyebrow accent">${fresh ? t('See you soon') : t('Your treatment')}</p><button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <h2 class="serif-h sm">${esc(b.service)}${party ? ` <em class="accent">+${party.length - 1}</em>` : ''}</h2>
      ${fresh ? `<p class="muted">${t('Your booking is confirmed.')}${U.emailVerified ? ` ${t('A confirmation email is on its way to {email}.', { email: esc(U.email) })}` : ''}</p>` : ''}
      <div class="card summary mt12">
        <div class="sum-row"><span class="muted">${t('When')}</span><b>${esc(whenTxt(b))}</b></div>
        <div class="sum-row"><span class="muted">${t('Duration')}</span><b>${b.mins || 15} min</b></div>
        <div class="sum-row"><span class="muted">${t('Where')}</span><b>${esc(b.studio)}</b></div>
        <div class="sum-row"><span class="muted">${t('Address')}</span><b>${esc(b.addr || '')}</b></div>
        ${party ? `<hr>${party.map((p, i) => `<div class="sum-row"><span class="muted">${i === 0 ? t('You') : esc(p.name || t('Guest {n}', { n: i }))}</span><b>${esc(p.service)} · ${eur(p.price)}</b></div>`).join('')}` : ''}
        <hr>
        <div class="sum-row"><span class="muted">${t('Price')}</span><b>${eur(b.list)}</b></div>
        ${(b.lines || []).map((l) => `<div class="sum-row"><span class="muted">${esc(tx(l.label))}</span><b class="accent">−${eur(-l.amount)}</b></div>`).join('')}
        <div class="sum-row big"><span>${t('To pay')}</span><b>${eur(b.price)}</b></div>
        <div class="sum-row"><span class="muted">${t('Status')}</span>${statusPill(b)}</div>
        <div class="sum-row"><span class="muted">Skin Miles</span><b>${milesNote(b)}</b></div>
        <div class="sum-row"><span class="muted">${t('Reference')}</span><b>${esc(b.id)}</b></div>
      </div>
      ${['booked', 'paid'].includes(b.status) && b.addr ? `<div class="stack mt12">${routeLinks(b.addr)}</div>
        <p class="muted sm center mt8">${U.push ? t('We will remind you one hour before.') : t('Turn on notifications in your profile to get a reminder one hour before.')}</p>` : ''}
      ${B.mode === 'demo' && b.status === 'booked' ? `<button class="btn-ghost wide mt12" data-a="sim-pay" data-arg="booking:${esc(b.id)}">${t('Simulate payment at the studio (demo)')}</button>` : ''}
      ${canCancel ? `<button class="btn-ghost wide mt8 danger" data-a="cancel-item" data-arg="booking:${esc(b.id)}">${b.status === 'paid' ? t('Request a refund') : t('Cancel this booking')}</button>` : ''}
      <button class="btn-dark wide mt12" data-a="close">${t('Done')}</button></div>`;
  }
  function orderDetail(id, fresh = false) {
    const o = S.orders.find((x) => x.id === id);
    if (!o) return `<div class="sheet-pad center"><p class="muted">${t('This order is no longer in your account.')}</p><button class="btn-dark wide mt16" data-a="close">${t('Close')}</button></div>`;
    return `<div class="sheet-pad">
      <div class="row between"><p class="eyebrow accent">${fresh ? t('Thank you!') : t('Your order')}</p><button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <h2 class="serif-h sm">${fresh ? t('Order received') : t('Order {id}', { id: esc(o.id) })}</h2>
      ${fresh ? `<p class="muted">${t("We'll confirm as soon as your payment goes through. Your Skin Miles are credited at that moment.")}</p>` : ''}
      <div class="card summary mt12">
        ${o.lines.map((l) => `<div class="sum-row"><span>${l.qty} × ${esc(l.name)}</span><b>${eur(Math.round(l.price * l.qty * 100) / 100)}</b></div>`).join('')}
        <hr>
        ${o.discount ? `<div class="sum-row"><span class="muted">${t('Voucher {code}', { code: esc(o.voucher || '') })}</span><b class="accent">−${eur(o.discount)}</b></div>` : ''}
        <div class="sum-row big"><span>${t('Total')}</span><b>${eur(o.total)}</b></div>
        <div class="sum-row"><span class="muted">${t('Status')}</span>${statusPill(o)}</div>
        <div class="sum-row"><span class="muted">Skin Miles</span><b>${milesNote(o)}</b></div>
        <div class="sum-row"><span class="muted">${t('Reference')}</span><b>${esc(o.id)}</b></div>
      </div>
      ${B.mode === 'demo' && o.status === 'pending' ? `<button class="btn-ghost wide mt12" data-a="sim-pay" data-arg="order:${esc(o.id)}">${t('Simulate payment (demo)')}</button>` : ''}
      ${['pending', 'paid'].includes(o.status) ? `<button class="btn-ghost wide mt8 danger" data-a="cancel-item" data-arg="order:${esc(o.id)}">${o.status === 'paid' ? t('Request a refund') : t('Cancel this order')}</button>` : ''}
      <button class="btn-dark wide mt12" data-a="close">${t('Done')}</button></div>`;
  }

  /* ---------- Support & feedback ---------- */
  let myMessages = null;
  const TOPICS = ['Booking', 'Order', 'Account', 'Skin Miles', 'Other'];
  function supportView() {
    const refs = [...upcoming().map((b) => [b.id, `${b.service} · ${whenTxt(b)}`]), ...S.orders.slice(0, 5).map((o) => [o.id, t('Order {id}', { id: o.id })])];
    return `<div class="sheet-pad">
      <div class="row between"><p class="eyebrow accent">${t('Contact support')}</p><button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <h2 class="serif-h sm">${t('How can we <em class="accent">help</em>?')}</h2>
      <p class="muted">${t('We usually answer within one working day, here and by email.')}</p>
      <form class="stack" data-form="support">
        <label class="field" for="supTopic"><span>${t('Topic')}</span><select id="supTopic" name="topic">${TOPICS.map((tp) => `<option value="${tp}">${esc(t(tp))}</option>`).join('')}</select></label>
        ${refs.length ? `<label class="field" for="supRef"><span>${t('About (optional)')}</span><select id="supRef" name="ref"><option value="">—</option>${refs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>` : ''}
        <label class="field" for="supMsg"><span>${t('Your message')}</span><textarea id="supMsg" name="message" rows="5" maxlength="4000" required placeholder="${t('Tell us what happened…')}"></textarea></label>
        <button class="btn-dark wide" type="submit">${t('Send to Seasonly')}</button>
      </form>
      <div id="supList">${supportList()}</div>
    </div>`;
  }
  // Earlier messages load after the sheet opens; only this list is redrawn, so nothing typed is lost.
  function supportList() {
    const mine = (myMessages || []).filter((m) => m.kind === 'support');
    return mine.length ? `${sectionHead(t('Your messages'))}<div class="stack">${mine.slice(0, 5).map((m) => `<div class="card msg">
        <div class="row between"><b>${esc(t(m.topic || 'Other'))}</b><span class="st-pill ${m.reply || m.status === 'resolved' ? 'ok' : 'grey'}">${m.reply ? t('Answered') : m.status === 'resolved' ? t('Resolved') : t('Sent')}</span></div>
        <p class="muted sm">${esc(m.body)}</p>${m.reply ? `<p class="reply"><b>Seasonly :</b> ${esc(m.reply)}</p>` : ''}</div>`).join('')}</div>` : '';
  }
  let fbKind = 'feedback', fbRating = 0;
  function feedbackView() {
    return `<div class="sheet-pad">
      <div class="row between"><p class="eyebrow accent">${t('Your voice')}</p><button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <h2 class="serif-h sm">${t('Help us <em class="accent">grow</em>')}</h2>
      <form class="stack" data-form="feedback">
        <div class="seg-btns" role="radiogroup" aria-label="${t('Type')}">
          <button type="button" class="${fbKind === 'feedback' ? 'on' : ''}" data-a="fb-kind" data-arg="feedback" role="radio" aria-checked="${fbKind === 'feedback'}">${t('Feedback')}</button>
          <button type="button" class="${fbKind === 'idea' ? 'on' : ''}" data-a="fb-kind" data-arg="idea" role="radio" aria-checked="${fbKind === 'idea'}">${t('Feature idea')}</button>
        </div>
        ${fbKind === 'feedback' ? `<div class="stars" role="radiogroup" aria-label="${t('Rating')}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= fbRating ? 'on' : ''}" data-a="fb-star" data-arg="${n}" aria-label="${tn('{n} star', '{n} stars', n)}">${ic('star', 26, 1.6)}</button>`).join('')}</div>` : ''}
        <label class="field" for="fbMsg"><span>${fbKind === 'idea' ? t('What should we build next?') : t('What do you like, what can we do better?')}</span>
          <textarea id="fbMsg" name="message" rows="5" maxlength="4000" required placeholder="${fbKind === 'idea' ? t('I would love to…') : t('I enjoyed…')}"></textarea></label>
        <button class="btn-dark wide" type="submit">${t('Send')}</button>
      </form></div>`;
  }

  /* ---------- Contests & gifts ---------- */
  let CONTESTS = null, GIFTS = null, COLLABS = null;
  const PERIOD_LABEL = { week: 'Contest of the week', month: 'Contest of the month', year: 'Contest of the year' };
  const cTitle = (c) => (LANG === 'en' ? c.titleEn || c.title : c.title || c.titleEn);
  const cDesc = (c) => (LANG === 'en' ? c.descriptionEn || c.description : c.description || c.descriptionEn);
  const daysLeft = (tm) => { const d = Math.ceil((tm - Date.now()) / 864e5); return d <= 0 ? t('Ends today') : d === 1 ? t('Ends tomorrow') : t('{n} days left', { n: d }); };
  // The home banner: the open contest, impossible to miss, with the animated prize box.
  function contestHero() {
    const c = (CONTESTS || []).find((x) => x.status === 'open');
    if (!c) return '';
    return `<button class="contest-hero${c.entered ? ' in' : ''}" data-a="goto" data-arg="rewards:contests">
      <span class="ch-shine" aria-hidden="true"></span>
      <span class="ch-icon">${prizeIcon(54)}</span>
      <span class="grow"><span class="eyebrow">${t(PERIOD_LABEL[c.period] || 'Contest')} · ${daysLeft(c.endsAt)}</span>
        <b class="serif-t block">${esc(cTitle(c))}</b>
        <small>${c.entered ? t("You're in the draw. Good luck!") : t('Free to enter · {n} already in', { n: nf(c.entries) })}</small></span>
      <span class="ch-cta">${c.entered ? ic('check', 16, 2.4) : t('Enter')}</span></button>`;
  }
  function contestList() {
    if (!CONTESTS) return `<p class="muted sm">${t('Loading contests…')}</p>`;
    if (!CONTESTS.length) return `<div class="card empty-row">${ic('gift', 18)} <span>${t('No contest running right now. New ones are announced by notification.')}</span></div>`;
    return `<div class="stack">${CONTESTS.map((c) => `<article class="contest card${c.status === 'open' ? ' is-open' : ''}">
      <div class="row between g8"><span class="st-pill soft">${esc(t(PERIOD_LABEL[c.period] || 'Contest'))}</span><small class="${c.status === 'open' ? 'countdown' : 'muted'}">${c.status === 'open' ? daysLeft(c.endsAt) : t('Winner drawn')}</small></div>
      <div class="row g12 mt8">${c.status === 'open' ? `<span class="contest-ic">${prizeIcon(44)}</span>` : ''}<h3 class="serif-t grow">${esc(cTitle(c))}</h3></div>
      ${cDesc(c) ? `<p class="muted sm">${esc(cDesc(c))}</p>` : ''}
      <div class="row between g8 mt8"><span class="prize">${ic(c.prizeKind === 'soin' ? 'calendar' : 'gift', 16)} ${esc(c.prizeLabel)}${c.winners > 1 ? ` · ${tn('{n} winner', '{n} winners', c.winners)}` : ''}</span><small class="muted">${tn('{n} entered', '{n} entered', c.entries, { n: nf(c.entries) })}</small></div>
      ${c.status === 'open' ? (c.entered ? `<p class="entered">${ic('check', 14, 2.4)} ${t("You're in. Good luck!")}</p>` : `<button class="btn-dark wide mt12 pulse" data-a="enter-contest" data-arg="${c.id}">${t('Enter the contest')}</button>`)
        : c.won ? `<p class="entered won">${ic('trophy', 14)} ${t('You won! Your prize is in My gifts.')}</p>` : `<p class="muted sm mt8">${t('Winner: {names}', { names: esc(c.winnerNames.join(', ')) })}</p>`}
    </article>`).join('')}</div>`;
  }
  const GIFT_STATUS = { available: ['ok', 'Ready to book'], used: ['grey', 'Used'], expired: ['grey', 'Expired'], to_ship: ['soft', 'Preparing shipment'], shipped: ['ok', 'Shipped'], needs_address: ['soft', 'Add your address'] };
  const giftSource = (g) => (g.contest ? t('You won “{title}”', { title: pick(g.contest) }) : tx(g.source || 'A gift from the Seasonly team'));
  function giftList() {
    if (!GIFTS) return `<p class="muted sm">${t('Loading…')}</p>`;
    if (!GIFTS.length) return `<button class="card empty-row" data-a="goto" data-arg="rewards:contests">${ic('gift', 18)} <span>${t("No gift yet. <b>Enter this week's contest</b>")}</span></button>`;
    return `<div class="stack">${GIFTS.map((g) => { const [c, l] = GIFT_STATUS[g.status] || ['grey', 'Used']; return `<div class="card gift">
      <span class="item-ic">${ic(g.kind === 'soin' ? 'calendar' : 'gift', 20)}</span>
      <span class="grow"><b class="block">${esc(g.label)}</b><small class="muted block">${esc(giftSource(g))}</small>
        ${g.kind === 'soin' && g.status === 'available' ? `<small class="block mt4">${t('Free treatment voucher')} <span class="code">${esc(g.code)}</span></small>` : ''}
        ${g.kind === 'product' && g.address ? `<small class="muted block mt4">${t('To {addr}', { addr: esc(`${g.address.line1}, ${g.address.postcode} ${g.address.city}`) })}</small>` : ''}</span>
      <span class="item-side"><span class="st-pill ${c}">${t(l)}</span>${g.kind === 'soin' && g.status === 'available' ? `<button class="btn-dark xs" data-a="use-service">${t('Book')}</button>` : ''}</span></div>`; }).join('')}</div>`;
  }
  async function loadContests() {
    try { CONTESTS = await B.contests(); } catch { CONTESTS = []; }
    const el = $('#contestList'); if (el) el.innerHTML = contestList();
    const h = $('#contestHero'); if (h) h.innerHTML = contestHero();
    const tab = tabbar.querySelector('[data-arg="rewards"]');
    if (tab && U) { const has = !!tab.querySelector('.tab-prize'); if (has !== !!openContest()) rerender(); }
  }
  async function loadGifts() {
    try { GIFTS = await B.gifts(); } catch { GIFTS = []; }
    const el = $('#giftList'); if (el) el.innerHTML = giftList();
  }

  /* ---------- Collabs ---------- */
  const coT = (c) => pick({ fr: c.fr, en: c.en }) || {};
  function collabCard(c) {
    const x = coT(c);
    return `<button class="collab-card" data-a="collab" data-arg="${c.id}" style="--co:${esc(c.color || '#C4806C')}">
      ${c.image ? `<span class="co-img" style="background-image:url('${esc(c.image)}')"></span>` : '<span class="co-pattern" aria-hidden="true"></span>'}
      <span class="co-lock"><span class="logo sm">seasonly</span><i>×</i><b>${esc(c.partner)}</b></span>
      <span class="co-body"><span class="co-kind">${c.kind === 'event' ? `${ic('calendar', 12, 2)} ${t('Event')}${x.when ? ` · ${esc(x.when)}` : ''}` : `${ic('sparkle', 12, 2)} ${t('Collab')}`}</span>
        <span class="serif-t block">${esc(x.title)}</span><small>${esc(x.subtitle || '')}</small></span></button>`;
  }
  function collabList() {
    if (!COLLABS || !COLLABS.length) return '';
    return `${sectionHead(t('Collabs & events'))}<div class="hscroll collabs flush">${COLLABS.map(collabCard).join('')}</div>`;
  }
  async function loadCollabs() {
    try { COLLABS = await B.collabs(); } catch { COLLABS = []; }
    const el = $('#collabList'); if (el) el.innerHTML = collabList();
  }
  function collabView(id) {
    const c = (COLLABS || []).find((x) => x.id === id);
    if (!c) return `<div class="sheet-pad center"><p class="muted">${t('This collaboration has ended.')}</p><button class="btn-dark wide mt16" data-a="close">${t('Close')}</button></div>`;
    const x = coT(c);
    const left = c.capacity ? Math.max(0, c.capacity - c.registrations) : null;
    return `<div class="collab-view" style="--co:${esc(c.color || '#C4806C')}">
      <div class="co-hero">${c.image ? `<span class="co-img" style="background-image:url('${esc(c.image)}')"></span>` : '<span class="co-pattern" aria-hidden="true"></span>'}
        <button class="icon-glass light" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button>
        <span class="co-lock big"><span class="logo">seasonly<small>PARIS</small></span><i>×</i><b>${esc(c.partner)}</b></span></div>
      <div class="sheet-pad">
        <p class="eyebrow accent">${c.kind === 'event' ? t('Event') : t('Collab')}</p>
        <h2 class="serif-h sm">${esc(x.title)}</h2>
        ${x.subtitle ? `<p class="serif-t muted">${esc(x.subtitle)}</p>` : ''}
        <p class="muted">${esc(x.body || '')}</p>
        ${c.kind === 'event' ? `<div class="card summary mt12">
          ${x.when ? `<div class="sum-row"><span class="muted">${t('When')}</span><b>${esc(x.when)}</b></div>` : ''}
          ${c.place ? `<div class="sum-row"><span class="muted">${t('Where')}</span><b>${esc(c.place)}</b></div>` : ''}
          ${left !== null ? `<div class="sum-row"><span class="muted">${t('Places')}</span><b>${c.full && !c.registered ? t('Full') : tn('{n} place left', '{n} places left', left)}</b></div>` : ''}</div>` : ''}
        ${x.offer ? `<p class="ref-banner mt12">${ic('gift', 16)} <span>${esc(x.offer)}</span></p>` : ''}
        ${c.code ? `<div class="ref-code mt12"><span class="code big">${esc(c.code)}</span><button class="btn-ghost xs" data-a="copy" data-arg="${esc(c.code)}">${ic('copy', 14)} ${t('Copy')}</button></div>` : ''}
        ${c.rsvp ? (c.registered ? `<p class="entered mt12">${ic('check', 14, 2.4)} ${t("You're registered. See you there!")}</p><button class="btn-ghost wide mt8" data-a="collab-join" data-arg="${c.id}:0">${t('Cancel my registration')}</button>`
          : `<button class="btn-dark wide mt16" data-a="collab-join" data-arg="${c.id}:1" ${c.full ? 'disabled' : ''}>${c.full ? t('Full') : esc(x.cta || t('Register'))}</button>`) : ''}
        ${c.link ? `<a class="${c.rsvp ? 'btn-ghost' : 'btn-dark'} wide mt8 route" href="${esc(c.link)}" target="_blank" rel="noopener">${ic('link', 16)} ${esc(c.rsvp ? t('Learn more') : x.cta || t('Learn more'))}</a>` : ''}
        ${c.place && c.kind === 'event' ? `<div class="stack mt8">${routeLinks(c.place.replace(/^[^·]*·\s*/, ''))}</div>` : ''}
      </div></div>`;
  }

  /* ---------- Referral ---------- */
  const refRules = () => CONFIG.referral || E.DEFAULT_REFERRAL;
  function referralTeaser() {
    const r = refRules();
    return `<button class="ref-teaser" data-a="goto" data-arg="rewards:invite">${ic('users', 20)}
      <span><b>${t('Invite a friend, get up to {cap}% off', { cap: r.cap })}</b><small>${t('{p}% off your next treatment for each friend who comes in', { p: r.perFriend })}</small></span>${ic('chevron', 16)}</button>`;
  }
  function refBanner() {
    const parts = [];
    if (S.referral.welcome && !S.bookings.length) parts.push(t('your −{n}% welcome offer', { n: S.referral.welcome }));
    if (S.referral.discount) parts.push(t('your −{n}% referral reward', { n: S.referral.discount }));
    const text = parts.join(t(' and '));
    return parts.length ? `<p class="ref-banner">${ic('gift', 16)} <span>${t('{what} will apply when you confirm.', { what: text[0].toUpperCase() + text.slice(1) })}</span></p>` : '';
  }
  function referralCard() {
    const r = refRules();
    const steps = Array.from({ length: Math.ceil(r.cap / r.perFriend) }, (_, i) => (i + 1) * r.perFriend <= S.referral.discount);
    return `${sectionHead(t('Invite friends'))}
      <section class="card referral">
        <p class="muted sm">${t('Your friend gets <b>{w}% off</b> their first Face Glow Bar treatment. When they confirm their mobile number and pay for their first treatment, you get <b>{p}% off</b> your next booking, up to <b>{cap}%</b>, plus 200 Skin Miles.', { w: r.welcome, p: r.perFriend, cap: r.cap })}</p>
        <div class="ref-code"><span class="code big">${esc(U.referralCode || S.referral.code)}</span>
          <button class="btn-ghost xs" data-a="copy-ref">${ic('copy', 14)} ${t('Copy')}</button><button class="btn-dark xs" data-a="share-ref">${ic('share', 14)} ${t('Share')}</button></div>
        <div class="ref-steps">${steps.map((on, i) => `<span class="${on ? 'on' : ''}">−${(i + 1) * r.perFriend}%</span>`).join('')}</div>
        <p class="sm">${tn('<b>{n}</b> friend has come in', '<b>{n}</b> friends have come in', S.referral.friends)} · ${S.referral.discount ? t('current reward <b class="accent">−{n}%</b> on your next booking', { n: S.referral.discount }) : t('your reward starts with the first friend who comes in')}</p>
      </section>`;
  }
  const refLink = () => `${location.origin}${location.pathname}#ref-${U.referralCode || S.referral.code}`;
  const refText = () => t('Join me on Seasonly and get {w}% off your first Face Glow Bar treatment. My code: {code}', { w: refRules().welcome, code: U.referralCode || S.referral.code });

  /* ---------- Streak ---------- */
  const DAYS = { fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'], en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] };
  const nextMilestone = () => Object.keys(E.MILESTONES).map(Number).find((m) => m > S.streak) || '∞';
  function weekRow(celebrate = false) {
    const now = new Date(), dow = (now.getDay() + 6) % 7, monday = E.addDays(now, -dow);
    return `<div class="weekrow${celebrate ? ' cel' : ''}">${DAYS[LANG].map((d, i) => {
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
  // Streak screen in the app's own look: cream, serif numeral, terracotta ring.
  function celebrate(amt) {
    const msgs = { 1: 'A fresh start. Your skin loves consistency.', 7: 'One full week of rituals. Your glow is showing.', 30: 'A whole month of care. You are a model of perseverance.', 365: 'A whole year of wellbeing: you are a model of perseverance!' };
    const msg = msgs[S.streak] ? t(msgs[S.streak]) : S.streak % 7 === 0 ? t('{n} weeks in a row. Magnificent.', { n: S.streak / 7 }) : t('Every day counts. Come back tomorrow to keep your streak.');
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
        <p class="eyebrow accent">${t('Day streak')}</p>
        <h2 class="serif-h cel-title"><em>${S.streak === 1 ? t('day in a row') : t('days in a row')}</em></h2>
        <span class="pill-accent big">+${nf(amt)} Skin Miles</span>
        <div class="card glass cel-card">${weekRow(true)}<p class="muted center">${msg}</p>
          <p class="sm center">${target > S.streak ? t('Next bonus at <b>{n} days</b>', { n: target }) : t('You reached the top milestone')}</p></div>
      </div>
      <button class="btn-dark wide" data-a="close">${t('Continue')}</button>
    </div>`, 'full plain');
  }

  /* ---------- Vouchers ---------- */
  const kindLabel = (v) => (v.kind === 'service' ? t('Treatment') : t('Product'));
  function voucherCard(v, active) {
    const afford = S.miles >= v.cost;
    return `<div class="voucher${active ? '' : ' locked'}">
      <div class="v-left"><span class="v-kind">${kindLabel(v)}</span>${ic(v.kind === 'service' ? 'calendar' : 'bag', 22)}</div>
      <div class="v-body"><b>${esc(vTitle(v))}</b><small class="muted block">${esc(vNote(v))}</small><span class="v-cost">${ic('star', 13, 2)} ${nf(v.cost)} miles</span></div>
      ${active ? `<button class="btn-dark xs" data-a="redeem" data-arg="${v.id}" ${afford ? '' : 'disabled'}>${afford ? t('Redeem') : t('{n} to go', { n: nf(v.cost - S.miles) })}</button>` : `<span class="lock">${ic('lock', 16)}</span>`}
    </div>`;
  }
  function myVoucher(v) {
    return `<div class="voucher mine">
      <div class="v-left"><span class="v-kind">${kindLabel(v)}</span>${ic('ticket', 22)}</div>
      <div class="v-body"><b>${esc(vTitle(v))}</b><small class="muted block">${v.kind === 'service' ? t('Use when booking · until {date}', { date: fmtDate(v.expires) }) : t('Use in your bag · until {date}', { date: fmtDate(v.expires) })}</small><span class="code">${v.code}</span></div>
      <button class="btn-ghost xs" data-a="${v.kind === 'service' ? 'use-service' : 'bag'}">${t('Use')}</button></div>`;
  }
  function redeem(id) {
    const v = E.VOUCHERS.find((x) => x.id === id);
    if (!v || S.miles < v.cost) return;
    openSheet(`<div class="sheet-pad">
      <p class="eyebrow accent">${t('Redeem voucher')}</p><h2 class="serif-h sm">${esc(vTitle(v))}</h2>
      <p class="muted">${esc(vNote(v))}. ${t('Valid until {date}.', { date: fmtDate(E.seasonOf(today()).end) })}</p>
      <div class="card row between mt16"><span class="muted">${t('Cost')}</span><b>${nf(v.cost)} miles</b></div>
      <div class="card row between mt8"><span class="muted">${t('Balance after')}</span><b>${nf(S.miles - v.cost)} miles</b></div>
      <button class="btn-dark wide mt16" data-a="redeem-ok" data-arg="${v.id}">${t('Confirm redemption')}</button>
      <button class="btn-ghost wide mt8" data-a="close">${t('Not now')}</button></div>`);
  }
  async function redeemOk(id) {
    let out;
    try { out = await act('redeem', { id }); } catch { return closeSheet(); }
    const v = out.result.voucher;
    openSheet(`<div class="sheet-pad center">
      <div class="ticket-big">${ic('ticket', 40, 1.3)}</div>
      <p class="eyebrow accent mt16">${t('Voucher unlocked')}</p><h2 class="serif-h sm">${esc(vTitle(v))}</h2>
      <div class="code big">${v.code}</div>
      <p class="muted">${v.kind === 'service' ? t('Saved in Rewards → My vouchers. Use it at the confirm step when you book a treatment.') : t('Saved in Rewards → My vouchers. Use it at checkout in your bag.')}</p>
      <button class="btn-dark wide mt16" data-a="${v.kind === 'service' ? 'use-service' : 'bag'}">${v.kind === 'service' ? t('Book a treatment') : t('Open my bag')}</button>
      <button class="btn-ghost wide mt8" data-a="close">${t('Done')}</button></div>`);
    rerender();
  }

  /* ---------- Bag ---------- */
  let bagVoucher = null;
  function addToBag(id) {
    const b = bag.get(), line = b.find((l) => l.id === id);
    if (line) line.qty += 1; else b.push({ id, qty: 1 });
    bag.set(b);
    toast(t('Added to bag'), product(id).name, 'bag');
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
      <div class="row between"><div><p class="eyebrow accent">${t('Your bag')}</p><h2 class="serif-h sm">${t('The basket')}</h2></div>
        <button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      ${lines.length ? `<div class="stack mt16">${lines.map((l) => `<div class="bag-line card">
          <span class="bag-thumb" style="background:${esc(l.p.bg)}">${productVisual(l.p)}</span>
          <span class="grow"><b>${esc(l.p.name)}</b><small class="muted block">${esc(sizeTxt(l.p.size))} · ${eur(l.p.price)}</small></span>
          <span class="qty"><button data-a="qty" data-arg="${esc(l.id)}:-1" aria-label="${t('Less')}">${ic('minus', 14, 2)}</button><b>${l.qty}</b><button data-a="qty" data-arg="${esc(l.id)}:1" aria-label="${t('More')}">${ic('plus', 14, 2)}</button></span></div>`).join('')}</div>
        ${usable.length ? `<p class="eyebrow muted mt16">${t('Skin Miles vouchers')}</p><div class="v-pick">${usable.map((x) => `<button class="v-opt${bagVoucher === x.code ? ' on' : ''}" data-a="bag-voucher" data-arg="${x.code}">${ic('ticket', 16)} ${esc(vTitle(x))}</button>`).join('')}</div>`
          : `<button class="hint card mt16" data-a="go-rewards">${ic('gift', 18)} <span>${t('Have miles? Redeem a seasonal voucher in Rewards →')}</span></button>`}
        <div class="card summary mt16">
          <div class="sum-row"><span class="muted">${t('Subtotal')}</span><b>${eur(subtotal)}</b></div>
          ${disc ? `<div class="sum-row"><span class="muted">${t('Voucher {code}', { code: v.code })}</span><b class="accent">−${eur(disc)}</b></div>` : ''}
          <div class="sum-row"><span class="muted">${t('Delivery')}</span><b>${subtotal >= 69 ? t('Free') : t('Free from {amount}', { amount: eur(69) })}</b></div>
          <div class="sum-row big"><span>${t('Total')}</span><b>${eur(total)}</b></div>
        </div>
        <p class="muted sm center mt12">${t('{n} Skin Miles are credited once your payment is confirmed.', { n: nf(Math.floor(total)) })}</p>
        <button class="btn-dark wide mt12" data-a="checkout" ${ui.busy ? 'disabled' : ''}>${t('Place my order · {amount}', { amount: eur(total) })}</button>`
      : `<div class="empty-bag"><span>${ic('bag', 36, 1.2)}</span><p class="serif-t">${t('Your bag is empty')}</p><p class="muted sm">${t('Every €1 you spend earns 1 Skin Mile.')}</p>
         <button class="btn-dark mt16" data-a="go-shop">${t('Visit the boutique')}</button></div>`}
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
    openSheet(() => orderDetail(o.id, true));
    rerender();
  }

  /* ---------- Product detail ---------- */
  function productView(id) {
    const p = product(id);
    if (!p) return `<div class="sheet-pad">${t('This product is no longer available.')}</div>`;
    const fav = S.favs.includes(id);
    const stats = pStats(p);
    return `<div class="pdp">
      <div class="pdp-hero" style="background:${esc(p.bg)}">
        <div class="row between pdp-bar"><button class="icon-glass light" data-a="close" aria-label="${t('Back')}">${ic('back', 18)}</button>
          <div class="row g8"><button class="icon-glass light" data-a="share" aria-label="${t('Share')}">${ic('share', 18)}</button>
          <button class="icon-glass light${fav ? ' fav' : ''}" data-a="fav" data-arg="${esc(p.id)}" aria-label="${t('Favourite')}">${ic('heart', 18)}</button></div></div>
        <div class="row g6 pdp-badges">${p.badge ? `<span class="pill-dark">★ ${esc(badgeLabel(p.badge))}</span>` : ''}<span class="pill-light">${t('Clean & vegan')}</span></div>
        ${productVisual(p, true)}
        ${p.size ? `<span class="size-pill">${esc(sizeTxt(p.size))}</span>` : ''}
      </div>
      <div class="pdp-body">
        <p class="eyebrow accent">${esc(catName(p.cat))}${p.tags && p.tags[0] ? ` · ${esc(catName(p.tags[0]))}` : ''}</p>
        <h1 class="serif-h">${esc(p.name)}<br><em>${esc(pSub(p))}</em></h1>
        <p class="muted">${esc(pDesc(p))}</p>
        ${stats && stats.length ? `<div class="pstats card">${stats.map(([v, l]) => `<span><b class="serif-t">${esc(v)}</b><small class="muted">${esc(l)}</small></span>`).join('')}</div>` : ''}
        <div class="earn-note">${ic('star', 16)} ${t('Earn <b>{n} Skin Miles</b> with this purchase', { n: Math.floor(p.price) })}</div>
      </div>
      <div class="buybar glass">
        <div><b class="serif-t">${eur(p.price)}</b>${p.compareAt ? ` <s class="muted">${eur(p.compareAt)}</s>` : ''}<small class="muted block">${esc(sizeTxt(p.size || '').toUpperCase())}</small></div>
        <button class="btn-dark" data-a="add-close" data-arg="${esc(p.id)}">${t('Add — bag')}</button>
      </div></div>`;
  }

  /* ---------- Rituals: guided videos with sound ---------- */
  // Each ritual plays as a short video: an animated face shows the movement of each step while a voice
  // reads the instructions over a soft ambient sound. A video uploaded in the admin panel replaces it.
  // The Skin Miles are credited when the video reaches its end.
  function ritualsList() {
    return `<div class="sheet-pad">
      <div class="row between"><div><p class="eyebrow accent">${t('Rituals')}</p><h2 class="serif-h sm">${t('Guided <em class="accent">videos</em>')}</h2></div>
        <button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <p class="muted sm">${t('Watch, listen and follow along. Your miles are credited at the end of each video.')}</p>
      <div class="stack mt16">${E.RITUALS.map((r) => `<button class="card ritual-card" data-a="ritual" data-arg="${r.id}">
        <span class="rit-thumb${doneToday('ritual-' + r.id) ? ' done' : ''}">${ic(doneToday('ritual-' + r.id) ? 'check' : 'play', 18, doneToday('ritual-' + r.id) ? 2.4 : 1.6)}</span>
        <span class="grow"><span class="eyebrow accent block">${ritEyebrow(r)}</span><span class="serif-t block">${ritName(r)}</span>
        <small class="muted">${t('Video · {m} min', { m: Math.ceil(videoSecs(r) / 60) })} · ${tn('{n} step', '{n} steps', r.steps.length)} · ${doneToday('ritual-' + r.id) ? t('earned today') : `+${r.miles} miles`}</small></span>
        <span class="round-dark">${ic('play', 12)}</span></button>`).join('')}</div></div>`;
  }
  const videoUrl = (id) => (CONFIG.ritualVideos || {})[id] || null;
  const videoSecs = (r) => E.ritualSecs(r);
  let RV = null; // the ritual video being played
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const stepAt = (r, sec) => { let acc = 0; for (let i = 0; i < r.steps.length; i++) { acc += r.steps[i][2]; if (sec < acc) return i; } return r.steps.length - 1; };
  const stepStart = (r, i) => r.steps.slice(0, i).reduce((a, st) => a + st[2], 0);

  // Movement drawn on the face for each kind of step (face is 200 × 230, centre x = 100).
  function motionLayer(move) {
    const tool = (id, d, dur = 2.6, cls = 'stone') => `<path id="${id}" class="trail" d="${d}"/><g class="${cls}"><ellipse rx="${cls === 'stone' ? 9 : 5.5}" ry="${cls === 'stone' ? 4.2 : 5.5}"/><animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}"/></animateMotion></g>`;
    const both = (d, d2, dur, cls) => tool('mpL', d, dur, cls) + tool('mpR', d2, dur, cls);
    switch (move) {
      case 'circles': return `<path id="mpL" class="trail" d="M60 128a12 12 0 1 0 24 0a12 12 0 1 0 -24 0"/><path id="mpR" class="trail" d="M140 128a12 12 0 1 0 -24 0a12 12 0 1 0 24 0"/>
        <g class="finger"><circle r="5.5"/><animateMotion dur="1.8s" repeatCount="indefinite"><mpath href="#mpL"/></animateMotion></g><g class="finger"><circle r="5.5"/><animateMotion dur="1.8s" repeatCount="indefinite"><mpath href="#mpR"/></animateMotion></g>`;
      case 'press': return '<g class="palm l"><ellipse cx="70" cy="128" rx="17" ry="22"/></g><g class="palm r"><ellipse cx="130" cy="128" rx="17" ry="22"/></g>';
      case 'sweep': return both('M94 178 Q68 170 50 122', 'M106 178 Q132 170 150 122', 2.4);
      case 'lift': return both('M68 168 Q50 132 58 82', 'M132 168 Q150 132 142 82', 2.6);
      case 'jaw': return both('M98 182 Q70 178 50 140', 'M102 182 Q130 178 150 140', 2.2, 'finger');
      case 'neck': return both('M84 192 L80 226', 'M116 192 L120 226', 1.8, 'finger');
      case 'eyes': return both('M89 108 L65 104', 'M111 108 L135 104', 1.6, 'finger');
      case 'tap': return [[70, 126], [130, 126], [100, 62], [82, 70], [118, 70], [62, 112], [138, 112]].map(([x, y], i) => `<circle class="tapdot" cx="${x}" cy="${y}" r="4.5" style="animation-delay:${i * 0.18}s"/>`).join('');
      case 'breathe': return '<circle class="breath" cx="100" cy="118" r="70"/><g class="palm l"><ellipse cx="78" cy="100" rx="15" ry="11"/></g><g class="palm r"><ellipse cx="122" cy="100" rx="15" ry="11"/></g>';
      case 'rinse': return [60, 85, 110, 135, 150].map((x, i) => `<path class="droplet" d="M${x} 40c0 0-5 7-5 10a5 5 0 0 0 10 0c0-3-5-10-5-10Z" style="animation-delay:${i * 0.35}s"/>`).join('');
      default: return '';
    }
  }
  const FACE = `<defs><radialGradient id="skinG" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#F8EBE2"/><stop offset="1" stop-color="#EBD3C4"/></radialGradient></defs>
    <path class="hair" d="M40 112C34 52 70 22 104 24c38 2 64 32 58 90-4-26-18-44-34-50-22 8-52 10-74 6-8 10-12 26-14 42Z"/>
    <path class="neck" d="M80 186v40M120 186v40"/><path class="shoulders" d="M30 232c8-16 30-20 50-22M170 232c-8-16-30-20-50-22"/>
    <path class="face" d="M100 40c34 0 56 26 56 66 0 46-28 80-56 80s-56-34-56-80c0-40 22-66 56-66Z"/>
    <path class="feat" d="M74 104q10 6 20 0M106 104q10 6 20 0"/><path class="feat" d="M100 108v22q-2 6 4 6"/><path class="feat lips" d="M88 152q12 8 24 0"/>
    <path class="feat soft" d="M70 92q10-6 22-2M108 90q12-4 22 2"/>`;
  function ritualView(id) {
    const r = E.RITUALS.find((x) => x.id === id);
    if (!RV || RV.id !== id) RV = { id, r, t: 0, playing: false, started: false, finished: false, sound: true, step: -1, earned: null };
    const v = videoUrl(id);
    const total = videoSecs(r), i = stepAt(r, RV.t), [title, how] = ritStep(r, i);
    const practice = doneToday('ritual-' + id) && !RV.finished;
    return `<div class="rv${RV.playing ? ' playing' : ''}${RV.finished ? ' ended' : ''}">
      <div class="row between rv-head"><button class="icon-btn" data-a="rituals" aria-label="${t('Back')}">${ic('back', 18)}</button>
        <span class="muted sm">${practice ? t('Practice mode · miles already earned today') : t('+{n} miles at the end of the video', { n: r.miles })}</span>
        <button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
      <p class="eyebrow accent mt8">${ritEyebrow(r)}</p><h2 class="serif-h sm">${ritName(r)}</h2>
      ${v ? `<div class="rv-stage real"><video id="rvVideo" src="${esc(v)}" playsinline controls preload="metadata"></video></div>`
        : `<div class="rv-stage" id="rvStage">
        <svg class="rv-face" viewBox="0 0 200 232" aria-hidden="true">${FACE}<g id="rvMotion">${motionLayer(r.steps[i][3])}</g></svg>
        <div class="rv-title"><small id="rvStepN">${t('Step {n} of {total}', { n: i + 1, total: r.steps.length })}</small><b id="rvStepT">${esc(title)}</b></div>
        <button class="rv-big" data-a="rv-toggle" aria-label="${RV.playing ? t('Pause') : t('Play')}">${ic(RV.playing ? 'pause' : 'play', 30)}</button>
        ${RV.finished ? `<div class="rv-end"><div class="ticket-big">${ic('sparkle', 36, 1.3)}</div><p class="eyebrow accent">${t('Ritual complete')}</p>
          <b class="serif-t">${RV.earned ? `+${RV.earned} Skin Miles` : t('Beautiful work.')}</b></div>` : ''}
      </div>
      <div class="rv-bar"><div class="rv-prog" id="rvProg">${r.steps.map((st, k) => `<span style="flex:${st[2]}"><i style="width:${Math.min(100, Math.max(0, ((RV.t - stepStart(r, k)) / st[2]) * 100))}%"></i></span>`).join('')}</div>
        <span class="rv-time"><b id="rvTime">${fmtSecs(RV.t)}</b> / ${fmtSecs(total)}</span></div>
      <div class="row g8 rv-ctrl">
        <button class="btn-dark grow" data-a="rv-toggle" id="rvPlay">${RV.finished ? `${ic('play', 14)} ${t('Watch again')}` : RV.playing ? `${ic('pause', 14)} ${t('Pause')}` : `${ic('play', 14)} ${RV.t ? t('Resume') : t('Play the video')}`}</button>
        <button class="btn-ghost" data-a="rv-sound" aria-pressed="${RV.sound}" aria-label="${RV.sound ? t('Turn sound off') : t('Turn sound on')}" id="rvSound">${ic(RV.sound ? 'sound' : 'mute', 18)}</button></div>
      <p class="how rv-cap" id="rvHow" aria-live="polite">${esc(how)}</p>`}
      <ol class="rv-chapters">${r.steps.map((_, k) => { const [tt, hh] = ritStep(r, k); return `<li class="${k < i || RV.finished ? 'done' : k === i ? 'on' : ''}" data-step="${k}"><b>${esc(tt)}</b><small class="muted">${esc(hh)}</small></li>`; }).join('')}</ol>
      ${RV.finished ? `<button class="btn-dark wide mt12" data-a="close">${t('Continue')}</button>` : ''}
    </div>`;
  }
  // Sound: a soft pad from the Web Audio API, a chime between steps, and the steps read aloud.
  const AU = { ctx: null, master: null };
  function audioOn() {
    try {
      if (!AU.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
        AU.ctx = new Ctx(); AU.master = AU.ctx.createGain(); AU.master.gain.value = 0;
        const lp = AU.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(AU.master); AU.master.connect(AU.ctx.destination);
        [196, 246.94, 293.66, 392].forEach((f, k) => {
          const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(), lfo = AU.ctx.createOscillator(), lg = AU.ctx.createGain();
          o.type = 'sine'; o.frequency.value = f; o.detune.value = (k - 1.5) * 4; g.gain.value = 0.18;
          lfo.frequency.value = 0.07 + k * 0.03; lg.gain.value = 0.1; lfo.connect(lg); lg.connect(g.gain);
          o.connect(g); g.connect(lp); o.start(); lfo.start();
        });
      }
      AU.ctx.resume();
      AU.master.gain.setTargetAtTime(RV && RV.sound ? 0.09 : 0, AU.ctx.currentTime, 0.6);
    } catch { /* no audio on this device */ }
  }
  function audioOff(close = false) {
    try {
      if (!AU.ctx) return;
      AU.master.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.2);
      if (close) { const c = AU.ctx; AU.ctx = null; setTimeout(() => c.close().catch(() => {}), 400); }
    } catch { /* ignore */ }
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch { /* ignore */ }
  }
  function chime() {
    try {
      if (!AU.ctx || !RV || !RV.sound) return;
      [880, 1318.5].forEach((f, k) => {
        const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(), at = AU.ctx.currentTime + k * 0.12;
        o.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.12, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
        o.connect(g); g.connect(AU.ctx.destination); o.start(at); o.stop(at + 1.5);
      });
    } catch { /* ignore */ }
  }
  function speak(text) {
    try {
      if (!RV || !RV.sound || !window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB'; u.rate = 0.92; u.pitch = 1;
      const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(LANG));
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch { /* no voice on this device */ }
  }
  function rvStep(i) {
    const r = RV.r, [title, how] = ritStep(r, i);
    RV.step = i;
    const m = $('#rvMotion'); if (m) m.innerHTML = motionLayer(r.steps[i][3]);
    const n = $('#rvStepN'); if (n) n.textContent = t('Step {n} of {total}', { n: i + 1, total: r.steps.length });
    const tt = $('#rvStepT'); if (tt) tt.textContent = title;
    const h = $('#rvHow'); if (h) h.textContent = how;
    document.querySelectorAll('.rv-chapters li').forEach((li, k) => { li.className = k < i ? 'done' : k === i ? 'on' : ''; });
    chime(); speak(`${title}. ${how}`);
  }
  function rvPaint() {
    if (!RV) return;
    const r = RV.r;
    const bars = document.querySelectorAll('#rvProg i');
    bars.forEach((b, k) => { b.style.width = `${Math.min(100, Math.max(0, ((RV.t - stepStart(r, k)) / r.steps[k][2]) * 100))}%`; });
    const tm = $('#rvTime'); if (tm) tm.textContent = fmtSecs(RV.t);
  }
  function rvTick(now) {
    if (!RV || !RV.playing) return;
    RV.t = Math.min(videoSecs(RV.r), RV.t + Math.max(0, now - RV.last) / 1000);
    RV.last = now;
    const i = stepAt(RV.r, RV.t);
    if (i !== RV.step) rvStep(i);
    rvPaint();
    if (RV.t >= videoSecs(RV.r)) return rvEnd();
    RV.raf = requestAnimationFrame(rvTick);
  }
  async function rvBegin() {
    // Tell the server the video started, so the miles can't be claimed without watching.
    if (!RV.started) { RV.started = true; await act('ritualStart', { id: RV.id }, { quiet: true }).catch(() => { RV.started = false; }); }
  }
  async function rvToggle() {
    if (!RV) return;
    if (RV.finished) { RV = { ...RV, t: 0, finished: false, started: false, step: -1, earned: null }; refreshSheet(); }
    if (RV.playing) {
      RV.playing = false; cancelAnimationFrame(RV.raf); audioOff();
      const svg = $('.rv-face'); if (svg && svg.pauseAnimations) svg.pauseAnimations();
    } else {
      RV.playing = true; audioOn();
      await rvBegin();
      if (!RV || !RV.playing) return;
      RV.last = performance.now(); RV.step = -1;
      const svg = $('.rv-face'); if (svg && svg.unpauseAnimations) svg.unpauseAnimations();
      RV.raf = requestAnimationFrame(rvTick);
    }
    const stage = $('.rv'); if (stage) stage.classList.toggle('playing', RV.playing);
    const b = $('#rvPlay'); if (b) b.innerHTML = RV.playing ? `${ic('pause', 14)} ${t('Pause')}` : `${ic('play', 14)} ${t('Resume')}`;
    const big = $('.rv-big'); if (big) { big.innerHTML = ic(RV.playing ? 'pause' : 'play', 30); big.setAttribute('aria-label', RV.playing ? t('Pause') : t('Play')); }
  }
  async function rvEnd() {
    RV.playing = false; RV.finished = true; cancelAnimationFrame(RV.raf);
    chime(); speak(t('Ritual complete. Beautiful work.'));
    setTimeout(() => audioOff(), 2500);
    try { const out = await act('ritualComplete', { id: RV.id }); RV.earned = out.result.earned; } catch { RV.earned = 0; }
    refreshSheet(); rerender();
  }
  function rvSound() {
    if (!RV) return;
    RV.sound = !RV.sound;
    if (RV.sound && RV.playing) { audioOn(); const [title, how] = ritStep(RV.r, stepAt(RV.r, RV.t)); speak(`${title}. ${how}`); } else audioOff();
    const b = $('#rvSound'); if (b) { b.innerHTML = ic(RV.sound ? 'sound' : 'mute', 18); b.setAttribute('aria-pressed', RV.sound); b.setAttribute('aria-label', RV.sound ? t('Turn sound off') : t('Turn sound on')); }
  }
  function rvStop() { if (RV) { RV.playing = false; cancelAnimationFrame(RV.raf); } audioOff(true); }
  // Uploaded videos: the same start/complete calls, from the video element's own events.
  document.addEventListener('play', (e) => { if (e.target.id === 'rvVideo' && RV) rvBegin(); }, true);
  document.addEventListener('ended', (e) => { if (e.target.id === 'rvVideo' && RV && !RV.finished) rvEnd(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && RV && RV.playing) rvToggle(); });

  /* ---------- Skin scan ---------- */
  // A playful selfie check: scores for six dimensions, a skin type, tips, a ritual and products.
  // On the server (when configured) the photo is analysed and deleted; otherwise it is analysed on the phone.
  const DIMS = [['hydration', 'drop', 'Hydration'], ['radiance', 'sun', 'Radiance'], ['evenness', 'palette', 'Evenness'], ['texture', 'feather', 'Smoothness'], ['calm', 'leaf', 'Calm'], ['firmness', 'mountain', 'Firmness']];
  const SKIN_TYPE = { dry: 'Dry skin', normal: 'Normal skin', combination: 'Combination skin', oily: 'Oily skin', sensitive: 'Sensitive skin' };
  const glowScore = (sc) => Math.round(E.SCAN_KEYS.reduce((a, k) => a + (sc[k] || 0), 0) / E.SCAN_KEYS.length);
  let SC = null;
  function scanView() {
    if (!SC) SC = { stage: 'intro' };
    const privacy = B.mode === 'server' && CONFIG.scan === 'server' ? t('Your photo is analysed, then deleted. It is never stored.') : t('Your photo is analysed on your phone and never leaves it.');
    const head = (eyebrow) => `<div class="row between"><p class="eyebrow accent">${eyebrow}</p><button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>`;
    if (SC.stage === 'intro') {
      return `<div class="sheet-pad scan">${head(t('Skin scan'))}
        <h2 class="serif-h sm">${t('How is my skin <em class="accent">today</em>?')}</h2>
        <div class="scan-hero"><span class="scan-oval">${ic('scan', 56, 1.1)}</span><i class="scan-line"></i></div>
        <ol class="tip-list"><li>${t('Face a window: natural light works best.')}</li><li>${t('Hair back, no make-up if you can.')}</li><li>${t('Hold still for a second, we do the rest.')}</li></ol>
        <p class="privacy-note">${ic('shield', 16)} <span>${privacy}</span></p>
        <button class="btn-dark wide mt12" data-a="scan-camera">${ic('camera', 16)} ${t('Open the camera')}</button>
        <button class="btn-ghost wide mt8" data-a="scan-file">${t('Choose a photo instead')}</button>
        <input type="file" id="scanFile" accept="image/*" capture="user" hidden>
        <p class="muted sm center mt12">${t('For fun and inspiration only — this is not a medical diagnosis.')}</p></div>`;
    }
    if (SC.stage === 'camera') {
      return `<div class="sheet-pad scan">${head(t('Skin scan'))}
        <div class="cam-wrap"><video id="scVideo" autoplay playsinline muted></video><span class="cam-oval" aria-hidden="true"></span><span class="cam-hint">${t('Place your face in the oval')}</span></div>
        <button class="shutter" data-a="scan-snap" aria-label="${t('Take the photo')}"><i></i></button>
        <button class="btn-ghost wide mt8" data-a="scan-file">${t('Choose a photo instead')}</button>
        <input type="file" id="scanFile" accept="image/*" capture="user" hidden></div>`;
    }
    if (SC.stage === 'scanning') {
      return `<div class="sheet-pad scan center">${head(t('Skin scan'))}
        <div class="scan-photo"><img src="${SC.photo}" alt="" draggable="false"><i class="scan-line"></i><span class="mesh" aria-hidden="true">${Array.from({ length: 24 }, (_, k) => `<i style="left:${18 + (k * 37) % 64}%;top:${14 + (k * 53) % 72}%;animation-delay:${(k % 8) * 0.12}s"></i>`).join('')}</span></div>
        <p class="serif-t mt16" id="scanMsg">${t('Reading your glow…')}</p><p class="muted sm">${t('A few seconds')}</p></div>`;
    }
    if (SC.stage === 'noface') {
      return `<div class="sheet-pad scan center">${head(t('Skin scan'))}
        <div class="ticket-big">${ic('scan', 40, 1.3)}</div><h2 class="serif-h sm mt12">${t('We could not see your face clearly')}</h2>
        <p class="muted">${t('Try again facing the light, with your whole face inside the oval.')}</p>
        <button class="btn-dark wide mt16" data-a="scan-again">${t('Try again')}</button></div>`;
    }
    const res = SC.result, sc = res.scores, prev = (S.scans || [])[1];
    const g = glowScore(sc);
    const ritual = E.RITUALS.find((r) => r.id === res.ritual) || E.RITUALS[0];
    const prods = (res.products || []).map(product).filter(Boolean);
    return `<div class="sheet-pad scan">${head(t('Your skin today'))}
      <div class="scan-top"><span class="scan-thumb protected" style="background-image:url('${SC.photo}')"><i class="shield-layer"></i></span>
        ${ring(g, 100, 96, `<b class="serif-t">${g}</b><small>${t('glow')}</small>`)}</div>
      <h2 class="serif-h sm center">${esc(res.headline)}</h2>
      <p class="center"><span class="st-pill soft">${t(SKIN_TYPE[res.skinType] || 'Normal skin')}</span>${SC.earned ? ` <span class="pill-accent">+${SC.earned} Skin Miles</span>` : ''}</p>
      <div class="card dims">${DIMS.map(([k, icon, label]) => { const d = prev ? sc[k] - prev.scores[k] : 0; return `<div class="dim">
        <span class="dim-ic">${ic(icon, 16)}</span><span class="grow"><span class="row between"><b class="sm">${t(label)}</b><span class="sm"><b>${sc[k]}</b>${prev && d ? ` <small class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '↑' : '↓'}${Math.abs(d)}</small>` : ''}</span></span>
        <span class="bar"><i style="width:${sc[k]}%"></i></span></span></div>`; }).join('')}</div>
      <p class="muted mt12">${esc(res.summary)}</p>
      ${sectionHead(t('Your 3 tips'))}
      <ol class="tip-list">${res.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      ${sectionHead(t('Your ritual for today'))}
      <button class="card ritual-card" data-a="ritual" data-arg="${ritual.id}"><span class="rit-thumb">${ic('play', 18)}</span>
        <span class="grow"><span class="eyebrow accent block">${ritEyebrow(ritual)}</span><span class="serif-t block">${ritName(ritual)}</span><small class="muted">+${ritual.miles} miles</small></span>${ic('chevron', 16)}</button>
      ${prods.length ? `${sectionHead(t('Picked for you'))}<div class="stack">${prods.map((p) => `<div class="bag-line card"><span class="bag-thumb" style="background:${esc(p.bg)}">${productVisual(p)}</span>
        <span class="grow" data-a="product" data-arg="${esc(p.id)}"><b>${esc(p.name)}</b><small class="muted block">${esc(pSub(p))} · ${eur(p.price)}</small></span>
        <button class="btn-dark xs" data-a="add" data-arg="${esc(p.id)}">${t('Add')}</button></div>`).join('')}</div>` : ''}
      <p class="muted sm center mt16">${t('For fun and inspiration only — this is not a medical diagnosis.')}</p>
      <div class="row g8 mt12"><button class="btn-ghost grow" data-a="scan-again">${t('Scan again')}</button><button class="btn-dark grow" data-a="close">${t('Done')}</button></div></div>`;
  }
  function stopCamera() { if (SC && SC.stream) { SC.stream.getTracks().forEach((tr) => tr.stop()); SC.stream = null; } }
  async function scanCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(t('The camera is not available here. Choose a photo instead.'), '', 'error'); return scanFile(); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      SC = { stage: 'camera', stream };
      refreshSheet();
      const v = $('#scVideo'); if (v) { v.srcObject = stream; v.play().catch(() => {}); }
    } catch { toast(t('Allow the camera for Seasonly, or choose a photo instead.'), '', 'error'); }
  }
  function scanFile() { const i = $('#scanFile'); if (i) { i.value = ''; i.click(); } }
  // Square, centred crop of the face, 768 px, as a JPEG. A selfie preview is mirrored, so the photo is too.
  function squareFrom(src, w, h, mirror) {
    const size = 768, side = Math.min(w, h), canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    if (mirror) { g.translate(size, 0); g.scale(-1, 1); }
    g.drawImage(src, (w - side) / 2, Math.max(0, (h - side) / 2 - side * 0.05), side, side, 0, 0, size, size);
    return canvas;
  }
  async function scanSnap() {
    const v = $('#scVideo');
    if (!v || !v.videoWidth) return;
    const canvas = squareFrom(v, v.videoWidth, v.videoHeight, true);
    stopCamera();
    runScan(canvas);
  }
  async function scanFromFile(file) {
    try {
      let src;
      try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch { src = await new Promise((ok, ko) => { const img = new Image(); img.onload = () => ok(img); img.onerror = ko; img.src = URL.createObjectURL(file); }); }
      stopCamera();
      runScan(squareFrom(src, src.width, src.height, false));
    } catch { toast(t('This photo could not be processed.'), '', 'error'); }
  }
  async function runScan(canvas) {
    SC = { stage: 'scanning', photo: canvas.toDataURL('image/jpeg', 0.85) };
    refreshSheet();
    const msgs = ['Reading your glow…', 'Checking hydration…', 'Mapping texture…', 'Looking for redness…', 'Picking your ritual…'];
    let k = 0;
    const tick = setInterval(() => { const m = $('#scanMsg'); if (m) m.textContent = t(msgs[++k % msgs.length]); }, 900);
    const wait = new Promise((ok) => setTimeout(ok, 3200));
    let res = null, earned = 0;
    try {
      if (B.mode === 'server' && CONFIG.scan === 'server') {
        try {
          const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.9));
          const out = await B.skinScan(blob);
          if (out.scan && out.scan.face === false) { res = { face: false }; }
          else { res = out.scan; S = out.state; U.state = S; earned = out.result.earned; await wait; out.events.forEach(showEvent); }
        } catch (e) { if (e.status === 429) throw e; res = null; }
      }
      if (!res) {
        res = analyzeOnDevice(canvas);
        if (res.face) { const out = await act('scan', { scores: res.scores, skinType: res.skinType }, { quiet: true }); earned = out.result.earned; await wait; out.events.forEach(showEvent); }
      }
      await wait;
    } catch (e) { clearInterval(tick); toast(e.message, '', 'error'); SC = { stage: 'intro' }; return refreshSheet(); }
    clearInterval(tick);
    if (!SC || SC.stage !== 'scanning') return; // the sheet was closed
    SC = res.face === false ? { stage: 'noface' } : { stage: 'result', photo: SC.photo, result: res, earned };
    refreshSheet(); rerender();
  }
  // On-device reading: light, colour and detail measured inside the face oval.
  function analyzeOnDevice(canvas) {
    const N = 192, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(canvas, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N).data;
    let n = 0, skin = 0, sumY = 0, sumY2 = 0, red = 0, hi = 0, sat = 0, edge = 0;
    const Y = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) Y[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
      const dx = (x - N / 2) / (N * 0.34), dy = (y - N * 0.52) / (N * 0.44);
      if (dx * dx + dy * dy > 1) continue;
      const i = y * N + x, r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2];
      n++;
      if (r > 95 && gg > 40 && b > 20 && r > gg && r > b && r - Math.min(gg, b) > 15) skin++;
      sumY += Y[i]; sumY2 += Y[i] * Y[i];
      red += r - (gg + b) / 2;
      if (Y[i] > 225) hi++;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); sat += mx ? (mx - mn) / mx : 0;
      edge += Math.abs(Y[i] - Y[i + 2]) + Math.abs(Y[i] - Y[i + 2 * N]);
    }
    const clamp = (v, a = 35, b = 96) => Math.round(Math.max(a, Math.min(b, v)));
    const meanY = sumY / n, std = Math.sqrt(Math.max(0, sumY2 / n - meanY * meanY)), redness = red / n, highlight = hi / n, satM = sat / n, edgeM = edge / n;
    if (skin / n < 0.18) return { face: false };
    const scores = {
      radiance: clamp(40 + (meanY - 90) * 0.45 + highlight * 60),
      evenness: clamp(100 - std * 1.1),
      calm: clamp(100 - Math.max(0, redness - 25) * 1.6),
      texture: clamp(100 - edgeM * 2.2),
      hydration: clamp(55 + highlight * 120 - Math.abs(satM - 0.35) * 60 + (std < 30 ? 5 : 0), 35, 95),
    };
    scores.firmness = clamp((scores.texture + scores.evenness) / 2 + 4, 35, 95);
    const skinType = highlight > 0.08 ? 'oily' : redness > 45 ? 'sensitive' : scores.hydration < 55 ? 'dry' : highlight > 0.04 ? 'combination' : 'normal';
    return { face: true, scores, skinType, ...readingFor(scores) };
  }
  // Words for an on-device reading, from its best and weakest dimensions.
  const DIM_FIX = {
    hydration: { ritual: 'evening-lift', products: ['creme-riche', 'huile-de-nuit'], tips: ['Drink a glass of water now, and one with every coffee.', 'Apply your serum on damp skin, then seal it with cream within a minute.', 'Two drops of Huile de Nuit tonight will help your skin hold on to water.'] },
    radiance: { ritual: 'peau-neuve', products: ['creme-lumiere', 'masque-peeling-anti-grisaille'], tips: ['A gentle exfoliation once a week wakes up a dull complexion.', 'Massage for two minutes every morning to bring colour back to your cheeks.', 'Go to bed 30 minutes earlier tonight: radiance starts with sleep.'] },
    evenness: { ritual: 'drainage', products: ['serum-anti-age', 'gelee-nettoyante-visage'], tips: ['Wear sunscreen every day, even when it is cloudy.', 'Cleanse gently in the evening to remove what dulls your tone.', 'A drainage massage helps even out a tired complexion.'] },
    texture: { ritual: 'peau-neuve', products: ['masque-peau-neuve', 'serum-anti-imperfections'], tips: ['Use an enzyme mask once a week to smooth the skin surface.', 'Keep your hands away from your face during the day.', 'Change your pillowcase twice a week.'] },
    calm: { ritual: 'drainage', products: ['gelee-nettoyante-visage', 'gua-sha-ceramic'], tips: ['Rinse with cool water, never hot.', 'Keep a ceramic gua sha in the fridge for a soothing massage.', 'Skip strong exfoliants for a few days and let your skin rest.'] },
    firmness: { ritual: 'kobido', products: ['serum-tensiolift', 'gua-sha-quartz'], tips: ['Five minutes of Kobido massage tones the face like a workout.', 'Always massage upwards and outwards, never downwards.', 'A firming serum morning and evening keeps the skin plump.'] },
  };
  const DIM_NAME = { hydration: 'hydration', radiance: 'radiance', evenness: 'even tone', texture: 'smoothness', calm: 'calm', firmness: 'firmness' };
  const HEADLINE = { hydration: 'Dewy and happy today', radiance: 'Your glow is on point', evenness: 'Lovely even tone today', texture: 'Smooth as silk today', calm: 'Calm and serene skin', firmness: 'Toned and lifted today' };
  function readingFor(scores) {
    const keys = Object.keys(DIM_FIX);
    const best = keys.reduce((a, k) => (scores[k] > scores[a] ? k : a), keys[0]);
    const weak = keys.reduce((a, k) => (scores[k] < scores[a] ? k : a), keys[0]);
    const fix = DIM_FIX[weak];
    return { headline: t(HEADLINE[best]), summary: t('Your {best} stands out today. Your {weak} would love a little extra care: here is how.', { best: t(DIM_NAME[best]), weak: t(DIM_NAME[weak]) }),
      tips: fix.tips.map((x) => t(x)), ritual: fix.ritual, products: fix.products };
  }

  /* ---------- Games ---------- */
  let G = {};
  const gameHead = (title, sub) => `<div class="game-head"><div class="row between"><div><p class="eyebrow accent">${t('Play & earn')}</p><h2 class="serif-h sm">${title}</h2></div>
    <button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>${sub ? `<p class="muted sm">${sub}</p>` : ''}</div>`;
  const MATCH_TILES = [['🍊', 'Vitamin C'], ['🌺', 'Hibiscus'], ['💧', 'Hyaluronic'], ['🌿', 'Calendula'], ['🫒', 'Squalane'], ['🍯', 'Propolis']];
  function newMatch() {
    const deck = [...MATCH_TILES, ...MATCH_TILES].map((tl, i) => ({ k: tl[0], name: tl[1], id: i }));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    G = { type: 'match', deck, open: [], matched: [], moves: 0, lock: false, over: false };
  }
  function matchView() {
    if (G.type !== 'match') newMatch();
    const played = doneToday('match') && !G.over;
    const reward = Math.max(20, 80 - Math.max(0, G.moves - 6) * 5);
    return `<div class="sheet-pad">${gameHead(t('Glow Match'), played ? t('Practice round. Miles already earned today.') : t('Pair the six actives. 6 moves = 80 miles, each extra move −5 (min 20).'))}
      <div class="row between mt12"><span class="pill-light">${t('Moves · {n}', { n: G.moves })}</span><span class="pill-accent">${played ? t('Practice') : t('+{n} if you finish now', { n: reward })}</span></div>
      <div class="match">${G.deck.map((c, i) => {
        const up = G.open.includes(i) || G.matched.includes(c.k);
        return `<button class="mcard${up ? ' up' : ''}${G.matched.includes(c.k) ? ' ok' : ''}" data-a="flip" data-arg="${i}" aria-label="${up ? t(c.name) : t('Hidden card')}">
          <span class="back">s</span><span class="front"><em>${c.k}</em><small>${t(c.name)}</small></span></button>`;
      }).join('')}</div>
      ${G.over ? `<div class="card center mt12"><p class="serif-t">${t('Matched in {n} moves', { n: G.moves })}</p><p class="muted sm">${G.earned ? t('+{n} miles earned', { n: G.earned }) : t('Practice round complete')}</p>
        <button class="btn-dark wide mt12" data-a="match-again">${t('Play again')}</button></div>` : ''}</div>`;
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
  const quizItem = (k) => { const q = E.QUIZ[k], fr = cx('quiz', k, 'q', null); return fr ? [fr, cx('quiz', k, 'a', q[1]), q[2]] : q; };
  function quizView() {
    if (G.type !== 'quiz') newQuiz();
    if (G.over) {
      return `<div class="sheet-pad center">${gameHead(t('Skin Quiz'), '')}
        <div class="score-num">${G.score}<small>/5</small></div>
        <p class="serif-t">${G.score >= 4 ? t('Skin expert!') : G.score >= 2 ? t('Well played') : t('Keep learning')}</p>
        <p class="muted">${G.earned ? t('+{n} miles earned', { n: G.earned }) : t('Practice round. Come back tomorrow for miles.')}</p>
        <button class="btn-dark wide mt16" data-a="quiz-again">${t('New questions')}</button></div>`;
    }
    const [q, opts, ans] = quizItem(G.idx[G.i]);
    return `<div class="sheet-pad">${gameHead(t('Skin Quiz'), doneToday('quiz') ? t('Practice round. Miles already earned today.') : t('+10 miles per correct answer.'))}
      <div class="dots mt12">${G.idx.map((_, i) => `<i class="${i < G.i ? 'done' : i === G.i ? 'on' : ''}"></i>`).join('')}</div>
      <h3 class="serif-t q">${esc(q)}</h3>
      <div class="stack">${opts.map((o, i) => {
        let cls = '';
        if (G.picked !== null) cls = i === ans ? ' right' : i === G.picked ? ' wrong' : ' dim';
        return `<button class="answer card${cls}" data-a="answer" data-arg="${i}" ${G.picked !== null ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${G.picked !== null ? `<button class="btn-dark wide mt16" data-a="quiz-next">${G.i === 4 ? t('See my score') : t('Next question')}</button>` : ''}</div>`;
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
    return `<div class="sheet-pad center">${gameHead(t('Glow Wheel'), played ? (S.wheelWin ? t("Today's spin is done: you won {n} miles. A new spin unlocks tomorrow.", { n: S.wheelWin }) : t("Today's spin is done. A new spin unlocks tomorrow.")) : t('One free spin every day. Every slice is a win.'))}
      <div class="wheel-wrap"><span class="pointer"></span>
        <svg id="wheel" class="wheel" viewBox="0 0 200 200" style="transform:rotate(${G.rot || 0}deg)">${slices}<circle cx="100" cy="100" r="16" fill="#fff"/><text x="100" y="104" text-anchor="middle" font-family="Cormorant Garamond" font-size="12" fill="#0E0E10">s</text></svg></div>
      <button class="btn-dark wide" data-a="spin" ${played || G.spinning ? 'disabled' : ''}>${played ? t('Come back tomorrow') : G.spinning ? t('Spinning…') : t('Spin the wheel')}</button></div>`;
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
    if (!file || !/^image\//.test(file.type || 'image/')) throw new Error(t('Choose a photo (JPEG or PNG).'));
    if (file.size > 20 * 1024 * 1024) throw new Error(t('This photo is too large. Choose one under 20 MB.'));
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch {
      src = await new Promise((ok, ko) => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => ko(new Error(t('This photo format is not supported. Try a JPEG.'))); img.src = URL.createObjectURL(file); });
    }
    const size = 640, w = src.width, h = src.height, side = Math.min(w, h);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    canvas.getContext('2d').drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error(t('This photo could not be processed.')))), 'image/jpeg', 0.86));
  }
  async function uploadPhoto(file) {
    try {
      toast(t('Uploading your photo…'), '', 'bag');
      const blob = await preparePhoto(file);
      const out = await B.uploadAvatar(blob);
      setUser({ ...out.user, state: S });
      toast(t('Photo updated'), t('Only you can see it'), 'tier');
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
        U.push = false; toast(t('Notifications off'), '', 'bag');
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') throw new Error(t('Allow notifications for Seasonly in your browser settings.'));
        const key = Uint8Array.from(atob(CONFIG.vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - CONFIG.vapidPublicKey.length % 4) % 4)), (c) => c.charCodeAt(0));
        const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        await B.pushSubscribe(sub.toJSON());
        U.push = true; toast(t('Notifications on'), t('We will tell you about rewards and new seasons'), 'tier');
      }
      rerender();
    } catch (e) { toast(e.message || t('Notifications are not available here.'), '', 'error'); }
  }

  /* ---------- Sheet & toast ---------- */
  let sheetRender = null;
  function openSheet(html, mode = '') {
    if (RV && !(typeof html === 'function' && html.ritual)) rvStop();
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
    rvStop(); RV = null;
    stopCamera(); SC = null;
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
    try { await navigator.clipboard.writeText(text); toast(t('Copied'), text.length > 40 ? t('Paste it in a message to your friend') : text, 'bag'); }
    catch { openSheet(`<div class="sheet-pad"><p class="eyebrow accent">${t('Copy your code')}</p><p class="muted">${t('Select the text below and copy it.')}</p><textarea class="copy-box" readonly>${esc(text)}</textarea><button class="btn-dark wide mt16" data-a="close">${t('Done')}</button></div>`); setTimeout(() => { const x = $('.copy-box'); if (x) x.select(); }, 350); }
  }
  // Jump to a section of a tab (e.g. Rewards → Invite friends) and briefly highlight it.
  function goTo(tab, anchor) {
    if (sheet.classList.contains('open')) closeSheet();
    ui.tab = tab; render();
    requestAnimationFrame(() => {
      const el = document.getElementById(anchor);
      if (!el) { app.scrollTop = 0; return; }
      el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      const target = el.nextElementSibling || el;
      target.classList.add('flash'); setTimeout(() => target.classList.remove('flash'), 1600);
    });
  }
  // Keep what was typed in the guest names when the booking screen redraws.
  const keepGuests = () => document.querySelectorAll('[data-guest]').forEach((inp) => { const p = ui.bk.party[+inp.dataset.guest]; if (p) p.name = inp.value.trim().slice(0, 40); });
  const A = {
    goto(arg) { const [tab, anchor] = arg.split(':'); goTo(tab, anchor); },
    lang(arg) {
      if (arg === LANG) return;
      // Keep what was typed in the sign-up form.
      const f = document.querySelector('form[data-form="signup"]');
      if (f) ui.form = { ...ui.form, ...readSignup(f) };
      setLang(arg);
      if (B && B.mode === 'server' && U) B.syncLang();
      if (sheet.classList.contains('open')) refreshSheet();
      rerender();
    },
    async 'enter-contest'(arg, el) {
      el.disabled = true;
      try {
        const c = await B.enterContest(Number(arg));
        CONTESTS = CONTESTS.map((x) => (x.id === c.id ? c : x));
        const l = $('#contestList'); if (l) l.innerHTML = contestList();
        toast(t("You're in the draw"), t('Good luck! Winners are notified here and by email.'), 'tier');
        confetti();
        rerender();
      } catch (e) {
        el.disabled = false;
        toast(e.message, '', 'error');
        if (!U.address) A.address();
      }
    },
    address() {
      const a = U.address || {};
      openSheet(`<div class="sheet-pad"><p class="eyebrow accent">${t('Shipping address')}</p><h2 class="serif-h sm">${t('Where should we <em class="accent">send</em> your gifts?')}</h2>
        <form class="stack" data-form="address">
          ${field('aLine1', t('Street and number'), 'autocomplete="address-line1" required maxlength="120"', a.line1)}
          ${field('aLine2', t('Apartment, floor (optional)'), 'autocomplete="address-line2" maxlength="120"', a.line2)}
          <div class="two">${field('aPostcode', t('Postcode'), 'autocomplete="postal-code" required maxlength="10"', a.postcode)}${field('aCity', t('City'), 'autocomplete="address-level2" required maxlength="60"', a.city)}</div>
          ${countrySelect('aCountry', a.country)}
          <button class="btn-dark wide" type="submit">${t('Save my address')}</button>
        </form><button class="btn-ghost wide mt8" data-a="close">${t('Cancel')}</button></div>`);
    },
    tab(arg) { if (sheet.classList.contains('open')) closeSheet(); ui.tab = arg; render(); app.scrollTop = 0; },
    auth(arg) { ui.auth = arg; ui.error = ''; render(); app.scrollTop = 0; },
    async resend(arg) {
      try {
        const out = await B.resend(ui.pending.pending, arg || undefined);
        ui.pending = { ...ui.pending, ...out, at: Date.now() };
        ui.error = ''; render(); startResendTimer();
        toast(t('New code sent'), '', 'bag');
      } catch (e) { ui.error = e.message; render(); }
    },
    bag() { openSheet(bagView); },
    'go-shop'() { closeSheet(); A.tab('shop'); },
    'go-rewards'() { goTo('rewards', 'vouchers'); },
    'use-service'() { closeSheet(); ui.step = 1; A.tab('book'); },
    close: closeSheet,
    cat(arg) { ui.cat = arg; rerender(); },
    'focus-search'() { const s = $('#search'); if (s) s.focus(); },
    product(arg) { openSheet(() => productView(arg), 'full'); },
    add(arg) { addToBag(arg); },
    'add-close'(arg) { closeSheet(); addToBag(arg); },
    async fav(arg) { await act('fav', { id: arg }, { quiet: true }).catch(() => {}); refreshSheet(); },
    share() { const fb = () => toast(t('Sharing is not available here'), '', 'bag'); if (navigator.share) navigator.share({ title: 'Seasonly Paris', url: location.href }).catch(fb); else fb(); },
    qty(arg) {
      const [id, d] = arg.split(':'); const b = bag.get(); const l = b.find((x) => x.id === id); if (!l) return;
      l.qty += +d; bag.set(l.qty <= 0 ? b.filter((x) => x.id !== id) : b);
      refreshSheet(); rerender();
    },
    'bag-voucher'(arg) { bagVoucher = bagVoucher === arg ? null : arg; refreshSheet(); },
    checkout,
    tip(arg) {
      const tp = tipOf(E.TIPS.find((x) => x.id === arg)), done = doneToday('tip-' + tp.id);
      openSheet(`<div class="sheet-pad"><div class="row between"><p class="eyebrow accent">${t('Daily wellness tip')}</p>
        <button class="icon-btn" data-a="close" aria-label="${t('Close')}">${ic('close', 18)}</button></div>
        <h2 class="serif-h">${tp.title}</h2><p class="muted">${tp.lead}</p>
        <ol class="tip-list">${tp.body.map((b) => `<li>${b}</li>`).join('')}</ol>
        <button class="btn-dark wide mt16" data-a="tip-done" data-arg="${tp.id}" ${done ? 'disabled' : ''}>${done ? t('Already earned today') : t('I read it · +10 miles')}</button></div>`);
    },
    async 'tip-done'(arg) { await act('tip', { id: arg }).catch(() => {}); closeSheet(); },
    checkin: checkIn,
    rituals() { rvStop(); RV = null; openSheet(ritualsList); },
    ritual(arg) { rvStop(); stopCamera(); SC = null; RV = null; const fn = () => ritualView(arg); fn.ritual = true; openSheet(fn); },
    'rv-toggle'() { rvToggle(); },
    'rv-sound'() { rvSound(); },
    scan() { SC = { stage: 'intro' }; openSheet(scanView); },
    'scan-camera'() { scanCamera(); },
    'scan-file'() { scanFile(); },
    'scan-snap'() { scanSnap(); },
    'scan-again'() { stopCamera(); SC = { stage: 'intro' }; refreshSheet(); },
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
    step(arg) { keepGuests(); ui.step = +arg; rerender(); app.scrollTop = 0; },
    'pick-studio'(arg) { ui.bk.studio = arg; A.step(2); },
    'pick-service'(arg) {
      keepGuests();
      const [i, id] = arg.split(':');
      ui.bk.party[+i].service = id;
      // Guests start with the same treatment as you; each one can change it.
      if (+i === 0) ui.bk.party.forEach((p) => { if (!p.service) p.service = id; });
      rerender();
    },
    party(arg) {
      keepGuests();
      const p = ui.bk.party;
      if (+arg > 0 && p.length < E.MAX_PARTY) p.push({ service: p[0].service, name: '' });
      if (+arg < 0 && p.length > 1) p.pop();
      rerender();
    },
    'party-remove'(arg) { keepGuests(); ui.bk.party.splice(+arg, 1); rerender(); },
    'pick-day'(arg) { ui.bk.day = +arg; ui.bk.slot = null; rerender(); },
    'pick-slot'(arg) { ui.bk.slot = arg; rerender(); },
    'bk-voucher'(arg) { ui.bk.voucher = ui.bk.voucher === arg ? null : arg; rerender(); },
    async 'confirm-booking'() {
      if (ui.busy) return;
      ui.busy = true; rerender();
      let out;
      try { out = await act('book', bookPayload()); }
      catch { ui.busy = false; rerender(); return; }
      ui.busy = false;
      const bk = out.result.booking;
      ui.step = 1; ui.bk = newBk();
      openSheet(() => bookingDetail(bk.id, true));
    },
    rename() {
      openSheet(`<div class="sheet-pad"><p class="eyebrow accent">${t('Profile')}</p><h2 class="serif-h sm">${t('About you')}</h2>
        <form class="stack" data-form="rename">${field('nameFirst', t('First name'), 'maxlength="40" autocomplete="given-name" required', U.first)}${field('nameLast', t('Last name'), 'maxlength="40" autocomplete="family-name"', U.last)}
        ${genderPicker(S.profile.gender, 'nameGender')}
        <button class="btn-dark wide" type="submit">${t('Save')}</button></form>
        <button class="btn-ghost wide mt8" data-a="close">${t('Cancel')}</button></div>`);
    },
    photo() { const i = $('#photoInput'); if (i) { i.value = ''; i.click(); } },
    async 'photo-remove'() { try { const out = await B.deleteAvatar(); setUser({ ...out.user, state: S }); avatarSrc = null; toast(t('Photo removed'), '', 'bag'); rerender(); } catch (e) { toast(e.message, '', 'error'); } },
    push: togglePush,
    copy(arg) { copyText(arg); },
    'copy-ref'() { copyText(U.referralCode || S.referral.code); },
    'share-ref'() { if (navigator.share) navigator.share({ title: 'Seasonly', text: refText(), url: refLink() }).catch(() => copyText(`${refText()} ${refLink()}`)); else copyText(`${refText()} ${refLink()}`); },
    collab(arg) { openSheet(() => collabView(Number(arg)), 'full'); },
    async 'collab-join'(arg, el) {
      const [id, on] = arg.split(':').map(Number);
      el.disabled = true;
      try {
        const c = await B.joinCollab(id, !!on);
        COLLABS = COLLABS.map((x) => (x.id === c.id ? c : x));
        toast(on ? t("You're registered") : t('Registration cancelled'), on ? t('A confirmation is on its way by email.') : '', on ? 'tier' : 'bag');
        if (on) confetti();
        refreshSheet();
      } catch (e) { el.disabled = false; toast(e.message, '', 'error'); }
    },
    booking(arg) { openSheet(() => bookingDetail(arg)); },
    order(arg) { openSheet(() => orderDetail(arg)); },
    'cancel-item'(arg) {
      const [kind, id] = arg.split(':');
      const it = (kind === 'order' ? S.orders : S.bookings).find((x) => x.id === id);
      if (!it) return;
      const paid = it.status === 'paid';
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">${paid ? t('Refund') : t('Cancel')}</p>
        <h2 class="serif-h sm">${paid ? t('Request a refund?') : kind === 'order' ? t('Cancel this order?') : t('Cancel this booking?')}</h2>
        <p class="muted">${paid ? t('Our team will refund you shortly. The {n} Skin Miles earned with this payment will then be deducted.', { n: nf(it.credited) }) : t('Any voucher or referral discount you used will be available again.')}</p>
        <button class="btn-dark wide mt16 danger-fill" data-a="cancel-ok" data-arg="${esc(arg)}">${paid ? t('Request a refund') : t('Yes, cancel')}</button>
        <button class="btn-ghost wide mt8" data-a="${kind}" data-arg="${esc(id)}">${t('Keep it')}</button></div>`);
    },
    async 'cancel-ok'(arg, el) {
      const [kind, id] = arg.split(':');
      el.disabled = true;
      try { const out = await act('cancel', { kind, id }); toast(out.result.item.status === 'refund_requested' ? t('Refund requested') : t('Cancelled'), '', 'bag'); } catch { return; }
      openSheet(() => (kind === 'order' ? orderDetail(id) : bookingDetail(id)));
    },
    async 'sim-pay'(arg, el) {
      const [kind, id] = arg.split(':');
      el.disabled = true;
      try { await act('pay', { kind, id }); } catch { return; }
      refreshSheet(); rerender();
    },
    async support() {
      myMessages = null; openSheet(supportView);
      try { myMessages = await B.messages(); const l = $('#supList'); if (l) l.innerHTML = supportList(); } catch { /* the list is optional */ }
    },
    feedback() { fbKind = 'feedback'; fbRating = 0; openSheet(feedbackView); },
    'fb-kind'(arg) { const m = $('#fbMsg'); const keep = m ? m.value : ''; fbKind = arg; refreshSheet(); const n = $('#fbMsg'); if (n) n.value = keep; },
    'fb-star'(arg) { const m = $('#fbMsg'); const keep = m ? m.value : ''; fbRating = +arg; refreshSheet(); const n = $('#fbMsg'); if (n) n.value = keep; },
    logout() {
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">${t('Log out')}</p><h2 class="serif-h sm">${t('See you soon, {name}', { name: esc(U.first) })}</h2>
        <p class="muted">${t('Your miles, vouchers and streak stay safe in your account.')}</p>
        <button class="btn-dark wide mt16" data-a="logout-ok">${t('Log out')}</button><button class="btn-ghost wide mt8" data-a="close">${t('Stay signed in')}</button></div>`);
    },
    async 'logout-ok'() {
      try { await B.logout(); } catch { /* the session ends locally anyway */ }
      closeSheet(); setUser(null); ui.tab = 'home'; ui.auth = 'welcome'; ui.form = {}; bag.set([]); CONTESTS = null; COLLABS = null; GIFTS = null; render();
      toast(t('You are logged out'), '', 'bag');
    },
    'delete-account'() {
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">${t('Delete account')}</p><h2 class="serif-h sm">${t('Delete everything?')}</h2>
        <p class="muted">${t('This permanently deletes your account, photo, miles, vouchers and history. It cannot be undone.')}</p>
        <button class="btn-dark wide mt16 danger-fill" data-a="delete-ok">${t('Delete my account')}</button><button class="btn-ghost wide mt8" data-a="close">${t('Keep my account')}</button></div>`);
    },
    async 'delete-ok'() {
      try { await B.deleteAccount(); } catch (e) { return toast(e.message, '', 'error'); }
      closeSheet(); setUser(null); ui.auth = 'welcome'; render(); toast(t('Your account was deleted'), '', 'bag');
    },
  };
  // A small burst of petals when entering a contest or registering for an event.
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.querySelector('.device') || document.body;
    const el = document.createElement('div'); el.className = 'confetti'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 41) % 100}%;background:${['#C4806C', '#E3B9A6', '#0E0E10', '#D9C3B0'][i % 4]};animation-delay:${(i % 7) * 60}ms;--r:${(i * 47) % 360}deg"></i>`).join('');
    host.appendChild(el); setTimeout(() => el.remove(), 1800);
  }

  /* ---------- Forms ---------- */
  const readSignup = (f) => ({ first: f.first.value, last: f.last.value, email: f.email.value, phone: f.phone.value, referral: f.referral.value.trim(), channel: f.channel.value, consent: f.consent.checked,
    gender: (f.querySelector('input[name="gender"]:checked') || {}).value || '',
    address: { line1: f.line1.value, line2: f.line2.value, postcode: f.postcode.value, city: f.city.value, country: f.country.value } });
  const FORMS = {
    async signup(f) {
      const d = readSignup(f);
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
      if (out.isNew) setTimeout(() => toast(t('Welcome {name}', { name: out.user.first }), t('+300 Skin Miles welcome gift'), 'tier'), 300);
      history.replaceState(null, '', location.pathname);
    },
    async support(f) {
      await B.support({ topic: f.topic.value, ref: f.ref ? f.ref.value : '', message: f.message.value });
      openSheet(`<div class="sheet-pad center"><div class="ticket-big">${ic('mail', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">${t('Message sent')}</p><h2 class="serif-h sm">${t('Thank you, {name}', { name: esc(U.first) })}</h2>
        <p class="muted">${U.emailVerified ? t('We usually answer within one working day, here and at {email}.', { email: esc(U.email) }) : t('We usually answer within one working day.')}</p>
        <button class="btn-dark wide mt16" data-a="close">${t('Done')}</button></div>`);
    },
    async feedback(f) {
      await B.feedback({ kind: fbKind, rating: fbKind === 'feedback' && fbRating ? fbRating : null, message: f.message.value });
      openSheet(`<div class="sheet-pad center"><div class="ticket-big">${ic('sparkle', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">${fbKind === 'idea' ? t('Idea received') : t('Feedback received')}</p><h2 class="serif-h sm">${t('Thank you')}</h2>
        <p class="muted">${t('Every message is read by the Seasonly team.')}</p>
        <button class="btn-dark wide mt16" data-a="close">${t('Done')}</button></div>`);
    },
    async address(f) {
      const out = await B.saveAddress({ line1: f.aLine1.value, line2: f.aLine2.value, postcode: f.aPostcode.value, city: f.aCity.value, country: f.aCountry.value });
      U.address = out.user.address;
      toast(t('Address saved'), '', 'bag');
      closeSheet();
    },
    async rename(f) {
      const g = (f.querySelector('input[name="nameGender"]:checked') || {}).value;
      await act('profile', { first: f.nameFirst.value, last: f.nameLast.value, ...(g ? { gender: g } : {}) }, { quiet: true });
      U.first = S.profile.first; U.last = S.profile.last; U.gender = S.profile.gender;
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
    const authForm = !['rename', 'support', 'feedback', 'address'].includes(name);
    if (authForm) render();
    try { await FORMS[name](e.target.closest('form') || e.target); }
    catch (err) { ui.error = err.message; if (!authForm) toast(err.message, '', 'error'); }
    ui.busy = false;
    if (authForm) { render(); if (ui.auth === 'verify' && !U) { startResendTimer(); const c = $('#code'); if (c) c.focus(); } }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'photoInput' && e.target.files[0]) uploadPhoto(e.target.files[0]);
    if (e.target.id === 'scanFile' && e.target.files[0]) scanFromFile(e.target.files[0]);
    if (e.target.name === 'channel') { ui.form.channel = e.target.value; e.target.closest('.seg').querySelectorAll('label').forEach((l) => l.classList.toggle('on', l.contains(e.target))); }
    if (e.target.name === 'gender' || e.target.name === 'nameGender') { if (e.target.name === 'gender') ui.form.gender = e.target.value; e.target.closest('.seg').querySelectorAll('label').forEach((l) => l.classList.toggle('on', l.contains(e.target))); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'code' && e.target.value.replace(/\D/g, '').length === 6) e.target.form.requestSubmit();
    if (e.target.dataset && e.target.dataset.guest) { const p = ui.bk.party[+e.target.dataset.guest]; if (p) p.name = e.target.value.slice(0, 40); return; }
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

  /* Links from notifications and emails: #booking-<id>, #support, #profile, #gifts, #contests, #invite, #collabs, #scan. */
  function routeHash() {
    if (!U) return;
    const h = location.hash;
    const m = h.match(/^#booking-([A-Z0-9-]{3,40})$/);
    if (m) { ui.tab = 'profile'; render(); A.booking(m[1]); }
    else if (h === '#support') { ui.tab = 'profile'; render(); A.support(); }
    else if (h === '#profile') { ui.tab = 'profile'; render(); }
    else if (h === '#gifts') goTo('profile', 'gifts');
    else if (h === '#contests') goTo('rewards', 'contests');
    else if (h === '#invite') goTo('rewards', 'invite');
    else if (h === '#collabs') goTo('home', 'collabs');
    else if (h === '#scan') { ui.tab = 'home'; render(); A.scan(); }
    if (m || ['#support', '#profile', '#gifts', '#contests', '#invite', '#collabs', '#scan'].includes(h)) history.replaceState(null, '', location.pathname);
  }

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
    paintStatic();
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
    routeHash();
    window.addEventListener('hashchange', routeHash);
    if (B.mode === 'server' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  })();
})();
