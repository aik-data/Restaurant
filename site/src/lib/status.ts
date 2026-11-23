/** Live open / closed text from the restaurant's schedule, in Tehachapi time. */
export type OpenState = "open" | "soon" | "closed";

export function openStatus(s: { days: number[]; open: string; close: string; timeZone: string }, now = new Date()) {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", { timeZone: s.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
    .formatToParts(now).forEach((p) => { parts[p.type] = p.value; });
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const open = toMin(s.open), close = toMin(s.close);
  const label = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ":" + String(mm).padStart(2, "0") : "") + (h < 12 ? " am" : " pm"); };
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nextOpen = (from: number) => {
    for (let i = 1; i <= 7; i++) { const d = (from + i) % 7; if (s.days.includes(d)) return i === 1 ? "tomorrow" : names[d]; }
    return "soon";
  };
  const isOpenDay = s.days.includes(day);
  if (isOpenDay && mins < open) return { state: "soon" as OpenState, text: "Opening tonight at " + label(open) };
  if (isOpenDay && mins < close) return { state: "open" as OpenState, text: "Open now · until " + label(close) };
  if (isOpenDay) return { state: "closed" as OpenState, text: "Closed for tonight · back " + nextOpen(day) + " at " + label(open) };
  return { state: "closed" as OpenState, text: "Closed today · back " + nextOpen(day) + " at " + label(open) };
}
