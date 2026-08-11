/**
 * Preflight: is the server under test actually serving the e2e fixtures?
 *
 * Every other project depends on this one, so when the answer is no the suite
 * reports one legible failure instead of thirty misleading ones.
 *
 * The two ways this goes wrong in practice:
 *
 *  1. `reuseExistingServer` picked up a `pnpm dev` server that somebody already
 *     had running on port 3000. That server has neither fixture switch set, and
 *     it runs in preview policy, so almost nothing this suite asserts holds.
 *  2. The build prerendered the pages instead of rendering them per request. The
 *     whole two-server arrangement (see `playwright.config.ts`) depends on
 *     `draftMode()` keeping every route dynamic; if a future Next release
 *     changes that, the fixture switches set on the server process stop having
 *     any effect and the real, almost-entirely-unpublishable dataset is served.
 */

import { expect, test } from "@playwright/test";
import { COMPANY_WITH_DETAIL, LISTED_COMPANY_COUNT } from "./support/fixture-data";

const DIAGNOSIS = [
  "The server on the base URL is not serving the e2e fixture dataset.",
  "",
  "Check, in order:",
  "  1. Is another server already listening on port 3000? `reuseExistingServer`",
  "     is on outside CI, so a stray `pnpm dev` will be used as-is. Stop it and",
  "     re-run, or run with CI=1.",
  "  2. Did the build prerender the routes? The suite relies on every page being",
  "     rendered per request so the server's own environment picks the dataset.",
  "     `next build` must run WITHOUT FOUNDRY_POLICY_MODE — see",
  "     tests/e2e/scripts/build-app.mjs.",
  "  3. Are FOUNDRY_CONTENT_FIXTURE=e2e and FOUNDRY_ALLOW_FIXTURES=1 both set on",
  "     the server process? The synthetic dataset needs both.",
].join("\n");

test("the e2e fixture dataset is being served", async ({ page }) => {
  await page.goto("/portfolio");

  await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();

  // The archive card is one link wrapping the whole card, so its href is the
  // least ambiguous thing to assert on.
  const detailLink = page.locator(`a[href="/portfolio/${COMPANY_WITH_DETAIL.slug}"]`);
  await expect(detailLink, DIAGNOSIS).toHaveCount(1);

  // A second, independent signal: the fixture archive has a known size, so a
  // half-applied environment cannot slip through. Each card is an `<article>`,
  // and the archive is the only place `<article>` appears on this route.
  const cards = page.getByRole("main").getByRole("article");
  await expect(cards, DIAGNOSIS).toHaveCount(LISTED_COMPANY_COUNT);
});
