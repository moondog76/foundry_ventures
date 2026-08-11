/**
 * §26.3 critical flow 7 — team anchors and profile routes (§10.1, §10.2).
 *
 * Two rules meet on this page.
 *
 * The jump list is made of ordinary `<a href="#slug">` links: they update the
 * URL, they are shareable, and they work with JavaScript off. What JavaScript
 * adds is only the follow-through — focus moves to the target heading so the
 * next Tab continues from there instead of from the jump list. And because the
 * header is `position: fixed`, the section must land *below* it, which is what
 * `scroll-margin-top: calc(var(--header-height) + …)` is for.
 *
 * The second rule is §10.2: a person without an approved long bio deliberately
 * has no profile route. The index must not offer a "Read more" that would 404,
 * and the route itself must genuinely not exist.
 */

import { expect, test } from "@playwright/test";
import { TEAM_WITH_DETAIL, TEAM_WITHOUT_DETAIL } from "../support/fixture-data";

test("a jump link updates the URL and clears the fixed header", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByRole("heading", { level: 1, name: "Team" })).toBeVisible();

  const jumpList = page.getByRole("navigation", { name: "Team members" });
  await jumpList.getByRole("link", { name: TEAM_WITHOUT_DETAIL.name }).click();

  await expect(page).toHaveURL(new RegExp(`/team#${TEAM_WITHOUT_DETAIL.slug}$`));

  const heading = page.getByRole("heading", { level: 2, name: TEAM_WITHOUT_DETAIL.name });
  await expect(heading).toBeVisible();

  // Focus follows the reader: the next Tab continues from the target section.
  await expect(heading).toBeFocused();

  // The target must not be hidden behind the fixed header. Compared against the
  // header's own measured height rather than a magic number, because
  // `--header-height` is breakpoint-dependent.
  const headerBottom = await page
    .getByRole("banner")
    .evaluate((node) => node.getBoundingClientRect().bottom);
  const headingTop = await heading.evaluate((node) => node.getBoundingClientRect().top);

  expect(
    headingTop,
    `"${TEAM_WITHOUT_DETAIL.name}" is under the fixed header: heading top ${headingTop} < header bottom ${headerBottom}`,
  ).toBeGreaterThanOrEqual(headerBottom);
});

test("a deep link to a section lands clear of the header too", async ({ page }) => {
  // The shared-link case: the browser scrolls on load and the component takes
  // focus a frame later.
  await page.goto(`/team#${TEAM_WITH_DETAIL.slug}`);

  const heading = page.getByRole("heading", { level: 2, name: TEAM_WITH_DETAIL.name });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();

  const headerBottom = await page
    .getByRole("banner")
    .evaluate((node) => node.getBoundingClientRect().bottom);
  const headingTop = await heading.evaluate((node) => node.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(headerBottom);
});

test("a person with an approved long bio has a profile route", async ({ page }) => {
  await page.goto("/team");

  await page.getByRole("link", { name: `Read more about ${TEAM_WITH_DETAIL.name}` }).click();

  await expect(page).toHaveURL(new RegExp(`/team/${TEAM_WITH_DETAIL.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: TEAM_WITH_DETAIL.name })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
});

test("a thin profile is not offered and its route does not exist", async ({ page, request }) => {
  await page.goto("/team");

  // §10.2: no "Read more" for this person — the index must never link to a route
  // that would 404.
  await expect(
    page.getByRole("link", { name: `Read more about ${TEAM_WITHOUT_DETAIL.name}` }),
  ).toHaveCount(0);
  await expect(page.locator(`a[href="/team/${TEAM_WITHOUT_DETAIL.slug}"]`)).toHaveCount(0);

  // And the route really is absent, not merely unlinked.
  const response = await request.get(`/team/${TEAM_WITHOUT_DETAIL.slug}`);
  expect(response.status()).toBe(404);
});
