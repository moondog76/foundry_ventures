/**
 * §26.1 — the central publishing policy (§16.8).
 *
 * The one rule everything else derives from: a field is publishable in
 * production only when its own evidence is `owner-approved`. `observed` is what
 * a scrape of the live site produces and is explicitly not enough.
 *
 * The records below are synthetic test fixtures. They deliberately carry
 * obviously-fake names so nothing here can ever be mistaken for Foundry content.
 */

import { describe, expect, it } from "vitest";
import {
  PREVIEW_POLICY,
  PRODUCTION_POLICY,
  canIndex,
  canIndexCompany,
  canIndexPost,
  canIndexTeamMember,
  canListCompanyPublicly,
  canListNetworkPersonPublicly,
  canListPostPublicly,
  canListTeamMemberPublicly,
  canListTestimonialPublicly,
  canPublishCompanyDetail,
  canPublishCompanyField,
  canPublishPostDetail,
  canPublishTeamDetail,
  canRenderEditorialText,
  canRenderEvidence,
  canRenderImage,
  collectCompanyBlocks,
  collectTeamMemberBlocks,
  isOwnerApproved,
  resolveCompanyHref,
} from "@/content/policy";
import type {
  Company,
  EditorialText,
  FieldEvidence,
  ImageAsset,
  NetworkPerson,
  Post,
  RichText,
  TeamMember,
  Testimonial,
} from "@/content/types";

/* ------------------------------------------------------------- Fixtures */

const APPROVED: FieldEvidence = {
  status: "owner-approved",
  sources: [{ label: "Unit-test fixture", observedAt: "2026-08-10" }],
  approvedBy: "unit-test",
  approvedAt: "2026-08-10",
};

const OBSERVED: FieldEvidence = {
  status: "observed",
  sources: [{ label: "Unit-test fixture", observedAt: "2026-08-10" }],
};

const UNVERIFIED: FieldEvidence = { status: "unverified", sources: [] };

const BODY: RichText = [{ type: "paragraph", spans: [{ text: "Fixture body copy." }] }];

const COMPANY_FIELDS = [
  "name",
  "logo",
  "websiteUrl",
  "tagline",
  "shortDescription",
  "body",
  "stages",
  "sectors",
  "focuses",
  "status",
  "founders",
] as const;

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "test-company",
    name: "Testcorp Fixture",
    slug: "testcorp-fixture",
    publicationStatus: "published",
    verificationStatus: "verified",
    dataCompleteness: { coreIdentity: true, editorial: true, relations: true, seo: true },
    fieldEvidence: Object.fromEntries(COMPANY_FIELDS.map((field) => [field, APPROVED])),
    tagline: "A synthetic record used only by the unit tests.",
    shortDescription: "A synthetic record used only by the unit tests.",
    body: BODY,
    websiteUrl: "https://example.com/testcorp",
    status: "active",
    featured: false,
    sortOrder: 10,
    ...overrides,
  };
}

function makeTeamMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: "test-member",
    name: "Fixture Person",
    slug: "fixture-person",
    role: "Fixture role",
    publicationStatus: "published",
    verificationStatus: "verified",
    fieldEvidence: { name: APPROVED, role: APPROVED, longBio: APPROVED },
    longBio: BODY,
    active: true,
    sortOrder: 10,
    ...overrides,
  };
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "test-post",
    publicationStatus: "published",
    editorialApprovalStatus: "approved",
    title: "A fixture post",
    slug: "a-fixture-post",
    type: "article",
    target: "internal",
    publishedAt: "2026-06-01",
    excerpt: "Fixture excerpt.",
    body: BODY,
    authors: [],
    companies: [],
    featured: false,
    ...overrides,
  };
}

function makeTestimonial(overrides: Partial<Testimonial> = {}): Testimonial {
  return {
    id: "test-testimonial",
    publicationStatus: "published",
    consentStatus: "granted",
    quote: "A fixture quote.",
    personName: "Fixture Person",
    featured: false,
    sortOrder: 10,
    fieldEvidence: { quote: APPROVED, personName: APPROVED },
    ...overrides,
  };
}

function makeImage(overrides: Partial<ImageAsset> = {}): ImageAsset {
  return {
    id: "test-image",
    src: "/fixtures/test.png",
    width: 100,
    height: 100,
    rightsStatus: "approved",
    available: true,
    ...overrides,
  };
}

/* ------------------------------------------------------------- Evidence */

describe("evidence gating", () => {
  it("does not publish observed evidence in production, but does in preview", () => {
    expect(isOwnerApproved(OBSERVED)).toBe(false);
    expect(canRenderEvidence(OBSERVED, PRODUCTION_POLICY)).toBe(false);
    expect(canRenderEvidence(OBSERVED, PREVIEW_POLICY)).toBe(true);
  });

  it("publishes owner-approved evidence in both modes", () => {
    expect(isOwnerApproved(APPROVED)).toBe(true);
    expect(canRenderEvidence(APPROVED, PRODUCTION_POLICY)).toBe(true);
    expect(canRenderEvidence(APPROVED, PREVIEW_POLICY)).toBe(true);
  });

  it("treats missing and unverified evidence as unpublishable in production", () => {
    expect(canRenderEvidence(undefined, PRODUCTION_POLICY)).toBe(false);
    expect(canRenderEvidence(UNVERIFIED, PRODUCTION_POLICY)).toBe(false);
    expect(isOwnerApproved(undefined)).toBe(false);
  });
});

describe("canRenderEditorialText", () => {
  const approved: EditorialText = {
    value: "Approved copy.",
    origin: "proposed",
    approvalStatus: "approved",
  };
  const unapproved: EditorialText = { ...approved, approvalStatus: "unapproved" };

  it("requires approval in production and allows anything in preview", () => {
    expect(canRenderEditorialText(approved, PRODUCTION_POLICY)).toBe(true);
    expect(canRenderEditorialText(unapproved, PRODUCTION_POLICY)).toBe(false);
    expect(canRenderEditorialText(unapproved, PREVIEW_POLICY)).toBe(true);
  });

  it("never renders an absent or blank string, even in preview", () => {
    expect(canRenderEditorialText(undefined, PREVIEW_POLICY)).toBe(false);
    expect(canRenderEditorialText({ ...approved, value: "   " }, PREVIEW_POLICY)).toBe(false);
  });
});

describe("canRenderImage", () => {
  it("rejects an unavailable binary even when the rights are approved", () => {
    const exportReference = makeImage({ rightsStatus: "approved", available: false });

    // An export reference points at the live CDN; hotlinking it is out of scope,
    // so the typographic fallback is the only correct outcome — in both modes.
    expect(canRenderImage(exportReference, PRODUCTION_POLICY)).toBe(false);
    expect(canRenderImage(exportReference, PREVIEW_POLICY)).toBe(false);
  });

  it("requires cleared rights in production but not in preview", () => {
    const unverified = makeImage({ rightsStatus: "unverified" });

    expect(canRenderImage(unverified, PRODUCTION_POLICY)).toBe(false);
    expect(canRenderImage(unverified, PREVIEW_POLICY)).toBe(true);
    expect(canRenderImage(makeImage(), PRODUCTION_POLICY)).toBe(true);
  });

  it("rejects a missing image", () => {
    expect(canRenderImage(null, PREVIEW_POLICY)).toBe(false);
    expect(canRenderImage(undefined, PREVIEW_POLICY)).toBe(false);
  });
});

/* -------------------------------------------------------------- Company */

describe("canPublishCompanyDetail", () => {
  it("publishes a company with core identity, editorial fields and real body content", () => {
    expect(canPublishCompanyDetail(makeCompany(), PRODUCTION_POLICY)).toBe(true);
  });

  it("requires every core identity field", () => {
    for (const field of ["name", "logo", "websiteUrl"] as const) {
      const company = makeCompany({
        fieldEvidence: {
          ...makeCompany().fieldEvidence,
          [field]: OBSERVED,
        },
      });
      expect(canPublishCompanyDetail(company, PRODUCTION_POLICY)).toBe(false);
    }
  });

  it("requires every editorial field the detail template renders as a claim", () => {
    for (const field of ["shortDescription", "body"] as const) {
      const company = makeCompany({
        fieldEvidence: { ...makeCompany().fieldEvidence, [field]: OBSERVED },
      });
      expect(canPublishCompanyDetail(company, PRODUCTION_POLICY)).toBe(false);
    }
  });

  it("requires actual body content, not just approval of an empty field", () => {
    expect(canPublishCompanyDetail(makeCompany({ body: [] }), PRODUCTION_POLICY)).toBe(false);
    expect(canPublishCompanyDetail(makeCompany({ body: undefined }), PRODUCTION_POLICY)).toBe(
      false,
    );
    expect(
      canPublishCompanyDetail(makeCompany({ shortDescription: "   " }), PRODUCTION_POLICY),
    ).toBe(false);
  });

  it("requires the record to be published", () => {
    expect(
      canPublishCompanyDetail(makeCompany({ publicationStatus: "review" }), PRODUCTION_POLICY),
    ).toBe(false);
  });

  it("shows everything in preview so an editor can review it", () => {
    const bare = makeCompany({
      publicationStatus: "draft",
      body: undefined,
      shortDescription: undefined,
      fieldEvidence: { name: UNVERIFIED },
    });
    expect(canPublishCompanyDetail(bare, PREVIEW_POLICY)).toBe(true);
  });
});

describe("canListCompanyPublicly", () => {
  it("lists a published company whose name is approved", () => {
    expect(canListCompanyPublicly(makeCompany(), PRODUCTION_POLICY)).toBe(true);
  });

  it("lists a name-only record so it can degrade to the typographic fallback", () => {
    const sparse = makeCompany({
      fieldEvidence: { name: APPROVED, logo: OBSERVED, websiteUrl: OBSERVED },
      body: undefined,
      shortDescription: undefined,
    });

    expect(canListCompanyPublicly(sparse, PRODUCTION_POLICY)).toBe(true);
    expect(canPublishCompanyDetail(sparse, PRODUCTION_POLICY)).toBe(false);
  });

  it("never lists an inactive company publicly", () => {
    const inactive = makeCompany({ status: "inactive" });

    expect(canPublishCompanyField(inactive, "status", PRODUCTION_POLICY)).toBe(true);
    expect(canListCompanyPublicly(inactive, PRODUCTION_POLICY)).toBe(false);
    // Preview shows the internal state rather than hiding it.
    expect(canListCompanyPublicly(inactive, PREVIEW_POLICY)).toBe(true);
  });

  it("does not list an unpublished record or one whose name is only observed", () => {
    expect(
      canListCompanyPublicly(makeCompany({ publicationStatus: "review" }), PRODUCTION_POLICY),
    ).toBe(false);
    expect(
      canListCompanyPublicly(
        makeCompany({ fieldEvidence: { ...makeCompany().fieldEvidence, name: OBSERVED } }),
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
  });
});

describe("resolveCompanyHref", () => {
  it("prefers the internal detail route", () => {
    expect(resolveCompanyHref(makeCompany(), PRODUCTION_POLICY)).toEqual({
      href: "/portfolio/testcorp-fixture",
      externalHref: null,
    });
  });

  it("falls back to the verified external site when no detail route exists", () => {
    const sparse = makeCompany({
      body: undefined,
      fieldEvidence: { name: APPROVED, logo: APPROVED, websiteUrl: APPROVED },
    });

    expect(resolveCompanyHref(sparse, PRODUCTION_POLICY)).toEqual({
      href: null,
      externalHref: "https://example.com/testcorp",
    });
  });

  it("returns neither destination when the website is not approved", () => {
    const nowhere = makeCompany({
      body: undefined,
      fieldEvidence: { name: APPROVED, logo: APPROVED, websiteUrl: OBSERVED },
    });

    expect(resolveCompanyHref(nowhere, PRODUCTION_POLICY)).toEqual({
      href: null,
      externalHref: null,
    });
  });
});

describe("canIndexCompany", () => {
  it("is false in preview, whatever the record looks like", () => {
    expect(canIndexCompany(makeCompany(), PREVIEW_POLICY)).toBe(false);
  });

  it("honours an explicit noIndex", () => {
    expect(canIndexCompany(makeCompany(), PRODUCTION_POLICY)).toBe(true);
    expect(canIndexCompany(makeCompany({ seo: { noIndex: true } }), PRODUCTION_POLICY)).toBe(false);
  });
});

/* ----------------------------------------------------------- TeamMember */

describe("team member policy", () => {
  it("hides an inactive member and one that is not published", () => {
    expect(canListTeamMemberPublicly(makeTeamMember({ active: false }), PRODUCTION_POLICY)).toBe(
      false,
    );
    expect(
      canListTeamMemberPublicly(makeTeamMember({ publicationStatus: "draft" }), PRODUCTION_POLICY),
    ).toBe(false);
  });

  it("refuses a thin profile page without an approved long bio", () => {
    expect(canPublishTeamDetail(makeTeamMember(), PRODUCTION_POLICY)).toBe(true);
    expect(canPublishTeamDetail(makeTeamMember({ longBio: undefined }), PRODUCTION_POLICY)).toBe(
      false,
    );
    expect(
      canPublishTeamDetail(
        makeTeamMember({ fieldEvidence: { name: APPROVED, role: APPROVED, longBio: OBSERVED } }),
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
  });

  it("never indexes a profile in preview", () => {
    expect(canIndexTeamMember(makeTeamMember(), PREVIEW_POLICY)).toBe(false);
    expect(canIndexTeamMember(makeTeamMember(), PRODUCTION_POLICY)).toBe(true);
  });
});

/* ------------------------------------------------------------------ Post */

describe("post policy", () => {
  it("never gives an external post a detail route, in either mode", () => {
    const external = makePost({
      target: "external",
      externalUrl: "https://example.org/an-article",
      slug: undefined,
      body: undefined,
    });

    expect(canListPostPublicly(external, PRODUCTION_POLICY)).toBe(true);
    expect(canPublishPostDetail(external, PRODUCTION_POLICY)).toBe(false);
    expect(canPublishPostDetail(external, PREVIEW_POLICY)).toBe(false);
    expect(canIndexPost(external, PRODUCTION_POLICY)).toBe(false);
  });

  it("requires an external post to actually have a URL", () => {
    expect(
      canListPostPublicly(
        makePost({ target: "external", externalUrl: undefined }),
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
  });

  it("requires publication, editorial approval, a date and real body content", () => {
    expect(canListPostPublicly(makePost(), PRODUCTION_POLICY)).toBe(true);
    expect(canListPostPublicly(makePost({ publicationStatus: "draft" }), PRODUCTION_POLICY)).toBe(
      false,
    );
    expect(
      canListPostPublicly(makePost({ editorialApprovalStatus: "unapproved" }), PRODUCTION_POLICY),
    ).toBe(false);
    expect(canListPostPublicly(makePost({ publishedAt: undefined }), PRODUCTION_POLICY)).toBe(
      false,
    );
    expect(canListPostPublicly(makePost({ body: [] }), PRODUCTION_POLICY)).toBe(false);
  });

  it("never indexes a post in preview", () => {
    expect(canIndexPost(makePost(), PREVIEW_POLICY)).toBe(false);
  });
});

/* ------------------------------------------------------------ Testimonial */

describe("testimonial policy", () => {
  it("excludes a revoked testimonial in both modes", () => {
    const revoked = makeTestimonial({ consentStatus: "revoked" });

    expect(canListTestimonialPublicly(revoked, PRODUCTION_POLICY)).toBe(false);
    // Consent withdrawal must take effect everywhere immediately, preview too.
    expect(canListTestimonialPublicly(revoked, PREVIEW_POLICY)).toBe(false);
  });

  it("requires granted consent and approved quote/name evidence in production", () => {
    expect(canListTestimonialPublicly(makeTestimonial(), PRODUCTION_POLICY)).toBe(true);
    expect(
      canListTestimonialPublicly(
        makeTestimonial({ consentStatus: "requested" }),
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
    expect(
      canListTestimonialPublicly(
        makeTestimonial({ fieldEvidence: { quote: OBSERVED, personName: APPROVED } }),
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
  });
});

/* ---------------------------------------------------------- NetworkPerson */

describe("network person policy", () => {
  const person: NetworkPerson = {
    id: "test-network-person",
    name: "Fixture Operator",
    slug: "fixture-operator",
    publicationStatus: "published",
    verificationStatus: "verified",
    fieldEvidence: { name: APPROVED, roleLine: APPROVED },
    group: "advisor",
    roleLine: "Fixture role line",
    verticals: [],
    expertise: [],
    featured: false,
    sortOrder: 10,
  };

  it("requires an approved name and role line", () => {
    expect(canListNetworkPersonPublicly(person, PRODUCTION_POLICY)).toBe(true);
    expect(
      canListNetworkPersonPublicly(
        { ...person, fieldEvidence: { name: APPROVED, roleLine: OBSERVED } },
        PRODUCTION_POLICY,
      ),
    ).toBe(false);
  });
});

/* ------------------------------------------------- Generic entry points */

describe("generic policy entry points", () => {
  it("dispatch to the same answer as the per-type functions", () => {
    const company = makeCompany();
    expect(canIndex({ kind: "company", record: company }, PRODUCTION_POLICY)).toBe(
      canIndexCompany(company, PRODUCTION_POLICY),
    );
    expect(canIndex({ kind: "testimonial", record: makeTestimonial() }, PRODUCTION_POLICY)).toBe(
      false,
    );
  });
});

/* ------------------------------------------------------- Integrity blocks */

describe("block collection", () => {
  it("names the exact field and evidence status that blocks a company", () => {
    const blocked = makeCompany({
      publicationStatus: "review",
      fieldEvidence: { name: OBSERVED, logo: APPROVED, websiteUrl: UNVERIFIED },
    });

    const blocks = collectCompanyBlocks(blocked);
    const fields = blocks.map((block) => block.field);

    expect(fields).toContain("publicationStatus");
    expect(fields).toContain("name");
    expect(fields).toContain("websiteUrl");
    expect(fields).not.toContain("logo");
    expect(blocks.every((block) => block.recordId === blocked.slug)).toBe(true);
    expect(blocks.find((block) => block.field === "name")?.reason).toContain("observed");
  });

  it("returns no blocks for a fully approved company", () => {
    expect(collectCompanyBlocks(makeCompany())).toEqual([]);
    expect(collectTeamMemberBlocks(makeTeamMember())).toEqual([]);
  });
});
