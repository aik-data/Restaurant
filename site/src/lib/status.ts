/** Live open / closed text from the restaurant's schedule, in Tehachapi time. */
export type OpenState = "open" | "soon" | "closed";

type Schedule = {
  days: number[]; // 0 = Sunday ... 6 = Saturday
  open: string; // "16:30"
  close: string; // "20:00"
  timeZone: string;
  closed?: string[]; // extra closed dates, "YYYY-MM-DD" (holidays, vacations)
};

const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function openStatus(s: Schedule, now = new Date()) {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: s.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(now).forEach((p) => { parts[p.type] = p.value; });

  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const open = toMin(s.open), close = toMin(s.close);
  const label = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ":" + String(mm).padStart(2, "0") : "") + (h < 12 ? " am" : " pm"); };

  // the restaurant's calendar date, i days from today
  const today = Date.UTC(+parts.year, +parts.month - 1, +parts.day);
  const dateAt = (i: number) => new Date(today + i * 864e5).toISOString().slice(0, 10);
  const closed = new Set(s.closed ?? []);
  const opensOn = (i: number) => s.days.includes((day + i) % 7) && !closed.has(dateAt(i));

  const nextOpen = () => {
    for (let i = 1; i <= 60; i++) {
      if (!opensOn(i)) continue;
      if (i === 1) return "tomorrow";
      if (i < 7) return NAMES[(day + i) % 7];
      const d = new Date(today + i * 864e5);
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
    }
    return "soon";
  };

  if (opensOn(0) && mins < open) return { state: "soon" as OpenState, text: "Opening tonight at " + label(open) };
  if (opensOn(0) && mins < close) return { state: "open" as OpenState, text: "Open now · until " + label(close) };
  if (opensOn(0)) return { state: "closed" as OpenState, text: "Closed for tonight · back " + nextOpen() + " at " + label(open) };
  return { state: "closed" as OpenState, text: "Closed today · back " + nextOpen() + " at " + label(open) };
}
