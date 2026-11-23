/* Perfetto Italian Restaurant — catering order page */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, $$ = PF.$$, money = PF.money, esc = PF.esc;
  var EST = window.PerfettoEstimate;
  var choiceTitle = EST.choiceTitle;

  /*
   * Orders are sent to the email backend (info.cateringEndpoint in
   * menu-data.js), which emails the restaurant and the customer through
   * Resend. Until that's set, or when the page is opened straight from a
   * file, the form shows a preview of the request instead of sending.
   */
  var ORDER_ENDPOINT = D.info.cateringEndpoint || "";
  var CAN_SEND = !!ORDER_ENDPOINT && (window.location.protocol === "http:" || window.location.protocol === "https:");

  var form = $("#quoteForm");

  /* ---------- Package choices ---------- */
  $("#pkgChoices").innerHTML =
    '<label class="pkg-choice"><input type="radio" name="package" value="" checked><span class="card"><strong>No package</strong><span>Trays and extras only</span></span></label>' +
    D.packages.map(function (p) {
      return '<label class="pkg-choice"><input type="radio" name="package" value="' + p.id + '"><span class="card"><strong>' +
        esc(p.name) + "</strong><span>" + money(p.perPerson) + "/person · min " + p.min + "</span></span></label>";
    }).join("");

  /* ---------- Package dish picker: tap dishes from the menu for each slot ---------- */
  var builderEl = $("#pkgBuilder");
  var builderFor = null;

  function selectedPackage() {
    var id = (form.querySelector('input[name="package"]:checked') || {}).value;
    return D.packages.filter(function (p) { return p.id === id; })[0] || null;
  }

  function pickGroupHtml(c) {
    var type = c.pick > 1 ? "checkbox" : "radio";
    return '<div class="pick-group" data-group="' + c.id + '" data-pick-max="' + c.pick + '">' +
      '<div class="pick-head"><span class="pick-title">' + esc(choiceTitle(c)) + '</span><span class="pick-count" aria-live="polite"></span></div>' +
      '<div class="chips" role="group" aria-label="' + esc(choiceTitle(c)) + '">' +
      c.options.map(function (o) {
        return '<label class="chip"><input type="' + type + '" name="pick-' + c.id + '" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>";
      }).join("") + "</div></div>";
  }

  function renderBuilder(pkg) {
    builderFor = pkg ? pkg.id : null;
    if (!pkg) { builderEl.innerHTML = ""; builderEl.hidden = true; return; }
    builderEl.hidden = false;
    var html = '<p class="builder-title">Build your ' + esc(pkg.name) + "</p>";

    if (pkg.boxed) {
      // How many of each box: must add up to the headcount
      html += '<div class="pick-group box-group" data-group="boxes">' +
        '<div class="pick-head"><span class="pick-title">How many of each box?</span><span class="pick-count" aria-live="polite"></span></div>' +
        '<p class="box-hint">Add up to one box per guest. Each box comes labeled.</p>' +
        pkg.boxOptions.map(function (o) {
          return '<div class="box-row"><span>' + esc(o) + '</span><label class="tp-qty">Boxes<input type="number" min="0" max="' + EST.MAX_GUESTS +
            '" value="0" inputmode="numeric" data-box="' + esc(o) + '" aria-label="' + esc(o) + ' boxes"></label></div>';
        }).join("") + "</div>";
    }

    html += (pkg.choices || []).map(pickGroupHtml).join("");

    html += (pkg.upgrades || []).map(function (u) {
      return '<div class="upgrade" data-upgrade="' + u.id + '">' +
        '<label class="check upgrade-toggle"><input type="checkbox" name="upgrade-' + u.id + '"> <span><strong>' + esc(u.title) +
        "</strong> +" + money(u.perPerson) + " per person</span></label>" + pickGroupHtml(u) + "</div>";
    }).join("");

    html += '<p class="builder-included"><strong>Also included:</strong> ' + pkg.included.map(esc).join(", ") + "</p>";
    builderEl.innerHTML = html;
    refreshPickGroups();
  }

  function billedGuests(pkg) {
    var n = parseInt(form.guests.value, 10);
    return Math.max(isNaN(n) || n < 0 ? 0 : n, pkg ? pkg.min : 0);
  }

  // Keep each group to its limit: once full, the other options are disabled
  function refreshPickGroups() {
    // Add-ons: show the dish picker only when the add-on is switched on
    $$(".upgrade", builderEl).forEach(function (u) {
      var on = $("input[name^='upgrade-']", u).checked;
      $(".pick-group", u).hidden = !on;
      u.classList.toggle("is-on", on);
    });
    // Boxed lunches: count boxes against the headcount
    var boxGroup = $(".box-group", builderEl);
    if (boxGroup) {
      var need = billedGuests(selectedPackage());
      var have = $$("[data-box]", boxGroup).reduce(function (n, i) { var v = parseInt(i.value, 10); return n + (v > 0 ? v : 0); }, 0);
      $(".pick-count", boxGroup).textContent = have + " of " + need + " boxes";
      boxGroup.classList.toggle("is-complete", need > 0 && have === need);
      if (have === need) boxGroup.classList.remove("incomplete");
    }
    $$(".pick-group:not(.box-group)", builderEl).forEach(function (g) {
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

  /* ---------- Trays & extras ---------- */
  var picker = D.trays.map(function (g) {
    return "<h4>" + esc(g.group) + "</h4>" + g.items.map(function (t) {
      return '<div class="tp-row"><span class="tp-name">' + esc(t.name) + "<small>Half " + money(t.half) + " · Full " + money(t.full) + "</small></span>" +
        '<label class="tp-qty">Half<input type="number" min="0" max="' + EST.MAX_QTY + '" value="0" inputmode="numeric" data-tray="' + t.id + '" data-size="half" aria-label="' + esc(t.name) + ' half pans"></label>' +
        '<label class="tp-qty">Full<input type="number" min="0" max="' + EST.MAX_QTY + '" value="0" inputmode="numeric" data-tray="' + t.id + '" data-size="full" aria-label="' + esc(t.name) + ' full pans"></label></div>';
    }).join("");
  }).join("");
  function extraRow(x) {
    return '<div class="tp-row"><span class="tp-name">' + esc(x.name) + "<small>" + money(x.price) + " per " + x.unit + (x.note ? " · " + esc(x.note) : "") + "</small></span>" +
      '<span></span><label class="tp-qty">Qty<input type="number" min="0" max="' + EST.MAX_QTY + '" value="0" inputmode="numeric" data-extra="' + x.id + '" aria-label="' + esc(x.name) + ' quantity"></label></div>';
  }
  picker += "<h4>Starters, Bread &amp; Desserts</h4>" + D.extras.map(extraRow).join("");
  picker += "<h4>Drinks</h4>" + (D.drinks || []).map(extraRow).join("");
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

  /* ---------- Read the form into an order ---------- */
  function collectOrder() {
    var pkg = selectedPackage();
    var picks = {};
    var upgrades = {};
    var boxes = {};
    if (pkg) {
      (pkg.choices || []).concat(pkg.upgrades || []).forEach(function (c) {
        picks[c.id] = $$('input[name="pick-' + c.id + '"]:checked', builderEl).map(function (i) { return i.value; });
      });
      (pkg.upgrades || []).forEach(function (u) {
        var box = form.querySelector('input[name="upgrade-' + u.id + '"]');
        upgrades[u.id] = !!(box && box.checked);
      });
      $$("[data-box]", builderEl).forEach(function (i) {
        var n = parseInt(i.value, 10);
        if (n > 0) boxes[i.dataset.box] = n;
      });
    }
    return {
      eventType: form.eventType.value,
      date: form.date.value,
      time: form.time.value,
      guests: form.guests.value,
      packageId: pkg ? pkg.id : "",
      picks: picks,
      upgrades: upgrades,
      boxes: boxes,
      trays: $$("[data-tray]", form).map(function (i) { return { id: i.dataset.tray, size: i.dataset.size, qty: i.value }; })
        .filter(function (t) { return parseInt(t.qty, 10) > 0; }),
      extras: $$("[data-extra]", form).map(function (i) { return { id: i.dataset.extra, qty: i.value }; })
        .filter(function (x) { return parseInt(x.qty, 10) > 0; }),
      fulfillment: form.querySelector('input[name="fulfillment"]:checked').value,
      address: form.address.value,
      chafers: form.chafers.checked,
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      notes: form.notes.value,
      website: form.website ? form.website.value : "", // spam trap, real people leave it empty
    };
  }

  /* ---------- Live estimate ---------- */
  function update() {
    var pkg = selectedPackage();
    if ((pkg ? pkg.id : null) !== builderFor) renderBuilder(pkg);
    refreshPickGroups();
    var r = EST.estimate(collectOrder(), D);
    $(".delivery-addr", form).hidden = !r.delivery;
    $("#summaryLines").innerHTML = r.hasFood
      ? r.lines.map(function (l) {
          if (l.sub) return '<li class="sub"><span>' + esc(l.label) + "</span></li>";
          return "<li><span>" + esc(l.label) + "</span><span>" + money(l.amount) + "</span></li>";
        }).join("")
      : '<li class="muted">Choose a package or trays to see an estimate.</li>';
    $("#summaryTotal").textContent = money(r.total);
    $("#summaryPP").textContent = r.hasFood && r.guests > 0 ? "About " + money(r.perGuest) + " per guest for " + r.guests + " guests" : "";
    var cg = $("#checkGuests");
    if (cg) cg.textContent = r.guests || "—";
    return r;
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  // Plain-text preview, used when the page isn't running on a server
  function previewText(order, r) {
    var out = [
      "CATERING REQUEST",
      "Event: " + order.eventType,
      "Date: " + order.date + (order.time ? " at " + order.time : ""),
      "Guests: " + r.guests,
      "Fulfillment: " + (r.delivery ? "Delivery to " + order.address : "Pickup"),
      "",
      "Order:",
    ];
    r.lines.forEach(function (l) { out.push(l.sub ? "      · " + l.label : "  - " + l.label + ": " + money(l.amount)); });
    out.push("Estimated total: " + money(r.total), "", "Name: " + order.name, "Phone: " + order.phone, "Email: " + order.email);
    if (order.notes) out.push("Notes: " + order.notes);
    return out.join("\n");
  }

  /* ---------- Submit ---------- */
  var msg = $("#formMsg");
  var btn = form.querySelector('button[type="submit"]');

  function showMsg(kind, html) {
    msg.className = "form-msg " + kind;
    msg.innerHTML = html;
  }

  var callUs = 'Please call us at <a href="' + D.info.phoneHref + '">' + esc(D.info.phone) + "</a>.";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
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
    if (firstBad) {
      showMsg("err", "Please fill in the highlighted fields.");
      firstBad.focus();
      return;
    }

    var order = collectOrder();
    var r = EST.estimate(order, D);
    if (!r.hasFood && !order.notes.trim()) {
      showMsg("err", "Choose a package or trays, or describe what you'd like in the notes.");
      return;
    }
    if (r.problems.length) {
      r.problems.forEach(function (p) { $('.pick-group[data-group="' + p.group + '"]', builderEl).classList.add("incomplete"); });
      showMsg("err", esc(r.problems[0].message));
      $('.pick-group[data-group="' + r.problems[0].group + '"]', builderEl).scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!CAN_SEND) {
      showMsg("ok", "<strong>Preview mode:</strong> email sending isn't connected yet, so nothing was sent. Once it is, the restaurant gets this by email and the customer gets a confirmation:" +
        '<pre style="white-space:pre-wrap;font-size:.78rem;margin:.6rem 0 0;font-family:inherit">' + esc(previewText(order, r)) + "</pre>");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending…";
    fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(order),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
    }).then(function (res) {
      if (res.ok) {
        var email = esc(order.email.trim());
        showMsg("ok", "<strong>Thank you! Your request was sent.</strong> " +
          (res.data.confirmationSent === false
            ? "We'll contact you within one business day to confirm, then email you a secure invoice."
            : "A confirmation is on its way to " + email + ". We'll contact you within one business day to confirm, then email you a secure invoice."));
        form.reset();
        update();
      } else if (res.status === 400 && res.data.error) {
        showMsg("err", esc(res.data.error));
      } else {
        showMsg("err", "Sorry, we couldn't send your request right now. " + callUs);
      }
    }).catch(function () {
      showMsg("err", "Sorry, we couldn't send your request right now. " + callUs);
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Send Quote Request";
    });
  });
})();
