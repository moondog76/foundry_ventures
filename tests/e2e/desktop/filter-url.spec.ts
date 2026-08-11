/**
 * §26.3 critical flow 2 — the filter URL contract (§8.2, §18.1).
 *
 * Three separate promises are made about `/portfolio?…`, and each is a different
 * failure mode:
 *
 *  1. **A shared link reproduces the result exactly.** The archive is rendered on
 *     the server from the incoming URL, so a pasted link must produce the same
 *     cards, the same count and the same checked boxes as clicking would.
 *  2. **Back walks one filter step at a time.** Every explicit user action is a
 *     `router.push`, never a `replace`, so history is the reader's own trail.
 *  3. **A non-canonical URL normalises exactly once, via `replace`.** Both a
 *     legacy alias (`status=exit-realized`) and a reordered query normalise to
 *     the canonical form without leaving a second history entry behind — pressing
 *     Back after landing on a shared link must leave the site, not bounce
 *     between two spellings of the same page.
 *
 * The canonical form itself is the engine's contract: schema group order (stage,
 * sector, focus, status), alphabetical values inside a group, repeated keys
 * rather than comma lists.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  LISTED_COMPANY_COUNT,
  SEED_STAGE_AND_FINTECH_COMPANIES,
  SEED_STAGE_COMPANIES,
} from "../support/fixture-data";

function cards(page: Page) {
  return page.getByRole("main").getByRole("article");
}

/** Company names currently rendered in the archive, in DOM order. */
async function visibleCompanyNames(page: Page): Promise<string[]> {
  return page.getByRole("main").getByRole("heading", { level: 3 }).allInnerTexts();
}

test("a shared filtered URL reproduces the interactive result exactly", async ({ page }) => {
  await page.goto("/portfolio");
  await page.getByRole("checkbox", { name: /^Seed/ }).check();
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
  const interactive = await visibleCompanyNames(page);

  // A second, independent visit to the same address — the "pasted link" case.
  await page.goto("/portfolio?stage=seed");

  expect(await visibleCompanyNames(page)).toEqual(interactive);
  expect(interactive).toEqual([...SEED_STAGE_COMPANIES]);
  await expect(cards(page)).toHaveCount(SEED_STAGE_COMPANIES.length);

  // The control reflects the URL, not the other way round.
  await expect(page.getByRole("checkbox", { name: /^Seed/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /^Pre-seed/ })).not.toBeChecked();

  // Already canonical: nothing to normalise, so the URL is untouched.
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
});

test("back and forward step through filters one at a time", async ({ page }) => {
  await page.goto("/portfolio");

  await page.getByRole("checkbox", { name: /^Seed/ }).check();
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);

  // A second group: AND between groups, so this narrows the result further.
  await page.getByRole("checkbox", { name: /^Fintech/ }).check();
  await expect(page).toHaveURL(/\/portfolio\?stage=seed&sector=fintech$/);
  await expect(cards(page)).toHaveCount(SEED_STAGE_AND_FINTECH_COMPANIES.length);

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
  await expect(cards(page)).toHaveCount(SEED_STAGE_COMPANIES.length);
  await expect(page.getByRole("checkbox", { name: /^Fintech/ })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /^Seed/ })).toBeChecked();

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(cards(page)).toHaveCount(LISTED_COMPANY_COUNT);
  await expect(page.getByRole("checkbox", { name: /^Seed/ })).not.toBeChecked();

  await page.goForward();
  await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);
  await expect(cards(page)).toHaveCount(SEED_STAGE_COMPANIES.length);
  await expect(page.getByRole("checkbox", { name: /^Seed/ })).toBeChecked();
});

test("a legacy status alias normalises once and adds no history entry", async ({ page }) => {
  // Start somewhere the reader could plausibly have come from, so "Back" has a
  // meaningful destination to prove.
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);

  // `status=exit-realized` is the pre-rebuild spelling; the engine expands it to
  // two canonical values (§8.2).
  await page.goto("/portfolio?status=exit-realized");

  await expect(page).toHaveURL(/\/portfolio\?status=exited&status=realized$/);
  // Exited + Realized, OR inside the group: Coldpress and Granite Works.
  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByRole("checkbox", { name: /^Exited/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /^Realized/ })).toBeChecked();

  // The normalisation was a `replace`: one Back leaves the archive entirely.
  // A `push` would land on `?status=exit-realized` instead.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("a reordered query normalises to canonical group order without a history entry", async ({
  page,
}) => {
  await page.goto("/");

  // Same selection as the canonical `stage=seed&sector=fintech`, written the
  // wrong way round — which is exactly what hand-edited and hand-shared links
  // look like.
  await page.goto("/portfolio?sector=fintech&stage=seed");

  await expect(page).toHaveURL(/\/portfolio\?stage=seed&sector=fintech$/);
  expect(await visibleCompanyNames(page)).toEqual([...SEED_STAGE_AND_FINTECH_COMPANIES]);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("unknown filter keys and values are dropped rather than honoured", async ({ page }) => {
  await page.goto("/");

  // `colour` is not a group; `platinum` is not a stage; `inactive` is deliberately
  // absent from the public status vocabulary (§8.2).
  await page.goto("/portfolio?colour=blue&stage=platinum&status=inactive");

  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(cards(page)).toHaveCount(LISTED_COMPANY_COUNT);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});
