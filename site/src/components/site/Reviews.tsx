import { useEffect, useState } from "react";
import BlurText from "@/components/BlurText";
import { cn } from "@/lib/utils";

type Review = { quote: string; source: string };
const HOLD = 6500;

const quoteType = "font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.15] font-light tracking-[-0.015em] italic";

/**
 * Guest quotes, one at a time. Each quote resolves word by word out of a blur
 * (React Bits BlurText). Rotation pauses while you hover or focus it, and
 * stops once you pick a quote yourself.
 */
export default function Reviews({ reviews }: { reviews: Review[] }) {
  const [cur, setCur] = useState(0);
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (reviews.length < 2 || paused || stopped || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      setCur((c) => (c + 1) % reviews.length);
      setTurn((t) => t + 1);
    }, HOLD);
    return () => window.clearTimeout(id);
  }, [reviews.length, paused, stopped, turn]);

  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mx-auto grid max-w-[980px]">
        {reviews.map((r, i) => {
          const active = i === cur;
          return (
            <figure
              key={i}
              aria-hidden={!active}
              className={cn(
                "m-0 [grid-area:1/1] transition-[opacity,filter] duration-700 ease-out-expo",
                active ? "opacity-100" : "pointer-events-none opacity-0 blur-[6px]"
              )}
            >
              <blockquote className="m-0 mb-6">
                {active ? (
                  <BlurText
                    key={turn}
                    text={`“${r.quote}”`}
                    animateBy="words"
                    direction="bottom"
                    delay={60}
                    stepDuration={0.45}
                    distance={18}
                    blur={8}
                    className={cn(quoteType, "m-0 justify-center")}
                  />
                ) : (
                  <p className={cn(quoteType, "m-0")}>“{r.quote}”</p>
                )}
              </blockquote>
              <figcaption className="text-[0.8rem] tracking-[0.26em] text-gold uppercase">{r.source}</figcaption>
            </figure>
          );
        })}
      </div>
      {reviews.length > 1 && (
        <div className="mt-10 flex justify-center gap-3">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show review ${i + 1} of ${reviews.length}`}
              aria-current={i === cur ? "true" : undefined}
              onClick={() => {
                setCur(i);
                setTurn((t) => t + 1);
                setStopped(true);
              }}
              className="relative h-6 w-11 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden bg-cream/25">
                <span
                  key={i === cur ? `on-${turn}` : "off"}
                  className={cn(
                    "absolute inset-0 origin-left bg-cream",
                    i === cur ? (stopped || paused ? "" : "animate-fill") : "scale-x-0"
                  )}
                  style={{ ["--hold" as string]: `${HOLD}ms` }}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
