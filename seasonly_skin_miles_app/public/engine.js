/* Skin Miles engine — the single source of truth for rewards rules.
   Loaded by the browser (window.SkinMiles) for offline demo mode and required by the
   server, which runs every action itself so balances can't be tampered with client-side. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SkinMiles = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Catalog ---------- */
  // Face Glow Bar treatments, inspired by the Kobido method (15 min, €25 at Sephora).
  const SERVICES = [
    { id: 'gym', name: 'Soin Gym', mins: 15, price: 25, desc: 'Anti-aging Kobido workout: lifts and firms the face.' },
    { id: 'glow', name: 'Soin Glow', mins: 15, price: 25, desc: 'Radiance massage with lymphatic drainage for an instant glow.' },
    { id: 'winter', name: 'Soin Winter', mins: 15, price: 25, desc: 'Detox treatment that wakes up tired, grey winter skin.' },
    { id: 'signature', name: 'Soin Signature', mins: 30, price: 50, desc: 'Kobido, drainage and face sculpting combined in one full session.' },
  ];
  const STUDIOS = [
    { id: 'canopee', name: 'Face Glow Bar La Canopée', addr: 'Sephora · 4 passage de la Canopée, 75001 Paris', hours: 'Today · 10–20h', dist: '1.1 km' },
    { id: 'saint-lazare', name: 'Face Glow Bar Saint-Lazare', addr: 'Sephora · 1 cour du Havre, 75008 Paris', hours: 'Today · 10–20h', dist: '2.4 km' },
    { id: 'beaugrenelle', name: 'Face Glow Bar Beaugrenelle', addr: 'Sephora · 12 rue Linois, 75015 Paris', hours: 'Today · 10–20h', dist: '4.8 km' },
  ];
  const SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

  const RITUALS = [
    { id: 'evening-lift', eyebrow: 'Evening lift', name: 'Sculpt + nourish', mins: 6, miles: 50,
      steps: [['Cleanse', 'Massage the Gelée Nettoyante for 60 seconds, then rinse with cool water.', 60],
              ['Serum', 'Press 3 drops of Sérum TensioLift into face and neck.', 30],
              ['Sculpt', 'Sweep a gua sha outwards from chin to ear, 10 strokes per side.', 180],
              ['Nourish', 'Seal with 2 drops of Huile de Nuit, pressing gently.', 60]] },
    { id: 'kobido', eyebrow: '5 min · Ritual', name: 'Kobido reveal', mins: 5, miles: 30,
      steps: [['Warm up', 'Rub 2 drops of oil between your palms and breathe deeply 3 times.', 30],
              ['Tap', 'Tap your fingertips across cheeks and forehead like soft rain.', 60],
              ['Lift', 'Sweep upwards from jaw to temples, 8 times per side.', 120],
              ['Release', 'Rest your palms on your eyes for 3 slow breaths.', 30]] },
    { id: 'drainage', eyebrow: '7 min · Ritual', name: 'Glow drainage', mins: 7, miles: 30,
      steps: [['Neck', 'Sweep down the sides of the neck 10 times.', 60],
              ['Jaw', 'Glide your knuckles along the jaw towards the ears.', 90],
              ['Cheeks', 'Draw the gua sha from nose to ears.', 150],
              ['Eyes', 'Tap lightly under the eyes from inner to outer corner.', 60]] },
    { id: 'peau-neuve', eyebrow: '20 min · Ritual', name: 'Peau neuve massage', mins: 20, miles: 30,
      steps: [['Apply', 'Spread Masque Peau Neuve on clean skin, face and neck.', 30],
              ['Warm', 'Let the gel turn into a warming oil under your fingers.', 60],
              ['Massage', 'Massage with the gua sha, always outwards and upwards.', 180],
              ['Rinse', 'Leave on, then rinse with warm water after 20 minutes.', 60]] },
  ];

  const TIPS = [
    { id: 'hydration', title: 'Morning Hydration Ritual', lead: 'Start your day with this simple yet powerful hydration ritual for glowing skin.',
      body: ['Drink a glass of room-temperature water before your coffee.', 'Apply serum on damp skin so humectants have water to hold.', 'Lock it all in with a cream within 60 seconds of cleansing.'] },
    { id: 'autumn', title: 'Autumn barrier reset', lead: 'Cold wind and heating dry your skin. Here is how to switch routines.',
      body: ['Swap foaming cleansers for a gentle jelly like the Gelée Nettoyante.', 'Switch from Crème Fluide to Crème Riche if your skin feels tight.', 'Exfoliate once a week instead of three times.'] },
    { id: 'sleep', title: 'Beauty sleep, literally', lead: 'Your skin repairs itself most between 11pm and 4am.',
      body: ['Apply your richest products at night, like the Huile de Nuit.', 'Use a silk pillowcase to reduce friction creases.', 'Sleep slightly elevated to reduce morning puffiness.'] },
  ];

  const QUIZ = [
    ['Which skin layer do peptides mostly help to support?', ['The dermis', 'Nails', 'Hair shaft'], 0],
    ['How long does a full skin renewal cycle take for most adults?', ['3 days', 'About 28 days', '1 year'], 1],
    ['Which ingredient is a natural alternative to retinol?', ['Bakuchiol', 'Alcohol', 'Menthol'], 0],
    ['Where does the Kobido massage come from?', ['Brazil', 'Japan', 'Norway'], 1],
    ['When is your skin most permeable?', ['At noon', 'At night', 'After coffee'], 1],
    ['What is the best order for layering?', ['Oil → serum → cream', 'Serum → cream → oil', 'Cream → serum'], 1],
    ['Which ingredient pulls water into the skin?', ['Hyaluronic acid', 'Clay', 'Salicylic acid'], 0],
    ['How often should sensitive skin be exfoliated in autumn?', ['Daily', 'About once a week', 'Never'], 1],
    ['A lymphatic drainage massage mainly helps with…', ['Puffiness', 'Sunburn', 'Freckles'], 0],
    ['How long is a Seasonly Face Glow Bar treatment?', ['15 minutes', '2 hours', '5 minutes'], 0],
  ];

  const WHEEL = [10, 25, 5, 50, 15, 100, 20, 30];

  const SEASONS = [
    { id: 'winter', name: 'Winter', months: [11, 0, 1] },
    { id: 'spring', name: 'Spring', months: [2, 3, 4] },
    { id: 'summer', name: 'Summer', months: [5, 6, 7] },
    { id: 'autumn', name: 'Autumn', months: [8, 9, 10] },
  ];

  // kind: product = usable in the bag, service = usable when booking.
  const VOUCHERS = [
    { id: 'au-10', season: 'autumn', kind: 'product', title: '€10 off any sérum', note: 'TensioLift, Anti-âge, Regard…', cost: 800, value: 10, type: 'amount' },
    { id: 'au-kit', season: 'autumn', kind: 'product', title: '−20% on your bag', note: 'Autumn nourish edit, whole bag', cost: 1200, value: 20, type: 'percent' },
    { id: 'au-glow', season: 'autumn', kind: 'service', title: '−50% Soin Signature', note: '30 min · any Face Glow Bar', cost: 1500, value: 50, type: 'percent' },
    { id: 'au-free', season: 'autumn', kind: 'service', title: 'Free 15-min Glow treatment', note: 'Soin Gym, Glow or Winter', cost: 2000, value: 25, type: 'amount' },
    { id: 'wi-gift', season: 'winter', kind: 'product', title: '−25% Holiday gift box', note: 'Whole bag', cost: 1400, value: 25, type: 'percent' },
    { id: 'wi-winter', season: 'winter', kind: 'service', title: 'Free Soin Winter', note: '15 min · any Face Glow Bar', cost: 2000, value: 25, type: 'amount' },
    { id: 'sp-peel', season: 'spring', kind: 'product', title: '€15 off Spring renewal', note: 'Masks & serums', cost: 1000, value: 15, type: 'amount' },
    { id: 'sp-gym', season: 'spring', kind: 'service', title: '−50% Soin Gym', note: 'Any Face Glow Bar', cost: 1000, value: 50, type: 'percent' },
    { id: 'su-glow', season: 'summer', kind: 'product', title: '€10 off the Summer glow edit', note: 'Whole bag', cost: 900, value: 10, type: 'amount' },
    { id: 'su-sig', season: 'summer', kind: 'service', title: '−30% Soin Signature', note: 'Any Face Glow Bar', cost: 1200, value: 30, type: 'percent' },
  ];

  const TIERS = [
    { name: 'Bourgeon', min: 0, mult: 1 },
    { name: 'Éclat', min: 1500, mult: 1.1 },
    { name: 'Rayonnance', min: 4000, mult: 1.25 },
    { name: 'Lumière', min: 8000, mult: 1.5 },
  ];
  const MILESTONES = { 7: 100, 14: 150, 30: 300, 60: 400, 100: 600, 365: 2000 };
  const REWARDS = { checkin: 20, tip: 10, booking: 150, welcome: 300, referral: 200 };
  const DEFAULT_REFERRAL = { perFriend: 5, cap: 20, welcome: 10 };

  const BADGES = [
    { id: 'first-ritual', name: 'First ritual', test: (s) => s.ledger.some((l) => l.kind === 'ritual') },
    { id: 'week-streak', name: '7-day streak', test: (s) => s.bestStreak >= 7 },
    { id: 'scholar', name: 'Skin scholar', test: (s) => s.quizBest >= 5 },
    { id: 'memory', name: 'Sharp memory', test: (s) => !!s.matchBest && s.matchBest <= 10 },
    { id: 'shopper', name: 'Maison client', test: (s) => s.orders.length >= 1 },
    { id: 'studio', name: 'Studio regular', test: (s) => s.bookings.length >= 1 },
    { id: 'ambassador', name: 'Ambassadrice', test: (s) => s.referral.friends >= 1 },
  ];

  /* ---------- Dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  function seasonOf(d) {
    const s = SEASONS.find((x) => x.months.includes(d.getMonth()));
    const year = s.id === 'winter' && d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
    const end = new Date(year, s.months[2] + 1, 0, 23, 59, 59);
    const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
    return { ...s, start, end, next: SEASONS[(SEASONS.indexOf(s) + 1) % 4] };
  }
  function mondayOf(d) { const m = addDays(d, -((d.getDay() + 6) % 7)); m.setHours(0, 0, 0, 0); return m; }

  /* ---------- State ---------- */
  function newState(profile, now) {
    return {
      v: 2,
      profile: { first: '', last: '', email: '', phone: '', ...profile },
      miles: 0, lifetime: 0, streak: 0, bestStreak: 0, checkins: [],
      ritual: {}, done: {}, vouchers: [], bookings: [], orders: [], favs: [], badges: [], claimed: [],
      quizBest: 0, matchBest: null, wheelWin: 0, ledger: [],
      referral: { code: profile.referralCode || '', referredBy: profile.referredBy || null, friends: 0, discount: 0, welcome: 0 },
      createdAt: now.getTime(),
    };
  }

  const tierOf = (lifetime) => [...TIERS].reverse().find((t) => lifetime >= t.min);
  const nextTier = (lifetime) => TIERS.find((t) => t.min > lifetime);
  const doneOn = (s, id, now) => s.done[id] === dkey(now);
  const discount = (v, subtotal) => Math.min(subtotal, v.type === 'percent' ? Math.round(subtotal * v.value) / 100 : v.value);
  const round2 = (n) => Math.round(n * 100) / 100;
  const ritualProgress = (s, id, now) => { const r = s.ritual[id]; return r && r.day === dkey(now) ? r.step : 0; };
  const canCheckIn = (s, now) => !s.checkins.includes(dkey(now));

  function challengeList(s, now) {
    const se = seasonOf(now), monday = mondayOf(now).getTime();
    const week = `${now.getFullYear()}-W${isoWeek(now)}`, seasonKey = `${se.id}-${se.end.getFullYear()}`;
    const since = (kind, t) => s.ledger.filter((l) => l.kind === kind && l.t >= t).length;
    return [
      { key: `rituals-${week}`, name: 'Complete 5 rituals this week', v: Math.min(since('ritual', monday), 5), max: 5, rew: 150 },
      { key: `tips-${week}`, name: 'Read 3 wellness tips this week', v: Math.min(since('tip', monday), 3), max: 3, rew: 60 },
      { key: `soin-${seasonKey}`, name: `Book one soin this ${se.name.toLowerCase()}`, v: Math.min(s.bookings.filter((b) => b.t >= se.start.getTime()).length, 1), max: 1, rew: 200 },
    ];
  }

  /* ---------- Reducer ---------- */
  class RuleError extends Error { constructor(msg) { super(msg); this.rule = true; } }
  const fail = (msg) => { throw new RuleError(msg); };

  /**
   * Apply one action. Returns { state, events, result }. Never mutates the input.
   * ctx: { now: Date, rand: () => number, products: [{id, name, price, active}], settings: {referral}, codeFor: () => string }
   */
  function apply(input, action, ctx) {
    const s = JSON.parse(JSON.stringify(input));
    const now = ctx.now || new Date();
    const rand = ctx.rand || Math.random;
    const events = [];
    let result = null;
    const ref = { ...DEFAULT_REFERRAL, ...((ctx.settings && ctx.settings.referral) || {}) };

    const earn = (amount, label, kind, multiply = true) => {
      const before = tierOf(s.lifetime);
      const amt = Math.round(amount * (multiply ? before.mult : 1));
      s.miles += amt; s.lifetime += amt;
      s.ledger.unshift({ t: now.getTime(), label, amt, kind });
      events.push({ type: 'miles', amt, label });
      const after = tierOf(s.lifetime);
      if (after.name !== before.name) events.push({ type: 'tier', name: after.name, mult: after.mult });
      return amt;
    };
    const markDone = (id) => { s.done[id] = dkey(now); };
    const p = action.payload || {};

    switch (action.type) {
      case 'welcome': {
        if (s.ledger.some((l) => l.kind === 'welcome')) fail('Welcome bonus already received.');
        earn(REWARDS.welcome, 'Welcome to Seasonly', 'welcome', false);
        if (s.referral.referredBy) s.referral.welcome = ref.welcome;
        break;
      }
      case 'checkin': {
        if (!canCheckIn(s, now)) fail('You already checked in today.');
        const yesterday = dkey(addDays(now, -1));
        s.streak = s.checkins.includes(yesterday) ? s.streak + 1 : 1;
        s.bestStreak = Math.max(s.bestStreak, s.streak);
        s.checkins.push(dkey(now));
        s.checkins = s.checkins.slice(-400);
        let total = earn(REWARDS.checkin, `Daily check-in · day ${s.streak}`, 'checkin');
        const bonus = MILESTONES[s.streak];
        if (bonus) total += earn(bonus, `${s.streak}-day streak bonus`, 'bonus');
        result = { streak: s.streak, earned: total };
        break;
      }
      case 'tip': {
        const tip = TIPS.find((t) => t.id === p.id) || fail('Unknown tip.');
        if (doneOn(s, 'tip-' + tip.id, now)) fail('Already earned for this tip today.');
        markDone('tip-' + tip.id);
        earn(REWARDS.tip, 'Wellness tip read', 'tip');
        break;
      }
      case 'ritualStep': {
        const r = RITUALS.find((x) => x.id === p.id) || fail('Unknown ritual.');
        const step = Math.min(ritualProgress(s, r.id, now) + 1, r.steps.length);
        s.ritual[r.id] = { day: dkey(now), step };
        if (step >= r.steps.length && !doneOn(s, 'ritual-' + r.id, now)) {
          markDone('ritual-' + r.id);
          earn(r.miles, `${r.name} ritual`, 'ritual');
        }
        result = { step };
        break;
      }
      case 'ritualRestart': {
        const r = RITUALS.find((x) => x.id === p.id) || fail('Unknown ritual.');
        s.ritual[r.id] = { day: dkey(now), step: 0 };
        break;
      }
      case 'match': {
        const moves = Math.floor(Number(p.moves));
        if (!(moves >= 6 && moves <= 200)) fail('Invalid game result.');
        s.matchBest = s.matchBest ? Math.min(s.matchBest, moves) : moves;
        if (!doneOn(s, 'match', now)) {
          markDone('match');
          result = { earned: earn(Math.max(20, 80 - (moves - 6) * 5), 'Glow Match', 'game') };
        } else result = { earned: 0 };
        break;
      }
      case 'quiz': {
        // The client sends which questions it showed and what was picked; the score is computed here.
        const picks = Array.isArray(p.answers) ? p.answers.slice(0, 5) : fail('Invalid quiz.');
        if (picks.length !== 5 || new Set(picks.map((a) => a.q)).size !== 5) fail('Invalid quiz.');
        const score = picks.filter((a) => QUIZ[a.q] && QUIZ[a.q][2] === a.a).length;
        s.quizBest = Math.max(s.quizBest, score);
        if (!doneOn(s, 'quiz', now)) {
          markDone('quiz');
          result = { score, earned: score ? earn(score * 10, `Skin Quiz · ${score}/5`, 'game') : 0 };
        } else result = { score, earned: 0 };
        break;
      }
      case 'wheel': {
        if (doneOn(s, 'wheel', now)) fail('Your spin for today is used. Come back tomorrow.');
        markDone('wheel');
        const idx = Math.floor(rand() * WHEEL.length) % WHEEL.length;
        s.wheelWin = earn(WHEEL[idx], 'Glow Wheel', 'game');
        result = { idx, earned: s.wheelWin };
        break;
      }
      case 'redeem': {
        const v = VOUCHERS.find((x) => x.id === p.id) || fail('Unknown voucher.');
        const se = seasonOf(now);
        if (v.season !== se.id) fail(`This voucher opens in ${SEASONS.find((x) => x.id === v.season).name.toLowerCase()}.`);
        if (s.miles < v.cost) fail(`You need ${v.cost - s.miles} more miles.`);
        s.miles -= v.cost;
        s.ledger.unshift({ t: now.getTime(), label: `Voucher · ${v.title}`, amt: -v.cost, kind: 'redeem' });
        const code = ctx.codeFor ? ctx.codeFor() : `SEAS-${v.season.slice(0, 2).toUpperCase()}${Math.floor(rand() * 1e6).toString(36).toUpperCase().padStart(4, '0')}`;
        const voucher = { ...v, code, used: false, expires: se.end.getTime() };
        s.vouchers.unshift(voucher);
        result = { voucher };
        break;
      }
      case 'claim': {
        const c = challengeList(s, now).find((x) => x.key === p.key) || fail('This challenge is not available.');
        if (c.v < c.max) fail('Finish the challenge first.');
        if (s.claimed.includes(c.key)) fail('Already claimed.');
        s.claimed.push(c.key);
        earn(c.rew, `Challenge · ${c.name}`, 'bonus');
        break;
      }
      case 'checkout': {
        const products = ctx.products || [];
        const lines = (Array.isArray(p.lines) ? p.lines : []).map((l) => {
          const pr = products.find((x) => x.id === l.id && x.active !== false) || fail('A product in your bag is no longer available.');
          const qty = Math.floor(Number(l.qty));
          if (!(qty >= 1 && qty <= 20)) fail('Invalid quantity.');
          return { id: pr.id, name: pr.name, price: pr.price, qty };
        });
        if (!lines.length) fail('Your bag is empty.');
        const subtotal = round2(lines.reduce((a, l) => a + l.price * l.qty, 0));
        let disc = 0, used = null;
        if (p.voucher) {
          used = s.vouchers.find((v) => v.code === p.voucher && !v.used && v.kind === 'product' && v.expires > now.getTime()) || fail('This voucher cannot be used.');
          disc = discount(used, subtotal);
          used.used = true;
        }
        const total = round2(Math.max(0, subtotal - disc));
        const order = { id: `ORD-${now.getTime().toString(36).toUpperCase()}`, t: now.getTime(), lines, subtotal, discount: disc, total, voucher: used ? used.code : null };
        s.orders.unshift(order);
        earn(Math.floor(total), `Order · ${lines.map((l) => l.name).join(', ')}`, 'order', false);
        result = { order };
        break;
      }
      case 'book': {
        const st = STUDIOS.find((x) => x.id === p.studio) || fail('Choose a Face Glow Bar.');
        const sv = SERVICES.find((x) => x.id === p.service) || fail('Choose a treatment.');
        const dayOffset = Math.floor(Number(p.day));
        if (!(dayOffset >= 1 && dayOffset <= 30) || !SLOTS.includes(p.slot)) fail('Choose a date and time.');
        const lines = [];
        let price = sv.price;
        if (p.voucher) {
          const v = s.vouchers.find((x) => x.code === p.voucher && !x.used && x.kind === 'service' && x.expires > now.getTime()) || fail('This voucher cannot be used.');
          const d = discount(v, price); price -= d; v.used = true;
          lines.push({ label: `Voucher ${v.code}`, amount: -d });
        }
        // Referral discounts: the friend's welcome offer on a first booking, and the referrer's earned credit.
        const base = price, refLines = [];
        if (s.referral.welcome && !s.bookings.length) { refLines.push({ label: 'Welcome referral offer', pct: s.referral.welcome }); s.referral.welcome = 0; }
        if (s.referral.discount) { refLines.push({ label: 'Referral reward', pct: s.referral.discount }); s.referral.discount = 0; }
        let room = ref.cap;
        refLines.forEach((l) => {
          l.pct = Math.min(l.pct, room); room -= l.pct;
          l.amount = -round2(base * l.pct / 100); price += l.amount;
          if (l.pct) lines.push({ label: `${l.label} −${l.pct}%`, amount: l.amount });
        });
        const firstBooking = !s.bookings.length;
        const date = addDays(now, dayOffset);
        const booking = { id: `BK-${now.getTime().toString(36).toUpperCase()}`, t: now.getTime(), studio: st.name, studioId: st.id, service: sv.name, serviceId: sv.id,
          date: dkey(date), slot: p.slot, list: sv.price, price: round2(Math.max(0, price)), lines };
        s.bookings.unshift(booking);
        earn(REWARDS.booking, `Studio visit · ${sv.name}`, 'booking');
        if (firstBooking && s.referral.referredBy) events.push({ type: 'referralQualified', code: s.referral.referredBy });
        result = { booking };
        break;
      }
      case 'referralCredit': {
        // Applied to the referrer when a friend confirmed their account and booked.
        s.referral.friends += 1;
        s.referral.discount = Math.min(ref.cap, s.referral.discount + ref.perFriend);
        earn(REWARDS.referral, `Referral · ${p.name || 'a friend'} booked`, 'referral', false);
        events.push({ type: 'referral', name: p.name || 'A friend', discount: s.referral.discount });
        break;
      }
      case 'profile': {
        const first = String(p.first || '').trim().slice(0, 40);
        if (!first) fail('Enter your first name.');
        s.profile.first = first;
        if (p.last !== undefined) s.profile.last = String(p.last).trim().slice(0, 40);
        break;
      }
      case 'fav': {
        s.favs = s.favs.includes(p.id) ? s.favs.filter((f) => f !== p.id) : [...s.favs, String(p.id).slice(0, 60)];
        break;
      }
      case 'avatar': {
        s.profile.avatar = p.id ? String(p.id).slice(0, 80) : null;
        break;
      }
      default: fail('Unknown action.');
    }

    s.ledger = s.ledger.slice(0, 200);
    BADGES.forEach((b) => {
      if (!s.badges.includes(b.id) && b.test(s)) { s.badges.push(b.id); events.push({ type: 'badge', name: b.name }); }
    });
    return { state: s, events, result };
  }

  return {
    SERVICES, STUDIOS, SLOTS, RITUALS, TIPS, QUIZ, WHEEL, SEASONS, VOUCHERS, TIERS, MILESTONES, REWARDS, BADGES, DEFAULT_REFERRAL,
    dkey, addDays, isoWeek, seasonOf, mondayOf, tierOf, nextTier, discount, ritualProgress, canCheckIn, challengeList, doneOn,
    newState, apply, RuleError,
  };
});
