/* Seasonly catalog used to seed the database (server) and as the offline demo catalog (browser).
   Names, descriptions and prices come from seasonly.fr and the Seasonly page on sephora.fr as indexed
   in October 2026. Prices change: edit them from the admin panel. Product photos are uploaded in the
   admin panel; until then each product shows an illustrated bottle (`art`). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SeasonlyCatalog = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const dropper = (glass, liquid, label = '#FBFBF9') => ({ kind: 'dropper', glass, liquid, label, cap: '#F4F4F2', collar: '#DADAD6', ink: '#3A3532' });
  const jar = (glass, cap) => ({ kind: 'jar', glass, label: '#FFFFFF', cap, ink: '#3A3532' });
  const tube = (glass, cap, ink = '#3A3532') => ({ kind: 'tube', glass, label: glass, cap, ink });
  const stone = (glass, cap) => ({ kind: 'guasha', glass, cap });

  const PRODUCTS = [
    { id: 'serum-tensiolift', subFr: "Sérum liftant raffermissant", descFr: "Un concentré liftant ultra-léger qui raffermit et repulpe la peau. Le héros de la gamme TensioLift.", statsFr: [["−40%", "Rides · J28"], ["+62%", "Fermeté · J28"], ["98%", "Origine naturelle"]], name: 'Sérum TensioLift', sub: 'Firming lifting serum', cat: 'Sérums', tags: ['Anti-aging'], price: 79, size: '30 ml', badge: 'Best Seller',
      desc: 'A weightless lifting concentrate that firms and plumps the skin. The hero of the TensioLift edit.',
      stats: [['−40%', 'Wrinkles · D28'], ['+62%', 'Firmness · D28'], ['98%', 'Natural origin']],
      art: dropper('#E7EBEA', '#F1EEE6'), bg: 'linear-gradient(160deg,#F1E3D4,#E9D3BF)' },
    { id: 'recharge-creme-tensiolift', subFr: "Recharge crème raffermissante", descFr: "La recharge de la crème raffermissante et liftante TensioLift. Moins d'emballage, les mêmes résultats.", name: 'Recharge Crème TensioLift', sub: 'Firming cream refill', cat: 'Crèmes', tags: ['Anti-aging'], price: 72, size: '50 ml', badge: 'Refill',
      desc: 'The refill of the TensioLift firming and lifting cream. Less packaging, same results.',
      art: jar('#F2ECE6', '#D9C3B0'), bg: 'linear-gradient(160deg,#F5EBE3,#EBDCCF)' },
    { id: 'serum-anti-age', subFr: "Booster fermeté et éclat", descFr: "Un sérum anti-âge hydratant qui raffermit la peau et booste l'éclat.", name: 'Sérum Anti-âge', sub: 'Firming & radiance booster', cat: 'Sérums', tags: ['Anti-aging'], price: 29.9, size: '15 ml',
      desc: 'A moisturising anti-aging serum that firms the skin and boosts radiance.',
      art: dropper('#E9C9B6', '#E0B097'), bg: 'linear-gradient(160deg,#F6E7DE,#EDD6C8)' },
    { id: 'serum-anti-imperfections', subFr: "Sérum anti-imperfections", descFr: "Un sérum ciblé qui aide à réduire les imperfections et à affiner le grain de peau.", name: 'Sérum Anti-imperfections', sub: 'Blemish serum', cat: 'Sérums', tags: [], price: 30, size: '15 ml',
      desc: 'A targeted serum that helps clear blemishes and refine skin texture.',
      art: dropper('#DCE6DF', '#C6D8CB'), bg: 'linear-gradient(160deg,#EBF0EA,#DCE5DA)' },
    { id: 'serum-regard', subFr: "Sérum contour des yeux défatigant", descFr: "Un sérum contour des yeux qui lisse et réveille le regard fatigué.", name: 'Sérum Regard Défatigant', sub: 'Anti-fatigue eye serum', cat: 'Sérums', tags: ['Anti-aging'], price: 35, size: '15 ml',
      desc: 'An eye-contour serum that smooths and wakes up tired eyes.',
      art: dropper('#E3E1EE', '#CFCBE4'), bg: 'linear-gradient(160deg,#ECEAF3,#DEDBEB)' },
    { id: 'gelee-nettoyante-visage', subFr: "Gelée nettoyante", descFr: "Un nettoyant fondant et doux à l'extrait de fleur de calendula, qui apaise et purifie la peau.", name: 'Gelée Nettoyante', sub: 'Cleansing jelly', cat: 'Nettoyants', tags: [], price: 26, size: '100 ml', badge: 'Best Seller',
      desc: 'A gentle melting cleanser with calendula flower extract to soothe and purify the skin.',
      art: jar('#F4E3C8', '#E2C48F'), bg: 'linear-gradient(160deg,#F7EEDF,#EEDFC7)' },
    { id: 'masque-peeling-anti-grisaille', subFr: "Masque peeling anti-grisaille", descFr: "Pensé pour les teints ternes et le grain irrégulier. Associe une exfoliation mécanique douce et une exfoliation enzymatique.", name: 'Masque Peeling Anti-grisaille', sub: 'Anti-grey peeling mask', cat: 'Masques', tags: [], price: 37, size: '',
      desc: 'Designed for dull complexions and uneven texture. Combines gentle mechanical and enzymatic exfoliation.',
      art: tube('#EAD6CB', '#C99E86'), bg: 'linear-gradient(160deg,#F5E7DE,#EBD3C5)' },
    { id: 'masque-peau-neuve', subFr: "Masque aux enzymes de fruits", descFr: "Un masque exfoliant aux enzymes de fruits qui passe de gel à huile délicatement chauffante. Idéal pour l'automassage au gua sha. À laisser poser 20 minutes.", name: 'Masque Peau Neuve', sub: 'Fruit enzyme mask', cat: 'Masques', tags: [], price: 46, size: '50 ml', badge: 'New',
      desc: 'An exfoliating mask with fruit enzymes that turns from gel into a gently warming oil. Perfect for self-massage with a gua sha. Leave on for 20 minutes.',
      art: tube('#F0E1D4', '#D6B08F'), bg: 'linear-gradient(160deg,#F7ECE2,#EDDCCB)' },
    { id: 'duo-nouveautes-inner-glow', subFr: "Gelée nettoyante + masque peeling", descFr: "La Gelée Nettoyante et le Masque Peeling Anti-grisaille réunis, pour un teint frais et lumineux.", name: 'Duo Inner Glow', sub: 'Cleansing jelly + peeling mask', cat: 'Coffrets', tags: [], price: 50, compareAt: 63, size: '2 products', badge: 'Duo',
      desc: 'The Gelée Nettoyante and the Masque Peeling Anti-grisaille together, for a fresh and luminous complexion.',
      art: jar('#F4E3C8', '#E2C48F'), bg: 'linear-gradient(160deg,#F6E4DE,#EDD2C8)' },
    { id: 'creme-fluide', subFr: "Crème légère, peaux normales à mixtes", descFr: "Une crème visage hydratante et légère pour les peaux normales à mixtes.", name: 'Crème Fluide', sub: 'Light cream, normal to combination skin', cat: 'Crèmes', tags: [], price: 39.9, size: '30 ml',
      desc: 'A light moisturising face cream for normal to combination skin.',
      art: tube('#EEF0EE', '#C9CFCB'), bg: 'linear-gradient(160deg,#EFF1EF,#E0E4E1)' },
    { id: 'creme-riche', subFr: "Crème riche, peaux sèches", descFr: "Une crème visage riche et hydratante qui réconforte les peaux sèches.", name: 'Crème Riche', sub: 'Rich cream, dry skin', cat: 'Crèmes', tags: [], price: 39.9, size: '30 ml',
      desc: 'A rich moisturising face cream that comforts dry skin.',
      art: tube('#F3E9DD', '#D8C3A8'), bg: 'linear-gradient(160deg,#F6EEE4,#EBDDCB)' },
    { id: 'creme-lumiere', subFr: "Crème éclat aux perles", descFr: "Une crème visage éclat enrichie en nacre pour un teint lumineux instantanément.", name: 'Crème Lumière', sub: 'Radiance cream with pearls', cat: 'Crèmes', tags: [], price: 42, size: '40 ml',
      desc: 'A radiance face cream enriched with mother-of-pearl for an instantly luminous complexion.',
      art: jar('#F6EDE6', '#E8CDBE'), bg: 'linear-gradient(160deg,#F8EFE9,#EFDDD2)' },
    { id: 'huile-de-nuit', subFr: "Huile de nuit réparatrice", descFr: "Une huile visage nourrissante et réparatrice qui agit pendant votre sommeil.", name: 'Huile de Nuit', sub: 'Repairing night oil', cat: 'Huiles', tags: ['Anti-aging'], price: 42, size: '15 ml',
      desc: 'A nourishing, repairing face oil that works while you sleep.',
      art: dropper('#E7B97F', '#D99A4E'), bg: 'linear-gradient(160deg,#F5E7D4,#EBD5B8)' },
    { id: 'gua-sha-quartz', subFr: "Outil de massage raffermissant", descFr: "Un gua sha en quartz rose pour un massage du visage raffermissant.", name: 'Gua Sha Quartz', sub: 'Firming massage tool', cat: 'Accessoires', tags: [], price: 29, size: '1 piece',
      desc: 'A rose quartz gua sha for a firming facial massage.',
      art: stone('#EBC3BC', '#E3B1A8'), bg: 'linear-gradient(160deg,#F6E4DE,#EDD2C8)' },
    { id: 'gua-sha-ceramic', subFr: "Outil de massage du visage", descFr: "Un gua sha en céramique qui reste frais sur la peau pour un massage dégonflant.", name: 'Gua Sha Ceramic', sub: 'Facial massage tool', cat: 'Accessoires', tags: [], price: 35, size: '1 piece',
      desc: 'A ceramic gua sha that stays cool on the skin for a depuffing facial massage.',
      art: stone('#E9E4DC', '#D4CCBF'), bg: 'linear-gradient(160deg,#F2EEE8,#E4DDD2)' },
    { id: 'opal-gua-sha', subFr: "Outil de massage du visage", descFr: "Un gua sha en opale pour un massage du visage doux au quotidien.", name: 'Opal Gua Sha', sub: 'Facial massage tool', cat: 'Accessoires', tags: [], price: 26, size: '1 piece',
      desc: 'An opal gua sha for a gentle daily facial massage.',
      art: stone('#DCE7EC', '#C3D3DB'), bg: 'linear-gradient(160deg,#EEF2F4,#DDE6EA)' },
  ];
  PRODUCTS.forEach((p, i) => { p.active = true; p.image = null; p.sort = i; p.compareAt = p.compareAt || null; p.stats = p.stats || []; p.statsFr = p.statsFr || p.stats; p.badge = p.badge || ''; });
  const CATS = ['All', 'Anti-aging', 'Sérums', 'Crèmes', 'Masques', 'Nettoyants', 'Huiles', 'Coffrets', 'Accessoires'];
  // Collaborations seeded on first start. Sample copy: edit it in Admin → Collabs before launch.
  const firstThursday = (now) => { const d = new Date(now.getFullYear(), now.getMonth() + 1, 1, 19, 0); while (d.getDay() !== 4) d.setDate(d.getDate() + 1); return d; };
  const COLLABS = [
    { partner: 'Blissim', kind: 'brand', data: () => ({
      fr: { title: 'Seasonly x Blissim', subtitle: 'La Gelée Nettoyante rejoint la box beauté Blissim', body: "Seasonly s'invite dans la box Blissim. Découvrez notre Gelée Nettoyante à l'extrait de calendula, puis prolongez l'expérience avec un soin de 15 minutes dans l'un de nos Face Glow Bars.", cta: 'Découvrir Blissim', offer: '' },
      en: { title: 'Seasonly x Blissim', subtitle: 'Our Gelée Nettoyante joins the Blissim beauty box', body: 'Seasonly is in the Blissim box. Discover our cleansing jelly with calendula extract, then take it further with a 15-minute treatment at one of our Face Glow Bars.', cta: 'Discover Blissim', offer: '' },
      code: '', link: 'https://www.blissim.fr', place: '', color: '#E64A6E', rsvp: false, capacity: 0, eventAt: null, endsAt: null }) },
    { partner: 'Glow Night', kind: 'event', data: (now) => {
      const at = firstThursday(now);
      const day = (l) => at.toLocaleDateString(l, { weekday: 'long', day: 'numeric', month: 'long' });
      return {
        fr: { title: 'Glow Night à La Canopée', subtitle: 'Une soirée Kobido, gua sha et dégustation de tisanes', body: "Rejoignez l'équipe Seasonly pour une soirée de démonstrations au Face Glow Bar La Canopée : massage Kobido, routine gua sha et conseils personnalisés. Places limitées.", cta: "Je m'inscris", when: `${day('fr-FR')} · 19h`, offer: '' },
        en: { title: 'Glow Night at La Canopée', subtitle: 'An evening of Kobido, gua sha and herbal tea', body: 'Join the Seasonly team for an evening of demos at the La Canopée Face Glow Bar: Kobido massage, gua sha routine and one-to-one advice. Limited places.', cta: 'Register', when: `${day('en-GB')} · 7pm`, offer: '' },
        code: '', link: '', place: 'Face Glow Bar La Canopée · 4 passage de la Canopée, 75001 Paris', color: '#0E0E10', rsvp: true, capacity: 30, eventAt: at.getTime(), endsAt: at.getTime() + 3 * 3600e3 };
    } },
  ];
  return { PRODUCTS, CATS, COLLABS };
});
