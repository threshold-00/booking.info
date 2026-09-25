# Threshold marketing site

Static marketing site for Threshold, booking software for businesses that screen or match customers before confirming a slot. The pitch: availability that knows who is asking, so a business stops fielding requests it has to turn away. Salty Cowboy Bali is the reference customer and the case study.

## Repo & file layout

```
/
├── index.html        # home, single scroll: hero (with animation), solution tiles, case study teaser, live demo phones, founding members, contact
├── case-study.html   # Salty Cowboy case study
├── styles.css        # all styling (design tokens live in :root)
├── app.js            # hero animation + contact form + mailto links
├── assets/           # booking flow screenshots, founder portrait, photos, booking-flow.mp4, og-image.png, favicon.svg
├── CNAME             # thresholdbooking.com (custom domain, live since 19 Sep 2026)
├── robots.txt        # allows all, hides sitev2/, points at the sitemap
├── sitemap.xml       # both pages; bump <lastmod> when a page changes
├── .nojekyll         # stops GitHub Pages running Jekyll over the files
├── CLAUDE.md         # this file
└── .claude/settings.json
```

No build step, no bundler, no framework. The one third-party script is `assets/rough.js`, vendored so nothing loads from a CDN. Plain HTML, one CSS file, one JS file.

## Deploy

GitHub Pages serves `main` from repo root at **https://thresholdbooking.com/** (custom domain via `CNAME`; the old https://threshold-00.github.io/booking.info/ address redirects). Every page carries a `<link rel="canonical">` to the thresholdbooking.com URL, Open Graph and Twitter tags, and a JSON-LD block, all in `<head>`. A new page needs the same set plus a `<url>` entry in `sitemap.xml`. The social preview image is `assets/og-image.png` (1200x630), rendered from a small HTML card in headless Chrome; regenerate it rather than editing the PNG. Remote is `threshold-00/booking.info`. Every push to `main` redeploys automatically, usually within a minute. Never upload files through the GitHub web UI, it puts the local folder and the remote out of sync.

## Local preview

```bash
npx browser-sync start --server --files "index.html, case-study.html, styles.css, app.js" --port 3000 --no-notify --no-ghost-mode
```

`--no-ghost-mode` matters: without it browser-sync mirrors clicks and scrolls between every page it serves, and each phone in the live demo is its own page, so they scramble each other. Serves the folder at http://localhost:3000 and reloads the browser on every save, so edits show up without a refresh and without pushing. Leave it running while working; stop it with the process it was started in. Preview locally first, push only once the change looks right.

## Conventions (non-negotiable)

- **Never use em-dashes** anywhere: code, copy, prose responses, commit messages. Use a comma or a full stop.
- **Prefer targeted patches over full-file rewrites.** Edit the specific block, do not regenerate the file.
- **Styling is mostly inline.** Section layout, spacing and type sizes are written as inline `style` attributes on the elements in `index.html` and `case-study.html`. Only shared primitives (`.btn`, `.btn-ghost`, `.opt`, `.split`, `.display`, `.hov`, form inputs, the mobile breakpoint) live in `styles.css`. Match the surrounding approach rather than migrating things to classes mid-task.
- **Design tokens** are the `:root` custom properties in `styles.css`: `--ink` `#17171a`, `--paper` `#f3f2ee`, `--panel` `#f7f6f3`, `--cleared` `#1f6f45` (the green accent, used for hover and status dots), `--line`, `--display`, `--mono`. Use the variables, do not hardcode new hexes.
- **Type:** body is Chivo Mono, uppercase, 12px. Headings and `.display` use the Neue Haas Grotesk Display stack, sentence case, weight 500. Headings scale with `clamp()`. IBM Plex Mono is the `--mono` face for eyebrow labels and small meta text.
- **Responsive:** one breakpoint at `max-width:820px` in `styles.css`, which collapses `.split` grids to a single column and drops the horizontal padding. Any new two-column section should use `class="split"` so it collapses too.
- **Check both pages** after a change to `styles.css`, since both `index.html` and `case-study.html` load it. Only `index.html` loads `app.js`.

## Site specifics

- **Contact form** posts to Formspree when `FORM_ENDPOINT` at the top of `app.js` is set (a `https://formspree.io/f/...` URL), and shows its result in `#leadStatus`. If the endpoint is empty or the post fails it falls back to a mail draft to `CONTACT_EMAIL`. The hidden `_gotcha` input is Formspree's spam trap; leave it in.
- **Contact address** is the single `CONTACT_EMAIL` constant at the top of `app.js`, currently `rowenabaulch@outlook.com`. Change it there and nowhere else. The contact form builds its mailto from it directly, and the hardcoded `mailto:hello@example.com` links in `index.html` are deliberate hooks that `app.js` rewrites to `CONTACT_EMAIL` on load, so leave that placeholder in the HTML alone.
- **Hero animation** is the inline SVG `#heroAnim` in `index.html`, styled by the `.hero-anim` block in `styles.css` and driven by the last function in `app.js`. Each person's badge dots are their level; each calendar slot's dots are its minimum. Keep the disqualified slots visibly hatched out, that filtering is the product argument. It shows one still frame under `prefers-reduced-motion`. The hand-drawn look comes from `assets/rough.js` (rough.js, vendored, MIT): the second-to-last block of `app.js` redraws each shape as pencil strokes and hatching, hides the clean originals with `.ha-orig`, and adds `.sketch`; an SVG turbulence filter makes the lines boil slightly. Labels use Caveat. If rough.js fails to load, the clean vector version shows instead. Change a shape in both the SVG markup and that block.
- **Live demo** (`#demo`) is a sideways carousel of six phones (`#phoneTrack`, arrows wired in `app.js`, `.phone-track` in `styles.css`). Each phone is an iframe of the real booking engine in `demo/phones/`, opened on one step by `demo/phones/configs/embed.js` and locked there: answers stay tappable, anything that leaves the page shows a note. Salty Cowboy is first and marked as the case study; the other five are made-up brands from `engine/tools/site-brands/brands.js`, labelled as examples. The embed blanks the booking log URL so nothing reaches a real sheet.
- **Floating call button** (`#floatCta`, "Book a free call") links to `#interested`. `app.js` shows it once the hero is off screen and hides it while the contact section is on screen.
- **Founding members** count ("1 of 5 claimed") is hardcoded in the sticky header, the footer and the `#founding` spots indicator ("4 of 5 spots left", five squares) of `index.html`. Update all three together. Pricing: founding members pay $29 a month locked for life, get free setup, start paying at their first real booking, and earn $5 a month referral credit per referred paying business. Standard is $49 a month plus a $10 setup fee. The offer appears in the `#founding` section (headline, the two intro lines, spots indicator, the "How is it this affordable?" panel, comparison grid with green ticks on the founding column), the header status bar and the JSON-LD `offers`. Update all of them together. The contact form's optional "Referred by" field feeds the referral credit. The "If you ever leave" panel under the founding CTA promises 90 days notice if Threshold stops; it must match `offboarding/02-exit-terms.md`.
- **Case study** had a "The results" section with three stat tiles and a Simone pull quote. It was removed on 7 Sep 2026 because the numbers are not available yet. Reinstate it from git history (`git show 70c01b3:case-study.html`) once Ro has real figures rather than rebuilding it from scratch.

## Default change workflow

1. Make the targeted edit.
2. Preview at http://localhost:3000 and confirm the change at desktop width and under 820px.
3. Show Ro a summary of what changed.
4. Commit and push only after Ro approves. Pushing is what publishes the change.
