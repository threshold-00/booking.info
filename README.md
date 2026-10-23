# RealDays, booking.info

Static marketing site for RealDays, a booking site for small, owner-run experience businesses on the Mornington Peninsula and in Bali.

Live at **https://getrealdays.com/**

## Files
- `index.html` - home page (experiences, map, Why RealDays)
- `mornington-peninsula/index.html` - Mornington Peninsula hub
- `bali/index.html` - Bali hub
- `faq/index.html` - FAQ
- `for-business/index.html` - page for businesses (12% fee including GST and card fees, from 1 May 2027)
- `case-study.html` - Salty Cowboy business story
- `styles.css` - all styling
- `app.js` - map, contact form
- `assets/` - images, booking flow video
- `llms.txt` - AI/LLM site summary

## Preview locally

```bash
npx browser-sync start --server --files "*.html, **/*.html, styles.css, app.js" --port 3000 --no-notify --no-ghost-mode
```

Opens http://localhost:3000 and reloads on every save.

## Publish

This folder is the git repo. Edit, then:

```bash
git add .
git commit -m "what changed"
git push
```

GitHub Pages rebuilds automatically on each push, usually within a minute. Do not upload files through the GitHub web UI.
