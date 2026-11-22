/*
 * Perfetto catering estimate
 * ------------------------------------------------------------
 * One price calculator shared by the order page (live estimate)
 * and the server function that emails the order (so the totals
 * in the emails always match the menu, whatever the browser sent).
 *
 * order = {
 *   guests, packageId,
 *   picks:  { pasta: ["Pasta Perfetto"], entree: ["Chicken Marsala", ...] },
 *   trays:  [{ id: "t-lasagna-bol", size: "half" | "full", qty: 1 }],
 *   extras: [{ id: "x-bread", qty: 2 }],
 *   fulfillment: "pickup" | "delivery",
 *   chafers: true | false
 * }
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PerfettoEstimate = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var MAX_QTY = 50;
  var MAX_GUESTS = 1000;
  var HOT_TRAY_GROUPS = { "Pasta & Lasagna": true, "Entrées": true };

  function toInt(v, max) {
    var n = parseInt(v, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, max);
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // "Choose 1 pasta", "Choose 2 entrées"
  function choiceTitle(c) {
    return "Choose " + c.pick + " " + (c.pick > 1 ? c.plural : c.label);
  }

  function estimate(order, D) {
    order = order || {};
    var lines = [];
    var problems = [];
    var total = 0;
    var hotPans = 0;
    var guests = toInt(order.guests, MAX_GUESTS);

    /* Package + dish picks */
    var pkg = null;
    D.packages.forEach(function (p) { if (p.id === order.packageId) pkg = p; });
    var picks = [];
    if (pkg) {
      picks = pkg.choices.map(function (c) {
        var raw = (order.picks && order.picks[c.id]) || [];
        var seen = {};
        var values = [];
        (Array.isArray(raw) ? raw : [raw]).forEach(function (v) {
          // only dishes that are actually offered for this slot
          if (c.options.indexOf(v) !== -1 && !seen[v] && values.length < c.pick) { seen[v] = true; values.push(v); }
        });
        return { choice: c, values: values };
      });

      if (guests > 0) {
        var billed = Math.max(guests, pkg.min);
        var sub = billed * pkg.perPerson;
        lines.push({ label: pkg.name + " × " + billed + (billed > guests ? " (minimum)" : "") + " guests", amount: sub });
        total += sub;
        var hotDishes = pkg.choices.reduce(function (n, c) { return n + (c.hot ? c.pick : 0); }, 0) || 1;
        hotPans += Math.ceil(billed / 20) * hotDishes;
        picks.forEach(function (p) {
          lines.push({ label: capitalize(p.choice.label) + ": " + (p.values.length ? p.values.join(", ") : "not chosen yet"), sub: true });
        });
      }

      picks.forEach(function (p) {
        if (p.values.length !== p.choice.pick) {
          problems.push({ group: p.choice.id, message: "Please " + choiceTitle(p.choice).toLowerCase() + " for your " + pkg.name + " package." });
        }
      });
    }

    /* Trays */
    var trayIndex = {};
    D.trays.forEach(function (g) {
      g.items.forEach(function (t) { trayIndex[t.id] = { item: t, hot: !!HOT_TRAY_GROUPS[g.group] }; });
    });
    (order.trays || []).forEach(function (t) {
      var found = t && trayIndex[t.id];
      var n = toInt(t && t.qty, MAX_QTY);
      if (!found || !n || (t.size !== "half" && t.size !== "full")) return;
      var amount = n * found.item[t.size];
      lines.push({ label: found.item.name + " · " + n + " " + t.size + " pan" + (n > 1 ? "s" : ""), amount: amount });
      total += amount;
      if (found.hot) hotPans += n;
    });

    /* Extras sold by the dozen / pan */
    var extraIndex = {};
    D.extras.forEach(function (x) { extraIndex[x.id] = x; });
    (order.extras || []).forEach(function (e) {
      var x = e && extraIndex[e.id];
      var n = toInt(e && e.qty, MAX_QTY);
      if (!x || !n) return;
      var amount = n * x.price;
      lines.push({ label: x.name + " × " + n + (x.unit === "dozen" ? " dz" : ""), amount: amount });
      total += amount;
    });

    var hasFood = lines.some(function (l) { return !l.sub; });
    var delivery = order.fulfillment === "delivery";

    if (hasFood && order.chafers && hotPans > 0) {
      var c = hotPans * D.services.chafingPerPan;
      lines.push({ label: "Chafing dishes × " + hotPans, amount: c });
      total += c;
    }
    if (hasFood && delivery) {
      lines.push({ label: "Delivery", amount: D.services.deliveryFee });
      total += D.services.deliveryFee;
    }

    return {
      lines: lines,
      total: total,
      guests: guests,
      perGuest: guests > 0 ? total / guests : 0,
      pkg: pkg,
      picks: picks,
      delivery: delivery,
      hasFood: hasFood,
      problems: problems,
    };
  }

  return { estimate: estimate, choiceTitle: choiceTitle, MAX_QTY: MAX_QTY, MAX_GUESTS: MAX_GUESTS };
});
