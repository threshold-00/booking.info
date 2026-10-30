#!/usr/bin/env node
// Builds the hidden business demo pages, /demo/b/<slug>/index.html, from
// data/business-layer/<slug>.json (Ro, 21 Oct 2026, briefs/demos-all-2026-10-21.md).
//
//   node tools/build-business-demos.mjs            every data file with a "page" section
//   node tools/build-business-demos.mjs <slug>...  just those
//
// Every per-business difference lives in the data file. This writes the page
// shell; /assets/demo-booking.js runs the booking panel from the page's
// #demo-config JSON and the test booking service (prices, dates and policy
// come from there). Pages are noindex, disallowed in robots.txt, and never
// linked from the sitemap, llms.txt, listings or search.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReviews } from './reviews-html.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(repo, 'data/business-layer');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Visible placeholders (brief override 7): [TO CONFIRM ...] and [PERMISSION NEEDED] are marked.
const tbc = (s) => esc(s).replace(/\[(TO CONFIRM|PERMISSION NEEDED)[^\]]*\]/g, (m) => `<span class="tbc">${m}</span>`);
const imgUrl = (src, w) => `${src}?fm=jpg&amp;q=70&amp;auto=format&amp;fit=crop&amp;w=${w}`;
const utm = (u) => `${u}?utm_source=threshold&amp;utm_medium=referral`;
const MODES = ['sandbox', 'demo', 'link', 'live', 'off'];

// {age_min:<experience>} in page copy comes from that experience's age_min, so the
// number lives in one place in the data file.
function fillTokens(v, d) {
  if (typeof v === 'string') {
    return v.replace(/\{age_min:([a-z0-9-]+)\}/g, (_, key) => {
      const e = d.experiences.find((x) => x.key === key);
      if (e?.age_min == null) throw new Error(`${d.business.slug}: {age_min:${key}} but ${key} has no age_min`);
      return String(e.age_min);
    });
  }
  if (Array.isArray(v)) return v.map((x) => fillTokens(x, d));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillTokens(x, d)]));
  return v;
}

// Gallery header (design system 6.20). 3 or more photos: one large photo and a grid
// of up to 4 on desktop, a swipeable carousel with a "1 / N" counter on mobile.
// 1 or 2: a single hero. Every photo opens the lightbox. Unsplash photos carry a
// credit, "Stock photo: Name / Unsplash", in the lightbox caption (Unsplash licence).
// A self-hosted photo with a "credit" (e.g. Wikimedia Commons, CC BY-SA) shows that.
function galleryImg(it, dir, i, main) {
  // A photo fills its slot (object-fit: cover), so one wider than the slot is drawn
  // wider than the slot, and the browser needs that width to pick a sharp enough file.
  // Phones: a full-width 4:3 carousel. Desktop: the main slot is about 370px square,
  // the small ones about 180px.
  const r = it.w && it.h ? it.w / it.h : 1.5;
  const phone = Math.max(100, Math.round(75 * r));
  const desk = Math.round((main ? 370 : 180) * Math.max(1, r));
  const sizes = `(max-width:820px) ${phone}vw, ${desk}px`;
  const load = i === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"';
  const pos = it.position ? ` style="object-position:${esc(it.position)};"` : '';
  if (it.unsplash) {
    const credit = `Stock photo: ${it.unsplash.name} / Unsplash`;
    return `<img src="${imgUrl(it.src, 1600)}" srcset="${imgUrl(it.src, 800)} 800w, ${imgUrl(it.src, 1600)} 1600w" sizes="${sizes}" alt="${esc(it.alt)}" ${load} decoding="async" data-lightbox-index="${i}" data-credit="${esc(credit)}"${pos} />`;
  }
  const small = Math.round((it.w * 800) / Math.max(it.w, it.h));
  const set = (ext) => `${dir}${it.file}-800.${ext} ${small}w, ${dir}${it.file}-1600.${ext} ${it.w}w`;
  return `<picture>
            <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}" />
            <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}" />
            <img src="${dir}${it.file}-1600.webp" width="${it.w}" height="${it.h}" alt="${esc(it.alt)}" ${load} decoding="async" data-lightbox-index="${i}"${it.credit ? ` data-credit="${esc(it.credit)}"` : ''}${pos} />
          </picture>`;
}

function galleryHeader(d) {
  const p = d.page.photos;
  const items = p.items;
  if (!items?.length) throw new Error(`${d.business.slug}: photos.items is empty`);
  for (const it of items) if (!it.alt) throw new Error(`${d.business.slug}: every photo needs alt text`);
  const shown = items.length >= 3 ? items.slice(0, 5) : items.slice(0, 1);
  const n = shown.length;
  const figs = shown
    .map((it, i) => `<figure class="gallery-header__item">
          ${galleryImg(it, p.dir ?? '', i, i === 0)}
        </figure>`)
    .join('\n        ');
  // Photos past the ones shown still open in the lightbox.
  const extra = items
    .slice(n)
    .map((it, j) => `<img hidden src="${it.unsplash ? imgUrl(it.src, 1600) : `${p.dir ?? ''}${it.file}-1600.webp`}" alt="${esc(it.alt)}" data-lightbox-index="${n + j}"${it.unsplash ? ` data-credit="Stock photo: ${esc(it.unsplash.name)} / Unsplash"` : it.credit ? ` data-credit="${esc(it.credit)}"` : ''} />`)
    .join('');
  return `<div class="gallery-header gallery-header--${n}" data-count="${n}">
        <div class="gallery-header__track" role="region" tabindex="0" aria-label="Photos of ${esc(d.business.name)}">
        ${figs}
        </div>
        ${n > 1 ? `<p class="gallery-header__count" aria-hidden="true"><span class="gallery-header__now">1</span> / ${n}</p>` : ''}${extra}
      </div>
      <button type="button" id="seeAllPhotos" class="btn-ghost gallery-header__all">See all ${items.length} photo${items.length > 1 ? 's' : ''}</button>
      <dialog id="lightbox" aria-label="Photo gallery">
        <div style="position:relative;width:min(90vw,900px);">
          <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Close">&times;</button>
          <img id="lightboxImg" src="" alt="" style="display:block;width:100%;height:auto;max-height:80vh;object-fit:contain;" />
          <button type="button" class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Previous photo">&lsaquo;</button>
          <button type="button" class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Next photo">&rsaquo;</button>
          <p id="lightboxCount" style="text-align:center;margin:10px 0 0;font-family:var(--mono);font-size:12px;letter-spacing:.08em;color:rgba(243,242,238,.8);"></p>
          <p id="lightboxCredit" hidden style="text-align:center;margin:4px 0 0;font-family:var(--mono);font-size:12px;letter-spacing:.08em;color:rgba(243,242,238,.8);"></p>
        </div>
      </dialog>`;
}

function gallery(d) {
  const p = d.page.photos ?? { mode: 'placeholder' };
  if (p.mode === 'gallery') return galleryHeader(d);
  if (p.mode === 'stock') {
    return p.items
      .map((it, i) => {
        const ratio = i === 0 ? '16/7' : '4/3';
        const img = `<img src="${imgUrl(it.src, 1600)}" srcset="${imgUrl(it.src, 800)} 800w, ${imgUrl(it.src, 1600)} 1600w" sizes="(max-width:820px) 100vw, 760px" alt="${esc(it.alt)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} style="display:block;width:100%;height:100%;object-fit:cover;object-position:${esc(it.position ?? 'center')};" />`;
        return `<figure class="demo-photo${i === 0 ? ' demo-photo--main' : ''}" style="margin:0;">
          <div style="aspect-ratio:${ratio};overflow:hidden;border:1px solid var(--line);">${img}</div>
          <figcaption class="t-small" style="margin-top:6px;color:var(--ink-3);">Stock photo: <a href="${utm(it.profile)}" class="navlink" target="_blank" rel="noopener">${esc(it.name)}</a> on <a href="${utm(it.page)}" class="navlink" target="_blank" rel="noopener">Unsplash</a>.</figcaption>
        </figure>`;
      })
      .join('\n        ');
  }
  return `<figure style="margin:0;">
          <div class="photo-placeholder" role="img" aria-label="Photos coming soon">
            <span class="photo-placeholder__name">${esc(d.business.name)}</span>
            <span class="photo-placeholder__label">Photos coming soon</span>${d.business.listing === 'live' ? '' : `
            <span class="example-tag">Demo</span>`}
          </div>
        </figure>`;
}

// Site header and footer, shared by the demo page and the card preview.
const HEADER = `  <header class="site-header" style="position:sticky;top:0;background:var(--paper-glass);backdrop-filter:blur(8px);z-index:20;">
    <div class="bar" style="display:flex;align-items:baseline;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line);">
      <a href="/index.html#top" class="logo">RealDays.</a>
      <nav class="nav" id="siteNav" aria-label="Main">
        <a href="/#browse" class="navlink">Browse experiences</a>
        <a href="/for-business/" class="btn-ghost">For businesses</a>
      </nav>
      <button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="Menu">
        <svg class="icon-burger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
      </button>
    </div>
  </header>
`;
const FOOTER = `  <footer style="border-top:1px solid var(--line);padding-top:28px;padding-bottom:44px;color:var(--ink-3);">
    <div class="container" style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:20px;font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;">
      <span style="color:var(--ink);">&copy; 2026 RealDays</span>
      <nav aria-label="Footer" style="display:flex;gap:20px;flex-wrap:wrap;">
        <a href="/for-business/" class="navlink" style="display:inline-flex;align-items:center;min-height:44px;">For businesses</a>
      </nav>
    </div>
  </footer>
`;

// The black demo banner (design system 6.18), one line in every mode. Sandbox:
// picks out the Stripe test card. Demo: the full flow with no card (the Worker skips
// Checkout for a demo business with no Stripe test account).
function bannerFor(b) {
  const mode = b.booking_mode ?? 'off';
  if (mode === 'sandbox') return '<div class="demo-strip demo-strip--sandbox" role="note">Demo. Test card <span class="demo-strip__card">4242 4242 4242 4242</span></div>';
  if (mode === 'demo') return '<div class="demo-strip" role="note">Demo. Try a booking, no card needed</div>';
  if (mode === 'link') return `<div class="demo-strip" role="note">Demo page for ${esc(b.name)}. Not live yet. Availability and booking are on the business's own website.</div>`;
  return '<div class="demo-strip" role="note">Demo. Bookings are not taken</div>';
}

// booking_mode "link" (listing only, briefs/demo-data-batch2-2026-10-21.md): the
// panel lists the experiences and its Book button goes to the business's own
// booking page (the experience's external_book_url, or page.book_url), tagged
// utm_source=realdays so the business can see the clicks we send. No dates, no
// payment, nothing held. The Worker is used only to count demo traffic.
function linkPanel(b, p, askOnly, extra = '') {
  return `<div id="bpForm">
        <div id="step1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label">${esc(p.choose_label)}</p>
            <div class="opt-list" id="choices" role="group" aria-label="${esc(p.choose_label)}"></div>
            <p class="bp-lead" id="panelLead" hidden></p>
          </div>${extra}
          <p class="bp-note" id="datesNote" style="margin-top:var(--s-3);"></p>
          <ul class="bp-notes" id="notes"></ul>
          <div class="bp-decision">
            <a class="btn" id="bookingCta" href="#" target="_blank" rel="noopener">Check availability on website</a>
          </div>
          <p class="bp-note" id="linkNote" style="margin-top:var(--s-2);"></p>
        </div>
        <p class="bp-error" id="err" hidden></p>
        ${askOnly}
      </div>`;
}

// The link out, tagged so the business's own analytics show RealDays (& if the
// link already has a query).
function outbound(url, slug) {
  if (!url) return null;
  return `${url}${url.includes('?') ? '&' : '?'}utm_source=realdays&utm_medium=listing&utm_campaign=${slug}`;
}

// The "Getting there" tab (Ro, 27 Oct 2026), when the data file has page.getting_there:
// an intro, one block per place (name, address, a map link, notes), then general notes.
function gettingThere(g) {
  if (!g) return '';
  const map = (q) => `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(q)}`;
  const places = (g.places ?? [])
    .map((pl) => `<div class="there-place">
          <h3>${esc(pl.name)}</h3>
          <p class="prose prose--info" style="margin:0;">${tbc(pl.address)}</p>
          ${(pl.notes ?? []).map((n) => `<p class="prose" style="margin:var(--s-2) 0 0;">${tbc(n)}</p>`).join('\n          ')}
          ${pl.map_query ? `<p style="margin:var(--s-3) 0 0;"><a class="btn-ghost" href="${map(pl.map_query)}" target="_blank" rel="noopener">Open in Google Maps</a></p>` : ''}
        </div>`)
    .join('\n        ');
  return `

      <section id="there" role="tabpanel" aria-labelledby="h-there tab-there" tabindex="0" hidden>
        <h2 id="h-there">Getting there</h2>
        ${g.intro ? `<p class="prose" style="margin:0 0 var(--s-5);">${tbc(g.intro)}</p>` : ''}
        ${places}
        ${(g.notes ?? []).length ? `<dl class="know-details" style="margin-top:var(--s-6);">
          ${g.notes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${tbc(v)}</dd></div>`).join('\n          ')}
        </dl>` : ''}
      </section>`;
}

// One page per class (page.class_pages, Ro, 27 Oct 2026, briefs/suigeneris-live-2026-10-27.md):
// the business page becomes a hub with a Classes grid, and each class gets its own
// page at /demo/b/<slug>/<key>/, built from a copy of the data narrowed to that class.
// Where a business's pages live: /demo/b/<slug>/, or business.path for a live listing
// with its own address (Suigeneris Atelier at /suigeneris-atelier/, Ro, 27 Oct 2026).
function baseOf(b) {
  if (b.path == null) return `/demo/b/${b.slug}/`;
  if (!/^\/[a-z0-9-]+\/$/.test(b.path)) throw new Error(`${b.slug}: business.path must look like /name/`);
  return b.path;
}

const money = (c) => `$${(c / 100).toLocaleString('en-AU', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

function narrowTo(d, key) {
  const x = d.page.experiences[key];
  const photos = x.photos ?? [];
  return {
    ...d,
    page: {
      ...d.page,
      options: d.page.options.filter((o) => o.experience === key),
      experiences: { [key]: x },
      photos: photos.length ? { mode: 'gallery', dir: d.page.photos.dir, items: photos } : { mode: 'placeholder' },
    },
  };
}

// A class page's prices, in the booking panel under the class. Classes for 2 or more
// (people_min) are priced each.
function pricesBlock(e) {
  const each = (e.people_min ?? 1) > 1;
  const rows = (e.prices ?? [{ label: e.name, price_cents: e.price_cents }]).map((pr) => {
    const label = each ? pr.label.replace(/,?\s*per person$/i, '') || 'Price' : pr.label;
    return `<div><dt>${esc(label)}</dt><dd>${money(pr.price_cents)}${each ? ' each' : ''}</dd></div>`;
  });
  return `
          <div class="bp-block bp-prices">
            <p class="bp-label">Prices</p>
            <dl>
              ${rows.join('\n              ')}
            </dl>${each ? `
            <p class="bp-note" style="margin-top:var(--s-2);">Book for ${e.people_min} or more.</p>` : ''}
          </div>`;
}

// The hub's Classes grid: one card per class in the site's card shell, linking to its page.
function classCards(d) {
  const p = d.page, dir = p.photos.dir, base = baseOf(d.business);
  return p.options
    .map((o) => {
      const e = d.experiences.find((y) => y.key === o.experience), x = p.experiences[o.experience];
      // page.experiences.<key>.card: a thumbnail made for the cards (frame cropped), else the first photo.
      const ph = x.card ?? (x.photos ?? [])[0];
      const media = ph
        ? `<picture style="display:block;height:100%;"><source type="image/avif" srcset="${dir}${ph.file}-800.avif" /><img src="${dir}${ph.file}-800.webp" alt="${esc(ph.alt)}" width="${Math.round((ph.w * 800) / Math.max(ph.w, ph.h))}" height="${Math.round((ph.h * 800) / Math.max(ph.w, ph.h))}" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:cover;" /></picture>`
        : '<span class="class-card__nophoto">Photo coming soon</span>';
      const price = (o.sub ?? '').replace(/(\$[\d,]+)/, '$1 AUD');
      return `<a class="card sc-card" href="${base}${o.experience}/">
            <div class="card__media">${media}</div>
            <div class="card__body">
              <h3 class="card__title">${esc(e.name)}</h3>
              <p class="card__loc">${esc(x.card_length ?? x.facts[0])}</p>
              <div class="card__meta card__row"><p class="card__price">${esc(price)}</p></div>
            </div>
          </a>`;
    })
    .join('\n          ');
}

// The hub's booking panel: no class picker (the grid does that), a jump to the
// classes, and the "Also from" list.
function hubPanel(d, askOnly) {
  const p = d.page, n = p.options.length;
  const from = Math.min(...p.options.map((o) => d.experiences.find((e) => e.key === o.experience).price_cents));
  return `<div id="bpForm">
        <div id="step1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label">Classes</p>
            <p class="bp-lead" style="margin-top:0;">${n} classes, from ${money(from)}</p>
            <p class="bp-note" style="margin-top:var(--s-2);">Choose a class to see its prices, photos and class times. You book and pay on ${esc(p.studio_name ?? d.business.name)}'s own booking page.</p>
          </div>
          <div class="bp-decision">
            <a class="btn" id="bookingCta" href="#classes">See the classes</a>
          </div>
          <p class="bp-note" id="linkNote" hidden></p>
        </div>
        <p class="bp-error" id="err" hidden></p>
        ${askOnly}
      </div>`;
}

// The redirect left at /demo/b/<slug>/ when a listing has its own address.
function movedPage(d, base) {
  const keys = JSON.stringify(d.page.class_pages ? d.page.options.map((o) => o.experience) : []);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex" />
<title>${esc(d.business.name)} | RealDays</title>
<link rel="canonical" href="https://getrealdays.com${base}" />
<!-- Generated by tools/build-business-demos.mjs. ${esc(d.business.name)} moved to ${base}. Do not edit by hand. -->
<script>(function () { var k = new URLSearchParams(location.search).get('x'); location.replace('${base}' + (${keys}.indexOf(k) >= 0 ? k + '/' : '')); })();</script>
<meta http-equiv="refresh" content="0; url=${base}" />
</head>
<body>
<p><a href="${base}">${esc(d.business.name)} has moved here.</a></p>
</body>
</html>
`;
}

// The owner strip under the heading: the business's picture (or initials) and name.
function ownerStrip(p, b, href) {
  return `<a href="${href}" class="owner-strip navlink">
        ${p.avatar
          // page.avatar: a picture from the business's own website (Ro, 27 Oct 2026), else the initials.
          ? `<img src="${esc(p.avatar.src)}" alt="" width="40" height="40" style="width:40px;height:40px;flex:none;border:1px solid var(--line);background:var(--panel);box-sizing:border-box;object-fit:${p.avatar.fit ?? 'cover'};${p.avatar.fit === 'contain' ? 'padding:3px;' : ''}">`
          : `<span aria-hidden="true" style="width:40px;height:40px;flex:none;border:1px solid var(--line);background:var(--panel);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;">${esc(p.initials)}</span>`}
        <span>${esc(p.owner_line)} &middot; ${esc(b.name)}</span>
      </a>`;
}

// The demo page styles, shared by the experience page and the gift card page.
const DEMO_CSS = `  /* Business demo, Stripe test mode. Unlisted (noindex, robots.txt). Booking
     panel: /assets/demo-booking.js, talking to api-test.getrealdays.com. */
  [hidden]{display:none!important}
  .tbc{font-family:var(--mono);font-size:.85em;letter-spacing:.02em;color:var(--ink-2);background:var(--panel);border:1px dashed var(--line-ui);border-radius:4px;padding:0 4px;white-space:normal}
  .example-tag{display:inline-flex;align-items:center;min-height:24px;padding:2px 10px;border:1px solid var(--line-ui);border-radius:var(--r-pill);font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);vertical-align:middle}
  .detail-lead{margin:0 0 var(--s-2);font-family:var(--display);font-size:16px;color:var(--ink)}
  .demo-photos{display:grid;grid-template-columns:1fr 1fr;gap:var(--s-3)}
  .gallery-header__all{margin-top:var(--s-3)}
  #knowList{margin:0 0 var(--s-6)}
  .bp-done .bp-summary{margin:0 0 var(--s-4)}
  .bp-done .know-list__wrap{margin:0 0 var(--s-5);padding-top:var(--s-4);border-top:1px solid var(--line)}
  .demo-photos .demo-photo--main{grid-column:1 / -1}

  .booking-panel{border:1px solid var(--line);padding:var(--s-4) var(--s-5) var(--s-5);background:var(--paper)}
  .bp-steplabel{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);margin:0 0 var(--s-2)}
  .bp-block{margin-top:var(--s-4)}
  .bp-block > .bp-label{margin:0 0 var(--s-2)}
  .bp-lead{margin:var(--s-3) 0 0;font-family:var(--display);font-size:14px;font-weight:600;color:var(--ink)}

  /* Option, date and time buttons: square (Ro, 21 Oct 2026). The experience and date
     lists are full-width rows, name on the left and details on the right, on one
     line when they fit. Short choices (times, chips, add-ons) stay two up, stacked and centred. */
  .opt-list,.date-list,.time-list{display:grid;grid-template-columns:1fr 1fr;gap:var(--s-2)}
  #choices,.date-list{grid-template-columns:1fr;gap:var(--s-3)}
  .opt-list > p,.date-list > p{grid-column:1 / -1}
  .opt,.date-opt{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;width:100%;min-height:56px;padding:9px 12px;text-align:center;font-family:var(--display);font-size:14px;line-height:1.2;text-transform:none;color:var(--ink);background:none;border:1px solid var(--line-ui);border-radius:var(--r-0);cursor:pointer}
  #choices .opt,.date-list .date-opt{flex-direction:row;justify-content:space-between;gap:var(--s-2);padding:var(--s-3) var(--s-4) var(--s-3) var(--s-3);text-align:left}
  #choices .opt > *,.date-list .date-opt > *{white-space:nowrap}
  #choices .opt > small,.date-list .date-opt > small:first-of-type{margin-left:auto}
  /* A row that still doesn't fit wraps instead of running out of the box. A date range
     (a course or a multi-day booking) is always two lines: dates, then sessions and time. */
  #choices .opt,.date-list .date-opt{flex-wrap:wrap;row-gap:4px}
  .date-list .date-opt--range{flex-direction:column;align-items:flex-start;justify-content:center}
  .date-opt__meta{display:flex;flex-wrap:wrap;gap:4px var(--s-3)}
  .opt small,.date-opt small{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
  .opt small:empty{display:none}
  .opt--chip{min-height:44px}
  .opt:hover,.date-opt:hover{border-color:var(--ink);background:var(--tint-hover)}
  .opt[aria-pressed=true],.date-opt[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .opt[aria-pressed=true] small,.date-opt[aria-pressed=true] small{color:var(--paper-2)}
  .opt[disabled],.date-opt[disabled]{opacity:.5;cursor:default;background:none}
  .bp-more{margin-top:var(--s-2);background:none;border:0;padding:6px 0;font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);text-decoration:underline;text-underline-offset:3px;cursor:pointer;min-height:44px}

  /* "More dates" opens a month calendar of every open date, as far ahead as the business
     takes bookings (Ro, 23 Oct 2026). A centred panel on desktop, a bottom sheet on phones. */
  .bp-cal{width:calc(100% - var(--s-6));max-width:calc(var(--s-10) * 3);padding:var(--s-4) var(--s-4) var(--s-5);border:var(--bw) solid var(--line);border-radius:var(--r-0);background:var(--paper);color:var(--ink);box-shadow:var(--shadow-float)}
  .bp-cal::backdrop{background:var(--scrim)}
  .bp-cal__top,.bp-cal__head{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3)}
  .bp-cal__top .bp-label{margin:0}
  .bp-cal__head{margin:var(--s-3) 0}
  .bp-cal__month{margin:0;font-family:var(--mono);font-size:var(--t-label);letter-spacing:.08em;text-transform:uppercase}
  .bp-cal__close,.bp-cal__nav{width:var(--control-h);height:var(--control-h);display:flex;align-items:center;justify-content:center;padding:0;background:none;border:var(--bw) solid var(--line-ui);border-radius:var(--r-0);font-family:var(--mono);font-size:var(--t-body);color:var(--ink);cursor:pointer}
  .bp-cal__close{border-color:transparent;font-size:var(--t-subhead)}
  .bp-cal__nav:hover:not([disabled]),.bp-cal__close:hover{border-color:var(--ink);background:var(--tint-hover)}
  .bp-cal__nav[disabled]{color:var(--ink-disabled);border-color:var(--line);cursor:default}
  .bp-cal__week,.bp-cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:var(--s-1)}
  .bp-cal__week span{padding:var(--s-1) 0;text-align:center;font-family:var(--mono);font-size:var(--t-label);color:var(--ink-3)}
  .bp-cal__day{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:0;background:none;border:var(--bw) solid var(--line-ui);border-radius:var(--r-0);font-family:var(--display);font-size:var(--t-body);color:var(--ink);cursor:pointer}
  .bp-cal__day::after{content:"";position:absolute;bottom:var(--s-1);width:var(--s-1);height:var(--s-1);border-radius:var(--r-round);background:currentColor}
  .bp-cal__day:hover:not([disabled]){border-color:var(--ink);background:var(--tint-hover)}
  .bp-cal__day[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .bp-cal__day[disabled]{border-color:transparent;color:var(--ink-disabled);cursor:default}
  .bp-cal__day[disabled]::after{content:none}
  .bp-cal__day--full{text-decoration:line-through}
  .bp-cal__note{margin:var(--s-3) 0 0}
  @media (max-width:820px){
    .bp-cal{width:100%;max-width:100%;margin:auto 0 0;max-height:90dvh;overflow:auto;padding-bottom:calc(var(--s-5) + env(safe-area-inset-bottom))}
  }

  /* People stepper */
  .bp-row{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3);margin-top:var(--s-4)}
  .bp-row .bp-label{margin:0}
  .stepper{display:inline-flex;align-items:center;border:1px solid var(--line-ui);border-radius:var(--r-pill);min-height:44px}
  .stepper button{width:44px;height:44px;background:none;border:0;font-family:var(--mono);font-size:18px;color:var(--ink);cursor:pointer;border-radius:var(--r-pill)}
  .stepper button[disabled]{color:var(--ink-disabled);cursor:default}
  .stepper output{min-width:28px;text-align:center;font-family:var(--mono);font-size:15px}

  .bp-notes{list-style:none;margin:var(--s-4) 0 0;padding:var(--s-3) 0 0;border-top:1px solid var(--line);display:grid;gap:6px}
  .bp-notes li{font-family:var(--display);font-size:13px;line-height:1.45;color:var(--ink-2)}
  .bp-total{display:flex;justify-content:space-between;align-items:baseline;gap:var(--s-3);margin:var(--s-4) 0 0;padding-top:var(--s-3);border-top:1px solid var(--line);font-family:var(--display);font-size:15px}
  .bp-total b{font-weight:600;font-size:17px}
  #step1 .bp-decision{margin-top:var(--s-5)}

  /* Step 2 */
  .bp-chosen{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3);font-family:var(--display);font-size:15px;line-height:1.35;padding:var(--s-2) 0 var(--s-3);margin-bottom:var(--s-4);border-bottom:1px solid var(--line)}
  .bp-change{position:relative;background:none;border:0;padding:0;font-family:var(--mono);font-size:12px;line-height:16px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);text-decoration:underline;text-underline-offset:3px;cursor:pointer;white-space:nowrap}
  .bp-change::before{content:"";position:absolute;inset:-14px -8px}
  .bp-field{margin:0 0 var(--s-4)}
  .bp-field label{display:block;margin:0 0 var(--s-2);font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2)}
  .bp-field input{display:block;width:100%;font-size:16px;padding:6px 0 11px;min-height:40px}
  .bp-field input:focus,.bp-field input:focus-visible{outline:none;border-bottom:2px solid var(--ink);padding-bottom:10px}
  .bp-field.has-error input{border-bottom:2px solid var(--ink);padding-bottom:10px}
  .bp-hint{margin:6px 0 0;font-family:var(--display);font-size:13px;line-height:1.4;color:var(--ink-2)}
  .bp-field-error{display:flex;gap:8px;align-items:flex-start;width:100%;margin:8px 0 0;padding:7px 10px;background:var(--panel);border:1px solid var(--line-ui);border-radius:8px;font-family:var(--display);font-size:13px;line-height:1.4;font-weight:400;color:var(--ink)}
  .bp-field-error svg{flex:none;margin-top:2px}
  .bp-riders{margin:0 0 var(--s-4);padding:var(--s-3) 0 0;border-top:1px solid var(--line)}
  .bp-rider{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0 var(--s-4)}
  .bp-riders .bp-q{margin:var(--s-2) 0 var(--s-2);font-weight:600}
  .bp-check{display:flex;gap:10px;align-items:flex-start;font-family:var(--display);font-size:14px;line-height:1.4;color:var(--ink);text-transform:none;letter-spacing:0;cursor:pointer;min-height:44px}
  .bp-check input{flex:none;width:20px;height:20px;margin:1px 0 0;accent-color:var(--ink)}
  .bp-summary{background:var(--panel);border-radius:var(--r-card,14px);padding:var(--s-3) var(--s-4);margin:var(--s-2) 0 var(--s-4);font-family:var(--display);font-size:15px;line-height:1.45}
  .bp-summary .row{display:flex;justify-content:space-between;gap:var(--s-3);padding:4px 0}
  .bp-summary .row b{font-weight:600}
  .bp-summary .later{color:var(--ink-2);font-size:14px;border-top:1px solid var(--line);margin-top:8px;padding-top:10px}
  #bookingCta,#requestBtn{width:100%;justify-content:center;min-height:48px;font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.02em}
  #bookingCta[disabled]{opacity:.45;cursor:default}
  .bp-under{margin:var(--s-2) 0 0;font-family:var(--display);font-size:13px;color:var(--ink-2);text-align:center}
  .bp-policy{margin:var(--s-4) 0 0;padding-top:var(--s-3);border-top:1px solid var(--line);display:grid;gap:var(--s-2)}
  .bp-policy p{margin:0;font-family:var(--display);font-size:13px;line-height:1.45;color:var(--ink-2)}
  .bp-error{color:var(--ink);background:var(--panel);border-left:2px solid var(--ink);padding:8px 12px;margin:var(--s-3) 0 0;font-family:var(--display);font-size:14px}
  .bp-choice{display:flex;gap:var(--s-2)}
  .bp-choice label{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--line-ui);border-radius:var(--r-pill);font-family:var(--display);font-size:14px;text-transform:none;letter-spacing:0;color:var(--ink);cursor:pointer;margin:0}
  .bp-choice input{position:absolute;opacity:0;width:1px;height:1px}
  .bp-choice label:has(input:checked){background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .bp-choice label:has(input:focus-visible){outline:2px solid var(--ink);outline-offset:2px}
  .bp-q{display:block;margin:0 0 var(--s-2);font-family:var(--display);font-size:14px;line-height:1.4;color:var(--ink)}
  .bp-ask{margin-top:var(--s-5);padding-top:var(--s-3);border-top:1px solid var(--line)}
  .bp-ask ul{list-style:none;margin:var(--s-2) 0 0;padding:0;display:grid;gap:6px}
  .bp-ask li{font-family:var(--display);font-size:13px;line-height:1.45;color:var(--ink-2)}
  .bp-ask b{font-weight:600;color:var(--ink)}
  .demo-box{margin-top:var(--s-4);padding:var(--s-3) var(--s-4);border:1px dashed var(--line-ui);border-radius:var(--r-card,14px)}
  .demo-box p{margin:0 0 var(--s-2);font-family:var(--display);font-size:13px;line-height:1.45;color:var(--ink-2)}
  .demo-box .btn-ghost{width:100%;justify-content:center}
  .resp-actions{display:grid;gap:var(--s-2);margin-top:var(--s-4)}
  .resp-actions .btn,.resp-actions .btn-ghost{width:100%;justify-content:center;min-height:48px}
  .bp-done h2{font-size:28px;line-height:1.1;margin:var(--s-2) 0 var(--s-3)}
  .steps{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-4);max-width:35em}
  .steps li{display:grid;grid-template-columns:28px 1fr;gap:var(--s-3)}
  .steps .n{font-family:var(--mono);font-size:12px;width:28px;height:28px;border:1px solid var(--line-ui);border-radius:50%;display:flex;align-items:center;justify-content:center}
  .steps b{font-family:var(--display);font-weight:600;display:block;color:var(--ink)}
  .there-place{padding:var(--s-4) 0;border-top:1px solid var(--line);max-width:40em}
  .bp-prices dl{margin:0;display:grid;gap:6px}
  .bp-prices dl div{display:flex;justify-content:space-between;align-items:baseline;gap:var(--s-3);font-family:var(--display);font-size:14px;line-height:1.35}
  .bp-prices dd{margin:0;white-space:nowrap;font-weight:600}
  .class-grid{margin:var(--s-6) 0 var(--s-7);scroll-margin-top:calc(var(--header-h,104px) + var(--s-4))}
  .class-grid h2{margin:0 0 var(--s-4)}
  .class-grid .card__media{aspect-ratio:211/158;overflow:hidden}
  @media (max-width:820px){
    .class-grid .card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-3)}
    .class-grid .card__body{padding:var(--s-3)}
  }
  .class-card__nophoto{height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
  .more-classes{margin:var(--s-7) 0 0;padding-top:var(--s-4);border-top:1px solid var(--line)}
  .there-place h3{margin:0 0 var(--s-2)}

`;

// Gift card styles, only on pages for a business with page.gift.
const GIFT_CSS = `
  /* Gift cards (Ro, 27 Oct 2026): a code box in the booking panel, and the gift card page. */
  .bp-gift{margin-top:var(--s-2)}
  #doneTitle:focus{outline:none}
  .bp-gift .bp-field{margin:var(--s-2) 0 0}
  .bp-gift__row{display:flex;gap:var(--s-2);align-items:flex-end}
  .bp-gift__row input{flex:1;min-width:0;text-transform:uppercase}
  .bp-gift__row .btn-ghost{min-height:40px}
  .bp-gift__on{display:flex;justify-content:space-between;align-items:baseline;gap:var(--s-3);margin-top:var(--s-2);padding:var(--s-2) var(--s-3);background:var(--panel)}
  .bp-gift__on .bp-note{margin:0;color:var(--ink)}
  .bp-giftbuy{margin:var(--s-4) 0 0;padding-top:var(--s-3);border-top:1px solid var(--line);font-family:var(--display);font-size:14px;color:var(--ink-2)}
  .bp-giftbuy a{color:var(--ink);text-decoration:underline;text-underline-offset:3px}
  .gift-card{margin:var(--s-5) 0 0;background:var(--ink);color:var(--paper);display:grid;grid-template-columns:2fr 3fr;max-width:640px}
  .gift-card__photo{position:relative;min-height:100%}
  .gift-card__photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .gift-card__body{padding:var(--s-4) var(--s-5) var(--s-5);display:flex;flex-direction:column;gap:var(--s-2)}
  .gift-card__brand{margin:0 0 var(--s-2);display:flex;justify-content:space-between;gap:var(--s-3);font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--paper-2)}
  .gift-card__brand b{font-family:var(--display);font-size:16px;letter-spacing:0;text-transform:none;font-weight:600;color:var(--paper)}
  .gift-card__what{margin:0;font-family:var(--display);font-size:24px;line-height:1.15;font-weight:500}
  .gift-card__biz{margin:0;font-family:var(--display);font-size:14px;color:var(--paper-2)}
  .gift-card__msg{margin:var(--s-2) 0 0;font-family:var(--display);font-size:15px;line-height:1.45}
  .gift-card__meta{margin:var(--s-3) 0 0;padding-top:var(--s-3);border-top:1px solid var(--line-dark);display:grid;grid-template-columns:1fr 1fr;gap:var(--s-3)}
  .gift-card__meta dt{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--paper-3)}
  .gift-card__meta dd{margin:2px 0 0;font-family:var(--display);font-size:15px;overflow-wrap:anywhere}
  .gift-card__meta .gift-card__code{font-family:var(--mono);letter-spacing:.06em}
  .gift-msg textarea{display:block;width:100%;min-height:88px;font-size:16px;line-height:1.4;padding:6px 0 11px;resize:vertical}
  .gift-msg textarea:focus{outline:none;border-bottom:2px solid var(--ink);padding-bottom:10px}
  #giftCta{width:100%;justify-content:center;min-height:48px;font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.02em}
  .gift-email{margin:var(--s-6) 0 0;max-width:640px;border:1px solid var(--line);background:var(--panel)}
  .gift-email__head{margin:0;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:4px var(--s-3);font-family:var(--display);font-size:14px}
  .gift-email__head dt{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
  .gift-email__head dd{margin:0;overflow-wrap:anywhere}
  .gift-email__body{padding:var(--s-4) var(--s-4) var(--s-5);background:var(--paper);font-family:var(--display);font-size:15px;line-height:1.5}
  .gift-email__body p{margin:0 0 var(--s-3)}
  .gift-email__msg{padding-left:var(--s-3);border-left:2px solid var(--ink)}
  .gift-email__code{font-family:var(--mono);letter-spacing:.06em}
  .gift-terms{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-2);max-width:40em}
  .gift-terms li{font-family:var(--display);font-size:15px;line-height:1.45;color:var(--ink-2);padding-left:var(--s-4);position:relative}
  .gift-terms li::before{content:"";position:absolute;left:0;top:.6em;width:6px;height:6px;background:var(--ink)}
  @media (max-width:820px){
    .gift-card{grid-template-columns:1fr}
    .gift-card__photo{aspect-ratio:16/9;min-height:0}
  }
`;

function page(d, view = {}) {
  const b = d.business;
  const p = fillTokens(d.page, d);
  const slug = b.slug;
  // business.listing "live" (Ro, 27 Oct 2026): a real listing, not a demo, so no demo
  // strip, Demo flag or "Demo:" title. Pages stay noindex until Ro says otherwise.
  const live = b.listing === 'live';
  const hub = !!view.hub;
  const cls = view.cls ? d.experiences.find((e) => e.key === view.cls) : null;
  const base = baseOf(b);
  // booking_mode: sandbox (Stripe test mode, demo banner always on), off (no online
  // booking), live (not built: the booking service is test-only, so it's refused).
  const mode = b.booking_mode ?? 'off';
  if (!MODES.includes(mode)) throw new Error(`${slug}: booking_mode must be one of ${MODES.join(', ')}`);
  if (mode === 'live') throw new Error(`${slug}: booking_mode "live" isn't built yet. The booking service is test-only.`);
  const banner = live ? '' : bannerFor(b);
  // Good to know lives on the business layer's experience (the Worker emails it too).
  // Classes taken off the listing (page.options_hidden) stay out of the page.
  const hidden = new Set((p.options_hidden ?? []).map((o) => o.experience));
  const experiences = Object.fromEntries(
    Object.entries(p.experiences).filter(([k]) => !hidden.has(k)).map(([k, x]) => {
      const e = d.experiences.find((y) => y.key === k);
      return [k, { ...x, good_to_know: e?.good_to_know ?? [], ...(mode === 'link' ? { book_url: outbound(e?.external_book_url ?? p.book_url, slug) } : {}) }];
    }),
  );
  const config = {
    slug,
    business: b.name,
    booking_mode: mode,
    timezone: b.timezone ?? 'Australia/Melbourne',
    phone: p.contact_phone ?? null,
    party: p.party,
    options: p.options,
    experiences,
    addons: p.addons ?? [],
    riders: p.riders ?? null,
    pickup: p.pickup ?? null,
    price_basis: p.price_basis ?? null,
    gift: p.gift ? { experience: p.gift.experience, url: `/demo/b/${slug}/gift/` } : null,
    ...(hub ? { hub: true } : {}),
    // page.cancellation: what a link-mode page says instead, when the policy is the business's to give.
    ...(mode === 'link' ? { cancellation: p.cancellation ?? b.cancellation_policy?.text ?? null, contact: p.contact ?? null } : {}),
  };
  if (mode === 'link') {
    for (const [k, x] of Object.entries(experiences)) {
      if (x.book_url && !/^https:\/\//.test(x.book_url)) throw new Error(`${slug}: ${k} book link must be https`);
    }
  }
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const askOnly = (p.ask_only ?? []).length
    ? `<div class="bp-ask">
          <p class="bp-label">Also from ${esc(b.name)}</p>
          <ul>${p.ask_only.map((a) => `<li><b>${esc(a.name)}</b> ${tbc(a.note)}</li>`).join('')}</ul>
        </div>`
    : '';
  const know = p.know.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${tbc(v)}</dd></div>`).join('\n          ');
  // An about line can be { "text": ..., "info": true }: a functional detail (hours,
  // address), in body ink like the Good to know details (design system 6.22).
  const about = p.about
    .map((t) => (typeof t === 'string' ? { text: t } : t))
    .map((t) => `<p class="prose${t.info ? ' prose--info' : ''}" style="margin:0 0 var(--s-3);">${tbc(t.text)}</p>`)
    .join('\n        ');
  const gal = gallery({ ...d, page: p });
  const photoNote = p.photo_note ? `<p class="t-small" style="margin:6px 0 0;color:var(--ink-3);">${tbc(p.photo_note)}</p>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${live ? '' : 'Demo: '}${cls ? `${esc(cls.name)}, ` : ''}${esc(b.name)} | RealDays</title>${hub ? `
<script>(function () { var k = new URLSearchParams(location.search).get('x'); if (${JSON.stringify(p.options.map((o) => o.experience))}.indexOf(k) >= 0) location.replace('${base}' + k + '/'); })();</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="preload" href="/assets/fonts/neuehaas-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/neuehaas-600.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/styles.css?v=7b958919" />
<link rel="icon" href="/assets/favicon.svg?v=c732d6da" type="image/svg+xml" />
<!-- Generated by tools/build-business-demos.mjs from data/business-layer/${slug}.json. Do not edit by hand. -->
<style>
${DEMO_CSS}${p.gift ? GIFT_CSS : ''}</style>
</head>
<body class="has-sticky-bar">
${banner}
<div>
${HEADER}<main id="main">

  <nav class="container detail-crumbs detail-crumbs--one-line" aria-label="Breadcrumb" style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);">
    <a href="/index.html#top" class="navlink breadcrumb-link">Home</a> /
    ${cls ? `<a href="${base}" class="navlink breadcrumb-link">${esc(b.name)}</a> /
    <span class="breadcrumb-tail">${esc(cls.name)}</span>` : `<span class="breadcrumb-tail">${esc(b.name)}</span>`}
  </nav>

  <div class="container detail-layout">
    <div class="detail-head">
      ${live || b.show_demo_flag === false ? '' : '<p class="demo-flag"><span class="demo-flag__tag">Demo</span><span class="demo-flag__text">No real booking is made</span></p>'}
      <h1>${esc(cls ? cls.name : p.headline)}</h1>
      <p class="detail-lead" id="lead" hidden></p>${cls ? `
      <p class="detail-lead">${tbc(cls.description)}</p>` : ''}
      ${ownerStrip(p, b, '#business')}
      ${hub ? '' : '<ul class="fact-row fact-row--ink" id="facts" style="margin:var(--s-4) 0 var(--s-5);"></ul>'}
      <div class="detail-gallery${p.photos?.mode === 'stock' ? ' demo-photos' : ''}" id="detailGallery"${hub ? ' style="margin-top:var(--s-5);"' : ''}>
        ${gal}
      </div>
      ${photoNote}${hub ? `
      <section class="class-grid" id="classes" aria-labelledby="h-classes">
        <h2 id="h-classes">Classes</h2>
        <div class="card-grid">
          ${classCards(d)}
        </div>
      </section>` : ''}
    </div>

    <aside class="booking-panel" id="book" aria-label="${mode === 'link' ? 'Check availability' : 'Book'}">
      ${hub ? hubPanel(d, askOnly) : mode === 'link' ? linkPanel(b, p, cls ? '' : askOnly, cls ? pricesBlock(cls) : d.experiences.length === 1 && (d.experiences[0].prices ?? []).length > 1 ? pricesBlock(d.experiences[0]) : '') : `<div id="bpForm">
        <div id="step1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label">${esc(p.choose_label)}</p>
            <div class="opt-list" id="choices" role="group" aria-label="${esc(p.choose_label)}"></div>
            <p class="bp-lead" id="panelLead" hidden></p>
          </div>${p.gift ? `
          <div class="bp-gift" id="giftBox">
            <button type="button" class="bp-more" id="giftToggle" aria-expanded="false" aria-controls="giftForm">Have a gift card?</button>
            <div id="giftForm" hidden>
              <div class="bp-field" id="f-giftCode">
                <label for="giftCode">Gift card code</label>
                <div class="bp-gift__row">
                  <input id="giftCode" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="giftCode-err" />
                  <button type="button" class="btn-ghost" id="giftApply">Apply</button>
                </div>
                <p class="bp-field-error" id="giftCode-err" hidden></p>
              </div>
            </div>
            <div class="bp-gift__on" id="giftOn" hidden>
              <p class="bp-note" id="giftOnText"></p>
              <button type="button" class="bp-change" id="giftRemove">Remove</button>
            </div>
          </div>` : ''}
          <div id="groups"></div>
          <div class="bp-block">
            <p class="bp-label" id="datesLabel">Choose a date</p>
            <div class="date-list" id="dates"><p class="bp-note">Loading dates...</p></div>
            <button type="button" class="bp-more" id="moreDates" aria-haspopup="dialog" hidden>More dates</button>
            <dialog class="bp-cal" id="calendar" aria-labelledby="calTitle">
              <div class="bp-cal__top">
                <p class="bp-label" id="calTitle">Choose a date</p>
                <button type="button" class="bp-cal__close" id="calClose" aria-label="Close">&times;</button>
              </div>
              <div class="bp-cal__head">
                <button type="button" class="bp-cal__nav" id="calPrev" aria-label="Previous month">&larr;</button>
                <p class="bp-cal__month" id="calMonth" aria-live="polite"></p>
                <button type="button" class="bp-cal__nav" id="calNext" aria-label="Next month">&rarr;</button>
              </div>
              <div class="bp-cal__week" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              <div class="bp-cal__grid" id="calGrid"></div>
              <p class="bp-note bp-cal__note">Dates with a dot are open.</p>
            </dialog>
            <p class="bp-note" id="filterHint" style="margin-top:var(--s-2);" hidden></p>
            <div class="bp-block" id="timesBlock" hidden>
              <p class="bp-label">Choose a time</p>
              <div class="time-list" id="times"></div>
            </div>
            <p class="bp-note" id="timesNote" style="margin-top:var(--s-2);"></p>
            <p class="bp-note" id="datesNote" style="margin-top:4px;"></p>
          </div>

          <div id="party"></div>
          <ul class="bp-notes" id="notes"></ul>
          <div class="bp-total" id="total" aria-live="polite" hidden><span>Total</span><b id="totalValue"></b></div>
          <div class="bp-decision">
            <button type="button" class="btn" id="bookingCta" disabled>Continue to book</button>
          </div>
          <p class="bp-note" style="margin-top:var(--s-2);">You won't be charged yet.</p>${p.gift ? `
          <p class="bp-giftbuy">Giving it as a gift? <a href="/demo/b/${slug}/gift/" class="navlink">Buy a gift card</a></p>` : ''}
        </div>

        <form id="step2" novalidate hidden>
          <p class="bp-steplabel">Step 2 of 2</p>
          <div class="bp-chosen"><span id="chosen"></span><button type="button" class="bp-change" id="change">Change</button></div>

          <div class="bp-field" id="f-name">
            <label for="name">Full name</label>
            <input id="name" name="name" autocomplete="name" aria-describedby="name-err" />
            <p class="bp-field-error" id="name-err" hidden></p>
          </div>
          <div class="bp-field" id="f-email">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="email-err" />
            <p class="bp-field-error" id="email-err" hidden></p>
          </div>
          <div class="bp-field" id="f-phone">
            <label for="phone">Mobile</label>
            <input id="phone" name="phone" type="tel" autocomplete="tel" required aria-describedby="phone-hint phone-err" />
            <p class="bp-hint" id="phone-hint">So ${esc(b.name)} can reach you on the day.</p>
            <p class="bp-field-error" id="phone-err" hidden></p>
          </div>
          <p class="bp-note" id="pickup" style="margin:0 0 var(--s-4);" hidden></p>

          <div id="riders"></div>
          <div id="questions"></div>
          <div class="bp-summary" id="summary" aria-live="polite"></div>
          <button type="submit" class="btn" id="requestBtn">${mode === 'demo' ? 'Send request' : 'Continue to payment'}</button>
          <p class="bp-under">${mode === 'demo' ? "Demo: the card step is skipped. In a live booking you'd add your card next, held, not charged." : "Next, add your card. It's held, not charged."}</p>

          <div class="bp-policy">
            <p id="policyHold"></p>
            <p id="policyCancel"></p>
          </div>
        </form>
        <p class="bp-error" id="err" hidden></p>
        ${askOnly}
      </div>

      <div id="bpDone" class="bp-done" hidden>
        <p class="bp-label" id="doneLabel"></p>
        <h2 id="doneTitle"></h2>
        <p class="prose" id="doneText" style="margin:0 0 var(--s-4);"></p>
        <div class="bp-summary" id="doneSummary" hidden></div>
        <div class="know-list__wrap" id="doneKnow" hidden>
          <h3 class="know-list__title">Good to know</h3>
          <ul class="know-list" id="doneKnowList"></ul>
        </div>
        <button type="button" class="btn" id="doneBtn" hidden style="width:100%;margin-bottom:var(--s-3);"></button>
        <p class="bp-error" id="doneErr" hidden></p>
        <a class="btn-ghost" id="doneBack" href="./">Back to ${esc(b.name)}</a>
        <div class="demo-box" id="demoBox" hidden></div>
      </div>

      <div id="bpBiz" hidden>
        <p class="bp-label">What ${esc(b.name)} sees</p>
        <h2 style="font-size:28px;line-height:1.1;margin:var(--s-2) 0 var(--s-3);">New booking request</h2>
        <div class="bp-summary" id="reqBox"></div>
        <div class="resp-actions" id="respActions" hidden>
          <button type="button" class="btn" data-act="accept">Accept</button>
          <button type="button" class="btn-ghost" data-act="decline">Decline</button>
        </div>
        <p class="bp-note" id="respNote" style="margin-top:var(--s-3);"></p>
        <p class="bp-error" id="respErr" hidden></p>
        <div class="demo-box" id="bizDemoBox" hidden></div>
      </div>`}
    </aside>

    <div class="detail-content">
      <div class="page-nav" role="tablist" aria-label="On this page">
        <button type="button" role="tab" id="tab-overview" aria-controls="overview" aria-selected="true" tabindex="0">Overview</button>
        <button type="button" role="tab" id="tab-know" aria-controls="know" aria-selected="false" tabindex="-1">Good to know</button>
        <button type="button" role="tab" id="tab-how" aria-controls="how" aria-selected="false" tabindex="-1">How booking works</button>
        <button type="button" role="tab" id="tab-business" aria-controls="business" aria-selected="false" tabindex="-1">The business</button>${p.getting_there ? `
        <button type="button" role="tab" id="tab-there" aria-controls="there" aria-selected="false" tabindex="-1">Getting there</button>` : ''}
      </div>

      <section id="overview" role="tabpanel" aria-labelledby="h-overview tab-overview" tabindex="0">
        <h2 id="h-overview">Overview</h2>
        <p class="prose">${tbc(p.description)}</p>${hub ? '' : `
        <h3>What's included</h3>
        <ul class="prose" id="included" style="margin:0;padding:0;list-style:none;display:grid;gap:8px;"></ul>`}
      </section>

      <section id="know" role="tabpanel" aria-labelledby="h-know tab-know" tabindex="0" hidden>
        <h2 id="h-know">Good to know</h2>
        <ul class="know-list" id="knowList" hidden></ul>
        <dl class="know-details">
          ${know}
        </dl>
        <h3 id="h-cancellation">Cancellation</h3>
        <p class="prose prose--info" id="policy"></p>
      </section>

      <section id="how" role="tabpanel" aria-labelledby="h-how tab-how" tabindex="0" hidden>
        <h2 id="h-how">How booking works</h2>
        <ol class="steps" id="howSteps"></ol>
      </section>

      <section id="business" role="tabpanel" aria-labelledby="h-business tab-business" tabindex="0" hidden>
        <h2 id="h-business">Meet the business</h2>
        <p class="card-title" style="margin:0 0 var(--s-2);">${esc(b.name)}</p>
        ${about}
${live ? '' : `        <p class="prose" style="margin:0;">A real listing would tell the owner's story here, in their words.</p>
`}      </section>${gettingThere(p.getting_there)}${renderReviews(b.reviews, slug)}${cls ? `
      <p class="more-classes"><a href="${base}#classes" class="btn-ghost">More classes from ${esc(p.studio_name ?? b.name)}</a></p>` : ''}
    </div>
  </div>

</main>
${FOOTER}</div>
<aside class="mobile-sticky-bar" id="mobileStickyBar" aria-label="Booking summary">
  <span class="t-small" id="stickyPrice">${esc(hub ? `${p.options.length} classes, from ${money(Math.min(...p.options.map((o) => d.experiences.find((e) => e.key === o.experience).price_cents)))} AUD` : p.sticky_price ?? '')}</span>
  ${hub ? '<a href="#classes" class="btn" id="stickyCta">See the classes</a>' : mode === 'link' ? '<a href="#book" class="btn" id="stickyCta">Check availability</a>' : '<a href="#book" class="btn">Choose a date</a>'}
</aside>
<script type="application/json" id="demo-config">${json}</script>
${mode === 'link' ? '<script src="/assets/booking/track.js?v=1a5b125d"></script>\n' : ''}<script src="/assets/demo-booking.js?v=4f5d8b01"></script>
<script src="/app.js?v=b7dbe1be"></script>
<script src="/assets/detail.js?v=9d402d14" defer></script>
</body>
</html>
`;
}

// The gift card page, /demo/b/<slug>/gift/ (Ro, 27 Oct 2026), when the data file has
// page.gift. A clickable demo run by /assets/demo-gift.js: choose a flight, how it's
// sent and the card's words, then the buyer's details; the card and the email the
// person getting it opens follow. Nothing is charged, and the booking service isn't used.
function giftPage(d) {
  const b = d.business;
  const p = fillTokens(d.page, d);
  const g = p.gift;
  const slug = b.slug;
  const x = d.experiences.find((e) => e.key === g.experience);
  if (!x) throw new Error(`${slug}: gift.experience ${g.experience} has no experience`);
  const bookUrl = `/demo/b/${slug}/?x=${g.experience}`;
  const config = {
    slug,
    business: b.name,
    timezone: b.timezone ?? 'Australia/Melbourne',
    prefix: g.prefix,
    experience: g.experience,
    flight_name: x.name.toLowerCase(),
    options: g.options.map(({ key, label, price_cents, sub }) => ({ key, label, price_cents, sub })),
    valid_years: g.valid_years,
    book_url: bookUrl,
  };
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const ph = g.photo;
  const photo = ph
    ? `<picture>
            <source type="image/avif" srcset="${p.photos.dir}${ph.file}-800.avif" />
            <img src="${p.photos.dir}${ph.file}-800.webp" width="${ph.w}" height="${ph.h}" alt="${esc(ph.alt)}" fetchpriority="high" />
          </picture>`
    : '';
  const options = g.options
    .map((o, i) => `<button type="button" class="opt" aria-pressed="${i === 0}"><span>${esc(o.label)}</span><small></small></button>`)
    .join('\n              ');
  const steps = [
    ['Choose a flight and write the card', 'Send it to yourself to print or forward, or straight to them on the day you pick.'],
    ['Pay', "In a live purchase you'd pay by card. This demo skips that step."],
    ['They book a date', `With the code, on the ${b.name} page, any time in the next ${g.valid_years} years.`],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Demo: ${esc(b.name)} gift card | RealDays</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="preload" href="/assets/fonts/neuehaas-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/neuehaas-600.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/styles.css?v=7b958919" />
<link rel="icon" href="/assets/favicon.svg?v=c732d6da" type="image/svg+xml" />
<!-- Generated by tools/build-business-demos.mjs from data/business-layer/${slug}.json. Do not edit by hand. -->
<style>
${DEMO_CSS}${GIFT_CSS}</style>
</head>
<body>
<div class="demo-strip" role="note">Demo. Try a gift card, no card needed</div>
<div>
${HEADER}<main id="main">

  <nav class="container detail-crumbs detail-crumbs--one-line" aria-label="Breadcrumb" style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);">
    <a href="/index.html#top" class="navlink breadcrumb-link">Home</a> /
    <a href="${bookUrl}" class="navlink breadcrumb-link">${esc(b.name)}</a> /
    <span class="breadcrumb-tail">Gift card</span>
  </nav>

  <div class="container detail-layout">
    <div class="detail-head">
      <p class="demo-flag"><span class="demo-flag__tag">Demo</span><span class="demo-flag__text">Nothing is charged or sent</span></p>
      <h1>${esc(g.headline)}</h1>
      <p class="detail-lead">${tbc(g.lead)}</p>
      ${ownerStrip(p, b, bookUrl)}

      <figure class="gift-card" id="giftCard" aria-label="Your gift card">
        <div class="gift-card__photo">
          ${photo}
        </div>
        <div class="gift-card__body">
          <p class="gift-card__brand"><b>RealDays.</b><span>Gift card</span></p>
          <p class="gift-card__what" id="gcWhat"></p>
          <p class="gift-card__biz">with ${esc(b.name)}</p>
          <p class="gift-card__msg" id="gcMsg" hidden></p>
          <dl class="gift-card__meta">
            <div><dt>To</dt><dd id="gcTo"></dd></div>
            <div><dt>From</dt><dd id="gcFrom"></dd></div>
            <div><dt>Code</dt><dd class="gift-card__code" id="gcCode"></dd></div>
            <div><dt>Valid until</dt><dd id="gcUntil"></dd></div>
          </dl>
        </div>
      </figure>

      <section class="gift-email" id="giftEmail" aria-labelledby="h-email" hidden>
        <h2 class="sr-only" id="h-email">The email they get</h2>
        <dl class="gift-email__head">
          <dt>From</dt><dd>RealDays</dd>
          <dt>To</dt><dd id="emTo"></dd>
          <dt>Subject</dt><dd id="emSubject"></dd>
        </dl>
        <div class="gift-email__body">
          <p id="emHi"></p>
          <p id="emLead"></p>
          <p class="gift-email__msg" id="emMsg" hidden></p>
          <p>Your code: <span class="gift-email__code" id="emCode"></span></p>
          <p><a class="btn" id="emailBook" href="${bookUrl}">Book your flight</a></p>
          <p class="t-small" style="color:var(--ink-3);">The flight limits apply: under 130kg and 6'4". Questions? Reply to this email.</p>
        </div>
      </section>

    </div>

    <aside class="booking-panel" id="book" aria-label="Buy a gift card">
      <div id="gForm">
        <div id="gStep1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label" id="optLabel">Flight</p>
            <div class="opt-list" id="choices" role="group" aria-labelledby="optLabel">
              ${options}
            </div>
          </div>
          <div class="bp-block">
            <p class="bp-label" id="sendLabel">How should we send it?</p>
            <div class="opt-list" id="sendTo" role="group" aria-labelledby="sendLabel">
              <button type="button" class="opt opt--chip" data-to="me" aria-pressed="true"><span>Email it to me</span><small>To print or forward</small></button>
              <button type="button" class="opt opt--chip" data-to="them" aria-pressed="false"><span>Email it to them</span><small>On a day you choose</small></button>
            </div>
          </div>
          <div class="bp-block">
            <div class="bp-field" id="f-toName">
              <label for="toName">To</label>
              <input id="toName" autocomplete="off" aria-describedby="toName-err" />
              <p class="bp-field-error" id="toName-err" hidden></p>
            </div>
            <div id="themFields" hidden>
              <div class="bp-field" id="f-toEmail">
                <label for="toEmail">Their email</label>
                <input id="toEmail" type="email" inputmode="email" autocomplete="off" aria-describedby="toEmail-err" />
                <p class="bp-field-error" id="toEmail-err" hidden></p>
              </div>
              <div class="bp-field" id="f-sendOn">
                <label for="sendOn">Send it on</label>
                <input id="sendOn" type="date" aria-describedby="sendOn-err" />
                <p class="bp-field-error" id="sendOn-err" hidden></p>
              </div>
            </div>
            <div class="bp-field gift-msg" id="f-message">
              <label for="message">Message (optional)</label>
              <textarea id="message" maxlength="200" aria-describedby="msgCount"></textarea>
              <p class="bp-hint" id="msgCount">0 / 200</p>
            </div>
            <div class="bp-field" id="f-fromName">
              <label for="fromName">From</label>
              <input id="fromName" autocomplete="given-name" aria-describedby="fromName-err" />
              <p class="bp-field-error" id="fromName-err" hidden></p>
            </div>
          </div>
          <div class="bp-total" aria-live="polite"><span>Total</span><b id="totalValue"></b></div>
          <div class="bp-decision" style="margin-top:var(--s-5);">
            <button type="button" class="btn" id="giftCta">Continue</button>
          </div>
        </div>

        <form id="gStep2" novalidate hidden>
          <p class="bp-steplabel">Step 2 of 2</p>
          <div class="bp-chosen"><span id="chosen"></span><button type="button" class="bp-change" id="change">Change</button></div>
          <div class="bp-field" id="f-buyerName">
            <label for="buyerName">Your full name</label>
            <input id="buyerName" autocomplete="name" aria-describedby="buyerName-err" />
            <p class="bp-field-error" id="buyerName-err" hidden></p>
          </div>
          <div class="bp-field" id="f-buyerEmail">
            <label for="buyerEmail">Your email</label>
            <input id="buyerEmail" type="email" autocomplete="email" inputmode="email" aria-describedby="buyerEmail-hint buyerEmail-err" />
            <p class="bp-hint" id="buyerEmail-hint">For your receipt and a copy of the gift card.</p>
            <p class="bp-field-error" id="buyerEmail-err" hidden></p>
          </div>
          <div class="bp-summary" id="summary" aria-live="polite"></div>
          <button type="submit" class="btn" id="requestBtn">Buy gift card</button>
          <p class="bp-under">Demo: the card step is skipped. In a live purchase you'd pay by card next.</p>
        </form>
      </div>

      <div id="gDone" class="bp-done" hidden>
        <p class="bp-label" id="doneLabel"></p>
        <h2 id="doneTitle" tabindex="-1"></h2>
        <p class="prose" id="doneText" style="margin:0 0 var(--s-4);"></p>
        <div class="bp-summary" id="doneSummary"></div>
        <a class="btn-ghost" href="${bookUrl}">Back to ${esc(b.name)}</a>
        <div class="demo-box">
          <p>Demo: in the real thing, ${esc(b.name)} is told about each gift card sold, and is paid the day after the flight, like any booking. Now try it as the person getting it.</p>
          <div class="resp-actions" style="margin-top:0;">
            <button type="button" class="btn-ghost" id="seeEmail">See the email they get</button>
            <a class="btn-ghost" id="redeemLink" href="${bookUrl}">Book a flight with the code</a>
          </div>
        </div>
      </div>
    </aside>

    <div class="detail-content" style="margin-top:var(--s-7);">
      <section aria-labelledby="h-how">
        <h2 id="h-how">How it works</h2>
        <ol class="steps">
          ${steps.map(([t, s], i) => `<li><span class="n">${i + 1}</span><span><b>${esc(t)}</b><span class="prose" style="display:block;">${esc(s)}</span></span></li>`).join('\n          ')}
        </ol>
      </section>

      <section style="margin-top:var(--s-7);" aria-labelledby="h-terms">
        <h2 id="h-terms">Good to know</h2>
        <ul class="gift-terms">
          ${g.terms.map((t) => `<li>${tbc(t)}</li>`).join('\n          ')}
        </ul>
      </section>
    </div>
  </div>

</main>
${FOOTER}</div>
<script type="application/json" id="gift-config">${json}</script>
<script src="/assets/demo-gift.js?v=c42f0cc4"></script>
<script src="/app.js?v=b7dbe1be"></script>
</body>
</html>
`;
}

const wanted = process.argv.slice(2);
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));
let built = 0;
for (const f of files) {
  const d = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
  if (!d.page) continue;
  if (d.taken_down) continue; // off the site (Tiger Moth World 25 Oct, Lygon Street Pottery 26 Oct 2026): never rebuilt
  const slug = d.business.slug;
  if (wanted.length && !wanted.includes(slug)) continue;
  if (`${slug}.json` !== f) throw new Error(`${f}: business.slug is ${slug}`);
  for (const o of d.page.options) {
    if (!d.experiences.some((e) => e.key === o.experience)) throw new Error(`${slug}: option ${o.experience} has no experience`);
    if (!d.page.experiences[o.experience]) throw new Error(`${slug}: no page copy for ${o.experience}`);
  }
  const base = baseOf(d.business);
  const out = join(repo, base, 'index.html');
  if (!existsSync(dirname(out))) mkdirSync(dirname(out), { recursive: true });
  if (d.page.class_pages) {
    writeFileSync(out, page(d, { hub: true }));
    for (const o of d.page.options) {
      const c = join(repo, base, o.experience, 'index.html');
      if (!existsSync(dirname(c))) mkdirSync(dirname(c), { recursive: true });
      writeFileSync(c, page(narrowTo(d, o.experience), { cls: o.experience }));
    }
    // Classes taken off the listing (page.options_hidden, Sui's request, 30 Oct 2026)
    // keep their address as a redirect to the listing, so shared links still land.
    for (const o of d.page.options_hidden ?? []) {
      const c = join(repo, base, o.experience, 'index.html');
      if (!existsSync(dirname(c))) mkdirSync(dirname(c), { recursive: true });
      writeFileSync(c, movedPage(d, base));
    }
    console.log(`Built ${base} and ${d.page.options.length} class pages${d.page.options_hidden?.length ? `, ${d.page.options_hidden.length} redirects` : ''}`);
  } else {
    writeFileSync(out, page(d));
    console.log(`Built ${base}`);
  }
  // A listing that moved off /demo/b/ leaves a redirect there, so old links (and
  // ?x=<class> links) still land on the right page.
  if (base !== `/demo/b/${slug}/`) {
    const old = join(repo, 'demo/b', slug, 'index.html');
    if (!existsSync(dirname(old))) mkdirSync(dirname(old), { recursive: true });
    writeFileSync(old, movedPage(d, base));
  }
  if (d.page.gift) {
    const g = join(repo, 'demo/b', slug, 'gift/index.html');
    if (!existsSync(dirname(g))) mkdirSync(dirname(g), { recursive: true });
    writeFileSync(g, giftPage(d));
    console.log(`Built /demo/b/${slug}/gift/`);
  }
  built++;
}
if (!built) console.log('Nothing built: no data file with a "page" section matched.');
