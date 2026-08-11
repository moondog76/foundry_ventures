/**
 * §26.6 — layout integrity across the required viewport matrix.
 *
 * Two things are checked at every width, on every route that a first-time
 * visitor is likely to land on:
 *
 *  1. **No horizontal overflow.** `documentElement.scrollWidth` must not exceed
 *     the viewport. A single unbounded element — a wide table, a `100vw` inside a
 *     padded container, a long unbroken URL — makes the whole page scroll
 *     sideways, and on a phone that is the difference between usable and not.
 *  2. **The skip link is the first focusable element and it works.** §6.2 makes
 *     it the first thing in the tab order on every page; if anything ever lands
 *     ahead of it, keyboard users pay for it on every single navigation.
 *
 * The matrix is resized inside one browser context rather than being split into
 * eight browser projects: the assertion is about CSS, not about browser
 * behaviour, and eight extra browser launches would buy nothing.
 */

import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "../support/helpers";
import { LAYOUT_ROUTES, VIEWPORT_MATRIX } from "../support/viewports";

for (const viewport of VIEWPORT_MATRIX) {
  test(`no horizontal overflow at ${viewport.name} (${viewport.note})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of LAYOUT_ROUTES) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page, `${route} at ${viewport.name}`);

      // Scrolling to the bottom exposes anything that only overflows once
      // lazy-loaded media and revealed sections have laid out.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expectNoHorizontalOverflow(page, `${route} at ${viewport.name} (scrolled to bottom)`);
    }
  });
}

test("the skip link is the first focusable element on every route", async ({ page }) => {
  for (const route of LAYOUT_ROUTES) {
    await page.goto(route);

    // A fresh navigation leaves focus on `<body>`, so one Tab reaches the first
    // element in the tab order.
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink, `the skip link must be the first tab stop on ${route}`).toBeFocused();

    // It must also become *visible* on focus — an invisible skip link is a
    // sighted keyboard user's dead end.
    await expect(skipLink).toBeInViewport();
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  }
});

test("activating the skip link moves the reader to the main landmark", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#main-content$/);

  // The landmark it points at has to exist and be the one the layout owns.
  const main = page.locator("#main-content");
  await expect(main).toHaveCount(1);
  await expect(main).toHaveJSProperty("tagName", "MAIN");
});

test("primary actions keep a 44px tap target at the narrowest width", async ({ page }) => {
  /*
   * Checked at 320px, where a cramped layout is most likely to squeeze a button
   * below the floor. Deliberately scoped to block-level buttons and
   * button-styled links: a checkbox input is 18px by design and its 44px target
   * is the `<label>` beside it, and an inline link inside running text is
   * exempt by construction. Those cases are covered properly by the axe
   * `target-size` rule in `accessibility.spec.ts`, which knows the exceptions.
   */
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/portfolio");

  const undersized = await page.getByRole("button").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.height < 44;
      })
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const name = node.textContent?.trim().slice(0, 40) ?? "";
        return `${node.tagName.toLowerCase()} "${name}" ${Math.round(rect.width)}x${Math.round(rect.height)}`;
      }),
  );

  expect(undersized, `buttons shorter than 44px at 320px:\n${undersized.join("\n")}`).toEqual([]);
});
