/* Seasonly · Skin Miles — vanilla JS single-page app.
   All state lives in localStorage so the demo works offline with no build step. */
(() => {
  'use strict';

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
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  };
  const ic = (n, s = 20, sw = 1.6) =>
    `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ---------- Product art (SVG so the demo ships without photos) ---------- */
  function productArt(p, big = false) {
    const c = p.art;
    const label = `<text x="50" y="${c.kind === 'tube' ? 92 : 84}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9" fill="${c.ink}">seasonly</text>
      <text x="50" y="${c.kind === 'tube' ? 100 : 92}" text-anchor="middle" font-family="Inter, sans-serif" font-size="3" letter-spacing=".6" fill="${c.ink}" opacity=".7">PARIS</text>
      <rect x="36" y="${c.kind === 'tube' ? 106 : 98}" width="28" height="1.4" rx=".7" fill="${c.ink}" opacity=".35"/>
      <rect x="39" y="${c.kind === 'tube' ? 110 : 102}" width="22" height="1.4" rx=".7" fill="${c.ink}" opacity=".25"/>`;
    let body = '';
    if (c.kind === 'dropper') {
      body = `<rect x="43" y="6" width="14" height="24" rx="7" fill="${c.cap}"/>
        <rect x="37" y="28" width="26" height="14" rx="3" fill="${c.collar || '#DCDCD8'}"/>
        <rect x="24" y="40" width="52" height="112" rx="12" fill="${c.glass}"/>
        <rect x="24" y="96" width="52" height="56" rx="12" fill="${c.liquid}" opacity=".55"/>
        <rect x="30" y="70" width="40" height="44" rx="3" fill="${c.label}"/>${label}
        <rect x="28" y="46" width="4.5" height="98" rx="2.2" fill="#fff" opacity=".45"/>`;
    } else if (c.kind === 'tube') {
      body = `<path d="M28 18h44l-4 118a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6L28 18Z" fill="${c.glass}"/>
        <rect x="26" y="10" width="48" height="10" rx="2" fill="${c.cap}"/>
        <rect x="38" y="142" width="24" height="12" rx="3" fill="${c.cap}"/>${label}
        <path d="M33 24l3 108" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
    } else if (c.kind === 'jar') {
      body = `<rect x="20" y="64" width="60" height="18" rx="5" fill="${c.cap}"/>
        <rect x="18" y="80" width="64" height="66" rx="14" fill="${c.glass}"/>
        <rect x="28" y="96" width="44" height="34" rx="3" fill="${c.label}"/>
        <text x="50" y="112" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9" fill="${c.ink}">seasonly</text>
        <text x="50" y="120" text-anchor="middle" font-family="Inter, sans-serif" font-size="3" letter-spacing=".6" fill="${c.ink}" opacity=".7">PARIS</text>
        <rect x="22" y="86" width="4.5" height="52" rx="2.2" fill="#fff" opacity=".45"/>`;
    } else {
      // facial roller
      body = `<rect x="47" y="70" width="6" height="82" rx="3" fill="${c.cap}"/>
        <path d="M50 72 30 40M50 72 70 40" stroke="${c.collar}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="30" cy="36" r="13" fill="${c.glass}"/><circle cx="70" cy="36" r="13" fill="${c.glass}"/>
        <circle cx="26" cy="31" r="4" fill="#fff" opacity=".35"/><circle cx="66" cy="31" r="4" fill="#fff" opacity=".35"/>`;
    }
    return `<svg class="pa${big ? ' big' : ''}" viewBox="0 0 100 160" aria-hidden="true">
      <ellipse cx="50" cy="155" rx="30" ry="4" fill="#3b2a20" opacity=".12"/>${body}</svg>`;
  }

  /* ---------- Catalog ---------- */
  const PRODUCTS = [
    { id: 'tl-serum', name: 'TensioLift', sub: 'Lifting Serum', short: 'Anti-aging lifting serum', cat: 'Sérums', tags: ['Anti-aging'], price: 68, size: '30 ml', refill: 52, badge: 'Best Seller', edit: true,
      desc: 'A weightless lifting concentrate with hibiscus peptides, plumping in 14 days.',
      stats: [['−40%', 'Wrinkles · D28'], ['+62%', 'Firmness · D28'], ['98%', 'Natural origin']],
      art: { kind: 'dropper', glass: '#E7EBEA', liquid: '#F1EEE6', label: '#FBFBF9', cap: '#F4F4F2', collar: '#DADAD6', ink: '#3A3532' }, bg: 'linear-gradient(160deg,#F1E3D4,#E9D3BF)' },
    { id: 'tl-oil', name: 'TensioLift', sub: 'Lifting Oil', short: 'Anti-aging lifting oil', cat: 'Huiles', tags: ['Anti-aging'], price: 54, size: '30 ml', refill: 42, edit: true,
      desc: 'A dry oil of prickly pear and bakuchiol that sculpts the jawline with every massage.',
      stats: [['+48%', 'Elasticity · D28'], ['−31%', 'Fine lines · D28'], ['99%', 'Natural origin']],
      art: { kind: 'dropper', glass: '#2F5A50', liquid: '#1E3F37', label: '#F3EFE7', cap: '#F4F4F2', collar: '#D9D6CF', ink: '#2F3A36' }, bg: 'linear-gradient(160deg,#EEE6DC,#E2D6C6)' },
    { id: 'veil', name: 'Hydra Veil', sub: 'Barrier Cream', short: 'Cloud cream for autumn skin', cat: 'Hydratation', tags: ['Anti-aging'], price: 46, size: '50 ml', refill: 36, badge: 'New', edit: true,
      desc: 'A cloud-light ceramide cream that rebuilds the barrier when the first cold winds arrive.',
      stats: [['+72%', 'Hydration · 24h'], ['−35%', 'Redness · D14'], ['97%', 'Natural origin']],
      art: { kind: 'jar', glass: '#F2ECE6', label: '#FFFFFF', cap: '#D9C3B0', ink: '#3A3532' }, bg: 'linear-gradient(160deg,#F5EBE3,#EBDCCF)' },
    { id: 'drain', name: 'Glow Drainage', sub: 'Gel Cleanser', short: 'Depuffing morning cleanser', cat: 'Nettoyants', tags: [], price: 28, size: '150 ml', refill: 22, edit: true,
      desc: 'A cooling gel cleanser with green tea and caffeine that wakes up tired skin in 60 seconds.',
      stats: [['−24%', 'Puffiness · 15min'], ['0%', 'Sulfates'], ['96%', 'Natural origin']],
      art: { kind: 'tube', glass: '#3E3A78', label: '#3E3A78', cap: '#2E2B5E', ink: '#F2F0FA' }, bg: 'linear-gradient(160deg,#E6E4F0,#D6D3E6)' },
    { id: 'roller', name: 'Kobido', sub: 'Sculpting Roller', short: 'Rose quartz face roller', cat: 'Outils', tags: ['Anti-aging'], price: 39, size: '1 pc', refill: null, badge: 'Best Seller', edit: true,
      desc: 'Rose quartz rollers inspired by the Japanese Kobido massage, for a lifted, rested face.',
      stats: [['5 min', 'Daily ritual'], ['−20%', 'Puffiness'], ['100%', 'Natural stone']],
      art: { kind: 'roller', glass: '#EBC3BC', cap: '#B98C6B', collar: '#C9A27F' }, bg: 'linear-gradient(160deg,#F6E4DE,#EDD2C8)' },
    { id: 'huile', name: 'Huile Saison', sub: 'Nourishing Oil', short: 'Seasonal nourishing face oil', cat: 'Huiles', tags: [], price: 42, size: '30 ml', refill: 34,
      desc: 'Our seasonal blend of cold-pressed squalane and sea buckthorn to nourish through autumn.',
      stats: [['+55%', 'Nutrition · D7'], ['+30%', 'Glow · D7'], ['100%', 'Natural origin']],
      art: { kind: 'dropper', glass: '#E7B97F', liquid: '#D99A4E', label: '#FBF7EF', cap: '#F4F4F2', collar: '#DAD3C8', ink: '#4A3A2A' }, bg: 'linear-gradient(160deg,#F5E7D4,#EBD5B8)' },
  ];
  const CATS = ['All', 'Anti-aging', 'Sérums', 'Huiles', 'Hydratation', 'Nettoyants', 'Outils'];

  const STUDIOS = [
    { id: 'marais', name: 'Seasonly Marais', addr: '12 rue de Turenne, 75004 Paris', hours: 'Today · 10–19h', dist: '1.2 km', bg: 'linear-gradient(140deg,#B89A86,#6E5446)' },
    { id: 'stg', name: 'Seasonly Saint-Germain', addr: '34 rue Bonaparte, 75006 Paris', hours: 'Today · 11–20h', dist: '1.3 km', bg: 'linear-gradient(140deg,#D6B48C,#8B5E3C)' },
    { id: 'lyon', name: 'Seasonly Lyon', addr: '8 rue du Plat, 69002 Lyon', hours: 'Today · 10–19h', dist: '1.4 km', bg: 'linear-gradient(140deg,#C8A9A0,#7A4F48)' },
    { id: 'bdx', name: 'Seasonly Bordeaux', addr: "21 cours de l'Intendance, 33000", hours: 'Today · 10–18h', dist: '1.5 km', bg: 'linear-gradient(140deg,#BFB3A6,#5E544B)' },
  ];
  const SERVICES = [
    { id: 'kobido', name: 'Kobido reveal', mins: 60, price: 95, desc: 'Japanese lifting massage + TensioLift mask.' },
    { id: 'drainage', name: 'Glow drainage', mins: 45, price: 75, desc: 'Lymphatic drainage for a depuffed, luminous face.' },
    { id: 'sculpt', name: 'Sculpt facial', mins: 75, price: 120, desc: 'Buccal massage, gua sha & peptide infusion.' },
    { id: 'led', name: 'LED + peptides', mins: 30, price: 55, desc: 'Red-light therapy boosted with hibiscus peptides.' },
  ];
  const SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

  const RITUALS = [
    { id: 'evening-lift', eyebrow: 'Evening lift', name: 'Sculpt + nourish', mins: 6, miles: 50,
      steps: [['Cleanse', 'Massage Glow Drainage gel for 60 seconds, rinse with cool water.', 60],
              ['Serum', 'Press 3 drops of TensioLift serum into face and neck.', 30],
              ['Sculpt', 'Roll outwards from chin to ear, 10 strokes per side.', 180],
              ['Nourish', 'Seal with 2 drops of Huile Saison, pressing gently.', 60]] },
    { id: 'kobido', eyebrow: '5 min · Ritual', name: 'Kobido reveal', mins: 5, miles: 30, bg: 'linear-gradient(160deg,#9C6B4E,#3E2A20)',
      steps: [['Warm up', 'Rub 2 drops of oil between palms and breathe deeply 3 times.', 30],
              ['Tap', 'Tap fingertips across cheeks and forehead like soft rain.', 60],
              ['Lift', 'Sweep upwards from jaw to temples, 8 times per side.', 120],
              ['Release', 'Press palms on eyes for 3 slow breaths.', 30]] },
    { id: 'drainage', eyebrow: '7 min · Ritual', name: 'Glow drainage', mins: 7, miles: 30, bg: 'linear-gradient(160deg,#4B467E,#1F1C3A)',
      steps: [['Neck', 'Sweep down the sides of the neck 10 times to open lymph nodes.', 60],
              ['Jaw', 'Glide knuckles along the jaw towards the ears.', 90],
              ['Cheeks', 'Roll from nose to ears with the Kobido roller.', 150],
              ['Eyes', 'Tap lightly under the eyes from inner to outer corner.', 60]] },
    { id: 'hibiscus', eyebrow: '4 min · Ritual', name: 'Hibiscus glow', mins: 4, miles: 30, bg: 'linear-gradient(160deg,#C98579,#6B3A35)',
      steps: [['Mist', 'Mist face and wait for skin to be just damp.', 20],
              ['Serum', 'Layer TensioLift serum with upward strokes.', 60],
              ['Mask', 'Leave a thin veil of Hydra Veil cream for 2 minutes.', 120],
              ['Glow', 'Massage the excess in with circular motions.', 40]] },
  ];

  const TIPS = [
    { id: 'hydration', title: 'Morning Hydration Ritual', lead: 'Start your day with this simple yet powerful hydration ritual for glowing skin.',
      body: ['Drink a glass of room-temperature water before your coffee — skin is the last organ to receive water.', 'Apply serum on damp skin: humectants like hyaluronic acid pull 1000× their weight in water when there is water to hold.', 'Lock it all in with a cream within 60 seconds of cleansing.'] },
    { id: 'autumn', title: 'Autumn barrier reset', lead: 'Cold wind and heating dry your skin. Here is how to switch routines.',
      body: ['Swap foaming cleansers for gels or milks.', 'Add one oil-based step in the evening.', 'Exfoliate once a week instead of three times.'] },
    { id: 'sleep', title: 'Beauty sleep, literally', lead: 'Your skin repairs itself most between 11pm and 4am.',
      body: ['Apply your richest products at night, when skin is most permeable.', 'Use a silk pillowcase to reduce friction creases.', 'Sleep slightly elevated to reduce morning puffiness.'] },
  ];

  const QUIZ = [
    ['Which skin layer do peptides like hibiscus mostly help to support?', ['The dermis', 'Nails', 'Hair shaft'], 0],
    ['How long does a full skin cell renewal cycle take for most adults?', ['3 days', 'About 28 days', '1 year'], 1],
    ['Which ingredient is a natural alternative to retinol?', ['Bakuchiol', 'Alcohol', 'Menthol'], 0],
    ['What does a Kobido massage originate from?', ['Brazil', 'Japan', 'Norway'], 1],
    ['When is your skin most permeable?', ['At noon', 'At night', 'After coffee'], 1],
    ['What is the best order for layering?', ['Oil → serum → cream', 'Serum → cream → oil', 'Cream → serum'], 1],
    ['Which ingredient pulls water into the skin?', ['Hyaluronic acid', 'Clay', 'Salicylic acid'], 0],
    ['How often should you exfoliate sensitive skin in autumn?', ['Daily', 'About once a week', 'Never'], 1],
    ['Lymphatic drainage massage mainly helps with…', ['Puffiness', 'Sunburn', 'Freckles'], 0],
    ['Which SPF is recommended for daily city wear?', ['SPF 5', 'SPF 30 or more', 'No SPF in autumn'], 1],
  ];

  const MATCH_TILES = [['🍊', 'Vitamin C'], ['🌺', 'Hibiscus'], ['💧', 'Hyaluronic'], ['🌿', 'Centella'], ['🫒', 'Squalane'], ['🍯', 'Propolis']];
  const WHEEL = [10, 25, 5, 50, 15, 100, 20, 30];

  const SEASONS = [
    { id: 'winter', name: 'Winter', months: [11, 0, 1] },
    { id: 'spring', name: 'Spring', months: [2, 3, 4] },
    { id: 'summer', name: 'Summer', months: [5, 6, 7] },
    { id: 'autumn', name: 'Autumn', months: [8, 9, 10] },
  ];

  /* Seasonal voucher catalog. kind: product = usable in the bag, service = usable when booking. */
  const VOUCHERS = [
    { id: 'au-10', season: 'autumn', kind: 'product', title: '€10 off any sérum', note: 'Valid on the TensioLift edit', cost: 800, value: 10, type: 'amount' },
    { id: 'au-oil', season: 'autumn', kind: 'product', title: '−20% Autumn nourish kit', note: 'Oils & creams, whole bag', cost: 1200, value: 20, type: 'percent' },
    { id: 'au-kobido', season: 'autumn', kind: 'service', title: '−30% Kobido reveal', note: 'Any Seasonly studio', cost: 1500, value: 30, type: 'percent' },
    { id: 'au-led', season: 'autumn', kind: 'service', title: 'Free LED session', note: '30 min · any studio', cost: 2400, value: 100, type: 'percent' },
    { id: 'wi-gift', season: 'winter', kind: 'product', title: '−25% Holiday gift box', note: 'Whole bag', cost: 1400, value: 25, type: 'percent' },
    { id: 'wi-sculpt', season: 'winter', kind: 'service', title: '€40 off Sculpt facial', note: 'Any Seasonly studio', cost: 2000, value: 40, type: 'amount' },
    { id: 'sp-peel', season: 'spring', kind: 'product', title: '€15 off Spring renewal', note: 'Exfoliants & sérums', cost: 1000, value: 15, type: 'amount' },
    { id: 'sp-drain', season: 'spring', kind: 'service', title: '−30% Glow drainage', note: 'Any Seasonly studio', cost: 1500, value: 30, type: 'percent' },
    { id: 'su-spf', season: 'summer', kind: 'product', title: 'Free SPF 50 mist', note: 'With any order', cost: 900, value: 22, type: 'amount' },
    { id: 'su-glow', season: 'summer', kind: 'service', title: '−25% Summer glow facial', note: 'Any Seasonly studio', cost: 1700, value: 25, type: 'percent' },
  ];

  const TIERS = [
    { name: 'Bourgeon', min: 0, mult: 1 },
    { name: 'Éclat', min: 1500, mult: 1.1 },
    { name: 'Rayonnance', min: 4000, mult: 1.25 },
    { name: 'Lumière', min: 8000, mult: 1.5 },
  ];

  const BADGES = [
    { id: 'first-ritual', name: 'First ritual', test: (s) => countLedger(s, 'ritual') >= 1 },
    { id: 'week-streak', name: '7-day streak', test: (s) => s.bestStreak >= 7 },
    { id: 'scholar', name: 'Skin scholar', test: (s) => (s.quizBest || 0) >= 5 },
    { id: 'memory', name: 'Sharp memory', test: (s) => s.matchBest && s.matchBest <= 10 },
    { id: 'shopper', name: 'Maison client', test: (s) => countLedger(s, 'order') >= 1 },
    { id: 'studio', name: 'Studio regular', test: (s) => (s.bookings || []).length >= 1 },
  ];

  /* ---------- Date utils ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const todayKey = () => dkey(new Date());
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  function seasonOf(d = new Date()) {
    const s = SEASONS.find((x) => x.months.includes(d.getMonth()));
    // Season ends on the last day of its third month.
    const lastMonth = s.months[2];
    const year = s.id === 'winter' && d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
    const end = new Date(year, lastMonth + 1, 0, 23, 59, 59);
    const next = SEASONS[(SEASONS.indexOf(s) + 1) % 4];
    return { ...s, end, next };
  }
  const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const nf = (n) => Math.round(n).toLocaleString('en-US');
  const eur = (n) => `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- State ---------- */
  const KEY = 'seasonly.skinmiles.v1';
  function seed() {
    // A believable demo: six days checked in, today still open, so the first check-in hits a 7-day bonus.
    const now = new Date();
    const checkins = [];
    for (let i = 6; i >= 1; i--) checkins.push(dkey(addDays(now, -i)));
    return {
      name: 'Marie', miles: 820, lifetime: 1240, streak: 6, bestStreak: 6, checkins,
      ritual: {}, done: {}, bag: [], vouchers: [], bookings: [], favs: [], badges: ['first-ritual', 'shopper'], claimed: [], quizBest: 0, matchBest: null,
      ledger: [
        { t: Date.now() - 864e5 * 2, label: 'Evening lift ritual', amt: 50, kind: 'ritual' },
        { t: Date.now() - 864e5 * 3, label: 'Order · TensioLift serum', amt: 68, kind: 'order' },
        { t: Date.now() - 864e5 * 9, label: 'Welcome bonus', amt: 500, kind: 'bonus' },
      ],
    };
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return { ...seed(), ...JSON.parse(raw) }; } catch (e) { /* storage blocked */ }
    return seed();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  const countLedger = (s, kind) => s.ledger.filter((l) => l.kind === kind).length;
  const tierOf = (lifetime) => [...TIERS].reverse().find((t) => lifetime >= t.min);
  const nextTier = (lifetime) => TIERS.find((t) => t.min > lifetime);
  const doneToday = (id) => S.done[id] === todayKey();
  const markDone = (id) => { S.done[id] = todayKey(); };
  const bagCount = () => S.bag.reduce((a, b) => a + b.qty, 0);
  const product = (id) => PRODUCTS.find((p) => p.id === id);

  /* Award miles (tier multiplier applies to everything except purchases, which are 1 mile per €). */
  function earn(amount, label, kind = 'game', { multiply = true, silent = false } = {}) {
    const before = tierOf(S.lifetime);
    const amt = Math.round(amount * (multiply ? before.mult : 1));
    S.miles += amt; S.lifetime += amt;
    S.ledger.unshift({ t: Date.now(), label, amt, kind });
    S.ledger = S.ledger.slice(0, 80);
    const after = tierOf(S.lifetime);
    checkBadges();
    save();
    if (!silent) toast(`+${nf(amt)} miles`, label);
    if (after.name !== before.name) toast(`Welcome to ${after.name}`, `Earn ×${after.mult} miles from now on`, 'tier');
    return amt;
  }
  function spend(amount, label) {
    S.miles -= amount;
    S.ledger.unshift({ t: Date.now(), label, amt: -amount, kind: 'redeem' });
    save();
  }
  function checkBadges() {
    BADGES.forEach((b) => {
      if (!S.badges.includes(b.id) && b.test(S)) { S.badges.push(b.id); toast('Badge unlocked', b.name, 'badge'); }
    });
  }

  /* ---------- UI state ---------- */
  const ui = { tab: 'home', cat: 'Anti-aging', q: '', step: 1, bk: { studio: null, service: null, day: 0, slot: null, voucher: null } };
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app'), tabbar = $('#tabbar'), sheet = $('#sheet'), toastWrap = $('#toast');

  function render() {
    const scroll = app.scrollTop;
    app.innerHTML = VIEWS[ui.tab]();
    app.dataset.tab = ui.tab;
    tabbar.innerHTML = [['home', 'home', 'Home'], ['shop', 'bag', 'Shop'], ['book', 'calendar', 'Book'], ['rewards', 'heart', 'Rewards'], ['profile', 'user', 'Profile']]
      .map(([id, icon, label]) => `<button class="tab${ui.tab === id ? ' on' : ''}" data-a="tab" data-arg="${id}" aria-label="${label}">${ic(icon, 22)}<span>${label}</span>${id === 'rewards' && canCheckIn() ? '<i class="dot"></i>' : ''}</button>`).join('');
    if (ui.keepScroll) app.scrollTop = scroll;
    ui.keepScroll = false;
  }
  const rerender = () => { ui.keepScroll = true; render(); };

  /* ---------- Shared pieces ---------- */
  const sectionHead = (title, link, action, arg = '') =>
    `<div class="sec-head"><h2>${title}</h2>${link ? `<button class="link" data-a="${action}" data-arg="${arg}">${link} →</button>` : ''}</div>`;

  function ring(done, total, size = 64) {
    const r = size / 2 - 4, c = 2 * Math.PI * r, pct = total ? done / total : 0;
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--ring-track)" stroke-width="4" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--accent)" stroke-width="4" fill="none" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
      <span>${done}/${total}</span></div>`;
  }

  function ritualProgress(id) {
    const r = S.ritual[id];
    return r && r.day === todayKey() ? r.step : 0;
  }

  function milesCard() {
    const nt = nextTier(S.lifetime), t = tierOf(S.lifetime);
    const target = nt ? nt.min : t.min, pct = nt ? Math.min(100, ((S.lifetime - t.min) / (nt.min - t.min)) * 100) : 100;
    return `<button class="miles-card glass" data-a="tab" data-arg="rewards">
      <span class="star-badge">${ic('star', 18)}</span>
      <span class="mc-body"><span class="eyebrow muted">Your Seasonly miles</span>
        <span class="mc-num">${nf(S.miles)} <small>${nt ? `/ ${nf(target)} lifetime to ${nt.name}` : `${t.name} · top tier`}</small></span>
        <span class="bar"><i style="width:${pct}%"></i></span></span></button>`;
  }

  function productCard(p) {
    return `<article class="p-card"><div class="p-wrap">
      <button class="p-media" data-a="product" data-arg="${p.id}" style="background:${p.bg}" aria-label="${esc(p.name + ' ' + p.sub)}">
        ${p.badge ? `<span class="pill-badge${p.badge === 'New' ? ' light' : ''}">${p.badge}</span>` : ''}
        ${productArt(p)}
      </button>
      <button class="add-mini" data-a="add" data-arg="${p.id}" aria-label="Add to bag">${ic('plus', 16, 2)}</button></div>
      <h3 data-a="product" data-arg="${p.id}">${p.name} ${p.sub}</h3>
      <p class="muted sm">${p.short}</p>
      <p class="p-price"><span>${eur(p.price)}</span><span class="muted">${p.size}</span></p>
    </article>`;
  }

  function heroArt() {
    // Drop a photo at assets/hero.jpg to replace the illustrated hero.
    return `<svg viewBox="0 0 400 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><radialGradient id="hg1" cx="70%" cy="30%" r="70%"><stop offset="0" stop-color="#E9C8B3"/><stop offset=".55" stop-color="#E4CFC2" stop-opacity=".6"/><stop offset="1" stop-color="#F6F1EC" stop-opacity="0"/></radialGradient>
      <radialGradient id="hg2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#D7A98C"/><stop offset="1" stop-color="#C58E6F"/></radialGradient></defs>
      <rect width="400" height="380" fill="url(#hg1)"/>
      <circle cx="330" cy="120" r="150" fill="#E8C4AE" opacity=".55"/>
      <circle cx="350" cy="80" r="90" fill="#DDB096" opacity=".35"/>
      <g transform="translate(250 70) rotate(18)">
        <rect x="0" y="0" width="12" height="150" rx="6" fill="#B98C6B"/>
        <path d="M6 10 -22 -40M6 10 34 -40" stroke="#C9A27F" stroke-width="5" stroke-linecap="round"/>
        <circle cx="-24" cy="-50" r="24" fill="url(#hg2)"/><circle cx="36" cy="-50" r="24" fill="url(#hg2)"/>
        <circle cx="-31" cy="-58" r="7" fill="#fff" opacity=".35"/><circle cx="29" cy="-58" r="7" fill="#fff" opacity=".35"/>
      </g></svg>`;
  }

  /* ---------- Views ---------- */
  const VIEWS = {
    home() {
      const s = seasonOf(), main = RITUALS[0], prog = ritualProgress(main.id);
      const tipIdx = new Date().getDate() % TIPS.length, tip = TIPS[tipIdx];
      const ritualsRecent = S.ledger.filter((l) => l.kind === 'ritual' && Date.now() - l.t < 14 * 864e5).length;
      const radiance = Math.min(42, 6 + ritualsRecent * 4);
      return `
      <section class="hero">
        <div class="hero-art">${heroArt()}</div>
        <div class="hero-top">
          <div class="logo">seasonly<small>PARIS</small></div>
          <div class="row g8">
            <span class="chip-glass">${s.name} · W${isoWeek(new Date())}</span>
            <button class="icon-glass" data-a="bag" aria-label="Bag">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button>
            <button class="icon-glass dark" data-a="tab" data-arg="rewards" aria-label="Notifications">${ic('bell', 18)}</button>
          </div>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Bonjour, ${esc(S.name)}</p>
          <h1 class="display">Your skin in <em>balance</em>,<br>this season.</h1>
        </div>
      </section>

      <button class="stats glass" data-a="tab" data-arg="rewards">
        <span class="stat"><span class="stat-ic">${ic('star', 16)}</span><b>${nf(S.miles)}</b><small>Miles</small></span>
        <span class="stat"><span class="stat-ic">${ic('clock', 16)}</span><b>${S.streak}</b><small>Day streak</small></span>
        <span class="stat"><span class="stat-ic">${ic('eye', 16)}</span><b>+${radiance}%</b><small>Radiance</small></span>
      </button>

      <div class="pad">
        ${canCheckIn() ? `<button class="checkin-banner" data-a="checkin">
          <span class="flame">${ic('flame', 20)}</span>
          <span><b>Daily check-in</b><small>Keep your ${S.streak}-day streak alive</small></span>
          <span class="pill-accent">+20 miles</span></button>` : ''}

        <article class="card tip" data-a="tip" data-arg="${tip.id}">
          <div class="row between"><span class="row g6 muted sm">${ic('book', 16)} Daily wellness tip</span>
            ${doneToday('tip-' + tip.id) ? `<span class="pill-done">${ic('check', 12, 2.4)} Read</span>` : '<span class="pill-dark">New</span>'}</div>
          <h3 class="t-title">${tip.title}</h3>
          <p class="muted">${tip.lead}</p>
          <p class="t-cta">${doneToday('tip-' + tip.id) ? 'Earned today · come back tomorrow' : 'Tap to read & earn 10 miles →'}</p>
        </article>

        ${sectionHead("Today's ritual", 'See all', 'rituals')}
        <article class="card ritual-card">
          ${ring(prog, main.steps.length)}
          <div class="grow"><p class="eyebrow accent">${main.eyebrow}</p><h3 class="serif-t">${main.name}</h3>
            <p class="muted sm">${main.steps.length} steps · ${main.mins} min · ${doneToday('ritual-' + main.id) ? 'earned' : `+${main.miles} miles`}</p></div>
          <button class="btn-dark sm" data-a="ritual" data-arg="${main.id}">${doneToday('ritual-' + main.id) ? 'Again' : prog ? 'Resume' : 'Start'} ${ic('play', 14)}</button>
        </article>

        ${sectionHead(`Curated for ${s.name.toLowerCase()}`, 'More', 'rituals')}
      </div>
      <div class="hscroll">
        ${RITUALS.slice(1).map((r) => `<button class="curated" data-a="ritual" data-arg="${r.id}" style="background:${r.bg}">
          <span class="curated-art">${productArt(PRODUCTS[r.id === 'drainage' ? 3 : r.id === 'kobido' ? 4 : 0], true)}</span>
          <span class="curated-copy"><span class="eyebrow">${r.eyebrow}</span><span class="serif-xl">${r.name}</span>
          <span class="miles-chip">${doneToday('ritual-' + r.id) ? 'Earned today' : `+${r.miles} miles`}</span></span></button>`).join('')}
      </div>
      <div class="pad">${sectionHead('From the laboratoire', 'Shop all', 'tab', 'shop')}</div>
      <div class="hscroll small">${PRODUCTS.map(productCard).join('')}</div>
      <div class="spacer"></div>`;
    },

    shop() {
      const q = ui.q.trim().toLowerCase();
      const list = PRODUCTS.filter((p) => (ui.cat === 'All' || p.cat === ui.cat || p.tags.includes(ui.cat)) &&
        (!q || `${p.name} ${p.sub} ${p.short} ${p.cat}`.toLowerCase().includes(q)));
      return `<div class="pad top">
        <div class="row between">
          <div><p class="eyebrow accent">Boutique</p><h1 class="serif-h">La maison</h1></div>
          <div class="row g8"><button class="icon-btn" data-a="focus-search" aria-label="Search">${ic('search', 18)}</button>
          <button class="icon-btn" data-a="bag" aria-label="Bag">${ic('bag', 18)}${bagCount() ? `<b class="count">${bagCount()}</b>` : ''}</button></div>
        </div>
        <label class="search glass">${ic('search', 16)}<input id="search" type="search" placeholder="Search the laboratoire…" value="${esc(ui.q)}" autocomplete="off"></label>
      </div>
      <div class="chips">${CATS.map((c) => `<button class="chip${ui.cat === c ? ' on' : ''}" data-a="cat" data-arg="${c}">${c}</button>`).join('')}</div>
      <div class="pad">
        ${milesCard()}
        ${sectionHead(ui.cat === 'All' ? 'The full collection' : ui.cat === 'Anti-aging' ? 'The TensioLift edit' : ui.cat, `${list.length} items`, 'cat', 'All')}
        ${list.length ? `<div class="p-grid">${list.map(productCard).join('')}</div>` : '<p class="empty">Nothing matches that search yet.</p>'}
      </div><div class="spacer"></div>`;
    },

    book() {
      const titles = { 1: ['Choose your', 'maison'], 2: ['Choose your', 'soin'], 3: ['Pick your', 'moment'], 4: ['Confirm your', 'visit'] };
      const [a, b] = titles[ui.step];
      const steps = ['Studio', 'Soin', 'Date', 'Confirm'];
      let body = '';
      if (ui.step === 1) {
        body = STUDIOS.map((s) => `<button class="studio card" data-a="pick-studio" data-arg="${s.id}">
          <span class="studio-img" style="background:${s.bg}">${ic('leaf', 26, 1.2)}</span>
          <span class="grow"><span class="serif-t">${s.name}</span><span class="muted sm block">${s.addr}</span>
          <span class="sm block mt4"><i class="live"></i><b>${s.hours}</b> <span class="muted">· ${s.dist}</span></span></span>
          <span class="round-dark">${ic('chevron', 16, 2)}</span></button>`).join('') +
          `<button class="loc-row card" data-a="locate">${ic('locate', 18)} <span><b>Use my location</b><small class="muted block">Find the nearest maison</small></span></button>`;
      } else if (ui.step === 2) {
        body = SERVICES.map((s) => `<button class="card svc${ui.bk.service === s.id ? ' sel' : ''}" data-a="pick-service" data-arg="${s.id}">
          <span class="grow"><span class="serif-t">${s.name}</span><span class="muted sm block">${s.desc}</span>
          <span class="sm block mt4"><b>${eur(s.price)}</b> <span class="muted">· ${s.mins} min · +150 miles</span></span></span>
          <span class="round-dark">${ic('chevron', 16, 2)}</span></button>`).join('');
      } else if (ui.step === 3) {
        const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));
        body = `<div class="days">${days.map((d, i) => `<button class="day${ui.bk.day === i ? ' on' : ''}" data-a="pick-day" data-arg="${i}">
            <small>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</small><b>${d.getDate()}</b></button>`).join('')}</div>
          <p class="eyebrow muted mt16">Available</p>
          <div class="slots">${SLOTS.map((t, i) => `<button class="slot${ui.bk.slot === t ? ' on' : ''}${(i + ui.bk.day) % 4 === 3 ? ' off' : ''}" data-a="pick-slot" data-arg="${t}" ${(i + ui.bk.day) % 4 === 3 ? 'disabled' : ''}>${t}</button>`).join('')}</div>
          <button class="btn-dark wide mt16" data-a="step" data-arg="4" ${ui.bk.slot ? '' : 'disabled'}>Continue</button>`;
      } else {
        const st = STUDIOS.find((x) => x.id === ui.bk.studio), sv = SERVICES.find((x) => x.id === ui.bk.service);
        const day = addDays(new Date(), ui.bk.day + 1);
        const usable = S.vouchers.filter((v) => !v.used && v.kind === 'service' && new Date(v.expires) > new Date());
        const vch = usable.find((v) => v.code === ui.bk.voucher);
        const disc = vch ? discount(vch, sv.price) : 0;
        body = `<div class="card summary">
            <div class="sum-row"><span class="muted">Maison</span><b>${st.name}</b></div>
            <div class="sum-row"><span class="muted">Soin</span><b>${sv.name} · ${sv.mins} min</b></div>
            <div class="sum-row"><span class="muted">Moment</span><b>${day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${ui.bk.slot}</b></div>
            <hr>
            ${usable.length ? `<p class="eyebrow muted">Apply a Skin Miles voucher</p>
              <div class="v-pick">${usable.map((v) => `<button class="v-opt${ui.bk.voucher === v.code ? ' on' : ''}" data-a="bk-voucher" data-arg="${v.code}">${ic('ticket', 16)} ${v.title}</button>`).join('')}</div><hr>` : ''}
            ${disc ? `<div class="sum-row"><span class="muted">Voucher</span><b class="accent">−${eur(disc)}</b></div>` : ''}
            <div class="sum-row big"><span>Total at the studio</span><b>${eur(sv.price - disc)}</b></div>
          </div>
          <button class="btn-dark wide mt16" data-a="confirm-booking">Confirm · +150 miles</button>`;
      }
      return `<div class="pad top">
        ${ui.step > 1 ? `<button class="icon-btn" data-a="step" data-arg="${ui.step - 1}" aria-label="Back">${ic('back', 18)}</button>` : '<div class="icon-spacer"></div>'}
        <p class="eyebrow accent mt16">Step ${ui.step} of 4</p>
        <h1 class="serif-h">${a} <em class="accent">${b}</em></h1>
        <div class="stepper glass">${steps.map((s, i) => `<span class="${i + 1 < ui.step ? 'done' : i + 1 === ui.step ? 'on' : ''}"><i>${i + 1 < ui.step ? '✓' : i + 1}</i>${s}</span>`).join('<b></b>')}</div>
        <div class="stack">${body}</div>
      </div><div class="spacer"></div>`;
    },

    rewards() {
      const t = tierOf(S.lifetime), nt = nextTier(S.lifetime), s = seasonOf();
      const pct = nt ? Math.min(100, ((S.lifetime - t.min) / (nt.min - t.min)) * 100) : 100;
      const games = [
        ['match', 'grid', 'Glow Match', 'Pair the actives', 'up to 80'],
        ['quiz', 'quiz', 'Skin Quiz', '5 questions', 'up to 50'],
        ['wheel', 'wheel', 'Glow Wheel', 'One spin a day', '5–100'],
        ['ritual', 'sparkle', 'Rituals', 'Guided massage', '30–50'],
      ];
      const seasonV = VOUCHERS.filter((v) => v.season === s.id);
      const nextV = VOUCHERS.filter((v) => v.season === s.next.id);
      const myV = S.vouchers.filter((v) => !v.used);
      const challenges = challengeList();
      return `<div class="pad top">
        <p class="eyebrow accent">Skin Miles</p>
        <h1 class="serif-h">Your <em class="accent">rewards</em></h1>

        <section class="wallet">
          <div class="row between"><span class="eyebrow">${t.name} member</span><span class="chip-glass dark">${s.name} · W${isoWeek(new Date())}</span></div>
          <div class="wallet-num">${nf(S.miles)}<small>miles</small></div>
          <div class="bar light"><i style="width:${pct}%"></i></div>
          <p class="wallet-note">${nt ? `${nf(nt.min - S.lifetime)} lifetime miles to <b>${nt.name}</b> · earn ×${nt.mult}` : 'Top tier reached · earn ×1.5 on everything'}</p>
        </section>

        <section class="card week">
          <div class="row between"><div><b class="streak-n">${S.streak}</b> <span class="muted">day streak</span></div>
            <span class="muted sm">Best ${S.bestStreak}</span></div>
          ${weekRow()}
          ${canCheckIn() ? '<button class="btn-dark wide" data-a="checkin">Check in today · +20 miles</button>' : `<p class="muted sm center">Checked in today — see you tomorrow ✨<br>Next bonus at ${nextMilestone()} days.</p>`}
        </section>

        ${sectionHead('Play & earn')}
        <div class="games">${games.map(([id, icon, name, sub, rew]) => {
          const done = id === 'ritual' ? RITUALS.every((r) => doneToday('ritual-' + r.id)) : doneToday(id);
          return `<button class="game card" data-a="${id === 'ritual' ? 'rituals' : 'game'}" data-arg="${id}">
            <span class="game-ic">${ic(icon, 22)}</span><b>${name}</b><small class="muted">${sub}</small>
            <span class="${done ? 'pill-done' : 'pill-accent'}">${done ? `${ic('check', 12, 2.4)} Done today` : `+${rew}`}</span></button>`;
        }).join('')}</div>

        ${sectionHead('Challenges')}
        <div class="card stack-tight">${challenges.map((c) => {
          const claimed = S.claimed.includes(c.key), full = c.v >= c.max;
          return `<div class="chal">
          <div class="row between g8"><span class="sm"><b>${c.name}</b></span>
            ${claimed ? `<span class="pill-done">${ic('check', 12, 2.4)} Claimed</span>`
              : full ? `<button class="btn-dark xs" data-a="claim" data-arg="${c.key}">Claim +${c.rew}</button>`
              : `<span class="sm muted">${c.v}/${c.max} · ${c.rew} mi</span>`}</div>
          <div class="bar"><i style="width:${(c.v / c.max) * 100}%"></i></div></div>`;
        }).join('')}</div>

        ${sectionHead(`${s.name} vouchers`)}
        <p class="muted sm mb12">Trade your miles for seasonal products and soins. Vouchers are valid until ${fmtDate(s.end)}.</p>
        <div class="stack">${seasonV.map((v) => voucherCard(v, true)).join('')}</div>

        ${myV.length ? `${sectionHead('My vouchers')}<div class="stack">${myV.map(myVoucher).join('')}</div>` : ''}

        ${sectionHead(`Coming in ${s.next.name.toLowerCase()}`)}
        <div class="stack">${nextV.map((v) => voucherCard(v, false)).join('')}</div>

        ${sectionHead('Badges')}
        <div class="badges">${BADGES.map((b) => `<div class="badge${S.badges.includes(b.id) ? ' on' : ''}"><span>${ic(S.badges.includes(b.id) ? 'trophy' : 'lock', 22)}</span><small>${b.name}</small></div>`).join('')}</div>
      </div><div class="spacer"></div>`;
    },

    profile() {
      const t = tierOf(S.lifetime);
      return `<div class="pad top">
        <p class="eyebrow accent">Profile</p>
        <h1 class="serif-h">Bonjour, <em class="accent">${esc(S.name)}</em></h1>
        <div class="card row g12 mt16"><span class="avatar">${esc(S.name[0])}</span>
          <div class="grow"><b>${esc(S.name)}</b><small class="muted block">${t.name} · ${nf(S.lifetime)} lifetime miles</small></div>
          <button class="link" data-a="rename">Edit</button></div>

        ${S.bookings.length ? `${sectionHead('Upcoming visits')}<div class="stack">${S.bookings.slice(0, 3).map((b) => `<div class="card">
          <b class="serif-t">${b.service}</b><small class="muted block">${b.studio} · ${b.when}</small>${b.voucher ? `<small class="accent block">Voucher ${b.voucher} applied</small>` : ''}</div>`).join('')}</div>` : ''}

        ${sectionHead('Miles history')}
        <div class="card ledger">${S.ledger.slice(0, 25).map((l) => `<div class="led">
          <span><b>${esc(l.label)}</b><small class="muted block">${new Date(l.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span>
          <b class="${l.amt > 0 ? 'accent' : ''}">${l.amt > 0 ? '+' : ''}${nf(l.amt)}</b></div>`).join('')}</div>

        ${sectionHead('How Skin Miles work')}
        <div class="card how">
          <p><b>Daily check-in</b> +20 · bonus at 7, 14, 30, 100 and 365 days</p>
          <p><b>Wellness tip</b> +10 each, daily</p>
          <p><b>Rituals</b> +30 to +50 when completed</p>
          <p><b>Games</b> Glow Match, Skin Quiz & Glow Wheel, once a day</p>
          <p><b>Orders</b> 1 mile per €1 · <b>Studio visits</b> +150</p>
          <p class="muted">Tiers multiply every non-purchase reward: Éclat ×1.1, Rayonnance ×1.25, Lumière ×1.5.</p>
        </div>
        <button class="btn-ghost wide mt16" data-a="reset">Reset demo data</button>
      </div><div class="spacer"></div>`;
    },
  };

  /* ---------- Challenges (claimable once per week / season) ---------- */
  function challengeList() {
    const now = new Date(), s = seasonOf(now);
    const dow = (now.getDay() + 6) % 7, monday = addDays(now, -dow); monday.setHours(0, 0, 0, 0);
    const week = `${now.getFullYear()}-W${isoWeek(now)}`, seasonKey = `${s.id}-${s.end.getFullYear()}`;
    const seasonStart = new Date(s.end.getFullYear(), s.end.getMonth() - 2, 1).getTime();
    const since = (kind, t) => S.ledger.filter((l) => l.kind === kind && l.t >= t).length;
    return [
      { key: `rituals-${week}`, name: 'Complete 5 rituals this week', v: Math.min(since('ritual', monday.getTime()), 5), max: 5, rew: 150 },
      { key: `tips-${week}`, name: 'Read 3 wellness tips this week', v: Math.min(since('tip', monday.getTime()), 3), max: 3, rew: 60 },
      { key: `soin-${seasonKey}`, name: `Book one soin this ${s.name.toLowerCase()}`, v: Math.min(S.bookings.filter((b) => b.t >= seasonStart).length, 1), max: 1, rew: 200 },
    ];
  }
  function claim(key) {
    const c = challengeList().find((x) => x.key === key);
    if (!c || c.v < c.max || S.claimed.includes(key)) return;
    S.claimed.push(key);
    earn(c.rew, `Challenge · ${c.name}`, 'bonus');
    rerender();
  }

  /* ---------- Streak ---------- */
  const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  const MILESTONES = { 7: 100, 14: 150, 30: 300, 60: 400, 100: 600, 365: 2000 };
  const canCheckIn = () => !S.checkins.includes(todayKey());
  const nextMilestone = () => Object.keys(MILESTONES).map(Number).find((m) => m > S.streak) || '∞';
  function weekRow(celebrate = false) {
    const now = new Date(), dow = (now.getDay() + 6) % 7, monday = addDays(now, -dow);
    return `<div class="weekrow${celebrate ? ' cel' : ''}">${DAYS_FR.map((d, i) => {
      const day = addDays(monday, i), k = dkey(day), isToday = i === dow, on = S.checkins.includes(k);
      return `<div class="wd${isToday ? ' today' : ''}"><small>${d}</small><span class="${on ? 'on' : ''}">${on ? (isToday && celebrate ? '🎁' : ic('check', 14, 2.6)) : ''}</span></div>`;
    }).join('')}</div>`;
  }
  function checkIn() {
    if (!canCheckIn()) return;
    const yesterday = dkey(addDays(new Date(), -1));
    S.streak = S.checkins.includes(yesterday) ? S.streak + 1 : 1;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    S.checkins.push(todayKey());
    S.checkins = S.checkins.slice(-400);
    let bonus = MILESTONES[S.streak] || 0;
    const base = earn(20, `Daily check-in · day ${S.streak}`, 'checkin', { silent: true });
    let extra = 0;
    if (bonus) extra = earn(bonus, `${S.streak}-day streak bonus`, 'bonus', { silent: true });
    celebrate(base + extra);
    rerender();
  }
  function celebrate(amt) {
    const msgs = { 1: 'A fresh start — your skin loves consistency.', 7: 'One full week of rituals. Your glow is showing!', 30: 'A whole month of care: you are a model of perseverance.', 365: 'Une année entière de bien-être : vous êtes un modèle de persévérance !' };
    const msg = msgs[S.streak] || (S.streak % 7 === 0 ? `${S.streak / 7} weeks in a row. Magnifique.` : 'Every day counts. Come back tomorrow to keep the flame.');
    const conf = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 7) * 0.12}s;background:${['#C4806C', '#E9A27A', '#F2C6A8', '#0E0E10', '#D9B48C'][i % 5]}"></i>`).join('');
    openSheet(`<div class="celebrate">
      <div class="confetti">${conf}</div>
      <div class="cel-mid">
        <div class="puffy" data-n="${S.streak}">${S.streak}</div>
        <p class="cel-sub">jours de suite</p>
        <span class="pill-accent big">+${nf(amt)} Skin Miles</span>
        <div class="card cel-card">${weekRow(true)}<p class="muted center">${msg}</p></div>
      </div>
      <button class="btn-dark wide" data-a="close">Continuer</button>
    </div>`, 'full plain');
  }

  /* ---------- Vouchers ---------- */
  function voucherCard(v, active) {
    const afford = S.miles >= v.cost;
    return `<div class="voucher${active ? '' : ' locked'}">
      <div class="v-left"><span class="v-kind">${v.kind === 'service' ? 'Soin' : 'Produit'}</span>${ic(v.kind === 'service' ? 'calendar' : 'bag', 22)}</div>
      <div class="v-body"><b>${v.title}</b><small class="muted block">${v.note}</small>
        <span class="v-cost">${ic('star', 13, 2)} ${nf(v.cost)} miles</span></div>
      ${active ? `<button class="btn-dark xs" data-a="redeem" data-arg="${v.id}" ${afford ? '' : 'disabled'}>${afford ? 'Redeem' : `${nf(v.cost - S.miles)} to go`}</button>`
               : `<span class="lock">${ic('lock', 16)}</span>`}
    </div>`;
  }
  function myVoucher(v) {
    return `<div class="voucher mine">
      <div class="v-left"><span class="v-kind">${v.kind === 'service' ? 'Soin' : 'Produit'}</span>${ic('ticket', 22)}</div>
      <div class="v-body"><b>${v.title}</b><small class="muted block">Use ${v.kind === 'service' ? 'when booking' : 'in your bag'} · until ${fmtDate(new Date(v.expires))}</small>
      <span class="code">${v.code}</span></div>
      <button class="btn-ghost xs" data-a="${v.kind === 'service' ? 'tab' : 'bag'}" data-arg="${v.kind === 'service' ? 'book' : ''}">Use</button></div>`;
  }
  function redeem(id) {
    const v = VOUCHERS.find((x) => x.id === id);
    if (!v || S.miles < v.cost) return;
    openSheet(`<div class="sheet-pad">
      <p class="eyebrow accent">Redeem voucher</p><h2 class="serif-h sm">${v.title}</h2>
      <p class="muted">${v.note}. Valid until ${fmtDate(seasonOf().end)}.</p>
      <div class="card row between mt16"><span class="muted">Cost</span><b>${nf(v.cost)} miles</b></div>
      <div class="card row between"><span class="muted">Balance after</span><b>${nf(S.miles - v.cost)} miles</b></div>
      <button class="btn-dark wide mt16" data-a="redeem-ok" data-arg="${v.id}">Confirm redemption</button>
      <button class="btn-ghost wide mt8" data-a="close">Not now</button></div>`);
  }
  function redeemOk(id) {
    const v = VOUCHERS.find((x) => x.id === id);
    if (!v || S.miles < v.cost) return closeSheet();
    spend(v.cost, `Voucher · ${v.title}`);
    const code = `SEAS-${v.season.slice(0, 2).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    S.vouchers.unshift({ ...v, code, used: false, expires: seasonOf().end.toISOString() });
    save();
    openSheet(`<div class="sheet-pad center">
      <div class="ticket-big">${ic('ticket', 40, 1.3)}</div>
      <p class="eyebrow accent mt16">Voucher unlocked</p><h2 class="serif-h sm">${v.title}</h2>
      <div class="code big">${code}</div>
      <p class="muted">Saved in Rewards → My vouchers. Use it ${v.kind === 'service' ? 'at the confirm step when you book a soin' : 'at checkout in your bag'}.</p>
      <button class="btn-dark wide mt16" data-a="${v.kind === 'service' ? 'use-service' : 'bag'}">${v.kind === 'service' ? 'Book a soin' : 'Open my bag'}</button>
      <button class="btn-ghost wide mt8" data-a="close">Done</button></div>`);
    rerender();
  }
  const discount = (v, subtotal) => Math.min(subtotal, v.type === 'percent' ? Math.round(subtotal * v.value) / 100 : v.value);

  /* ---------- Bag ---------- */
  let bagVoucher = null;
  function addToBag(id, qty = 1) {
    const line = S.bag.find((l) => l.id === id);
    if (line) line.qty += qty; else S.bag.push({ id, qty });
    save();
    toast('Added to bag', `${product(id).name} ${product(id).sub}`, 'bag');
    rerender();
  }
  function bagView() {
    const lines = S.bag.map((l) => ({ ...l, p: product(l.id) }));
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const usable = S.vouchers.filter((v) => !v.used && v.kind === 'product' && new Date(v.expires) > new Date());
    if (bagVoucher && !usable.find((v) => v.code === bagVoucher)) bagVoucher = null;
    const v = usable.find((x) => x.code === bagVoucher);
    const disc = v ? discount(v, subtotal) : 0;
    const total = Math.max(0, subtotal - disc);
    return `<div class="sheet-pad">
      <div class="row between"><div><p class="eyebrow accent">Your bag</p><h2 class="serif-h sm">Le panier</h2></div>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
      ${lines.length ? `<div class="stack mt16">${lines.map((l) => `<div class="bag-line card">
          <span class="bag-thumb" style="background:${l.p.bg}">${productArt(l.p)}</span>
          <span class="grow"><b>${l.p.name} ${l.p.sub}</b><small class="muted block">${l.p.size} · ${eur(l.p.price)}</small></span>
          <span class="qty"><button data-a="qty" data-arg="${l.id}:-1" aria-label="Less">${ic('minus', 14, 2)}</button><b>${l.qty}</b><button data-a="qty" data-arg="${l.id}:1" aria-label="More">${ic('plus', 14, 2)}</button></span></div>`).join('')}</div>
        ${usable.length ? `<p class="eyebrow muted mt16">Skin Miles vouchers</p><div class="v-pick">${usable.map((x) => `<button class="v-opt${bagVoucher === x.code ? ' on' : ''}" data-a="bag-voucher" data-arg="${x.code}">${ic('ticket', 16)} ${x.title}</button>`).join('')}</div>`
          : `<button class="hint card mt16" data-a="go-rewards">${ic('gift', 18)} <span>Have miles? Redeem a seasonal voucher in Rewards →</span></button>`}
        <div class="card summary mt16">
          <div class="sum-row"><span class="muted">Subtotal</span><b>${eur(subtotal)}</b></div>
          ${disc ? `<div class="sum-row"><span class="muted">Voucher ${v.code}</span><b class="accent">−${eur(disc)}</b></div>` : ''}
          <div class="sum-row"><span class="muted">Delivery</span><b>Free</b></div>
          <div class="sum-row big"><span>Total</span><b>${eur(total)}</b></div>
        </div>
        <button class="btn-dark wide mt16" data-a="checkout">Checkout · earn ${nf(Math.floor(total))} miles</button>`
      : `<div class="empty-bag"><span>${ic('bag', 36, 1.2)}</span><p class="serif-t">Your bag is empty</p><p class="muted sm">Explore the TensioLift edit — every €1 earns 1 Skin Mile.</p>
         <button class="btn-dark mt16" data-a="go-shop">Visit the boutique</button></div>`}
    </div>`;
  }
  function checkout() {
    const lines = S.bag.map((l) => ({ ...l, p: product(l.id) }));
    if (!lines.length) return;
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const v = S.vouchers.find((x) => x.code === bagVoucher && !x.used);
    const disc = v ? discount(v, subtotal) : 0;
    const total = Math.max(0, subtotal - disc);
    if (v) v.used = true;
    S.bag = []; bagVoucher = null;
    const amt = earn(Math.floor(total), `Order · ${lines.map((l) => l.p.name).join(', ')}`, 'order', { multiply: false });
    openSheet(`<div class="sheet-pad center">
      <div class="ticket-big">${ic('check', 40, 1.6)}</div>
      <p class="eyebrow accent mt16">Merci !</p><h2 class="serif-h sm">Order confirmed</h2>
      <p class="muted">Paid ${eur(total)}${disc ? ` · saved ${eur(disc)} with your voucher` : ''}. You earned <b>${nf(amt)} Skin Miles</b>.</p>
      <button class="btn-dark wide mt16" data-a="close">Continue</button></div>`);
    rerender();
  }

  /* ---------- Product detail ---------- */
  function productView(id) {
    const p = product(id), fav = S.favs.includes(id);
    return `<div class="pdp">
      <div class="pdp-hero" style="background:${p.bg}">
        <div class="row between pdp-bar"><button class="icon-glass light" data-a="close" aria-label="Back">${ic('back', 18)}</button>
          <div class="row g8"><button class="icon-glass light" data-a="share" aria-label="Share">${ic('share', 18)}</button>
          <button class="icon-glass light${fav ? ' fav' : ''}" data-a="fav" data-arg="${p.id}" aria-label="Favourite">${ic('heart', 18)}</button></div></div>
        <div class="row g6 pdp-badges">${p.badge ? `<span class="pill-dark">★ ${p.badge}</span>` : ''}<span class="pill-light">Clinically proven</span></div>
        ${productArt(p, true)}
        <span class="size-pill">${p.size}</span>
      </div>
      <div class="pdp-body">
        <p class="eyebrow accent">${p.cat} · ${p.tags[0] || 'Seasonly'}</p>
        <h1 class="serif-h">${p.name}<br><em>${p.sub}</em></h1>
        <p class="muted">${p.desc}</p>
        <div class="pstats card">${p.stats.map(([v, l]) => `<span><b class="serif-t">${v}</b><small class="muted">${l}</small></span>`).join('')}</div>
        <div class="earn-note">${ic('star', 16)} Earn <b>${p.price} Skin Miles</b> with this purchase</div>
      </div>
      <div class="buybar glass">
        <div><b class="serif-t">${eur(p.price)}</b><small class="muted block">${p.size.toUpperCase()}${p.refill ? ` · REFILL ${eur(p.refill)}` : ''}</small></div>
        <button class="btn-dark" data-a="add-close" data-arg="${p.id}">Add — bag</button>
      </div></div>`;
  }

  /* ---------- Rituals ---------- */
  let ritualTimer = null;
  function ritualsList() {
    return `<div class="sheet-pad">
      <div class="row between"><div><p class="eyebrow accent">Rituals</p><h2 class="serif-h sm">Guided <em class="accent">care</em></h2></div>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
      <div class="stack mt16">${RITUALS.map((r) => `<button class="card ritual-card" data-a="ritual" data-arg="${r.id}">
        ${ring(ritualProgress(r.id), r.steps.length, 54)}
        <span class="grow"><span class="eyebrow accent block">${r.eyebrow}</span><span class="serif-t block">${r.name}</span>
        <small class="muted">${r.steps.length} steps · ${r.mins} min · ${doneToday('ritual-' + r.id) ? 'earned today' : `+${r.miles} miles`}</small></span>
        <span class="round-dark">${ic('play', 12)}</span></button>`).join('')}</div></div>`;
  }
  function ritualView(id) {
    const r = RITUALS.find((x) => x.id === id);
    const step = ritualProgress(id);
    if (step >= r.steps.length) {
      return `<div class="sheet-pad center">
        <div class="ticket-big">${ic('sparkle', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">Ritual complete</p><h2 class="serif-h sm">${r.name}</h2>
        <p class="muted">Beautiful work. Your skin thanks you — see you for the next one.</p>
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
    ritualTimer = setInterval(() => {
      left -= 1;
      const t = $('#timer'); if (!t) return clearInterval(ritualTimer);
      t.textContent = fmtSecs(Math.max(left, 0));
      circle.setAttribute('stroke-dashoffset', c * (left / total));
      if (left <= 0) { clearInterval(ritualTimer); $('#timerBtn').textContent = 'Time ✓'; if (navigator.vibrate) navigator.vibrate(120); }
    }, 1000);
    circle.setAttribute('stroke-dashoffset', c);
  }
  function ritualNext(id) {
    clearInterval(ritualTimer);
    const r = RITUALS.find((x) => x.id === id);
    const step = ritualProgress(id) + 1;
    S.ritual[id] = { day: todayKey(), step };
    if (step >= r.steps.length && !doneToday('ritual-' + id)) {
      markDone('ritual-' + id);
      earn(r.miles, `${r.name} ritual`, 'ritual');
    }
    save();
    refreshSheet();
    rerender();
  }

  /* ---------- Games ---------- */
  let G = {};
  function gameView(id) {
    if (id === 'match') return matchView();
    if (id === 'quiz') return quizView();
    return wheelView();
  }
  const gameHead = (title, sub) => `<div class="game-head"><div class="row between"><div><p class="eyebrow accent">Play & earn</p><h2 class="serif-h sm">${title}</h2></div>
    <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div><p class="muted sm">${sub}</p></div>`;

  // Glow Match — memory game
  function newMatch() {
    const deck = [...MATCH_TILES, ...MATCH_TILES].map((t, i) => ({ k: t[0], name: t[1], id: i }));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    G = { type: 'match', deck, open: [], matched: [], moves: 0, lock: false, over: false };
  }
  function matchView() {
    if (G.type !== 'match') newMatch();
    const played = doneToday('match');
    const reward = Math.max(20, 80 - Math.max(0, G.moves - 6) * 5);
    return `<div class="sheet-pad">${gameHead('Glow Match', played && !G.over ? 'Practice round — miles already earned today. Fewer moves, more miles.' : 'Pair the six actives. 6 moves = 80 miles, every extra move −5 (min 20).')}
      <div class="row between mt12"><span class="pill-light">Moves · ${G.moves}</span><span class="pill-accent">${played && !G.over ? 'Practice' : `+${reward} if you finish now`}</span></div>
      <div class="match">${G.deck.map((c, i) => {
        const up = G.open.includes(i) || G.matched.includes(c.k);
        return `<button class="mcard${up ? ' up' : ''}${G.matched.includes(c.k) ? ' ok' : ''}" data-a="flip" data-arg="${i}" aria-label="${up ? c.name : 'Hidden card'}">
          <span class="back">s</span><span class="front"><em>${c.k}</em><small>${c.name}</small></span></button>`;
      }).join('')}</div>
      ${G.over ? `<div class="card center mt12"><p class="serif-t">Matched in ${G.moves} moves</p><p class="muted sm">${G.earned ? `+${G.earned} miles earned` : 'Practice round complete'}</p>
        <button class="btn-dark wide mt12" data-a="match-again">Play again</button></div>` : ''}</div>`;
  }
  function flip(i) {
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
        S.matchBest = S.matchBest ? Math.min(S.matchBest, G.moves) : G.moves;
        if (!doneToday('match')) { markDone('match'); G.earned = earn(Math.max(20, 80 - Math.max(0, G.moves - 6) * 5), 'Glow Match', 'game'); }
        save(); rerender();
      }
    }
    refreshSheet();
  }

  // Skin Quiz
  function newQuiz() {
    const qs = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 5);
    G = { type: 'quiz', qs, i: 0, score: 0, picked: null, over: false };
  }
  function quizView() {
    if (G.type !== 'quiz') newQuiz();
    const played = doneToday('quiz');
    if (G.over) {
      return `<div class="sheet-pad center">${gameHead('Skin Quiz', '')}
        <div class="puffy sm">${G.score}/5</div>
        <p class="serif-t">${G.score >= 4 ? 'Expert de la peau !' : G.score >= 2 ? 'Bien joué' : 'Keep learning'}</p>
        <p class="muted">${G.earned ? `+${G.earned} miles earned` : 'Practice round — come back tomorrow for miles.'}</p>
        <button class="btn-dark wide mt16" data-a="quiz-again">New questions</button></div>`;
    }
    const [q, opts, ans] = G.qs[G.i];
    return `<div class="sheet-pad">${gameHead('Skin Quiz', played ? 'Practice round — miles already earned today.' : '+10 miles per correct answer.')}
      <div class="dots mt12">${G.qs.map((_, i) => `<i class="${i < G.i ? 'done' : i === G.i ? 'on' : ''}"></i>`).join('')}</div>
      <h3 class="serif-t q">${q}</h3>
      <div class="stack">${opts.map((o, i) => {
        let cls = '';
        if (G.picked !== null) cls = i === ans ? ' right' : i === G.picked ? ' wrong' : ' dim';
        return `<button class="answer card${cls}" data-a="answer" data-arg="${i}" ${G.picked !== null ? 'disabled' : ''}>${o}</button>`;
      }).join('')}</div>
      ${G.picked !== null ? `<button class="btn-dark wide mt16" data-a="quiz-next">${G.i === 4 ? 'See my score' : 'Next question'}</button>` : ''}</div>`;
  }
  function answer(i) {
    if (G.picked !== null) return;
    G.picked = +i;
    if (G.picked === G.qs[G.i][2]) G.score++;
    refreshSheet();
  }
  function quizNext() {
    if (G.i < 4) { G.i++; G.picked = null; return refreshSheet(); }
    G.over = true;
    S.quizBest = Math.max(S.quizBest || 0, G.score);
    if (!doneToday('quiz')) { markDone('quiz'); if (G.score) G.earned = earn(G.score * 10, `Skin Quiz · ${G.score}/5`, 'game'); }
    checkBadges(); save(); rerender(); refreshSheet();
  }

  // Glow Wheel
  function wheelView() {
    const played = doneToday('wheel');
    const n = WHEEL.length, seg = 360 / n;
    const colors = ['#F3E3DA', '#E9C8B3', '#F6EDE6', '#C4806C', '#EFD9CB', '#0E0E10', '#F3E3DA', '#DDB096'];
    const slices = WHEEL.map((v, i) => {
      const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180;
      const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0), x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1);
      const mid = (i + 0.5) * seg;
      const dark = ['#C4806C', '#0E0E10'].includes(colors[i]);
      return `<path d="M100 100 L${x0} ${y0} A96 96 0 0 1 ${x1} ${y1}Z" fill="${colors[i]}" stroke="#fff" stroke-width="1.5"/>
        <text x="100" y="30" transform="rotate(${mid} 100 100)" text-anchor="middle" font-family="Inter" font-weight="700" font-size="14" fill="${dark ? '#fff' : '#0E0E10'}">${v}</text>`;
    }).join('');
    return `<div class="sheet-pad center">${gameHead('Glow Wheel', played ? `Today's spin is done${S.wheelWin ? ` — you won ${S.wheelWin} miles${tierOf(S.lifetime).mult > 1 ? ' incl. your tier bonus' : ''}` : ''}. A new spin unlocks tomorrow.` : 'One free spin every day. Every slice is a win.')}
      <div class="wheel-wrap"><span class="pointer"></span>
        <svg id="wheel" class="wheel" viewBox="0 0 200 200" style="transform:rotate(${G.rot || 0}deg)">${slices}<circle cx="100" cy="100" r="16" fill="#fff"/><text x="100" y="104" text-anchor="middle" font-family="Cormorant Garamond" font-size="12" fill="#0E0E10">s</text></svg></div>
      <button class="btn-dark wide" data-a="spin" ${played || G.spinning ? 'disabled' : ''}>${played ? 'Come back tomorrow' : G.spinning ? 'Spinning…' : 'Spin the wheel'}</button></div>`;
  }
  function spin() {
    if (doneToday('wheel') || G.spinning) return;
    const n = WHEEL.length, seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
    G = { type: 'wheel', spinning: true, rot: 360 * 6 + (360 - (idx + 0.5) * seg) };
    markDone('wheel'); save();
    refreshSheet();
    setTimeout(() => {
      G.spinning = false;
      S.wheelWin = earn(WHEEL[idx], 'Glow Wheel', 'game');
      save(); rerender(); refreshSheet();
    }, 4200);
  }

  /* ---------- Sheet & toast ---------- */
  let sheetRender = null;
  function openSheet(html, mode = '') {
    sheetRender = typeof html === 'function' ? html : null;
    sheet.className = `sheet open ${mode}`;
    sheet.setAttribute('aria-hidden', 'false');
    sheet.innerHTML = `<div class="sheet-scrim" data-a="close"></div><div class="sheet-card">${sheetRender ? sheetRender() : html}</div>`;
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
    rerender();
  }
  // Toasts play one at a time so a burst of rewards (miles + bonus + badge) stays readable.
  const toastQueue = [];
  let toastBusy = false;
  function toast(title, sub = '', kind = 'miles') {
    toastQueue.push([title, sub, kind]);
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    const item = toastQueue.shift();
    if (!item) { toastBusy = false; return; }
    toastBusy = true;
    const [title, sub, kind] = item;
    const el = document.createElement('div');
    el.className = `toast t-${kind}`;
    el.innerHTML = `<span class="t-ic">${ic(kind === 'bag' ? 'bag' : kind === 'badge' ? 'trophy' : kind === 'tier' ? 'sparkle' : 'star', 16, 2)}</span><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    toastWrap.appendChild(el);
    const hold = toastQueue.length ? 1500 : 2300;
    setTimeout(() => el.classList.add('out'), hold);
    setTimeout(() => { el.remove(); nextToast(); }, hold + 350);
  }

  /* ---------- Actions ---------- */
  const A = {
    tab(arg) { if (sheet.classList.contains('open')) closeSheet(); ui.tab = arg; render(); app.scrollTop = 0; },
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
    fav(arg) { S.favs = S.favs.includes(arg) ? S.favs.filter((f) => f !== arg) : [...S.favs, arg]; save(); refreshSheet(); },
    share() { const d = { title: 'Seasonly Paris', text: 'TensioLift by Seasonly', url: location.href }; const fallback = () => toast('Sharing unavailable here', 'Copy the page link from your browser', 'bag'); if (navigator.share) navigator.share(d).catch(fallback); else fallback(); },
    qty(arg) {
      const [id, d] = arg.split(':'); const l = S.bag.find((x) => x.id === id); if (!l) return;
      l.qty += +d; if (l.qty <= 0) S.bag = S.bag.filter((x) => x.id !== id);
      save(); refreshSheet(); rerender();
    },
    'bag-voucher'(arg) { bagVoucher = bagVoucher === arg ? null : arg; refreshSheet(); },
    checkout,
    tip(arg) {
      const t = TIPS.find((x) => x.id === arg);
      const done = doneToday('tip-' + t.id);
      openSheet(`<div class="sheet-pad"><div class="row between"><p class="eyebrow accent">Daily wellness tip</p>
        <button class="icon-btn" data-a="close" aria-label="Close">${ic('close', 18)}</button></div>
        <h2 class="serif-h">${t.title}</h2><p class="muted">${t.lead}</p>
        <ol class="tip-list">${t.body.map((b) => `<li>${b}</li>`).join('')}</ol>
        <button class="btn-dark wide mt16" data-a="tip-done" data-arg="${t.id}" ${done ? 'disabled' : ''}>${done ? 'Already earned today' : 'I read it · +10 miles'}</button></div>`);
    },
    'tip-done'(arg) { if (!doneToday('tip-' + arg)) { markDone('tip-' + arg); earn(10, 'Wellness tip read', 'tip'); } closeSheet(); },
    checkin: checkIn,
    rituals() { clearInterval(ritualTimer); openSheet(ritualsList); },
    ritual(arg) { clearInterval(ritualTimer); openSheet(() => ritualView(arg)); },
    'ritual-next': ritualNext,
    'ritual-restart'(arg) { S.ritual[arg] = { day: todayKey(), step: 0 }; save(); A.ritual(arg); },
    timer: startTimer,
    game(arg) { G = {}; openSheet(() => gameView(arg)); },
    flip,
    'match-again'() { newMatch(); refreshSheet(); },
    answer,
    'quiz-next': quizNext,
    'quiz-again'() { newQuiz(); refreshSheet(); },
    spin,
    redeem,
    claim,
    'redeem-ok': redeemOk,
    step(arg) { ui.step = +arg; rerender(); app.scrollTop = 0; },
    'pick-studio'(arg) { ui.bk.studio = arg; A.step(2); },
    locate() { A['pick-studio']('marais'); toast('Nearest maison', 'Seasonly Marais · 1.2 km', 'bag'); },
    'pick-service'(arg) { ui.bk.service = arg; A.step(3); },
    'pick-day'(arg) { ui.bk.day = +arg; ui.bk.slot = null; rerender(); },
    'pick-slot'(arg) { ui.bk.slot = arg; rerender(); },
    'bk-voucher'(arg) { ui.bk.voucher = ui.bk.voucher === arg ? null : arg; rerender(); },
    'confirm-booking'() {
      const st = STUDIOS.find((x) => x.id === ui.bk.studio), sv = SERVICES.find((x) => x.id === ui.bk.service);
      const day = addDays(new Date(), ui.bk.day + 1);
      const v = S.vouchers.find((x) => x.code === ui.bk.voucher && !x.used);
      if (v) v.used = true;
      S.bookings.unshift({ t: Date.now(), studio: st.name, service: sv.name, when: `${day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${ui.bk.slot}`, voucher: v ? v.code : null });
      earn(150, `Studio visit · ${sv.name}`, 'booking');
      openSheet(`<div class="sheet-pad center"><div class="ticket-big">${ic('calendar', 40, 1.3)}</div>
        <p class="eyebrow accent mt16">À bientôt</p><h2 class="serif-h sm">${sv.name}</h2>
        <p class="muted">${st.name}<br>${S.bookings[0].when}</p>${v ? `<p class="accent sm">Voucher ${v.code} applied</p>` : ''}
        <button class="btn-dark wide mt16" data-a="close">Done</button></div>`);
      ui.step = 1; ui.bk = { studio: null, service: null, day: 0, slot: null, voucher: null };
    },
    rename() {
      openSheet(`<div class="sheet-pad"><p class="eyebrow accent">Profile</p><h2 class="serif-h sm">Your first name</h2>
        <form id="renameForm" class="stack"><label class="search glass" for="nameInput">${ic('user', 16)}<input id="nameInput" maxlength="20" value="${esc(S.name)}" autocomplete="given-name"></label>
        <button class="btn-dark wide" type="submit">Save</button></form>
        <button class="btn-ghost wide mt8" data-a="close">Cancel</button></div>`);
      setTimeout(() => { const i = $('#nameInput'); if (i) i.focus(); }, 350);
    },
    reset() {
      openSheet(`<div class="sheet-pad center"><p class="eyebrow accent">Demo data</p><h2 class="serif-h sm">Start over?</h2>
        <p class="muted">This clears your miles, streak, vouchers and history on this device, and reloads the sample account.</p>
        <button class="btn-dark wide mt16" data-a="reset-ok">Reset demo data</button>
        <button class="btn-ghost wide mt8" data-a="close">Keep my progress</button></div>`);
    },
    'reset-ok'() { S = seed(); save(); closeSheet(); A.tab('home'); toast('Demo reset', 'Fresh start with the sample account'); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el.dataset.arg, el); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'search') return;
    ui.q = e.target.value;
    const pos = e.target.selectionStart;
    if (ui.q && ui.cat !== 'All') ui.cat = 'All';
    rerender();
    const s = $('#search'); s.focus(); s.setSelectionRange(pos, pos);
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'renameForm') return;
    e.preventDefault();
    const n = $('#nameInput').value.trim();
    if (n) { S.name = n.slice(0, 20); save(); }
    closeSheet();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet(); });

  render();
})();
