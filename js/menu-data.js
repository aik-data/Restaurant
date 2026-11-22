/*
 * Perfetto Italian Restaurant — site content
 * ------------------------------------------------------------
 * Edit this one file to change the menu, catering packages,
 * tray prices, hours or contact details. Everything on the page
 * is generated from the data below.
 *
 *   price: number  -> shown as $12
 *   price: null    -> price not confirmed yet (shown as "—")
 *
 * Menu prices marked `verified: true` came from the restaurant's
 * public online-ordering listing. All catering prices are
 * SUGGESTED starting points for the owners to adjust.
 */

window.PERFETTO = {
  info: {
    name: "Perfetto Italian Restaurant",
    address: "209 S Green St",
    city: "Tehachapi, CA 93561",
    phone: "(661) 822-1711",
    phoneHref: "tel:+16618221711",
    email: "",
    orderOnline: "https://order.online/store/perfetto-italian-restaurant-209-s-green-st-1177349", // their existing pickup ordering page
    orderHours: "Online pickup orders 4:30 – 6:50 PM", // TODO: add a catering inbox, e.g. catering@perfettotehachapi.com
    mapsQuery: "Perfetto Italian Restaurant, 209 S Green St, Tehachapi, CA 93561",
    hours: [
      { days: "Tuesday – Saturday", time: "4:30 – 8:00 PM" },
      { days: "Sunday & Monday", time: "Closed" },
    ],
    cateringHours: "Catering available 7 days a week, lunch or dinner, with advance notice.",
  },

  /* ---------------- RESTAURANT MENU ---------------- */
  menu: [
    {
      id: "starters",
      title: "Starters",
      subtitle: "Great for sharing",
      items: [
        { name: "Prosciutto Wrapped Asparagus", desc: "Lightly grilled and seasoned asparagus wrapped in prosciutto. Three pieces.", price: 12, verified: true, favorite: true },
        { name: "Breaded Cheese Ravioli", desc: "Golden fried cheese ravioli with marinara for dipping.", price: 10, verified: true, favorite: true },
        { name: "Mozzarella Sticks", desc: "Breaded mozzarella with marinara.", price: 10, verified: true },
        { name: "Shrimp Cocktail", desc: "Chilled shrimp with cocktail sauce.", price: 13, verified: true },
        { name: "Bruschetta", desc: "Toasted bread topped with tomato, garlic and basil.", price: null },
        { name: "Goat Cheese Bruschetta", desc: "Toasted bread with creamy goat cheese.", price: null },
        { name: "Fried Zucchini Sticks", desc: "Crispy breaded zucchini.", price: null },
        { name: "Eggplant Wrap", desc: "", price: null },
      ],
    },
    {
      id: "soups-salads",
      title: "Soups & Salads",
      subtitle: "Salads come with bread · Dressings: sweet Italian, ranch, balsamic vinegar or blue cheese",
      items: [
        { name: "Soup of the Day", desc: "Ask your server. Served with garlic bread.", price: 9, verified: true },
        { name: "Caesar Salad", desc: "Romaine, parmesan, croutons, Caesar dressing.", price: 12, verified: true },
        { name: "Spinach Salad", desc: "Baby spinach, dried cranberries, toasted pecans and blue cheese.", price: 15, verified: true },
        { name: "Caprese Salad", desc: "Fresh mozzarella, tomato and basil.", price: 15, verified: true },
        { name: "Tuscan Antipasto Salad", desc: "Italian meats, cheeses and vegetables over greens.", price: 16, verified: true },
        { name: "Warm Goat Cheese Salad", desc: "Greens topped with warm goat cheese.", price: null },
        { name: "Fig & Gorgonzola Salad", desc: "", price: null },
      ],
    },
    {
      id: "house",
      title: "House Specialties",
      subtitle: "What we're known for",
      items: [
        { name: "Pasta Perfetto", desc: "Our signature. House-made pasta in a sun-dried tomato and garlic sauce, topped with warm crumbled goat cheese. Add chicken +$5.", price: 22, verified: true, favorite: true },
        { name: "Bolognese Lasagna", desc: "Seasoned Angus beef, tomato sauce and layers of cheese. Our most-loved dish.", price: 22, verified: true, favorite: true },
        { name: "Veggie Lasagna", desc: "Layers of pasta, vegetables and cheese, baked.", price: 21, verified: true },
        { name: "Shrimp Scampi", desc: "Shrimp in garlic butter and white wine over pasta.", price: 25, verified: true, favorite: true },
        { name: "Veal Parmesan", desc: "Breaded veal, marinara and melted mozzarella. Served with pasta.", price: 25, verified: true },
      ],
    },
    {
      id: "pasta",
      title: "Pasta",
      subtitle: "Made fresh in our kitchen",
      items: [
        { name: "Fettuccine Alfredo", desc: "Creamy parmesan sauce.", price: null },
        { name: "Pasta Bolognese", desc: "Slow-simmered meat sauce.", price: null },
        { name: "Spaghetti & Meatballs", desc: "House marinara and meatballs.", price: null },
        { name: "Pasta with Italian Sausage", desc: "", price: null },
        { name: "Clam Linguine", desc: "", price: null },
        { name: "Seafood Pasta", desc: "", price: null, favorite: true },
        { name: "Cheese Ravioli", desc: "", price: null },
        { name: "Lobster Ravioli", desc: "", price: null },
        { name: "Pasta Primavera", desc: "Seasonal vegetables.", price: null },
        { name: "Pesto Pasta", desc: "Basil pesto.", price: null },
        { name: "Rigatoni", desc: "", price: null },
      ],
    },
    {
      id: "entrees",
      title: "Entrées",
      subtitle: "Chicken, veal, seafood & more",
      items: [
        { name: "Chicken Marsala", desc: "Chicken breast with mushrooms in a Marsala wine sauce.", price: null, favorite: true },
        { name: "Chicken Parmesan", desc: "Breaded chicken, marinara and melted mozzarella.", price: null, favorite: true },
        { name: "Chicken Cordon Bleu", desc: "Chicken with ham and Swiss cheese.", price: null, favorite: true },
        { name: "Veal Marsala", desc: "Veal with mushrooms in a Marsala wine sauce.", price: null },
        { name: "Lemon Veal Scallopini", desc: "Thin veal cutlets in a lemon butter sauce.", price: null },
        { name: "Eggplant Parmesan", desc: "Breaded eggplant, marinara and mozzarella.", price: null, favorite: true },
        { name: "Stuffed Eggplant", desc: "Eggplant halves, stuffed and baked.", price: null },
        { name: "Grilled Salmon", desc: "", price: null },
        { name: "Tilapia Fillet", desc: "", price: null },
        { name: "Lamb Stew", desc: "Tender lamb stewed with mushrooms.", price: null },
      ],
    },
    {
      id: "desserts",
      title: "Desserts",
      subtitle: "Save room",
      items: [
        { name: "Tiramisu", desc: "Espresso-soaked ladyfingers and mascarpone cream.", price: null, favorite: true },
        { name: "Homemade Cannoli", desc: "Crisp shells, sweet ricotta filling.", price: null },
        { name: "Pistachio Cannoli", desc: "", price: null },
      ],
    },
  ],

  menuNote: "Ask about tonight's specials, like our seafood and sea bass specials. Vegan options available on request with notice. Generous portions, so plan on leftovers.",

  /* ---------------- GUEST REVIEWS ----------------
   * Short excerpts from public reviews. Before launch, check each one
   * against the original review and swap in the owners' favorites.
   */
  reviews: [
    { quote: "Best lasagna I ever had, and I think most will agree.", source: "Guest review" },
    { quote: "I've only done takeout and had the chicken parmesan. It was absolutely amazing.", source: "Google review" },
    { quote: "The tiramisu is to die for!", source: "Guest review" },
  ],

  /* ---------------- CATERING ---------------- */
  // Per-person packages. Minimum guests applies to each.
  //
  // choices: what the guest picks from the menu in the quote form.
  //   pick:  how many they choose from that list
  //   label / plural: wording, e.g. "Choose 1 pasta" / "Choose 2 entrées"
  //   hot:   true if it's served hot (used to estimate chafing dishes)
  // included: what comes with every order of that package.
  //
  // Reusable dish lists, so the same names show up everywhere:
  packages: (function () {
    var PASTAS = ["Pasta Perfetto", "Bolognese Lasagna", "Veggie Lasagna", "Fettuccine Alfredo", "Pasta Bolognese", "Spaghetti & Meatballs", "Pasta Primavera"];
    var LUNCH_PASTAS = ["Pasta Bolognese", "Fettuccine Alfredo", "Spaghetti & Meatballs", "Pasta Primavera"];
    var CHICKEN_EGGPLANT = ["Chicken Marsala", "Chicken Parmesan", "Chicken Cordon Bleu", "Eggplant Parmesan"];
    var PREMIUM_ENTREES = CHICKEN_EGGPLANT.concat(["Veal Marsala", "Veal Parmesan", "Shrimp Scampi"]);
    var BASIC_SALADS = ["Caesar Salad", "Spinach Salad"];
    var ALL_SALADS = BASIC_SALADS.concat(["Caprese Salad", "Tuscan Antipasto Salad"]);

    return [
      {
        id: "lunch",
        name: "Office Lunch",
        tag: "Meetings & trainings",
        perPerson: 18,
        min: 10,
        choices: [
          { id: "pasta", label: "pasta", plural: "pastas", pick: 1, hot: true, options: LUNCH_PASTAS },
          { id: "salad", label: "salad", plural: "salads", pick: 1, options: BASIC_SALADS },
        ],
        included: ["Garlic bread", "Plates, napkins & serving utensils"],
      },
      {
        id: "dinner",
        name: "Classic Dinner",
        tag: "Most popular",
        featured: true,
        perPerson: 28,
        min: 15,
        choices: [
          { id: "pasta", label: "pasta or lasagna", plural: "pastas", pick: 1, hot: true, options: PASTAS },
          { id: "entree", label: "entrée", plural: "entrées", pick: 1, hot: true, options: CHICKEN_EGGPLANT },
          { id: "salad", label: "salad", plural: "salads", pick: 1, options: BASIC_SALADS },
        ],
        included: ["Garlic bread", "Plates, napkins & serving utensils"],
      },
      {
        id: "celebration",
        name: "Celebration",
        tag: "Weddings & big parties",
        perPerson: 38,
        min: 25,
        choices: [
          { id: "starter", label: "starter", plural: "starters", pick: 1, options: ["Prosciutto Wrapped Asparagus", "Bruschetta", "Breaded Cheese Ravioli"] },
          { id: "entree", label: "entrée", plural: "entrées", pick: 2, hot: true, options: PREMIUM_ENTREES },
          { id: "pasta", label: "pasta or lasagna", plural: "pastas", pick: 1, hot: true, options: PASTAS },
          { id: "salad", label: "salad", plural: "salads", pick: 1, options: ALL_SALADS },
          { id: "dessert", label: "dessert", plural: "desserts", pick: 1, options: ["Tiramisu", "Homemade Cannoli"] },
        ],
        included: ["Garlic bread", "Plates, napkins & serving utensils"],
      },
    ];
  })(),

  // Trays: half pan serves ~8–10, full pan ~18–22
  trays: [
    {
      group: "Pasta & Lasagna",
      items: [
        { id: "t-lasagna-bol", name: "Bolognese Lasagna", half: 95, full: 180 },
        { id: "t-lasagna-veg", name: "Veggie Lasagna", half: 90, full: 170 },
        { id: "t-perfetto", name: "Pasta Perfetto", half: 85, full: 160 },
        { id: "t-alfredo", name: "Fettuccine Alfredo", half: 70, full: 130 },
        { id: "t-spag", name: "Spaghetti & Meatballs", half: 75, full: 140 },
        { id: "t-primavera", name: "Pasta Primavera", half: 70, full: 130 },
      ],
    },
    {
      group: "Entrées",
      items: [
        { id: "t-marsala", name: "Chicken Marsala", half: 95, full: 180 },
        { id: "t-chparm", name: "Chicken Parmesan", half: 95, full: 180 },
        { id: "t-eggparm", name: "Eggplant Parmesan", half: 85, full: 160 },
        { id: "t-scampi", name: "Shrimp Scampi", half: 120, full: 225 },
      ],
    },
    {
      group: "Salads",
      items: [
        { id: "t-caesar", name: "Caesar Salad", half: 40, full: 75 },
        { id: "t-spinach", name: "Spinach Salad", half: 50, full: 95 },
        { id: "t-antipasto", name: "Tuscan Antipasto Salad", half: 55, full: 105 },
      ],
    },
  ],

  // Sold by the dozen
  extras: [
    { id: "x-bread", name: "Garlic Bread", unit: "dozen", price: 15 },
    { id: "x-asparagus", name: "Prosciutto Wrapped Asparagus", unit: "dozen", price: 40 },
    { id: "x-ravioli", name: "Breaded Cheese Ravioli", unit: "dozen", price: 18 },
    { id: "x-cannoli", name: "Homemade Cannoli", unit: "dozen", price: 36 },
    { id: "x-tiramisu", name: "Tiramisu (half pan, serves 12)", unit: "pan", price: 60 },
  ],

  services: {
    deliveryFee: 25, // flat fee within the Tehachapi area
    chafingPerPan: 10, // disposable chafer kit with fuel, per pan
    deliveryArea: "Tehachapi, Golden Hills, Bear Valley Springs, Stallion Springs & Sand Canyon",
  },

  cateringTerms: [
    { title: "Notice", text: "48 hours for most orders. One week for groups over 50." },
    { title: "Pickup or delivery", text: "Free pickup on Green St. $25 delivery in the Tehachapi area. Ask us about Mojave, Cal City and Bakersfield." },
    { title: "Deposit", text: "25% deposit holds your date for events of 50+ guests." },
    { title: "Dietary needs", text: "Vegetarian dishes on every package. Vegan and gluten-conscious options on request." },
  ],
};
