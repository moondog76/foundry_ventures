/**
 * §26.3 critical flow 8 — legacy routing and status codes (§15.2).
 *
 * These are asserted at the HTTP level with `maxRedirects: 0`, because the thing
 * under test *is* the status code and the `Location` header. A browser
 * navigation would follow the hop and tell us nothing about how many hops there
 * were, and `notFound()` cannot express 410 at all — the middleware produces
 * Gone directly, which is exactly why it needs a test that reads the number.
 *
 * `FOUNDRY_ENFORCE_CANONICAL_HOST` is off for the test server (see
 * `playwright.config.ts`), so no host normalisation is layered on top. The
 * legacy rules below still redirect to the absolute canonical origin, because
 * the middleware resolves the legacy path and the canonical host in the same
 * decision — that is the whole point of the single-hop requirement.
 */

import { expect, test } from "@playwright/test";

const CANONICAL_ORIGIN = "https://www.foundryventures.ai";

test("/home is a single-hop 308 to the canonical root", async ({ request }) => {
  const response = await request.get("/home", { maxRedirects: 0 });

  // 308, not 301: the method and body must be preserved by every client.
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toBe(`${CANONICAL_ORIGIN}/`);
});

test("/offering is a single-hop 308 to the home anchor", async ({ request }) => {
  const response = await request.get("/offering", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toBe(`${CANONICAL_ORIGIN}/#offering`);
});

test("attribution parameters survive a legacy redirect, ahead of the fragment", async ({
  request,
}) => {
  const response = await request.get("/offering?utm_source=newsletter", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  // The query has to precede `#`, or the fragment swallows it.
  expect(response.headers()["location"]).toBe(
    `${CANONICAL_ORIGIN}/?utm_source=newsletter#offering`,
  );
});

test("/instructors returns a real 410 Gone", async ({ request }) => {
  const response = await request.get("/instructors", { maxRedirects: 0 });

  // The status is the assertion. A 404 body that says "gone" is not the same
  // thing to a crawler, and a redirect to a live page is worse than either.
  expect(response.status()).toBe(410);
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
});

test("/pricing returns a real 410 Gone", async ({ request }) => {
  const response = await request.get("/pricing", { maxRedirects: 0 });

  expect(response.status()).toBe(410);
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
});

test("a dead page is never redirected to a live one first", async ({ request }) => {
  // Precedence matters: Gone wins outright, so this must not be a 3xx even when
  // other rules could match the request.
  for (const path of ["/instructors", "/pricing"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `${path} must answer 410, not a redirect`).toBe(410);
  }
});

test("an unknown path returns 404 with the branded page", async ({ page, request }) => {
  const response = await request.get("/a-path-that-was-never-published", { maxRedirects: 0 });
  expect(response.status()).toBe(404);

  // The branded 404 renders inside the root layout, so the visitor keeps the
  // skip link, the header and the footer, and gets three live destinations.
  await page.goto("/a-path-that-was-never-published");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We can’t find that page");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  await expect(page.getByRole("link", { name: "See the portfolio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "The fund" })).toBeVisible();
});

test("a trailing slash normalises in one hop", async ({ request }) => {
  const response = await request.get("/portfolio/", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  // Same origin as the request, because host normalisation is off here; the path
  // is already the canonical one.
  expect(response.headers()["location"]).toMatch(/\/portfolio$/);
});
