import { Fragment, useRef, type ElementType } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

/** A headline part: plain text, or { em: "..." } for the italic accent. */
export type Part = string | { em: string };

/**
 * Words rise from behind a mask as the headline scrolls into view.
 * Same look as <h2 data-words> in Astro markup (see global.css).
 */
export default function SplitWords({
  parts,
  as: Tag = "h2",
  id,
  className,
  step = 55,
}: {
  parts: Part[];
  as?: ElementType;
  id?: string;
  className?: string;
  step?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  let n = 0;
  const words = (text: string) =>
    text.split(/(\s+)/).map((w, k) =>
      !w ? null : /^\s+$/.test(w) ? (
        " "
      ) : (
        <span className="w" key={k}>
          <span className="wi" style={{ transitionDelay: `${n++ * step}ms` }}>
            {w}
          </span>
        </span>
      )
    );

  return (
    <Tag ref={ref} id={id} className={cn("split-words", inView && "is-in", className)}>
      {parts.map((p, k) => (typeof p === "string" ? <Fragment key={k}>{words(p)}</Fragment> : <em key={k}>{words(p.em)}</em>))}
    </Tag>
  );
}
