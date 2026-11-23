/*
 * Shared pieces for the order and event forms (paper surface): numbered
 * sections, labeled fields, a quantity stepper, the dark summary card and
 * the status message.
 */
import { useId, useRef, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-12 rounded-md border-ink/20 bg-white px-3.5 text-base text-ink shadow-none placeholder:text-faint focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-gold/35 aria-invalid:border-tomato aria-invalid:bg-[#FFF4F1] aria-invalid:ring-0 md:text-base";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Local date two days from today, as YYYY-MM-DD (the earliest bookable day) */
export function twoDaysOut(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Required-field check, matching what the browser would enforce */
export function fieldInvalid(name: string, value: string) {
  const v = String(value ?? "").trim();
  if (!v) return true;
  if (name === "email") return !EMAIL.test(v);
  if (name === "guests") {
    const n = Number(v);
    return !Number.isInteger(n) || n < 1 || n > 1000;
  }
  if (name === "date") return v < twoDaysOut();
  return false;
}

export function Section({ n, title, optional, children }: { n: number; title: string; optional?: boolean; children: ReactNode }) {
  return (
    <fieldset className="m-0 mb-6 min-w-0 border-0 border-t border-border px-0 pt-6 pb-7">
      <legend className="float-left mb-5 flex w-full items-baseline gap-3.5 p-0 font-display text-[clamp(1.7rem,2.6vw,2.1rem)] leading-[1.1] font-light text-ink">
        <span className="font-sans text-[0.85rem] font-semibold text-gold-ink tabular-nums">{String(n).padStart(2, "0")}</span>
        {title}
        {optional && <span className="font-sans text-[0.74rem] font-normal tracking-[0.1em] text-faint uppercase">(optional)</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function Field({ id, label, invalid, optional, className, children }: { id: string; label: string; invalid?: boolean; optional?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={cn("text-[0.78rem] font-semibold tracking-[0.12em] text-ink-soft uppercase", invalid && "text-tomato")}>
        {label}
        {optional && <span className="ml-1.5 font-normal tracking-[0.1em] text-faint">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

/** − [ 2 ] +  quantity control */
export function Stepper({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const id = useId();
  const clamp = (v: number) => Math.max(0, Math.min(max, Number.isFinite(v) ? Math.floor(v) : 0));
  const btn =
    "grid size-9 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-paper-2 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className={cn("inline-flex items-center rounded-full border border-ink/20 bg-white p-0.5 transition-colors", value > 0 && "border-ink")}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= 0} aria-label={`Fewer: ${label}`} aria-controls={id}>
        <IconMinus size={15} stroke={1.75} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        onFocus={(e) => e.target.select()}
        className={cn(
          "w-9 [appearance:textfield] border-0 bg-transparent p-0 text-center text-[0.98rem] font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          value === 0 && "font-normal text-faint"
        )}
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label={`More: ${label}`} aria-controls={id}>
        <IconPlus size={15} stroke={1.75} />
      </button>
    </div>
  );
}

/** The dark card beside the form: estimate on the order page, next steps on the events page */
export function SummaryCard({ title, children, ref }: { title: string; children: ReactNode; ref?: Ref<HTMLElement> }) {
  return (
    <aside
      ref={ref}
      className="surface-night sticky top-[calc(var(--header-h)+24px)] scroll-mt-[calc(var(--header-h)+16px)] rounded-[10px] bg-char px-7 pt-8 pb-6 shadow-[0_40px_70px_-40px_rgb(15_12_10/0.8)] max-[1060px]:static"
    >
      <h3 className="mb-4 text-[1.8rem]">{title}</h3>
      {children}
    </aside>
  );
}

export function FormMessage({ msg }: { msg: { kind: "ok" | "err"; body: ReactNode } | null }) {
  // a new message (even with the same text) animates in again
  const seq = useRef<{ msg: unknown; n: number }>({ msg: null, n: 0 });
  if (seq.current.msg !== msg) seq.current = { msg, n: seq.current.n + 1 };
  return (
    <div role="status" className="text-[0.92rem]">
      <AnimatePresence mode="wait">
        {msg && (
          <motion.div
            key={seq.current.n}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "mt-4 rounded-md border px-4 py-3.5 [&_a]:text-cream",
              msg.kind === "ok" ? "border-open/35 bg-open/12 text-[#CFF0D9]" : "border-tomato/45 bg-tomato/14 text-[#FFD6CC]"
            )}
          >
            {msg.body}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function previewBlock(text: string) {
  return <pre className="mt-2.5 mb-0 font-mono text-[0.76rem] leading-relaxed whitespace-pre-wrap text-muted-foreground">{text}</pre>;
}
