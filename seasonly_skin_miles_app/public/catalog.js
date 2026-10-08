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
    { id: 'serum-tensiolift', name: 'Sérum TensioLift', sub: 'Firming lifting serum', cat: 'Sérums', tags: ['Anti-aging'], price: 79, size: '30 ml', badge: 'Best Seller',
      desc: 'A weightless lifting concentrate that firms and plumps the skin. The hero of the TensioLift edit.',
      stats: [['−40%', 'Wrinkles · D28'], ['+62%', 'Firmness · D28'], ['98%', 'Natural origin']],
      art: dropper('#E7EBEA', '#F1EEE6'), bg: 'linear-gradient(160deg,#F1E3D4,#E9D3BF)' },
    { id: 'recharge-creme-tensiolift', name: 'Recharge Crème TensioLift', sub: 'Firming cream refill', cat: 'Crèmes', tags: ['Anti-aging'], price: 72, size: '50 ml', badge: 'Refill',
      desc: 'The refill of the TensioLift firming and lifting cream. Less packaging, same results.',
      art: jar('#F2ECE6', '#D9C3B0'), bg: 'linear-gradient(160deg,#F5EBE3,#EBDCCF)' },
    { id: 'serum-anti-age', name: 'Sérum Anti-âge', sub: 'Firming & radiance booster', cat: 'Sérums', tags: ['Anti-aging'], price: 29.9, size: '15 ml',
      desc: 'A moisturising anti-aging serum that firms the skin and boosts radiance.',
      art: dropper('#E9C9B6', '#E0B097'), bg: 'linear-gradient(160deg,#F6E7DE,#EDD6C8)' },
    { id: 'serum-anti-imperfections', name: 'Sérum Anti-imperfections', sub: 'Blemish serum', cat: 'Sérums', tags: [], price: 30, size: '15 ml',
      desc: 'A targeted serum that helps clear blemishes and refine skin texture.',
      art: dropper('#DCE6DF', '#C6D8CB'), bg: 'linear-gradient(160deg,#EBF0EA,#DCE5DA)' },
    { id: 'serum-regard', name: 'Sérum Regard Défatigant', sub: 'Anti-fatigue eye serum', cat: 'Sérums', tags: ['Anti-aging'], price: 35, size: '15 ml',
      desc: 'An eye-contour serum that smooths and wakes up tired eyes.',
      art: dropper('#E3E1EE', '#CFCBE4'), bg: 'linear-gradient(160deg,#ECEAF3,#DEDBEB)' },
    { id: 'gelee-nettoyante-visage', name: 'Gelée Nettoyante', sub: 'Cleansing jelly', cat: 'Nettoyants', tags: [], price: 26, size: '100 ml', badge: 'Best Seller',
      desc: 'A gentle melting cleanser with calendula flower extract to soothe and purify the skin.',
      art: jar('#F4E3C8', '#E2C48F'), bg: 'linear-gradient(160deg,#F7EEDF,#EEDFC7)' },
    { id: 'masque-peeling-anti-grisaille', name: 'Masque Peeling Anti-grisaille', sub: 'Anti-grey peeling mask', cat: 'Masques', tags: [], price: 37, size: '',
      desc: 'Designed for dull complexions and uneven texture. Combines gentle mechanical and enzymatic exfoliation.',
      art: tube('#EAD6CB', '#C99E86'), bg: 'linear-gradient(160deg,#F5E7DE,#EBD3C5)' },
    { id: 'masque-peau-neuve', name: 'Masque Peau Neuve', sub: 'Fruit enzyme mask', cat: 'Masques', tags: [], price: 46, size: '50 ml', badge: 'New',
      desc: 'An exfoliating mask with fruit enzymes that turns from gel into a gently warming oil. Perfect for self-massage with a gua sha. Leave on for 20 minutes.',
      art: tube('#F0E1D4', '#D6B08F'), bg: 'linear-gradient(160deg,#F7ECE2,#EDDCCB)' },
    { id: 'duo-nouveautes-inner-glow', name: 'Duo Inner Glow', sub: 'Cleansing jelly + peeling mask', cat: 'Coffrets', tags: [], price: 50, compareAt: 63, size: '2 products', badge: 'Duo',
      desc: 'The Gelée Nettoyante and the Masque Peeling Anti-grisaille together, for a fresh and luminous complexion.',
      art: jar('#F4E3C8', '#E2C48F'), bg: 'linear-gradient(160deg,#F6E4DE,#EDD2C8)' },
    { id: 'creme-fluide', name: 'Crème Fluide', sub: 'Light cream, normal to combination skin', cat: 'Crèmes', tags: [], price: 39.9, size: '30 ml',
      desc: 'A light moisturising face cream for normal to combination skin.',
      art: tube('#EEF0EE', '#C9CFCB'), bg: 'linear-gradient(160deg,#EFF1EF,#E0E4E1)' },
    { id: 'creme-riche', name: 'Crème Riche', sub: 'Rich cream, dry skin', cat: 'Crèmes', tags: [], price: 39.9, size: '30 ml',
      desc: 'A rich moisturising face cream that comforts dry skin.',
      art: tube('#F3E9DD', '#D8C3A8'), bg: 'linear-gradient(160deg,#F6EEE4,#EBDDCB)' },
    { id: 'creme-lumiere', name: 'Crème Lumière', sub: 'Radiance cream with pearls', cat: 'Crèmes', tags: [], price: 42, size: '40 ml',
      desc: 'A radiance face cream enriched with mother-of-pearl for an instantly luminous complexion.',
      art: jar('#F6EDE6', '#E8CDBE'), bg: 'linear-gradient(160deg,#F8EFE9,#EFDDD2)' },
    { id: 'huile-de-nuit', name: 'Huile de Nuit', sub: 'Repairing night oil', cat: 'Huiles', tags: ['Anti-aging'], price: 42, size: '15 ml',
      desc: 'A nourishing, repairing face oil that works while you sleep.',
      art: dropper('#E7B97F', '#D99A4E'), bg: 'linear-gradient(160deg,#F5E7D4,#EBD5B8)' },
    { id: 'gua-sha-quartz', name: 'Gua Sha Quartz', sub: 'Firming massage tool', cat: 'Accessoires', tags: [], price: 29, size: '1 piece',
      desc: 'A rose quartz gua sha for a firming facial massage.',
      art: stone('#EBC3BC', '#E3B1A8'), bg: 'linear-gradient(160deg,#F6E4DE,#EDD2C8)' },
    { id: 'gua-sha-ceramic', name: 'Gua Sha Ceramic', sub: 'Facial massage tool', cat: 'Accessoires', tags: [], price: 35, size: '1 piece',
      desc: 'A ceramic gua sha that stays cool on the skin for a depuffing facial massage.',
      art: stone('#E9E4DC', '#D4CCBF'), bg: 'linear-gradient(160deg,#F2EEE8,#E4DDD2)' },
    { id: 'opal-gua-sha', name: 'Opal Gua Sha', sub: 'Facial massage tool', cat: 'Accessoires', tags: [], price: 26, size: '1 piece',
      desc: 'An opal gua sha for a gentle daily facial massage.',
      art: stone('#DCE7EC', '#C3D3DB'), bg: 'linear-gradient(160deg,#EEF2F4,#DDE6EA)' },
  ];
  PRODUCTS.forEach((p, i) => { p.active = true; p.image = null; p.sort = i; p.compareAt = p.compareAt || null; p.stats = p.stats || []; p.badge = p.badge || ''; });
  const CATS = ['All', 'Anti-aging', 'Sérums', 'Crèmes', 'Masques', 'Nettoyants', 'Huiles', 'Coffrets', 'Accessoires'];
  return { PRODUCTS, CATS };
});
