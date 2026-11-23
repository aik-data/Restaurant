import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { MotionConfig, motion } from "motion/react";
import Magnet from "@/components/Magnet";
import { buttonVariants } from "@/components/ui/button";
import OpenStatus, { type Schedule } from "./OpenStatus";
import { cn } from "@/lib/utils";

export type Slide = { src: string; srcset: string; width: number; height: number; alt: string };

const HOLD = 7000; // ms each photo stays up
// Where each photo starts its slow zoom from, so no two drift the same way
const PANS: [string, string][] = [["-2%", "-1.5%"], ["2%", "-1%"], ["-1.5%", "1.5%"], ["1.5%", "1%"]];

const shade: CSSProperties = {
  background:
    "linear-gradient(180deg, rgb(10 8 6 / .7) 0%, rgb(10 8 6 / .1) 26%, rgb(10 8 6 / .2) 52%, rgb(10 8 6 / .9) 100%), linear-gradient(90deg, rgb(10 8 6 / .55) 0%, rgb(10 8 6 / 0) 62%)",
};

const d = (s: string) => ({ "--d": s }) as CSSProperties;

/** Full-screen hero: a slow, cinematic slideshow of the food and the room. */
export default function Hero({ slides, schedule, phoneHref }: { slides: Slide[]; schedule: Schedule; phoneHref: string }) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [turn, setTurn] = useState(0); // restarts the progress bar
  const [epoch, setEpoch] = useState(0); // restarts autoplay after a click
  const [ready, setReady] = useState(false); // other photos load after the first
  const curRef = useRef(0);

  const go = useCallback(
    (n: number) => {
      const next = (n + slides.length) % slides.length;
      setPrev(curRef.current);
      curRef.current = next;
      setCur(next);
      setTurn((t) => t + 1);
    },
    [slides.length]
  );

  useEffect(() => {
    setReady(true);
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    const start = () => {
      window.clearInterval(id);
      if (!document.hidden) id = window.setInterval(() => go(curRef.current + 1), HOLD);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", start);
    };
  }, [go, slides.length, epoch]);

  return (
    <MotionConfig reducedMotion="user">
      <section id="hero" aria-label="Perfetto Italian Restaurant" className="relative h-svh min-h-[640px] overflow-hidden bg-night text-cream">
        <div className="absolute inset-0">
          {slides.map((s, i) => {
            const active = i === cur;
            const [kx, ky] = PANS[i % PANS.length];
            return (
              <figure
                key={s.src}
                className={cn(
                  "absolute inset-0 m-0 opacity-0 transition-opacity duration-[1800ms] ease-in-out-quart",
                  active && "z-[1] opacity-100",
                  i === prev && !active && "z-0"
                )}
              >
                {(i === 0 || ready) && (
                  <motion.img
                    src={s.src}
                    srcSet={s.srcset}
                    sizes="100vw"
                    width={s.width}
                    height={s.height}
                    alt={s.alt}
                    fetchPriority={i === 0 ? "high" : "low"}
                    decoding={i === 0 ? "sync" : "async"}
                    className="size-full object-cover"
                    initial={{ scale: 1.16, x: kx, y: ky }}
                    animate={active ? { scale: [1.16, 1.02], x: [kx, "0%"], y: [ky, "0%"] } : undefined}
                    transition={{ duration: 9, ease: "linear" }}
                  />
                )}
              </figure>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[2]" style={shade} />

        <div className="absolute inset-x-0 bottom-[140px] z-[3] max-[900px]:bottom-[120px]">
          <div className="container-site">
            <p className="eyebrow hero-rise mb-6 text-gold-2 max-[560px]:tracking-[0.16em]" style={d(".75s")}>
              Family owned · Downtown Tehachapi
            </p>
            <h1 className="display-1 mb-6">
              <span className="hero-line" style={d(".25s")}>
                <span>Homemade Italian</span>
              </span>
              <span className="hero-line" style={d(".4s")}>
                <span>
                  <em className="text-gold-2">in Downtown Tehachapi.</em>
                </span>
              </span>
            </h1>
            <p className="hero-rise max-w-[33rem] text-[1.15rem] text-cream/85" style={d(".75s")}>
              Fresh pasta, veal, seafood and the lasagna everyone talks about. Dinner Tuesday through Saturday.
            </p>
            <div className="hero-rise mt-8 flex flex-wrap gap-3.5" style={d(".9s")}>
              <Magnet padding={50} magnetStrength={4} maxOffset={14} wrapperClassName="max-[560px]:flex-auto" innerClassName="max-[560px]:[&>a]:w-full">
                <a className={buttonVariants({ variant: "gold" })} href={phoneHref}>
                  Reserve a table
                </a>
              </Magnet>
              <Magnet padding={50} magnetStrength={4} maxOffset={14} wrapperClassName="max-[560px]:flex-auto" innerClassName="max-[560px]:[&>a]:w-full">
                <a className={buttonVariants({ variant: "light" })} href="#menu">
                  View the menu
                </a>
              </Magnet>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[3] border-t border-border">
          <div className="container-site flex h-[72px] items-center justify-between gap-8 max-[560px]:h-[60px]">
            <OpenStatus schedule={schedule} className="text-muted-foreground" />
            <div className="hidden flex-[0_1_320px] gap-2.5 min-[901px]:flex">
              {slides.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  aria-label={`Show photo ${i + 1} of ${slides.length}`}
                  aria-current={i === cur ? "true" : undefined}
                  onClick={() => {
                    go(i);
                    setEpoch((e) => e + 1);
                  }}
                  className="relative h-6 flex-1 cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden bg-cream/20">
                    <span
                      key={i === cur ? `on-${turn}` : "off"}
                      className={cn("absolute inset-0 origin-left bg-cream", i === cur ? "animate-fill" : i < cur ? "" : "scale-x-0")}
                      style={{ "--hold": `${HOLD}ms` } as CSSProperties}
                    />
                  </span>
                </button>
              ))}
            </div>
            <a href="#story" className="hidden items-center gap-3 text-[0.76rem] tracking-[0.26em] text-muted-foreground uppercase no-underline sm:inline-flex">
              Scroll
              <span className="relative h-[34px] w-px overflow-hidden bg-cream/25" aria-hidden="true">
                <span className="absolute -top-full left-0 h-full w-px animate-drip bg-cream" />
              </span>
            </a>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
