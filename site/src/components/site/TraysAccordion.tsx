import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { money } from "@/lib/format";

import type { Extra as Item, Tray } from "@/lib/data";

const th = "pb-1.5 text-right text-[0.7rem] font-medium tracking-[0.16em] text-faint uppercase first:text-left";
const td = "border-t border-border py-2 align-top text-cream/90 [&+td]:pl-3 [&+td]:text-right [&+td]:whitespace-nowrap [&+td]:tabular-nums";

/** "Trays, extras & drinks": price tables that open and close (shadcn Accordion). */
export default function TraysAccordion({ trays, extras, drinks }: { trays: { group: string; items: Tray[] }[]; extras: Item[]; drinks: Item[] }) {
  const unit = (x: Item) => ({ dozen: "/dz", gallon: "/gal", "2-liter": " ea" })[x.unit] ?? "";
  return (
    <Accordion type="single" collapsible className="my-12 border-y border-border">
      <AccordionItem value="trays" className="border-b-0">
        <AccordionTrigger className="items-baseline gap-x-6 py-7 font-display text-[clamp(1.7rem,2.8vw,2.3rem)] font-light text-cream hover:no-underline [&>svg]:size-6 [&>svg]:self-center [&>svg]:text-cream">
          <span className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            Trays, extras &amp; drinks{" "}
            <small className="font-sans text-[0.8rem] tracking-[0.14em] text-faint uppercase">Half pan serves 8–10 · Full pan serves 18–22</small>
          </span>
        </AccordionTrigger>
        <AccordionContent className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-11 gap-y-10 pt-1.5 pb-10 text-[0.93rem]">
          {trays.map((g) => (
            <div key={g.group}>
              <h4 className="mb-3 text-[1.4rem] text-gold-2">{g.group}</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className={th}>Item</th>
                    <th scope="col" className={th}>Half</th>
                    <th scope="col" className={th}>Full</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((t) => (
                    <tr key={t.id}>
                      <td className={td}>{t.name}</td>
                      <td className={td}>{money(t.half)}</td>
                      <td className={td}>{money(t.full)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {[
            { title: "Starters, Bread & Desserts", rows: extras },
            { title: "Drinks", rows: drinks, note: "A gallon serves about 10." },
          ].map((block) => (
            <div key={block.title}>
              <h4 className="mb-3 text-[1.4rem] text-gold-2">{block.title}</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className={th}>Item</th>
                    <th scope="col" className={th}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((x) => (
                    <tr key={x.id}>
                      <td className={td}>{x.name}</td>
                      <td className={td}>
                        {money(x.price)}
                        {unit(x)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {block.note && <p className="mt-3 mb-0 text-[0.82rem] text-faint">{block.note}</p>}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
