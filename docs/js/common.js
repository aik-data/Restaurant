/* Perfetto Italian Restaurant — shared by every page */
(function () {
  "use strict";

  var D = window.PERFETTO;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) {
    var cents = Math.round(n * 100) % 100 !== 0;
    return "$" + (cents ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(n).toLocaleString("en-US"));
  };
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

  /* ---------- Online ordering links ---------- */
  $$("[data-order-link]").forEach(function (a) { a.href = D.info.orderOnline; });
  $$("[data-order-hours]").forEach(function (el) { el.textContent = D.info.orderHours; });

  // "Choose 1 pasta", "Choose 2 entrées"
  function choiceTitle(c) {
    return "Choose " + c.pick + " " + (c.pick > 1 ? c.plural : c.label);
  }

  // Shared helpers for home.js and order.js
  window.PF = { D: D, $: $, $$: $$, money: money, esc: esc, choiceTitle: choiceTitle };
})();
