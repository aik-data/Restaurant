/*
 * Page-wide motion for the static (Astro) parts of the site. React islands
 * handle their own. Every effect respects "reduce motion".
 *   - first-visit intro
 *   - headlines that rise word by word   <h2 data-words>
 *   - content that eases in              data-reveal
 *   - photos: curtain lifts, then drift  .reveal-img, data-parallax="0.08"
 *   - phone order button after the hero, prototype notice, footer year
 */
import { scroll } from "motion";

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Intro: remember that it played this visit ---------- */
const loader = document.getElementById("loader");
if (loader) {
  try { sessionStorage.setItem("pf-intro", "1"); } catch { /* private mode */ }
  // The password screen can hold the intro back, so time it from when it actually starts
  loader.addEventListener("animationstart", () => window.setTimeout(() => loader.remove(), 4000), { once: true });
  loader.addEventListener("animationend", (e) => { if (e.animationName === "loader-out") loader.remove(); });
}

/* ---------- Headlines: split into words that rise from a mask ---------- */
function splitWords(el: HTMLElement) {
  let i = 0;
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? "").split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(" "); return; }
          const outer = document.createElement("span");
          outer.className = "w";
          const inner = document.createElement("span");
          inner.className = "wi";
          inner.style.transitionDelay = `${i++ * 55}ms`;
          inner.textContent = w;
          outer.append(inner);
          frag.append(outer);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
    });
  };
  walk(el);
}
document.querySelectorAll<HTMLElement>("[data-words]").forEach(splitWords);

/* ---------- Reveal on scroll ---------- */
const revealables = document.querySelectorAll<HTMLElement>("[data-words], [data-reveal], .reveal-img");
if (reduce || !("IntersectionObserver" in window)) {
  revealables.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, k) => {
          const el = e.target as HTMLElement;
          if (el.hasAttribute("data-reveal")) {
            // things that arrive together come in one after another
            el.style.transitionDelay = `${Math.min(k * 70, 420)}ms`;
            window.setTimeout(() => (el.style.transitionDelay = ""), 1600);
          }
          el.classList.add("is-in");
          io.unobserve(el);
        });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" }
  );
  revealables.forEach((el) => io.observe(el));
}

/* ---------- Parallax: photos drift a little slower than the page ---------- */
if (!reduce) {
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const img = el.querySelector("img");
    if (!img) return;
    const k = parseFloat(el.dataset.parallax ?? "") || 0.16;
    let travel = 0;
    const measure = () => { travel = (window.innerHeight + el.offsetHeight) * k; };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    scroll((p: number) => img.style.setProperty("--py", `${(travel * (p - 0.5)).toFixed(1)}px`), {
      target: el,
      offset: ["start end", "end start"],
    });
  });
}

/* ---------- Past the hero: show the phone order button ---------- */
const hero = document.getElementById("hero");
if (hero) {
  let ticking = false;
  const update = () => { ticking = false; root.classList.toggle("past-hero", window.scrollY > window.innerHeight * 0.8); };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* ---------- Prototype notice ---------- */
const banner = document.getElementById("proto-banner");
if (banner) {
  try { if (localStorage.getItem("perfetto-proto-dismissed") === "1") banner.classList.add("is-dismissed"); } catch { /* ignore */ }
  banner.querySelector("button")?.addEventListener("click", () => {
    banner.classList.add("is-dismissed");
    try { localStorage.setItem("perfetto-proto-dismissed", "1"); } catch { /* ignore */ }
  });
}

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));
