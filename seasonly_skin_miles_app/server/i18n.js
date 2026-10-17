'use strict';
/* Emails, text messages and push notifications in the customer's language (French or English).
   Each entry takes the values it needs and returns { subject, text } for emails, { title, body } for
   push, or a string for SMS. The language is the one the customer last used in the app. */

const LANGS = ['fr', 'en'];
const langOf = (v) => (LANGS.includes(v) ? v : 'fr');
const locale = (lang) => (lang === 'en' ? 'en-GB' : 'fr-FR');
const eurTxt = (n, lang) => {
  const v = Number(n).toFixed(2).replace('.00', '');
  return lang === 'en' ? `€${v}` : `${v.replace('.', ',')} €`;
};
const when = (b, lang) => {
  const d = new Date(b.startAt).toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long' });
  return lang === 'en' ? `${d} at ${b.slot}` : `${d} à ${b.slot.replace(':', 'h')}`;
};
const peopleTxt = (b, lang) => (b.people > 1 ? (lang === 'en' ? ` · ${b.people} people` : ` · ${b.people} personnes`) : '');
const guestsTxt = (b, lang) => (b.party && b.party.length > 1
  ? '\n' + b.party.map((p, i) => (i === 0 ? (lang === 'en' ? `You: ${p.service}` : `Vous : ${p.service}`) : `${p.name || (lang === 'en' ? `Guest ${i}` : `Invité·e ${i}`)}${lang === 'en' ? ':' : ' :'} ${p.service}`)).join('\n')
  : '');

const T = {
  codeText: {
    fr: (code) => `${code} est votre code Seasonly. Il expire dans 10 minutes. Ne le partagez jamais : Seasonly ne vous le demandera jamais.`,
    en: (code) => `${code} is your Seasonly code. It expires in 10 minutes. Never share it — Seasonly will never ask you for it.`,
  },
  codeEmail: {
    fr: (first, code) => ({ subject: `${code} est votre code Seasonly`, text: `Bonjour ${first},\n\n${T.codeText.fr(code)}\n\nSi vous n'avez pas demandé ce code, ignorez cet email.` }),
    en: (first, code) => ({ subject: `${code} is your Seasonly code`, text: `Hello ${first},\n\n${T.codeText.en(code)}\n\nIf you didn't ask for this code, you can ignore this email.` }),
  },
  welcome: {
    fr: (first, code, r) => ({ subject: 'Bienvenue chez Seasonly', text: `Bonjour ${first},\n\nVotre compte est confirmé et 300 Skin Miles vous attendent.\n\nVotre code de parrainage est ${code}. Partagez-le : vos ami·es ont −${r.welcome} % sur leur premier soin au Face Glow Bar, et vous gagnez −${r.perFriend} % sur votre prochaine réservation pour chaque ami·e qui vient (jusqu'à −${r.cap} %).` }),
    en: (first, code, r) => ({ subject: 'Welcome to Seasonly', text: `Hello ${first},\n\nYour account is confirmed and 300 Skin Miles are waiting for you.\n\nYour referral code is ${code}. Share it: your friends get ${r.welcome}% off their first Face Glow Bar treatment, and you earn ${r.perFriend}% off your next booking for each friend who books (up to ${r.cap}%).` }),
  },
  referralPush: {
    fr: (friend, d) => ({ title: 'Votre ami·e est venu·e chez Seasonly 🎉', body: `${friend} a profité d'un soin au Face Glow Bar. Vous avez maintenant −${d} % sur votre prochaine réservation.` }),
    en: (friend, d) => ({ title: 'Your friend came to Seasonly 🎉', body: `${friend} enjoyed a Face Glow Bar treatment. You now have ${d}% off your next booking.` }),
  },
  referralEmail: {
    fr: (first, friend, d) => ({ subject: `${friend} est venu·e pour un soin : votre récompense est prête`, text: `Bonjour ${first},\n\n${friend} a confirmé son compte Seasonly et payé un soin avec votre code.\n\nVous avez maintenant −${d} % sur votre prochaine réservation au Face Glow Bar, et 200 Skin Miles en plus.` }),
    en: (first, friend, d) => ({ subject: `${friend} came for a treatment — your reward is ready`, text: `Hello ${first},\n\n${friend} confirmed their Seasonly account and paid for a treatment with your code.\n\nYou now have ${d}% off your next Face Glow Bar booking, plus 200 Skin Miles.` }),
  },
  booked: {
    fr: (first, b, maps) => ({ subject: `Votre ${b.service} est réservé`, text: `Bonjour ${first},\n\nVotre soin est réservé.\n\n${b.service} · ${b.mins} min${peopleTxt(b, 'fr')}${guestsTxt(b, 'fr')}\n${when(b, 'fr')}\n${b.studio}\n${b.addr}\n\nPrix : ${eurTxt(b.price, 'fr')}, à régler au Face Glow Bar. Vous gagnerez ${b.miles} Skin Miles une fois le paiement fait.\nRéférence : ${b.id}\n\nItinéraire : ${maps}\n\nNous vous enverrons un rappel une heure avant. Un changement ? Annulez depuis votre profil dans l'app.` }),
    en: (first, b, maps) => ({ subject: `Your ${b.service} is booked`, text: `Hello ${first},\n\nYour treatment is booked.\n\n${b.service} · ${b.mins} min${peopleTxt(b, 'en')}${guestsTxt(b, 'en')}\n${when(b, 'en')}\n${b.studio}\n${b.addr}\n\nPrice: ${eurTxt(b.price, 'en')}, paid at the Face Glow Bar. You'll earn ${b.miles} Skin Miles once it's paid.\nReference: ${b.id}\n\nDirections: ${maps}\n\nWe'll send you a reminder one hour before. Need to change something? Cancel from your profile in the app.` }),
  },
  ordered: {
    fr: (first, o) => ({ subject: `Nous avons reçu votre commande ${o.id}`, text: `Bonjour ${first},\n\nMerci pour votre commande.\n\n${o.lines.map((l) => `${l.qty} × ${l.name} — ${eurTxt(l.price * l.qty, 'fr')}`).join('\n')}\nTotal : ${eurTxt(o.total, 'fr')}\n\nVous gagnerez ${o.miles} Skin Miles dès que votre paiement sera confirmé.` }),
    en: (first, o) => ({ subject: `We received your order ${o.id}`, text: `Hello ${first},\n\nThank you for your order.\n\n${o.lines.map((l) => `${l.qty} × ${l.name} — ${eurTxt(l.price * l.qty, 'en')}`).join('\n')}\nTotal: ${eurTxt(o.total, 'en')}\n\nYou'll earn ${o.miles} Skin Miles as soon as your payment is confirmed.` }),
  },
  what: {
    fr: (it) => (it.service ? `votre ${it.service} du ${when(it, 'fr')}` : `votre commande ${it.id}`),
    en: (it) => (it.service ? `your ${it.service} on ${when(it, 'en')}` : `your order ${it.id}`),
  },
  refundRequested: {
    fr: (first, it) => ({ subject: 'Nous avons reçu votre demande de remboursement', text: `Bonjour ${first},\n\nNous avons reçu votre demande de remboursement pour ${T.what.fr(it)}. Notre équipe s'en occupe rapidement. Les Skin Miles gagnés avec ce paiement seront déduits une fois le remboursement fait.` }),
    en: (first, it) => ({ subject: 'We received your refund request', text: `Hello ${first},\n\nWe received your request to refund ${T.what.en(it)}. Our team will process it shortly. The Skin Miles earned with it will be deducted once the refund is made.` }),
  },
  cancelled: {
    fr: (first, it) => ({ subject: 'Votre annulation est confirmée', text: `Bonjour ${first},\n\nNous avons annulé ${T.what.fr(it)}. Le bon ou la réduction de parrainage utilisés sont de nouveau disponibles.` }),
    en: (first, it) => ({ subject: 'Your cancellation is confirmed', text: `Hello ${first},\n\nWe cancelled ${T.what.en(it)}. Any voucher or referral discount you used is available again.` }),
  },
  paidPush: {
    fr: (it, kind) => ({ title: `+${it.credited} Skin Miles`, body: `Merci ! Votre ${kind === 'order' ? 'commande' : 'soin'} est payé${kind === 'order' ? 'e' : ''} et vos miles sont crédités.` }),
    en: (it, kind) => ({ title: `+${it.credited} Skin Miles`, body: `Thank you! Your ${kind === 'order' ? 'order' : 'treatment'} is paid and your miles are credited.` }),
  },
  paidEmail: {
    fr: (first, it, amount) => ({ subject: `Paiement reçu : +${it.credited} Skin Miles`, text: `Bonjour ${first},\n\nNous avons bien reçu votre paiement pour ${T.what.fr(it)} (${eurTxt(amount, 'fr')}).\n\n${it.credited} Skin Miles sont maintenant sur votre compte.` }),
    en: (first, it, amount) => ({ subject: `Payment received — +${it.credited} Skin Miles`, text: `Hello ${first},\n\nWe received your payment for ${T.what.en(it)} (${eurTxt(amount, 'en')}).\n\n${it.credited} Skin Miles are now in your account.` }),
  },
  refundPush: {
    fr: (it) => ({ title: 'Remboursement effectué', body: `Le remboursement de ${T.what.fr(it)} est fait. ${it.credited} Skin Miles ont été déduits.` }),
    en: (it) => ({ title: 'Refund made', body: `Your refund for ${T.what.en(it)} is done. ${it.credited} Skin Miles were deducted.` }),
  },
  refundEmail: {
    fr: (first, it, amount) => ({ subject: 'Votre remboursement est effectué', text: `Bonjour ${first},\n\nNous avons remboursé ${T.what.fr(it)} (${eurTxt(amount, 'fr')}). Les ${it.credited} Skin Miles gagnés avec ce paiement ont été déduits de votre solde.` }),
    en: (first, it, amount) => ({ subject: 'Your refund is done', text: `Hello ${first},\n\nWe refunded ${T.what.en(it)} (${eurTxt(amount, 'en')}). The ${it.credited} Skin Miles earned with this payment were deducted from your balance.` }),
  },
  giftSource: {
    fr: (g) => (g.contest ? `Vous avez gagné « ${g.contest} »` : g.text || "Un cadeau de l'équipe Seasonly"),
    en: (g) => (g.contest ? `You won "${g.contest}"` : g.text || 'A gift from the Seasonly team'),
  },
  giftPush: {
    fr: (label) => ({ title: 'Un cadeau de Seasonly 🎁', body: `${label} vous attend dans votre profil.` }),
    en: (label) => ({ title: 'A gift from Seasonly 🎁', body: `${label} is waiting for you in your profile.` }),
  },
  giftEmail: {
    fr: (first, source, g) => ({ subject: `Un cadeau pour vous : ${g.label}`, text: `Bonjour ${first},\n\n${source} : ${g.label} est à vous.\n\n${g.kind === 'soin' ? `Réservez-le dans l'app : votre bon de soin offert ${g.code} s'applique à l'étape de confirmation. Il est valable 6 mois.` : "Nous l'enverrons à l'adresse enregistrée dans votre profil. Vérifiez qu'elle est à jour."}` }),
    en: (first, source, g) => ({ subject: `A gift for you: ${g.label}`, text: `Hello ${first},\n\n${source}: ${g.label} is yours.\n\n${g.kind === 'soin' ? `Book it in the app: your free-treatment voucher ${g.code} is applied at the confirm step. It's valid for 6 months.` : 'We will ship it to the address saved in your profile. Check it is up to date.'}` }),
  },
  shippedPush: {
    fr: (label) => ({ title: 'Votre cadeau est en route', body: `${label} a été expédié.` }),
    en: (label) => ({ title: 'Your gift is on its way', body: `${label} has been shipped.` }),
  },
  shippedEmail: {
    fr: (first, label, a) => ({ subject: 'Votre cadeau est en route', text: `Bonjour ${first},\n\n${label} a été expédié à :\n${a.line1}, ${a.postcode} ${a.city}` }),
    en: (first, label, a) => ({ subject: 'Your gift is on its way', text: `Hello ${first},\n\n${label} has been shipped to:\n${a.line1}, ${a.postcode} ${a.city}` }),
  },
  supportReceived: {
    fr: (first, id, body) => ({ subject: `Nous avons reçu votre message (n° ${id})`, text: `Bonjour ${first},\n\nMerci d'avoir contacté Seasonly. Nous répondons en général sous un jour ouvré. Vous trouverez notre réponse dans l'app et dans votre boîte mail.\n\nVotre message :\n${body}` }),
    en: (first, id, body) => ({ subject: `We received your message (#${id})`, text: `Hello ${first},\n\nThank you for contacting Seasonly. We usually answer within one working day. You'll find our reply in the app and in your inbox.\n\nYour message:\n${body}` }),
  },
  supportReply: {
    fr: (first, id, body) => ({ subject: `Support Seasonly : votre message n° ${id}`, text: `Bonjour ${first},\n\n${body}\n\n— L'équipe Seasonly` }),
    en: (first, id, body) => ({ subject: `Seasonly support — your message #${id}`, text: `Hello ${first},\n\n${body}\n\n— The Seasonly team` }),
  },
  supportReplyPush: {
    fr: (body) => ({ title: 'Le support Seasonly vous a répondu', body: body.slice(0, 120) }),
    en: (body) => ({ title: 'Seasonly support replied', body: body.slice(0, 120) }),
  },
  contestPush: {
    fr: (period, title) => ({ title: `Nouveau ${{ week: 'concours de la semaine', month: 'concours du mois', year: "concours de l'année" }[period]} 🎁`, body: `${title}. Participez dans l'onglet Récompenses.` }),
    en: (period, title) => ({ title: `New contest of the ${period} 🎁`, body: `${title}. Enter in the Rewards tab.` }),
  },
  reminder: {
    fr: (b) => ({ title: `Votre ${b.service} commence à ${b.slot.replace(':', 'h')}`, body: `${b.studio}. Touchez pour voir les détails et l'itinéraire le plus rapide.` }),
    en: (b) => ({ title: `Your ${b.service} starts at ${b.slot}`, body: `${b.studio}. Tap for the details and the fastest route.` }),
  },
  collabJoined: {
    fr: (first, c) => ({ subject: `Inscription confirmée : ${c.title}`, text: `Bonjour ${first},\n\nVous êtes inscrit·e à ${c.title}.${c.when ? `\n\nQuand : ${c.when}` : ''}${c.place ? `\nOù : ${c.place}` : ''}\n\nÀ très vite !` }),
    en: (first, c) => ({ subject: `You're registered: ${c.title}`, text: `Hello ${first},\n\nYou're registered for ${c.title}.${c.when ? `\n\nWhen: ${c.when}` : ''}${c.place ? `\nWhere: ${c.place}` : ''}\n\nSee you soon!` }),
  },
};

// tr('booked', 'en', first, booking, link) → the English version of that message.
const tr = (key, lang, ...args) => T[key][langOf(lang)](...args);

module.exports = { tr, langOf, LANGS, eurTxt, when, locale };
