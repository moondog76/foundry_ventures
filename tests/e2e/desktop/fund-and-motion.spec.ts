import { expect, test } from "@playwright/test";

/**
 * Acceptance criteria added by the 2026-08-12 rebuild that nothing else covers.
 *
 * These two are easy to break silently and expensive to notice: a pause control
 * that stops responding still *looks* right, and an LP journey degrades one
 * removed link at a time.
 */

test.describe("the ocean can be paused (§10.5, §14.5)", () => {
  test("the control is reachable, labelled by state, and actually stops playback", async ({
    page,
  }) => {
    await page.goto("/");

    const pause = page.getByRole("button", { name: "Pause background" });
    await expect(pause).toBeVisible();

    // WCAG 2.2 target size: the control must be at least 44px in both axes.
    const box = await pause.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

    await pause.click();

    // The accessible name flips, which is what a screen-reader user hears.
    const play = page.getByRole("button", { name: "Play background" });
    await expect(play).toBeVisible();

    // And the video is genuinely paused, not merely relabelled.
    await expect
      .poll(async () => page.locator("video").first().evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);

    await play.click();
    await expect(page.getByRole("button", { name: "Pause background" })).toBeVisible();
  });

  test("the choice survives navigation within the session", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pause background" }).click();

    await page.getByRole("banner").getByRole("link", { name: "Fund" }).click();
    await expect(page).toHaveURL(/\/fund$/);
    await page.goBack();

    // Still paused: §10.5 requires the choice to be remembered for the session,
    // so a visitor does not have to re-pause on every return to the home page.
    await expect(page.getByRole("button", { name: "Play background" })).toBeVisible();
  });

  test("no pause control is offered under reduced motion, because nothing moves", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.getByRole("button", { name: /background/ })).toHaveCount(0);
    await expect
      .poll(async () => page.locator("video").first().evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);

    await context.close();
  });
});

test.describe("the LP journey (§14.1)", () => {
  test("reaches model, people and contact within two clicks of the home page", async ({ page }) => {
    await page.goto("/");

    /*
     * Scoped to the header banner on purpose. §2.8 requires the header to reach
     * Portfolio and Fund without depending on a hero CTA or the footer, so a
     * locator that would also match the footer link would pass even if the
     * header navigation were removed entirely.
     */
    await page.getByRole("banner").getByRole("link", { name: "Fund" }).click();
    await expect(page).toHaveURL(/\/fund$/);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The six operating facts, from the same source as the home page strip.
    for (const value of ["€100k or €200k", "Monthly", "Early stage", "Nordics"]) {
      await expect(page.getByText(value, { exact: false }).first()).toBeVisible();
    }

    // Why the model is repeatable.
    await expect(page.getByRole("heading", { name: /Why the model/i })).toBeVisible();

    /*
     * A real, named, visible person reachable without a form.
     *
     * The dedicated "Who decides" block was removed on owner instruction
     * 2026-08-13, so this leg of §14.1's journey now rests entirely on the
     * contact section. That makes it *more* worth asserting, not less: if the
     * portrait or the name were dropped, the page would still look finished
     * while the audit's largest finding quietly came back.
     */
    const contact = page.getByRole("region", { name: /Talk to us/i });
    await expect(contact.getByText("Anders Nygren")).toBeVisible();
    await expect(contact.getByText("Partner")).toBeVisible();
    await expect(contact.locator("img")).toBeVisible();
    await expect(contact.locator('a[href^="mailto:"]').first()).toBeVisible();
  });

  test("publishes no institutional details it cannot substantiate (§16)", async ({ page }) => {
    await page.goto("/fund");
    const body = (await page.locator("main").innerText()).toLowerCase();

    /*
     * The legal entity block is flagged off until counsel approves real values.
     * What must never appear is draft language standing in for them — the exact
     * defect the audit found on /privacy (§2.9 defect 4).
     */
    for (const placeholder of ["pending confirmation", "tbc", "to be confirmed", "lorem"]) {
      expect(body).not.toContain(placeholder);
    }
  });
});
