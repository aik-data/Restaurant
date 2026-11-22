/*
 * Preview password screen
 * ------------------------------------------------------------
 * Keeps casual visitors out while the site is being finished.
 * This is a curtain, not a lock: the site files are public.
 *
 * To change the password: replace PASSWORD_SHA256 with the SHA-256
 * hash of the new password (lowercase hex).
 * To launch the site: delete the gate.js <script> line from
 * index.html and order.html, and the robots "noindex" meta tag.
 */
(function () {
  "use strict";

  var PASSWORD_SHA256 = "f65c3f649d4d9c631e8082c60805adca2c718da4a36e5daae3470f876d0ff967";
  var STORAGE_KEY = "perfetto-preview-ok";
  var root = document.documentElement;

  function unlocked() {
    try { return localStorage.getItem(STORAGE_KEY) === PASSWORD_SHA256; } catch (e) { return false; }
  }
  if (unlocked()) return;

  // Hide the page right away so nothing flashes before the password screen appears
  root.classList.add("gate-locked");
  var style = document.createElement("style");
  style.textContent =
    "html.gate-locked body > *:not(#gate){display:none !important}" +
    "#gate{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;" +
    "background:linear-gradient(160deg,#7a1f1f,#4f1414);font-family:'Work Sans',system-ui,sans-serif;color:#2b211c}" +
    "#gate form{width:min(380px,100%);background:#fcf9f3;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)}" +
    "#gate .g-brand{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:700;font-size:2.4rem;color:#7a1f1f;line-height:1}" +
    "#gate .g-sub{font-size:.62rem;letter-spacing:.28em;text-transform:uppercase;color:#5e514a;margin:4px 0 22px}" +
    "#gate h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:1.6rem;margin:0 0 6px}" +
    "#gate p{font-size:.92rem;color:#5e514a;margin:0 0 18px}" +
    "#gate input{width:100%;font:inherit;font-size:1rem;padding:.75em .9em;border:1px solid #d4c7b1;border-radius:10px;background:#fff;margin-bottom:12px}" +
    "#gate input:focus{outline:none;border-color:#b8402f;box-shadow:0 0 0 3px rgba(184,64,47,.15)}" +
    "#gate button{width:100%;font:inherit;font-weight:600;padding:.8em;border:0;border-radius:999px;background:#b8402f;color:#fff;cursor:pointer}" +
    "#gate button:hover{background:#7a1f1f}" +
    "#gate .g-err{color:#b8402f;font-size:.85rem;min-height:1.3em;margin:10px 0 0}" +
    "#gate .g-foot{font-size:.8rem;margin:18px 0 0}#gate .g-foot a{color:#b8402f}";
  document.head.appendChild(style);

  /* ---- SHA-256 (small pure-JS version, so it also works without HTTPS) ---- */
  function sha256(ascii) {
    function rrot(v, n) { return (v >>> n) | (v << (32 - n)); }
    var K = [], H = [], primes = 0, cand = 2;
    var isComposite = {};
    while (primes < 64) {
      if (!isComposite[cand]) {
        for (var i = 0; i < 313; i += cand) isComposite[i] = cand;
        if (primes < 8) H[primes] = (Math.pow(cand, 1 / 2) * 4294967296) | 0;
        K[primes++] = (Math.pow(cand, 1 / 3) * 4294967296) | 0;
      }
      cand++;
    }
    var bytes = unescape(encodeURIComponent(ascii)); // UTF-8
    var bitLen = bytes.length * 8;
    var words = [];
    bytes += "\x80";
    while (bytes.length % 64 - 56) bytes += "\x00";
    for (i = 0; i < bytes.length; i++) words[i >> 2] |= bytes.charCodeAt(i) << ((3 - i) % 4) * 8;
    words[words.length] = (bitLen / 4294967296) | 0;
    words[words.length] = bitLen;
    var hash = H.slice(0);
    for (var j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash.slice(0);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var t1 = hash[7] + (rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + K[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rrot(w15, 7) ^ rrot(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rrot(w2, 17) ^ rrot(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
        hash.length = 8;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    var hex = "";
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; hex += (b < 16 ? "0" : "") + b.toString(16); }
    return hex;
  }

  function showGate() {
    var gate = document.createElement("div");
    gate.id = "gate";
    gate.innerHTML =
      '<form autocomplete="off">' +
      '<div class="g-brand">Perfetto</div><div class="g-sub">Italian Restaurant</div>' +
      "<h1>Our new website is almost ready</h1>" +
      "<p>This preview is password protected.</p>" +
      '<label for="gatePw" style="position:absolute;left:-9999px">Password</label>' +
      '<input id="gatePw" type="password" placeholder="Password" autocomplete="current-password" required>' +
      '<button type="submit">Enter</button>' +
      '<p class="g-err" role="alert"></p>' +
      '<p class="g-foot">Catering or reservations? Call <a href="tel:+16618221711">(661) 822-1711</a></p>' +
      "</form>";
    document.body.insertBefore(gate, document.body.firstChild);
    var form = gate.querySelector("form");
    var input = gate.querySelector("input");
    var err = gate.querySelector(".g-err");
    input.focus();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sha256(input.value) === PASSWORD_SHA256) {
        try { localStorage.setItem(STORAGE_KEY, PASSWORD_SHA256); } catch (x) {}
        gate.remove();
        root.classList.remove("gate-locked");
      } else {
        err.textContent = "That password isn't right. Please try again.";
        input.select();
      }
    });
  }

  if (document.body) showGate();
  else document.addEventListener("DOMContentLoaded", showGate);

  // for tests
  window.__perfettoSha256 = sha256;
})();
