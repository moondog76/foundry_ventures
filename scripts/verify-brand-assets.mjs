#!/usr/bin/env node
/**
 * Verifies the delivered brand SVGs byte-for-byte against Appendix A.1.
 *
 * Spec §31.5: "Kopiera brand-SVG:er byte-för-byte; verifiera hash efter
 * kopiering." A mismatch means the path data or wordmark was modified, which is
 * never allowed — so this exits non-zero and blocks the production gate.
 *
 *   pnpm brand:verify          report only (exit 0 when files are absent)
 *   pnpm brand:verify --strict fail when files are absent (production gate)
 */

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const MANIFEST = [
  {
    file: "foundry-logo-blue.svg",
    bytes: 5546,
    sha256: "1db42b83c1cfc1d4b58f98e77f38901ce7a0e4fc9bfacaf9cdc9c9d1d491a475",
  },
  {
    file: "foundry-logo-white.svg",
    bytes: 5546,
    sha256: "2f928f2b9550bdb81f5e23a1e6d9747a4785d4255867c38f5175641347c439dc",
  },
  {
    file: "foundry-logo-black.svg",
    bytes: 5546,
    sha256: "775b7c8e797e3f90fa64e325f47bb6fb5d18ce04d7a758ae470125970cc4aeb6",
  },
  {
    file: "foundry-icon-blue.svg",
    bytes: 417,
    sha256: "de5f865ad31075d16f671d1fd05c93737db997d974e6e16e99bacf822bc85dd0",
  },
  {
    file: "foundry-icon-white.svg",
    bytes: 417,
    sha256: "fda4e303cf2de4f5a3a8ea39e5967d1587cf0eaf7ed7c5160edb2b8959d8541a",
  },
];

const strict = process.argv.includes("--strict");
const brandDir = path.resolve(process.cwd(), "public/brand");

let missing = 0;
let mismatched = 0;

for (const entry of MANIFEST) {
  const filePath = path.join(brandDir, entry.file);
  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    missing += 1;
    console.log(`  MISSING   ${entry.file}`);
    continue;
  }

  const buffer = await readFile(filePath);
  const digest = createHash("sha256").update(buffer).digest("hex");

  if (stats.size !== entry.bytes || digest !== entry.sha256) {
    mismatched += 1;
    console.error(`  MISMATCH  ${entry.file}`);
    console.error(`            expected ${entry.bytes} bytes / ${entry.sha256}`);
    console.error(`            actual   ${stats.size} bytes / ${digest}`);
    continue;
  }

  console.log(`  OK        ${entry.file}`);
}

if (mismatched > 0) {
  console.error(
    `\n${mismatched} brand asset(s) do not match the delivered masters. The logotype must never be modified (buildspec §5.1).`,
  );
  process.exit(1);
}

if (missing > 0) {
  const message = `\n${missing} brand asset(s) are not in public/brand/. Copy the delivered SVG masters there without changing their path data.`;
  if (strict) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

if (missing === 0 && mismatched === 0) {
  console.log("\nAll brand assets verified against the Appendix A.1 manifest.");
}
