/**
 * §26.1 — the content API (`src/content/index.ts`) against the real seed.
 *
 * These tests are deliberately written against the *actual* shipping dataset
 * rather than a hand-made one. The content owner approved publication on
 * 2026-08-11, but only of what Foundry already states: company names, websites,
 * logos and the live captions. Taxonomy, status, founders and body copy stay
 * unapproved, so no detail route is generated and no invented fact can reach a
 * card. A test that swapped in approved-looking data would hide exactly the
 * behaviour worth protecting.
 *
 * The one exception is the related-content algorithm, which needs more than one
 * publishable post to have any behaviour at all. That runs against the clearly
 * synthetic fixture dataset, switched on through both of its env guards.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  RichText,
  Company,
  FieldEvidence,
} from "@/content/types";
import {
  __setAdapterForTests,
  getCompanies,
  getCompanyFacets,
  getFeaturedCompanies,
  rawContent,
  richTextToPlainText,
  toCompanySummary,
} from "@/content";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import { SEED_HOME_PAGE } from "@/content/seed/home";

const APPROVED: FieldEvidence = {
  status: "owner-approved",
  sources: [{ label: "Unit-test fixture", observedAt: "2026-08-10" }],
};
const OBSERVED: FieldEvidence = {
  status: "observed",
  sources: [{ label: "Unit-test fixture", observedAt: "2026-08-10" }],
};

// The adapter is memoised at module scope; clearing it keeps each test honest
// about which dataset it is running against.
beforeEach(() => __setAdapterForTests(null));
afterEach(() => __setAdapterForTests(null));

/* ------------------------------------------------------------- Companies */

describe("getCompanies (real seed)", () => {
  /*
   * The published display order. No longer purely the live snapshot: the owner
   * swapped Memmo and Empley on 2026-08-13, so Memmo leads and Empley sits
   * eighth. Asserted in full because the order is an editorial decision and a
   * silent reshuffle — from an accidental `sortOrder` collision, say — would
   * otherwise reach production unnoticed.
   */
  const LIVE_ORDER = [
    "memmo",
    "agaton",
    "grand",
    "wilgot",
    "openroll",
    "newly",
    "skattio",
    "empley",
    // Confirmed by the content owner on 2026-08-11, after the live snapshot.
    "builderbase",
    // Added by the content owner on 2026-08-13.
    "monava",
  ];

  it("returns every portfolio company in the observed live order", async () => {
    const summaries = await getCompanies(undefined, PREVIEW_POLICY);
    expect(summaries.map((summary) => summary.slug)).toEqual(LIVE_ORDER);
  });

  it("shows the same order on the home page as on /portfolio", async () => {
    /*
     * These two grids reach their order by different routes: `/portfolio` sorts
     * by `sortOrder`, while the home page hands `getFeaturedCompanies` an
     * explicit slug list from the home document, which that function honours
     * verbatim so a future editorial selection can override the ranking.
     *
     * That flexibility is also the hazard. When Memmo and Empley were swapped on
     * 2026-08-13 the home list was still being built from the seed array's own
     * position, so `/portfolio` reordered and the home page did not — the two
     * pages disagreed in production and nothing failed. Asserting the agreement
     * is the only thing that catches it.
     */
    const archive = (await getCompanies(undefined, PRODUCTION_POLICY)).map((c) => c.slug);
    const homeSlugs = SEED_HOME_PAGE.featuredPortfolio.companyIds.map((c) => c.slug);
    const featured = (await getFeaturedCompanies(homeSlugs, homeSlugs.length, PRODUCTION_POLICY))
      .map((c) => c.slug);

    expect(featured).toEqual(archive);
  });

  it("publishes the same companies in production, because the owner approved them", async () => {
    const summaries = await getCompanies(undefined, PRODUCTION_POLICY);
    expect(summaries.map((summary) => summary.slug)).toEqual(LIVE_ORDER);
    expect(await getFeaturedCompanies(["empley"], 8, PRODUCTION_POLICY)).not.toEqual([]);
  });

  it("publishes only what Foundry actually states about each company", async () => {
    const companies = await rawContent.companies();
    const summaries = companies.map((company) => toCompanySummary(company, PRODUCTION_POLICY));

    for (const summary of summaries) {
      // Approval covered name, website, logo and the live caption. It did not
      // cover taxonomy, status or founders — the live site states none of them,
      // so none may appear.
      expect(summary.status).toBeNull();
      expect(summary.stages).toEqual([]);
      expect(summary.sectors).toEqual([]);
      expect(summary.focuses).toEqual([]);
      expect(summary.founders).toEqual([]);

      expect(summary.logo).not.toBeNull();
      expect(summary.logo?.available).toBe(true);
      expect(summary.logo?.rightsStatus).toBe("approved");
      expect(summary.logo?.src).toMatch(/^\/images\/portfolio\//);
      // Each mark declares the field it needs so a black wordmark is never
      // rendered onto a black card.
      expect(["dark", "light"]).toContain(summary.logoSurface);

      // No company has body copy, so none may generate a thin detail route.
      expect(summary.href).toBeNull();
    }
  });

  it("describes every company from its own website, and says so in the evidence", async () => {
    const companies = await rawContent.companies();

    for (const company of companies) {
      const summary = toCompanySummary(company, PRODUCTION_POLICY);

      /*
       * The card descriptor, drafted from the company's own site. §8.4 budgets
       * it at 10-14 words — one clause, not the two-sentence paragraph this
       * used to be, because nine of them sit in a grid on the home page.
       */
      expect(summary.tagline).not.toBeNull();
      const words = (summary.tagline as string).trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(10);
      expect(words).toBeLessThanOrEqual(14);

      // The provenance travels with the field: the source is the company's own
      // website, and the note records that Foundry has not read the wording yet.
      const evidence = company.fieldEvidence.tagline;
      expect(evidence?.status).toBe("owner-approved");
      expect(evidence?.sources.some((s) => s.url === company.websiteUrl)).toBe(true);
      expect(evidence?.note).toMatch(/not yet reviewed by Foundry/);
    }
  });

  it("links every card out to its own confirmed website", async () => {
    const companies = await rawContent.companies();
    const summaries = companies.map((company) => toCompanySummary(company, PRODUCTION_POLICY));

    expect(summaries.find((s) => s.slug === "empley")?.externalHref).toBe("https://empley.com/");
    expect(summaries.find((s) => s.slug === "builderbase")?.externalHref).toBe(
      "https://builderbase.com/",
    );

    // No company has body copy, so every destination is the external site and
    // none of them is a thin internal page.
    for (const summary of summaries) {
      expect(summary.href).toBeNull();
      expect(summary.externalHref).toMatch(/^https:\/\//);
    }
  });

  it("still carries the company name and a card sort order in production", async () => {
    const companies = await rawContent.companies();
    const summaries = companies.map((company) => toCompanySummary(company, PRODUCTION_POLICY));

    for (const summary of summaries) {
      expect(summary.name.trim()).not.toBe("");
      expect(summary.logoAlt).toBe(`${summary.name} logo`);
      expect(Number.isFinite(summary.sortOrder)).toBe(true);
    }
  });
});

describe("toCompanySummary destination resolution", () => {
  const base: Company = {
    id: "test-company",
    name: "Testcorp Fixture",
    slug: "testcorp-fixture",
    publicationStatus: "published",
    verificationStatus: "verified",
    dataCompleteness: { coreIdentity: true, editorial: true, relations: true, seo: true },
    fieldEvidence: {
      name: APPROVED,
      logo: APPROVED,
      websiteUrl: APPROVED,
      shortDescription: APPROVED,
      body: APPROVED,
    },
    shortDescription: "A synthetic record used only by the unit tests.",
    body: [{ type: "paragraph", spans: [{ text: "Fixture body copy." }] }],
    websiteUrl: "https://example.com/testcorp",
    featured: false,
    sortOrder: 10,
  };

  it("resolves to the internal detail route when the detail template is publishable", () => {
    const summary = toCompanySummary(base, PRODUCTION_POLICY);

    expect(summary.href).toBe("/portfolio/testcorp-fixture");
    expect(summary.externalHref).toBeNull();
  });

  it("resolves to the verified external site when there is no detail route", () => {
    const sparse: Company = { ...base, body: undefined };
    const summary = toCompanySummary(sparse, PRODUCTION_POLICY);

    expect(summary.href).toBeNull();
    expect(summary.externalHref).toBe("https://example.com/testcorp");
  });

  it("resolves to neither destination when the website is not approved", () => {
    const nowhere: Company = {
      ...base,
      body: undefined,
      fieldEvidence: { ...base.fieldEvidence, websiteUrl: OBSERVED },
    };
    const summary = toCompanySummary(nowhere, PRODUCTION_POLICY);

    expect(summary.href).toBeNull();
    expect(summary.externalHref).toBeNull();
  });
});

describe("getCompanyFacets (real seed)", () => {
  it("returns no facet groups, because no approved taxonomy exists", async () => {
    // Filters that cannot filter must not be dressed up: the live site publishes
    // no stage/sector/focus/status vocabulary, so there is nothing to build from.
    expect(await getCompanyFacets(PRODUCTION_POLICY)).toEqual([]);
    // Same answer in preview — it is the data that is missing, not the approval.
    expect(await getCompanyFacets(PREVIEW_POLICY)).toEqual([]);
  });
});

/* ------------------------------------------------- Feature-flagged surfaces */

/* -------------------------------------------------------------- Rich text */

describe("richTextToPlainText", () => {
  it("flattens paragraphs, headings, list items and quotes into one string", () => {
    const body: RichText = [
      { type: "paragraph", spans: [{ text: "First " }, { text: "paragraph." }] },
      { type: "heading", level: 2, spans: [{ text: "A heading" }] },
      { type: "list", style: "bullet", items: [[{ text: "One" }], [{ text: "Two" }]] },
      { type: "blockquote", spans: [{ text: "A quote" }], attribution: "Someone" },
    ];

    expect(richTextToPlainText(body)).toBe("First paragraph. A heading One Two A quote");
  });

  it("ignores blocks that carry no text", () => {
    const body: RichText = [
      {
        type: "image",
        image: {
          id: "i",
          src: "/x.png",
          width: 1,
          height: 1,
          rightsStatus: "approved",
          available: true,
        },
      },
      { type: "embed", provider: "youtube", url: "https://youtube.com/watch?v=x", title: "T" },
      { type: "paragraph", spans: [{ text: "Only this." }] },
    ];

    expect(richTextToPlainText(body)).toBe("Only this.");
  });

  it("returns an empty string for a missing body", () => {
    expect(richTextToPlainText(undefined)).toBe("");
    expect(richTextToPlainText([])).toBe("");
  });
});


