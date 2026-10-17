# THRESHOLD_CONFIG schema

`window.THRESHOLD_CONFIG` is read by the booking engine (currently `demo/phones/index.html`, soon `assets/booking/booking.js`). This document describes `schemaVersion: 2` as it exists today, then the new optional fields added for the booking demo. Every new field is optional: `demo/phones/configs/salty-cowboy.js` is unchanged and keeps working exactly as before.

Load order: a theme object (for example `demo-theme.js`, which defines `const DEMO_THEME`) must load before a config file that spreads it with `theme: { ...DEMO_THEME }`.

## Existing shape (schemaVersion 2)

```
business: {
  id, name, legalName, owner, refPrefix, timezone, demo,
  seo: { title, description },
  languages: { default, available, operatorMessage },
  links: [{ url, label }],
  contact: { whatsapp: { number, display } | null, operatorEmail }
}
theme: { colours, fonts, type, radius }
categories: [{ id, name, intro, participantNoun, bookOnBehalf }]
activities: [{
  id, category, confirmationType, name, desc, includes, groupNote, image, gallery,
  people: { min, max },
  pricing: { per: "person" | "booking" | "unit", unit, unitPlural, maxUnits },
  durations: [{ id, label, hours, price }],
  multiDay: { days, weekdays, fixedTimes, slotLabel, copy },
  messageDuration
}]
screening: {
  questions: [{
    id, type: "number" | "choice" | "boolean", label, appliesTo,
    outcome: "pass" | "warn" | "flag" | "fail", maxPerBooking,
    consentBelow, consentLabel
    // per-activity overrides supported
  }]
}
addons: []
booking: { contact: { email, phone: "required" | "optional" | "off" } }
availability: {
  mode: "manual" | "static",
  defaults: { openWeekdays, morningOnlyWeekdays, morningBefore, allowPast },
  activities: { [id]: { slots, openWeekdays?, capacity? } },
  static: { horizonDays, leadTimeHours, blackoutDates, booked }
}
payment: { provider: "none" | "demo", mode, currency }
confirmation: {
  types: { [type]: { title, address, mapsLink, bring, arrival } },
  email: { subject, body },
  operatorNotice
}
copy: { ... }
endpoints: { log, calendar, source }
```

## New optional fields (added for the booking demo)

All of these are additive. A config that omits every one of them behaves exactly as before.

| Field | Type | Notes |
| --- | --- | --- |
| `business.location` | string | Display line under the business name, e.g. "Mornington Peninsula, Victoria (example location)". |
| `business.ownerBio` | string | One-line owner bio shown on the listing page. |
| `business.contact.notifyEmail` | string | Where business-facing emails go. Set server-side from config, never hardcoded to a real address for demo businesses. |
| `booking.confirmMode` | `"request"` | The business confirms every booking (request-to-book model). |
| `booking.responseHours` | number | How long the business has to respond. Must stay under 168 (Stripe's 7-day card authorisation window). |
| `payment.provider` | `"stripe_connect"` | New value alongside the existing `"none" \| "demo"`. |
| `payment.platformFeeBps` | number | Threshold's commission in basis points. The server-side value always wins over this display value. |
| `payment.testMode` | boolean | Whether this business's Stripe integration is in test mode. |
| `payment.mode` | `"authorise_then_capture"` | New value: the card is authorised at request time and only captured when the business confirms. |
| `payment.currencySymbol` | string | Display symbol, e.g. `"$"`. |
| `policies.cancellation` | `{ rules: string[], footnote: string }` | Shown before payment. Every policy is capped by the ACL floor: a business cancellation always gets a full refund or an agreed new time. |
| `policies.weather` | string | Weather/safety contingency copy. |
| `faq` | `[{ q, a }]` | Rendered as an accordion on the listing page. |
| `confirmation.reminders` | `{ customer: { hoursBefore }, business: { localTime } }` | Reminder timing, used by the Phase 6 reminders cron. |
| `copy.eligibilityConfirm` | string | Reassurance line shown just above the Pay button. |
| `copy.ui.en.payBtn`, `payNote`, `payTo`, `sentTitle`, `paidTitle`, `paidSub`, `addToCalendar`, `errCardDeclined`, `errSlotTaken`, `errGeneral` | strings | New UI copy keys for the request-to-book and payment flow. |

See `demo/surf/config.js` for a complete example using every new field.
