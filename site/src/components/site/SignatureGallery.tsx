import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import SplitWords from "./SplitWords";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";

export type Dish = { name: string; desc: string; price: number | null; src: string; srcset: string };

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Signature dishes. On wide screens the section pins and the row of dishes
 * slides sideways as you scroll down; on phones it's a swipeable row.
 */
export default function SignatureGallery({ dishes, menuHref }: { dishes: Dish[]; menuHref: string }) {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [shift, setShift] = useState(0);
  const shiftMV = useMotionValue(0);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 901px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const pin = wide.matches && !calm.matches;
      setPinned(pin);
      const s = track.current && viewport.current ? Math.max(0, track.current.scrollWidth - viewport.current.clientWidth) : 0;
      setShift(s);
      shiftMV.set(pin ? s : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    if (viewport.current) ro.observe(viewport.current);
    wide.addEventListener("change", measure);
    calm.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", measure);
      calm.removeEventListener("change", measure);
    };
  }, [shiftMV]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(() => -scrollYProgress.get() * shiftMV.get());

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={section}
        id="signature"
        aria-labelledby="sigTitle"
        className="surface-char relative"
        style={pinned ? { height: `calc(100vh + ${shift}px)` } : undefined}
      >
        <div
          className={cn(
            pinned
              ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-[calc(var(--header-h)+12px)] pb-7"
              : "pt-[clamp(90px,10vw,140px)] pb-[clamp(60px,7vw,90px)]"
          )}
        >
          <div className="container-site mb-[clamp(2rem,4vw,3rem)] flex items-end justify-between gap-8 max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-4">
            <div>
              <p className="eyebrow mb-5">Signature dishes</p>
              <SplitWords id="sigTitle" parts={["What our regulars ", { em: "come back for" }]} className="display-2 m-0" />
            </div>
            <a href={menuHref} className="link-wipe font-medium text-cream">
              Full menu <span aria-hidden="true">→</span>
            </a>
          </div>

          <div
            ref={viewport}
            className={cn(pinned ? "overflow-hidden" : "snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}
          >
            <motion.div
              ref={track}
              style={{ x, paddingInline: "max(24px, calc((100vw - 1280px) / 2))" }}
              className="flex w-max gap-[clamp(18px,2.2vw,32px)] max-[560px]:px-[18px]!"
            >
              {dishes.map((d, i) => (
                <motion.article
                  key={d.name}
                  className={cn("group snap-start", pinned ? "w-[clamp(240px,23vw,350px)]" : "w-[min(78vw,400px)] min-[901px]:w-[clamp(270px,27vw,400px)]")}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 1.1, ease: EASE, delay: (i % 3) * 0.08 }}
                >
                  <figure className="m-0 mb-5 aspect-[4/5] overflow-hidden rounded-[4px] bg-char-2">
                    <img
                      src={d.src}
                      srcSet={d.srcset}
                      sizes="(max-width: 900px) 78vw, 27vw"
                      alt={d.name}
                      loading="lazy"
                      decoding="async"
                      className="size-full scale-[1.08] object-cover saturate-[.92] transition-[scale,filter] duration-[1400ms] ease-out-expo group-hover:scale-100 group-hover:saturate-[1.05]"
                    />
                  </figure>
                  <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1">
                    <span className="text-[0.78rem] tracking-[0.14em] text-gold">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="m-0 text-[1.75rem]">{d.name}</h3>
                    {d.price != null ? <span className="text-base text-gold-2">{money(d.price)}</span> : <span />}
                    {d.desc && (
                      <p className={cn("col-[2/-1] mt-1 mb-0 text-[0.94rem] leading-[1.55] text-muted-foreground", pinned && "line-clamp-2")}>{d.desc}</p>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>

          {pinned && (
            <div className="container-site">
              <div className="mt-[clamp(1.8rem,3vw,2.6rem)] h-px bg-border">
                <motion.span className="block h-full origin-left bg-gold" style={{ scaleX: scrollYProgress }} />
              </div>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}
