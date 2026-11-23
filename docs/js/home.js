/* Perfetto Italian Restaurant — home page (menu, catering info, visit) */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, $$ = PF.$$, money = PF.money, esc = PF.esc, choiceTitle = PF.choiceTitle;

  /* ---------- "Today on Green Street": open now / opening later / closed ---------- */
  (function openStatus() {
    var el = $("#openStatus");
    var s = D.info.schedule;
    if (!el || !s) return;
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-US", { timeZone: s.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
      var mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      var toMin = function (t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; };
      var open = toMin(s.open), close = toMin(s.close);
      var label = function (m) { var h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ":" + String(mm).padStart(2, "0") : ""); };
      var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var nextOpen = function (from) {
        for (var i = 1; i <= 7; i++) { var d = (from + i) % 7; if (s.days.indexOf(d) !== -1) return i === 1 ? "tomorrow" : names[d]; }
        return "soon";
      };
      var text;
      if (s.days.indexOf(day) !== -1 && mins < open) text = "Opening tonight at " + label(open);
      else if (s.days.indexOf(day) !== -1 && mins < close) text = "Open now · until " + label(close);
      else if (s.days.indexOf(day) !== -1) text = "Closed for tonight · back " + nextOpen(day) + " at " + label(open);
      else text = "Closed today · back " + nextOpen(day) + " at " + label(open);
      el.textContent = text;
      el.classList.toggle("is-open", /^Open now/.test(text));
    } catch (e) { /* keep the default hours text */ }
  })();

  /* ---------- Hours on the door sign ---------- */
  $("#hoursList").innerHTML = D.info.hours.map(function (h) {
    return "<dt>" + esc(h.days) + "</dt><dd>" + esc(h.time) + "</dd>";
  }).join("");

  /* ---------- House favorites, numbered like a menu ---------- */
  var favs = [];
  D.menu.forEach(function (sec) {
    sec.items.forEach(function (it) { if (it.favorite) favs.push(it); });
  });
  $("#favList").innerHTML = favs.slice(0, 8).map(function (it, i) {
    return '<li class="fav"><span class="fav-no">' + String(i + 1).padStart(2, "0") + "</span>" +
      "<div><h3>" + esc(it.name) + "</h3>" + (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") + "</div>" +
      '<span class="fav-price">' + (it.price != null ? money(it.price) : "") + "</span></li>";
  }).join("");

  /* ---------- Overheard ---------- */
  $("#reviewGrid").innerHTML = (D.reviews || []).map(function (r) {
    return '<figure class="say"><blockquote>' + esc(r.quote) + "</blockquote><figcaption>" + esc(r.source) + "</figcaption></figure>";
  }).join("");

  /* ---------- Menu card tabs ---------- */
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
      return '<li class="menu-item"><div class="menu-item-top"><span class="menu-item-name">' +
        (it.favorite ? '<span class="fav-mark" title="House favorite" aria-label="House favorite">★</span>' : "") + esc(it.name) +
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

  /* ---------- Catering packages as tear-off tickets ---------- */
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
    return '<article class="ticket' + (p.featured ? " featured" : "") + '">' +
      (p.featured ? '<span class="ticket-stamp" aria-hidden="true">Most<br>popular</span>' : "") +
      '<div class="ticket-head"><span class="ticket-tag">' + esc(p.tag) + "</span>" +
      "<h4>" + esc(p.name) + "</h4>" +
      '<p class="ticket-price">' + money(p.perPerson) + "<small>per person</small></p>" +
      '<p class="ticket-min">Minimum ' + p.min + " guests</p></div>" +
      '<div class="ticket-body"><ul>' + rows + "</ul>" +
      '<a href="order.html?package=' + p.id + '" class="btn btn-block' + (p.featured ? "" : " btn-paper") + '">Order ' + esc(p.name) + "</a></div>" +
      "</article>";
  }).join("");

  /* ---------- Trays, extras and drinks: the deli board ---------- */
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
