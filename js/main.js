/* Perfetto Italian Restaurant — page behavior */
(function () {
  "use strict";

  /*
   * Where quote requests go.
   * Create a free form at https://formspree.io, then paste its endpoint here,
   * e.g. "https://formspree.io/f/abcdwxyz". Until then the form shows the
   * request summary and asks the guest to call.
   */
  var FORM_ENDPOINT = "";

  var D = window.PERFETTO;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- Small UI bits ---------- */
  $("#year").textContent = new Date().getFullYear();

  var banner = $("#protoBanner");
  try { if (localStorage.getItem("perfetto-proto-dismissed") === "1") banner.classList.add("hidden"); } catch (e) {}
  $("#protoClose").addEventListener("click", function () {
    banner.classList.add("hidden");
    try { localStorage.setItem("perfetto-proto-dismissed", "1"); } catch (e) {}
  });

  var toggle = $(".nav-toggle");
  var links = $("#navLinks");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    links.classList.toggle("open", !open);
  });
  $$("#navLinks a").forEach(function (a) {
    a.addEventListener("click", function () {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("open");
    });
  });

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

  /* ---------- Online ordering links ---------- */
  $$("[data-order-link]").forEach(function (a) { a.href = D.info.orderOnline; });
  $$("[data-order-hours]").forEach(function (el) { el.textContent = D.info.orderHours; });

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

  /* ---------- Catering: packages, trays, terms ---------- */
  $("#packages").innerHTML = D.packages.map(function (p) {
    return '<article class="pkg' + (p.featured ? " featured" : "") + '">' +
      '<span class="pkg-tag">' + esc(p.tag) + "</span>" +
      "<h4>" + esc(p.name) + "</h4>" +
      '<div class="pkg-price">' + money(p.perPerson) + " <span>per person</span></div>" +
      '<p class="pkg-min">Minimum ' + p.min + " guests</p>" +
      "<ul>" + p.includes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<a href="#quote" class="btn' + (p.featured ? "" : " btn-ghost-dark") + '" data-pick="' + p.id + '">Choose ' + esc(p.name) + "</a>" +
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
  $("#trays").innerHTML = trayCards.join("");

  $("#terms").innerHTML = D.cateringTerms.map(function (t) {
    return "<div><h4>" + esc(t.title) + "</h4><p>" + esc(t.text) + "</p></div>";
  }).join("");

  /* ---------- Quote builder ---------- */
  var form = $("#quoteForm");

  $("#pkgChoices").innerHTML =
    '<label class="pkg-choice"><input type="radio" name="package" value="" checked><span class="card"><strong>No package</strong><span>Trays and extras only</span></span></label>' +
    D.packages.map(function (p) {
      return '<label class="pkg-choice"><input type="radio" name="package" value="' + p.id + '"><span class="card"><strong>' +
        esc(p.name) + "</strong><span>" + money(p.perPerson) + "/person · min " + p.min + "</span></span></label>";
    }).join("");

  var picker = D.trays.map(function (g) {
    return "<h4>" + esc(g.group) + "</h4>" + g.items.map(function (t) {
      return '<div class="tp-row"><span class="tp-name">' + esc(t.name) + "<small>Half " + money(t.half) + " · Full " + money(t.full) + "</small></span>" +
        '<label class="tp-qty">Half<input type="number" min="0" max="50" value="0" inputmode="numeric" data-tray="' + t.id + '" data-size="half" aria-label="' + esc(t.name) + ' half pans"></label>' +
        '<label class="tp-qty">Full<input type="number" min="0" max="50" value="0" inputmode="numeric" data-tray="' + t.id + '" data-size="full" aria-label="' + esc(t.name) + ' full pans"></label></div>';
    }).join("");
  }).join("");
  picker += "<h4>Starters, Bread &amp; Desserts</h4>" + D.extras.map(function (x) {
    return '<div class="tp-row"><span class="tp-name">' + esc(x.name) + "<small>" + money(x.price) + " per " + x.unit + "</small></span>" +
      '<span></span><label class="tp-qty">Qty<input type="number" min="0" max="50" value="0" inputmode="numeric" data-extra="' + x.id + '" aria-label="' + esc(x.name) + ' quantity"></label></div>';
  }).join("");
  $("#trayPicker").innerHTML = picker;

  $("#deliveryFeeLabel").textContent = "(" + money(D.services.deliveryFee) + " in the Tehachapi area)";
  $("#chaferLabel").textContent = "(" + money(D.services.chafingPerPan) + " per hot pan)";

  // Earliest date = 2 days out
  var minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  form.date.min = minDate.toISOString().slice(0, 10);

  // "Choose package" buttons preselect it in the form
  $$("[data-pick]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var r = form.querySelector('input[name="package"][value="' + btn.dataset.pick + '"]');
      if (r) { r.checked = true; update(); }
    });
  });

  var trayIndex = {};
  D.trays.forEach(function (g) { g.items.forEach(function (t) { trayIndex[t.id] = t; }); });
  var extraIndex = {};
  D.extras.forEach(function (x) { extraIndex[x.id] = x; });
  var hotGroups = { "Pasta & Lasagna": true, "Entrées": true };
  var hotTray = {};
  D.trays.forEach(function (g) { g.items.forEach(function (t) { hotTray[t.id] = !!hotGroups[g.group]; }); });
  var hotDishesPerPackage = { lunch: 1, dinner: 2, celebration: 3 };

  function qty(input) {
    var n = parseInt(input.value, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 1000);
  }

  function calc() {
    var lines = [];
    var total = 0;
    var hotPans = 0;
    var guests = qty(form.guests);
    var pkgId = (form.querySelector('input[name="package"]:checked') || {}).value;
    var pkg = D.packages.filter(function (p) { return p.id === pkgId; })[0];

    if (pkg && guests > 0) {
      var billed = Math.max(guests, pkg.min);
      var sub = billed * pkg.perPerson;
      lines.push([pkg.name + " × " + billed + (billed > guests ? " (minimum)" : "") + " guests", sub]);
      total += sub;
      hotPans += Math.ceil(billed / 20) * (hotDishesPerPackage[pkg.id] || 1);
    }

    $$("[data-tray]", form).forEach(function (inp) {
      var n = qty(inp);
      if (!n) return;
      var t = trayIndex[inp.dataset.tray];
      var size = inp.dataset.size;
      var sub = n * t[size];
      lines.push([t.name + " · " + n + " " + size + " pan" + (n > 1 ? "s" : ""), sub]);
      total += sub;
      if (hotTray[t.id]) hotPans += n;
    });

    $$("[data-extra]", form).forEach(function (inp) {
      var n = qty(inp);
      if (!n) return;
      var x = extraIndex[inp.dataset.extra];
      var sub = n * x.price;
      lines.push([x.name + " × " + n + (x.unit === "dozen" ? " dz" : ""), sub]);
      total += sub;
    });

    var hasFood = lines.length > 0;
    if (hasFood && form.chafers.checked && hotPans > 0) {
      var c = hotPans * D.services.chafingPerPan;
      lines.push(["Chafing dishes × " + hotPans, c]);
      total += c;
    }
    var delivery = form.querySelector('input[name="fulfillment"]:checked').value === "delivery";
    if (hasFood && delivery) {
      lines.push(["Delivery", D.services.deliveryFee]);
      total += D.services.deliveryFee;
    }
    return { lines: lines, total: total, guests: guests, pkg: pkg, delivery: delivery, hasFood: hasFood };
  }

  function update() {
    var r = calc();
    $(".delivery-addr", form).hidden = !r.delivery;
    $("#summaryLines").innerHTML = r.hasFood
      ? r.lines.map(function (l) { return "<li><span>" + esc(l[0]) + "</span><span>" + money(l[1]) + "</span></li>"; }).join("")
      : '<li class="muted">Choose a package or trays to see an estimate.</li>';
    $("#summaryTotal").textContent = money(r.total);
    $("#summaryPP").textContent = r.hasFood && r.guests > 0 ? "About " + money(r.total / r.guests) + " per guest for " + r.guests + " guests" : "";
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  function buildSummaryText(r) {
    var f = form;
    var out = [
      "CATERING QUOTE REQUEST",
      "Event: " + f.eventType.value,
      "Date: " + f.date.value + (f.time.value ? " at " + f.time.value : ""),
      "Guests: " + r.guests,
      "Fulfillment: " + (r.delivery ? "Delivery to " + (f.address.value || "(address not given)") : "Pickup"),
      "",
      "Order:",
    ];
    r.lines.forEach(function (l) { out.push("  - " + l[0] + ": " + money(l[1])); });
    out.push("Estimated total: " + money(r.total), "", "Name: " + f.name.value, "Phone: " + f.phone.value, "Email: " + f.email.value);
    if (f.notes.value) out.push("Notes: " + f.notes.value);
    return out.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("#formMsg");
    msg.className = "form-msg";
    msg.textContent = "";

    var required = ["eventType", "date", "guests", "name", "phone", "email"];
    var firstBad = null;
    required.forEach(function (n) {
      var el = form[n];
      var ok = el.checkValidity() && String(el.value).trim() !== "";
      el.classList.toggle("invalid", !ok);
      if (!ok && !firstBad) firstBad = el;
    });
    if (form.querySelector('input[name="fulfillment"]:checked').value === "delivery" && !form.address.value.trim()) {
      form.address.classList.add("invalid");
      firstBad = firstBad || form.address;
    } else {
      form.address.classList.remove("invalid");
    }
    var r = calc();
    if (firstBad) {
      msg.className = "form-msg err";
      msg.textContent = "Please fill in the highlighted fields.";
      firstBad.focus();
      return;
    }
    if (!r.hasFood && !form.notes.value.trim()) {
      msg.className = "form-msg err";
      msg.textContent = "Choose a package or trays, or describe what you'd like in the notes.";
      return;
    }

    var text = buildSummaryText(r);

    if (FORM_ENDPOINT) {
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "Catering request: " + form.eventType.value + " on " + form.date.value, _replyto: form.email.value, message: text }),
      }).then(function (res) {
        if (!res.ok) throw new Error("bad status");
        msg.className = "form-msg ok";
        msg.textContent = "Thank you! Your request was sent. We'll contact you within one business day to confirm.";
        form.reset();
        update();
      }).catch(function () {
        msg.className = "form-msg err";
        msg.innerHTML = 'Sorry, something went wrong. Please call us at <a href="' + D.info.phoneHref + '">' + D.info.phone + "</a>.";
      }).then(function () {
        btn.disabled = false;
        btn.textContent = "Send Quote Request";
      });
      return;
    }

    if (D.info.email) {
      window.location.href = "mailto:" + D.info.email + "?subject=" + encodeURIComponent("Catering request: " + form.eventType.value) + "&body=" + encodeURIComponent(text);
      msg.className = "form-msg ok";
      msg.textContent = "Your email app should open with your request filled in. Just hit send.";
      return;
    }

    msg.className = "form-msg ok";
    msg.innerHTML = "<strong>Prototype mode:</strong> this request wasn't sent yet (no form service is connected). Here's what the restaurant would receive:" +
      '<pre style="white-space:pre-wrap;font-size:.78rem;margin:.6rem 0 0;font-family:inherit">' + esc(text) + "</pre>";
  });

  /* ---------- Hide mobile CTA when the quote form is on screen ---------- */
  var mobileCta = $(".mobile-cta");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { mobileCta.classList.toggle("hide", en.isIntersecting); });
    }, { threshold: 0.05 }).observe($("#quote"));
  }
})();
