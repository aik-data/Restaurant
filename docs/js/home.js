/* Perfetto Italian Restaurant — home page (menu, catering info, visit) */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, $$ = PF.$$, money = PF.money, esc = PF.esc, choiceTitle = PF.choiceTitle;

  /* ---------- Hours ---------- */
  $("#hoursList").innerHTML = D.info.hours.map(function (h) {
    return "<dt>" + esc(h.days) + "</dt><dd>" + esc(h.time) + "</dd>";
  }).join("");

  /* ---------- Favorites ---------- */
  var favs = [];
  D.menu.forEach(function (sec) {
    sec.items.forEach(function (it) { if (it.favorite) favs.push(it); });
  });
  $("#favGrid").innerHTML = favs.slice(0, 8).map(function (it) {
    return '<article class="fav-card"><h3>' + esc(it.name) + "</h3>" +
      (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") +
      (it.price != null ? '<p class="fav-price">' + money(it.price) + "</p>" : "") +
      "</article>";
  }).join("");

  /* ---------- Reviews ---------- */
  $("#reviewGrid").innerHTML = (D.reviews || []).map(function (r) {
    return '<figure class="review"><div class="stars" aria-label="5 stars">★★★★★</div><blockquote>“' + esc(r.quote) +
      '”</blockquote><figcaption>' + esc(r.source) + "</figcaption></figure>";
  }).join("");

  /* ---------- Menu tabs ---------- */
  var tabsEl = $("#menuTabs");
  var panelsEl = $("#menuPanels");

  tabsEl.innerHTML = D.menu.map(function (sec, i) {
    return '<button class="menu-tab" role="tab" type="button" id="tab-' + sec.id + '" aria-controls="panel-' + sec.id +
      '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(sec.title) + "</button>";
  }).join("");

  panelsEl.innerHTML = D.menu.map(function (sec, i) {
    var items = sec.items.map(function (it) {
      var price = it.price != null
        ? '<span class="menu-item-price">' + money(it.price) + "</span>"
        : '<span class="menu-item-price tbd" title="Price to be confirmed">—</span>';
      return '<li class="menu-item"><div class="menu-item-top"><span class="menu-item-name">' + esc(it.name) +
        (it.favorite ? '<span class="badge">Favorite</span>' : "") +
        '</span><span class="menu-item-dots" aria-hidden="true"></span>' + price + "</div>" +
        (it.desc ? '<p class="menu-item-desc">' + esc(it.desc) + "</p>" : "") + "</li>";
    }).join("");
    return '<div class="menu-panel" role="tabpanel" id="panel-' + sec.id + '" aria-labelledby="tab-' + sec.id + '"' +
      (i === 0 ? "" : " hidden") + '><div class="menu-panel-head"><h3>' + esc(sec.title) + "</h3><p>" + esc(sec.subtitle) +
      '</p></div><ul class="menu-list">' + items + "</ul></div>";
  }).join("");

  var tabs = $$(".menu-tab", tabsEl);
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
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
  $("#menuNote").textContent = D.menuNote;

  /* ---------- Catering: packages, trays, payment, terms ---------- */
  $("#packages").innerHTML = D.packages.map(function (p) {
    return '<article class="pkg' + (p.featured ? " featured" : "") + '">' +
      '<span class="pkg-tag">' + esc(p.tag) + "</span>" +
      "<h4>" + esc(p.name) + "</h4>" +
      '<div class="pkg-price">' + money(p.perPerson) + " <span>per person</span></div>" +
      '<p class="pkg-min">Minimum ' + p.min + " guests</p>" +
      "<ul>" +
        (p.boxed ? "<li><strong>Mix and match boxes</strong><span class=\"pkg-opts\">" + p.boxOptions.map(esc).join(" · ") + "</span></li>" : "") +
        (p.choices || []).map(function (c) {
          return "<li><strong>" + esc(choiceTitle(c)) + '</strong><span class="pkg-opts">' + c.options.map(esc).join(" · ") + "</span></li>";
        }).join("") +
        p.included.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        (p.upgrades || []).map(function (u) {
          return '<li class="pkg-upgrade"><strong>Optional: ' + esc(u.title.replace(/^Add /, "add ")) + "</strong> +" + money(u.perPerson) + " per person</li>";
        }).join("") +
      "</ul>" +
      '<a href="order.html?package=' + p.id + '" class="btn' + (p.featured ? "" : " btn-ghost-dark") + '">Order ' + esc(p.name) + "</a>" +
      "</article>";
  }).join("");

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
      var unit = { gallon: "/gal", "2-liter": " each" }[x.unit] || "";
      return "<tr><td>" + esc(x.name) + "</td><td>" + money(x.price) + unit + "</td></tr>";
    }).join("") + '</tbody></table><p class="tray-note">A gallon serves about 10.</p></div>');
  $("#trays").innerHTML = trayCards.join("");

  var pay = D.payment;
  $("#payment").innerHTML = '<h3 class="sub-title" id="payTitle">' + esc(pay.title) + '</h3><ol class="pay-steps">' +
    pay.steps.map(function (s, i) {
      return '<li><span class="pay-n">' + (i + 1) + "</span><div><h4>" + esc(s.title) + "</h4><p>" + esc(s.text) + "</p></div></li>";
    }).join("") + '</ol><p class="pay-note">' + esc(pay.note) + "</p>";

  $("#terms").innerHTML = D.cateringTerms.map(function (t) {
    return "<div><h4>" + esc(t.title) + "</h4><p>" + esc(t.text) + "</p></div>";
  }).join("");
})();
