import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useInView } from "motion/react";
import { IconArrowRight, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { D, type Choice } from "@/lib/data";
import { estimate, MAX_GUESTS, MAX_QTY } from "@/lib/estimate.js";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Button } from "@/components/ui/button";
import { choiceTitle, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Field, FormMessage, Section, Stepper, SummaryCard, fieldInvalid, inputClass, previewBlock, twoDaysOut } from "./form-kit";


const EVENT_TYPES = ["Office lunch / meeting", "Wedding / rehearsal dinner", "Team dinner / banquet", "Church / community event", "Birthday / graduation", "Holiday party", "Other"];
const EASE = [0.16, 1, 0.3, 1] as const;

const blank = { eventType: "", date: "", time: "", guests: "20", name: "", phone: "", email: "", notes: "", address: "", website: "" };
type Fields = typeof blank;

/**
 * The catering order page: event details, a package with dishes picked from
 * the menu, trays and drinks, pickup or delivery, and contact info, with a
 * live estimate. Sends to the email Worker, or shows a preview until it's set up.
 */
export default function OrderBuilder({ endpoint }: { endpoint: string }) {
  const packages = D.packages;
  const [f, setF] = useState<Fields>(blank);
  const [packageId, setPackageId] = useState("");
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [upgrades, setUpgrades] = useState<Record<string, boolean>>({});
  const [boxes, setBoxes] = useState<Record<string, number>>({});
  const [trays, setTrays] = useState<Record<string, number>>({}); // "t-perfetto:half" -> 2
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [chafers, setChafers] = useState(false);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [incomplete, setIncomplete] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; body: ReactNode; cause?: "fields" | "picks" | "food" } | null>(null);
  const [sending, setSending] = useState(false);
  const [minDate, setMinDate] = useState<string>();
  const summaryRef = useRef<HTMLElement>(null);
  const summaryInView = useInView(summaryRef, { amount: 0.1 });

  const pkg = packages.find((p) => p.id === packageId) ?? null;
  const set = (k: keyof Fields) => (v: string) => {
    setF((s) => ({ ...s, [k]: v }));
    if (invalid.has(k)) setInvalid((s) => { const n = new Set(s); n.delete(k); return n; });
  };

  // Earliest date two days out, and a package picked from the home page (?package=dinner)
  useEffect(() => {
    setMinDate(twoDaysOut());
    const wanted = new URLSearchParams(window.location.search).get("package");
    if (wanted && packages.some((p) => p.id === wanted)) choosePackage(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choosePackage(id: string) {
    setPackageId(id);
    setPicks({});
    setUpgrades({});
    setBoxes({});
    setIncomplete(new Set());
  }

  const order = useMemo(
    () => ({
      ...f,
      packageId,
      picks,
      upgrades,
      boxes,
      trays: Object.entries(trays)
        .filter(([, q]) => q > 0)
        .map(([k, q]) => ({ id: k.split(":")[0], size: k.split(":")[1], qty: String(q) })),
      extras: Object.entries(extras)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ id, qty: String(q) })),
      fulfillment,
      chafers,
    }),
    [f, packageId, picks, upgrades, boxes, trays, extras, fulfillment, chafers]
  );
  const r = useMemo(() => estimate(order, D), [order]);
  const billed = pkg ? Math.max(r.guests, pkg.min) : 0;
  const boxCount = Object.values(boxes).reduce((n, v) => n + (v > 0 ? v : 0), 0);

  // Once a group is complete, drop its red "incomplete" mark
  useEffect(() => {
    if (!incomplete.size) return;
    const open = new Set(r.problems.map((p: { group: string }) => p.group));
    const next = new Set([...incomplete].filter((g) => open.has(g)));
    if (next.size !== incomplete.size) setIncomplete(next);
  }, [r, incomplete]);

  useEffect(() => {
    if (msg?.kind !== "err" || !msg.cause) return;
    const fixed =
      (msg.cause === "fields" && invalid.size === 0) ||
      (msg.cause === "picks" && r.problems.length === 0) ||
      (msg.cause === "food" && (r.hasFood || f.notes.trim() !== ""));
    if (fixed) setMsg(null);
  }, [msg, invalid, r, f.notes]);

  function togglePick(c: Choice, values: string[]) {
    setPicks((s) => ({ ...s, [c.id]: values.slice(0, c.pick) }));
  }

  function previewText() {
    const out = [
      "CATERING REQUEST",
      "Event: " + f.eventType,
      "Date: " + f.date + (f.time ? " at " + f.time : ""),
      "Guests: " + r.guests,
      "Fulfillment: " + (r.delivery ? "Delivery to " + f.address : "Pickup"),
      "",
      "Order:",
    ];
    r.lines.forEach((l: { label: string; amount?: number; sub?: boolean }) => out.push(l.sub ? "      · " + l.label : "  - " + l.label + ": " + money(l.amount ?? 0)));
    out.push("Estimated total: " + money(r.total), "", "Name: " + f.name, "Phone: " + f.phone, "Email: " + f.email);
    if (f.notes) out.push("Notes: " + f.notes);
    return out.join("\n");
  }

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    setMsg(null);
    const bad = new Set<string>();
    (["eventType", "date", "guests", "name", "phone", "email"] as const).forEach((k) => { if (fieldInvalid(k, f[k])) bad.add(k); });
    if (fulfillment === "delivery" && !f.address.trim()) bad.add("address");
    setInvalid(bad);
    if (bad.size) {
      setMsg({ kind: "err", body: "Please fill in the highlighted fields.", cause: "fields" });
      const first = ["eventType", "date", "guests", "address", "name", "phone", "email"].find((k) => bad.has(k));
      document.getElementById("f-" + first)?.focus();
      return;
    }
    if (!r.hasFood && !f.notes.trim()) {
      setMsg({ kind: "err", body: "Choose a package or trays, or describe what you'd like in the notes.", cause: "food" });
      return;
    }
    if (r.problems.length) {
      setIncomplete(new Set(r.problems.map((p: { group: string }) => p.group)));
      setMsg({ kind: "err", body: r.problems[0].message, cause: "picks" });
      document.querySelector(`[data-group="${r.problems[0].group}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const canSend = !!endpoint && /^https?:$/.test(window.location.protocol);
    if (!canSend) {
      setMsg({
        kind: "ok",
        body: (
          <>
            <strong>Preview mode:</strong> email sending isn't connected yet, so nothing was sent. Once it is, the restaurant gets this by email and the customer gets a
            confirmation:
            {previewBlock(previewText())}
          </>
        ),
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(order),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({
          kind: "ok",
          body: (
            <>
              <strong>Thank you! Your request was sent.</strong>{" "}
              {data.confirmationSent === false
                ? "We'll contact you within one business day to confirm, then email you a secure invoice."
                : `A confirmation is on its way to ${f.email.trim()}. We'll contact you within one business day to confirm, then email you a secure invoice.`}
            </>
          ),
        });
        setF(blank);
        choosePackage("");
        setTrays({});
        setExtras({});
        setFulfillment("pickup");
        setChafers(false);
      } else if (res.status === 400 && data.error) {
        setMsg({ kind: "err", body: data.error });
      } else throw new Error("send failed");
    } catch {
      setMsg({
        kind: "err",
        body: (
          <>
            Sorry, we couldn't send your request right now. Please call us at <a href={D.info.phoneHref}>{D.info.phone}</a>.
          </>
        ),
      });
    } finally {
      setSending(false);
    }
  }

  const cents = Math.round(r.total * 100) % 100 !== 0;

  return (
    <MotionConfig reducedMotion="user">
      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-[clamp(2.5rem,5vw,4.5rem)] max-[1060px]:grid-cols-1">
        <div>
          <Section n={1} title="Your event">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-[560px]:grid-cols-1">
              <Field id="f-eventType" label="Event type" invalid={invalid.has("eventType")}>
                <Select value={f.eventType} onValueChange={set("eventType")}>
                  <SelectTrigger id="f-eventType" aria-invalid={invalid.has("eventType") || undefined} className={cn(inputClass, "w-full")}>
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="surface-paper">
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="f-date" label="Event date" invalid={invalid.has("date")}>
                <Input id="f-date" type="date" min={minDate} value={f.date} onChange={(e) => set("date")(e.target.value)} aria-invalid={invalid.has("date") || undefined} className={inputClass} required />
              </Field>
              <Field id="f-guests" label="Number of guests" invalid={invalid.has("guests")}>
                <Input
                  id="f-guests"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_GUESTS}
                  value={f.guests}
                  onChange={(e) => set("guests")(e.target.value)}
                  aria-invalid={invalid.has("guests") || undefined}
                  className={inputClass}
                  required
                />
              </Field>
              <Field id="f-time" label="Serving time">
                <Input id="f-time" type="time" value={f.time} onChange={(e) => set("time")(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section n={2} title="Package" optional>
            <RadioGroup value={packageId || "none"} onValueChange={(v) => choosePackage(v === "none" ? "" : v)} aria-label="Package" className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {[{ id: "", name: "No package", note: "Trays and extras only" }, ...packages.map((p) => ({ id: p.id, name: p.name, note: `${money(p.perPerson)}/person · min ${p.min}` }))].map((o) => (
                <Label
                  key={o.id || "none"}
                  htmlFor={`pkg-${o.id || "none"}`}
                  className={cn(
                    "relative flex h-full cursor-pointer flex-col items-start gap-1 rounded-lg border border-ink/15 bg-white px-4 py-4 transition-[border-color,box-shadow,translate] duration-300 ease-out-expo hover:border-ink/45 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold",
                    packageId === o.id && "-translate-y-0.5 border-ink shadow-[0_14px_30px_-18px_rgb(28_22_18/0.5),inset_0_0_0_1px_var(--ink)]"
                  )}
                >
                  <RadioGroupItem id={`pkg-${o.id || "none"}`} value={o.id || "none"} className="sr-only" />
                  <span className="pr-6 font-display text-[1.3rem] leading-tight font-normal text-ink">{o.name}</span>
                  <span className="text-[0.84rem] leading-snug font-normal text-ink-soft">{o.note}</span>
                  {packageId === o.id && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-ink text-cream"
                      aria-hidden="true"
                    >
                      <IconCheck size={12} stroke={2.5} />
                    </motion.span>
                  )}
                </Label>
              ))}
            </RadioGroup>

            <AnimatePresence initial={false} mode="wait">
              {pkg && (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-7 border-t border-dashed border-ink/15 pt-6">
                    <p className="mb-5 font-display text-[1.7rem] font-light">Build your {pkg.name}</p>

                    {pkg.boxed && (
                      <PickGroup
                        group="boxes"
                        title="How many of each box?"
                        count={`${boxCount} of ${billed} boxes`}
                        complete={billed > 0 && boxCount === billed}
                        incomplete={incomplete.has("boxes")}
                      >
                        <p className="-mt-1 mb-2 text-[0.88rem] text-ink-soft">One box per guest. Each box comes labeled.</p>
                        {(pkg.boxOptions ?? []).map((o) => (
                          <div key={o} className="flex items-center justify-between gap-4 border-t border-border py-2 text-[0.97rem]">
                            <span>{o}</span>
                            <Stepper label={`${o} boxes`} value={boxes[o] ?? 0} max={MAX_GUESTS} onChange={(v) => setBoxes((s) => ({ ...s, [o]: v }))} />
                          </div>
                        ))}
                      </PickGroup>
                    )}

                    {(pkg.choices ?? []).map((c) => (
                      <Chips key={c.id} choice={c} values={picks[c.id] ?? []} onChange={(v) => togglePick(c, v)} incomplete={incomplete.has(c.id)} />
                    ))}

                    {(pkg.upgrades ?? []).map((u) => {
                      const on = !!upgrades[u.id];
                      const taken = u.notSameAs ? picks[u.notSameAs] ?? [] : [];
                      return (
                        <div key={u.id} className={cn("mb-5 rounded-lg border border-dashed border-ink/30 px-4 py-4 transition-colors", on && "border-solid border-ink bg-white")}>
                          <Label htmlFor={`up-${u.id}`} className="cursor-pointer gap-3 text-[0.98rem] leading-snug font-normal">
                            <Checkbox
                              id={`up-${u.id}`}
                              checked={on}
                              onCheckedChange={(v) => {
                                setUpgrades((s) => ({ ...s, [u.id]: v === true }));
                                if (v !== true) setPicks((s) => ({ ...s, [u.id]: [] }));
                              }}
                              className="size-[18px] border-ink/40 bg-white data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-cream"
                            />
                            <span>
                              <strong className="font-semibold">{u.title}</strong> +{money(u.perPerson ?? 0)} per person
                            </span>
                          </Label>
                          <AnimatePresence initial={false}>
                            {on && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                                <div className="pt-4">
                                  <Chips choice={u} values={picks[u.id] ?? []} onChange={(v) => togglePick(u, v)} incomplete={incomplete.has(u.id)} taken={taken} last />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    <p className="mt-1 mb-0 text-[0.9rem] text-ink-soft">
                      <strong className="font-semibold text-ink">Also included:</strong> {pkg.included.join(", ")}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          <Section n={3} title="Add trays & extras" optional>
            {D.trays.map((g) => (
              <div key={g.group} className="mt-7 first:mt-0">
                <h4 className="kicker mb-1">{g.group}</h4>
                {g.items.map((t) => (
                  <div key={t.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 border-b border-border py-2.5 max-[560px]:grid-cols-2">
                    <span className="max-[560px]:col-span-2">
                      {t.name}
                      <small className="mt-0.5 block text-[0.82rem] text-ink-soft">Half {money(t.half)} · Full {money(t.full)}</small>
                    </span>
                    {(["half", "full"] as const).map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <span className="w-7 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">{size}</span>
                        <Stepper label={`${t.name} ${size} pans`} value={trays[`${t.id}:${size}`] ?? 0} max={MAX_QTY} onChange={(v) => setTrays((s) => ({ ...s, [`${t.id}:${size}`]: v }))} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {[
              { title: "Starters, Bread & Desserts", items: D.extras },
              { title: "Drinks", items: D.drinks },
            ].map((block) => (
              <div key={block.title} className="mt-7">
                <h4 className="kicker mb-1">{block.title}</h4>
                {block.items.map((x) => (
                  <div key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-2.5">
                    <span>
                      {x.name}
                      <small className="mt-0.5 block text-[0.82rem] text-ink-soft">
                        {money(x.price)} per {x.unit}
                        {x.note ? ` · ${x.note}` : ""}
                      </small>
                    </span>
                    <Stepper label={`${x.name} quantity`} value={extras[x.id] ?? 0} max={MAX_QTY} onChange={(v) => setExtras((s) => ({ ...s, [x.id]: v }))} />
                  </div>
                ))}
              </div>
            ))}
          </Section>

          <Section n={4} title="Pickup or delivery">
            <RadioGroup value={fulfillment} onValueChange={(v) => setFulfillment(v as "pickup" | "delivery")} className="mb-4 flex flex-wrap gap-x-8 gap-y-3" aria-label="Pickup or delivery">
              {[
                { v: "pickup", label: "Pickup at the restaurant", note: "(free)" },
                { v: "delivery", label: "Delivery", note: `(${money(D.services.deliveryFee)} in the Tehachapi area)` },
              ].map((o) => (
                <Label key={o.v} htmlFor={`ful-${o.v}`} className="cursor-pointer gap-2.5 text-[0.98rem] font-medium">
                  <RadioGroupItem id={`ful-${o.v}`} value={o.v} className="size-[18px] border-ink/40 bg-white text-ink [&_svg]:fill-ink" />
                  <span>
                    {o.label} <span className="font-normal text-faint">{o.note}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <Label htmlFor="f-chafers" className="cursor-pointer gap-2.5 text-[0.98rem] font-medium">
              <Checkbox id="f-chafers" checked={chafers} onCheckedChange={(v) => setChafers(v === true)} className="size-[18px] border-ink/40 bg-white data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-cream" />
              <span>
                Add disposable chafing dishes <span className="font-normal text-faint">({money(D.services.chafingPerPan)} per hot pan)</span>
              </span>
            </Label>
            <AnimatePresence initial={false}>
              {fulfillment === "delivery" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                  <div className="pt-4">
                    <Field id="f-address" label="Delivery address" invalid={invalid.has("address")}>
                      <Input id="f-address" autoComplete="street-address" value={f.address} onChange={(e) => set("address")(e.target.value)} aria-invalid={invalid.has("address") || undefined} className={inputClass} />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          <Section n={5} title="Your contact info">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-[560px]:grid-cols-1">
              <Field id="f-name" label="Name" invalid={invalid.has("name")}>
                <Input id="f-name" autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={invalid.has("name") || undefined} className={inputClass} required />
              </Field>
              <Field id="f-phone" label="Phone" invalid={invalid.has("phone")}>
                <Input id="f-phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} aria-invalid={invalid.has("phone") || undefined} className={inputClass} required />
              </Field>
              <Field id="f-email" label="Email" invalid={invalid.has("email")} className="col-span-full">
                <Input id="f-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={invalid.has("email") || undefined} className={inputClass} required />
              </Field>
              <Field id="f-notes" label="Dietary needs or special requests" optional className="col-span-full">
                <Textarea
                  id="f-notes"
                  rows={3}
                  value={f.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="e.g. 4 vegetarians, one nut allergy, deliver to the 2nd floor conference room"
                  className={cn(inputClass, "min-h-24 py-3")}
                />
              </Field>
            </div>
          </Section>
        </div>

        <SummaryCard ref={summaryRef} title="Your estimate">
          <ul className="m-0 mb-4 max-h-[340px] list-none overflow-auto p-0 text-[0.92rem]" aria-live="polite">
            {r.hasFood ? (
              r.lines.map((l: { label: string; amount?: number; sub?: boolean }, i: number) =>
                l.sub ? (
                  <li key={i} className="py-0.5 pl-4 text-[0.82rem] text-faint">{l.label}</li>
                ) : (
                  <li key={i} className="flex justify-between gap-4 border-b border-border py-2">
                    <span>{l.label}</span>
                    <span className="whitespace-nowrap text-gold-2 tabular-nums">{money(l.amount ?? 0)}</span>
                  </li>
                )
              )
            ) : (
              <li className="text-faint italic">Choose a package or trays to see an estimate.</li>
            )}
          </ul>
          <div className="flex items-baseline justify-between border-t border-cream/30 pt-3.5 text-[0.8rem] tracking-[0.18em] text-muted-foreground uppercase">
            <span>Estimated total</span>
            <strong className="font-display text-[2.6rem] font-light tracking-normal text-cream">
              $<NumberTicker value={r.total} decimalPlaces={cents ? 2 : 0} stiffness={220} damping={32} className="tracking-normal text-cream dark:text-cream" />
            </strong>
          </div>
          <p className="mt-1 mb-0 min-h-[1.2em] text-[0.86rem] text-faint">
            {r.hasFood && r.guests > 0 ? `About ${money(r.perGuest)} per guest for ${r.guests} guests` : ""}
          </p>
          <p className="my-3 text-[0.8rem] text-faint">Before tax and gratuity. Final pricing confirmed by Perfetto.</p>
          <p className="my-4 rounded-md bg-cream/6 px-3.5 py-3 text-[0.84rem] leading-normal text-muted-foreground">
            Nothing is charged when you send this. After we confirm, you'll get a secure invoice by email to pay by card.
          </p>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <>
                <IconLoader2 className="animate-spin" size={18} /> Sending…
              </>
            ) : (
              <>
                Send quote request <IconArrowRight size={18} stroke={1.5} />
              </>
            )}
          </Button>
          <p className="mt-3 mb-0 text-[0.8rem] text-faint">
            Prefer to talk? Call <a className="text-cream" href={D.info.phoneHref}>{D.info.phone}</a>
          </p>
          <FormMessage msg={msg} />
        </SummaryCard>

        {/* Spam trap: hidden from people, bots fill it in and get ignored */}
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website")(e.target.value)} />
          </label>
        </div>

        {/* Phones: the running total stays in reach */}
        <MobileTotal total={r.total} show={r.hasFood && !summaryInView} onReview={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      </form>
    </MotionConfig>
  );
}

/* ---------- pieces ---------- */

function PickGroup({ group, title, count, complete, incomplete, children }: { group: string; title: string; count: string; complete: boolean; incomplete: boolean; children: ReactNode }) {
  return (
    <div
      data-group={group}
      className={cn("mb-6 border-l-2 border-ink/15 py-0.5 pl-4 transition-colors duration-300", complete && "border-l-[#6E8B5E]", incomplete && !complete && "border-l-tomato")}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className={cn("font-semibold", incomplete && !complete && "text-tomato")}>{title}</span>
        <span className={cn("text-[0.8rem] whitespace-nowrap text-faint", complete && "font-semibold text-[#4F7040]")} aria-live="polite">
          {complete && <IconCheck size={13} stroke={2.5} className="mr-1 inline align-[-1px]" />}
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function Chips({ choice, values, onChange, incomplete, taken = [], last }: { choice: Choice; values: string[]; onChange: (v: string[]) => void; incomplete: boolean; taken?: string[]; last?: boolean }) {
  const full = values.length >= choice.pick;
  const title = choiceTitle(choice);
  const chip =
    "h-auto min-h-10 gap-1.5 rounded-full border border-ink/20 bg-white px-4 py-2 text-[0.93rem] font-medium text-ink shadow-none transition-[background-color,color,border-color] hover:border-ink hover:bg-white hover:text-ink data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-cream disabled:opacity-35";
  const items = choice.options.map((o) => {
    const on = values.includes(o);
    const blocked = !on && ((choice.pick > 1 && full) || taken.includes(o));
    return (
      <ToggleGroupItem key={o} value={o} disabled={blocked} className={chip} aria-label={taken.includes(o) ? `${o} (already your first choice)` : o}>
        {on && <IconCheck size={14} stroke={2.5} className="text-gold-2" />}
        {o}
      </ToggleGroupItem>
    );
  });
  return (
    <div className={last ? "[&>div]:mb-0" : undefined}>
      <PickGroup group={choice.id} title={title} count={`${values.length} of ${choice.pick} chosen`} complete={values.length === choice.pick} incomplete={incomplete}>
        {choice.pick > 1 ? (
          <ToggleGroup type="multiple" value={values} onValueChange={onChange} spacing={2} aria-label={title} className="w-full flex-wrap justify-start">
            {items}
          </ToggleGroup>
        ) : (
          <ToggleGroup type="single" value={values[0] ?? ""} onValueChange={(v) => onChange(v ? [v] : [])} spacing={2} aria-label={title} className="w-full flex-wrap justify-start">
            {items}
          </ToggleGroup>
        )}
      </PickGroup>
    </div>
  );
}

function MobileTotal({ total, show, onReview }: { total: number; show: boolean; onReview: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "140%" }}
          animate={{ y: 0 }}
          exit={{ y: "140%" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-x-3 bottom-3 z-30 hidden items-center justify-between gap-4 rounded-full bg-night py-2 pr-2 pl-5 text-cream shadow-[0_16px_34px_-12px_rgb(0_0_0/0.6)] max-[1060px]:flex"
        >
          <span className="text-[0.78rem] tracking-[0.14em] text-muted-foreground uppercase">
            Estimate <strong className="ml-1.5 font-display text-[1.4rem] font-light tracking-normal text-cream normal-case">{money(total)}</strong>
          </span>
          <Button type="button" size="sm" onClick={onReview}>
            Review &amp; send
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
