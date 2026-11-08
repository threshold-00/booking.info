// The photo at the top of a business's booking emails (Ro, 8 Nov 2026): one of its own
// gallery photos, as a 2:1 JPEG, because Outlook and some other email apps can't show the
// WebP and AVIF the pages use. Writes assets/img/email/<slug>.jpg, which the booking
// service links to (getrealdays.com/assets/img/email/<slug>.jpg) in every email about that
// business. `seed-business.mjs --production` refuses a business without one.
//
//   node tools/build-email-images.mjs studiomade     one business
//   node tools/build-email-images.mjs                every business with booking_mode live
//
// Which photo: page.email_photo (a gallery file name, e.g. "studio") if set, otherwise the
// first gallery photo. Needs macOS sips.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';

const DATA = 'data/business-layer';
const OUT = 'assets/img/email';
const MAX_W = 1200;

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(DATA)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -5))
      .filter((s) => JSON.parse(readFileSync(`${DATA}/${s}.json`, 'utf8')).business?.booking_mode === 'live');

mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const slug of slugs) {
  const d = JSON.parse(readFileSync(`${DATA}/${slug}.json`, 'utf8'));
  const photos = d.page?.photos;
  const items = photos?.items ?? [];
  const pick = items.find((i) => i.file === d.page?.email_photo) ?? items[0];
  if (!pick) {
    console.error(`${slug}: no gallery photos in page.photos, nothing to use`);
    failed++;
    continue;
  }
  const dir = photos.dir.replace(/^\//, '');
  const src = [`${dir}${pick.file}-1600.webp`, `${dir}${pick.file}-800.webp`, `${dir}${pick.file}.jpg`].find((f) => existsSync(f));
  if (!src) {
    console.error(`${slug}: can't find ${pick.file} in ${dir}`);
    failed++;
    continue;
  }
  const out = `${OUT}/${slug}.jpg`;
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '70', src, '--out', out], { stdio: 'ignore' });
  const size = (k) => Number(execFileSync('sips', ['-g', k, out], { encoding: 'utf8' }).match(/(\d+)\s*$/)[1]);
  let w = size('pixelWidth');
  if (w > MAX_W) {
    execFileSync('sips', ['--resampleWidth', String(MAX_W), out], { stdio: 'ignore' });
    w = MAX_W;
  }
  const h = size('pixelHeight');
  const cropH = Math.min(h, Math.round(w / 2));
  const cropW = cropH === h ? h * 2 : w;
  execFileSync('sips', ['--cropToHeightWidth', String(cropH), String(cropW), out], { stdio: 'ignore' });
  console.log(`${out}: ${pick.file} (${cropW}x${cropH}, ${Math.round(statSync(out).size / 1024)} KB)`);
}
process.exit(failed ? 1 : 0);
