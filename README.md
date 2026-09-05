# Threshold — booking.info

Static marketing site. No build step, no dependencies.

## Files
- `index.html` — home (single scroll)
- `case-study.html` — Salty Cowboys case study
- `styles.css` — all styling
- `app.js` — live-demo filtering + contact form
- `assets/` — booking flow screenshots

## Before you publish
1. Set your address in `app.js`: `var CONTACT_EMAIL = 'you@yourdomain.com';` (the form and the "book a call" link both use it).
2. Replace `Threshold. Built by [your name].` in the footer of both pages.
3. Fill the `[X]` / `[Y]` / `[A] to [B]` result figures and the pull quote in `case-study.html`, and swap the two placeholder image blocks for real photos.

## Deploy
**GitHub Pages** — Settings → Pages → Source: Deploy from branch, `main` / root. Live at `https://threshold-00.github.io/booking.info/`.

**Netlify / Vercel** — connect the repo, no build command, publish directory `/`.

## Fonts
Display type is Neue Haas Grotesk, a licensed font that is not served from a CDN — it renders where installed and falls back to Helvetica Neue elsewhere. Add the licensed webfont files and an `@font-face` block in `styles.css` to make it consistent for all visitors. Body type is Chivo Mono via Google Fonts.
