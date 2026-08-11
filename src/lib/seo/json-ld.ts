/**
 * JSON-LD builders (§21.3).
 *
 * Only properties we can actually substantiate are emitted. Empty `address`
 * and `openingHours` objects — a defect on the current site — are impossible
 * here because every optional branch is omitted rather than emitted empty.
 * No invented legal or investment properties.
 */

import type { CompanySummary, PostDetailView, SiteSettings, TeamMember } from "@/content/types";
import { absoluteUrl } from "./metadata";

export type JsonLdObject = Record<string, unknown>;

function compact(input: JsonLdObject): JsonLdObject {
  const output: JsonLdObject = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

export function organizationJsonLd(settings: SiteSettings, logoUrl?: string): JsonLdObject {
  const origin = settings.canonicalOrigin;
  const address = settings.address
    ? compact({
        "@type": "PostalAddress",
        streetAddress: settings.address.streetAddress,
        postalCode: settings.address.postalCode,
        addressLocality: settings.address.addressLocality,
        addressCountry: settings.address.addressCountry,
      })
    : undefined;

  const contactPoint = settings.contactEmail
    ? compact({
        "@type": "ContactPoint",
        contactType: "business enquiries",
        email: settings.contactEmail,
        telephone: settings.contactPhone,
      })
    : undefined;

  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.seoBrandName,
    legalName: settings.legalName,
    url: origin,
    logo: logoUrl ? absoluteUrl(origin, logoUrl) : undefined,
    description: settings.defaultSeoDescription,
    address: address && Object.keys(address).length > 1 ? address : undefined,
    contactPoint,
    sameAs: settings.socialLinks.map((link) => link.url),
  });
}

export function webSiteJsonLd(settings: SiteSettings): JsonLdObject {
  return compact({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.seoBrandName,
    url: settings.canonicalOrigin,
    inLanguage: "en",
  });
}

export function breadcrumbJsonLd(
  settings: SiteSettings,
  items: Array<{ name: string; path: string }>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(settings.canonicalOrigin, item.path),
    })),
  };
}

export function articleJsonLd(settings: SiteSettings, view: PostDetailView): JsonLdObject {
  const { post, summary, authors } = view;
  return compact({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "en",
    mainEntityOfPage: absoluteUrl(settings.canonicalOrigin, `/insights/${post.slug}`),
    image: summary.heroImage
      ? absoluteUrl(settings.canonicalOrigin, summary.heroImage.src)
      : undefined,
    author: authors.map((author) => ({
      "@type": "Person",
      name: author.name,
      url: absoluteUrl(settings.canonicalOrigin, `/team/${author.slug}`),
    })),
    publisher: {
      "@type": "Organization",
      name: settings.seoBrandName,
      url: settings.canonicalOrigin,
    },
  });
}

export function personJsonLd(settings: SiteSettings, member: TeamMember): JsonLdObject {
  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    jobTitle: member.role,
    url: absoluteUrl(settings.canonicalOrigin, `/team/${member.slug}`),
    email: member.email,
    sameAs: member.linkedinUrl ? [member.linkedinUrl] : undefined,
    worksFor: {
      "@type": "Organization",
      name: settings.seoBrandName,
      url: settings.canonicalOrigin,
    },
  });
}

/**
 * A portfolio company is a real organisation, so `Organization` is the honest
 * type. Nothing about the investment itself is asserted.
 */
export function portfolioCompanyJsonLd(
  settings: SiteSettings,
  company: CompanySummary,
): JsonLdObject {
  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.externalHref ?? undefined,
    description: company.tagline ?? undefined,
    logo: company.logo ? absoluteUrl(settings.canonicalOrigin, company.logo.src) : undefined,
  });
}
