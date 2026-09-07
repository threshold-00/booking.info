# Threshold — booking.info

Static marketing site. No build step, no dependencies.

Live at **https://threshold-00.github.io/booking.info/**

## Files
- `index.html` — home (single scroll)
- `case-study.html` — Salty Cowboy case study
- `styles.css` — all styling
- `app.js` — live-demo filtering + contact form
- `assets/` — booking flow screenshots

## Preview locally

```bash
npx browser-sync start --server --files "index.html, case-study.html, styles.css, app.js" --port 3000 --no-notify
```

Opens http://localhost:3000 and reloads on every save.

## Publish

This folder is the git repo. Edit, then:

```bash
git add .
git commit -m "what changed"
git push
```

GitHub Pages rebuilds automatically on each push, usually within a minute. Do not upload files through the GitHub web UI, it puts this folder and the remote out of sync.

## Still to do
1. Set the real address in `app.js`: `var CONTACT_EMAIL = 'you@yourdomain.com';` (the form and the "book a call" link both use it).
2. Fill the `[X]` / `[Y]` / `[A] to [B]` result figures and the pull quote in `case-study.html`, and swap the two placeholder image blocks for real photos.
