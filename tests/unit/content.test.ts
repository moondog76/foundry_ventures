/**
 * §26.1 — the content API (`src/content/index.ts`) against the real seed.
 *
 * These tests are deliberately written against the *actual* frozen 2026-08-10
 * dataset rather than a hand-made one: the point of the content layer is that
 * production renders only what a content owner has approved, and the honest
 * current answer for most of it is "nothing". A test that quietly swapped in
 * approved-looking data would hide exactly the behaviour worth protecting.
 *
 * The one exception is the related-content algorithm, which needs more than one
 * publishable post to have any behaviour at all. That runs against the clearly
 * synthetic fixture dataset, switched on through both of its env guards.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setAdapterForTests,
  getCompanies,
  getCompanyFacets,
  getFeaturedCompanies,
  getPosts,
  getRelatedPosts,
  getStats,
  getTestimonials,
  rawContent,
  readingTimeMinutes,
  richTextToPlainText,
  toCompanySummary,
  toPostSummary,
} from "@/content";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import { isFixtureModeEnabled } from "@/content/seed/fixtures";
import type { Company, FieldEvidence, Post, RichText } from "@/content/types";

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
  it("returns all eight observed portfolio companies in preview", async () => {
    const summaries = await getCompanies(undefined, PREVIEW_POLICY);

    expect(summaries).toHaveLength(8);
    expect(summaries.map((summary) => summary.slug)).toEqual([
      "empley",
      "agaton",
      "grand",
      "wilgot",
      "openroll",
      "newly",
      "skattio",
      "memmo",
    ]);
  });

  it("publishes nothing in production, because every seeded field is only observed", async () => {
    // This is the correct production state for the frozen dataset, not a bug:
    // the seed records are `review` + `observed`, and observation is not approval.
    expect(await getCompanies(undefined, PRODUCTION_POLICY)).toEqual([]);
    expect(await getFeaturedCompanies([], 8, PRODUCTION_POLICY)).toEqual([]);
  });

  it("exposes no tagline and no status for any seeded company in production", async () => {
    const companies = await rawContent.companies();
    const summaries = companies.map((company) => toCompanySummary(company, PRODUCTION_POLICY));

    expect(summaries).toHaveLength(8);
    for (const summary of summaries) {
      expect(summary.tagline).toBeNull();
      expect(summary.status).toBeNull();
      expect(summary.stages).toEqual([]);
      expect(summary.sectors).toEqual([]);
      expect(summary.focuses).toEqual([]);
      expect(summary.founders).toEqual([]);

      // The logo is the one exception: the content owner supplied these files
      // directly on 2026-08-11, which approves the artwork — and nothing else.
      expect(summary.logo).not.toBeNull();
      expect(summary.logo?.available).toBe(true);
      expect(summary.logo?.rightsStatus).toBe("approved");
      expect(summary.logo?.src).toMatch(/^\/images\/portfolio\//);
      // Each mark declares the field it needs so a black wordmark is never
      // rendered onto a black card.
      expect(["dark", "light"]).toContain(summary.logoSurface);
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

describe("feature-flagged surfaces (real seed)", () => {
  it("publishes no posts, testimonials or stats while their flags are off", async () => {
    expect(await getPosts(undefined, PRODUCTION_POLICY)).toEqual([]);
    expect(await getTestimonials(PRODUCTION_POLICY)).toEqual([]);
    expect(await getStats(PRODUCTION_POLICY)).toEqual([]);
  });
});

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

describe("readingTimeMinutes", () => {
  const paragraph = (words: number): RichText => [
    { type: "paragraph", spans: [{ text: Array.from({ length: words }, () => "word").join(" ") }] },
  ];

  it("returns null when there is nothing to read", () => {
    expect(readingTimeMinutes(undefined)).toBeNull();
    expect(readingTimeMinutes([])).toBeNull();
    expect(readingTimeMinutes([{ type: "paragraph", spans: [{ text: "   " }] }])).toBeNull();
  });

  it("never rounds a short article down to zero minutes", () => {
    expect(readingTimeMinutes(paragraph(5))).toBe(1);
    expect(readingTimeMinutes(paragraph(110))).toBe(1);
  });

  it("rounds to the nearest minute at 220 words per minute", () => {
    expect(readingTimeMinutes(paragraph(440))).toBe(2);
    expect(readingTimeMinutes(paragraph(660))).toBe(3);
  });
});

describe("toPostSummary", () => {
  const base: Post = {
    id: "post-1",
    publicationStatus: "published",
    editorialApprovalStatus: "approved",
    title: "A fixture post",
    slug: "a-fixture-post",
    type: "article",
    target: "internal",
    publishedAt: "2026-06-01",
    excerpt: "Fixture excerpt.",
    body: [{ type: "paragraph", spans: [{ text: "One two three four five." }] }],
    authors: [],
    companies: [],
    featured: false,
  };

  it("routes an internal post to /insights/[slug] with a reading time", () => {
    const summary = toPostSummary(base);

    expect(summary.href).toBe("/insights/a-fixture-post");
    expect(summary.isExternal).toBe(false);
    expect(summary.readingTimeMinutes).toBe(1);
  });

  it("routes an external post straight out, with no reading time", () => {
    const summary = toPostSummary({
      ...base,
      target: "external",
      externalUrl: "https://example.org/an-article",
    });

    expect(summary.href).toBe("https://example.org/an-article");
    expect(summary.isExternal).toBe(true);
    expect(summary.readingTimeMinutes).toBeNull();
  });
});

/* --------------------------------------------------------- Related posts */

describe("getRelatedPosts (fixture dataset)", () => {
  /**
   * Both switches are required before the local adapter serves fixtures, and
   * the adapter itself is memoised, so the cached instance is dropped on either
   * side of the swap. `vitest.config.ts` sets `unstubEnvs`, which restores the
   * environment after every test.
   */
  function enableFixtures() {
    vi.stubEnv("FOUNDRY_CONTENT_FIXTURE", "e2e");
    vi.stubEnv("FOUNDRY_ALLOW_FIXTURES", "1");
    __setAdapterForTests(null);
    expect(isFixtureModeEnabled()).toBe(true);
  }

  async function fixturePosts(): Promise<Map<string, Post>> {
    const posts = await rawContent.posts();
    return new Map(posts.map((post) => [post.id, post]));
  }

  it("prefers manually curated posts over automatic candidates", async () => {
    enableFixtures();
    const posts = await fixturePosts();
    const subject = posts.get("fixture-post-internal");
    expect(subject).toBeDefined();

    const curated: Post = {
      ...(subject as Post),
      relatedPosts: [{ id: "fixture-post-second-internal", title: "A second fixture article" }],
    };

    const related = await getRelatedPosts(curated, PRODUCTION_POLICY);

    // Manual first, then the shared-company candidates newest first — without
    // the manual entry the newer external post would have led.
    expect(related.map((post) => post.id)).toEqual([
      "fixture-post-second-internal",
      "fixture-post-external",
    ]);
  });

  it("falls back to shared companies, newest first, excluding the current post", async () => {
    enableFixtures();
    const posts = await fixturePosts();
    const subject = posts.get("fixture-post-internal") as Post;

    const related = await getRelatedPosts(subject, PRODUCTION_POLICY);

    expect(related.map((post) => post.id)).toEqual([
      "fixture-post-external",
      "fixture-post-second-internal",
    ]);
    expect(related.map((post) => post.id)).not.toContain(subject.id);
  });

  it("falls back to shared authors when no company is shared", async () => {
    enableFixtures();
    const posts = await fixturePosts();
    const subject: Post = { ...(posts.get("fixture-post-internal") as Post), companies: [] };

    const related = await getRelatedPosts(subject, PRODUCTION_POLICY);

    // Only the other post by the same author qualifies; the external news item
    // has no authors and no longer shares a company.
    expect(related.map((post) => post.id)).toEqual(["fixture-post-second-internal"]);
  });

  it("never repeats a candidate and never exceeds the limit", async () => {
    enableFixtures();
    const posts = await fixturePosts();
    const subject = posts.get("fixture-post-internal") as Post;

    const related = await getRelatedPosts(subject, PRODUCTION_POLICY, 1);

    expect(related).toHaveLength(1);
    expect(new Set(related.map((post) => post.id)).size).toBe(related.length);
  });

  it("never surfaces an unpublished fixture post", async () => {
    enableFixtures();
    const posts = await fixturePosts();
    const subject = posts.get("fixture-post-internal") as Post;

    const related = await getRelatedPosts(subject, PRODUCTION_POLICY);

    expect(related.map((post) => post.id)).not.toContain("fixture-post-draft");
  });

  it("returns nothing once the fixture switches are gone", async () => {
    // Guard against the switches leaking: with the real seed there are no posts
    // at all, so the related-content section is hidden entirely.
    expect(isFixtureModeEnabled()).toBe(false);
    const subject: Post = {
      id: "detached",
      publicationStatus: "published",
      editorialApprovalStatus: "approved",
      title: "Detached",
      slug: "detached",
      type: "article",
      target: "internal",
      publishedAt: "2026-06-01",
      excerpt: "",
      body: [{ type: "paragraph", spans: [{ text: "x" }] }],
      authors: [],
      companies: [],
      featured: false,
    };

    expect(await getRelatedPosts(subject, PRODUCTION_POLICY)).toEqual([]);
  });
});
