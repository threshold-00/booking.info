# Threshold marketing site

Static marketing site for Threshold, booking software for businesses that screen or match customers before confirming a slot. The pitch: availability that knows who is asking, so a business stops fielding requests it has to turn away. Salty Cowboy Bali is the reference customer and the case study.

## Repo & file layout

```
/
├── index.html        # home, single scroll: hero, problem, solution, case study teaser, live demo, founding members, contact
├── case-study.html   # Salty Cowboy case study
├── styles.css        # all styling (design tokens live in :root)
├── app.js            # live-demo session filtering + contact form + mailto links
├── assets/           # booking flow screenshots, founder portrait, photos, booking-flow.mp4
├── .nojekyll         # stops GitHub Pages running Jekyll over the files
├── CLAUDE.md         # this file
└── .claude/settings.json
```

No build step, no bundler, no framework, no dependencies. Plain HTML, one CSS file, one JS file.

## Deploy

GitHub Pages serves `main` from repo root at **https://threshold-00.github.io/booking.info/**. Remote is `threshold-00/booking.info`. Every push to `main` redeploys automatically, usually within a minute. Never upload files through the GitHub web UI, it puts the local folder and the remote out of sync.

## Local preview

```bash
npx browser-sync start --server --files "index.html, case-study.html, styles.css, app.js" --port 3000 --no-notify
```

Serves the folder at http://localhost:3000 and reloads the browser on every save, so edits show up without a refresh and without pushing. Leave it running while working; stop it with the process it was started in. Preview locally first, push only once the change looks right.

## Conventions (non-negotiable)

- **Never use em-dashes** anywhere: code, copy, prose responses, commit messages. Use a comma or a full stop.
- **Prefer targeted patches over full-file rewrites.** Edit the specific block, do not regenerate the file.
- **Styling is mostly inline.** Section layout, spacing and type sizes are written as inline `style` attributes on the elements in `index.html` and `case-study.html`. Only shared primitives (`.btn`, `.btn-ghost`, `.opt`, `.split`, `.display`, `.hov`, form inputs, the mobile breakpoint) live in `styles.css`. Match the surrounding approach rather than migrating things to classes mid-task.
- **Design tokens** are the `:root` custom properties in `styles.css`: `--ink` `#17171a`, `--paper` `#f3f2ee`, `--panel` `#f7f6f3`, `--cleared` `#1f6f45` (the green accent, used for hover and status dots), `--line`, `--display`, `--mono`. Use the variables, do not hardcode new hexes.
- **Type:** body is Chivo Mono, uppercase, 16px. Headings and `.display` use the Neue Haas Grotesk Display stack, sentence case, weight 500. Headings scale with `clamp()`. IBM Plex Mono is the `--mono` face for eyebrow labels and small meta text.
- **Responsive:** one breakpoint at `max-width:820px` in `styles.css`, which collapses `.split` grids to a single column and drops the horizontal padding. Any new two-column section should use `class="split"` so it collapses too.
- **Check both pages** after a change to `styles.css` or `app.js`, since both `index.html` and `case-study.html` load them.

## Site specifics

- **Contact address** is the single `CONTACT_EMAIL` constant at the top of `app.js`, currently `rowenabaulch@outlook.com`. Change it there and nowhere else. The contact form builds its mailto from it directly, and the hardcoded `mailto:hello@example.com` links in `index.html` are deliberate hooks that `app.js` rewrites to `CONTACT_EMAIL` on load, so leave that placeholder in the HTML alone.
- **Live demo** (`#demo` on the home page) is driven by the `SESSIONS`, `LEVELS` and `GROUPS` arrays in `app.js`. Each session has a `minLevel` and a `maxGroup`; the demo greys out or hides the ones the chosen rider level and group size do not qualify for. That filtering is the whole product argument, so keep the disqualifying combinations visible and honest.
- **Founding members** count ("2 of 5 claimed") is hardcoded in the sticky header and in the `#founding` section of `index.html`. Update both together.
- **Case study** had a "The results" section with three stat tiles and a Simone pull quote. It was removed on 7 Sep 2026 because the numbers are not available yet. Reinstate it from git history (`git show 70c01b3:case-study.html`) once Ro has real figures rather than rebuilding it from scratch.

## Default change workflow

1. Make the targeted edit.
2. Preview at http://localhost:3000 and confirm the change at desktop width and under 820px.
3. Show Ro a summary of what changed.
4. Commit and push only after Ro approves. Pushing is what publishes the change.
