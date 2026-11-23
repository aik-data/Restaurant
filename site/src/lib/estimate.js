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
  var upgrades = [];
  var boxes = [];

  // only dishes that are actually offered for a slot, no repeats, up to the limit
  function readPicks(c) {
    var raw = (order.picks && order.picks[c.id]) || [];
    var seen = {};
    var values = [];
    (Array.isArray(raw) ? raw : [raw]).forEach(function (v) {
      if (c.options.indexOf(v) !== -1 && !seen[v] && values.length < c.pick) { seen[v] = true; values.push(v); }
    });
    return { choice: c, values: values };
  }

  if (pkg) {
    var billed = Math.max(guests, pkg.min);
    picks = (pkg.choices || []).map(readPicks);
    upgrades = (pkg.upgrades || [])
      .filter(function (u) { return order.upgrades && order.upgrades[u.id] === true; })
      .map(readPicks);

    if (pkg.boxed) {
      var boxTotal = 0;
      (pkg.boxOptions || []).forEach(function (name) {
        var n = toInt(order.boxes && order.boxes[name], MAX_GUESTS);
        if (n) { boxes.push({ name: name, qty: n }); boxTotal += n; }
      });
      if (guests > 0 && boxTotal !== billed) {
        problems.push({ group: "boxes", message: "Please choose " + billed + " boxes for your " + pkg.name + " (you've chosen " + boxTotal + ")." });
      }
    }

    if (guests > 0) {
      var sub = billed * pkg.perPerson;
      lines.push({ label: pkg.name + " × " + billed + (billed > guests ? " (minimum)" : "") + " guests", amount: sub });
      total += sub;
      if (!pkg.boxed) {
        var hotDishes = (pkg.choices || []).reduce(function (n, c) { return n + (c.hot ? c.pick : 0); }, 0) || 1;
        hotPans += Math.ceil(billed / 20) * hotDishes;
      }
      picks.forEach(function (p) {
        lines.push({ label: capitalize(p.choice.label) + ": " + (p.values.length ? p.values.join(", ") : "not chosen yet"), sub: true });
      });
      if (pkg.boxed) {
        lines.push({ label: "Boxes: " + (boxes.length ? boxes.map(function (b) { return b.qty + " " + b.name; }).join(", ") : "not chosen yet"), sub: true });
      }
      upgrades.forEach(function (u) {
        var c = u.choice;
        var amount = billed * c.perPerson;
        lines.push({ label: c.title + " × " + billed + " guests", amount: amount });
        lines.push({ label: capitalize(c.label) + ": " + (u.values.length ? u.values.join(", ") : "not chosen yet"), sub: true });
        total += amount;
        if (c.hot) hotPans += Math.ceil(billed / 20) * c.pick;
      });
    }

    picks.concat(upgrades).forEach(function (p) {
      if (p.values.length !== p.choice.pick) {
        problems.push({ group: p.choice.id, message: "Please " + choiceTitle(p.choice).toLowerCase() + " for your " + pkg.name + " package." });
      }
    });
    upgrades.forEach(function (u) {
      var other = u.choice.notSameAs && picks.filter(function (p) { return p.choice.id === u.choice.notSameAs; })[0];
      if (other && u.values.some(function (v) { return other.values.indexOf(v) !== -1; })) {
        problems.push({ group: u.choice.id, message: "Please choose a " + u.choice.label + " that's different from your first." });
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

  /* Extras (by the dozen / pan) and drinks */
  var extraIndex = {};
  D.extras.concat(D.drinks || []).forEach(function (x) { extraIndex[x.id] = x; });
  var UNIT_SHORT = { dozen: " dz", gallon: " gal" };
  (order.extras || []).forEach(function (e) {
    var x = e && extraIndex[e.id];
    var n = toInt(e && e.qty, MAX_QTY);
    if (!x || !n) return;
    var amount = Math.round(n * x.price * 100) / 100;
    lines.push({ label: x.name + " × " + n + (UNIT_SHORT[x.unit] || ""), amount: amount });
    total += amount;
  });
  total = Math.round(total * 100) / 100;

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
    upgrades: upgrades,
    boxes: boxes,
    delivery: delivery,
    hasFood: hasFood,
    problems: problems,
  };
}

export { estimate, choiceTitle, MAX_QTY, MAX_GUESTS };
