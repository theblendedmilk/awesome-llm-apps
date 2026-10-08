/* Seasonly admin panel: products, customers, bookings, orders, referrals, email, push and settings. */
(() => {
  'use strict';
  const root = document.getElementById('root');
  const toastEl = document.getElementById('toast');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (n) => `€${Number(n || 0).toFixed(2).replace('.', ',').replace(',00', '')}`;
  const nf = (n) => Math.round(n || 0).toLocaleString('en-US');
  const when = (t) => (t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  async function api(method, url, body, raw) {
    const res = await fetch('/api/admin' + url, {
      method, credentials: 'same-origin',
      headers: { 'X-Seasonly': '1', ...(raw ? { 'Content-Type': raw.type || 'image/jpeg' } : body ? { 'Content-Type': 'application/json' } : {}) },
      body: raw || (body ? JSON.stringify(body) : undefined),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && url !== '/login') { state.me = null; render(); }
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  let toastTimer;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2800); }

  const state = { me: null, view: 'dashboard', data: {}, q: '', modal: null, error: '' };
  const VIEWS = [['dashboard', 'Dashboard'], ['products', 'Products'], ['customers', 'Customers'], ['bookings', 'Bookings'], ['orders', 'Orders'],
    ['referrals', 'Referrals'], ['email', 'Email'], ['push', 'Push notifications'], ['outbox', 'Sent messages'], ['settings', 'Settings']];

  /* ---------- Views ---------- */
  const V = {
    dashboard() {
      const s = state.data.stats;
      if (!s) return '<p class="muted">Loading…</p>';
      const ch = state.me.channels;
      const k = (label, v) => `<div class="kpi"><small>${label}</small><b>${v}</b></div>`;
      return `<p class="eyebrow">Overview</p><h1 class="title">Bonjour, <em>Seasonly</em></h1>
        <div class="kpis">${k('Customers', nf(s.users))}${k('Bookings', nf(s.bookings))}${k('Orders', nf(s.orders))}${k('Revenue (orders)', eur(s.revenue))}
        ${k('Miles issued', nf(s.milesIssued))}${k('Miles unspent', nf(s.milesBalance))}${k('Vouchers redeemed', nf(s.vouchers))}${k('Successful referrals', nf(s.referrals))}
        ${k('Push subscribers', nf(s.pushSubscribers))}${k('Products', nf(s.products))}</div>
        <div class="card" style="margin-top:18px"><h3>Delivery channels</h3>
          <div class="row" style="margin-top:10px">
            <span class="pill ${ch.email ? 'ok' : 'grey'}">Email ${ch.email ? 'connected' : 'logging only'}</span>
            <span class="pill ${ch.sms ? 'ok' : 'grey'}">SMS ${ch.sms ? 'connected' : 'logging only'}</span>
            <span class="pill ok">Web push ready</span></div>
          ${!ch.email || !ch.sms ? '<p class="muted" style="margin-top:10px">Messages on a channel in “logging only” are saved in Sent messages instead of being delivered. Add SMTP_URL (email) and TWILIO_* (SMS) to the server environment to deliver them.</p>' : ''}
        </div>`;
    },
    products() {
      const list = state.data.products;
      if (!list) return '<p class="muted">Loading…</p>';
      return `<div class="row between"><div><p class="eyebrow">Boutique</p><h1 class="title">Products</h1></div><button class="btn" data-a="product-new">Add a product</button></div>
        <div class="table-wrap"><table><thead><tr><th></th><th>Product</th><th>Category</th><th class="num">Price</th><th>Size</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((p) => `<tr><td><div class="thumb" style="${p.image ? `background-image:url('${esc(p.image)}')` : ''}">${p.image ? '' : 's'}</div></td>
          <td><b>${esc(p.name)}</b><div class="muted">${esc(p.sub)}</div></td><td>${esc(p.cat)}</td>
          <td class="num">${eur(p.price)}${p.compareAt ? `<div class="muted"><s>${eur(p.compareAt)}</s></div>` : ''}</td><td>${esc(p.size)}</td>
          <td>${p.active ? '<span class="pill ok">Live</span>' : '<span class="pill grey">Hidden</span>'}</td>
          <td class="num"><button class="btn ghost sm" data-a="product-edit" data-id="${esc(p.id)}">Edit</button></td></tr>`).join('')}
        </tbody></table></div>`;
    },
    customers() {
      const list = state.data.users;
      return `<p class="eyebrow">Skin Miles</p><h1 class="title">Customers</h1>
        <form class="row" data-form="search" style="margin-bottom:14px"><label class="f" style="flex:1"><input name="q" id="q" placeholder="Search by name, email, phone or referral code" value="${esc(state.q)}"></label><button class="btn ghost">Search</button></form>
        ${!list ? '<p class="muted">Loading…</p>' : !list.length ? '<p class="muted">No customers yet.</p>' : `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Contact</th><th>Status</th><th class="num">Miles</th><th>Tier</th><th class="num">Streak</th><th class="num">Bookings</th><th class="num">Referred friends</th><th>Last sign-in</th><th></th></tr></thead><tbody>
        ${list.map((u) => `<tr><td><b>${esc(u.first)} ${esc(u.last)}</b><div class="muted">${esc(u.referralCode || '')}${u.referredBy ? ` · via ${esc(u.referredBy)}` : ''}</div></td>
          <td>${esc(u.email)}<div class="muted">${esc(u.phone)}</div></td>
          <td>${u.verified ? '<span class="pill ok">Confirmed</span>' : '<span class="pill grey">Pending code</span>'}${u.push ? ' <span class="pill soft">Push</span>' : ''}</td>
          <td class="num">${nf(u.miles)}</td><td>${esc(u.tier)}</td><td class="num">${u.streak}</td><td class="num">${u.bookings}</td><td class="num">${u.friends}</td><td>${when(u.lastLogin)}</td>
          <td class="num">${u.verified ? `<button class="btn ghost sm" data-a="miles" data-id="${u.id}" data-name="${esc(u.first)}">Adjust miles</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>`}`;
    },
    bookings() {
      const list = state.data.bookings;
      return `<p class="eyebrow">Face Glow Bar</p><h1 class="title">Bookings</h1>${!list ? '<p class="muted">Loading…</p>' : !list.length ? '<p class="muted">No bookings yet.</p>' : `<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Treatment</th><th>Face Glow Bar</th><th>Date</th><th class="num">Price</th><th>Discounts</th><th>Booked</th></tr></thead><tbody>
        ${list.map((b) => `<tr><td>${esc(b.id)}</td><td>${esc(b.customer)}<div class="muted">${esc(b.email)}</div></td><td>${esc(b.service)}</td><td>${esc(b.studio)}</td>
          <td>${esc(new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${esc(b.slot)}</td>
          <td class="num">${eur(b.price)}${b.price < b.list ? `<div class="muted"><s>${eur(b.list)}</s></div>` : ''}</td>
          <td>${(b.lines || []).map((l) => `<div class="muted">${esc(l.label)}</div>`).join('') || '—'}</td><td>${when(b.t)}</td></tr>`).join('')}
        </tbody></table></div>`}`;
    },
    orders() {
      const list = state.data.orders;
      return `<p class="eyebrow">Boutique</p><h1 class="title">Orders</h1>${!list ? '<p class="muted">Loading…</p>' : !list.length ? '<p class="muted">No orders yet.</p>' : `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th class="num">Subtotal</th><th class="num">Voucher</th><th class="num">Total</th><th>Date</th></tr></thead><tbody>
        ${list.map((o) => `<tr><td>${esc(o.id)}</td><td>${esc(o.customer)}<div class="muted">${esc(o.email)}</div></td>
          <td>${o.lines.map((l) => `${l.qty} × ${esc(l.name)}`).join('<br>')}</td><td class="num">${eur(o.subtotal)}</td>
          <td class="num">${o.discount ? `−${eur(o.discount)}<div class="muted">${esc(o.voucher)}</div>` : '—'}</td><td class="num"><b>${eur(o.total)}</b></td><td>${when(o.t)}</td></tr>`).join('')}
        </tbody></table></div>`}`;
    },
    referrals() {
      const list = state.data.referrals, s = state.data.settings;
      return `<p class="eyebrow">Growth</p><h1 class="title">Referrals</h1>
        ${s ? `<p class="notice" style="margin-bottom:14px">Friends get ${s.referral.welcome}% off their first booking. Referrers earn ${s.referral.perFriend}% per friend who confirms and books, up to ${s.referral.cap}%. Change this in Settings.</p>` : ''}
        ${!list ? '<p class="muted">Loading…</p>' : !list.length ? '<p class="muted">No referred customers yet.</p>' : `<div class="table-wrap"><table><thead><tr><th>Friend</th><th>Referred by</th><th>Code</th><th>Status</th><th>Joined</th></tr></thead><tbody>
        ${list.map((r) => `<tr><td>${esc(r.friend)}<div class="muted">${esc(r.friendEmail)}</div></td><td>${esc(r.referrer)}</td><td>${esc(r.code)}</td>
          <td>${r.booked ? '<span class="pill ok">Booked · reward given</span>' : '<span class="pill grey">Confirmed, no booking yet</span>'}</td><td>${when(r.createdAt)}</td></tr>`).join('')}
        </tbody></table></div>`}`;
    },
    email() {
      const ch = state.me.channels;
      return `<p class="eyebrow">Messages</p><h1 class="title">Send an <em>email</em></h1>
        <div class="grid2"><form class="card stack" data-form="email">
          ${audienceFields('email')}
          <label class="f">Subject<input name="subject" id="em-subject" maxlength="150" required placeholder="The autumn edit is here"></label>
          <label class="f">Message<textarea name="body" id="em-body" maxlength="10000" required placeholder="Bonjour {first},&#10;&#10;…"></textarea><span class="hint">{first} is replaced by each customer's first name. Leave a blank line between paragraphs.</span></label>
          ${state.error ? `<p class="error">${esc(state.error)}</p>` : ''}
          <button class="btn">Send email</button>
          ${!ch.email ? '<p class="hint">Email delivery is not configured: messages will be saved in Sent messages only.</p>' : ''}
        </form>
        <div class="card"><h3>Tips</h3><p class="muted" style="margin-top:8px">Emails are sent from the address in MAIL_FROM with the Seasonly letterhead. Each recipient gets their own copy; addresses are never shared between customers.</p></div></div>`;
    },
    push() {
      return `<p class="eyebrow">Messages</p><h1 class="title">Send a <em>push notification</em></h1>
        <div class="grid2"><form class="card stack" data-form="push">
          ${audienceFields('push', true)}
          <label class="f">Title<input name="title" id="pu-title" maxlength="80" required placeholder="Your autumn vouchers are live"></label>
          <label class="f">Message<input name="body" id="pu-body" maxlength="240" required placeholder="Trade your Skin Miles for −50% on a Soin Signature."></label>
          <label class="f">Opens<select name="url" id="pu-url"><option value="/">Home</option><option value="/#book">Booking</option></select></label>
          ${state.error ? `<p class="error">${esc(state.error)}</p>` : ''}
          <button class="btn">Send notification</button>
          <p class="hint">Only customers who turned on notifications in their profile receive them (<span id="push-subs">${nf((state.data.stats || {}).pushSubscribers)}</span> so far).</p>
        </form>
        <div class="card"><h3>Preview</h3><div class="preview-push" style="margin-top:12px"><span class="ic">s</span><div><b id="pv-title">Your autumn vouchers are live</b><div class="muted" id="pv-body">Trade your Skin Miles for −50% on a Soin Signature.</div></div></div></div></div>`;
    },
    outbox() {
      const list = state.data.outbox;
      return `<p class="eyebrow">Messages</p><h1 class="title">Sent messages</h1>
        <p class="muted" style="margin-bottom:14px">Every email, SMS and push notification the server sent or logged, newest first. Sign-up codes appear here while SMS or email delivery is not configured.</p>
        ${!list ? '<p class="muted">Loading…</p>' : !list.length ? '<p class="muted">Nothing sent yet.</p>' : `<div class="table-wrap"><table><thead><tr><th>When</th><th>Channel</th><th>To</th><th>Message</th><th>Status</th></tr></thead><tbody>
        ${list.map((m) => `<tr><td>${when(m.created_at)}</td><td>${esc(m.channel.toUpperCase())}</td><td>${esc(m.to_addr)}</td>
          <td>${m.subject ? `<b>${esc(m.subject)}</b><br>` : ''}<span class="muted">${esc(m.body.slice(0, 160))}${m.body.length > 160 ? '…' : ''}</span></td>
          <td><span class="pill ${m.status === 'sent' ? 'ok' : m.status === 'failed' ? 'bad' : 'grey'}">${esc(m.status)}</span>${m.error ? `<div class="muted">${esc(m.error.slice(0, 80))}</div>` : ''}</td></tr>`).join('')}
        </tbody></table></div>`}`;
    },
    settings() {
      const s = state.data.settings;
      if (!s) return '<p class="muted">Loading…</p>';
      return `<p class="eyebrow">Configuration</p><h1 class="title">Settings</h1>
        <div class="grid2">
          <form class="card stack" data-form="referral"><h3>Referral programme</h3>
            <div class="f3"><label class="f">Friend's welcome offer (%)<input type="number" name="welcome" id="rf-welcome" min="0" max="50" value="${s.referral.welcome}"></label>
            <label class="f">Reward per friend (%)<input type="number" name="perFriend" id="rf-per" min="1" max="50" value="${s.referral.perFriend}"></label>
            <label class="f">Maximum reward (%)<input type="number" name="cap" id="rf-cap" min="1" max="50" value="${s.referral.cap}"></label></div>
            <p class="hint">The referrer's reward builds up as friends confirm their account and book, up to the maximum, and is used on their next booking.</p>
            <button class="btn">Save referral settings</button></form>
          <div class="card stack"><h3>Home screen photo</h3>
            <div class="img-preview" style="${s.hero ? `background-image:url('${esc(s.hero)}')` : ''}"></div>
            <p class="hint">Shown at the top of the app's home and welcome screens. Use a portrait photo at least 1200 px wide (JPEG or PNG, max 5 MB). Without a photo the app shows its illustrated portrait.</p>
            <div class="row"><label class="btn ghost" for="hero-file">Upload a photo</label><input type="file" id="hero-file" accept="image/jpeg,image/png" hidden>
            ${s.hero ? '<button class="btn ghost" data-a="hero-remove">Remove</button>' : ''}</div></div>
        </div>`;
    },
  };
  function audienceFields(prefix, allowAll) {
    return `<label class="f">Send to<select name="audience" id="${prefix}-aud">
      ${allowAll ? '<option value="all">Everyone who turned on notifications</option>' : '<option value="all">All confirmed customers</option>'}
      <option value="referrers">Customers who referred a friend</option><option value="one">One customer</option></select></label>
      <label class="f" id="${prefix}-to-wrap" hidden>Customer email<input name="to" id="${prefix}-to" type="email" placeholder="marie@example.fr"></label>`;
  }

  function productModal(p) {
    const n = p || { name: '', sub: '', desc: '', price: '', size: '', cat: 'Sérums', tags: [], badge: '', active: true, stats: [] };
    const stats = [0, 1, 2].map((i) => n.stats[i] || ['', '']);
    return `<div class="modal" data-a="modal-bg"><div role="dialog" aria-modal="true" aria-label="Product">
      <form class="stack" data-form="product" data-id="${esc(p ? p.id : '')}">
        <div class="row between"><h2 class="title" style="margin:0">${p ? 'Edit product' : 'New product'}</h2><button type="button" class="btn ghost sm" data-a="modal-close">Close</button></div>
        <div class="row" style="align-items:flex-end"><div class="img-preview" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}"></div>
          ${p ? '<div><label class="btn ghost sm" for="pimg">Upload photo</label><input type="file" id="pimg" accept="image/jpeg,image/png" hidden><p class="hint" style="margin-top:6px">Square JPEG or PNG on a plain background works best.</p></div>' : '<p class="hint">Save the product first, then add its photo.</p>'}</div>
        <label class="f">Name<input name="name" id="p-name" required maxlength="80" value="${esc(n.name)}"></label>
        <label class="f">Short line<input name="sub" id="p-sub" maxlength="120" value="${esc(n.sub)}" placeholder="Firming lifting serum"></label>
        <label class="f">Description<textarea name="desc" id="p-desc" maxlength="2000">${esc(n.desc)}</textarea></label>
        <div class="f3"><label class="f">Price (€)<input name="price" id="p-price" type="number" step="0.01" min="0.01" required value="${esc(n.price)}"></label>
          <label class="f">Was (€)<input name="compareAt" id="p-compare" type="number" step="0.01" min="0" value="${esc(n.compareAt || '')}"></label>
          <label class="f">Size<input name="size" id="p-size" maxlength="30" value="${esc(n.size)}" placeholder="30 ml"></label></div>
        <div class="f3"><label class="f">Category<select name="cat" id="p-cat">${['Sérums', 'Crèmes', 'Masques', 'Nettoyants', 'Huiles', 'Coffrets', 'Accessoires'].map((c) => `<option ${c === n.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="f">Badge<input name="badge" id="p-badge" maxlength="20" value="${esc(n.badge)}" placeholder="Best Seller"></label>
          <label class="f">Tags<input name="tags" id="p-tags" value="${esc((n.tags || []).join(', '))}" placeholder="Anti-aging"></label></div>
        <fieldset class="f3" style="border:0;padding:0;margin:0"><legend class="hint" style="margin-bottom:6px">Results shown on the product page (optional)</legend>
          ${stats.map((s, i) => `<label class="f">Result ${i + 1}<input name="sv${i}" id="p-sv${i}" maxlength="12" value="${esc(s[0])}" placeholder="−40%"><input name="sl${i}" id="p-sl${i}" maxlength="30" value="${esc(s[1])}" placeholder="Wrinkles · D28"></label>`).join('')}</fieldset>
        <label class="check"><input type="checkbox" name="active" id="p-active" ${n.active ? 'checked' : ''}> Visible in the app</label>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ''}
        <div class="row between"><button class="btn">${p ? 'Save changes' : 'Create product'}</button>${p ? '<button type="button" class="btn danger sm" data-a="product-delete">Delete</button>' : ''}</div>
      </form></div></div>`;
  }
  function milesModal(id, name) {
    return `<div class="modal" data-a="modal-bg"><div role="dialog" aria-modal="true" aria-label="Adjust miles"><form class="stack" data-form="miles" data-id="${id}">
      <h2 class="title" style="margin:0">Adjust ${esc(name)}'s miles</h2>
      <label class="f">Miles<input type="number" name="amount" id="m-amount" required placeholder="100 or -50"></label>
      <label class="f">Reason (shown to the customer)<input name="reason" id="m-reason" maxlength="80" placeholder="Gesture from the Seasonly team"></label>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ''}
      <div class="row"><button class="btn">Apply</button><button type="button" class="btn ghost" data-a="modal-close">Cancel</button></div></form></div></div>`;
  }

  /* ---------- Render & load ---------- */
  function render() {
    if (!state.me) {
      root.innerHTML = `<div class="login"><form data-form="login" novalidate>
        <div class="logo">seasonly<small>PARIS</small></div><h1 class="title" style="margin:10px 0 0">Admin</h1>
        <label class="f">Email<input name="email" id="a-email" type="email" autocomplete="username" required></label>
        <label class="f">Password<input name="password" id="a-password" type="password" autocomplete="current-password" required></label>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ''}
        <button class="btn">Sign in</button></form></div>`;
      return;
    }
    // Keep what the admin is typing when data arrives and the view re-renders.
    const keep = state.renderedView === state.view
      ? [...root.querySelectorAll('.main [id], .modal [id]')].filter((el) => 'value' in el && el.type !== 'file').map((el) => [el.id, el.type === 'checkbox' ? el.checked : el.value])
      : [];
    state.renderedView = state.view;
    root.innerHTML = `<div class="shell"><aside class="side"><div class="logo">seasonly<small>PARIS</small></div>
      <nav class="nav">${VIEWS.map(([id, label]) => `<button class="${state.view === id ? 'on' : ''}" data-a="view" data-id="${id}">${label}</button>`).join('')}</nav>
      <div class="who"><span>${esc(state.me.email)}</span><button class="link" data-a="logout">Sign out</button></div></aside>
      <main class="main">${V[state.view]()}</main></div>${state.modal || ''}`;
    keep.forEach(([id, v]) => { const el = document.getElementById(id); if (!el) return; if (el.type === 'checkbox') el.checked = v; else el.value = v; });
    const aud = root.querySelector('select[name="audience"]');
    if (aud) { const wrap = document.getElementById(aud.id.replace('-aud', '-to-wrap')); if (wrap) wrap.hidden = aud.value !== 'one'; }
  }
  async function load(view) {
    const map = { dashboard: [['stats', '/stats']], products: [['products', '/products']], customers: [['users', `/users?q=${encodeURIComponent(state.q)}`]],
      bookings: [['bookings', '/bookings']], orders: [['orders', '/orders']], referrals: [['referrals', '/referrals'], ['settings', '/settings']],
      outbox: [['outbox', '/outbox']], settings: [['settings', '/settings']], push: [['stats', '/stats']], email: [] };
    const jobs = map[view] || [];
    if (!jobs.length) return;
    try {
      await Promise.all(jobs.map(async ([key, url]) => { const d = await api('GET', url); state.data[key] = d[key] !== undefined ? d[key] : d; }));
    } catch (e) { toast(e.message); }
    if (state.view !== view) return;
    // Forms stay untouched while data arrives: only the subscriber count changes on the push page.
    if (view === 'push') { const el = document.getElementById('push-subs'); if (el) { el.textContent = nf((state.data.stats || {}).pushSubscribers); return; } }
    render();
  }
  const go = (view) => { state.view = view; state.error = ''; render(); load(view); };

  /* ---------- Events ---------- */
  const A = {
    view: (el) => go(el.dataset.id),
    async logout() { await api('POST', '/logout').catch(() => {}); state.me = null; render(); },
    'product-new'() { state.error = ''; state.modal = productModal(null); state.editing = null; render(); },
    'product-edit'(el) { state.error = ''; state.editing = state.data.products.find((p) => p.id === el.dataset.id); state.modal = productModal(state.editing); render(); },
    async 'product-delete'() {
      if (!state.confirmDelete) { state.confirmDelete = true; toast('Press Delete again to remove this product for good.'); return; }
      state.confirmDelete = false;
      try { await api('DELETE', `/products/${encodeURIComponent(state.editing.id)}`); state.modal = null; toast('Product deleted'); load('products'); } catch (e) { toast(e.message); }
    },
    'modal-close'() { state.modal = null; state.error = ''; render(); },
    'modal-bg'(el, e) { if (e.target === el) A['modal-close'](); },
    miles(el) { state.error = ''; state.modal = milesModal(el.dataset.id, el.dataset.name); render(); },
    async 'hero-remove'() { try { await api('DELETE', '/settings/hero'); toast('Photo removed'); load('settings'); } catch (e) { toast(e.message); } },
  };
  const FORMS = {
    async login(f) {
      const r = await api('POST', '/login', { email: f.email.value, password: f.password.value });
      state.me = { email: r.email, channels: (await api('GET', '/me')).channels };
      go('dashboard');
    },
    async search(f) { state.q = f.q.value; await load('customers'); },
    async product(f) {
      const stats = [0, 1, 2].map((i) => [f[`sv${i}`].value, f[`sl${i}`].value]).filter((s) => s[0]);
      const body = { name: f.name.value, sub: f.sub.value, desc: f.desc.value, price: f.price.value, compareAt: f.compareAt.value, size: f.size.value,
        cat: f.cat.value, badge: f.badge.value, tags: f.tags.value, stats, active: f.active.checked };
      const id = f.dataset.id;
      const r = id ? await api('PUT', `/products/${encodeURIComponent(id)}`, body) : await api('POST', '/products', body);
      toast(id ? 'Product saved' : 'Product created. You can now add its photo.');
      await load('products');
      if (!id) { state.editing = { ...r.product }; state.modal = productModal(state.editing); render(); } else { state.modal = null; render(); }
    },
    async miles(f) {
      await api('POST', `/users/${f.dataset.id}/miles`, { amount: f.amount.value, reason: f.reason.value });
      state.modal = null; toast('Miles updated'); load('customers');
    },
    async email(f) {
      const r = await api('POST', '/email', { audience: f.audience.value, to: f.to.value, subject: f.subject.value, body: f.body.value });
      toast(`${r.sent} of ${r.recipients} email(s) ${r.delivered ? 'sent' : 'saved in Sent messages'}`);
      f.reset();
    },
    async push(f) {
      const r = await api('POST', '/push', { audience: f.audience.value, to: f.to.value, title: f.title.value, body: f.body.value, url: f.url.value });
      toast(`Delivered to ${r.sent} of ${r.subscriptions} device(s)`);
      f.reset();
    },
    async referral(f) {
      await api('PUT', '/settings', { referral: { welcome: f.welcome.value, perFriend: f.perFriend.value, cap: f.cap.value } });
      toast('Referral settings saved'); load('settings');
    },
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (el && A[el.dataset.a]) { if (el.dataset.a !== 'modal-bg') e.preventDefault(); A[el.dataset.a](el, e); }
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target, name = f.dataset.form;
    if (!FORMS[name]) return;
    e.preventDefault();
    const btn = f.querySelector('button:not([type="button"])'); if (btn) btn.disabled = true;
    state.error = '';
    try { await FORMS[name](f); }
    catch (err) {
      state.error = err.message;
      if (name === 'product') state.modal = productModal(state.editing);
      else if (name === 'miles') state.modal = milesModal(f.dataset.id, '');
      if (['login', 'product', 'miles', 'email', 'push'].includes(name)) { const keep = new FormData(f); render(); restore(keep); } else toast(err.message);
    }
    if (btn && btn.isConnected) btn.disabled = false;
  });
  function restore(fd) { for (const [k, v] of fd.entries()) { const el = root.querySelector(`[name="${k}"]`); if (el && el.type !== 'checkbox' && el.type !== 'file') el.value = v; } }
  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.name === 'audience') { const wrap = document.getElementById(t.id.replace('-aud', '-to-wrap')); if (wrap) wrap.hidden = t.value !== 'one'; }
    if ((t.id === 'pimg' || t.id === 'hero-file') && t.files[0]) {
      const file = t.files[0];
      if (file.size > 5 * 1024 * 1024) return toast('Photos must be 5 MB or smaller.');
      try {
        if (t.id === 'pimg') {
          const r = await api('POST', `/products/${encodeURIComponent(state.editing.id)}/image`, null, file);
          state.editing = r.product; state.modal = productModal(state.editing); toast('Photo uploaded'); await load('products');
        } else { await api('POST', '/settings/hero', null, file); toast('Home photo updated'); load('settings'); }
      } catch (err) { toast(err.message); }
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'pu-title') document.getElementById('pv-title').textContent = e.target.value || 'Your autumn vouchers are live';
    if (e.target.id === 'pu-body') document.getElementById('pv-body').textContent = e.target.value || '';
  });

  (async () => {
    try { const me = await api('GET', '/me'); state.me = me; go('dashboard'); } catch { render(); }
  })();
})();
