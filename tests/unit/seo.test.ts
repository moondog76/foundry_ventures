/**
 * §26.1 — metadata and JSON-LD (§21.1, §21.3).
 *
 * Two defects on the current live site are the reason these tests exist:
 * metadata that quietly publishes unapproved CMS copy, and structured data that
 * emits empty `address` / `contactPoint` objects. Both are asserted against
 * here, using the real seeded site settings rather than an invented one.
 */

import { describe, expect, it } from "vitest";
import { getRawSiteSettings } from "@/content";
import { PREVIEW_POLICY, PRODUCTION_POLICY } from "@/content/policy";
import type { SeoFields, SiteSettings } from "@/content/types";
import { absoluteUrl, buildMetadata, composeTitle } from "@/lib/seo/metadata";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
  personJsonLd,
  portfolioCompanyJsonLd,
  webSiteJsonLd,
} from "@/lib/seo/json-ld";

const settings: SiteSettings = await getRawSiteSettings();
const ORIGIN = settings.canonicalOrigin;

const FALLBACKS = {
  fallbackTitle: "Portfolio",
  fallbackDescription: settings.defaultSeoDescription,
};

const unapprovedSeo: SeoFields = {
  title: "An unapproved SEO title",
  description: "An unapproved SEO description",
  approvalStatus: "unapproved",
};

const approvedSeo: SeoFields = { ...unapprovedSeo, approvalStatus: "approved" };

describe("composeTitle", () => {
  it("appends the brand name to a page title", () => {
    expect(composeTitle("Portfolio", "Foundry Ventures")).toBe("Portfolio — Foundry Ventures");
  });

  it("does not double the brand name", () => {
    expect(composeTitle("Foundry Ventures", "Foundry Ventures")).toBe("Foundry Ventures");
    // The live wordmark and the SEO brand name differ only in casing.
    expect(composeTitle("foundry ventures", "Foundry Ventures")).toBe("Foundry Ventures");
    expect(composeTitle("  Foundry Ventures  ", "Foundry Ventures")).toBe("Foundry Ventures");
  });

  it("falls back to the brand name for an empty title", () => {
    expect(composeTitle("", "Foundry Ventures")).toBe("Foundry Ventures");
    expect(composeTitle("   ", "Foundry Ventures")).toBe("Foundry Ventures");
  });
});

describe("absoluteUrl", () => {
  it("resolves a route path against the canonical origin", () => {
    expect(absoluteUrl(ORIGIN, "/portfolio")).toBe(`${ORIGIN}/portfolio`);
    expect(absoluteUrl(ORIGIN, "portfolio")).toBe(`${ORIGIN}/portfolio`);
    expect(absoluteUrl(ORIGIN, "/")).toBe(`${ORIGIN}/`);
  });
});

describe("buildMetadata", () => {
  it("ignores an unapproved SEO title in production and uses the derived fallback", () => {
    const metadata = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio",
      seo: unapprovedSeo,
      ...FALLBACKS,
    });

    expect(metadata.title).toBe(`Portfolio — ${settings.seoBrandName}`);
    expect(metadata.description).toBe(settings.defaultSeoDescription);
  });

  it("uses an approved SEO title in production", () => {
    const metadata = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio",
      seo: approvedSeo,
      ...FALLBACKS,
    });

    expect(metadata.title).toBe(`An unapproved SEO title — ${settings.seoBrandName}`);
    expect(metadata.description).toBe("An unapproved SEO description");
  });

  it("uses an unapproved SEO title in preview, so an editor sees their draft", () => {
    const metadata = buildMetadata({
      settings,
      policy: PREVIEW_POLICY,
      path: "/portfolio",
      seo: unapprovedSeo,
      ...FALLBACKS,
    });

    expect(metadata.title).toBe(`An unapproved SEO title — ${settings.seoBrandName}`);
  });

  it("emits an absolute canonical on the canonical origin", () => {
    const metadata = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio/empley",
      ...FALLBACKS,
    });

    const canonical = metadata.alternates?.canonical;
    expect(canonical).toBe(`${ORIGIN}/portfolio/empley`);
    expect(String(canonical).startsWith("https://")).toBe(true);
    expect(new URL(String(canonical)).origin).toBe(new URL(ORIGIN).origin);
    // Canonical, OG URL and metadataBase all agree on that one origin.
    expect(metadata.openGraph?.url).toBe(canonical);
    expect(String(metadata.metadataBase)).toBe(`${ORIGIN}/`);
  });

  it("honours an explicit canonical override", () => {
    const metadata = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/insights/a-syndicated-post",
      seo: { canonicalOverride: "https://example.org/original" },
      ...FALLBACKS,
    });

    expect(metadata.alternates?.canonical).toBe("https://example.org/original");
  });

  it("is always noindex in preview", () => {
    const metadata = buildMetadata({
      settings,
      policy: PREVIEW_POLICY,
      path: "/portfolio",
      ...FALLBACKS,
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("indexes a normal production route and honours a route-level noindex", () => {
    const indexed = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio",
      ...FALLBACKS,
    });
    expect(indexed.robots).toMatchObject({ index: true, follow: true });

    const hidden = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio",
      noIndex: true,
      ...FALLBACKS,
    });
    expect(hidden.robots).toMatchObject({ index: false, follow: false });

    const recordNoIndex = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/portfolio",
      seo: { noIndex: true },
      ...FALLBACKS,
    });
    expect(recordNoIndex.robots).toMatchObject({ index: false, follow: false });
  });

  it("gives the OG and Twitter cards an absolute image on the same origin", () => {
    const metadata = buildMetadata({
      settings,
      policy: PRODUCTION_POLICY,
      path: "/",
      ...FALLBACKS,
    });

    const image = metadata.openGraph?.images;
    expect(Array.isArray(image)).toBe(true);
    const first = Array.isArray(image) ? image[0] : undefined;
    expect(first).toMatchObject({ url: `${ORIGIN}/opengraph-image`, width: 1200, height: 630 });
  });
});

/* -------------------------------------------------------------- JSON-LD */

describe("organizationJsonLd", () => {
  it("emits no address and no contactPoint when neither is published", async () => {
    // The seeded settings deliberately carry neither: no address and no general
    // inbox were observed, and neither may be invented.
    expect(settings.address).toBeUndefined();
    expect(settings.contactEmail).toBeUndefined();

    const json = organizationJsonLd(settings);

    expect(json).not.toHaveProperty("address");
    expect(json).not.toHaveProperty("contactPoint");
    expect(json["@type"]).toBe("Organization");
    expect(json.url).toBe(ORIGIN);
  });

  it("never emits an address object that carries only its own @type", () => {
    const withEmptyAddress: SiteSettings = { ...settings, address: {} };
    expect(organizationJsonLd(withEmptyAddress)).not.toHaveProperty("address");

    const withUndefinedFields: SiteSettings = {
      ...settings,
      address: {
        streetAddress: undefined,
        postalCode: undefined,
        addressLocality: undefined,
        addressCountry: undefined,
      },
    };
    expect(organizationJsonLd(withUndefinedFields)).not.toHaveProperty("address");
  });

  it("emits an address once at least one real field exists", () => {
    const withAddress: SiteSettings = {
      ...settings,
      address: { addressLocality: "Stockholm", addressCountry: "SE" },
    };

    expect(organizationJsonLd(withAddress).address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    });
  });

  it("emits a contactPoint without an empty telephone key", () => {
    const withEmail: SiteSettings = { ...settings, contactEmail: "hello@example.com" };
    const contactPoint = organizationJsonLd(withEmail).contactPoint as Record<string, unknown>;

    expect(contactPoint).toEqual({
      "@type": "ContactPoint",
      contactType: "business enquiries",
      email: "hello@example.com",
    });
    expect(contactPoint).not.toHaveProperty("telephone");
  });

  it("omits empty arrays rather than emitting them", () => {
    const withoutSocial: SiteSettings = { ...settings, socialLinks: [] };
    expect(organizationJsonLd(withoutSocial)).not.toHaveProperty("sameAs");
    expect(organizationJsonLd(settings).sameAs).toEqual(settings.socialLinks.map((l) => l.url));
  });

  it("omits the logo when none is passed", () => {
    expect(organizationJsonLd(settings)).not.toHaveProperty("logo");
    expect(organizationJsonLd(settings, "/brand/logo.svg").logo).toBe(`${ORIGIN}/brand/logo.svg`);
  });
});

describe("webSiteJsonLd", () => {
  it("describes the site on the canonical origin", () => {
    expect(webSiteJsonLd(settings)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.seoBrandName,
      url: ORIGIN,
      inLanguage: "en",
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 and makes every item absolute", () => {
    const json = breadcrumbJsonLd(settings, [
      { name: "Home", path: "/" },
      { name: "Portfolio", path: "/portfolio" },
      { name: "Empley", path: "/portfolio/empley" },
    ]);

    expect(json.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Portfolio", item: `${ORIGIN}/portfolio` },
      { "@type": "ListItem", position: 3, name: "Empley", item: `${ORIGIN}/portfolio/empley` },
    ]);
  });

  it("produces an empty list rather than a fabricated trail", () => {
    expect(breadcrumbJsonLd(settings, []).itemListElement).toEqual([]);
  });
});

describe("entity JSON-LD", () => {
  it("omits every unsubstantiated property on a person", () => {
    const json = personJsonLd(settings, {
      id: "m1",
      name: "Fixture Person",
      slug: "fixture-person",
      role: "Fixture role",
      publicationStatus: "published",
      verificationStatus: "verified",
      fieldEvidence: {},
      active: true,
      sortOrder: 10,
    });

    expect(json).not.toHaveProperty("email");
    expect(json).not.toHaveProperty("sameAs");
    expect(json.url).toBe(`${ORIGIN}/team/fixture-person`);
  });

  it("omits an absent company website, tagline and logo", () => {
    const json = portfolioCompanyJsonLd(settings, {
      id: "c1",
      slug: "testcorp-fixture",
      name: "Testcorp Fixture",
      href: null,
      externalHref: null,
      logo: null,
      logoAlt: "Testcorp Fixture logo",
      logoFit: "contain",
      logoSurface: "dark" as const,
      opticalScale: 1,
      cardImage: null,
      tagline: null,
      stages: [],
      sectors: [],
      focuses: [],
      status: null,
      founders: [],
      featured: false,
      sortOrder: 10,
    });

    expect(json).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Testcorp Fixture",
    });
  });

  it("emits an article with absolute author URLs and no empty image", () => {
    const post = {
      id: "p1",
      publicationStatus: "published" as const,
      editorialApprovalStatus: "approved" as const,
      title: "A fixture article",
      slug: "a-fixture-article",
      type: "article" as const,
      target: "internal" as const,
      publishedAt: "2026-06-01",
      excerpt: "Fixture excerpt.",
      body: [{ type: "paragraph" as const, spans: [{ text: "Body." }] }],
      authors: [],
      companies: [],
      featured: false,
    };

    const json = articleJsonLd(settings, {
      post,
      summary: {
        id: post.id,
        title: post.title,
        type: post.type,
        href: `/insights/${post.slug}`,
        isExternal: false,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        heroImage: null,
        authors: [],
        companies: [],
        readingTimeMinutes: 1,
      },
      authors: [],
      companies: [],
      related: [],
    });

    expect(json.mainEntityOfPage).toBe(`${ORIGIN}/insights/a-fixture-article`);
    expect(json).not.toHaveProperty("image");
    // An empty author array is omitted rather than published as `author: []`.
    expect(json).not.toHaveProperty("author");
    expect(json.datePublished).toBe("2026-06-01");
  });
});
