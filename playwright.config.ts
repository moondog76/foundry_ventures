import { defineConfig, devices } from "@playwright/test";
import { FIXTURE_DIST_DIR, REAL_DIST_DIR } from "./tests/e2e/scripts/dist-dirs.mjs";

/**
 * End-to-end + accessibility suite (§26.3, §26.4, §26.6).
 *
 * ---------------------------------------------------------------------------
 * The two servers, and why there are two
 * ---------------------------------------------------------------------------
 *
 * Almost every assertion in this suite needs *data*: filters need more than one
 * value per group, detail routes need publishable records, related content needs
 * relations. None of that exists in the real Foundry dataset yet (see
 * `docs/content-gaps.md`), so the suite runs against the synthetic fixture
 * dataset in `src/content/seed/fixtures.ts`.
 *
 * Those fixtures are FICTIONAL and are gated behind **two** independent switches
 * — `FOUNDRY_CONTENT_FIXTURE=e2e` *and* `FOUNDRY_ALLOW_FIXTURES=1` — precisely so
 * that no single misconfigured variable can leak invented company names, quotes
 * or statistics into a real deployment. Both are set here, for the test server
 * only, and both are deliberately absent from the build (see below).
 *
 * One feature-flag requirement (§3.4, buildspec §26.3) can only be checked
 * against the *real* dataset: with `insights`, `about` and `network` off, those
 * routes must 404 in production and must be absent from navigation and the
 * sitemap. That check gets its own server on port 3101, serving its own build.
 *
 * ---------------------------------------------------------------------------
 * Why there are two builds
 * ---------------------------------------------------------------------------
 *
 * These routes **prerender** (§4.3), so the dataset a page shows is fixed when
 * `next build` runs — a server's own environment cannot change HTML that has
 * already been rendered. `tests/e2e/scripts/build-app.mjs` therefore produces
 * two builds, selected by `NEXT_DIST_DIR`:
 *
 *     .next                real dataset      → port 3101
 *     .next-e2e-fixture    synthetic fixtures → port 3000
 *
 * The fixture switches are set for the fixture build only, and that output
 * directory is git-ignored and never deployed, so no deployable artefact can
 * contain an invented company name, quote or statistic.
 *
 * `/sitemap.xml` is prerendered in each build, which is exactly what the
 * feature-flag spec needs: the real-dataset server serves the honest sitemap.
 *
 * If this assumption ever breaks, `preflight.setup.ts` fails first with an
 * explicit message instead of leaving forty confusing downstream failures.
 *
 * ---------------------------------------------------------------------------
 * Required viewport matrix (§26.6)
 * ---------------------------------------------------------------------------
 *
 * The full matrix is exercised by `desktop/layout.spec.ts`, which resizes a
 * single browser context rather than paying for eight browser projects:
 *
 *     320 x 568    tiny            (smallest supported phone)
 *     375 x 812    mobile
 *     390 x 844    mobile-large    (also the dedicated mobile project below)
 *     768 x 1024   tablet          (filter panel becomes permanent)
 *     1024 x 768   tablet-landscape
 *     1280 x 720   laptop
 *     1440 x 900   desktop         (also the default project below)
 *     1920 x 1080  wide
 *
 * The three browser projects below exist because they need different *browser*
 * configuration, not merely a different size: a mobile viewport with touch, and
 * an emulated `prefers-reduced-motion: reduce`.
 */

const HOST = "127.0.0.1";
const FIXTURE_PORT = 3000;
const REAL_DATASET_PORT = 3101;

const FIXTURE_BASE_URL = `http://${HOST}:${FIXTURE_PORT}`;
const REAL_DATASET_BASE_URL = `http://${HOST}:${REAL_DATASET_PORT}`;

/**
 * Runtime environment shared by both servers.
 *
 * `FOUNDRY_ENFORCE_CANONICAL_HOST` is explicitly cleared: with it on, the
 * middleware 308s every request on `127.0.0.1` to `https://www.foundryventures.ai`
 * and nothing is testable. The legacy-redirect and 410 rules do not depend on
 * it, so `desktop/redirects.spec.ts` still covers them.
 */
const SHARED_SERVER_ENV = {
  FOUNDRY_ENFORCE_CANONICAL_HOST: "",
  NEXT_TELEMETRY_DISABLED: "1",
} as const;

/**
 * Pitch readiness (`src/lib/pitch/config.ts`).
 *
 * In production policy `/pitch` refuses to render a form it cannot deliver, so
 * the happy-path test needs every readiness requirement satisfied. These values
 * are obviously fake: `.invalid` is the reserved never-resolvable TLD, and the
 * Resend key is a placeholder. The submission is still written to the real local
 * file store — which is what §26.3 asks the test to prove — and the notification
 * attempt that follows simply fails and is queued for retry by the outbox, which
 * by design never affects the user-facing result.
 */
const PITCH_ENV = {
  PITCH_STORE_DRIVER: "file",
  // Under `.data/`, which is git-ignored. Never the developer's own store.
  PITCH_STORE_DIR: ".data/e2e-pitch",
  PITCH_RECIPIENTS: "pitch-e2e@foundry.invalid",
  PITCH_ESCALATION_EMAIL: "escalation-e2e@foundry.invalid",
  PITCH_FROM_EMAIL: "no-reply-e2e@foundry.invalid",
  RESEND_API_KEY: "e2e-placeholder-key-not-a-secret",
  // Anything but the development default, which readiness rejects.
  PITCH_FINGERPRINT_SALT: "e2e-fingerprint-salt",
} as const;

export default defineConfig({
  testDir: "./tests/e2e",

  // A production build behind a fixed viewport is deterministic; a failure here
  // is a real failure, so nothing is retried locally.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,

  // Axe scans and the pitch round-trip (which waits out the 3s anti-spam window)
  // are the slow cases; 60s keeps them comfortable without hiding a hang.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // `open: "never"` so a failing CI run does not try to launch a browser.
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: FIXTURE_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      /*
       * Fails fast, with an actionable message, when the server under test is
       * not serving the fixture dataset — the single most likely cause of a
       * confusing suite-wide failure (a reused `pnpm dev` server on port 3000,
       * or a build that prerendered the real dataset).
       */
      name: "preflight",
      testMatch: "preflight.setup.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "desktop",
      dependencies: ["preflight"],
      testMatch: "desktop/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      dependencies: ["preflight"],
      testMatch: "mobile/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        // A real touch device: the mobile navigation and the compact filter
        // panel both have hover-gated styling that must not be exercised here.
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: "reduced-motion",
      dependencies: ["preflight"],
      testMatch: "reduced-motion/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        // Playwright exposes the media emulation through `contextOptions`, so
        // `prefers-reduced-motion: reduce` is set for the whole context rather
        // than toggled per test.
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      /*
       * The real, shipping dataset on its own server. Not a dependent of
       * `preflight`: it must NOT see the fixtures, so the preflight assertion
       * would be exactly wrong here.
       */
      name: "real-dataset",
      testMatch: "real-dataset/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: REAL_DATASET_BASE_URL,
      },
    },
  ],

  webServer: [
    {
      // One build, then the fixture server. `build-app.mjs` clears the fixture
      // and policy-mode switches for the build only — see the header comment.
      command: `node tests/e2e/scripts/build-app.mjs && pnpm exec next start --hostname ${HOST} --port ${FIXTURE_PORT}`,
      url: FIXTURE_BASE_URL,
      reuseExistingServer: !process.env.CI,
      // A cold Next build on a modest machine is minutes, not seconds.
      timeout: 10 * 60_000,
      env: {
        ...SHARED_SERVER_ENV,
        ...PITCH_ENV,
        // The two switches the synthetic dataset requires. Runtime only.
        FOUNDRY_CONTENT_FIXTURE: "e2e",
        FOUNDRY_ALLOW_FIXTURES: "1",
        // Serve the fixture build. The dataset is baked in at build time
        // because these routes prerender (§4.3); the runtime switches above
        // still matter for the dynamic routes (`/portfolio` reads searchParams).
        NEXT_DIST_DIR: FIXTURE_DIST_DIR,
        // Stated explicitly so a CI job that exports its own value cannot
        // silently move this server into preview policy.
        FOUNDRY_POLICY_MODE: "production",
      },
    },
    {
      // Same build, real dataset. `wait-for-server.mjs` holds it back until the
      // build above has finished, so the two entries are safe in either order.
      command: `node tests/e2e/scripts/wait-for-server.mjs ${FIXTURE_BASE_URL} && pnpm exec next start --hostname ${HOST} --port ${REAL_DATASET_PORT}`,
      url: REAL_DATASET_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 10 * 60_000,
      env: {
        ...SHARED_SERVER_ENV,
        // Empty, not absent: `isFixtureModeEnabled()` demands the exact values
        // "e2e" and "1", and an inherited CI value must not survive here.
        FOUNDRY_CONTENT_FIXTURE: "",
        FOUNDRY_ALLOW_FIXTURES: "",
        // The default output directory holds the real, shipping dataset.
        NEXT_DIST_DIR: REAL_DIST_DIR,
        FOUNDRY_POLICY_MODE: "production",
      },
    },
  ],
});
