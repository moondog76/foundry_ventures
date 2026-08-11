/**
 * §26.3 critical flow 1 — Home → Portfolio → filter → company → Pitch.
 *
 * This is the path that carries the site's whole commercial purpose, so it is
 * walked the way a visitor walks it: real clicks on real links, no direct
 * `goto()` shortcuts between the steps. Each step also re-asserts the two
 * structural invariants that are easiest to break during a rebuild — exactly one
 * `<h1>`, and no `<main>` other than the one the root layout owns.
 */

import { expect, test, type Page } from "@playwright/test";
import {
  COMPANY_WITH_DETAIL,
  COMPANY_WITHOUT_DETAIL,
  LISTED_COMPANY_COUNT,
  SEED_STAGE_COMPANIES,
} from "../support/fixture-data";
import { headingLevelOneTexts } from "../support/helpers";

/** §6.2: one `h1`, one `main`, and the `main` belongs to the layout. */
async function expectDocumentStructure(page: Page, route: string): Promise<void> {
  const headings = await headingLevelOneTexts(page);
  expect(
    headings,
    `${route} must have exactly one h1, found: ${JSON.stringify(headings)}`,
  ).toHaveLength(1);
  await expect(page.locator("main"), `${route} must not add a second <main>`).toHaveCount(1);
  await expect(page.locator("main")).toHaveAttribute("id", "main-content");
}

test("a visitor can go from the home page to a company and on to the pitch form", async ({
  page,
}) => {
  await test.step("home page", async () => {
    await page.goto("/");
    await expectDocumentStructure(page, "/");
  });

  await test.step("navigate to the portfolio archive", async () => {
    // The header's primary navigation, not a body CTA: it is present on every
    // route and its label comes from site settings rather than editorial copy.
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Portfolio", exact: true })
      .click();

    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();
    await expectDocumentStructure(page, "/portfolio");
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(LISTED_COMPANY_COUNT);
  });

  await test.step("narrow the archive with a filter", async () => {
    // A real checkbox inside a real fieldset — the accessible name is the option
    // title plus its count, so the name is matched loosely.
    await page.getByRole("checkbox", { name: /^Seed/ }).check();

    // The archive is URL-driven: the address bar is the assertion that matters.
    await expect(page).toHaveURL(/\/portfolio\?stage=seed$/);

    const cards = page.getByRole("main").getByRole("article");
    await expect(cards).toHaveCount(SEED_STAGE_COMPANIES.length);
    for (const name of SEED_STAGE_COMPANIES) {
      await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
    }

    // The live region announces the narrowed result against the whole archive.
    await expect(page.getByRole("status")).toHaveText(
      `${SEED_STAGE_COMPANIES.length} of ${LISTED_COMPANY_COUNT} companies`,
    );
  });

  await test.step("open a company detail page", async () => {
    // Filtered results do not include Northbound, so clear the filter first —
    // the same way a visitor would.
    await page.getByRole("checkbox", { name: /^Seed/ }).uncheck();
    await expect(page).toHaveURL(/\/portfolio$/);

    await page.locator(`a[href="/portfolio/${COMPANY_WITH_DETAIL.slug}"]`).click();

    await expect(page).toHaveURL(new RegExp(`/portfolio/${COMPANY_WITH_DETAIL.slug}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: COMPANY_WITH_DETAIL.name }),
    ).toBeVisible();
    await expectDocumentStructure(page, `/portfolio/${COMPANY_WITH_DETAIL.slug}`);
  });

  await test.step("follow the pitch banner", async () => {
    // Scoped by the banner's own heading id rather than by its (editorial)
    // wording, so approving different copy cannot break the journey test.
    const banner = page.getByRole("region").filter({ has: page.locator("#pitch-banner-heading") });
    await banner.getByRole("link").click();

    await expect(page).toHaveURL(/\/pitch$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pitch us" })).toBeVisible();
    await expectDocumentStructure(page, "/pitch");

    // The conversion path is only real if the form is actually there.
    await expect(page.getByRole("button", { name: "Send pitch" })).toBeVisible();
  });
});

test("a company without enough approved detail links straight to its own site", async ({
  page,
}) => {
  await page.goto("/portfolio");

  // §16.2: no internal route, so the card is an external link — never a `#`.
  const card = page.locator(`a[href="${COMPANY_WITHOUT_DETAIL.websiteUrl}"]`);
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute("rel", "noopener noreferrer");
  await expect(card).toHaveAttribute("target", "_blank");

  await expect(page.locator(`a[href="/portfolio/${COMPANY_WITHOUT_DETAIL.slug}"]`)).toHaveCount(0);
  // Nothing anywhere may render a dead link.
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});
