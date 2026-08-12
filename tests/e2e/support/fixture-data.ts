/**
 * Facts about the synthetic e2e dataset (`src/content/seed/fixtures.ts`).
 *
 * These are duplicated here on purpose. A test that imported the fixture module
 * would assert that the fixture equals itself; naming the expected records
 * independently means a change to the dataset has to be acknowledged in both
 * places, and the numbers below stay readable as *expectations* rather than as
 * derived values.
 *
 * Everything here is fictional test data. It is never Foundry content.
 */

/** Companies the production policy lists in `/portfolio`, in archive order. */
export const LISTED_COMPANIES = [
  "Northbound",
  "Harbourline",
  "Coldpress",
  "Granite Works",
  "Sparse Signal",
] as const;

export const LISTED_COMPANY_COUNT = LISTED_COMPANIES.length;

/**
 * `Dormant Co` is `status: "inactive"` — an internal lifecycle state that must
 * never surface publicly (§8.2).
 */
export const HIDDEN_COMPANY_NAME = "Dormant Co";

/** A company with enough approved substance for `/portfolio/[slug]` (§16.2). */
export const COMPANY_WITH_DETAIL = { slug: "northbound", name: "Northbound" } as const;

/**
 * Core identity only: no approved short description or body, so the detail route
 * deliberately does not exist and the card links straight to the company site.
 */
export const COMPANY_WITHOUT_DETAIL = {
  slug: "sparse-signal",
  name: "Sparse Signal",
  websiteUrl: "https://example.com/sparse-signal",
} as const;

/** `stage=seed` matches these two; adding `sector=fintech` narrows it to one. */
export const SEED_STAGE_COMPANIES = ["Harbourline", "Coldpress"] as const;
export const SEED_STAGE_AND_FINTECH_COMPANIES = ["Coldpress"] as const;

/**
 * The complete public route set (§7.1).
 *
 * There are no flagged routes any more: every route the site has, it publishes.
 * The list is kept as a single exported constant so a spec that walks "every
 * public page" cannot silently drift from the sitemap.
 */
export const PUBLIC_ROUTES = ["/", "/portfolio", "/fund", "/privacy"] as const;

/** Navigation labels, from `SEED_SITE_SETTINGS.navigation`. */
export const NAV_LABELS = ["Portfolio", "Fund"] as const;
