/**
 * §26.3 critical flow 6 — internal versus external insights (§12.1).
 *
 * The rule the rebuild is held to: Foundry never creates a thin internal
 * duplicate of somebody else's article. A post whose `target` is `external`
 * links straight to the publisher, safely, and gets no `/insights/[slug]` route
 * at all — not a stub, not a redirect, not a `noindex` copy.
 *
 * The archive is reachable here because the fixture dataset turns the `insights`
 * feature flag on. `real-dataset/feature-flags.spec.ts` covers the shipping
 * configuration, where the route does not exist.
 */

import { expect, test } from "@playwright/test";
import {
  EXTERNAL_POST,
  INTERNAL_POST,
  INTERNAL_POST_SLUGS_NEWEST_FIRST,
} from "../support/fixture-data";

test("an external post links straight out, safely, and owns no internal route", async ({
  page,
}) => {
  await page.goto("/insights");
  await expect(page.getByRole("heading", { level: 1, name: "News & Insights" })).toBeVisible();

  const externalCard = page.locator(`a[href="${EXTERNAL_POST.url}"]`);
  await expect(externalCard).toHaveCount(1);

  // `noopener` and `noreferrer` together: the new tab gets no `window.opener`
  // handle back into this document, and no referrer leaks.
  await expect(externalCard).toHaveAttribute("rel", "noopener noreferrer");
  await expect(externalCard).toHaveAttribute("target", "_blank");

  // The card is one link around the whole card, and its accessible name has to
  // say that it leaves the site.
  await expect(externalCard).toContainText(EXTERNAL_POST.title);
  await expect(externalCard).toContainText("(opens in a new tab)");

  // No internal route was invented for it. Every `/insights/…` link on the page
  // belongs to a post this site actually hosts — the external one contributes
  // none, so the list is exactly the internal posts, newest first.
  const internalHrefs = await page
    .locator('a[href^="/insights/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(internalHrefs).toEqual(
    INTERNAL_POST_SLUGS_NEWEST_FIRST.map((slug) => `/insights/${slug}`),
  );
});

test("an internal post opens the article on this site", async ({ page }) => {
  await page.goto("/insights");

  await page.locator(`a[href="/insights/${INTERNAL_POST.slug}"]`).click();

  await expect(page).toHaveURL(new RegExp(`/insights/${INTERNAL_POST.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: INTERNAL_POST.title })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
});

test("the archive renders no dead or placeholder links", async ({ page }) => {
  await page.goto("/insights");

  // A `#` href or a bare `<a>` is the classic way a placeholder survives review.
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.locator("a:not([href])")).toHaveCount(0);

  // Every off-site link on the archive carries the same protection as the card.
  const unsafeExternal = page.locator('a[target="_blank"]:not([rel~="noopener"])');
  await expect(unsafeExternal).toHaveCount(0);
});
