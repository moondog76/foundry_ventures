/**
 * Output directories for the two end-to-end builds.
 *
 * Kept in its own module so `playwright.config.ts` can import the constant
 * without importing `build-app.mjs`, which starts a build on load.
 */

/** The real, shipping dataset — the same output a production build produces. */
export const REAL_DIST_DIR = ".next";

/** The synthetic fixture dataset. Git-ignored and never deployed. */
export const FIXTURE_DIST_DIR = ".next-e2e-fixture";
