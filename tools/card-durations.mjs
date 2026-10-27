// Copies each experience's durationMinutes (and durationDays, for anything spread over
// two or more days) from the data files onto its homepage cards, as data-duration and
// data-days, for the Duration filter. Run after changing a duration or adding a card:
//   node tools/card-durations.mjs
// Demo cards (/demo/b/<slug>/?x=<key>) read data/business-layer/<slug>.json, page.experiences[key].
// Salty Cowboy cards (/bali/salty-cowboy/<slug>/) read data/salty-cowboy.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(repo, 'index.html');
const salty = JSON.parse(readFileSync(join(repo, 'data/salty-cowboy.json'), 'utf8'));
const business = {};

function duration(href) {
  // A business with a page per class links its cards to /demo/b/<slug>/<key>/.
  let m = href.match(/^\/demo\/b\/([a-z0-9-]+)\/(?:\?x=)?([a-z0-9-]+)/);
  if (m) {
    const f = join(repo, 'data/business-layer', `${m[1]}.json`);
    if (!existsSync(f)) return null;
    business[m[1]] ||= JSON.parse(readFileSync(f, 'utf8'));
    return business[m[1]].page?.experiences?.[m[2]] || null;
  }
  // A live listing with its own address, /<slug>/<key>/ (business.path).
  m = href.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)\/$/);
  if (m && existsSync(join(repo, 'data/business-layer', `${m[1]}.json`))) {
    business[m[1]] ||= JSON.parse(readFileSync(join(repo, 'data/business-layer', `${m[1]}.json`), 'utf8'));
    return business[m[1]].page?.experiences?.[m[2]] || null;
  }
  m = href.match(/^\/bali\/salty-cowboy\/([a-z0-9-]+)\/$/);
  if (m) return salty.activities.find((a) => a.slug === m[1]) || null;
  return null;
}

const missing = [];
let n = 0;
const out = readFileSync(file, 'utf8').replace(/<a class="card [^"]*"[^>]*>/g, (tag) => {
  const href = (tag.match(/ href="([^"]+)"/) || [])[1];
  if (!href || / data-placeholder/.test(tag)) return tag;
  const d = duration(href);
  tag = tag.replace(/ data-duration="\d*"| data-days="\d*"/g, '');
  if (!d || typeof d.durationMinutes !== 'number') { missing.push(href); return tag; }
  n++;
  const days = d.durationDays >= 2 ? ` data-days="${d.durationDays}"` : '';
  return tag.replace(/>$/, ` data-duration="${d.durationMinutes}"${days}>`);
});
writeFileSync(file, out);
console.log(`${n} cards updated.`);
if (missing.length) console.log('No durationMinutes for:\n  ' + [...new Set(missing)].join('\n  '));
