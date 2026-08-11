/**
 * §26.3 critical flow 3 — the mobile navigation dialog (§6.1, §18.2).
 *
 * The dialog is the one place on the site where focus, scroll and the document
 * outline are all taken over at once, so each promise gets its own test:
 *
 *  - opening moves focus into the dialog and locks the body;
 *  - following a link navigates, closes the dialog and hands focus back;
 *  - Escape closes it and hands focus back;
 *  - closing restores the exact scroll position the reader left;
 *  - Tab cycles inside the dialog instead of escaping into the page behind it;
 *  - while closed the dialog is removed from the tree entirely, so a screen
 *    reader never meets two copies of the navigation.
 *
 * Runs only in the mobile project: above 992px the trigger is `display: none`
 * and the dialog does not exist.
 */

import { expect, test, type Page } from "@playwright/test";

function trigger(page: Page) {
  // A real `<button>` with `aria-expanded`/`aria-controls`; the visible label is
  // in a visually-hidden span, so the accessible name is the assertion target.
  // Scoped to the banner because the open dialog has its own "Close menu" button.
  return page.getByRole("banner").getByRole("button", { name: /^(Open|Close) menu$/ });
}

function dialog(page: Page) {
  return page.getByRole("dialog", { name: "Site navigation" });
}

async function openMenu(page: Page): Promise<void> {
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  // The dialog animates through `opening` → `open`; focus only moves once it is
  // fully open, so waiting for the state avoids racing that transition.
  await expect(dialog(page)).toHaveAttribute("data-state", "open");
}

test("the dialog does not exist until it is opened", async ({ page }) => {
  await page.goto("/");

  await expect(dialog(page)).toHaveCount(0);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");

  // The dialog is unmounted, not merely hidden, so a screen reader never meets a
  // second copy of the navigation sitting next to the desktop one.
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);
});

test("opening moves focus into the dialog and locks the page behind it", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);

  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");

  // Focus lands on the first focusable element inside the dialog.
  const firstLink = dialog(page).getByRole("link").first();
  await expect(firstLink).toBeFocused();

  // Body scroll is locked by the component, not by an overlay swallowing events.
  await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "true");
});

test("following a link navigates, closes the dialog and returns focus to the trigger", async ({
  page,
}) => {
  await page.goto("/");
  await openMenu(page);

  // Portfolio is no longer in the navigation; Team is the first entry the
  // fixture dataset publishes, and the assertion is about the dialog's
  // behaviour on navigation rather than about any particular destination.
  await dialog(page).getByRole("link", { name: "Team", exact: true }).click();

  await expect(page).toHaveURL(/\/team$/);
  await expect(page.getByRole("heading", { level: 1, name: "Team" })).toBeVisible();

  // Closed, removed from the tree, and the trigger has its place in the tab
  // order back.
  await expect(dialog(page)).toHaveCount(0);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked", "true");
});

test("Escape closes the dialog and returns focus to the trigger", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);

  await page.keyboard.press("Escape");

  await expect(dialog(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("the close button closes the dialog and returns focus to the trigger", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);

  await dialog(page).getByRole("button", { name: "Close menu" }).click();

  await expect(dialog(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test("closing restores the exact scroll position", async ({ page }) => {
  await page.goto("/");

  const target = 400;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  // The scroll lock reads `window.scrollY`, so the browser must have settled on
  // the requested position before the dialog opens.
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await openMenu(page);

  // While locked, the document itself is pinned at the top by `position: fixed`.
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);

  // Exactly — not "roughly", and not the top of the page (§18.2).
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);
});

test("Tab cycles inside the dialog instead of escaping to the page behind it", async ({ page }) => {
  await page.goto("/");
  await openMenu(page);

  const focusables = dialog(page).locator(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const count = await focusables.count();
  expect(count, "the dialog must contain focusable content").toBeGreaterThan(1);

  await expect(focusables.first()).toBeFocused();

  // Walk to the last element…
  for (let index = 1; index < count; index += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(focusables.last()).toBeFocused();

  // …and one more Tab wraps to the first rather than reaching the header.
  await page.keyboard.press("Tab");
  await expect(focusables.first()).toBeFocused();

  // Shift+Tab from the first wraps backwards to the last.
  await page.keyboard.press("Shift+Tab");
  await expect(focusables.last()).toBeFocused();
});
