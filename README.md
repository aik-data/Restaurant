# Perfetto Italian Restaurant: Website Prototype

A one-page website for **Perfetto Italian Restaurant**, 209 S Green St, Tehachapi, CA. It includes the dinner menu, catering packages and trays, and a catering quote builder that gives a live estimate.

## Preview it

Open `index.html` in any browser. No build step, no install.

## Files

| File | What it is |
|---|---|
| `index.html` | Page layout and text |
| `css/styles.css` | Look and feel |
| `js/menu-data.js` | **All menu items, prices, catering packages, trays, hours and contact info. Edit this file to change content.** |
| `js/main.js` | Menu tabs, quote calculator, form sending |

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
- [ ] A catering email inbox (set `email` in `js/menu-data.js`)
- [ ] Real food photos, plus a logo if they have one
- [ ] Remove the yellow "Prototype" banner in `index.html` once everything is confirmed

## Taking payment (Clover invoices)

The site tells customers: no payment to request a quote, then a secure email invoice once the order is confirmed. To send one:

1. Log in to the Clover web dashboard.
2. Go to **Virtual Terminal → Send Invoice**.
3. Enter the amount and the customer's email, and paste the order summary from the quote request into the note or description, if there's a field for it.
4. Events of 50+ guests: invoice a 25% deposit when booking, then the balance 3 days before the event.

The wording is in the `payment` section of `js/menu-data.js`.

## Make the quote form actually send

Right now the form shows what *would* be sent. To get requests by email:

1. Make a free account at https://formspree.io and create a form, using the restaurant's email.
2. Copy the form endpoint (looks like `https://formspree.io/f/abcdwxyz`).
3. Paste it into `FORM_ENDPOINT` at the top of `js/main.js`.

Simpler option: set `email` in `js/menu-data.js`. The form will then open the guest's email app with the request filled in.

## Put it online (free)

- **GitHub Pages:** repo Settings → Pages → deploy from the `main` branch, root folder.
- **Netlify:** drag the folder onto https://app.netlify.com/drop.

Then buy a domain (e.g. `perfettotehachapi.com`, about $12/yr) and point it at the host. Add the URL to the Google Business Profile.

## Suggested catering pricing logic

- Dine-in entrées run $21–25. Catering per-person packages ($18 / $28 / $38) cover a salad, bread and 1–3 hot dishes at a lower per-plate cost than dine-in, which is normal for catering because there's no table service.
- Half pan ≈ 8–10 servings, full pan ≈ 18–22 servings. Tray prices work out to roughly $8–10 per serving.
- The restaurant is closed for lunch, so **weekday lunch catering uses an idle kitchen.** That makes it the best first target (offices, schools, the hospital, wind energy companies).
