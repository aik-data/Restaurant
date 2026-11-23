import { useEffect, useRef, useState } from "react";
import { LayoutGroup, MotionConfig, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { MenuItem as Item, MenuSection as Section } from "@/lib/data";

export type Photo = { src: string; srcset: string };

/**
 * The dinner menu: shadcn Tabs for the sections, a gold ink that slides to the
 * chosen tab, and (with a mouse) the dish photo floats next to the cursor.
 * Every section is in the page HTML, so search engines see the whole menu.
 */
export default function MenuBoard({ sections, photos }: { sections: Section[]; photos: Record<string, Photo> }) {
  const [tab, setTab] = useState(sections[0]?.id ?? "");
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the chosen tab in view on phones, where the tab row scrolls sideways
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-value="${tab}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [tab]);

  return (
    <MotionConfig reducedMotion="user">
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div ref={listRef} className="mx-auto mb-12 w-full max-w-[980px] overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LayoutGroup id="menu-tabs">
            <TabsList variant="line" aria-label="Menu sections" className="h-auto! w-max min-w-full justify-start gap-x-9 rounded-none p-0 min-[901px]:justify-center">
              {sections.map((s) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  data-value={s.id}
                  className="h-auto flex-none rounded-none border-0 px-0 pt-1.5 pb-4 text-base font-medium tracking-[0.02em] text-ink-soft after:hidden hover:text-ink data-[state=active]:text-ink"
                >
                  {s.title}
                  {tab === s.id && (
                    <motion.span
                      layoutId="ink"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-ink"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </LayoutGroup>
        </div>

        {sections.map((s) => (
          <TabsContent key={s.id} value={s.id} forceMount className="mx-auto w-full max-w-[1080px] data-[state=inactive]:hidden">
            <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-4">
              <h3 className="display-3 m-0">{s.title}</h3>
              <p className="m-0 text-[0.92rem] text-ink-soft">{s.subtitle}</p>
            </div>
            <ul className="m-0 list-none columns-1 gap-x-[clamp(2.5rem,6vw,5rem)] p-0 min-[901px]:columns-2">
              {s.items.map((it, i) => (
                <MenuItem key={it.name} item={it} index={i} photo={photos[it.name]} />
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
      <PhotoPreview photos={photos} />
    </MotionConfig>
  );
}

function MenuItem({ item, index, photo }: { item: Item; index: number; photo?: Photo }) {
  return (
    <li
      data-photo={photo ? item.name : undefined}
      className={cn(
        "group/item break-inside-avoid border-b border-border py-[1.15rem] transition-[padding] duration-500 ease-out-expo",
        "animate-in fill-mode-both duration-700 fade-in slide-in-from-bottom-3",
        photo && "pointer-fine:hover:pl-2.5"
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-[1.38rem] leading-tight">
          {item.name}
          {item.favorite && (
            <span className="ml-2.5 inline-block align-[0.25em] font-sans text-[0.62rem] font-semibold tracking-[0.16em] text-gold-ink uppercase">House favorite</span>
          )}
          {photo && (
            <span className="ml-2 hidden align-[0.25em] font-sans text-[0.62rem] tracking-[0.16em] text-gold-ink uppercase opacity-0 transition-opacity duration-300 group-hover/item:opacity-100 pointer-fine:inline">
              ◦ photo
            </span>
          )}
        </span>
        <span className="min-w-4 flex-1 -translate-y-[0.3em] border-b border-dotted border-ink/35" aria-hidden="true" />
        {item.price != null ? (
          <span className="font-medium whitespace-nowrap tabular-nums">{money(item.price)}</span>
        ) : (
          <span className="text-faint" title="Price to be confirmed">
            —
          </span>
        )}
      </div>
      {item.desc && <p className="mt-1.5 mb-0 max-w-[42ch] text-[0.95rem] text-ink-soft">{item.desc}</p>}
    </li>
  );
}

/** The dish photo that follows the cursor over menu items that have one. */
function PhotoPreview({ photos }: { photos: Record<string, Photo> }) {
  const [enabled, setEnabled] = useState(false);
  const [on, setOn] = useState(false);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState("");
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const x = useSpring(tx, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(ty, { stiffness: 260, damping: 28, mass: 0.6 });
  const rotate = useTransform(() => Math.max(-8, Math.min(8, (tx.get() - x.get()) * 0.06)));

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;
    setEnabled(true);
    let current = "";
    const move = (e: PointerEvent) => {
      const w = window.innerWidth, h = window.innerHeight;
      tx.set(e.clientX > w - 340 ? e.clientX - 300 : e.clientX + 40);
      ty.set(Math.min(h - 340, Math.max(10, e.clientY - 160)));
      const item = (e.target as Element | null)?.closest?.<HTMLElement>("[data-photo]");
      const next = item?.dataset.photo ?? "";
      if (next !== current) {
        if (!current && next) {
          // jump to the cursor before showing, so it doesn't fly in from afar
          x.jump(tx.get());
          y.jump(ty.get());
        }
        current = next;
        setOn(!!next);
        if (next) setName(next);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [tx, ty, x, y]);

  if (!enabled) return null;
  const photo = photos[name];
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, rotate }}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-30 aspect-[4/5] w-[260px] overflow-hidden rounded-[4px] shadow-[0_30px_60px_-20px_rgb(28_22_18/0.55)]",
        "transition-[opacity,clip-path] duration-[350ms,600ms] ease-in-out-quart",
        on ? "opacity-100 [clip-path:inset(0_0_0_0)]" : "opacity-0 [clip-path:inset(50%_0_50%_0)]"
      )}
    >
      {photo && (
        <img
          key={name}
          src={photo.src}
          srcSet={photo.srcset}
          sizes="260px"
          alt=""
          onLoad={() => setLoaded(name)}
          className={cn("size-full object-cover transition-[opacity,scale] duration-700 ease-out-expo", loaded === name ? "scale-100 opacity-100" : "scale-[1.08] opacity-0")}
        />
      )}
    </motion.div>
  );
}
