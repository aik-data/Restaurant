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

  /* ---------- Tehachapi skyline: ridges, wind turbines and a passing train ----------
   * Drawn here once and placed wherever an element has data-skyline="hero" or "footer". */
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function skyline(variant) {
    var hero = variant === "hero";
    var c = hero
      ? { back: "#B5331E", front: "#952812", base: "#7F200D", tower: "#F6EFE3", train: "#5C160A", rail: "rgba(246,239,227,.35)" }
      : { back: "#2C221C", front: "#241B16", base: "#1B1411", tower: "#6F5E52", train: "#130E0B", rail: "rgba(246,239,227,.12)" };
    // x, y (base on the back ridge), scale, seconds per turn, starting angle
    var turbines = [[168, 138, 0.9, 7.2, 10], [395, 103, 1, 6.1, 70], [553, 108, 0.78, 8, 35], [810, 98, 1.06, 6.6, 95],
      [1067, 92, 0.84, 7.5, 20], [1179, 80, 1, 5.8, 55], [1381, 97, 0.74, 8.4, 80]];
    var blade = "M0 0 C3.2 -10 3 -32 .6 -48 C-.9 -32 -2.4 -10 0 0 Z";
    var mills = turbines.map(function (p) {
      var blades = [0, 120, 240].map(function (a) {
        return '<path d="' + blade + '" transform="rotate(' + a + ')"/>';
      }).join("");
      return '<g transform="translate(' + p[0] + " " + p[1] + ") scale(" + p[2] + ')" fill="' + c.tower + '">' +
        '<path d="M-2.4 0 L2.4 0 L1.1 -82 L-1.1 -82 Z"/><rect x="-3" y="-85.5" width="9" height="5" rx="2"/>' +
        '<g transform="translate(0 -83) rotate(' + p[4] + ')"><g>' +
        '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="' + p[3] + 's" repeatCount="indefinite"/>' +
        blades + '</g><circle r="2.8"/></g></g>';
    }).join("");
    var train = !hero ? "" :
      '<g fill="' + c.train + '"><animateTransform attributeName="transform" type="translate" from="-240 0" to="1680 0" dur="58s" repeatCount="indefinite"/>' +
      '<rect x="150" y="217" width="44" height="13" rx="2"/><rect x="180" y="209" width="14" height="10" rx="1.5"/><rect x="156" y="210" width="5" height="8"/>' +
      [0, 1, 2, 3].map(function (i) { return '<rect x="' + (12 + i * 34) + '" y="219" width="31" height="11" rx="1.5"/>'; }).join("") +
      [20, 36, 54, 70, 88, 104, 122, 138, 160, 186].map(function (x) { return '<circle cx="' + x + '" cy="231" r="2.3"/>'; }).join("") +
      "</g>";
    return '<svg class="skyline" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<path fill="' + c.back + '" d="M0 170 C120 120 220 140 320 110 C420 80 520 120 640 95 C760 70 860 115 980 100 C1100 85 1200 60 1300 85 C1360 98 1410 90 1440 95 L1440 260 L0 260 Z"/>' +
      mills +
      '<path fill="' + c.front + '" d="M0 215 C140 180 260 200 380 185 C520 168 640 205 780 190 C920 175 1040 200 1180 182 C1300 168 1380 190 1440 185 L1440 260 L0 260 Z"/>' +
      '<rect x="0" y="232" width="1440" height="28" fill="' + c.base + '"/><rect x="0" y="231" width="1440" height="1.5" fill="' + c.rail + '"/>' +
      train + "</svg>";
  }

  $$("[data-skyline]").forEach(function (el) {
    el.innerHTML = skyline(el.getAttribute("data-skyline"));
  });
  if (reduceMotion) {
    $$("svg").forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
  }

  // Shared helpers for home.js and order.js
  window.PF = { D: D, $: $, $$: $$, money: money, esc: esc, choiceTitle: choiceTitle };
})();
