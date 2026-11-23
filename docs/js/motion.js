/*
 * Perfetto — motion
 * ------------------------------------------------------------
 * All the movement on the site lives here. Every effect checks for
 * "reduce motion" and degrades to a calm, static page.
 *   - header that tucks away on scroll down and returns on scroll up
 *   - hero slideshow with a slow cinematic zoom
 *   - headlines that rise in word by word, content that eases in
 *   - photos that unveil and drift (parallax) as you scroll
 *   - signature dishes that slide sideways while you scroll down
 *   - menu items that show their photo next to the cursor
 *   - buttons that lean toward the cursor
 *   - soft fades between pages
 */
(function () {
  "use strict";
  var D = window.PERFETTO || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = false, finePointer = false;
  try {
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  } catch (e) {}
  var root = document.documentElement;
  var vh = innerHeight, vw = innerWidth;
  addEventListener("resize", function () { vh = innerHeight; vw = innerWidth; });

  /* ---------- Intro: remember that it played this visit ---------- */
  var loader = $("#loader");
  if (loader) {
    try { sessionStorage.setItem("pf-intro", "1"); } catch (e) {}
    loader.addEventListener("animationend", function (e) { if (e.animationName === "loaderOut") loader.remove(); });
    setTimeout(function () { if (loader.parentNode) loader.remove(); }, 4000);
  }

  /* ---------- Header: solid after the hero, hides on scroll down ---------- */
  var header = $(".site-header"), lastY = scrollY;
  function onHeader() {
    var y = scrollY;
    if (!header) return;
    header.classList.toggle("is-solid", y > 40 || !document.body.classList.contains("home"));
    document.body.classList.toggle("scrolled-past-hero", y > vh * 0.8);
    var menuOpen = $("#navLinks.open");
    if (!menuOpen && y > 500 && y > lastY + 4) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 500) header.classList.remove("is-hidden");
    lastY = y;
  }
  addEventListener("scroll", onHeader, { passive: true });
  onHeader();

  /* ---------- Hero slideshow ---------- */
  (function hero() {
    var box = $("#heroMedia"), prog = $("#slideProgress");
    var slides = (D.media && D.media.hero) || [];
    if (!box || slides.length < 2) return;
    var HOLD = 7000;
    var pans = [["-2%", "-1.5%"], ["2%", "-1%"], ["-1.5%", "1.5%"], ["1.5%", "1%"]];
    box.innerHTML = slides.map(function (s, i) {
      return '<figure class="slide' + (i === 0 ? " is-active" : "") + '" style="--kx:' + pans[i % 4][0] + ";--ky:" + pans[i % 4][1] + '">' +
        '<img src="' + s.src + '" alt="' + (s.alt || "").replace(/"/g, "&quot;") + '"' + (i ? ' loading="lazy"' : "") + "></figure>";
    }).join("");
    prog.innerHTML = slides.map(function () { return "<span><i></i></span>"; }).join("");
    var figs = $$(".slide", box), bars = $$("span", prog), cur = 0, timer;
    function go(n) {
      var prev = cur;
      cur = (n + figs.length) % figs.length;
      figs.forEach(function (f, i) {
        f.classList.toggle("is-active", i === cur);
        f.classList.toggle("is-leaving", i === prev && prev !== cur);
      });
      bars.forEach(function (b, i) {
        b.classList.toggle("is-done", i < cur);
        b.classList.remove("is-active"); void b.offsetWidth;
        if (i === cur) b.classList.add("is-active");
      });
      var nxt = figs[(cur + 1) % figs.length].querySelector("img");
      if (nxt && nxt.loading === "lazy") nxt.loading = "eager";
    }
    bars.forEach(function (b, i) { b.style.setProperty("--hold", HOLD + "ms"); b.addEventListener("click", function () { go(i); restart(); }); });
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(cur + 1); }, HOLD); }
    go(0); restart();
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearInterval(timer); else restart(); });
  })();

  /* ---------- Headlines: words rise in from behind a mask ---------- */
  $$("[data-words]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
            var o = document.createElement("span"); o.className = "w";
            var inner = document.createElement("span"); inner.className = "wi"; inner.style.transitionDelay = (i++ * 55) + "ms";
            inner.textContent = w; o.appendChild(inner); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealables = $$("[data-words], [data-reveal], .reveal-img, .dish, .pkg");
  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, k) {
        var el = e.target;
        if (el.hasAttribute("data-reveal") || el.classList.contains("pkg")) el.style.transitionDelay = Math.min(k * 70, 420) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Parallax photos ---------- */
  var parallax = reduce ? [] : $$("[data-parallax]").map(function (el) {
    return { el: el, img: el.querySelector("img"), k: el.classList.contains("story-media") || el.classList.contains("cat-media") ? 0.08 : 0.16 };
  });

  /* ---------- Marquee that speeds up with your scroll ---------- */
  var mq = $("#marquee"), mqX = 0, mqW = 0, velocity = 0, prevY = scrollY;
  if (mq) {
    mq.innerHTML = mq.innerHTML + mq.innerHTML + mq.innerHTML;
    var measure = function () { mqW = mq.scrollWidth / 3; };
    measure(); addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ---------- Signature dishes: scroll down, gallery slides sideways ---------- */
  var sig = $("#signature"), track = $("#sigTrack"), sigBar = $("#sigProgress"), sigShift = 0, pinned = false;
  function setupSig() {
    if (!sig || !track) return;
    pinned = !reduce && vw > 900;
    sig.classList.toggle("is-pinned", pinned);
    if (!pinned) { sig.style.height = ""; track.style.transform = ""; return; }
    sigShift = Math.max(0, track.scrollWidth - track.parentNode.clientWidth);
    sig.style.height = (vh + sigShift) + "px";
  }
  setupSig();
  addEventListener("resize", setupSig);
  addEventListener("load", setupSig);

  /* ---------- One animation loop for the scroll-linked effects ---------- */
  var lastT = performance.now();
  function frame(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    var y = scrollY;
    velocity += ((y - prevY) - velocity) * 0.2; prevY = y;

    parallax.forEach(function (p) {
      if (!p.img) return;
      var r = p.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var off = (r.top + r.height / 2 - vh / 2) * -p.k;
      p.img.style.setProperty("--py", off.toFixed(1) + "px");
    });

    if (mq && mqW && !reduce) {
      mqX -= (48 + Math.min(600, Math.abs(velocity) * 14)) * dt;
      if (-mqX >= mqW) mqX += mqW;
      mq.style.transform = "translate3d(" + mqX.toFixed(1) + "px,0,0)";
    }

    if (pinned) {
      var top = sig.offsetTop, len = sig.offsetHeight - vh;
      var p = Math.min(1, Math.max(0, (y - top) / (len || 1)));
      track.style.transform = "translate3d(" + (-p * sigShift).toFixed(1) + "px,0,0)";
      if (sigBar) sigBar.style.transform = "scaleX(" + p.toFixed(3) + ")";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Menu: the dish photo follows the cursor ---------- */
  (function menuPreview() {
    var box = $("#menuPreview");
    if (!box || !finePointer || reduce) return;
    var img = box.querySelector("img"), mx = 0, my = 0, px = 0, py = 0, on = false, current = "";
    $$(".menu-item[data-photo]").forEach(function (item) {
      item.classList.add("has-photo");
      item.addEventListener("mouseenter", function () {
        var src = item.getAttribute("data-photo");
        if (src !== current) {
          current = src; box.classList.add("is-swapping");
          var pre = new Image(); pre.onload = function () { img.src = src; box.classList.remove("is-swapping"); }; pre.src = src;
        }
        on = true; box.classList.add("is-on");
      });
      item.addEventListener("mouseleave", function () { on = false; box.classList.remove("is-on"); });
    });
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function follow() {
      px += (mx - px) * 0.14; py += (my - py) * 0.14;
      var tilt = Math.max(-8, Math.min(8, (mx - px) * 0.08));
      var bx = px > vw - 340 ? px - 300 : px + 40, by = Math.min(vh - 340, Math.max(10, py - 160));
      box.style.transform = "translate3d(" + bx.toFixed(1) + "px," + by.toFixed(1) + "px,0) rotate(" + tilt.toFixed(2) + "deg)";
      requestAnimationFrame(follow);
    })();
  })();

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.22).toFixed(1) + "px," + (dy * 0.32).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Soft fade between pages ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(tel:|mailto:|https?:)/.test(href)) return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(function () { location.href = href; }, 380);
  });
  addEventListener("pageshow", function () { document.body.classList.remove("is-leaving"); });
})();
