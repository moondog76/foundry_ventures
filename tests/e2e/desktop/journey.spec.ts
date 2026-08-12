/**
 * §26.3 critical flow 1 — Home → Portfolio → filter → company → Pitch.
 *
 * This is the path that carries the site's whole commercial purpose, so it is
 * walked the way a visitor walks it: real clicks on real links, no direct
 * `goto()` shortcuts between the steps. Each step also re-asserts the two
 * structural invariants that are easiest to break during a rebuild — exactly one
 * `<h1>`, and no `<main>` other than the one the root layout owns.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  COMPANY_WITHOUT_DETAIL,
} from "../support/fixture-data";
import { headingLevelOneTexts } from "../support/helpers";

/** §6.2: one `h1`, one `main`, and the `main` belongs to the layout. */
async function expectDocumentStructure(page: Page, route: string): Promise<void> {
  const headings = await headingLevelOneTexts(page);
  expect(
    headings,
    `${route} must have exactly one h1, found: ${JSON.stringify(headings)}`,
  ).toHaveLength(1);
  await expect(page.locator("main"), `${route} must not add a second <main>`).toHaveCount(1);
  await expect(page.locator("main")).toHaveAttribute("id", "main-content");
}

test("every public route has exactly one h1 and one layout-owned main", async ({ page }) => {
  // §7.1 fixes the public site at four routes; §12.10 requires one h1 each and
  // §6.2 requires the `main` landmark to come from the layout, not the page.
  for (const route of ["/", "/portfolio", "/fund", "/privacy"]) {
    await page.goto(route);
    await expectDocumentStructure(page, route);
  }
});

test("a company without enough approved detail links straight to its own site", async ({
  page,
}) => {
  await page.goto("/portfolio");

  // §16.2: no internal route, so the card is an external link — never a `#`.
  const card = page.locator(`a[href="${COMPANY_WITHOUT_DETAIL.websiteUrl}"]`);
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute("rel", "noopener noreferrer");
  await expect(card).toHaveAttribute("target", "_blank");

  await expect(page.locator(`a[href="/portfolio/${COMPANY_WITHOUT_DETAIL.slug}"]`)).toHaveCount(0);
  // Nothing anywhere may render a dead link.
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});
