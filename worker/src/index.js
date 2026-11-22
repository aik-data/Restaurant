/*
 * Perfetto catering email backend (Cloudflare Worker)
 * ------------------------------------------------------------
 * The order page (docs/order.html) POSTs catering requests here. The Worker:
 *   1. checks the request and recomputes the estimate from the site's own
 *      menu data, so prices in the emails can't be tampered with
 *   2. emails the restaurant the full order through Resend (Reply goes to the customer)
 *   3. emails the customer a confirmation with their order and next steps
 *
 * Settings (Cloudflare dashboard → the Worker → Settings → Variables and Secrets):
 *   RESEND_API_KEY       secret   Resend API key
 *   CATERING_TO_EMAIL    secret   where new requests go (comma-separate for several)
 *   CATERING_FROM_EMAIL  secret   sender on a domain verified in Resend,
 *                                 e.g. "Perfetto Catering <catering@perfettotehachapi.com>"
 *   ALLOWED_ORIGINS      variable websites allowed to send orders (set in wrangler.toml)
 */

import DATA from "../../docs/js/menu-data.js";
import EST from "../../docs/js/estimate.js";

const RESEND_URL = "https://api.resend.com/emails";
const TIME_ZONE = "America/Los_Angeles";
const MAX_BODY = 20000;
const LIMITS = { eventType: 80, date: 10, time: 5, name: 100, phone: 40, email: 200, address: 300, notes: 2000 };

/* ---------- helpers ---------- */

function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

const oneLine = (s) => s.replace(/\s+/g, " ");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

function todayInTehachapi() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
}

function formatDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function formatTime(hhmm) {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

/* ---------- request checks ---------- */

function readOrder(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const order = {};
  Object.keys(LIMITS).forEach((k) => { order[k] = clean(o[k], LIMITS[k]); });
  ["eventType", "date", "time", "name", "phone", "email", "address"].forEach((k) => { order[k] = oneLine(order[k]); });
  order.guests = o.guests;
  order.packageId = clean(o.packageId, 40);
  order.picks = o.picks && typeof o.picks === "object" ? o.picks : {};
  order.trays = Array.isArray(o.trays) ? o.trays.slice(0, 40) : [];
  order.extras = Array.isArray(o.extras) ? o.extras.slice(0, 40) : [];
  order.fulfillment = o.fulfillment === "delivery" ? "delivery" : "pickup";
  order.chafers = o.chafers === true;
  order.website = clean(o.website, 200);
  return order;
}

function findProblem(order, est) {
  if (!order.name) return "Please enter your name.";
  if (!order.phone || order.phone.replace(/\D/g, "").length < 7) return "Please enter a phone number we can reach you at.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) return "Please enter a valid email address.";
  if (!order.eventType) return "Please choose an event type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.date) || isNaN(Date.parse(order.date))) return "Please choose an event date.";
  if (order.date < todayInTehachapi()) return "Please choose an event date in the future.";
  if (est.guests < 1) return "Please enter the number of guests.";
  if (order.fulfillment === "delivery" && !order.address) return "Please enter a delivery address.";
  if (order.packageId && !est.pkg) return "Please choose one of our catering packages.";
  if (est.problems.length) return est.problems[0].message;
  if (!est.hasFood && !order.notes) return "Choose a package or trays, or describe what you'd like in the notes.";
  return "";
}

/* ---------- email content ---------- */

function detailRows(order, est) {
  const when = formatDate(order.date) + (order.time ? " at " + formatTime(order.time) : "");
  return [
    ["Event", order.eventType],
    ["Date", when],
    ["Guests", String(est.guests)],
    ["Pickup / delivery", order.fulfillment === "delivery" ? "Delivery to " + order.address : "Pickup at " + DATA.info.address],
  ];
}

function orderTableHtml(est) {
  const rows = est.lines.map((l) => l.sub
    ? `<tr><td style="padding:2px 0 2px 16px;color:#6b5e57;font-size:13px;" colspan="2">${escapeHtml(l.label)}</td></tr>`
    : `<tr><td style="padding:8px 0 4px;border-top:1px solid #eee3d1;">${escapeHtml(l.label)}</td><td style="padding:8px 0 4px;border-top:1px solid #eee3d1;text-align:right;white-space:nowrap;">${money(l.amount)}</td></tr>`
  ).join("");
  const totalRow = est.hasFood
    ? `<tr><td style="padding:12px 0 0;border-top:2px solid #2b211c;font-weight:bold;">Estimated total</td><td style="padding:12px 0 0;border-top:2px solid #2b211c;text-align:right;font-weight:bold;font-size:18px;color:#7a1f1f;">${money(est.total)}</td></tr>`
    : `<tr><td style="padding:8px 0;color:#6b5e57;" colspan="2">No package or trays chosen. See notes.</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;">${rows}${totalRow}</table>`;
}

function detailsTableHtml(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;margin:0 0 20px;">` +
    rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5e57;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`).join("") +
    `</table>`;
}

function layout(title, inner) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f1e6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#2b211c;line-height:1.5;">
<tr><td style="background:#7a1f1f;padding:20px 28px;">
  <div style="font-family:Georgia,serif;font-style:italic;font-weight:bold;font-size:26px;color:#ffffff;">Perfetto</div>
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f3d9a4;">Italian Restaurant · Tehachapi</div>
</td></tr>
<tr><td style="padding:28px;">
  <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px;">${escapeHtml(title)}</h1>
  ${inner}
</td></tr>
<tr><td style="padding:16px 28px;background:#fcf9f3;font-size:12px;color:#6b5e57;">
  ${escapeHtml(DATA.info.name)} · ${escapeHtml(DATA.info.address)}, ${escapeHtml(DATA.info.city)} · ${escapeHtml(DATA.info.phone)}
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function orderText(order, est) {
  const out = detailRows(order, est).map(([k, v]) => k + ": " + v);
  out.push("", "ORDER");
  est.lines.forEach((l) => out.push(l.sub ? "    · " + l.label : "  - " + l.label + ": " + money(l.amount)));
  if (est.hasFood) out.push("Estimated total: " + money(est.total));
  if (order.notes) out.push("", "Notes: " + order.notes);
  return out.join("\n");
}

function restaurantEmail(order, est) {
  const shortDate = new Date(order.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const subject = `New catering request: ${order.eventType}, ${shortDate}, ${est.guests} guests`;
  const contact = [["Name", order.name], ["Phone", order.phone], ["Email", order.email]];
  const html = layout("New catering request", `
    <p style="margin:0 0 16px;background:#fff4cc;border-radius:8px;padding:10px 14px;font-size:14px;">
      Reply to this email to reach ${escapeHtml(order.name)} directly. Once confirmed, send the invoice from the Clover dashboard (Virtual Terminal → Send Invoice).
    </p>
    <h2 style="font-size:16px;margin:0 0 6px;">Customer</h2>
    ${detailsTableHtml(contact)}
    <h2 style="font-size:16px;margin:0 0 6px;">Event</h2>
    ${detailsTableHtml(detailRows(order, est))}
    <h2 style="font-size:16px;margin:0 0 6px;">Order</h2>
    ${orderTableHtml(est)}
    ${order.chafers ? '<p style="margin:16px 0 0;font-size:14px;">✔ Chafing dishes requested</p>' : ""}
    ${order.notes ? `<h2 style="font-size:16px;margin:20px 0 6px;">Notes</h2><p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.notes)}</p>` : ""}
  `);
  const text = "NEW CATERING REQUEST\n\n" + contact.map(([k, v]) => k + ": " + v).join("\n") + "\n\n" + orderText(order, est) +
    "\n\nReply to this email to reach the customer. Send the invoice from Clover: Virtual Terminal → Send Invoice.";
  return { subject, html, text };
}

function customerEmail(order, est) {
  const firstName = order.name.split(" ")[0];
  const subject = "We received your catering request: Perfetto Italian Restaurant";
  const html = layout(`Thanks, ${firstName}! We got your request.`, `
    <p style="margin:0 0 20px;">Here's a copy of your catering request. Nothing has been charged.</p>
    <h2 style="font-size:16px;margin:0 0 8px;">What happens next</h2>
    <ol style="margin:0 0 24px;padding-left:20px;">
      <li style="margin-bottom:4px;">We'll call or email you within one business day to confirm the date, headcount and menu.</li>
      <li style="margin-bottom:4px;">Once confirmed, we'll email you a secure invoice to pay by card.</li>
      <li>Events of 50+ guests: a 25% deposit holds your date.</li>
    </ol>
    <h2 style="font-size:16px;margin:0 0 6px;">Your event</h2>
    ${detailsTableHtml(detailRows(order, est))}
    <h2 style="font-size:16px;margin:0 0 6px;">Your order</h2>
    ${orderTableHtml(est)}
    <p style="margin:8px 0 0;font-size:12px;color:#6b5e57;">Estimate before tax and gratuity. Final pricing confirmed by Perfetto.</p>
    ${order.notes ? `<h2 style="font-size:16px;margin:20px 0 6px;">Your notes</h2><p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.notes)}</p>` : ""}
    <p style="margin:24px 0 0;">Questions or changes? Just reply to this email or call us at <a href="${DATA.info.phoneHref}" style="color:#b8402f;">${escapeHtml(DATA.info.phone)}</a>.</p>
    <p style="margin:16px 0 0;">Thank you,<br>The Perfetto family</p>
  `);
  const text = `Thanks, ${firstName}! We got your catering request. Nothing has been charged.\n\n` +
    "WHAT HAPPENS NEXT\n1. We'll call or email you within one business day to confirm.\n2. Once confirmed, we'll email you a secure invoice to pay by card.\n3. Events of 50+ guests: a 25% deposit holds your date.\n\n" +
    orderText(order, est) + `\n\nQuestions? Reply to this email or call ${DATA.info.phone}.\n\nThe Perfetto family`;
  return { subject, html, text };
}

/* ---------- Resend ---------- */

async function sendEmail(apiKey, message) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/* ---------- HTTP ---------- */

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

function respond(status, body, origin) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Origin" };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

async function handleOrder(request, env, origin) {
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY) return respond(413, { error: "Request too large." }, origin);

  let parsed;
  try { parsed = JSON.parse(rawBody); } catch (e) { return respond(400, { error: "Invalid request." }, origin); }

  const order = readOrder(parsed);
  if (order.website) return respond(200, { ok: true }, origin); // spam trap filled in: pretend it worked

  const est = EST.estimate(order, DATA);
  const problem = findProblem(order, est);
  if (problem) return respond(400, { error: problem }, origin);

  const { RESEND_API_KEY, CATERING_TO_EMAIL, CATERING_FROM_EMAIL } = env;
  if (!RESEND_API_KEY || !CATERING_TO_EMAIL || !CATERING_FROM_EMAIL) {
    console.error("Missing RESEND_API_KEY, CATERING_TO_EMAIL or CATERING_FROM_EMAIL");
    return respond(500, { error: "Email is not set up yet." }, origin);
  }
  const restaurantInbox = CATERING_TO_EMAIL.split(",").map((s) => s.trim()).filter(Boolean);

  // 1. The restaurant's copy: if this fails, the customer is told to call
  try {
    const r = restaurantEmail(order, est);
    await sendEmail(RESEND_API_KEY, {
      from: CATERING_FROM_EMAIL, to: restaurantInbox, reply_to: order.email,
      subject: r.subject, html: r.html, text: r.text,
    });
  } catch (err) {
    console.error("Restaurant email failed:", err.message);
    return respond(502, { error: "Could not send your request." }, origin);
  }

  // 2. The customer's confirmation: nice to have, the request is already in
  let confirmationSent = true;
  try {
    const c = customerEmail(order, est);
    await sendEmail(RESEND_API_KEY, {
      from: CATERING_FROM_EMAIL, to: [order.email], reply_to: restaurantInbox,
      subject: c.subject, html: c.html, text: c.text,
    });
  } catch (err) {
    confirmationSent = false;
    console.error("Customer confirmation failed:", err.message);
  }

  return respond(200, { ok: true, confirmationSent }, origin);
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }
    if (request.method !== "POST") return respond(405, { error: "Method not allowed" }, origin);
    if (!origin) return respond(403, { error: "Not allowed." }, "");

    return handleOrder(request, env, origin);
  },
};

// exposed for tests
export const _internal = { readOrder, findProblem, restaurantEmail, customerEmail, formatDate, formatTime };
