// Example Surf School (Demo). FICTIONAL business and owner, for the Threshold demo only.
// Example values, not advice to real businesses. Load demo-theme.js first.
// Fields marked NEW extend schemaVersion 2; all are optional (see docs/config-schema.md).
window.THRESHOLD_CONFIG = {
  schemaVersion: 2,
  a11y: true,
  business: {
    id: "example-surf-school",
    name: "Example Surf School (Demo)",
    legalName: "Example Surf School (Demo)",
    owner: "Jo Example",
    refPrefix: "EX",
    timezone: "Australia/Melbourne",
    demo: true,
    region: "mornington", // NEW
    location: "Mornington Peninsula, Victoria (example location)", // NEW
    ownerBio: "Run by Jo Example, who has taught surfing here for 12 years. (Fictional owner.)", // NEW
    seo: {
      title: "Demo: Surf lessons on the Mornington Peninsula | Threshold",
      description: "Example listing showing how booking works on Threshold. Small-group and private surf lessons, boards and wetsuits included."
    },
    languages: { default: "en", available: ["en"], operatorMessage: "en" },
    links: [],
    contact: { whatsapp: null, operatorEmail: null, notifyEmail: "FROM_DEMO_EMAIL_ALLOWLIST" } // NEW notifyEmail, set server-side, never a real business address
  },
  theme: { ...DEMO_THEME },
  categories: [
    { id: "lessons", name: "Surf lessons",
      intro: "Example Surf School runs small-group and private surf lessons on the Peninsula's ocean beaches. Lessons suit complete beginners through to improving surfers. Boards and wetsuits are included. You'll learn with the owner, in groups of no more than six.",
      participantNoun: "Surfer", bookOnBehalf: false }
  ],
  activities: [
    { id: "group", category: "lessons", confirmationType: "lesson", name: "Beginner group lesson",
      desc: "Your first time on a board. Beach safety, paddling and standing up, in a group of up to six.",
      includes: "Board and wetsuit", groupNote: "Up to 6 people. Price is per person.",
      people: { min: 1, max: 6 }, pricing: { per: "person" },
      durations: [{ id: "2hr", label: "2 hr", hours: 2, price: 95 }] },
    { id: "private_1", category: "lessons", confirmationType: "lesson", name: "Private lesson",
      desc: "One-on-one coaching at your pace. Good for nervous starters or anyone wanting quick progress.",
      includes: "Board and wetsuit", groupNote: "Just you and the coach.",
      people: { min: 1, max: 1 }, pricing: { per: "booking" },
      durations: [{ id: "1.5hr", label: "1.5 hr", hours: 1.5, price: 180 }] },
    { id: "private_2", category: "lessons", confirmationType: "lesson", name: "Private lesson for two",
      desc: "Private coaching for two people at your pace. Good for nervous starters or anyone wanting quick progress.",
      includes: "Boards and wetsuits", groupNote: "2 people. Price is for both of you.",
      people: { min: 2, max: 2 }, pricing: { per: "booking" },
      durations: [{ id: "1.5hr", label: "1.5 hr", hours: 1.5, price: 250 }] },
    { id: "weekend", category: "lessons", confirmationType: "lesson", name: "Weekend surf course",
      desc: "Two 2-hour sessions over Saturday and Sunday. Go from first wave to riding unassisted across two days.",
      includes: "Board and wetsuit for both sessions", groupNote: "Up to 6 people. Price is per person for the whole course.",
      people: { min: 1, max: 6 }, pricing: { per: "person" },
      durations: [{ id: "2hr", label: "2 days, 4 hr total", hours: 2, price: 170 }],
      multiDay: {
        days: 2,
        weekdays: [6, 7], // Saturday, then Sunday as Monday + 6 (engine counts from Monday). Check with Ro, open question.
        withinOneWeek: true, bookAsWeek: true,
        slotLabel: "Sat & Sun 9:00am",
        fixedTimes: [ { day: "Saturday", time: "9:00am - 11:00am" }, { day: "Sunday", time: "9:00am - 11:00am" } ],
        operatorLine: "Course runs Sat 9:00am-11:00am and Sun 9:00am-11:00am, same weekend",
        copy: {
          pick: "Tap a Saturday or Sunday to book that whole weekend",
          daysSelected: "of 2 days selected", daysTitle: "Your course days",
          weekNote: "The course runs Saturday and Sunday of the same weekend.",
          sessionNote: "Two 2-hour sessions, one each day.",
          customTimes: "These are the usual course times. Need something different? Message the business."
        }
      },
      messageDuration: "2 hr/day" }
  ],
  screening: { questions: [
    { id: "age", type: "number", label: "Age", placeholder: "Years", unit: "years", placement: "beside-name",
      appliesTo: { all: true }, required: true, valid: { min: 1, max: 119 }, rule: { min: 10 },
      fail: { title: "Lessons are for ages 10 and up", body: "Please check the age entered, or message the business about other options." },
      consentBelow: 16,
      consentLabel: "I'm this surfer's parent or guardian, and I'm making this booking for them (under 16).",
      consentOperatorText: "(parent or guardian booking confirmed)",
      operatorTemplate: "age {v}", messageOrder: 0, logAs: "ages" },
    { id: "water", type: "boolean", label: "Comfortable in the water?", short: "comfortable in the water",
      appliesTo: { all: true }, required: true, outcomes: { true: "pass", false: "fail" },
      fail: { title: "You'll need to be comfortable in the water", body: "Everyone in the lesson needs to be comfortable in the water. Not sure? Message the business before you book." },
      messageOrder: 1, logAs: "water_confident" }
  ] },
  addons: [],
  availability: {
    mode: "static", // switches to the availability API in Phase 3
    defaults: { openWeekdays: [0, 1, 2, 3, 4, 5, 6], morningOnlyWeekdays: [], morningBefore: 12, allowPast: false },
    activities: {
      group: { slots: ["9:00am"], capacity: 6 },
      private_1: { slots: ["9:00am"] },
      private_2: { slots: ["9:00am"] },
      weekend: { openWeekdays: [0, 6], slots: ["Sat & Sun 9:00am"], capacity: 6 }
    },
    static: { horizonDays: 90, leadTimeHours: 24, blackoutDates: [], booked: [] }
  },
  booking: {
    contact: { email: "required", phone: "required" }, prefill: null,
    confirmMode: "request", // NEW: the business confirms every booking
    responseHours: 24 // NEW: must stay under 168 (card authorisation window)
  },
  payment: {
    provider: "stripe_connect", // NEW value (was "demo")
    testMode: true, // NEW
    platformFeeBps: 0, // NEW: 0 while Threshold is free for businesses; server value wins
    mode: "authorise_then_capture", // NEW value: card authorised at request, charged when the business confirms
    currency: "AUD",
    currencySymbol: "$" // NEW: show "$95", with "All prices in AUD" once in the summary
  },
  policies: { // NEW
    cancellation: {
      rules: [
        "Cancel more than 48 hours before: full refund.",
        "Cancel within 48 hours: no refund, but you can move to another time once.",
        "If the business cancels for weather or safety: you choose a new time or a full refund."
      ],
      footnote: "Each business sets its own policy. This one is an example. Your rights under Australian Consumer Law still apply."
    },
    weather: "The owner checks conditions the morning of your lesson. If it isn't suitable, they'll move you to another time or give you a full refund."
  },
  faq: [ // NEW
    { q: "Do I need any experience?", a: "No. The group lesson and weekend course are built for first-timers." },
    { q: "What should I bring?", a: "Swimwear, a towel, sunscreen and water. We supply the board and wetsuit." },
    { q: "Where do we meet?", a: "At the beach car park. You'll get the exact spot in your confirmation, because it changes with the conditions." },
    { q: "What if the surf's bad?", a: "The owner checks conditions the morning of your lesson. If it isn't suitable, they'll move you to another time or give you a full refund." },
    { q: "Can I book for a group or a gift?", a: "Yes. Message the business for groups of more than six, or to arrange a gift." },
    { q: "How many people are in a group lesson?", a: "Six at most." }
  ],
  confirmation: {
    types: { lesson: {
      title: "Your lesson",
      address: "Beach car park, Mornington Peninsula (example location). The business will send the exact spot, because it changes with the conditions.",
      mapsLink: "",
      bring: "Swimwear, a towel, sunscreen and water. Boards and wetsuits are supplied.",
      arrival: "Please arrive 15 minutes before your lesson." // example value, Ro to confirm
    } },
    email: { subject: "You're booked: {activity}, {date}", body: "See APPENDIX 2 booking_confirmed" },
    operatorNotice: "New booking request through Threshold {ref}: {activity}, {date} {time}, {party} people, {amount}. {flags}",
    reminders: { customer: { hoursBefore: 24 }, business: { localTime: "07:00" } } // NEW
  },
  copy: {
    hero: { title: "Learn to surf on the Mornington Peninsula", sub: "Small-group and private surf lessons. Boards and wetsuits included." },
    demoBanner: "Demo listing. This is an example business to show how booking works. It isn't real and you can't book it.",
    notice: "Times are set by the business.",
    notesPlaceholder: "Anything the business should know?",
    notesHint: "If the times don't suit, or you have an extra request, tell the business here.",
    eligibilityConfirm: "Everyone in your group is 10 or older and comfortable in the water.", // NEW
    ui: { en: {
      stepHeading1: "Choose a time", numPeople: "How many people?", continue: "Continue",
      notesLabel: "Anything the business should know? (optional)", slotTaken: "Full", seatsLeft: "{n} places left",
      payTitle: "Your details", payEmailLabel: "Email", payPhoneLabel: "Mobile",
      payBtn: "Request booking · {amount}", // authorise now, charge on confirm
      payNote: "Your card is authorised now and only charged if {owner} confirms. {owner} replies within {hours} hours. You'll get an email either way.",
      payTo: "Your payment goes to {business} through Threshold.",
      sentTitle: "Request sent.", paidTitle: "You're booked.", paidSub: "We've emailed the details to {email}.",
      addToCalendar: "Add to calendar",
      dateLabel: "Date", emptyDay: "No lessons on this day. Try another date.", overCapacity: "Only {n} places left at this time.",
      errRequired: "Please add your {field}.", errEmail: "That email doesn't look right. Check it and try again.",
      errMobile: "Please enter a mobile number, like 0412 345 678.", errSlotTaken: "Someone just booked that time. Pick another one.",
      errCardDeclined: "Your card wasn't accepted. Try another card or check with your bank. You haven't been charged.",
      errGeneral: "Something went wrong on our end. Nothing's been booked. Please try again."
    } }
  },
  endpoints: { log: { url: "", schemaVersion: 2 }, calendar: null, source: "web" }
};
