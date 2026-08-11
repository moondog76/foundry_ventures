/**
 * §26.4 — automated accessibility scans plus the keyboard passes a scanner
 * cannot perform.
 *
 * axe-core catches the things that are decidable from a static DOM: contrast,
 * names, roles, landmark structure, form labelling. It cannot tell whether the
 * filters keep focus across a URL change, whether the error summary is reachable
 * by keyboard, or whether the carousel can be driven without a pointer — so
 * those are walked explicitly below.
 *
 * The scan runs at `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa`, and asserts
 * zero violations. Anything reported is a real defect: nothing here is a house
 * style rule.
 */

import { expect, test } from "@playwright/test";
import { COMPANY_WITH_DETAIL, LISTED_COMPANY_COUNT } from "../support/fixture-data";
import { expectNoAxeViolations, isFocused } from "../support/helpers";

const SCANNED_ROUTES = [
  { route: "/", description: "home" },
  { route: "/portfolio", description: "portfolio archive" },
  { route: `/portfolio/${COMPANY_WITH_DETAIL.slug}`, description: "company detail" },
  { route: "/team", description: "team index" },
  { route: "/pitch", description: "pitch form" },
  { route: "/privacy", description: "privacy notice" },
] as const;

for (const { route, description } of SCANNED_ROUTES) {
  test(`${description} (${route}) has no WCAG violations`, async ({ page }) => {
    await page.goto(route);
    // Wait for the single `h1` so the scan never races an unfinished hydration.
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoAxeViolations(page, route);
  });
}

test("the portfolio archive is still clean with filters applied", async ({ page }) => {
  // A filtered archive is a different DOM: chips appear, the count changes, and
  // an empty result swaps in an entirely different block.
  await page.goto("/portfolio?stage=seed");
  await expect(page.locator("h1")).toHaveCount(1);
  await expectNoAxeViolations(page, "/portfolio?stage=seed");

  // The genuinely empty state — no company is both pre-seed-only and exited.
  await page.goto("/portfolio?stage=seed&status=realized");
  await expectNoAxeViolations(page, "/portfolio with an empty result");
});

test("the pitch form is still clean while showing validation errors", async ({ page }) => {
  await page.goto("/pitch");
  await page.getByRole("button", { name: "Send pitch" }).click();
  await expect(page.locator("#pitch-error-summary")).toBeVisible();

  // Error messages, `aria-invalid`, and the summary's links are all new DOM that
  // never existed in the first scan.
  await expectNoAxeViolations(page, "/pitch with validation errors");
});

test("the filters are fully operable from the keyboard and keep focus", async ({ page }) => {
  await page.goto("/portfolio");

  const seed = page.getByRole("checkbox", { name: /^Seed/ });
  await seed.focus();
  await expect(seed).toBeFocused();

  // Space is the checkbox activation key; nothing here may require a pointer.
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
  await expect(seed).toBeChecked();

  /*
   * §18.1: the control the user activated keeps focus across the navigation.
   * This is the assertion the whole "one input tree, keyed by value" design in
   * `PortfolioFilters` exists to satisfy — rebuilding the inputs would throw a
   * keyboard user back to the top of the document on every single toggle.
   */
  await expect(seed).toBeFocused();

  // The result count is announced politely rather than by moving focus.
  const count = page.getByRole("status");
  await expect(count).toHaveAttribute("aria-live", "polite");
  await expect(count).toHaveText(new RegExp(`of ${LISTED_COMPANY_COUNT} companies$`));

  // Reversing the choice is symmetrical, and focus survives that too.
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(seed).not.toBeChecked();
  await expect(seed).toBeFocused();
});

test("a filter group can be collapsed and expanded from the keyboard", async ({ page }) => {
  await page.goto("/portfolio");

  // The group heading is a real button carrying `aria-expanded`, not a styled div.
  const stageToggle = page.getByRole("button", { name: /^Stage/ });
  await expect(stageToggle).toHaveAttribute("aria-expanded", "true");

  await stageToggle.focus();
  await page.keyboard.press("Enter");
  await expect(stageToggle).toHaveAttribute("aria-expanded", "false");
  await expect(stageToggle).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(stageToggle).toHaveAttribute("aria-expanded", "true");
});

test("the pitch form submits and surfaces its errors from the keyboard alone", async ({ page }) => {
  await page.goto("/pitch");

  // Submitting with Enter from inside a field is the ordinary keyboard path.
  await page.getByLabel("First name").focus();
  await page.keyboard.press("Enter");

  const summary = page.locator("#pitch-error-summary");
  await expect(summary).toBeVisible();
  expect(await isFocused(summary)).toBe(true);

  // From the focused summary, Tab reaches its first link and Enter jumps to the
  // control that produced the message.
  await page.keyboard.press("Tab");
  const firstError = summary.getByRole("link").first();
  await expect(firstError).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Country")).toBeFocused();
});

test("the testimonials block is operable without a pointer", async ({ page }) => {
  await page.goto("/");

  // Located by `aria-roledescription`, not by accessible name: the region is
  // named after the section heading, which is editable content and would make
  // this locator break the moment an editor rewords it.
  const carousel = page.locator('[role="group"][aria-roledescription="carousel"]');

  // §7.7: with a single consented testimonial there must be a static quote and
  // no controls at all. Assert that rather than skipping past it — a carousel
  // appearing here would itself be the bug.
  if ((await carousel.count()) === 0) {
    await expect(page.getByRole("button", { name: /next testimonial/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /previous testimonial/i })).toHaveCount(0);
    return;
  }

  await carousel.first().focus();
  await page.keyboard.press("ArrowRight");
  // Movement is announced politely, only after the reader has actually moved.
  await expect(page.getByText(/^Slide \d+ of \d+$/)).toHaveCount(1);

  // Every control is a real, reachable button at the 44px minimum target.
  for (const name of [/previous testimonial/i, /next testimonial/i]) {
    const control = page.getByRole("button", { name });
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  // Nothing rotates on its own (§7.7, §18.3).
  const before = await page.getByText(/^Slide \d+ of \d+$/).textContent();
  await page.waitForTimeout(5_000);
  expect(await page.getByText(/^Slide \d+ of \d+$/).textContent()).toBe(before);
});
