import { Fragment } from "react";
import ScrollVelocity from "@/components/ScrollVelocity";

/**
 * A band of dish names that drifts sideways, speeds up while you scroll and
 * turns around when you scroll back up (React Bits ScrollVelocity).
 */
export default function DishBand({ items }: { items: string[] }) {
  const row = (
    <span className="inline-flex items-center gap-[2.4rem] pr-[2.4rem]">
      {items.map((t, i) => (
        <Fragment key={t}>
          <span className={i % 2 ? "text-outline" : undefined}>{t}</span>
          <span className="text-[1.4rem] text-gold not-italic">✦</span>
        </Fragment>
      ))}
    </span>
  );
  return (
    <div aria-hidden="true" className="border-y border-border bg-night py-6">
      <ScrollVelocity
        texts={[row]}
        velocity={42}
        numCopies={3}
        damping={50}
        stiffness={400}
        skewWithVelocity={3}
        scrollerStyle={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(2.2rem, 4.6vw, 4.2rem)",
          lineHeight: 1.1,
          letterSpacing: "normal",
          filter: "none",
          color: "var(--cream)",
        }}
      />
    </div>
  );
}
