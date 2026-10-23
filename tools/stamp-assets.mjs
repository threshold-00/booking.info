#!/usr/bin/env node
// Cache-busting for the shared CSS and JS. GitHub Pages lets browsers keep files for
// 10 minutes (often longer on phones), so after a push a page can load with an old
// app.js or styles.css. This adds ?v=<first 8 of the file's sha1> to every reference,
// so a changed file gets a new URL and is fetched fresh.
//
//   node tools/stamp-assets.mjs
//
// Run it after changing any file below and before committing. It rewrites the
// tracked HTML pages and the generator templates (tools/build-*.mjs), so rebuilt
// pages keep the stamp.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Published file name -> its path in the repo.
const ASSETS = {
  'styles.css': 'styles.css',
  'app.js': 'app.js',
  'detail.js': 'assets/detail.js',
  'demo-booking.js': 'assets/demo-booking.js',
  'tokens.css': 'assets/tokens.css',
  'components.css': 'assets/components.css',
  'booking.css': 'assets/booking/booking.css',
  'booking.js': 'assets/booking/booking.js',
  'track.js': 'assets/booking/track.js',
  'favicon.svg': 'assets/favicon.svg',
};

const stamp = Object.fromEntries(
  Object.entries(ASSETS).map(([name, path]) => [
    name,
    createHash('sha1').update(readFileSync(resolve(repo, path))).digest('hex').slice(0, 8),
  ]),
);

// A reference is the file name right after "/", a quote or "}" (the generators'
// ${base}), with any old ?v= stamp, then the closing quote. Longest names first, so
// demo-booking.js is never read as booking.js.
const names = Object.keys(ASSETS).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.]/g, '\\.'));
const ref = new RegExp(`([/"}])(${names.join('|')})(\\?v=[0-9a-f]+)?"`, 'g');

const files = execFileSync('git', ['ls-files', '*.html', 'tools/build-*.mjs'], { cwd: repo, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

let changed = 0;
for (const f of files) {
  const path = resolve(repo, f);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(ref, (_, pre, name) => `${pre}${name}?v=${stamp[name]}"`);
  if (after !== before) {
    writeFileSync(path, after);
    changed++;
  }
}
console.log(`Stamped ${changed} file${changed === 1 ? '' : 's'}: ${Object.entries(stamp).map(([n, s]) => `${n}?v=${s}`).join(', ')}`);
