# Threshold build brief: homepage search and filters, Salty Cowboy activity cards, activity detail pages

From Ro, 17 Oct 2026. Repo: threshold-00/booking.info (static site, GitHub Pages, no build in deploy). Do the phases in order, and stop after each phase to show me the result.

## Global rules
- Read CLAUDE.md first and follow it.
- No em dashes anywhere: code, copy, comments, commits.
- Say "businesses", never "operators".
- Use only the :root tokens: --ink, --paper, --panel, --cleared, --line, --display, --mono, --s-1 to --s-9, --r-pill. No new hexes, fonts, radii or shadows. Keep the existing look: square corners, 1px var(--line) borders, var(--cleared) prices.
- Add new CSS at the end of styles.css under a section comment. Don't edit existing rule values unless a phase says so.
- One breakpoint: max-width:820px. Test at 375px and at desktop.
- Make targeted patches. Don't rewrite whole files.
- Never invent data. Leave a field empty if there's no source.
- Don't commit or push. Don't delete any page or file. Anything in "Show Ro before changing" is a list-and-ask, not a do.
- Preview with: `npx browser-sync start --server --files "**/*.html, styles.css, app.js, assets/*.js" --port 3000 --no-notify --no-ghost-mode`

---

## Phase 1: Homepage search, category chips, region toggle (index.html, styles.css, app.js)

1. **Search bar replaces the hero "Find an experience" button** (`#top`, currently `<a href="#browse" class="btn">`).
   - A `<form role="search">` containing:
     - a visible label, "Search experiences" (visually hidden is fine if the placeholder repeats it);
     - an `<input type="search">` with placeholder "Try horse riding, pottery, Bali";
     - a submit button "Search".
   - Inputs and buttons are at least 44px tall, styled with the existing .btn and input styles on the dark hero.
   - Submitting does not reload the page. It filters the cards in #browse, then scrolls smoothly to #browse (instantly under prefers-reduced-motion) and moves focus to the results count.
   - Matching is case-insensitive and checks each card's title, business name, location and category, using `data-` attributes on each card: `data-title`, `data-business`, `data-region`, `data-cat`, `data-keywords`.
2. **Suggested category chips go directly under the search bar.**
   - Markup: `<button class="opt cat-chip" aria-pressed="false" data-cat="...">` with `border-radius:var(--r-pill)`, min-height 44px, the existing `.opt` styling.
   - The chips wrap on desktop. Under 820px they sit in one row that scrolls sideways (`overflow-x:auto; scroll-snap-type:x proximity`).
   - Chip set: restore the earlier version from commit 879bb41d: All, 🐴 Horse riding, 🤿 Dive & snorkel, 🏄 Surf, 🧗 Climbing, 🎨 Creative, 🏍️ Motorbike tours. Add 📸 Photoshoots and 🧭 Lessons, because Salty Cowboy has real listings in those.
   - Only Horse riding, Photoshoots and Lessons have listings today. Show the other chips anyway, since Ro wants them as prompts, but a chip with no cards gives the empty state below. Show Ro before adding any other categories.
   - Clicking a chip toggles it, single-select. "All" clears the category filter.
3. **Region toggle** (the "Victoria, Australia" / "Bali" links in #browse currently go to /mornington-peninsula/ and /bali/).
   - Turn it into an in-page segmented control: `role="radiogroup"` with three `role="radio"` buttons, All · Victoria, Australia · Bali, aria-checked, arrow-key navigation, 44px tall.
   - It filters the cards in place and never navigates.
   - Keep "All" as the default. Victoria has no live listings yet, so a Victoria-only default would show an empty grid.
   - Sync the state to the URL as `?region=bali&cat=horse&q=...` using `history.replaceState`, and read it on load, so links such as breadcrumbs can open a filtered view.
4. **Combine the filters with AND logic** (search AND chip AND region).
   - Add a results count above the grid in an `aria-live="polite"` element, for example "3 experiences in Bali".
   - Placeholder "spot waiting to be filled" cards show only when there are no active filters.
   - Empty state: "Nothing matches yet. Try All regions, or one of these:" followed by up to 3 chips that do have results, and a "Clear filters" button. Never show an empty grid with no message.
5. **The map shows only pins for visible cards when filters change** (app.js pins), if that's simple. Otherwise leave the map unfiltered.

**Acceptance:** typing "photo" with Bali selected shows the photoshoot cards and announces the count. Each filter works alone and in combination. The URL round-trips the state. There's no page navigation. Keyboard-only use works. At 375px the chips scroll sideways.

## Phase 2: Map over header fix and nav (styles.css, index.html, other pages' headers)

1. **Map overlap.**
   - Cause: Leaflet panes use z-index 400 and controls up to 1000, while `.site-header` is `position:sticky; z-index:20`. `#exploreMap` and `#mpMap` create no stacking context, so the map panes paint over the sticky header on scroll.
   - Fix: add `#exploreMap,#mpMap{position:relative;z-index:0;isolation:isolate}`.
   - Check that the mobile nav overlay (`.nav.is-open`, z-index 19) and `.float-cta` (z-index 50) still sit above the map.
2. **Nav.**
   - The homepage header already has only "Browse experiences" and "For businesses".
   - The subpages (bali/, mornington-peninsula/, faq/, case-study.html) carry the older nav: Victoria, Australia · Bali · For businesses · FAQ · Contact. Ro doesn't recognise it.
   - Replace that nav on every subpage with the homepage nav: "Browse experiences" linking to `/#browse`, and "For businesses".
   - Keep FAQ and Contact links in the footer only. Contact goes to /for-business/#interested, because businesses need it.
3. **Pages.**
   - /bali/ and /mornington-peninsula/ are region hub pages, and /faq/ is a 6-question FAQ.
   - Don't delete them. Stop linking to the region hubs from the homepage toggle.
   - List every link to /bali/ and /mornington-peninsula/ and ask Ro whether to keep the hubs for SEO, redirect them to `/?region=...#browse`, or remove them.

**Acceptance:** scrolling past the map leaves the header on top at desktop and 375px. No homepage control navigates to a hub page.

## Phase 3: Homepage copy and visual tweaks (ASSUMPTION, confirm with Ro before building)

Ro's dictated note was unclear. Show her a before/after screenshot first.

- **Assumption 1:** in the header, "Browse experiences" (an underlined .navlink.on) and "For businesses" (a boxed .btn-ghost) become plain text links with no underline and no box. Each gets a clear hover and focus state: colour change to var(--cleared) and an underline on hover/focus only.
  - Alternative: keep "For businesses" boxed, because it's the business call to action.
- **Assumption 2:** the #browse intro copy ("Ride a horse along the beach. Jump out of a plane. Throw a pot. ...") gains a creative example ("Paint a landscape"), plus a small visual that signals variety.
  - Recommend a row of the same category emoji used in the chips, rather than an adventure-only illustration. The homepage speaks to broad unique experiences, not adventure only.

## Phase 4: Salty Cowboy activity cards (bali/index.html, index.html #browse, styles.css, app.js)

1. **Images.** Create assets/salty-cowboy/.
   - Download each file listed in the data table from `https://book.saltycowboybali.com/images/<file>`.
   - Make .webp plus a .jpg fallback for each, at most 1600px on the long edge.
   - Use `<img loading="lazy" decoding="async" width height>`, with the first card's first image eager.
2. **Card markup.** Reuse the existing classes .card, .card__media, .card__body, .card__title, .card__loc, .card__meta and .card__price. Add the filter `data-` attributes from Phase 1.
```html
<a class="card sc-card" href="/bali/salty-cowboy/SLUG/" aria-label="TITLE, PRICE_TEXT"
   data-title="TITLE" data-business="Salty Cowboy" data-region="bali" data-cat="horse|photoshoots|lessons">
  <div class="card__media card__carousel">
    <div class="card__track"><!-- .card__slide > img per image --></div>
    <!-- only if more than 1 image: -->
    <button class="card__nav card__nav--prev" type="button" aria-label="Previous photo">‹</button>
    <button class="card__nav card__nav--next" type="button" aria-label="Next photo">›</button>
    <div class="card__dots" aria-hidden="true"></div><span class="sr-only" aria-live="polite"></span>
  </div>
  <div class="card__body">
    <h3 class="card__title">TITLE</h3>
    <p class="card__loc">DURATION · Salty Cowboy · Bali</p>
    <div class="card__meta card__row"><p class="card__price"><span class="card__from">from</span> IDR X,XXX,XXX<span class="card__unit"> / person</span></p></div>
  </div>
</a>
```
3. **CSS.**
   - `.card__carousel{position:relative;overflow:hidden}`
   - `.card__track{display:flex;height:100%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}`; slides `flex:0 0 100%;scroll-snap-align:start`; img `width:100%;height:100%;object-fit:cover`.
   - `.card__nav`: 44x44px, vertically centred, `background:var(--paper);border:1px solid var(--ink)`. Shown on `.card:hover` and `:focus-within` at desktop, always shown under 820px, with a visible focus ring.
   - Dots: 6px, paper colour at .6 opacity, active at 1.
   - Title: clamp to 2 lines with `min-height:2.4em`.
   - `.card__row{display:flex;justify-content:space-between;align-items:baseline}`
   - `.card__price{margin-left:auto;font-size:13px;font-weight:600}`
   - `.card__from,.card__unit{font-size:10px;font-weight:400;color:rgba(23,23,26,.6)}`
4. **JS (app.js).**
   - Build dots for each carousel.
   - Prev and next scroll one slide. Use `preventDefault()` and `stopPropagation()` so the card link doesn't fire.
   - Update the active dot and the sr-only text "Photo X of N".
   - No autoplay. Respect prefers-reduced-motion.
5. **Missing-data rules.**
   - No reviews means no rating element at all: no stars, no 0.
   - No badge and no wishlist heart: there's no data or feature behind them.
   - No "Free cancellation": there's no policy.
   - One image means no arrows or dots.
   - "from" only appears when an activity has more than one price tier.
   - Prices are shown exactly, for example "IDR 1,600,000", with no AUD conversion.
6. **Placement.**
   - bali/index.html: replace the Salty Cowboy panel with an 11-card grid (`repeat(auto-fill,minmax(260px,1fr))`) in the order below.
   - index.html #browse: replace the single Salty Cowboy x-card with all 11 cards, so search and chips have real content. Keep the placeholders and the existing `#browse .x-card__media` mobile rule.

**Acceptance:**
- Cards link to their detail pages.
- Swiping and the arrows work and don't trigger the card link.
- Single-image cards show no controls.
- Every card has alt text that describes the photo plainly, activity first, never "image of". Write it by looking at each image.

## Phase 5: Activity detail pages (data/, tools/, bali/salty-cowboy/, assets/detail.js)

**Approach:** generate 11 plain HTML pages from one template.
- `data/salty-cowboy.json` feeds `tools/build-salty-cowboy.mjs` (plain Node, no dependencies).
- The script writes `bali/salty-cowboy/<slug>/index.html` for each activity, plus `bali/salty-cowboy/index.html`, a business page with an intro and the 11 cards.
- Commit the output. Every generated file starts with `<!-- Generated by tools/build-salty-cowboy.mjs. Edit data/salty-cowboy.json, not this file. -->`.
- Why: each URL needs real HTML and JSON-LD for search and AI search, and GitHub Pages serves folders natively.
- Copy the head pattern from bali/index.html (canonical, OG/Twitter, favicon, relative paths) and use the Phase 2 header and footer.

**JSON fields per activity:** slug, title, sourceName, cat, durations [{label, priceIDR, startTimes[]}], basis, overview, goodToKnow [{label, value}], included[], notIncluded[], addon, images [{file, alt}], serviceTaxIncluded. Fill these from the data tables below, and check against book.saltycowboybali.com (inline ACTIVITIES, *_SLOTS, and the English prices/descs/includes/notIncluded/groups strings). Strip emoji.

**Page sections, in order.** Desktop has two columns: content, plus a right booking panel with `position:sticky;top:var(--s-5)`. Under 820px it's a single column.
1. **Breadcrumbs:** Home / Bali / Salty Cowboy / {title}, plus BreadcrumbList JSON-LD. "Bali" links to `/?region=bali#browse`, not /bali/. "Salty Cowboy" links to `/bali/salty-cowboy/`.
2. **Title block:** an H1, then a mono meta line: duration range · basis · Bali · "Run by Salty Cowboy" (links to #business).
3. **Gallery:**
   - A hero image plus a 2x2 grid and a "See all N photos" button.
   - The button opens a `<dialog>` lightbox: focus trap, Esc closes, arrow keys move between photos, 44px prev/next/close buttons, "X of N", focus returns to the button on close.
   - With one image, show the hero only.
   - Mobile: scroll-snap swipe with a "1/N" counter. Tapping opens the lightbox.
4. **Booking panel:**
   - Show "from IDR X" plus the basis.
   - Duration radio chips: role=radiogroup, at least 44px, each chip shows its price, the first is selected.
   - Photoshoots only: a checkbox "Add a Salty Cowboy photographer: +IDR 2,000,000 per hour, 20 edited images per hour".
   - TOTAL in `aria-live="polite"`, updated live.
   - "Service tax included" for rides only.
   - Start times for the selected duration, as plain text.
   - Button: "Check dates with Salty Cowboy →", linking in the same tab to `https://book.saltycowboybali.com/<slug>?ref=threshold`.
   - Under the button: "You'll finish booking with Salty Cowboy. Simone confirms your date on WhatsApp. No payment is taken now."
   - Never write "Book now", "Reserve", or any availability claim.
5. **Overview:** the description, in short paragraphs.
6. **Good to know:** a `<dl>` with these rows:
   - group size;
   - weight (rides and dressage only): "Max 75kg per rider with clothes on. Max 2 riders over 70kg. Riders are weighed at the stables.";
   - minimum age (only where sourced);
   - experience;
   - "Arrive 15 minutes before your start time";
   - "Closed Sundays and Saturday afternoons";
   - meeting point: if empty, show "Ask Salty Cowboy" linking to https://wa.me/6281237312248.

   Hide any other row that's empty.
7. **Included / Not included:** two columns with ✓ and ✕ marks (aria-hidden). Hide the section if both are empty.
8. **Times:** a table of duration and start times.
9. **Meet the business** (id="business"):
   - an empty image slot with a TODO comment (no stock photo);
   - "Owner-run by Simone.";
   - "Riding with Salty Cowboy is supporting our rescue horses!";
   - a link to /case-study.html.
10. **Reviews:** "No reviews on Threshold yet. This listing is new." No stars.
11. **Cancellation:** "Cancellation terms are set by Salty Cowboy. Ask them before you book." For riding activities, add "Riders over 75kg cannot ride and are not refunded."
12. **FAQ:** 4 to 6 `<details>` items, built from the data only, plus FAQPage JSON-LD that matches the visible text.
13. **More from Salty Cowboy:** 3 cards from Phase 4, same category first.
14. **Mobile sticky bar** (under 820px only):
    - selected duration and total on the left, and a "Check dates →" button at least 48px tall;
    - `padding-bottom:env(safe-area-inset-bottom)`;
    - hidden by IntersectionObserver while the inline button is visible;
    - may reuse the .float-cta shadow.
15. **JSON-LD:**
    - TouristTrip with name, description, image[] and provider `{"@type":"LocalBusiness","name":"Salty Cowboy"}`.
    - offers: one Offer per duration (name, price, priceCurrency "IDR", url = the booking link).
    - No aggregateRating, no availability.
16. **Behaviour** lives in `assets/detail.js` (vanilla JS, loaded with defer, only on these pages).
17. **Site files:**
    - Add the 12 new URLs to sitemap.xml.
    - Add a short Salty Cowboy section to llms.txt.
    - The map pin `link` in app.js becomes `bali/salty-cowboy/`.

**Acceptance:**
- `node tools/build-salty-cowboy.mjs` regenerates all 12 pages.
- The total updates and is announced.
- The lightbox works with the keyboard only.
- The sticky bar hides when the inline button is in view.
- JSON-LD validates (schema.org shapes).

---

## Data

Shared facts: closed Sundays and Saturday afternoons; arrive 15 minutes early. Currency: IDR. "Card price" is what the card shows.

| # | Slug | Title (card and H1) | Source name | cat | Durations: price IDR (start times) | Basis | Card price | Images (first = card) |
|---|---|---|---|---|---|---|---|---|
| 1 | beach-ride | Guided horse ride through rice fields to the beach | Beach & Rice Field Ride | horse | 1 hr: 1,600,000 (8:00am, 5:00pm); 1.5 hr: 2,200,000 (8:00am, 4:30pm) | per booking, up to 5 riders | from IDR 1,600,000 | beach-ride.jpg |
| 2 | insta-ride | Two-hour horse ride with photo stops, village to beach | Insta Ride | horse | 2 hr: 2,700,000 (8:00am, 4:00pm) | per booking, up to 5 riders | IDR 2,700,000 | insta-ride.jpg |
| 3 | beach-photoshoot | Beach and rice field photoshoot with a groomed horse | Beach Photoshoot | photoshoots | 1 hr: 1,750,000; 1.5 hr: 2,250,000 (hourly 8:00am to 4:00pm) | one person per horse | from IDR 1,750,000 | photo-beach.jpg, gallery-beach-1.jpg, gallery-beach-2.jpg, gallery-ricefield-1.jpg, gallery-ricefield-2.jpg |
| 4 | horse-grooming | Horse grooming class with the stable manager | Horse grooming (wet or dry) | lessons | 1 hr: 1,250,000; 1.5 hr: 1,875,000 (8:30, 9:30, 10:30am) | up to 2 people | from IDR 1,250,000 | grooming.jpg |
| 5 | join-up-lesson | Join Up: natural horsemanship lesson, no riding | Join Up Lesson | lessons | 1 hr: 2,500,000; 1.5 hr: 3,150,000 (8:30am, 9:30am) | per person, up to 2 | from IDR 2,500,000 / person | join-up.jpg |
| 6 | stable-photoshoot | Western stable photoshoot with horses behind you | Stable Photoshoot | photoshoots | 1 hr: 1,750,000 (8:30, 10:30am, 2:30, 4:30pm); 1.5 hr: 2,250,000 (8:30, 10:00am, 2:30, 4:00pm); 2 hr: 2,750,000 (8:30, 9:30am, 2:30, 3:30pm); 3 hr: 3,750,000 (8:30am, 2:30pm) | up to 5 people on the team | from IDR 1,750,000 | photo-stable.jpg, gallery-stable-1..4.jpg |
| 7 | paddock-photoshoot | Green paddock photoshoot with grazing horses | Paddock Photoshoot | photoshoots | same as stable | up to 5 people on the team | from IDR 1,750,000 | photo-paddock-card.jpg, gallery-paddock-1..4.jpg |
| 8 | dressage-masterclass | Private dressage lesson in the arena | Dressage Masterclass (Private lesson) | lessons | 50 min: 2,900,000 (8:30am, 9:30am) | private, 1 rider | IDR 2,900,000 | dressage.jpg |
| 9 | cottages-photoshoot | Rustic wooden cottage photoshoot (no horses) | Cottages Photoshoot | photoshoots | 3 hr session: 4,500,000 (8:30am, 2:30pm) | per session, up to 6 people | IDR 4,500,000 / session | photo-cottages.jpg, gallery-cottages-1..4.jpg |
| 10 | group-clinic | Leadership and trust clinic with horses, for groups | Group Clinic (Leadership/horsemanship class) | lessons | 1.5 hr: 6,000,000 (8:30am) | flat per group, 3 to 6 people | IDR 6,000,000 / group | group-clinic.jpg |
| 11 | horse-whisperer-course | 3-day Horse Whisperer course for two | Horse Whisperer Intensive Course | lessons | 3 days, 10 hr total: 22,500,000 (Mon and Tue 8:30am, Thu 9:00am, to midday) | for the full course, up to 2 people | IDR 22,500,000 / course | horse-whisperer.jpg |

Card data-cat values: rides 1 and 2 are "horse". Photoshoots are "photoshoots" and also "horse" except the cottage shoot, so use `data-cat="photoshoots horse"`. Lessons 4, 5, 8, 10 and 11 are "lessons horse". Match a chip when its value appears in the card's space-separated list.

**Good to know, included and not included, per slug** (verbatim source facts; rows not listed are empty):
- **beach-ride, insta-ride:**
  - Max 5 riders, privately guided. Weight rule applies. Beginner.
  - Included: "Helmets and boots, staff guiding on foot the whole way, and photos taken on your phone by our team." Service tax included.
  - insta-ride overview mentions "golden hour is ideal".
- **dressage-masterclass:**
  - Private, 1 rider. Weight rule applies. All levels.
  - Included: empty.
- **beach-photoshoot:**
  - Static, walking only; 900m walk via the rice fields; helmets required on the walk; one person per horse; no swimwear or bikinis, out of respect for local culture; share outfit plans beforehand.
  - Included: "Beautifully groomed model horse and staff to help and assist you, for the 900m walk through the village and along the rice fields to the beach."
  - Not included: photographer (add-on).
- **stable-photoshoot:**
  - Horses stay in their stables; private horses are not available. Max 5.
  - Included: "Western-style stable backdrop, team assistance".
  - Not included: photographer (add-on).
- **paddock-photoshoot:**
  - No entering the paddocks or touching the horses. Max 5.
  - Included: "Paddock location, grazing horses in view".
  - Not included: photographer (add-on).
- **cottages-photoshoot:**
  - No horses. Cottage by availability. No paddock entry. Max 6.
  - Included: "Cottage interior, whole session".
  - Not included: horses; photographer (add-on).
- **join-up-lesson:**
  - Hands-on, no riding. Beginner. Max 2.
  - Not included: riding.
- **horse-grooming:**
  - Wet or dry option; with the stable manager; tips for Bali's climate; Q&A. Max 2.
- **group-clinic:**
  - 3 to 6 people. Groundwork, no riding experience needed.
  - Not included: riding.
- **horse-whisperer-course:**
  - Age 8 and over. All levels. One course booking per week. Max 2.
  - Included: "10 hours over 3 days, 2 hours of grooming or another related activity".
  - Not included: "Riding. This course is groundwork, not ridden work".
- **Add-on, photoshoots 3, 6, 7 and 9:** Salty Cowboy photographer, IDR 2,000,000 per hour, 20 edited images per hour.

**Overview text:** use the English `descs` string for each activity from the source page, with emoji stripped.

**Low-res images to swap later** (use them for now, and don't upscale):
- Under 1200px on the long edge:
  - beach-ride
  - photo-paddock-card
  - gallery-beach-1 and -2
  - gallery-ricefield-1 and -2
  - gallery-stable-1 and -2
  - gallery-paddock-1 to -4
  - gallery-cottages-2 to -4
- Borderline:
  - join-up
  - insta-ride
  - photo-beach
  - dressage
  - photo-cottages

---

## Show Ro before changing
1. **"From $50 AUD"**: on the index.html card, bali/index.html, the map pin in app.js, JSON-LD and llms.txt. It matches no real price; the lowest is IDR 1,250,000. List every occurrence and ask what replaces it.
2. **JSON-LD price in bali/index.html** (`offers.price "50" AUD`). Proposal: an AggregateOffer in IDR with lowPrice 1250000 and highPrice 22500000. No aggregateRating.
3. **Hub pages** /bali/, /mornington-peninsula/ and /faq/: keep, redirect or remove (Phase 2).
4. **Phase 3 assumptions** (plain-text nav, intro copy and visual).
5. **Any category chip** beyond the set in Phase 1.

## Open questions
**For Ro:**
- Should "Bali" breadcrumbs and links keep a hub page for SEO, or rely on the homepage filter?
- Commission attribution: should Simone's booking app add "via Threshold" to the WhatsApp message when `?ref=threshold` is present? That's a separate brief for the salty-cowboy repo.
- Should cancellation copy stay "Ask the business"?
- Is Bali still on hold?

**For Simone:**
- Meeting point and a maps link.
- Cancellation and reschedule policy.
- Is grooming priced per person or per booking? How is the beach photoshoot priced for 2 or more people?
- Is the Horse Whisperer price for the pair or per person?
- Can the pool be used for cottage shoots? The source contradicts itself.
- What to wear, and minimum age for rides and lessons.
- A photo of Simone and 2 or 3 lines in her own words.
- High-res landscape photos.

## Final QA checklist
- [ ] Keyboard only: search, chips, region radios (arrow keys), card arrows, booking chips, checkbox, lightbox (Esc and focus return), mobile nav.
- [ ] Screen reader announcements: results count, carousel "Photo X of N", booking total.
- [ ] At 375px and at desktop: chips scroll sideways, sticky booking bar, no horizontal page scroll.
- [ ] The map never paints over the sticky header or the mobile nav.
- [ ] Search, chip and region work together (AND logic); the URL round-trips; the empty state shows suggestions; no homepage control navigates away.
- [ ] Single-image cards and galleries show no controls; no rating, badge or "Free cancellation" anywhere.
- [ ] `grep -rn "—" .` and `grep -rni "operator" .` return nothing in changed files.
- [ ] Nothing committed or pushed. Show Ro a summary of every changed file and screenshots: homepage filtered to Bali plus "photo", beach-ride and horse-whisperer-course on desktop and 375px.
