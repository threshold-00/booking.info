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
            <span class="photo-placeholder__label">Photos coming soon</span>
            <span class="example-tag">Demo</span>
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
        <a href="/mornington-peninsula/" class="navlink" style="display:inline-flex;align-items:center;min-height:44px;">Victoria, Australia</a>
        <a href="/bali/" class="navlink" style="display:inline-flex;align-items:center;min-height:44px;">Bali</a>
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
  if (mode === 'link') return '<div class="demo-strip" role="note">Demo. Book buttons go to their own site</div>';
  return '<div class="demo-strip" role="note">Demo. Bookings are not taken</div>';
}

// booking_mode "link" (listing only, briefs/demo-data-batch2-2026-10-21.md): the
// panel lists the experiences and its Book button goes to the business's own
// booking page (the experience's external_book_url, or page.book_url). No dates,
// no payment, nothing held. The Worker is used only to count demo traffic.
function linkPanel(b, p, askOnly) {
  return `<div id="bpForm">
        <div id="step1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label">${esc(p.choose_label)}</p>
            <div class="opt-list" id="choices" role="group" aria-label="${esc(p.choose_label)}"></div>
            <p class="bp-lead" id="panelLead" hidden></p>
          </div>
          <p class="bp-note" id="datesNote" style="margin-top:var(--s-3);"></p>
          <ul class="bp-notes" id="notes"></ul>
          <div class="bp-decision">
            <a class="btn" id="bookingCta" href="#" target="_blank" rel="noopener">Book on their website</a>
          </div>
          <p class="bp-note" id="linkNote" style="margin-top:var(--s-2);"></p>
        </div>
        <p class="bp-error" id="err" hidden></p>
        ${askOnly}
      </div>`;
}

function page(d) {
  const b = d.business;
  const p = fillTokens(d.page, d);
  const slug = b.slug;
  // booking_mode: sandbox (Stripe test mode, demo banner always on), off (no online
  // booking), live (not built: the booking service is test-only, so it's refused).
  const mode = b.booking_mode ?? 'off';
  if (!MODES.includes(mode)) throw new Error(`${slug}: booking_mode must be one of ${MODES.join(', ')}`);
  if (mode === 'live') throw new Error(`${slug}: booking_mode "live" isn't built yet. The booking service is test-only.`);
  const banner = bannerFor(b);
  // Good to know lives on the business layer's experience (the Worker emails it too).
  const experiences = Object.fromEntries(
    Object.entries(p.experiences).map(([k, x]) => {
      const e = d.experiences.find((y) => y.key === k);
      return [k, { ...x, good_to_know: e?.good_to_know ?? [], ...(mode === 'link' ? { book_url: e?.external_book_url ?? p.book_url ?? null } : {}) }];
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
    ...(mode === 'link' ? { cancellation: b.cancellation_policy?.text ?? null, contact: p.contact ?? null } : {}),
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
<title>Demo: ${esc(b.name)} | RealDays</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="preload" href="/assets/fonts/neuehaas-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/neuehaas-600.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/styles.css?v=a0fca9d4" />
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
<!-- Generated by tools/build-business-demos.mjs from data/business-layer/${slug}.json. Do not edit by hand. -->
<style>
  /* Business demo, Stripe test mode. Unlisted (noindex, robots.txt). Booking
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
</style>
</head>
<body class="has-sticky-bar">
${banner}
<div>
${HEADER}<main id="main">

  <nav class="container detail-crumbs detail-crumbs--one-line" aria-label="Breadcrumb" style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);">
    <a href="/index.html#top" class="navlink breadcrumb-link">Home</a> /
    <a href="${esc(p.hub.href)}" class="navlink breadcrumb-link">${esc(p.hub.label)}</a> /
    <span class="breadcrumb-tail">${esc(b.name)}</span>
  </nav>

  <div class="container detail-layout">
    <div class="detail-head">
      <p class="demo-flag"><span class="demo-flag__tag">Demo</span><span class="demo-flag__text">No real booking is made</span></p>
      <h1>${esc(p.headline)}</h1>
      <p class="detail-lead" id="lead" hidden></p>
      <a href="#business" class="owner-strip navlink">
        <span aria-hidden="true" style="width:40px;height:40px;flex:none;border:1px solid var(--line);background:var(--panel);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;">${esc(p.initials)}</span>
        <span>${esc(p.owner_line)} &middot; ${esc(b.name)}</span>
      </a>
      <ul class="fact-row fact-row--ink" id="facts" style="margin:var(--s-4) 0 var(--s-5);"></ul>
      <div class="detail-gallery${p.photos?.mode === 'stock' ? ' demo-photos' : ''}" id="detailGallery">
        ${gal}
      </div>
      ${photoNote}
    </div>

    <aside class="booking-panel" id="book" aria-label="Book">
      ${mode === 'link' ? linkPanel(b, p, askOnly) : `<div id="bpForm">
        <div id="step1">
          <div class="bp-block" style="margin-top:0;">
            <p class="bp-label">${esc(p.choose_label)}</p>
            <div class="opt-list" id="choices" role="group" aria-label="${esc(p.choose_label)}"></div>
            <p class="bp-lead" id="panelLead" hidden></p>
          </div>
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
          <p class="bp-note" style="margin-top:var(--s-2);">You won't be charged yet.</p>
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
        <button type="button" role="tab" id="tab-business" aria-controls="business" aria-selected="false" tabindex="-1">The business</button>
      </div>

      <section id="overview" role="tabpanel" aria-labelledby="h-overview tab-overview" tabindex="0">
        <h2 id="h-overview">Overview</h2>
        <p class="prose">${tbc(p.description)}</p>
        <h3>What's included</h3>
        <ul class="prose" id="included" style="margin:0;padding:0;list-style:none;display:grid;gap:8px;"></ul>
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
        <p class="prose" style="margin:0;">A real listing would tell the owner's story here, in their words.</p>
      </section>
    </div>
  </div>

</main>
${FOOTER}</div>
<aside class="mobile-sticky-bar" id="mobileStickyBar" aria-label="Booking summary">
  <span class="t-small" id="stickyPrice">${esc(p.sticky_price ?? '')}</span>
  <a href="#book" class="btn">${mode === 'link' ? 'Book' : 'Choose a date'}</a>
</aside>
<script type="application/json" id="demo-config">${json}</script>
<script src="/assets/demo-booking.js?v=641f34a7"></script>
<script src="/app.js?v=61fe8cbe"></script>
<script src="/assets/detail.js?v=845a0aa9" defer></script>
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
  const slug = d.business.slug;
  if (wanted.length && !wanted.includes(slug)) continue;
  if (`${slug}.json` !== f) throw new Error(`${f}: business.slug is ${slug}`);
  for (const o of d.page.options) {
    if (!d.experiences.some((e) => e.key === o.experience)) throw new Error(`${slug}: option ${o.experience} has no experience`);
    if (!d.page.experiences[o.experience]) throw new Error(`${slug}: no page copy for ${o.experience}`);
  }
  const out = join(repo, 'demo/b', slug, 'index.html');
  if (!existsSync(dirname(out))) mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(d));
  console.log(`Built /demo/b/${slug}/`);
  built++;
}
if (!built) console.log('Nothing built: no data file with a "page" section matched.');
