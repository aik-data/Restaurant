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
    "#gate{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:56px 16px 16px;" +
    "background:#C73A22;font-family:'Instrument Sans',system-ui,sans-serif;color:#1E1612}" +
    "#gate::before{content:'';position:absolute;top:0;left:0;right:0;height:30px;" +
    "background:repeating-linear-gradient(90deg,#F6EFE3 0 36px,#A32E18 36px 72px);" +
    "-webkit-mask:radial-gradient(circle at 18px 12px,#000 17.5px,transparent 18px) 0 0/36px 100% repeat-x,linear-gradient(#000 0 0) 0 0/100% 12px no-repeat;" +
    "mask:radial-gradient(circle at 18px 12px,#000 17.5px,transparent 18px) 0 0/36px 100% repeat-x,linear-gradient(#000 0 0) 0 0/100% 12px no-repeat}" +
    "#gate form{position:relative;width:min(390px,100%);background:#FBF8F1;border:2px solid #1E1612;border-radius:3px;padding:36px 30px 28px;text-align:center;box-shadow:10px 10px 0 #1E1612}" +
    "#gate form::before{content:'';position:absolute;inset:9px;border:1px solid #D7C8AF;pointer-events:none}" +
    "#gate .g-brand{font-family:'Yellowtail',cursive;font-size:3.6rem;color:#C73A22;line-height:1;transform:rotate(-5deg)}" +
    "#gate .g-sub{font-family:'Courier Prime',monospace;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:#5B4C42;margin:8px 0 22px}" +
    "#gate h1{font-family:'Gloock',Georgia,serif;font-weight:400;font-size:1.75rem;line-height:1.1;margin:0 0 8px}" +
    "#gate p{font-size:.95rem;color:#5B4C42;margin:0 0 18px}" +
    "#gate input{position:relative;width:100%;font:inherit;font-size:1rem;padding:.8em .9em;border:1.5px solid #9A897B;border-radius:3px;background:#fff;margin-bottom:14px}" +
    "#gate input:focus{outline:none;border-color:#1E1612;box-shadow:3px 3px 0 #C73A22}" +
    "#gate button{position:relative;width:100%;font:inherit;font-weight:600;padding:.85em;border:2px solid #1E1612;border-radius:3px;background:#C73A22;color:#F6EFE3;cursor:pointer;box-shadow:3px 3px 0 #1E1612;transition:transform .14s,box-shadow .14s}" +
    "#gate button:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 #1E1612}" +
    "#gate .g-err{color:#A32E18;font-size:.85rem;min-height:1.3em;margin:10px 0 0}" +
    "#gate .g-foot{font-family:'Courier Prime',monospace;font-size:.78rem;margin:16px 0 0}#gate .g-foot a{color:#C73A22}";
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
