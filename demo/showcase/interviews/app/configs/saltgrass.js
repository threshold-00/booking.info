// Saltgrass Trail Rides: a made-up horse trail operator on the Mornington Peninsula, Victoria,
// for the 13 Oct interview prototypes. Plainly fictional, checked 12 Oct 2026 against a web
// search turning up real Peninsula operators (Gunnamatta Trail Rides, The Ranch) but nothing
// called Saltgrass. Weight, experience and age screening mirrors the proven Salty Cowboy shape,
// since screening is the thing these interviews test. Every price below is a round AUD
// placeholder, listed in the build report, not a commercial fact.
// Load demo-theme.js first. Plain data: nothing here runs, so Phase 3's Apps Script can read it.
//
// Imagery: time pressure (interviews start Tue morning) meant skipping a real photo download and
// resize pass. Images below are small inline SVG placeholders, not hotlinked and not real photos.
// Logged in the build report as a cut; swap for credited Unsplash beach/bush JPEGs later.
//
// Deposit gap: the schema has no percentage-deposit field (payment charges the full displayed
// total). Worked around by setting durations[].price to the 30% deposit amount itself and saying
// so in the activity description and confirmation copy, so the checkout screen, which only ever
// shows one number, shows the deposit. Logged in the build report as a config gap.

const LOGO = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="396" height="92" viewBox="0 0 396 92">' +
  '<rect width="396" height="92" fill="none"/>' +
  '<text x="198" y="46" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" font-weight="500" letter-spacing="2" fill="#17171a">SALTGRASS</text>' +
  '<text x="198" y="72" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="14" letter-spacing="6" fill="#17171a" fill-opacity="0.65">TRAIL RIDES</text>' +
  '</svg>'
);
function swatch(label, tone) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
    '<rect width="800" height="600" fill="' + tone + '"/>' +
    '<text x="400" y="310" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" letter-spacing="2" fill="#f3f2ee" fill-opacity="0.85">' + label + '</text>' +
    '</svg>'
  );
}
const IMG_BEACH = swatch("BEACH RIDE", "#8a8370");
const IMG_BUSH = swatch("BUSH TRAIL", "#5c6650");

window.THRESHOLD_CONFIG = {
  schemaVersion: 2,
  a11y: true,

  business: {
    id: "saltgrass",
    name: "Saltgrass Trail Rides",
    legalName: "Saltgrass Trail Rides",
    owner: "the Saltgrass team",
    refPrefix: "SG",
    timezone: "Australia/Melbourne",
    demo: true,
    seo: { title: "Saltgrass Trail Rides · Book your ride", description: "A Threshold booking page for a made-up Mornington Peninsula trail ride operator. Experience, weight and age screening before the slot is confirmed." },
    languages: { default: "en", available: ["en"], operatorMessage: "en" },
    links: [],
    contact: { whatsapp: null, operatorEmail: null }
  },

  theme: { ...DEMO_THEME, logo: LOGO },

  categories: [
    {
      id: "rides",
      name: "Trail rides",
      intro: "Beach and bush rides on the Mornington Peninsula. Tell us a bit about yourself so we can match you to the right ride and horse.",
      participantNoun: "Rider",
      bookOnBehalf: false
    }
  ],

  activities: [
    {
      id: "beach_ride",
      category: "rides",
      confirmationType: "ride",
      name: "Beach ride",
      desc: "An hour and a half along the beach, for riders confident at a trot or better. AUD 36 shown here is the 30% deposit, balance due on the day.",
      groupNote: "1 to 4 riders",
      priceNote: "per rider, deposit only",
      image: IMG_BEACH,
      imagePosition: "center",
      people: { min: 1, max: 4 },
      pricing: { per: "person" },
      durations: [{ id: "1.5hr", label: "1.5 hr", hours: 1.5, price: 36 }],
      guided: true
    },
    {
      id: "bush_trail",
      category: "rides",
      confirmationType: "ride",
      name: "Bush trail",
      desc: "An hour through the bush trails, beginners welcome. AUD 21 shown here is the 30% deposit, balance due on the day.",
      groupNote: "1 to 4 riders",
      priceNote: "per rider, deposit only",
      image: IMG_BUSH,
      imagePosition: "center",
      people: { min: 1, max: 4 },
      pricing: { per: "person" },
      durations: [{ id: "1hr", label: "1 hr", hours: 1, price: 21 }],
      guided: true
    }
  ],

  screening: {
    questions: [
      {
        id: "experience",
        type: "choice",
        label: "Riding experience",
        short: "experience",
        appliesTo: { all: true },
        required: true,
        logAs: "experience",
        options: [
          { value: "never", label: "Never ridden", outcome: "pass" },
          { value: "few", label: "A few times", outcome: "pass" },
          { value: "regular", label: "Ride regularly", outcome: "pass" }
        ],
        rule: { minValue: { default: "never", beach_ride: "regular" } },
        fail: {
          title: "Beach ride needs some experience",
          body: "Beach ride needs some experience, so it's not shown. The Bush trail runs the same day and welcomes beginners.",
          action: { label: "See the Bush trail", toActivity: "bush_trail" }
        }
      },
      {
        id: "weight",
        type: "choice",
        label: "Weight",
        short: "weight",
        appliesTo: { all: true },
        required: true,
        logAs: "weight",
        options: [
          { value: "under70", label: "Under 70 kg", outcome: "pass" },
          { value: "70_95", label: "70 to 95 kg", outcome: "pass" },
          { value: "over95", label: "Over 95 kg", outcome: "fail",
            message: { title: "Over our horses' limit", body: "Our horses' limit is 95 kg. We can't take a heavier rider on this ride." } }
        ]
      },
      {
        id: "age",
        type: "choice",
        label: "Age",
        short: "age",
        appliesTo: { all: true },
        required: true,
        logAs: "age",
        options: [
          { value: "under8", label: "Under 8", outcome: "fail",
            message: { title: "Minimum age is 8", body: "Riders need to be at least 8 years old for this ride." } },
          { value: "8_15", label: "8 to 15", outcome: "flag",
            message: { title: "A parent or guardian signs the waiver", body: "Riders 8 to 15 can ride, but a parent or guardian signs the waiver on the day." },
            operatorNote: "parent or guardian signs the waiver" },
          { value: "16plus", label: "16 and over", outcome: "pass" }
        ]
      },
      {
        id: "pregnant",
        type: "boolean",
        label: "Are you currently pregnant?",
        short: "pregnant",
        appliesTo: { all: true },
        required: true,
        outcomes: { true: "fail", false: "pass" },
        fail: { title: "Not able to ride", body: "For safety, we can't take pregnant riders on a trail ride." }
      },
      {
        id: "conditions",
        type: "boolean",
        label: "Any injury or condition the guide should know about?",
        short: "injury or condition",
        appliesTo: { all: true },
        required: true,
        outcomes: { true: "flag", false: "pass" },
        flag: { prompt: "Thanks for telling us, your guide will know before you arrive.", operatorNote: "flagged an injury or condition for the guide" }
      }
    ]
  },

  addons: [],

  availability: {
    mode: "static",
    defaults: { openWeekdays: [0, 1, 2, 3, 4, 5, 6], morningOnlyWeekdays: [], morningBefore: 12, allowPast: false },
    activities: {
      beach_ride: { slots: ["7:00am", "9:30am"], capacity: 6 },
      bush_trail: { slots: ["8:00am", "10:30am", "1:00pm", "3:00pm"], capacity: 8 }
    },
    static: {
      horizonDays: 45,
      leadTimeHours: 12,
      blackoutDates: [],
      booked: [
        { activity: "bush_trail", nextWeekday: 6, weeksAfter: 0, slot: "10:30am", seats: 5 },
        { activity: "beach_ride", nextWeekday: 6, weeksAfter: 0, slot: "7:00am", seats: 6 }
      ]
    }
  },

  booking: { contact: { email: "optional", phone: "off" }, prefill: { email: "demo@example.com" } },

  payment: {
    provider: "demo",
    mode: "on_booking",
    currency: "AUD",
    demo: { testCard: "4242 4242 4242 4242", expiry: "12/34", cvc: "123", payDelayMs: 1200, label: "Demo. No charge is made." }
  },

  confirmation: {
    types: {
      ride: {
        title: "Your ride",
        address: "Saltgrass Trail Rides, Mornington Peninsula, Vic [placeholder address]",
        mapsLink: "[placeholder map link]",
        bring: "Closed shoes with a small heel, and a jacket if it's cool. Helmets provided. [placeholder]",
        arrival: "15 minutes before your ride, for a safety briefing and a weight and fit check. [placeholder]"
      }
    },
    email: {
      subject: "Booking confirmed: {activity}, {date}",
      body: "Hi,\n\nYour booking with {business} is confirmed.\n\n{summary}\n\n{typeBlock}\n\nSee you soon,\n{business}"
    },
    operatorNotice: "New booking {ref}: {activity}, {date} {time}, {party} people, {amount} paid. {flags}"
  },

  copy: {
    hero: { title: "Book your ride", sub: "Beach and bush trail rides on the Mornington Peninsula" },
    notice: "Your booking is confirmed as soon as the deposit is paid.",
    notesPlaceholder: "Anything your guide should know?",
    notesHint: "If the times don't suit, or you have an extra request, tell us here.",
    ui: {
      en: { sendBtn: "Continue to payment →" }
    }
  },

  endpoints: {
    log: { url: "", schemaVersion: 2 },
    calendar: null,
    source: "web"
  }
};
