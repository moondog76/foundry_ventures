/**
 * §26.4 at the mobile breakpoint.
 *
 * The mobile layout is not the desktop layout with narrower columns: the
 * navigation becomes a modal dialog, and the filter panel collapses behind a
 * toolbar button. Both are extra DOM that the desktop scan never sees, and both
 * are exactly the kind of construct that goes wrong — so they are scanned in
 * their *open* state, and driven from the keyboard.
 */

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "../support/helpers";

const SCANNED_ROUTES = [
  { route: "/", description: "home" },
  { route: "/portfolio", description: "portfolio archive" },
  { route: "/pitch", description: "pitch form" },
] as const;

for (const { route, description } of SCANNED_ROUTES) {
  test(`${description} (${route}) has no WCAG violations at 390px`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoAxeViolations(page, `${route} at 390x844`);
  });
}

test("the open navigation dialog has no WCAG violations", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("banner").getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toHaveAttribute("data-state", "open");

  await expectNoAxeViolations(page, "the open mobile navigation dialog");
});

test("the compact filter panel is operable from the keyboard", async ({ page }) => {
  await page.goto("/portfolio");

  // Below 768px the panel is collapsed behind a real button, and the collapsed
  // panel is `display: none` so its controls leave the tab order entirely.
  const trigger = page.getByRole("button", { name: /^Filter/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("checkbox", { name: /^Seed/ })).toBeHidden();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const seed = page.getByRole("checkbox", { name: /^Seed/ });
  await expect(seed).toBeVisible();
  await expectNoAxeViolations(page, "the open compact filter panel");

  await seed.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
  // The activated control keeps focus even at this width (§18.1).
  await expect(seed).toBeFocused();

  /*
   * The panel is an inline disclosure, not a modal: it is deliberately not a
   * focus trap, so the page behind it stays reachable. Escape closes it and
   * hands focus back to the trigger.
   */
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test('"Show N companies" closes the panel and moves focus to the live count', async ({ page }) => {
  await page.goto("/portfolio");

  await page.getByRole("button", { name: /^Filter/ }).click();

  const apply = page.getByRole("button", { name: /^Show \d+ compan(y|ies)$/ });
  await expect(apply).toBeVisible();
  await apply.click();

  await expect(page.getByRole("button", { name: /^Filter/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  // Focus lands on the count that describes the result, not back at the top.
  await expect(page.getByRole("status")).toBeFocused();
});
