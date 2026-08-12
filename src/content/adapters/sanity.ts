/**
 * Sanity content adapter.
 *
 * Spec §4.2: returns exactly the same normalised domain types as the local
 * adapter, so no component can tell which one is active. It activates only when
 * a project id and dataset are configured; otherwise `src/content/index.ts`
 * falls back to the local seed adapter (§30).
 *
 * All credentials are server-only environment variables (§23) — nothing here is
 * exposed through `NEXT_PUBLIC_*`.
 */

import { createClient, type SanityClient } from "@sanity/client";
import type { ContentAdapter } from "./types";
import type {
  Company,
  HomePage,
  LegalPage,
  SiteSettings,
  TeamMember,
} from "../types";

export type SanityConfig = {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn: boolean;
};

export function readSanityConfig(): SanityConfig | null {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  if (!projectId || !dataset) return null;
  return {
    projectId,
    dataset,
    apiVersion: process.env.SANITY_API_VERSION ?? "2024-10-01",
    token: process.env.SANITY_READ_TOKEN,
    // Drafts require a token and must bypass the CDN to stay fresh (§6.4).
    useCdn: !process.env.SANITY_READ_TOKEN,
  };
}

const IMAGE_PROJECTION = `{
  "id": coalesce(asset->_id, _key, "image"),
  "src": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "blurDataUrl": asset->metadata.lqip,
  rightsStatus,
  rightsOwner,
  sourceUrl,
  checksumSha256,
  alt,
  caption,
  "hotspot": hotspot{ x, y },
  "available": defined(asset->url),
  isPlaceholder
}`;

const EVIDENCE_PROJECTION = `{ status, sources[]{ label, url, observedAt, note }, lastCheckedAt, approvedAt, approvedBy, note }`;

const EDITORIAL_TEXT_PROJECTION = `{ value, origin, approvalStatus, sourceUrl, observedAt, approvedAt, approvedBy, normalizationNote }`;

const TAXONOMY_PROJECTION = `{ "slug": slug.current, title, group }`;

const COMPANY_PROJECTION = `{
  "id": _id,
  name,
  "slug": slug.current,
  publicationStatus,
  verificationStatus,
  dataCompleteness,
  "fieldEvidence": fieldEvidence,
  "logo": logo${IMAGE_PROJECTION},
  logoAlt,
  logoFit,
  opticalScale,
  "cardImage": cardImage${IMAGE_PROJECTION},
  "heroImage": heroImage${IMAGE_PROJECTION},
  tagline,
  shortDescription,
  body,
  "stages": stages[]->${TAXONOMY_PROJECTION},
  status,
  "focuses": focuses[]->${TAXONOMY_PROJECTION},
  "sectors": sectors[]->${TAXONOMY_PROJECTION},
  founders[]{ name, role, linkedinUrl, "image": image${IMAGE_PROJECTION} },
  websiteUrl,
  linkedinUrl,
  careersUrl,
  headquarters,
  investmentYear,
  "dealLead": dealLead->{ "id": _id, "slug": slug.current, name },
  whyWeInvested,
  founderQuote,
  featured,
  sortOrder,
  seo
}`;

const TEAM_PROJECTION = `{
  "id": _id,
  name,
  "slug": slug.current,
  role,
  "portrait": portrait${IMAGE_PROJECTION},
  publicationStatus,
  verificationStatus,
  fieldEvidence,
  shortBio,
  longBio,
  expertise,
  email,
  phone,
  linkedinUrl,
  active,
  sortOrder,
  seo
}`;

const POST_PROJECTION = `{
  "id": _id,
  publicationStatus,
  editorialApprovalStatus,
  title,
  "slug": slug.current,
  type,
  target,
  externalUrl,
  publishedAt,
  updatedAt,
  "heroImage": heroImage${IMAGE_PROJECTION},
  excerpt,
  body,
  "authors": authors[]->{ "id": _id, "slug": slug.current, name },
  "companies": companies[]->{ "id": _id, "slug": slug.current, name },
  "relatedPosts": relatedPosts[]->{ "id": _id, "slug": slug.current, title },
  featured,
  sortOrder,
  seo
}`;

export const SANITY_QUERIES = {
  siteSettings: `*[_type == "siteSettings"][0]{
    ...,
    "defaultOgImage": defaultOgImage${IMAGE_PROJECTION},
    "contactPeople": contactPeople[]->{ "id": _id, "slug": slug.current, name },
    "brandStatement": brandStatement${EDITORIAL_TEXT_PROJECTION},
    "investmentCriteria": investmentCriteria[]{ label, value, editorialNote, sortOrder, "evidence": evidence${EVIDENCE_PROJECTION} }
  }`,
  homePage: `*[_type == "homePage"][0]`,
  aboutPage: `*[_type == "aboutPage"][0]`,
  companies: `*[_type == "company"] | order(sortOrder asc, name asc) ${COMPANY_PROJECTION}`,
  teamMembers: `*[_type == "teamMember"] | order(sortOrder asc, name asc) ${TEAM_PROJECTION}`,
  posts: `*[_type == "post"] | order(publishedAt desc) ${POST_PROJECTION}`,
  testimonials: `*[_type == "testimonial"] | order(sortOrder asc) {
    "id": _id, publicationStatus, consentStatus, quote, personName, personTitle,
    "company": company->{ "id": _id, "slug": slug.current, name },
    "image": image${IMAGE_PROJECTION},
    featured, sortOrder, fieldEvidence
  }`,
  networkPeople: `*[_type == "networkPerson"] | order(sortOrder asc, name asc) {
    "id": _id, name, "slug": slug.current, publicationStatus, verificationStatus, fieldEvidence,
    group, "image": image${IMAGE_PROJECTION}, roleLine, linkedinUrl,
    "verticals": verticals[]->${TAXONOMY_PROJECTION},
    "expertise": expertise[]->${TAXONOMY_PROJECTION},
    featured, sortOrder
  }`,
  legalPages: `*[_type == "legalPage"]{ "slug": slug.current, title, lastUpdated, body, seo }`,
} as const;

function createSanityClient(config: SanityConfig): SanityClient {
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    token: config.token,
    useCdn: config.useCdn,
    perspective: config.token ? "drafts" : "published",
  });
}

export function createSanityAdapter(config: SanityConfig): ContentAdapter {
  const client = createSanityClient(config);
  const fetchOne = async <T>(query: string): Promise<T | null> =>
    (await client.fetch<T | null>(query)) ?? null;
  const fetchMany = async <T>(query: string): Promise<T[]> =>
    (await client.fetch<T[] | null>(query)) ?? [];

  return {
    name: "sanity",
    async getSiteSettings() {
      const result = await fetchOne<SiteSettings>(SANITY_QUERIES.siteSettings);
      if (!result) throw new Error("Sanity: no siteSettings document found");
      return result;
    },
    async getHomePage() {
      const result = await fetchOne<HomePage>(SANITY_QUERIES.homePage);
      if (!result) throw new Error("Sanity: no homePage document found");
      return result;
    },
    async getFundPage() {
      // No Sanity document type exists for the fund page yet; the seed is
      // the source of truth until one is modelled.
      const { SEED_FUND_PAGE } = await import('../seed/fund');
      return SEED_FUND_PAGE;
    },
    getCompanies: () => fetchMany<Company>(SANITY_QUERIES.companies),
    getTeamMembers: () => fetchMany<TeamMember>(SANITY_QUERIES.teamMembers),
    getLegalPages: () => fetchMany<LegalPage>(SANITY_QUERIES.legalPages),
  };
}
