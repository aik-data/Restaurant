/* Perfetto Italian Restaurant — home page content (menu, dishes, catering, visit) */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, $$ = PF.$$, money = PF.money, esc = PF.esc, choiceTitle = PF.choiceTitle;
  var media = D.media || {};
  var dishPhotos = media.dishes || {};

  /* ---------- Live open status: open now / opening later / closed ---------- */
  (function openStatus() {
    var els = $$("[data-open-status]");
    var s = D.info.schedule;
    if (!els.length || !s) return;
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-US", { timeZone: s.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
      var mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      var toMin = function (t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; };
      var open = toMin(s.open), close = toMin(s.close);
      var label = function (m) { var h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ":" + String(mm).padStart(2, "0") : "") + (h < 12 ? " am" : " pm"); };
      var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var nextOpen = function (from) {
        for (var i = 1; i <= 7; i++) { var d = (from + i) % 7; if (s.days.indexOf(d) !== -1) return i === 1 ? "tomorrow" : names[d]; }
        return "soon";
      };
      var isOpenDay = s.days.indexOf(day) !== -1, state, text;
      if (isOpenDay && mins < open) { state = "soon"; text = "Opening tonight at " + label(open); }
      else if (isOpenDay && mins < close) { state = "open"; text = "Open now · until " + label(close); }
      else if (isOpenDay) { state = "closed"; text = "Closed for tonight · back " + nextOpen(day) + " at " + label(open); }
      else { state = "closed"; text = "Closed today · back " + nextOpen(day) + " at " + label(open); }
      els.forEach(function (el) {
        el.textContent = text;
        el.parentNode.setAttribute("data-state", state);
      });
    } catch (e) { /* keep the default hours text */ }
  })();

  /* ---------- Hours ---------- */
  $("#hoursList").innerHTML = D.info.hours.map(function (h) {
    return "<dt>" + esc(h.days) + "</dt><dd>" + esc(h.time) + "</dd>";
  }).join("");

  /* ---------- Signature dishes gallery ---------- */
  var byName = {};
  D.menu.forEach(function (sec) { sec.items.forEach(function (it) { byName[it.name] = it; }); });
  $("#sigTrack").innerHTML = (media.signature || []).map(function (name, i) {
    var it = byName[name] || { name: name }, ph = dishPhotos[name];
    if (!ph) return "";
    var small = ph.src.replace(/\.jpg$/, "-sm.jpg");
    return '<article class="dish">' +
      '<figure class="dish-media"><img src="' + small + '" srcset="' + small + " 900w, " + ph.src + ' 1600w" sizes="(max-width: 900px) 80vw, 32vw" alt="' + esc(name) + '" loading="lazy"></figure>' +
      '<div class="dish-info"><span class="dish-no">' + String(i + 1).padStart(2, "0") + "</span>" +
      "<h3>" + esc(name) + "</h3>" + (it.price != null ? '<span class="dish-price">' + money(it.price) + "</span>" : "") +
      (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") + "</div></article>";
  }).join("");

  /* ---------- Guests say: one quote at a time ---------- */
  var reviews = D.reviews || [];
  var stage = $("#reviewGrid"), dotsEl = $("#quoteDots");
  stage.innerHTML = reviews.map(function (r, i) {
    return '<figure class="review-quote' + (i === 0 ? " is-active" : "") + '"><blockquote>“' + esc(r.quote) + '”</blockquote><figcaption>' + esc(r.source) + "</figcaption></figure>";
  }).join("");
  dotsEl.innerHTML = reviews.map(function (_, i) {
    return '<button type="button" aria-label="Show review ' + (i + 1) + '"' + (i === 0 ? ' class="is-active"' : "") + "><span></span></button>";
  }).join("");
  var quotes = $$(".review-quote", stage), qDots = $$("button", dotsEl), q = 0, qTimer = null;
  function showQuote(n) {
    q = (n + quotes.length) % quotes.length;
    quotes.forEach(function (el, i) { el.classList.toggle("is-active", i === q); });
    qDots.forEach(function (el, i) { el.classList.toggle("is-active", i === q); });
  }
  function autoplay() { clearInterval(qTimer); qTimer = setInterval(function () { showQuote(q + 1); }, 6500); }
  qDots.forEach(function (b, i) { b.addEventListener("click", function () { showQuote(i); autoplay(); }); });
  if (quotes.length > 1) autoplay();

  /* ---------- Menu tabs ---------- */
  var tabsEl = $("#menuTabs");
  var panelsEl = $("#menuPanels");

  tabsEl.innerHTML = D.menu.map(function (sec, i) {
    return '<button class="menu-tab" role="tab" type="button" id="tab-' + sec.id + '" aria-controls="panel-' + sec.id +
      '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(sec.title) + "</button>";
  }).join("") + '<span class="tab-ink" aria-hidden="true"></span>';

  panelsEl.innerHTML = D.menu.map(function (sec, i) {
    var items = sec.items.map(function (it) {
      var price = it.price != null
        ? '<span class="menu-item-price">' + money(it.price) + "</span>"
        : '<span class="menu-item-price tbd" title="Price to be confirmed">—</span>';
      var ph = dishPhotos[it.name];
      return '<li class="menu-item"' + (ph ? ' data-photo="' + ph.src.replace(/\.jpg$/, "-sm.jpg") + '"' : "") + '><div class="menu-item-top"><span class="menu-item-name">' +
        esc(it.name) + (it.favorite ? '<span class="fav-mark" title="House favorite">House favorite</span>' : "") +
        '</span><span class="menu-item-dots" aria-hidden="true"></span>' + price + "</div>" +
        (it.desc ? '<p class="menu-item-desc">' + esc(it.desc) + "</p>" : "") + "</li>";
    }).join("");
    return '<div class="menu-panel" role="tabpanel" id="panel-' + sec.id + '" aria-labelledby="tab-' + sec.id + '"' +
      (i === 0 ? "" : " hidden") + '><div class="menu-panel-head"><h3>' + esc(sec.title) + "</h3><p>" + esc(sec.subtitle) +
      '</p></div><ul class="menu-list">' + items + "</ul></div>";
  }).join("");

  var tabs = $$(".menu-tab", tabsEl), ink = $(".tab-ink", tabsEl);
  function moveInk(tab) {
    if (!ink || !tab) return;
    ink.style.width = tab.offsetWidth + "px";
    ink.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = $("#" + t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on) { panel.classList.remove("is-in"); void panel.offsetWidth; panel.classList.add("is-in"); }
    });
    moveInk(tab);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); next.focus(); selectTab(next); }
    });
  });
  window.addEventListener("resize", function () { moveInk(tabsEl.querySelector('[aria-selected="true"]')); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(tabs[0]); });
  moveInk(tabs[0]);
  $("#menuNote").textContent = D.menuNote;

  /* ---------- Catering packages ---------- */
  $("#packages").innerHTML = D.packages.map(function (p) {
    var rows =
      (p.boxed ? "<li><strong>Mix and match boxes</strong><span class=\"pkg-opts\">" + p.boxOptions.map(esc).join(" · ") + "</span></li>" : "") +
      (p.choices || []).map(function (c) {
        return "<li><strong>" + esc(choiceTitle(c)) + '</strong><span class="pkg-opts">' + c.options.map(esc).join(" · ") + "</span></li>";
      }).join("") +
      p.included.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
      (p.upgrades || []).map(function (u) {
        return '<li class="pkg-upgrade"><strong>Optional: ' + esc(u.title.replace(/^Add /, "add ")) + "</strong> +" + money(u.perPerson) + " per person</li>";
      }).join("");
    return '<article class="pkg' + (p.featured ? " featured" : "") + '" data-reveal>' +
      (p.featured ? '<span class="pkg-badge">Most popular</span>' : "") +
      '<p class="pkg-tag">' + esc(p.tag) + "</p>" +
      "<h4>" + esc(p.name) + "</h4>" +
      '<p class="pkg-price">' + money(p.perPerson) + "<small>per person · min " + p.min + "</small></p>" +
      "<ul>" + rows + "</ul>" +
      '<a href="order.html?package=' + p.id + '" class="btn btn-block ' + (p.featured ? "btn-gold" : "btn-ghost") + '">Order ' + esc(p.name) + "</a>" +
      "</article>";
  }).join("");

  /* ---------- Trays, extras and drinks ---------- */
  var trayCards = D.trays.map(function (g) {
    return '<div class="tray-card"><h4>' + esc(g.group) + '</h4><table class="tray-table"><thead><tr><th scope="col">Item</th><th scope="col">Half</th><th scope="col">Full</th></tr></thead><tbody>' +
      g.items.map(function (t) {
        return "<tr><td>" + esc(t.name) + "</td><td>" + money(t.half) + "</td><td>" + money(t.full) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  });
  trayCards.push('<div class="tray-card"><h4>Starters, Bread &amp; Desserts</h4><table class="tray-table"><thead><tr><th scope="col">Item</th><th scope="col">Price</th></tr></thead><tbody>' +
    D.extras.map(function (x) {
      return "<tr><td>" + esc(x.name) + "</td><td>" + money(x.price) + (x.unit === "dozen" ? "/dz" : "") + "</td></tr>";
    }).join("") + "</tbody></table></div>");
  trayCards.push('<div class="tray-card"><h4>Drinks</h4><table class="tray-table"><thead><tr><th scope="col">Item</th><th scope="col">Price</th></tr></thead><tbody>' +
    (D.drinks || []).map(function (x) {
      var unit = { gallon: "/gal", "2-liter": " ea" }[x.unit] || "";
      return "<tr><td>" + esc(x.name) + "</td><td>" + money(x.price) + unit + "</td></tr>";
    }).join("") + '</tbody></table><p class="tray-note">A gallon serves about 10.</p></div>');
  $("#trays").innerHTML = trayCards.join("");

  /* ---------- Payment and terms ---------- */
  var pay = D.payment;
  $("#payment").innerHTML = '<h3 class="sub-title" id="payTitle">' + esc(pay.title) + '</h3><ol class="pay-steps">' +
    pay.steps.map(function (s, i) {
      return '<li><span class="pay-n">' + (i + 1) + "</span><div><h4>" + esc(s.title) + "</h4><p>" + esc(s.text) + "</p></div></li>";
    }).join("") + '</ol><p class="pay-note">' + esc(pay.note) + "</p>";

  $("#terms").innerHTML = D.cateringTerms.map(function (t) {
    return "<div><h4>" + esc(t.title) + "</h4><p>" + esc(t.text) + "</p></div>";
  }).join("");
})();
