# Perfetto Italian Restaurant: Website Prototype

A website for **Perfetto Italian Restaurant**, 209 S Green St, Tehachapi, CA. The site lives in the `docs/` folder (GitHub Pages publishes from there) and has two pages:

- **Home** (`index.html`): dinner menu, reviews, catering packages, trays, payment info and visit details
- **Catering order** (`order.html`): the order builder. Customers choose a package and dishes, add trays, see a live estimate and send their request. Package buttons on the home page link to `order.html?package=dinner` (etc.), which preselects that package.

## Preview it

Open `docs/index.html` in any browser. No build step, no install.

## Files

| File | What it is |
|---|---|
| `docs/index.html` | Home page layout and text |
| `docs/order.html` | Catering order page |
| `docs/css/styles.css` | Look and feel for both pages |
| `docs/js/menu-data.js` | **All menu items, prices, catering packages, trays, hours and contact info. Edit this file to change content.** |
| `docs/js/estimate.js` | Catering price calculator (shared with the email backend so totals always match) |
| `docs/js/common.js` | Shared by both pages: navigation, banner, helpers |
| `docs/js/home.js` | Home page: menu tabs, package cards, trays, reviews |
| `docs/js/order.js` | Order page: dish picker, estimate, form sending |

## What's verified vs. what needs the owners

**Verified from public listings (Nov 2026):**
- Address, phone (661) 822-1711, dinner hours Tue–Sat 4:30–8 PM, closed Sun–Mon
- Menu prices for 14 items from the restaurant's online-ordering page: Prosciutto Wrapped Asparagus $12, Breaded Cheese Ravioli $10, Mozzarella Sticks $10, Shrimp Cocktail $13, Soup of the Day $9, Caesar $12, Spinach $15, Caprese $15, Tuscan Antipasto $16, Pasta Perfetto $22 (+$5 chicken), Bolognese Lasagna $22, Veggie Lasagna $21, Shrimp Scampi $25, Veal Parmesan $25
- Pasta Perfetto (sun-dried tomato & garlic sauce, warm goat cheese) and Bolognese Lasagna (seasoned Angus beef) descriptions, from the ordering page
- Existing online pickup ordering at order.online (4:30–6:50 PM). The site links to it.
- Dish names on the rest of the menu (from Yelp, Restaurantji, Checkle and others)
- Yelp already lists "Offers catering" and "Offers takeout"

**Owners to fill in or confirm:**
- [ ] Prices for items showing "—" (all of Pasta, Entrées and Desserts, plus a few starters and salads)
- [ ] Dish descriptions: the Eggplant Wrap, Fig & Gorgonzola, Stuffed Eggplant, etc.
- [ ] The 3 review quotes: check each against the original review, or swap in favorites from Google
- [ ] An "Our story" blurb: who the family is, where the recipes come from
- [ ] Remove any dishes no longer served, and add missing ones
- [ ] **Catering prices.** All package and tray prices are *suggestions* based on the dine-in prices. Check them against food cost.
- [ ] Catering rules: notice, delivery area and fee, deposit, minimums
- [ ] A catering email inbox for new requests
- [ ] Real food photos, plus a logo if they have one
- [ ] Remove the yellow "Prototype" banner in `index.html` once everything is confirmed

## Taking payment (Clover invoices)

The site tells customers: no payment to request a quote, then a secure email invoice once the order is confirmed. To send one:

1. Log in to the Clover web dashboard.
2. Go to **Virtual Terminal → Send Invoice**.
3. Enter the amount and the customer's email, and paste the order summary from the quote request into the note or description, if there's a field for it.
4. Events of 50+ guests: invoice a 25% deposit when booking, then the balance 3 days before the event.

The wording is in the `payment` section of `docs/js/menu-data.js`.

## Emails (catering requests and confirmations)

The order form sends to a small **Cloudflare Worker** (`worker/`) that uses **Resend** to:

- email the restaurant the full order (hitting Reply goes straight to the customer)
- email the customer a confirmation with their order and what happens next

The Worker recomputes every price from `docs/js/menu-data.js`, so the totals in the emails always match the menu. It only accepts orders from the website addresses listed in `ALLOWED_ORIGINS` (in `worker/wrangler.toml`), and it has a hidden spam-trap field. The Resend key is stored as a Cloudflare secret, never in this repo.

Until the Worker is connected, the form shows a preview of the request instead of sending.

### One-time setup

1. **Domain:** buy the restaurant's domain (e.g. `perfettotehachapi.com`). Cloudflare Registrar sells domains at cost, and keeping DNS on Cloudflare makes the next step easy.
2. **Resend:** sign up at resend.com, add the domain, and add the DNS records Resend shows you. Once the domain shows as verified, create an API key with sending access.
3. **Deploy the Worker:** Cloudflare dashboard → **Workers & Pages → Create application → Import a repository**. Pick this GitHub repo, set the root directory (path) to `worker`, and keep the name `perfetto-catering` (it must match `wrangler.toml`). Deploy. Every push to the production branch redeploys it.
4. **Add the settings** (the Worker → **Settings → Variables and Secrets**, type **Secret**):
   - `RESEND_API_KEY`: the Resend key
   - `CATERING_TO_EMAIL`: where requests go (comma-separate for more than one)
   - `CATERING_FROM_EMAIL`: e.g. `Perfetto Catering <catering@perfettotehachapi.com>` (must be on the verified domain)
5. **Connect the site:** copy the Worker's address (`https://perfetto-catering.<your-subdomain>.workers.dev`) into `cateringEndpoint` in `docs/js/menu-data.js`.
6. **Custom domain for the site?** Add it to `ALLOWED_ORIGINS` in `worker/wrangler.toml`, e.g. `"https://aik-data.github.io,https://perfettotehachapi.com,https://www.perfettotehachapi.com"`.

Resend's free plan covers 100 emails a day and 3,000 a month. Each order uses 2.

## Put it online (GitHub Pages, free)

1. Merge the work into `main`.
2. Repo **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **`main`**, folder **`/docs`**. Save.
3. The site appears at `https://<owner>.github.io/restaurant/` in about a minute. Every change pushed to `main` updates it.
4. Optional: buy a domain (e.g. `perfettotehachapi.com`, about $12/yr) and add it under **Settings → Pages → Custom domain**. GitHub provides HTTPS.
5. Add the web address to the Google Business Profile.

The repo needs to be public for free GitHub Pages. Nothing secret is stored here.

## Suggested catering pricing logic

- Dine-in entrées run $21–25. Catering per-person packages ($18 / $28 / $38) cover a salad, bread and 1–3 hot dishes at a lower per-plate cost than dine-in, which is normal for catering because there's no table service.
- Half pan ≈ 8–10 servings, full pan ≈ 18–22 servings. Tray prices work out to roughly $8–10 per serving.
- The restaurant is closed for lunch, so **weekday lunch catering uses an idle kitchen.** That makes it the best first target (offices, schools, the hospital, wind energy companies).
