# Seasonly · Skin Miles

A mobile web app recreating the **Seasonly Paris** app (Seasonly 26 "liquid glass" screens), with an added rewards game: **Skin Miles**. Users earn miles every day and trade them for **seasonal vouchers** on Seasonly products and studio treatments.

No build step and no dependencies: plain HTML, CSS and JavaScript. Progress is saved in `localStorage`.

## Run it

```bash
cd seasonly_skin_miles_app
python3 -m http.server 8000   # or just open index.html
```

Open http://localhost:8000. On a desktop browser the app appears in a phone frame on the dark espresso backdrop used in the Seasonly 26 board. On a phone it fills the screen.

## Design system

| Token | Value | Used for |
|---|---|---|
| Display font | **Cormorant Garamond** (400 / italic) | Headlines such as *"Your skin in balance, this season."*, product names, `seasonly` logo |
| UI font | **Inter** (400–700) | Body text, labels, stats, buttons |
| Celebration font | **Fredoka** | The puffy 3D streak counter |
| Background | `#FBFAF9` (warm white, sampled from the live app) | App background |
| Ink | `#0E0E10` | Text, pill buttons ("Start", "Add — bag"), active chips |
| Terracotta accent | `#C4806C` | Eyebrows (BOUTIQUE, STEP 1 OF 4), links, progress rings |
| Accent soft | `#F5E8E6` | Stat icon circles, miles chips |
| Espresso | `#2A201B` | Desktop stage, Skin Miles wallet card |
| Glass | `rgba(255,255,255,.68)` + `backdrop-filter: blur(22px) saturate(170%)` | Stats card, tab bar, miles card, buy bar |

All tokens are CSS variables at the top of `styles.css`.

## Screens

- **Home**: hero with the season and week chip, glass stats card (miles, day streak, radiance), daily check-in, daily wellness tip, today's ritual with a progress ring, *Curated for autumn* rituals, *From the laboratoire*.
- **Shop (La maison)**: search, category chips, Seasonly Miles progress card, product grid, product page (TensioLift Lifting Serum and others) with a clinical stats row and an "Add — bag" bar.
- **Book**: four steps (Studio → Soin → Date → Confirm) across the Marais, Saint-Germain, Lyon and Bordeaux studios. A service voucher can be applied at the Confirm step.
- **Rewards**: the Skin Miles game hub (details below).
- **Profile**: tier, upcoming visits, miles history, how the scoring works, and a demo reset.

## Skin Miles: how you earn

| Action | Miles |
|---|---|
| Daily check-in | +20, with streak bonuses at 7 (+100), 14, 30, 60, 100 and 365 days |
| Read the daily wellness tip | +10 |
| Complete a guided ritual (timer for each step) | +30 to +50 |
| **Glow Match**: memory game, pair the 6 actives | 80 for a perfect game, −5 per extra move (minimum 20) |
| **Skin Quiz**: 5 skincare questions | +10 per correct answer |
| **Glow Wheel**: one spin a day | 5 to 100 |
| Weekly and seasonal challenges (claimable) | +60 to +200 |
| Shop order | 1 mile per €1 spent |
| Studio visit | +150 |

Games pay out once a day. After that you can keep playing for practice. Hitting a streak milestone opens the full-screen **"jours de suite"** celebration, with a puffy 3D number, the week row with a gift, and the "Continuer" button.

**Tiers** are based on lifetime miles and multiply every reward except purchases: Bourgeon (×1) → Éclat at 1,500 (×1.1) → Rayonnance at 4,000 (×1.25) → Lumière at 8,000 (×1.5).

## Seasonal vouchers

The current season is worked out from the date (Winter: Dec–Feb, Spring: Mar–May, Summer: Jun–Aug, Autumn: Sep–Nov). Only the current season's vouchers can be redeemed, and next season's are shown locked as a teaser. A redeemed voucher gets a code such as `SEAS-AUX7K2` and stays valid until the end of the season.

- **Produit** vouchers (for example €10 off any sérum, −20% on the autumn nourish kit) apply in the bag at checkout.
- **Soin** vouchers (for example −30% on Kobido reveal, a free LED session) apply at the Confirm step when booking.

To change rewards, edit the `VOUCHERS` array in `app.js`.

## Customising

- **Photos:** the hero, products and studios are drawn in SVG and CSS so the app works offline. To use a real hero photo, add it as `assets/hero.jpg`, set `--hero-photo: url('assets/hero.jpg')` in `:root`, and remove the `.hero-art` element.
- **Catalog:** `PRODUCTS`, `SERVICES`, `STUDIOS`, `RITUALS`, `TIPS` and `QUIZ` at the top of `app.js`.
