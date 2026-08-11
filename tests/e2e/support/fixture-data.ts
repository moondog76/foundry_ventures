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

/** People published on `/team`, in sort order. */
export const TEAM_WITH_DETAIL = { slug: "anders-nygren", name: "Anders Nygren" } as const;
/** No approved long bio, so §10.2 forbids a profile route for this person. */
export const TEAM_WITHOUT_DETAIL = { slug: "julia-siljehag", name: "Julia Siljehag" } as const;

/** Internal articles: the archive links to routes this site owns. */
export const INTERNAL_POST = {
  slug: "fixture-article-shipping-velocity",
  title: "A fixture article about shipping velocity",
} as const;

export const SECOND_INTERNAL_POST = {
  slug: "fixture-article-second",
  title: "A second fixture article",
} as const;

/** Published posts, newest first — the order `/insights` renders them in. */
export const INTERNAL_POST_SLUGS_NEWEST_FIRST = [
  INTERNAL_POST.slug,
  SECOND_INTERNAL_POST.slug,
] as const;

/**
 * External portfolio news. §12.1 forbids a thin internal duplicate of somebody
 * else's article, so the card links straight out and no `/insights/…` route
 * exists for it.
 */
export const EXTERNAL_POST = {
  title: "Northbound raises a fixture round",
  url: "https://example.org/northbound-round",
} as const;

/** Feature-flagged routes (§3.4). The fixture dataset turns all three on. */
export const FLAGGED_ROUTES = ["/insights", "/about", "/network"] as const;

/** Navigation labels for those routes, from `SEED_SITE_SETTINGS.navigation`. */
export const FLAGGED_NAV_LABELS = ["Insights", "About", "Network"] as const;
