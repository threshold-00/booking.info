// Booking flow engine for demo/surf/book/. Phase 2: static config data only, nothing
// is sent anywhere. Availability logic here mirrors (ports, does not modify) the
// functions in demo/phones/index.html: blackoutFor, bookedSeats, slotState, newRef.
// Phase 3 will swap the static reads below for the /availability Edge Function.
(function () {
  "use strict";
  var CFG = window.THRESHOLD_CONFIG;
  if (!CFG) return;

  var track = (window.ThresholdTrack && window.ThresholdTrack.track) || function () {};

  var ACT_BY_ID = {};
  CFG.activities.forEach(function (a) { ACT_BY_ID[a.id] = a; });

  var params = new URLSearchParams(location.search);
  var activityId = params.get("experience") || CFG.activities[0].id;
  var activity = ACT_BY_ID[activityId] || CFG.activities[0];
  var duration = activity.durations[0];

  var AVS = CFG.availability.static;
  var AV_DEFAULTS = CFG.availability.defaults;
  var AV_ACT = (CFG.availability.activities || {})[activity.id] || {};

  var zoneLabel = "Melbourne time (AEDT)"; // AEST after 4 Apr 2027, per business.timezone

  var state = {
    step: 1, // 1 time, 2 guests, 3 details, 4 pay
    completed: {},
    date: null, // { y, m, d }
    slot: null,
    party: 1,
    answers: [], // one per guest: { age, water, consent }
    details: { name: "", email: "", mobile: "+61", notes: "", access: "" },
    calMonthOffset: 0
  };

  // ---------- date helpers (ported from demo/phones/index.html) ----------
  function todayParts() {
    var n = new Date();
    return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
  }
  function utcDay(s) { return Math.floor(Date.UTC(s.y, s.m, s.d) / 86400000); }
  function sameDay(a, b) { return !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d; }
  function addDays(s, n) {
    var d = new Date(s.y, s.m, s.d + n);
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }
  function weekday(s) { return new Date(s.y, s.m, s.d).getDay(); } // 0 = Sunday
  function isoOfS(s) { return s.y + "-" + String(s.m + 1).padStart(2, "0") + "-" + String(s.d).padStart(2, "0"); }
  function fmtDate(s) {
    return new Date(s.y, s.m, s.d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  }

  function blackoutFor(s) {
    if (!AVS || !AVS.blackoutDates) return null;
    return AVS.blackoutDates.find(function (b) {
      var x = utcDay(s);
      var from = b.date ? utcDay(parseISO(b.date)) : null;
      if (from === null) return false;
      var to = b.to ? utcDay(parseISO(b.to)) : from;
      return x >= from && x <= to;
    }) || null;
  }
  function parseISO(iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return { y: +p[1], m: +p[2] - 1, d: +p[3] };
  }

  function bookedSeats(slot, s) {
    if (!AVS || !AVS.booked) return 0;
    return AVS.booked.reduce(function (sum, b) {
      if (b.activity !== activity.id || b.slot !== slot) return sum;
      if (!sameDay(parseISO(b.date), s)) return sum;
      return sum + (b.seats === undefined ? Infinity : b.seats);
    }, 0);
  }

  function dayOpen(s) {
    var today = todayParts();
    if (utcDay(s) < utcDay(today)) return false;
    if (AVS.horizonDays !== undefined && utcDay(s) - utcDay(today) > AVS.horizonDays) return false;
    if (blackoutFor(s)) return false;
    var openWeekdays = AV_ACT.openWeekdays || AV_DEFAULTS.openWeekdays;
    if (openWeekdays && openWeekdays.indexOf(weekday(s)) === -1) return false;
    return true;
  }

  function slotsForDay() {
    return AV_ACT.slots || [];
  }

  function slotOk(slot, s) {
    if (!dayOpen(s)) return false;
    var cap = AV_ACT.capacity;
    var booked = bookedSeats(slot, s);
    var left = cap === undefined ? (booked > 0 ? 0 : null) : Math.max(cap - booked, 0);
    if (left !== null && left < state.party) return false;
    var hour = parseHour(slot);
    var start = new Date(s.y, s.m, s.d, Math.floor(hour), Math.round((hour % 1) * 60));
    if (AVS.leadTimeHours && start < new Date(Date.now() + AVS.leadTimeHours * 3600000)) return false;
    return true;
  }
  function parseHour(slot) {
    var m = /(\d+):(\d+)\s*(am|pm)/i.exec(slot);
    if (!m) return 9;
    var h = +m[1] % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h + (+m[2]) / 60;
  }
  function placesLeft(slot, s) {
    var cap = AV_ACT.capacity;
    if (cap === undefined) return null;
    return Math.max(cap - bookedSeats(slot, s), 0);
  }

  function nextAvailableDate() {
    var d = todayParts();
    for (var i = 0; i < 120; i++) {
      var s = addDays(d, i);
      if (dayOpen(s) && slotsForDay().some(function (slot) { return slotOk(slot, s); })) return s;
      if (i === 0) d = addDays(d, 1), i = -1; // keep loop simple
    }
    return null;
  }

  // ---------- pricing ----------
  function unitPrice() { return duration.price; }
  function totalPrice() {
    if (activity.pricing.per === "person") return unitPrice() * state.party;
    return unitPrice();
  }
  function fmtMoney(n) { return (CFG.payment.currencySymbol || "$") + n; }

  // ---------- screening ----------
  function screeningFor(idx) {
    return (CFG.screening.questions || []).map(function (q) {
      var ans = state.answers[idx] || {};
      if (q.id === "age") {
        var age = ans.age;
        if (age === undefined || age === "" || age === null) return { q: q, outcome: null };
        var n = Number(age);
        if (isNaN(n) || n < q.valid.min || n > q.valid.max) return { q: q, outcome: "invalid" };
        if (n < q.rule.min) return { q: q, outcome: "fail" };
        return { q: q, outcome: "pass", needsConsent: q.consentBelow && n < q.consentBelow };
      }
      if (q.id === "water") {
        if (ans.water === undefined) return { q: q, outcome: null };
        return { q: q, outcome: ans.water ? "pass" : "fail" };
      }
      return { q: q, outcome: null };
    });
  }

  function guestOutcome(idx) {
    var results = screeningFor(idx);
    if (results.some(function (r) { return r.outcome === "fail"; })) return "fail";
    if (results.some(function (r) { return r.outcome === null || r.outcome === "invalid"; })) return "incomplete";
    var needsConsent = results.some(function (r) { return r.needsConsent; });
    if (needsConsent && !state.answers[idx].consent) return "warn";
    return "pass";
  }

  // ---------- DOM refs ----------
  var root = document.getElementById("bkApp");
  if (!root) return;

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function renderProgress() {
    var labels = ["TIME", "GUESTS", "DETAILS", "PAY"];
    var segs = "";
    for (var i = 1; i <= 4; i++) {
      var s = i < state.step ? "complete" : i === state.step ? "current" : "upcoming";
      segs += '<div class="bk-progress__seg" data-state="' + s + '"></div>';
    }
    root.querySelector(".bk-progress__segs").innerHTML = segs;
    root.querySelector(".bk-progress__label").textContent = "STEP " + state.step + " OF 4 · " + labels[state.step - 1];
  }

  function goToStep(n) {
    state.step = n;
    render();
    track("step_view", { step: n, experience_id: activity.id });
  }

  // ---------- Step 1: Time ----------
  function renderTime(container) {
    if (state.step > 1 && state.completed[1]) {
      container.innerHTML = recapHTML("Time", state.date ? fmtDate(state.date) + ", " + state.slot : "", 1);
      return;
    }
    container.hidden = false;
    var month = new Date();
    month.setMonth(month.getMonth() + state.calMonthOffset);
    var y = month.getFullYear(), m = month.getMonth();
    var first = new Date(y, m, 1);
    var startOffset = (first.getDay() + 6) % 7; // Monday first
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var html = '<h2>Choose a time</h2>';
    var next = nextAvailableDate();
    if (next) {
      html += '<button type="button" class="bk-ghost-btn" id="bkNextAvail">Next available: ' + fmtDate(next) + '</button>';
    }
    if (activity.multiDay) {
      html += renderMultiDay();
    } else {
      html += '<div class="bk-cal">' +
        '<div class="bk-cal__head"><button type="button" class="bk-cal__nav" id="bkPrevMonth" aria-label="Previous month">&larr;</button>' +
        '<span class="bk-cal__month">' + month.toLocaleDateString("en-AU", { month: "long", year: "numeric" }) + '</span>' +
        '<button type="button" class="bk-cal__nav" id="bkNextMonth" aria-label="Next month">&rarr;</button></div>' +
        '<div class="bk-cal__weekdays"><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div></div>' +
        '<div class="bk-cal__grid" role="grid" id="bkCalGrid">';
      for (var i = 0; i < startOffset; i++) html += '<div></div>';
      var today = todayParts();
      for (var day = 1; day <= daysInMonth; day++) {
        var s = { y: y, m: m, d: day };
        var open = dayOpen(s) && slotsForDay().some(function (slot) { return slotOk(slot, s); });
        var isToday = sameDay(s, today);
        var selected = state.date && sameDay(state.date, s);
        var reason = !open ? (blackoutFor(s) ? "closed" : "not available") : "";
        html += '<button type="button" class="bk-cal__cell" role="gridcell" tabindex="-1" ' +
          'data-y="' + y + '" data-m="' + m + '" data-d="' + day + '" ' +
          (open ? '' : 'aria-disabled="true" ') +
          (isToday ? 'data-today="true" ' : '') +
          (selected ? 'aria-selected="true" ' : '') +
          'aria-label="' + fmtDate(s) + (reason ? ", " + reason : "") + '">' +
          '<span>' + day + '</span>' + (open ? '<span class="bk-cal__dot"></span>' : '') +
          '</button>';
      }
      html += '</div></div>';
      html += '<p class="bk-cal__caption">Times are ' + zoneLabel + '. Times are set by the business.</p>';
      if (duration && activity.durations.length > 1) {
        html += '<div class="bk-duration-chips" id="bkDurationChips">' + activity.durations.map(function (d) {
          return '<button type="button" class="bk-chip" data-dur="' + d.id + '" aria-pressed="' + (d.id === duration.id) + '">' + d.label + '</button>';
        }).join("") + '</div>';
      }
      html += '<div id="bkSlots"></div>';
    }
    html += '<div style="margin-top:16px;"><button type="button" class="bk-pay-btn" id="bkTimeContinue" disabled>' + (CFG.copy.ui.en.continue) + '</button></div>';
    container.innerHTML = html;
    wireCalendar(container);
  }

  function renderMultiDay() {
    var md = activity.multiDay;
    return '<div class="bk-cal"><p class="mono">' + md.copy.pick + '</p>' +
      '<div id="bkWeekendPick" style="display:flex;gap:8px;margin:12px 0;">' +
      '<button type="button" class="bk-chip" data-weekend="this">This weekend</button>' +
      '<button type="button" class="bk-chip" data-weekend="next">Next weekend</button>' +
      '</div><p class="bk-cal__caption">' + md.copy.weekNote + ' ' + md.copy.sessionNote + '</p>' +
      '<div id="bkWeekendDays" style="margin-top:12px;"></div></div>';
  }

  function wireCalendar(container) {
    var prev = container.querySelector("#bkPrevMonth");
    var nextBtn = container.querySelector("#bkNextMonth");
    if (prev) prev.addEventListener("click", function () { state.calMonthOffset--; renderTime(container); });
    if (nextBtn) nextBtn.addEventListener("click", function () { state.calMonthOffset++; renderTime(container); });

    var nextAvailBtn = container.querySelector("#bkNextAvail");
    if (nextAvailBtn) nextAvailBtn.addEventListener("click", function () {
      var s = nextAvailableDate();
      if (s) selectDate(s, container);
    });

    var weekendBtns = container.querySelectorAll("[data-weekend]");
    weekendBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var today = todayParts();
        var dow = weekday(today);
        var daysToSat = (6 - dow + 7) % 7;
        var offset = btn.getAttribute("data-weekend") === "next" ? daysToSat + 7 : daysToSat;
        var sat = addDays(today, offset || 7);
        var sun = addDays(sat, 1);
        state.date = sat;
        state.multiDayDates = [sat, sun];
        state.slot = activity.availability_slot_label || "Sat & Sun 9:00am";
        updateTimeContinue(container);
      });
    });

    var grid = container.querySelector("#bkCalGrid");
    if (grid) {
      var cells = Array.prototype.slice.call(grid.querySelectorAll(".bk-cal__cell"));
      cells.forEach(function (cell, idx) {
        cell.addEventListener("click", function () {
          if (cell.getAttribute("aria-disabled") === "true") return;
          var s = { y: +cell.dataset.y, m: +cell.dataset.m, d: +cell.dataset.d };
          selectDate(s, container);
        });
        cell.addEventListener("keydown", function (e) {
          var move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
          if (move) {
            e.preventDefault();
            var target = cells[idx + move];
            if (target) { target.focus(); target.tabIndex = 0; cell.tabIndex = -1; }
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cell.click();
          }
        });
      });
      var firstEnabled = cells.find(function (c) { return c.getAttribute("aria-disabled") !== "true"; });
      if (firstEnabled) firstEnabled.tabIndex = 0;
    }

    var durChips = container.querySelectorAll("#bkDurationChips .bk-chip");
    durChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var d = activity.durations.find(function (x) { return x.id === chip.dataset.dur; });
        if (d) duration = d;
        durChips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        if (state.date) renderSlots(container);
      });
    });

    var continueBtn = container.querySelector("#bkTimeContinue");
    if (continueBtn) continueBtn.addEventListener("click", function () {
      state.completed[1] = true;
      track("slot_select", { experience_id: activity.id, price_aud: totalPrice() });
      goToStep(2);
    });
  }

  function selectDate(s, container) {
    state.date = s;
    state.slot = null;
    renderTime(container);
    renderSlots(container);
    var grid = container.querySelector("#bkCalGrid");
    if (grid) {
      var match = Array.prototype.find.call(grid.querySelectorAll(".bk-cal__cell"), function (c) {
        return +c.dataset.y === s.y && +c.dataset.m === s.m && +c.dataset.d === s.d;
      });
      if (match) match.scrollIntoView({ block: "nearest" });
    }
  }

  function renderSlots(container) {
    var holder = container.querySelector("#bkSlots");
    if (!holder) return;
    if (!dayOpen(state.date)) {
      var next3 = [];
      var probe = state.date;
      for (var i = 1; next3.length < 3 && i < 30; i++) {
        var s = addDays(state.date, i);
        if (dayOpen(s)) next3.push(s);
      }
      holder.innerHTML = '<div class="bk-empty-day">' + CFG.copy.ui.en.emptyDay +
        '<ul>' + next3.map(function (s) { return '<li><button type="button" data-try="' + isoOfS(s) + '">' + fmtDate(s) + '</button></li>'; }).join("") + '</ul></div>';
      holder.querySelectorAll("[data-try]").forEach(function (btn) {
        btn.addEventListener("click", function () { selectDate(parseISO(btn.dataset.try), container); });
      });
      return;
    }
    var slots = slotsForDay();
    var visitorOffset = -new Date().getTimezoneOffset();
    var businessIsLocal = true; // Australia/Melbourne; kept simple for the static demo
    holder.innerHTML = '<div class="bk-slots">' + slots.map(function (slot) {
      var ok = slotOk(slot, state.date);
      var left = placesLeft(slot, state.date);
      var sub = duration.label + " · " + fmtMoney(duration.price) + (activity.pricing.per === "person" ? " pp" : "");
      return '<button type="button" class="bk-chip" data-slot="' + slot + '" ' + (ok ? "" : "disabled") + ' aria-pressed="' + (state.slot === slot) + '">' +
        '<span class="bk-chip__time">' + slot + '</span><span class="bk-chip__sub">' + sub + '</span>' +
        (left !== null && left > 0 && left <= 3 ? '<span class="bk-chip__sub">' + left + ' places left</span>' : '') +
        (!ok ? '<span class="bk-chip__sub">Full</span>' : '') +
        '</button>';
    }).join("") + '</div>';
    holder.querySelectorAll("[data-slot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.slot = btn.dataset.slot;
        holder.querySelectorAll("[data-slot]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
        updateTimeContinue(container);
      });
    });
    updateTimeContinue(container);
  }

  function updateTimeContinue(container) {
    var btn = container.querySelector("#bkTimeContinue");
    if (btn) btn.disabled = !(state.date && state.slot);
  }

  // ---------- Step 2: Guests ----------
  function renderGuests(container) {
    if (state.step > 2 && state.completed[2]) {
      container.innerHTML = recapHTML("Guests", state.party + (state.party === 1 ? " person" : " people"), 2);
      return;
    }
    container.hidden = false;
    while (state.answers.length < state.party) state.answers.push({});
    state.answers.length = state.party;

    var max = Math.min(activity.people.max, AV_ACT.capacity || activity.people.max);
    var html = '<h2>' + CFG.copy.ui.en.numPeople + '</h2>' +
      '<div class="bk-stepper">' +
      '<button type="button" class="bk-stepper__btn" id="bkGuestMinus" aria-label="Fewer people">−</button>' +
      '<span class="bk-stepper__count">' + state.party + '</span>' +
      '<button type="button" class="bk-stepper__btn" id="bkGuestPlus" aria-label="More people">+</button>' +
      '</div>';
    html += '<p class="bk-total">' + guestTotalLine() + '</p>';

    for (var i = 0; i < state.party; i++) {
      html += renderGuestRow(i);
    }
    var allOk = Array.from({ length: state.party }, function (_, i) { return guestOutcome(i); }).every(function (o) { return o === "pass"; });
    html += '<div style="margin-top:16px;"><button type="button" class="bk-pay-btn" id="bkGuestsContinue" ' + (allOk ? "" : "disabled") + '>' + CFG.copy.ui.en.continue + '</button></div>';
    container.innerHTML = html;
    wireGuests(container, max);
  }

  function guestTotalLine() {
    if (activity.pricing.per === "person") {
      return state.party + (state.party === 1 ? " person × " : " people × ") + fmtMoney(duration.price) + " = " + fmtMoney(totalPrice());
    }
    return fmtMoney(totalPrice()) + " for the booking, up to " + activity.people.max + " people";
  }

  function renderGuestRow(i) {
    var outcome = guestOutcome(i);
    var ans = state.answers[i] || {};
    var ageQ = CFG.screening.questions.find(function (q) { return q.id === "age"; });
    var waterQ = CFG.screening.questions.find(function (q) { return q.id === "water"; });
    var flags = "";
    if (outcome === "fail") {
      var failQ = screeningFor(i).find(function (r) { return r.outcome === "fail"; });
      flags = '<div class="bk-flag bk-flag--fail"><span class="bk-flag__icon">×</span><span>' + failQ.q.fail.title + '. ' + failQ.q.fail.body + '</span></div>';
    } else if (outcome === "warn") {
      flags = '<div class="bk-flag bk-flag--warn"><span class="bk-flag__icon">i</span><span>' + ageQ.consentLabel + '</span></div>';
    } else if (outcome === "pass") {
      flags = '<div class="bk-flag bk-flag--pass"><span class="bk-flag__icon">✓</span><span>Looks good</span></div>';
    }
    var needsConsent = ans.age !== undefined && ans.age !== "" && Number(ans.age) < ageQ.consentBelow;
    return '<div class="bk-guest-row" data-outcome="' + outcome + '" data-guest="' + i + '">' +
      '<p class="mono">Guest ' + (i + 1) + '</p>' +
      '<label>' + ageQ.label + '<input type="number" min="' + ageQ.valid.min + '" max="' + ageQ.valid.max + '" data-field="age" data-guest="' + i + '" value="' + (ans.age || "") + '" /></label>' +
      '<label>' + waterQ.label + '<span><button type="button" class="bk-chip" data-field="water" data-value="true" data-guest="' + i + '" aria-pressed="' + (ans.water === true) + '">Yes</button> ' +
      '<button type="button" class="bk-chip" data-field="water" data-value="false" data-guest="' + i + '" aria-pressed="' + (ans.water === false) + '">No</button></span></label>' +
      '<div id="bkGuestDynamic_' + i + '">' +
      (needsConsent ? '<label class="bk-consent"><input type="checkbox" data-field="consent" data-guest="' + i + '" ' + (ans.consent ? "checked" : "") + ' /><span>' + ageQ.consentLabel + '</span></label>' : '') +
      flags +
      '</div></div>';
  }

  // Updates only the flag/consent area and the Continue button for one guest,
  // so typing an age never rebuilds (and never steals focus from) the input itself.
  function updateGuestDynamic(container, i) {
    var row = container.querySelector('.bk-guest-row[data-guest="' + i + '"]');
    if (!row) return;
    var outcome = guestOutcome(i);
    row.setAttribute("data-outcome", outcome);
    var ageQ = CFG.screening.questions.find(function (q) { return q.id === "age"; });
    var ans = state.answers[i] || {};
    var needsConsent = ans.age !== undefined && ans.age !== "" && Number(ans.age) < ageQ.consentBelow;
    var flags = "";
    if (outcome === "fail") {
      var failQ = screeningFor(i).find(function (r) { return r.outcome === "fail"; });
      flags = '<div class="bk-flag bk-flag--fail"><span class="bk-flag__icon">×</span><span>' + failQ.q.fail.title + '. ' + failQ.q.fail.body + '</span></div>';
    } else if (outcome === "warn") {
      flags = '<div class="bk-flag bk-flag--warn"><span class="bk-flag__icon">i</span><span>' + ageQ.consentLabel + '</span></div>';
    } else if (outcome === "pass") {
      flags = '<div class="bk-flag bk-flag--pass"><span class="bk-flag__icon">✓</span><span>Looks good</span></div>';
    }
    var dynamic = row.querySelector('#bkGuestDynamic_' + i);
    dynamic.innerHTML = (needsConsent ? '<label class="bk-consent"><input type="checkbox" data-field="consent" data-guest="' + i + '" ' + (ans.consent ? "checked" : "") + ' /><span>' + ageQ.consentLabel + '</span></label>' : '') + flags;
    var cb = dynamic.querySelector('[data-field="consent"]');
    if (cb) cb.addEventListener("change", function () {
      state.answers[i].consent = cb.checked;
      updateGuestDynamic(container, i);
    });
    var totalLine = container.querySelector(".bk-total");
    if (totalLine) totalLine.textContent = guestTotalLine();
    var continueBtn = container.querySelector("#bkGuestsContinue");
    if (continueBtn) {
      var allOk = Array.from({ length: state.party }, function (_, n) { return guestOutcome(n); }).every(function (o) { return o === "pass"; });
      continueBtn.disabled = !allOk;
    }
  }

  function wireGuests(container, max) {
    var minus = container.querySelector("#bkGuestMinus");
    var plus = container.querySelector("#bkGuestPlus");
    if (minus) minus.disabled = state.party <= activity.people.min;
    if (plus) plus.disabled = state.party >= max;
    if (minus) minus.addEventListener("click", function () { if (state.party > activity.people.min) { state.party--; renderGuests(container); } });
    if (plus) plus.addEventListener("click", function () { if (state.party < max) { state.party++; renderGuests(container); } });

    container.querySelectorAll('[data-field="age"]').forEach(function (input) {
      input.addEventListener("input", function () {
        var i = +input.dataset.guest;
        state.answers[i] = state.answers[i] || {};
        state.answers[i].age = input.value;
        updateGuestDynamic(container, i);
      });
    });
    container.querySelectorAll('[data-field="water"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = +btn.dataset.guest;
        state.answers[i] = state.answers[i] || {};
        state.answers[i].water = btn.dataset.value === "true";
        container.querySelectorAll('[data-field="water"][data-guest="' + i + '"]').forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn);
        });
        updateGuestDynamic(container, i);
      });
    });
    container.querySelectorAll('[data-field="consent"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        var i = +cb.dataset.guest;
        state.answers[i] = state.answers[i] || {};
        state.answers[i].consent = cb.checked;
        updateGuestDynamic(container, i);
      });
    });
    var continueBtn = container.querySelector("#bkGuestsContinue");
    if (continueBtn) continueBtn.addEventListener("click", function () {
      state.completed[2] = true;
      goToStep(3);
    });
  }

  // ---------- Step 3: Details ----------
  function renderDetails(container) {
    if (state.step > 3 && state.completed[3]) {
      container.innerHTML = recapHTML("Details", state.details.name, 3);
      return;
    }
    container.hidden = false;
    var d = state.details;
    container.innerHTML = '<h2>Your details</h2>' +
      '<div class="bk-error-summary" id="bkErrorSummary"><p class="mono">Please fix the following</p></div>' +
      field("name", "Full name", "text", d.name) +
      field("email", "Email", "email", d.email) +
      field("mobile", "Mobile", "tel", d.mobile) +
      '<div class="bk-field"><label class="bk-field__label" for="bkNotes">' + CFG.copy.notesPlaceholder + ' (optional)</label>' +
      '<textarea id="bkNotes" rows="3">' + (d.notes || "") + '</textarea>' +
      '<p class="bk-field__hint">' + CFG.copy.notesHint + '</p></div>' +
      '<div class="bk-field"><label class="bk-field__label" for="bkAccess">Accessibility or access needs (optional)</label>' +
      '<textarea id="bkAccess" rows="2">' + (d.access || "") + '</textarea>' +
      '<p class="bk-field__hint">Tell the business anything that helps them prepare.</p></div>' +
      '<input class="bk-honeypot" type="text" id="bkHoneypot" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '<div style="margin-top:16px;"><button type="button" class="bk-pay-btn" id="bkDetailsContinue">' + CFG.copy.ui.en.continue + '</button></div>';
    wireDetails(container);
  }

  function field(key, label, type, value) {
    return '<div class="bk-field" id="bkField_' + key + '"><label class="bk-field__label" for="bk_' + key + '">' + label + '</label>' +
      '<input id="bk_' + key + '" type="' + type + '" value="' + (value || "") + '" />' +
      '<p class="bk-field__error" id="bkErr_' + key + '"></p></div>';
  }

  function validateDetails(container) {
    var ui = CFG.copy.ui.en;
    var errors = [];
    var name = container.querySelector("#bk_name").value.trim();
    var email = container.querySelector("#bk_email").value.trim();
    var mobile = container.querySelector("#bk_mobile").value.trim();
    if (!name) errors.push({ key: "name", msg: ui.errRequired.replace("{field}", "name") });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ key: "email", msg: ui.errEmail });
    if (!mobile || !/^\+?\d[\d\s]{6,}$/.test(mobile)) errors.push({ key: "mobile", msg: ui.errMobile });

    ["name", "email", "mobile"].forEach(function (key) {
      var f = container.querySelector("#bkField_" + key);
      f.classList.remove("has-error");
      container.querySelector("#bk_" + key).classList.remove("err");
    });
    var summary = container.querySelector("#bkErrorSummary");
    if (errors.length) {
      errors.forEach(function (e) {
        var f = container.querySelector("#bkField_" + e.key);
        f.classList.add("has-error");
        container.querySelector("#bk_" + e.key).classList.add("err");
        container.querySelector("#bkErr_" + e.key).textContent = e.msg;
      });
      summary.classList.add("show");
      summary.innerHTML = '<p class="mono">Please fix the following</p>' + errors.map(function (e) {
        return '<a href="#bk_' + e.key + '">' + e.msg + '</a>';
      }).join("");
      container.querySelector("#bk_" + errors[0].key).focus();
      return false;
    }
    summary.classList.remove("show");
    state.details = { name: name, email: email, mobile: mobile, notes: container.querySelector("#bkNotes").value.trim(), access: container.querySelector("#bkAccess").value.trim() };
    return true;
  }

  function wireDetails(container) {
    ["name", "email", "mobile"].forEach(function (key) {
      container.querySelector("#bk_" + key).addEventListener("blur", function () { validateDetails(container); });
    });
    container.querySelector("#bkDetailsContinue").addEventListener("click", function () {
      if (container.querySelector("#bkHoneypot").value) return; // bot trap, silently stop
      if (!validateDetails(container)) return;
      state.completed[3] = true;
      track("details_complete", { experience_id: activity.id });
      goToStep(4);
    });
  }

  // ---------- Step 4: Pay ----------
  function renderPay(container) {
    container.hidden = false;
    var owner = CFG.business.owner;
    var ui = CFG.copy.ui.en;
    var amount = fmtMoney(totalPrice());
    container.innerHTML = '<h2>Review and request</h2>' +
      '<div class="bk-policy"><p>' + CFG.policies.cancellation.rules.slice(0, 2).join(" ") + '</p>' +
      '<a href="#bkCancellationPolicy">Cancellation policy</a></div>' +
      '<div class="bk-reassure">' + CFG.copy.eligibilityConfirm + '</div>' +
      '<button type="button" class="bk-pay-btn" id="bkPayBtn">' + ui.payBtn.replace("{amount}", amount) + '</button>' +
      '<p class="bk-pay-note">' + ui.payNote.replace("{owner}", owner).replace(/{owner}/g, owner).replace("{hours}", CFG.booking.responseHours) + '</p>' +
      '<p class="bk-pay-note">' + ui.payTo.replace("{business}", CFG.business.name) + '</p>' +
      '<div class="bk-demo-box"><span class="example-badge">DEMO</span><p>Stripe test mode. Use card 4242 4242 4242 4242, any future date, any CVC. No real money moves.</p></div>' +
      '<div id="bkCancellationPolicy" style="margin-top:20px;font-size:13px;color:rgba(23,23,26,.70);">' +
      '<ul>' + CFG.policies.cancellation.rules.map(function (r) { return "<li>" + r + "</li>"; }).join("") + '</ul>' +
      '<p>' + CFG.policies.cancellation.footnote + '</p></div>';
    container.querySelector("#bkPayBtn").addEventListener("click", function () {
      track("checkout_start", { experience_id: activity.id, price_aud: totalPrice() });
      var box = container.querySelector(".bk-demo-box");
      box.innerHTML = '<span class="example-badge">DEMO</span><p>Not connected yet. Stripe Checkout is wired up in Phase 5 of the booking build.</p>';
    });
  }

  function recapHTML(label, text, step) {
    return '<div class="bk-step__recap"><span class="bk-step__recap-text"><strong>' + label + ':</strong> ' + text + '</span>' +
      '<button type="button" class="bk-step__change" data-recap-step="' + step + '">Change</button></div>';
  }

  function wireRecaps() {
    root.querySelectorAll("[data-recap-step]").forEach(function (btn) {
      btn.addEventListener("click", function () { goToStep(+btn.dataset.recapStep); });
    });
  }

  function renderSummary() {
    var sideEl = document.getElementById("bkSummary");
    var mobileEl = document.getElementById("bkMobileBar");
    var lines = '';
    if (state.date) lines += '<div class="bk-summary__line"><span>Date</span><span>' + fmtDate(state.date) + (state.slot ? ", " + state.slot : "") + '</span></div>';
    lines += '<div class="bk-summary__line"><span>Guests</span><span>' + state.party + '</span></div>';
    var total = '<div class="bk-summary__total"><span>Total</span><span>' + fmtMoney(totalPrice()) + '</span></div>';
    if (sideEl) {
      sideEl.innerHTML = '<div class="bk-summary__head"><span class="mono">Your booking</span><span class="example-badge">EXAMPLE</span></div>' +
        lines + total + '<p class="bk-field__hint">All prices in AUD</p>';
    }
    if (mobileEl) {
      mobileEl.innerHTML = '<div class="bk-mobile-bar__row"><span>' + state.party + ' · ' + (state.slot || "Pick a time") + '</span><strong>' + fmtMoney(totalPrice()) + '</strong></div>';
    }
  }

  function render() {
    renderProgress();
    renderTime(document.getElementById("bkStepTime"));
    renderGuests(document.getElementById("bkStepGuests"));
    renderDetails(document.getElementById("bkStepDetails"));
    renderPay(document.getElementById("bkStepPay"));
    [1, 2, 3, 4].forEach(function (n) {
      var stepEl = document.getElementById(["bkStepTime", "bkStepGuests", "bkStepDetails", "bkStepPay"][n - 1]);
      stepEl.hidden = n > state.step;
    });
    wireRecaps();
    renderSummary();
  }

  track("experience_view", { experience_id: activity.id, price_aud: totalPrice() });
  render();
})();
