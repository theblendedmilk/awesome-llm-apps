# Seasonly · Skin Miles

The Seasonly Paris app, rebuilt from the Seasonly 26 "liquid glass" screens, with the **Skin Miles** rewards game, accounts confirmed by SMS or email code, a referral programme, and a backend with an admin panel for products, emails and push notifications.

```
public/   the app (HTML/CSS/JS, no build step) + service worker for push
admin/    the admin panel, served at /admin
server/   Node.js backend (Express + built-in SQLite)
test/     API tests and a browser end-to-end test
```

## Run it

Requires **Node.js 22.13 or later** (it uses Node's built-in SQLite).

```bash
cd seasonly_skin_miles_app
npm install
npm run dev          # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

`npm run dev` shows sign-up codes on screen, so no SMS or email account is needed to try it. The development admin login is `admin@seasonly.fr` / `seasonly-admin` (set `ADMIN_PASSWORD` to change it).

Opening `public/index.html` directly, with no server, runs an **offline demo mode**: same screens and rules, but accounts stay on the device and codes are shown on screen.

## Hosted test version

The app is published on Netlify from this folder (`netlify.toml`) at https://seasonly-app.netlify.app, in demo mode: each phone keeps its own accounts and the code is shown on screen.

## Production

1. Copy `.env.example` to `.env` and fill it in: `ADMIN_PASSWORD`, `SMTP_URL` (email), `TWILIO_*` (SMS), `NODE_ENV=production`.
2. Run with Docker (`docker build -t seasonly . && docker run -p 3000:3000 -v seasonly-data:/data --env-file .env seasonly`) or `npm start` on any Node host (Render, Railway, Fly.io, Scaleway, OVH…).
3. Serve it over **HTTPS**. Push notifications and secure cookies require it.
4. Back up `DATA_DIR`: it holds the database and the key that encrypts profile photos.

In production, codes are never shown on screen. If no SMS or email provider is configured for the channel a customer picks, sign-up returns a clear error instead of silently failing.

## What the app does

**Accounts**
- Sign-up with first name, last name, email, mobile number and an optional referral code, then a 6-digit code sent by **SMS, email or both**. Sign-in uses a code too, so there is no password to steal.
- Codes expire after 10 minutes, are stored hashed, and lock after 5 wrong tries. Sending is rate-limited per IP and per phone or email.
- **Log out** (Profile → Log out) revokes the session on the server. **Delete my account** erases the account, photo and history.

**Profile photo, protected against theft**
- The photo is resized and re-encoded **on the phone**, which drops EXIF data (GPS location, device) before upload.
- The server accepts only real JPEG/PNG files (checked by their bytes), max 5 MB, and strips metadata again.
- It is stored **encrypted (AES-256-GCM)** and served only to its owner (`private, no-store`), never on a public URL.
- In the app it's drawn as a background under a transparent layer, with long-press, right-click and drag disabled.
- One limit no web app can remove: someone can still screenshot their own screen.

**Skin Miles** (computed on the server, so balances can't be edited in the browser)

| Action | Miles |
|---|---|
| Welcome gift on confirmation | +300 |
| Daily check-in | +20, bonuses at 7, 14, 30, 60, 100 and 365 days |
| Wellness tip | +10 |
| Guided ritual | +30 to +50 |
| Glow Match / Skin Quiz / Glow Wheel | up to 80 / 50 / 100 per day |
| Weekly and seasonal challenges | +60 to +200 |
| Order | 1 per €1 |
| Face Glow Bar booking | +150 |
| Friend referred and booked | +200 |

Tiers (Bourgeon, Éclat, Rayonnance, Lumière) multiply non-purchase rewards up to ×1.5. Miles buy **seasonal vouchers**: product vouchers apply in the bag and treatment vouchers at booking. Only the current season can be redeemed, and next season is shown as a preview.

**Referral programme**
- Every customer gets a code and a share link (`/#ref-CODE`).
- The friend gets **10% off** their first Face Glow Bar treatment.
- When the friend **confirms their account and books**, the referrer gets **+5% off their next booking, building up to 20%**, plus 200 miles, and is notified by push and email.
- All three percentages can be changed in the admin panel.

**Streak screen.** Uses the app's own look: cream background, Cormorant numeral inside a terracotta progress ring, glass week card, and a black "Continuer" button.

**Home photo.** The home and welcome screens show the Seasonly campaign photo in `public/img/hero.jpg`. A photo uploaded in **Admin → Settings → Home screen photo** replaces it.

## Catalogue

The 16 products are real Seasonly products: TensioLift serum and refill, Sérum Anti-âge, Anti-imperfections, Regard Défatigant, Gelée Nettoyante, the two masks, Duo Inner Glow, Crème Fluide, Crème Riche and Crème Lumière, Huile de Nuit, and three gua shas. Their names, prices, sizes and descriptions come from seasonly.fr and the Seasonly page on sephora.fr as indexed in October 2026.

The Face Glow Bar treatments (Gym, Glow, Winter, 15 min, €25) and the three Paris Face Glow Bars at Sephora (La Canopée, Saint-Lazare, Beaugrenelle) come from the same sources. The Soin Signature (30 min, €50) is not from those pages; check it before launch.

**Product photos are not included.** seasonly.fr could not be reached from the build environment, and its photos belong to Seasonly. Upload them in **Admin → Products → Edit → Upload photo**. Until then, each product shows an illustrated bottle. Check the prices in the admin before launch.

## Admin panel (`/admin`)

| Section | What it does |
|---|---|
| Dashboard | Customers, bookings, orders, revenue, miles, referrals, push subscribers, and which delivery channels are connected |
| Products | Add, edit, hide or delete products, with photo, price, "was" price, size, category, badge and results |
| Customers | Search customers and adjust miles with a reason the customer sees |
| Bookings, Orders, Referrals | Lists of what customers did |
| Email | Send to all customers, to customers who referred a friend, or to one customer. `{first}` inserts the first name |
| Push notifications | Send to everyone who turned on notifications, with a live preview |
| Sent messages | Every email, SMS and push sent or logged |
| Settings | Referral percentages and the home screen photo |

## Tests

```bash
npm test                         # 13 API tests (auth, codes, rewards, referral, photo security, admin)
npm i -D playwright && node test/e2e.js --runs 3   # full browser journey, 3 times in a row
```

The end-to-end run signs up by SMS code, checks in (streak screen), reads a tip, completes a ritual, plays the three games, buys a product, uploads a photo and logs out. A friend then signs up with the referral link and books with −10%. The referrer signs back in by email code and sees −5%. The admin creates a product with a photo, sends an email and a push notification, and the app shows the new product. Finally, the offline demo mode is checked.
