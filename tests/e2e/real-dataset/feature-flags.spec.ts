/**
 * §26.3 critical flow 4, second half — the *disabled* side of the feature gate
 * (§3.4), against the real, shipping dataset.
 *
 * "Off" has a precise meaning and this file is where it is pinned down. With
 * `insights`, `about` and `network` disabled in production the route must behave
 * as if it had never existed:
 *
 *   - the page 404s (`requireFeature` calls `notFound()`),
 *   - `generateMetadata` returns `HIDDEN_ROUTE_METADATA`, so nothing hints that
 *     a disabled route is there,
 *   - the navigation does not offer it (`getSiteSettings` filters it out),
 *   - the sitemap does not advertise it.
 *
 * ---------------------------------------------------------------------------
 * Why this project has its own server
 * ---------------------------------------------------------------------------
 *
 * The rest of the suite runs against the synthetic fixture dataset, which turns
 * all three flags ON — so the disabled behaviour is simply not observable there.
 * A single Next process has a single environment, so this project talks to a
 * second `next start` on port 3101 with the fixture switches cleared. Both
 * servers serve the same build; the pages are rendered per request, so each
 * process answers from its own dataset. `playwright.config.ts` documents the
 * arrangement in full.
 *
 * `/sitemap.xml` is the one route Next freezes at build time (it exports
 * `revalidate`), which is precisely why the build runs with the fixtures
 * switched off: the sitemap both servers serve is the honest one.
 */

import { expect, test } from "@playwright/test";

const FLAGGED_ROUTES = ["/insights", "/about", "/network"] as const;
const FLAGGED_NAV_LABELS = ["Insights", "About", "Network"] as const;

test("the fixture dataset is NOT loaded on this server", async ({ request }) => {
  // A guard on the guard: if this server ever picked up the fixture switches,
  // every assertion below would pass for the wrong reason.
  const response = await request.get("/portfolio/northbound");
  expect(
    response.status(),
    "the real-dataset server must not be serving the synthetic e2e fixtures",
  ).toBe(404);
});

for (const route of FLAGGED_ROUTES) {
  test(`${route} returns 404 in production`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });

    // Not a redirect to somewhere friendlier, and not a 200 with an empty page:
    // a disabled route must be indistinguishable from one that never existed.
    expect(response.status(), `${route} must 404 while its flag is off`).toBe(404);
  });
}

test("a disabled route renders the branded 404, not a hint that it exists", async ({ page }) => {
  await page.goto("/insights");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We can’t find that page");

  // `HIDDEN_ROUTE_METADATA` must not leak the route's real name into the title.
  const title = await page.title();
  expect(title.toLowerCase()).not.toContain("insights");
});

test("disabled routes are absent from the navigation", async ({ page }) => {
  await page.goto("/");

  for (const label of FLAGGED_NAV_LABELS) {
    await expect(
      page.getByRole("navigation").getByRole("link", { name: label, exact: true }),
      `"${label}" must not appear in any navigation while its flag is off`,
    ).toHaveCount(0);
  }

  // Nothing anywhere on the page may link to a route that would 404.
  for (const route of FLAGGED_ROUTES) {
    await expect(
      page.locator(`a[href="${route}"], a[href^="${route}/"]`),
      `nothing may link to ${route} while its flag is off`,
    ).toHaveCount(0);
  }
});

test("disabled routes are absent from the sitemap", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);

  const xml = await response.text();

  for (const route of FLAGGED_ROUTES) {
    expect(xml, `${route} must not be advertised while its flag is off`).not.toContain(
      `<loc>https://www.foundryventures.ai${route}</loc>`,
    );
  }

  // The routes that exist unconditionally are still listed, so an empty or
  // broken sitemap cannot make the assertions above pass by accident.
  for (const route of ["/", "/portfolio", "/team", "/pitch"]) {
    expect(xml).toContain(`<loc>https://www.foundryventures.ai${route}</loc>`);
  }
});

test("the sitemap advertises only URLs that actually resolve", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  const xml = await response.text();

  const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
    (match) => new URL(match[1]).pathname,
  );
  expect(paths.length, "the sitemap must not be empty").toBeGreaterThan(0);

  // §16.8: one policy decides both, so a listed URL can never 404 — nor the
  // reverse.
  for (const path of paths) {
    const page = await request.get(path, { maxRedirects: 0 });
    expect(page.status(), `${path} is in the sitemap but answered ${page.status()}`).toBe(200);
  }
});
