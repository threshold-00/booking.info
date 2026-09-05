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
2. Fill the `[X]` / `[Y]` / `[A] to [B]` result figures and the pull quote in `case-study.html`, and swap the two placeholder image blocks for real photos.

## Set up git once, then just push

From the unzipped folder:

```bash
git init
git branch -M main
git remote add origin https://github.com/threshold-00/booking.info.git
git add .
git commit -m "Threshold marketing site"
git push -u origin main
```

After that, every change is three commands — no more uploading files by hand:

```bash
git add .
git commit -m "what changed"
git push
```

GitHub Pages rebuilds automatically on each push, usually within a minute.

## Deploy
**GitHub Pages** — Settings → Pages → Source: Deploy from branch, `main` / root. Live at `https://threshold-00.github.io/booking.info/`.

**Netlify / Vercel** — connect the repo, no build command, publish directory `/`.

## Fonts
Display type is Neue Haas Grotesk, a licensed font that is not served from a CDN — it renders where installed and falls back to Helvetica Neue elsewhere. Add the licensed webfont files and an `@font-face` block in `styles.css` to make it consistent for all visitors. Body type is Chivo Mono via Google Fonts.
