/* Perfetto Italian Restaurant — private events inquiry page */
(function () {
  "use strict";
  var PF = window.PF, D = PF.D, $ = PF.$, esc = PF.esc;

  // Same email backend as catering orders (see order.js)
  var ENDPOINT = D.info.cateringEndpoint || "";
  var CAN_SEND = !!ENDPOINT && (window.location.protocol === "http:" || window.location.protocol === "https:");

  var form = $("#eventForm");
  var msg = $("#formMsg");
  var btn = form.querySelector('button[type="submit"]');

  // Earliest date = 2 days out
  var minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  form.date.min = form.altDate.min = minDate.toISOString().slice(0, 10);

  function showMsg(kind, html) {
    msg.className = "form-msg " + kind;
    msg.innerHTML = html;
  }
  var callUs = 'Please call us at <a href="' + D.info.phoneHref + '">' + esc(D.info.phone) + "</a>.";

  function collect() {
    var fields = ["eventType", "guests", "date", "altDate", "timeOfDay", "style", "budget", "name", "phone", "email", "notes", "website"];
    var data = { kind: "event" };
    fields.forEach(function (f) { data[f] = form[f] ? form[f].value : ""; });
    return data;
  }

  function previewText(d) {
    var rows = [
      "PRIVATE EVENT INQUIRY",
      "Event: " + d.eventType,
      "Preferred date: " + d.date + (d.altDate ? " (backup " + d.altDate + ")" : ""),
      "Time of day: " + (d.timeOfDay || "Not sure yet"),
      "Guests: " + d.guests,
      "Food style: " + (d.style || "Not sure yet"),
    ];
    if (d.budget) rows.push("Budget: " + d.budget);
    rows.push("", "Name: " + d.name, "Phone: " + d.phone, "Email: " + d.email);
    if (d.notes) rows.push("Notes: " + d.notes);
    return rows.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "form-msg";
    msg.textContent = "";

    var firstBad = null;
    ["eventType", "guests", "date", "name", "phone", "email"].forEach(function (n) {
      var el = form[n];
      var ok = el.checkValidity() && String(el.value).trim() !== "";
      el.classList.toggle("invalid", !ok);
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) {
      showMsg("err", "Please fill in the highlighted fields.");
      firstBad.focus();
      return;
    }

    var data = collect();

    if (!CAN_SEND) {
      showMsg("ok", "<strong>Preview mode:</strong> email sending isn't connected yet, so nothing was sent. Once it is, the restaurant gets this by email and the guest gets a confirmation:" +
        '<pre style="white-space:pre-wrap;font-size:.78rem;margin:.6rem 0 0;font-family:inherit">' + esc(previewText(data)) + "</pre>");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending…";
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, status: res.status, body: body }; });
    }).then(function (res) {
      if (res.ok) {
        showMsg("ok", "<strong>Thank you! Your inquiry was sent.</strong> " +
          (res.body.confirmationSent === false ? "" : "A confirmation is on its way to " + esc(data.email.trim()) + ". ") +
          "We'll be in touch within one business day.");
        form.reset();
      } else if (res.status === 400 && res.body.error) {
        showMsg("err", esc(res.body.error));
      } else {
        showMsg("err", "Sorry, we couldn't send your inquiry right now. " + callUs);
      }
    }).catch(function () {
      showMsg("err", "Sorry, we couldn't send your inquiry right now. " + callUs);
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Send Event Inquiry";
    });
  });
})();
