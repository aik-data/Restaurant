import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import { MotionConfig } from "motion/react";
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { D } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, FormMessage, Section, SummaryCard, fieldInvalid, inputClass, previewBlock, twoDaysOut } from "./form-kit";

const EVENT_TYPES = ["Rehearsal dinner", "Birthday or anniversary", "Baby or bridal shower", "Business dinner or meeting", "Holiday party", "Celebration of life", "Other"];
const TIMES = ["Lunch", "Afternoon", "Evening"];
const STYLES = ["Family-style platters", "Buffet", "Set menu", "Appetizers and drinks"];
const BUDGETS = ["Under $25", "$25 – $40", "$40 – $60", "$60+"];

const blank = { eventType: "", guests: "20", date: "", altDate: "", timeOfDay: "", style: "", budget: "", name: "", phone: "", email: "", notes: "", website: "" };
type Fields = typeof blank;

/** Private event inquiry: sent to the same email Worker as catering orders. */
export default function EventForm({ endpoint }: { endpoint: string }) {
  const [f, setF] = useState<Fields>(blank);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; body: ReactNode; cause?: "fields" } | null>(null);
  const [sending, setSending] = useState(false);
  const [minDate, setMinDate] = useState<string>();
  useEffect(() => setMinDate(twoDaysOut()), []);

  const set = (k: keyof Fields) => (v: string) => {
    setF((s) => ({ ...s, [k]: v }));
    if (invalid.has(k)) setInvalid((s) => { const n = new Set(s); n.delete(k); return n; });
  };

  useEffect(() => {
    if (msg?.cause === "fields" && invalid.size === 0) setMsg(null);
  }, [msg, invalid]);

  // Optional dropdowns: "Not sure yet" clears the value
  const pick = (k: keyof Fields, label: string, options: string[], none: string) => (
    <Field id={`f-${k}`} label={label} optional={k === "budget"}>
      <Select value={f[k] || "__none"} onValueChange={(v) => set(k)(v === "__none" ? "" : v)}>
        <SelectTrigger id={`f-${k}`} className={cn(inputClass, "w-full")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="surface-paper">
          <SelectItem value="__none">{none}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );

  function previewText() {
    const rows = [
      "PRIVATE EVENT INQUIRY",
      "Event: " + f.eventType,
      "Preferred date: " + f.date + (f.altDate ? " (backup " + f.altDate + ")" : ""),
      "Time of day: " + (f.timeOfDay || "Not sure yet"),
      "Guests: " + f.guests,
      "Food style: " + (f.style || "Not sure yet"),
    ];
    if (f.budget) rows.push("Budget: " + f.budget);
    rows.push("", "Name: " + f.name, "Phone: " + f.phone, "Email: " + f.email);
    if (f.notes) rows.push("Notes: " + f.notes);
    return rows.join("\n");
  }

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    setMsg(null);
    const bad = new Set<string>();
    (["eventType", "guests", "date", "name", "phone", "email"] as const).forEach((k) => { if (fieldInvalid(k, f[k])) bad.add(k); });
    setInvalid(bad);
    if (bad.size) {
      setMsg({ kind: "err", body: "Please fill in the highlighted fields.", cause: "fields" });
      const first = ["eventType", "guests", "date", "name", "phone", "email"].find((k) => bad.has(k));
      document.getElementById("f-" + first)?.focus();
      return;
    }
    const data = { kind: "event", ...f };

    if (!endpoint || !/^https?:$/.test(window.location.protocol)) {
      setMsg({
        kind: "ok",
        body: (
          <>
            <strong>Preview mode:</strong> email sending isn't connected yet, so nothing was sent. Once it is, the restaurant gets this by email and the guest gets a confirmation:
            {previewBlock(previewText())}
          </>
        ),
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({
          kind: "ok",
          body: (
            <>
              <strong>Thank you! Your inquiry was sent.</strong> {body.confirmationSent === false ? "" : `A confirmation is on its way to ${f.email.trim()}. `}
              We'll be in touch within one business day.
            </>
          ),
        });
        setF(blank);
      } else if (res.status === 400 && body.error) {
        setMsg({ kind: "err", body: body.error });
      } else throw new Error("send failed");
    } catch {
      setMsg({
        kind: "err",
        body: (
          <>
            Sorry, we couldn't send your inquiry right now. Please call us at <a href={D.info.phoneHref}>{D.info.phone}</a>.
          </>
        ),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-[clamp(2.5rem,5vw,4.5rem)] max-[1060px]:grid-cols-1">
        <div>
          <Section n={1} title="Your event">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-[560px]:grid-cols-1">
              <Field id="f-eventType" label="Type of event" invalid={invalid.has("eventType")}>
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
              <Field id="f-guests" label="Number of guests" invalid={invalid.has("guests")}>
                <Input id="f-guests" type="number" inputMode="numeric" min={1} max={1000} value={f.guests} onChange={(e) => set("guests")(e.target.value)} aria-invalid={invalid.has("guests") || undefined} className={inputClass} />
              </Field>
              <Field id="f-date" label="Preferred date" invalid={invalid.has("date")}>
                <Input id="f-date" type="date" min={minDate} value={f.date} onChange={(e) => set("date")(e.target.value)} aria-invalid={invalid.has("date") || undefined} className={inputClass} />
              </Field>
              <Field id="f-altDate" label="Backup date" optional>
                <Input id="f-altDate" type="date" min={minDate} value={f.altDate} onChange={(e) => set("altDate")(e.target.value)} className={inputClass} />
              </Field>
              {pick("timeOfDay", "Time of day", TIMES, "Not sure yet")}
              {pick("style", "Food style", STYLES, "Not sure yet")}
              <div className="col-span-full">{pick("budget", "Budget per person", BUDGETS, "Prefer not to say")}</div>
            </div>
          </Section>

          <Section n={2} title="Your contact info">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-[560px]:grid-cols-1">
              <Field id="f-name" label="Name" invalid={invalid.has("name")}>
                <Input id="f-name" autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={invalid.has("name") || undefined} className={inputClass} />
              </Field>
              <Field id="f-phone" label="Phone" invalid={invalid.has("phone")}>
                <Input id="f-phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} aria-invalid={invalid.has("phone") || undefined} className={inputClass} />
              </Field>
              <Field id="f-email" label="Email" invalid={invalid.has("email")} className="col-span-full">
                <Input id="f-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={invalid.has("email") || undefined} className={inputClass} />
              </Field>
              <Field id="f-notes" label="Tell us about your event" optional className="col-span-full">
                <Textarea
                  id="f-notes"
                  rows={4}
                  value={f.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="e.g. Surprise 60th birthday, would love a cake table, a few guests are vegetarian"
                  className={cn(inputClass, "min-h-28 py-3")}
                />
              </Field>
            </div>
          </Section>
        </div>

        <SummaryCard title="What happens next">
          <ol className="m-0 mb-4 list-none space-y-3 p-0 text-[0.95rem] text-muted-foreground">
            {[
              "We'll call or email you within one business day.",
              "We'll talk through the date, space and menu, and send you a proposal.",
              "A deposit holds your date. We email a secure invoice.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="grid size-7 flex-none place-items-center rounded-full border border-gold text-[0.8rem] text-gold">{i + 1}</span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
          <p className="my-4 rounded-md bg-cream/6 px-3.5 py-3 text-[0.84rem] leading-normal text-muted-foreground">Nothing is booked or charged when you send this.</p>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <>
                <IconLoader2 className="animate-spin" size={18} /> Sending…
              </>
            ) : (
              <>
                Send event inquiry <IconArrowRight size={18} stroke={1.5} />
              </>
            )}
          </Button>
          <p className="mt-3 mb-0 text-[0.8rem] text-faint">
            Prefer to talk? Call <a className="text-cream" href={D.info.phoneHref}>{D.info.phone}</a>
          </p>
          <FormMessage msg={msg} />
        </SummaryCard>

        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website")(e.target.value)} />
          </label>
        </div>
      </form>
    </MotionConfig>
  );
}
