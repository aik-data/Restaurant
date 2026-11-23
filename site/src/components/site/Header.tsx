import { useEffect, useRef, useState, type MouseEvent } from "react";
import { IconArrowRight, IconPhone, IconX } from "@tabler/icons-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import OpenStatus, { type Schedule } from "./OpenStatus";
import { asset, cn } from "@/lib/utils";

type Page = "home" | "order" | "events" | "notfound";

/**
 * Fixed header. On the home page it starts clear over the hero photo and turns
 * solid once you scroll; on every page it tucks away while you scroll down and
 * comes back when you scroll up. Phones get a full-height menu (shadcn Sheet).
 */
export default function Header({ page, schedule, phone, phoneHref }: { page: Page; schedule: Schedule; phone: string; phoneHref: string }) {
  const home = page === "home";
  const onHome = (hash: string) => (home ? hash : asset("") + hash);
  const links = [
    { label: "Menu", href: onHome("#menu") },
    { label: page === "order" ? "Catering info" : "Catering", href: onHome("#catering") },
    { label: "Private events", href: asset("events.html"), current: page === "events" },
    { label: "Visit", href: onHome("#visit") },
  ];
  const cta = page === "order" ? { label: `Call ${phone}`, href: phoneHref } : { label: "Order catering", href: asset("order.html") };

  const [solid, setSolid] = useState(!home);
  const [tucked, setTucked] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setSolid(!home || y > 40);
      if (y > 500 && y > lastY.current + 4) setTucked(true);
      else if (y < lastY.current - 4 || y < 500) setTucked(false);
      lastY.current = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [home]);

  // In the phone menu, close the sheet first, then jump to the section
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", href);
    }, 320);
  };

  return (
    <header
      id="top"
      onFocus={() => setTucked(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-transparent transition-[translate,background-color,border-color,backdrop-filter] duration-[600ms] ease-out-expo",
        solid && "border-border bg-night/80 backdrop-blur-lg backdrop-saturate-[1.2]",
        tucked && !open && "-translate-y-full"
      )}
      style={{ viewTransitionName: "site-header" }}
    >
      <nav aria-label="Main" className="container-site flex h-(--header-h) items-center justify-between gap-6">
        <a href={home ? "#top" : asset("")} className="group flex items-baseline gap-3 text-cream no-underline" aria-label="Perfetto Italian Restaurant, home">
          <span className="font-display text-[2rem] leading-none tracking-[-0.01em] italic">Perfetto</span>
          <span className="hidden text-[0.7rem] font-medium tracking-[0.26em] text-faint uppercase xl:inline">Italian Restaurant</span>
        </a>

        <ul className="m-0 hidden list-none items-center gap-9 p-0 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                aria-current={l.current ? "page" : undefined}
                className="relative text-[0.95rem] font-medium tracking-[0.02em] text-cream/85 no-underline transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-[550ms] after:ease-in-out-quart hover:text-cream hover:after:origin-left hover:after:scale-x-100 aria-[current=page]:text-cream aria-[current=page]:after:scale-x-100"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href={cta.href} className={buttonVariants({ variant: "gold", size: "sm" })}>
              {cta.label}
            </a>
          </li>
        </ul>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="-mr-2 grid size-11 place-items-center lg:hidden" aria-label="Open menu">
              <span className="flex w-[26px] flex-col gap-[7px]" aria-hidden="true">
                <span className="h-[1.5px] bg-cream" />
                <span className="h-[1.5px] bg-cream" />
                <span className="ml-auto h-[1.5px] w-2/3 bg-cream" />
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" showCloseButton={false} className="w-full gap-0 border-l-border bg-night p-0 text-cream sm:max-w-md">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Pages and sections of the Perfetto website</SheetDescription>
            <div className="flex h-(--header-h) items-center justify-between border-b border-border px-6">
              <span className="font-display text-[1.8rem] leading-none italic">Perfetto</span>
              <SheetClose className="-mr-2 grid size-11 place-items-center rounded-full text-cream/80 transition-colors hover:text-cream" aria-label="Close menu">
                <IconX size={24} stroke={1.25} />
              </SheetClose>
            </div>
            <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto px-6 pt-4 pb-8">
              <ol className="m-0 list-none p-0">
                {links.map((l, i) => (
                  <li
                    key={l.label}
                    className="animate-in fill-mode-both duration-700 ease-out-expo fade-in slide-in-from-right-6"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <a
                      href={l.href}
                      onClick={(e) => go(e, l.href)}
                      aria-current={l.current ? "page" : undefined}
                      className="flex items-baseline gap-4 border-b border-border py-4 font-display text-[2rem] leading-tight font-light text-cream no-underline aria-[current=page]:text-gold-2"
                    >
                      <span className="w-6 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-gold">{String(i + 1).padStart(2, "0")}</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ol>
              <div
                className="mt-8 flex animate-in flex-col gap-3 fill-mode-both duration-700 ease-out-expo fade-in slide-in-from-bottom-3"
                style={{ animationDelay: "420ms" }}
              >
                <a href={asset("order.html")} className={buttonVariants({ variant: "gold", className: "w-full" })}>
                  Order catering <IconArrowRight size={18} stroke={1.5} />
                </a>
                <a href={phoneHref} className={buttonVariants({ variant: "light", className: "w-full" })}>
                  <IconPhone size={18} stroke={1.5} /> {phone}
                </a>
              </div>
              <div className="mt-auto pt-10 text-[0.92rem] text-muted-foreground">
                <OpenStatus schedule={schedule} className="text-cream/80" />
                <p className="mt-3 mb-0">209 S Green St · Downtown Tehachapi</p>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
