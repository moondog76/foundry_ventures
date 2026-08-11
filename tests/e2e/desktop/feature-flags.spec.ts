/**
 * §26.3 critical flow 4, first half — the *enabled* side of the feature gate
 * (§3.4).
 *
 * A gate is only meaningful if both of its positions are tested. This file
 * proves that when `insights`, `about` and `network` are on, the routes resolve,
 * carry real metadata and appear in the navigation the content layer builds.
 * `real-dataset/feature-flags.spec.ts` proves the other half — that with the
 * shipping dataset, where all three are off, the routes behave as if they had
 * never existed.
 *
 * The fixture dataset turns all three on, which is the only reason this project
 * can reach them at all.
 */

import { expect, test } from "@playwright/test";
import { FLAGGED_NAV_LABELS, FLAGGED_ROUTES } from "../support/fixture-data";

test("every enabled flagged route resolves with its own page", async ({ page, request }) => {
  /*
   * Only the archives have a deterministic heading: `/insights` and `/network`
   * are named by code constants. `/about` prefers its *authored* heading, so the
   * assertion there is structural — one non-empty `h1` — rather than a copy of
   * content that an editor is allowed to change.
   */
  const expectedHeading: Record<string, string | null> = {
    "/insights": "News & Insights",
    "/network": "Network",
    "/about": null,
  };

  for (const route of FLAGGED_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), `${route} must resolve while its flag is on`).toBe(200);

    await page.goto(route);
    const headings = await page.locator("h1").allTextContents();
    expect(headings, `${route} must render exactly one h1`).toHaveLength(1);

    const expected = expectedHeading[route];
    if (expected) {
      expect(headings[0]).toBe(expected);
    } else {
      expect(headings[0].trim().length, `${route} must render a non-empty h1`).toBeGreaterThan(0);
    }

    // A hidden route returns `HIDDEN_ROUTE_METADATA`; an enabled one must not.
    await expect(page).toHaveTitle(/.+/);
  }
});

test("enabled flagged routes appear in the header and footer navigation", async ({ page }) => {
  await page.goto("/");

  const primaryNav = page.getByRole("navigation", { name: "Primary" });
  const footerNav = page.getByRole("navigation", { name: "Footer" });

  for (const label of FLAGGED_NAV_LABELS) {
    await expect(
      primaryNav.getByRole("link", { name: label, exact: true }),
      `"${label}" must be in the primary navigation while its flag is on`,
    ).toHaveCount(1);
  }

  // The footer carries Insights and About but deliberately not Network — the
  // footer navigation is its own, shorter list in site settings.
  for (const label of ["Insights", "About"]) {
    await expect(footerNav.getByRole("link", { name: label, exact: true })).toHaveCount(1);
  }
});

test("a flagged route is reachable by clicking, not only by typing a URL", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Insights", exact: true })
    .click();

  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.getByRole("heading", { level: 1, name: "News & Insights" })).toBeVisible();
});
