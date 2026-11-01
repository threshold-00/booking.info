#!/usr/bin/env node
// Builds what crawlers and partners read across listings (Ro, 31 Oct 2026), from the
// data files with business.open_to_crawlers, plus Salty Cowboy:
//   /experiences.json             the catalogue, only the fields in tools/listing-record.mjs
//   /melbourne/ /regional-victoria/ /workshops/   index pages
//   /mornington-peninsula/        the Victoria hub's list and ItemList
//   sitemap.xml, llms.txt         between their open-listings markers
// Run after tools/build-business-demos.mjs:
//   node tools/build-listing-layers.mjs
// Then node tools/stamp-assets.mjs. Fails if robots.txt still blocks an open listing.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordFor, factLines, priceText, baseUrl, experiencePath } from './listing-record.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://getrealdays.com';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = (p) => readFileSync(join(repo, p), 'utf8');
const write = (p, s) => { mkdirSync(dirname(join(repo, p)), { recursive: true }); writeFileSync(join(repo, p), s); };

const open = readdirSync(join(repo, 'data/business-layer'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(read(`data/business-layer/${f}`)))
  .filter((d) => d.business.open_to_crawlers && !d.taken_down);

const robots = read('robots.txt');
for (const d of open) {
  const path = baseUrl(d.business);
  if (path.startsWith('/demo/b/') || robots.includes(`Disallow: ${path}\n`)) throw new Error(`robots.txt blocks ${path}`);
}

const victoria = open.flatMap((d) => d.page.options.map((o) => ({ d, r: recordFor(d, o.experience), photo: d.record.experiences[o.experience].image, regions: d.record.index_regions })));

// Salty Cowboy has its own data file and pages. Facts it doesn't hold stay null.
const salty = JSON.parse(read('data/salty-cowboy.json'));
const SALTY_CATEGORY = { rides: 'ride', lessons: 'class', photoshoots: 'photoshoot' };
const saltyRecords = salty.activities.map((a) => {
  const m = salty.business.meetingPoint;
  const know = (label) => a.goodToKnow.find((g) => g.label === label)?.value ?? null;
  return {
    id: `salty-cowboy/${a.slug}`,
    name: a.title,
    summary: a.cardDesc,
    description: a.overview,
    category: SALTY_CATEGORY[a.type] ?? a.type,
    tags: ['horses', a.type],
    business: salty.business.name,
    run_by: 'Simone',
    running_since: null,
    running_note: null,
    locality: 'Bali',
    region: 'Bali',
    state: null,
    country: 'ID',
    full_address: null,
    address_note: m.label,
    lat: m.lat,
    lng: m.lng,
    location_precision: 'exact',
    offers: a.durations.filter((x) => x.priceIDR).map((x) => ({ label: x.label, amount: x.priceIDR, currency: 'IDR', unit: a.priceUnit })),
    private_group_price: null,
    group_min: null,
    group_max: a.maxPeople ?? null,
    group_note: a.basis ?? null,
    private_bookings: null,
    duration_minutes: a.durationMinutes ?? null,
    duration_days: a.durationDays ?? null,
    duration_text: a.durations.map((x) => x.label).join(' or '),
    days_and_times: `${a.durations.map((x) => `${x.label}: ${x.startTimes.join(', ')}`).join('. ')}. Closed Sundays and Saturday afternoons.`,
    lead_time: null,
    age_min: null,
    skill: know('Riding experience') ?? know('Experience'),
    what_to_bring: null,
    cancellation: null,
    weather: null,
    booking_mode: 'click_out',
    booking_note: "Book on Salty Cowboy's own booking site.",
    reviews: null,
    last_verified: null,
    verified_against: null,
    url: `${SITE}/bali/salty-cowboy/${a.slug}/`,
    book_url: `https://book.saltycowboybali.com/${a.slug}?ref=threshold`,
  };
});

// The feed. Cents become amounts here, so every offer reads the same way.
const feedRecords = [
  ...victoria.map(({ r }) => ({ ...r, offers: r.offers.map(({ amount_cents, ...o }) => ({ ...o, amount: amount_cents / 100 })) })),
  ...saltyRecords,
];
const updated = feedRecords.map((r) => r.last_verified).sort().at(-1);
write('experiences.json', `${JSON.stringify({
  name: 'RealDays experiences',
  description: 'Experiences listed on RealDays, run by the local people who started them. Null means not confirmed.',
  url: `${SITE}/experiences.json`,
  last_updated: updated,
  count: feedRecords.length,
  experiences: feedRecords,
}, null, 2)}\n`);

// Header, footer and stamped stylesheet links from a built listing, so these pages match.
const shell = read(`${baseUrl(open.find((d) => !d.page.class_pages).business).slice(1)}index.html`);
const header = shell.match(/<header[\s\S]*?<\/header>/)[0];
const footer = shell.match(/<footer[\s\S]*?<\/footer>/)[0];
const stylesheet = shell.match(/<link rel="stylesheet" href="\/styles\.css[^>]*>/)[0];
const favicon = shell.match(/<link rel="icon"[^>]*>/)[0];
const appJs = shell.match(/<script src="\/app\.js[^>]*><\/script>/)[0];

const LINE_KEYS = ['Price', 'Duration', 'Days and times', 'Group size', 'Private groups', 'Location', 'Run by', 'Skill level', 'Booking'];
function row({ r, d, photo }) {
  const lines = factLines(r).filter(([k]) => LINE_KEYS.includes(k));
  return `<article class="split" style="display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:var(--s-5);padding:var(--s-5) 0;border-top:1px solid var(--line);">
          <a href="${experiencePath(d, r.id.split('/')[1])}"><picture><source type="image/avif" srcset="${d.page.photos.dir}${photo}-800.avif" /><img src="${d.page.photos.dir}${photo}-800.webp" alt="" width="800" height="534" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;" /></picture></a>
          <div>
            <h3 style="font-size:22px;line-height:1.15;margin:0 0 var(--s-1);"><a href="${experiencePath(d, r.id.split('/')[1])}" class="navlink" style="color:var(--ink);">${esc(r.name)}</a></h3>
            <p style="margin:0 0 var(--s-3);color:var(--ink-2);">${esc(r.summary)}</p>
            <dl style="margin:0;display:grid;gap:var(--s-1);">
              ${lines.map(([k, v]) => `<div style="display:grid;grid-template-columns:120px minmax(0,1fr);gap:var(--s-2);"><dt style="font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);">${esc(k)}</dt><dd style="margin:0;">${esc(v)}</dd></div>`).join('\n              ')}
            </dl>
          </div>
        </article>`;
}

const itemList = (name, items) => ({
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map(({ r }, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: r.url })),
});

function indexPage({ path, title, h1, intro, items }) {
  const url = `${SITE}${path}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', url, name: h1, description: intro, dateModified: items.map(({ r }) => r.last_verified).sort().at(-1) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'RealDays', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: h1, item: url }] },
      itemList(h1, items),
    ],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} | RealDays</title>
<meta name="description" content="${esc(intro)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RealDays" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(title)} | RealDays" />
<meta property="og:description" content="${esc(intro)}" />
<meta property="og:image" content="${SITE}/assets/og-image.png" />
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="preload" href="/assets/fonts/neuehaas-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/neuehaas-600.woff2" as="font" type="font/woff2" crossorigin />
${stylesheet}
${favicon}
<!-- Generated by tools/build-listing-layers.mjs. Do not edit by hand. -->
</head>
<body>
<div>
${header}
<main id="main" class="container" style="padding-top:var(--s-7);padding-bottom:var(--section-y);">
  <h1 style="font-size:clamp(34px,5.6vw,64px);line-height:1.05;margin:0 0 var(--s-3);">${esc(h1)}</h1>
  <p style="margin:0 0 var(--s-6);max-width:62ch;color:var(--ink-2);">${esc(intro)}</p>
  <p class="label" style="margin:0 0 var(--s-3);">${items.length} ${items.length === 1 ? 'experience' : 'experiences'}</p>
  <section aria-label="${esc(h1)}">
        ${items.map(row).join('\n        ')}
  </section>
</main>
${footer}
</div>
${appJs}
</body>
</html>
`;
}

const inRegion = (slug) => victoria.filter((x) => x.regions.includes(slug));
const PAGES = [
  { path: '/melbourne/', title: 'Workshops and classes in Melbourne', h1: 'Workshops and classes in Melbourne', intro: 'Hands-on classes in Melbourne, run by the local people who started them.', items: inRegion('melbourne') },
  { path: '/regional-victoria/', title: 'Workshops in regional Victoria', h1: 'Workshops in regional Victoria', intro: 'Hands-on workshops around regional Victoria, from the Mornington Peninsula to Geelong and the Indigo Valley, run by the local people who started them.', items: inRegion('regional-victoria') },
  { path: '/workshops/', title: 'Workshops and classes in Victoria', h1: 'Workshops and classes in Victoria', intro: 'Leather, perfume, ceramics and woodworking workshops in Victoria, Australia, run by the local people who started them.', items: victoria.filter(({ r }) => r.category === 'workshop') },
];
for (const pg of PAGES) write(`${pg.path.slice(1)}index.html`, indexPage(pg));

// The Victoria hub, between its markers.
function between(s, start, end, body, file) {
  const a = s.indexOf(start), b = s.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${file}: open-listings markers not found`);
  return `${s.slice(0, a + start.length)}\n${body}\n${s.slice(b)}`;
}
let hub = read('mornington-peninsula/index.html');
hub = between(hub, '<!-- open-listings:start -->', '<!-- open-listings:end -->', victoria.map(row).join('\n        '), 'hub');
hub = hub.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, (m) => {
  const j = JSON.parse(m.replace(/<\/?script[^>]*>/g, ''));
  j['@graph'] = j['@graph'].filter((x) => x['@type'] !== 'ItemList').concat(itemList('Experiences in Victoria, Australia', victoria));
  return `<script type="application/ld+json">\n${JSON.stringify(j, null, 2)}\n</script>`;
});
write('mornington-peninsula/index.html', hub);

// sitemap.xml and llms.txt.
const urls = [...PAGES.map((p) => p.path), ...open.flatMap((d) => [baseUrl(d.business), ...(d.page.class_pages ? d.page.options.map((o) => experiencePath(d, o.experience)) : [])])];
write('sitemap.xml', between(read('sitemap.xml'), '<!-- open-listings:start -->', '<!-- open-listings:end -->', [...new Set(urls)].map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n'), 'sitemap.xml'));

const llms = open.map((d) => {
  const rows = d.page.options.map((o) => recordFor(d, o.experience));
  return `### ${d.business.name}, ${d.record.locality}\n${d.record.summary}\n${rows.map((r) => `- [${r.name}](${r.url}): ${priceText(r.offers)}, ${r.duration_text}. ${r.summary}`).join('\n')}`;
}).join('\n\n');
write('llms.txt', between(read('llms.txt'), '<!-- open-listings:start -->', '<!-- open-listings:end -->', `## Workshops and classes in Victoria, Australia
- [All experiences as JSON](${SITE}/experiences.json): one record per experience. Null means not confirmed.
- [Workshops and classes in Victoria](${SITE}/workshops/)
- [Workshops and classes in Melbourne](${SITE}/melbourne/)
- [Workshops in regional Victoria](${SITE}/regional-victoria/)

${llms}`, 'llms.txt'));

console.log(`Feed: ${feedRecords.length} experiences. Index pages: ${PAGES.map((p) => `${p.path} (${p.items.length})`).join(', ')}. Hub: ${victoria.length}.`);
