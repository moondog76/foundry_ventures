#!/usr/bin/env node
/**
 * Development warning for the missing Ivar Display master (§5.2, §30).
 *
 * Ivar Display is identity-bearing for Foundry: headings, large quotes and
 * editorial statements are all set in it. It is not in this repository, and the
 * copy served from the live Squarespace site is an *identification reference* —
 * it tells us which face the brand uses; it is not automatically a licensed,
 * redistributable asset. Downloading it into `public/fonts/` would ship an
 * unlicensed font, so the repository ships the Georgia fallback instead.
 *
 * This is a warning, never a gate: `src/styles/fonts.css` already resolves
 * `--font-display` to a metric-adjusted Georgia face, so the site is correct and
 * complete without the file — only slightly off-brand. Blocking the dev server
 * over an asset the developer cannot legally obtain would be theatre, so this
 * script always exits 0. The thing that *does* block production is
 * `scripts/content-integrity.mjs`, and the licence itself is tracked as a launch
 * gap in `docs/content-gaps.md`.
 *
 * Wired to `predev`, so it prints once when someone starts the dev server.
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_FILE = path.join(REPO_ROOT, "public", "fonts", "IvarDisplay-Regular.woff2");

/** A WOFF2 that is this small is a truncated or placeholder download, not a face. */
const MIN_PLAUSIBLE_BYTES = 1024;

function main() {
  if (existsSync(FONT_FILE)) {
    const { size } = statSync(FONT_FILE);
    if (size < MIN_PLAUSIBLE_BYTES) {
      console.warn(
        `\n  fonts: public/fonts/IvarDisplay-Regular.woff2 is only ${size} bytes — that is not a\n` +
          "         complete WOFF2. Browsers will reject it and silently fall back to Georgia.\n",
      );
      return;
    }
    console.log("  fonts: Ivar Display present — --font-display resolves to the licensed face.");
    return;
  }

  console.warn(
    [
      "",
      "  fonts: Ivar Display is not installed.",
      "",
      "         Expected: public/fonts/IvarDisplay-Regular.woff2",
      "",
      "         Headings currently render in the metric-adjusted Georgia fallback",
      "         declared in src/styles/fonts.css. Layout and spacing are correct;",
      "         only the typeface is off-brand. Inter is never a substitute.",
      "",
      "         The WOFF served from the live Squarespace site identifies the face",
      "         but is not a redistributable asset. Obtain the licensed WOFF2 from",
      "         the rights holder, drop it at the path above, and the @font-face",
      "         rule activates with no other change.",
      "",
      "         Tracked in docs/content-gaps.md. This is a warning, not an error.",
      "",
    ].join("\n"),
  );
}

main();

// Always successful: see the note at the top of this file.
process.exit(0);
