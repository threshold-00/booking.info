#!/usr/bin/env node
// Scans tracked files for Stripe/Resend/Supabase secret patterns before a commit.
// Run manually: node tools/check-secrets.mjs
// Exits non-zero (and lists every match) if anything looks like a live secret.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PATTERNS = [
  { name: "Stripe live secret key", re: /\bsk_live_[A-Za-z0-9]{10,}/g },
  { name: "Stripe test secret key", re: /\bsk_test_[A-Za-z0-9]{10,}/g },
  { name: "Stripe live restricted key", re: /\brk_live_[A-Za-z0-9]{10,}/g },
  { name: "Stripe test restricted key", re: /\brk_test_[A-Za-z0-9]{10,}/g },
  { name: "Stripe webhook secret", re: /\bwhsec_[A-Za-z0-9]{10,}/g },
  { name: "Resend API key", re: /\bre_[A-Za-z0-9_]{20,}/g },
  { name: "Supabase service role reference", re: /service_role/gi }
];

function trackedFiles() {
  const out = execSync("git ls-files", { encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

function scan(files) {
  const findings = [];
  for (const file of files) {
    // Skip this file itself: it legitimately contains the patterns as regex source.
    if (file === "tools/check-secrets.mjs") continue;
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue; // binary or unreadable, skip
    }
    for (const { name, re } of PATTERNS) {
      const matches = text.match(re);
      if (matches) {
        findings.push({ file, name, count: matches.length });
      }
    }
  }
  return findings;
}

const files = trackedFiles();
const findings = scan(files);

if (findings.length) {
  console.error("check-secrets: possible secrets found in tracked files:\n");
  for (const f of findings) {
    console.error(`  ${f.file}: ${f.name} (${f.count} match${f.count === 1 ? "" : "es"})`);
  }
  console.error("\nRemove these before committing. Secrets belong only in Supabase function secrets.");
  process.exit(1);
} else {
  console.log("check-secrets: clean, no secret patterns found in tracked files.");
  process.exit(0);
}
