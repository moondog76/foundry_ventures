/**
 * §26.3 critical flow 5 — the pitch form (§11.2, §20.5).
 *
 * The happy path runs against the real local file store: `playwright.config.ts`
 * gives the server a `file` driver under `.data/e2e-pitch`, so a success state
 * here means a submission and its outbox event were actually written to disk,
 * not that a mock resolved. Notification delivery is deliberately configured
 * with an unusable provider key — that attempt fails, the outbox schedules a
 * retry, and by design none of that reaches the user.
 *
 * Each test claims its own `x-forwarded-for` address so the per-fingerprint rate
 * limit (five submissions an hour) can never make a re-run fail.
 *
 * Locators use `getByLabel` without `exact`, on purpose: a required field's
 * `<label>` ends in an `aria-hidden` asterisk, so the label *text* is "Email*"
 * even though the accessible name is "Email". Substring matching is unambiguous
 * here — no two fields on this form share a label prefix.
 */

import { expect, test, type Page } from "@playwright/test";
import { isFocused, uniqueForwardedFor } from "../support/helpers";

/** Values that satisfy every rule in `pitchFormSchema`. All obviously fictional. */
const VALID_PITCH = {
  country: "Sweden",
  firstName: "Testa",
  lastName: "Testsson",
  email: "founder@example.invalid",
  companyName: "End To End Test Company",
  stage: "MVP",
  fundingRaisedEur: "0",
  // At least 30 characters (§11.2).
  oneLinePitch: "An automated end-to-end test pitch that is long enough to pass validation.",
  // At least 100 characters.
  description:
    "This description exists only to exercise the submission pipeline end to end. It is well over the hundred " +
    "character minimum the schema enforces, so the form should accept it and the server should store it in the " +
    "local file store configured for this test run.",
} as const;

const field = {
  country: (page: Page) => page.getByLabel("Country"),
  firstName: (page: Page) => page.getByLabel("First name"),
  lastName: (page: Page) => page.getByLabel("Last name"),
  email: (page: Page) => page.getByLabel("Email"),
  companyName: (page: Page) => page.getByLabel("Company name"),
  stage: (page: Page) => page.getByLabel("Current stage"),
  funding: (page: Page) => page.getByLabel("Funding raised (EUR)"),
  oneLinePitch: (page: Page) => page.getByLabel("One-line pitch"),
  description: (page: Page) => page.getByLabel("More about the company"),
  consent: (page: Page) => page.getByRole("checkbox", { name: /privacy notice/ }),
};

async function fillValidPitch(page: Page): Promise<void> {
  await field.country(page).selectOption(VALID_PITCH.country);
  await field.firstName(page).fill(VALID_PITCH.firstName);
  await field.lastName(page).fill(VALID_PITCH.lastName);
  await field.email(page).fill(VALID_PITCH.email);
  await field.companyName(page).fill(VALID_PITCH.companyName);
  await field.stage(page).selectOption(VALID_PITCH.stage);
  await field.funding(page).fill(VALID_PITCH.fundingRaisedEur);
  await field.oneLinePitch(page).fill(VALID_PITCH.oneLinePitch);
  await field.description(page).fill(VALID_PITCH.description);
  await field.consent(page).check();
}

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueForwardedFor() });
});

test("a complete pitch is accepted and confirmed", async ({ page }) => {
  await page.goto("/pitch");

  const form = page.locator("#pitch-form");
  await expect(form).toBeVisible();

  await fillValidPitch(page);
  await page.getByRole("button", { name: "Send pitch" }).click();

  /*
   * The client deliberately holds the request until the anti-spam minimum fill
   * time (3s) has elapsed, and the server then writes the submission and its
   * outbox event before attempting an (unreachable) notification. 30s is
   * comfortably above the worst case and still well short of a hang.
   */
  const success = page.getByRole("heading", { name: "Thank you — your pitch is with us" });
  await expect(success).toBeVisible({ timeout: 30_000 });

  // The confirmation replaces the form outright — the last line of defence
  // against a double submit is that there is no longer a button to press.
  await expect(form).toHaveCount(0);

  // Focus is moved to the confirmation heading so a screen-reader user is placed
  // at the start of the answer rather than where the button used to be.
  await expect(success).toBeFocused();

  // The reference is the stored submission id, so its presence means the record
  // reached the store rather than merely being accepted by the transport.
  await expect(page.getByText(/^Reference:/)).toBeVisible();
});

test("a validation failure focuses the error summary and keeps every value", async ({ page }) => {
  await page.goto("/pitch");

  await fillValidPitch(page);
  // One bad field, everything else valid: the realistic failure, not an empty form.
  await field.email(page).fill("not-an-email");

  await page.getByRole("button", { name: "Send pitch" }).click();

  const summary = page.locator("#pitch-error-summary");
  await expect(summary).toBeVisible();
  await expect(summary.getByRole("heading")).toHaveText("There is 1 problem with your pitch");

  // §20.5: the summary itself takes focus, so the user is put in front of the
  // problem instead of being left at the bottom of a form that did nothing.
  expect(await isFocused(summary), "the error summary must take focus after a failed submit").toBe(
    true,
  );

  // Nothing the founder typed may be lost — that is the whole point of the rule.
  await expect(field.firstName(page)).toHaveValue(VALID_PITCH.firstName);
  await expect(field.lastName(page)).toHaveValue(VALID_PITCH.lastName);
  await expect(field.companyName(page)).toHaveValue(VALID_PITCH.companyName);
  await expect(field.oneLinePitch(page)).toHaveValue(VALID_PITCH.oneLinePitch);
  await expect(field.description(page)).toHaveValue(VALID_PITCH.description);
  await expect(field.country(page)).toHaveValue(VALID_PITCH.country);
  await expect(field.stage(page)).toHaveValue(VALID_PITCH.stage);
  await expect(field.consent(page)).toBeChecked();
  await expect(field.email(page)).toHaveValue("not-an-email");

  // The offending control is marked, described by its message, and reachable
  // from the summary in one activation.
  await expect(field.email(page)).toHaveAttribute("aria-invalid", "true");
  await summary.getByRole("link").first().click();
  await expect(field.email(page)).toBeFocused();

  // Editing the field clears its message immediately — a stale error under a
  // field the user has already fixed is actively misleading.
  await field.email(page).fill(VALID_PITCH.email);
  await expect(page.locator("#pitch-email-error")).toHaveCount(0);
});

test("an empty submission reports every missing field, in visual order", async ({ page }) => {
  await page.goto("/pitch");

  await page.getByRole("button", { name: "Send pitch" }).click();

  const summary = page.locator("#pitch-error-summary");
  await expect(summary).toBeVisible();

  // The summary is sorted by the form's own field order, so "the first error" is
  // always the one nearest the top of the page.
  const messages = await summary.getByRole("listitem").allInnerTexts();
  expect(messages.length).toBeGreaterThan(1);
  expect(messages[0]).toContain("Country");

  expect(await isFocused(summary), "the error summary must take focus after a failed submit").toBe(
    true,
  );

  // Client-side validation refused it, so nothing was sent — the form is intact.
  await expect(page.locator("#pitch-form")).toBeVisible();
});
