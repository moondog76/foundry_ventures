/**
 * Self-hosted webfaces, loaded through `next/font/local`.
 *
 * This replaces a hand-written `@font-face` pointing at
 * `/fonts/IvarDisplay-Regular.woff2`, which 404'd on every route for the whole
 * life of the site and silently rendered every heading in Georgia (§2.3, P0).
 *
 * The framework loader is the fix rather than a corrected path, because the
 * class of bug matters more than the instance: `next/font/local` resolves the
 * file at build time, so a missing or renamed font is a build failure instead of
 * a runtime 404 nobody sees. It also emits content-hashed, immutably cacheable
 * URLs and generates the metric-adjusted fallback `@font-face` that keeps CLS at
 * zero while the real face loads (§9.3, §12.3).
 *
 * Files are produced by `pnpm fonts:build` — see `scripts/prepare-fonts.mjs` for
 * the licensing position and the subsetting decisions.
 */

import localFont from "next/font/local";

/**
 * Display face. Carries h1–h3 and the investment-model values.
 *
 * The subsetted file keeps its optical-size axis, and `typography.css` sets
 * `font-optical-sizing: auto`, so a 112px h1 and a 29px h3 get genuinely
 * different letterforms rather than one cut scaled up and down.
 */
export const displayFont = localFont({
  src: [{ path: "../fonts/newsreader-display.woff2", weight: "400", style: "normal" }],
  variable: "--font-display-loaded",
  display: "swap",
  preload: true,
  // Times New Roman is metrically closest to Newsreader of the two options the
  // loader supports, so the pre-swap frame lands nearest the final line breaks.
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * Text face. Carries body, navigation, labels and every control.
 *
 * Not preloaded: the display face is the LCP text, and preloading both competes
 * for the same early bandwidth. Inter arrives under `swap` behind a
 * metric-adjusted Arial, which is close enough that the swap is not visible as
 * reflow.
 */
export const sansFont = localFont({
  src: [
    { path: "../fonts/inter-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-sans-loaded",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

/** Applied to `<html>`; the CSS variables resolve inside `tokens.css`. */
export const fontVariables = `${displayFont.variable} ${sansFont.variable}`;
