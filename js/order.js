/* Perfetto Italian Restaurant — catering order page */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, $$ = PF.$$, money = PF.money, esc = PF.esc, choiceTitle = PF.choiceTitle;

  /*
   * Where quote requests go.
   * Create a free form at https://formspree.io, then paste its endpoint here,
   * e.g. "https://formspree.io/f/abcdwxyz". Until then the form shows the
   * request summary and asks the guest to call.
   */
  var FORM_ENDPOINT = "";

  /* ---------- Quote builder ---------- */
  var form = $("#quoteForm");

  $("#pkgChoices").innerHTML =
    '<label class="pkg-choice"><input type="radio" name="package" value="" checked><span class="card"><strong>No package</strong><span>Trays and extras only</span></span></label>' +
    D.packages.map(function (p) {
      return '<label class="pkg-choice"><input type="radio" name="package" value="' + p.id + '"><span class="card"><strong>' +
        esc(p.name) + "</strong><span>" + money(p.perPerson) + "/person · min " + p.min + "</span></span></label>";
    }).join("");

  /* Package dish picker: tap dishes from the menu for each slot in the package */
  var builderEl = $("#pkgBuilder");
  var builderFor = null;

  function selectedPackage() {
    var id = (form.querySelector('input[name="package"]:checked') || {}).value;
    return D.packages.filter(function (p) { return p.id === id; })[0] || null;
  }

  function renderBuilder(pkg) {
    builderFor = pkg ? pkg.id : null;
    if (!pkg) { builderEl.innerHTML = ""; builderEl.hidden = true; return; }
    builderEl.hidden = false;
    builderEl.innerHTML = '<p class="builder-title">Build your ' + esc(pkg.name) + "</p>" +
      pkg.choices.map(function (c) {
        var type = c.pick > 1 ? "checkbox" : "radio";
        return '<div class="pick-group" data-group="' + c.id + '" data-pick-max="' + c.pick + '">' +
          '<div class="pick-head"><span class="pick-title">' + esc(choiceTitle(c)) + '</span><span class="pick-count" aria-live="polite"></span></div>' +
          '<div class="chips" role="group" aria-label="' + esc(choiceTitle(c)) + '">' +
          c.options.map(function (o) {
            return '<label class="chip"><input type="' + type + '" name="pick-' + c.id + '" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>";
          }).join("") + "</div></div>";
      }).join("") +
      '<p class="builder-included"><strong>Also included:</strong> ' + pkg.included.map(esc).join(", ") + "</p>";
    refreshPickGroups();
  }

  // Keep each group to its limit: once full, the other options are disabled
  function refreshPickGroups() {
    $$(".pick-group", builderEl).forEach(function (g) {
      var max = parseInt(g.dataset.pickMax, 10);
      var inputs = $$("input", g);
      var chosen = inputs.filter(function (i) { return i.checked; }).length;
      inputs.forEach(function (i) {
        i.disabled = max > 1 && !i.checked && chosen >= max;
        i.parentNode.classList.toggle("is-disabled", i.disabled);
      });
      $(".pick-count", g).textContent = chosen + " of " + max + " chosen";
      g.classList.toggle("is-complete", chosen === max);
      if (chosen === max) g.classList.remove("incomplete");
    });
  }

  function getPicks(pkg) {
    if (!pkg) return [];
    return pkg.choices.map(function (c) {
      var vals = $$('input[name="pick-' + c.id + '"]:checked', builderEl).map(function (i) { return i.value; });
      return { choice: c, values: vals };
    });
  }

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

  // Preselect a package when arriving from a package card (order.html?package=dinner)
  try {
    var wanted = new URLSearchParams(window.location.search).get("package");
    var preset = wanted && form.querySelector('input[name="package"][value="' + wanted.replace(/[^a-z0-9-]/gi, "") + '"]');
    if (preset) preset.checked = true;
  } catch (e) {}

  var trayIndex = {};
  D.trays.forEach(function (g) { g.items.forEach(function (t) { trayIndex[t.id] = t; }); });
  var extraIndex = {};
  D.extras.forEach(function (x) { extraIndex[x.id] = x; });
  var hotGroups = { "Pasta & Lasagna": true, "Entrées": true };
  var hotTray = {};
  D.trays.forEach(function (g) { g.items.forEach(function (t) { hotTray[t.id] = !!hotGroups[g.group]; }); });
  function hotDishes(pkg) {
    return pkg.choices.reduce(function (n, c) { return n + (c.hot ? c.pick : 0); }, 0) || 1;
  }

  function qty(input) {
    var n = parseInt(input.value, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 1000);
  }

  function calc() {
    var lines = [];
    var total = 0;
    var hotPans = 0;
    var guests = qty(form.guests);
    var pkg = selectedPackage();
    var picks = getPicks(pkg);

    if (pkg && guests > 0) {
      var billed = Math.max(guests, pkg.min);
      var sub = billed * pkg.perPerson;
      lines.push([pkg.name + " × " + billed + (billed > guests ? " (minimum)" : "") + " guests", sub]);
      total += sub;
      hotPans += Math.ceil(billed / 20) * hotDishes(pkg);
      picks.forEach(function (p) {
        var name = p.choice.label.charAt(0).toUpperCase() + p.choice.label.slice(1);
        lines.push([name + ": " + (p.values.length ? p.values.join(", ") : "not chosen yet"), null, true]);
      });
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
    return { lines: lines, total: total, guests: guests, pkg: pkg, picks: picks, delivery: delivery, hasFood: hasFood };
  }

  function update() {
    var pkg = selectedPackage();
    if ((pkg ? pkg.id : null) !== builderFor) renderBuilder(pkg);
    refreshPickGroups();
    var r = calc();
    $(".delivery-addr", form).hidden = !r.delivery;
    $("#summaryLines").innerHTML = r.hasFood
      ? r.lines.map(function (l) {
          if (l[2]) return '<li class="sub"><span>' + esc(l[0]) + "</span></li>";
          return "<li><span>" + esc(l[0]) + "</span><span>" + money(l[1]) + "</span></li>";
        }).join("")
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
    r.lines.forEach(function (l) { out.push(l[2] ? "      · " + l[0] : "  - " + l[0] + ": " + money(l[1])); });
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
    var missing = r.picks.filter(function (p) { return p.values.length !== p.choice.pick; });
    if (missing.length) {
      missing.forEach(function (p) { $('.pick-group[data-group="' + p.choice.id + '"]', builderEl).classList.add("incomplete"); });
      var first = missing[0].choice;
      msg.className = "form-msg err";
      msg.textContent = "Please " + choiceTitle(first).toLowerCase() + " for your " + r.pkg.name + " package.";
      $('.pick-group[data-group="' + first.id + '"]', builderEl).scrollIntoView({ behavior: "smooth", block: "center" });
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
        msg.textContent = "Thank you! Your request was sent. We'll contact you within one business day to confirm, then email you a secure invoice for payment.";
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
})();
