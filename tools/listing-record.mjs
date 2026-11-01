// One record per experience, for listings open to crawlers (business.open_to_crawlers,
// Ro, 31 Oct 2026). The facts live in the data file's "record" section; this turns them
// into the visible Key facts lines and the JSON-LD, and build-listing-layers.mjs turns
// them into the public feed and index pages, so every layer says the same thing.
// A fact nobody has confirmed stays null and is left out of all of them.

const SITE = 'https://getrealdays.com';
const dollars = (c) => `$${(c / 100).toLocaleString('en-AU', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function baseUrl(b) {
  return b.path ?? `/demo/b/${b.slug}/`;
}

// A listed experience's address: its own page when the business has one per class.
export function experiencePath(d, key) {
  return d.page.class_pages ? `${baseUrl(d.business)}${key}/` : baseUrl(d.business);
}

export function bookUrl(d, key) {
  const e = d.experiences.find((x) => x.key === key);
  const url = e?.external_book_url ?? d.page.book_url;
  return `${url}${url.includes('?') ? '&' : '?'}utm_source=realdays&utm_medium=listing&utm_campaign=${d.business.slug}`;
}

export function priceText(offers) {
  const c = offers.map((o) => o.amount_cents);
  const lo = Math.min(...c), hi = Math.max(...c);
  return `${dollars(lo)}${hi > lo ? ` to ${dollars(hi)}` : ''} AUD per person`;
}

export function verifiedText(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// The record for one experience, business facts and experience facts together.
export function recordFor(d, key) {
  const r = d.record, x = r.experiences[key], e = d.experiences.find((y) => y.key === key);
  if (!x) throw new Error(`${d.business.slug}: no record for ${key}`);
  const offers = (e.prices ?? [{ label: e.name, price_cents: e.price_cents }]).map((p) => ({ label: p.label, amount_cents: p.price_cents, currency: 'AUD', unit: 'person' }));
  return {
    id: `${d.business.slug}/${key}`,
    name: x.name ?? e.name,
    summary: x.summary,
    description: x.description ?? d.page.description,
    category: x.category,
    tags: x.tags ?? [],
    business: d.business.name,
    run_by: r.owner_name ?? null,
    running_since: r.running_since ?? null,
    running_note: r.running_note ?? null,
    locality: r.locality,
    region: r.region,
    state: r.state,
    country: r.country,
    full_address: r.full_address ?? null,
    address_note: r.address_note ?? null,
    lat: r.lat,
    lng: r.lng,
    location_precision: r.location_precision,
    offers,
    private_group_price: x.private_group_price ?? null,
    group_min: x.group_min ?? null,
    group_max: x.group_max ?? null,
    group_note: x.group_note ?? null,
    private_bookings: x.private_bookings ?? null,
    duration_minutes: x.duration_minutes ?? null,
    duration_days: x.duration_days ?? null,
    duration_text: x.duration_text,
    days_and_times: x.days_and_times ?? null,
    lead_time: x.lead_time ?? r.lead_time ?? null,
    age_min: x.age_min ?? null,
    skill: x.skill ?? null,
    what_to_bring: x.what_to_bring ?? null,
    cancellation: x.cancellation ?? r.cancellation,
    weather: x.weather ?? r.weather ?? null,
    booking_mode: 'click_out',
    booking_note: r.booking_note,
    reviews: null,
    last_verified: d.business.verified_on,
    verified_against: r.verified_against,
    url: `${SITE}${experiencePath(d, key)}`,
    book_url: bookUrl(d, key),
    image: `${SITE}${d.page.photos.dir}${x.image}-800.webp`,
  };
}

// The short labelled lines, in the record's order. Only facts we have.
export function factLines(r) {
  const where = r.full_address ?? `${r.locality}, ${r.region}, ${r.state}`;
  const lines = [
    ['Price', priceText(r.offers)],
    ['Duration', r.duration_text],
    ['Days and times', r.days_and_times],
    ['Group size', r.group_note],
    ['Private groups', r.private_bookings],
    ['Location', r.address_note ? `${where}. ${r.address_note}` : where],
    ['Run by', r.run_by && r.run_by !== r.business ? `${r.run_by}, ${r.business}` : r.business],
    ['Experience', r.running_note],
    ['Minimum age', r.age_min == null ? null : `${r.age_min} years`],
    ['Skill level', r.skill],
    ['What to bring', r.what_to_bring],
    ['Book ahead', r.lead_time],
    ['Cancellation', r.cancellation],
    ['Weather', r.weather],
    ['Booking', r.booking_note],
    ['Last checked', `${verifiedText(r.last_verified)}, against ${r.verified_against}`],
  ];
  return lines.filter(([, v]) => v);
}

function place(r) {
  return {
    '@type': 'Place',
    name: r.locality,
    address: {
      '@type': 'PostalAddress',
      ...(r.full_address ? { streetAddress: r.full_address } : {}),
      addressLocality: r.locality,
      addressRegion: r.state,
      addressCountry: r.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lng },
  };
}

function providerOf(d, r) {
  const b = d.business;
  return {
    '@type': 'LocalBusiness',
    name: b.name,
    url: `${SITE}${baseUrl(b)}`,
    ...(d.record.website ? { sameAs: d.record.website } : {}),
    ...(r.run_by ? { founder: { '@type': 'Person', name: r.run_by } } : {}),
    address: place(r).address,
  };
}

function crumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
  };
}

const script = (graph) => `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c')}
</script>`;

// TouristTrip takes neither duration, group size nor age limits in schema.org, so those
// stay in the visible lines and the feed. Availability is left out: no calendar behind it.
export function experienceJsonLd(d, key) {
  const r = recordFor(d, key), b = d.business;
  const trail = [['RealDays', '/'], ...(d.page.class_pages ? [[b.name, baseUrl(b)]] : []), [d.page.class_pages ? r.name : b.name, experiencePath(d, key)]];
  const loc = place(r);
  if (r.group_max != null && d.record.experiences[key].group_max_is_venue) loc.maximumAttendeeCapacity = r.group_max;
  return script([
    { '@type': 'WebPage', url: r.url, name: r.name, dateModified: r.last_verified, mainEntity: { '@id': `${r.url}#experience` } },
    crumbs(trail),
    {
      '@type': 'TouristTrip',
      '@id': `${r.url}#experience`,
      name: r.name,
      description: r.summary,
      url: r.url,
      image: [r.image],
      touristType: r.tags.includes('beginners') ? 'Beginners' : undefined,
      provider: providerOf(d, r),
      location: loc,
      offers: r.offers.map((o) => ({
        '@type': 'Offer',
        name: o.label,
        price: (o.amount_cents / 100).toFixed(2),
        priceCurrency: o.currency,
        url: r.book_url,
      })),
    },
  ]);
}

// A business page with one page per class: the business and the list of its classes.
export function businessJsonLd(d) {
  const b = d.business, keys = d.page.options.map((o) => o.experience), first = recordFor(d, keys[0]);
  const url = `${SITE}${baseUrl(b)}`;
  return script([
    { '@type': 'WebPage', url, name: b.name, dateModified: b.verified_on },
    crumbs([['RealDays', '/'], [b.name, baseUrl(b)]]),
    { ...providerOf(d, first), description: d.record.summary },
    { '@type': 'ItemList', name: `${b.name} classes`, itemListElement: keys.map((k, i) => { const r = recordFor(d, k); return { '@type': 'ListItem', position: i + 1, name: r.name, url: r.url }; }) },
  ]);
}
