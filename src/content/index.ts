/**
 * The content API every route consumes (§4.2).
 *
 * Responsibilities that live here and nowhere else:
 *   - choosing the adapter (Sanity when configured, local seed otherwise);
 *   - applying the publishing policy from `policy.ts`;
 *   - resolving canonical relations in one direction only (§16.4.1);
 *   - shaping view models so components never re-derive publishing rules.
 */

import { cache } from "react";
import type { ContentAdapter } from "./adapters/types";
import { localAdapter } from "./adapters/local";
import { createSanityAdapter, readSanityConfig } from "./adapters/sanity";
import { resolvePolicyContext } from "./context";
import {
  PRODUCTION_POLICY,
  canListCompanyPublicly,
  canListTeamMemberPublicly,
  canPublishCompanyDetail,
  canPublishCompanyField,
  canPublishTeamField,
  canRenderEvidence,
  canRenderImage,
  isOwnerApproved,
  resolveCompanyHref,
  type PolicyContext,
} from "./policy";
import type {
  Company,
  CompanyDetailView,
  CompanySummary,
  FacetGroup,
  FeatureFlagKey,
  FundPage,
  HomePage,
  ImageAsset,
  InvestmentCriterion,
  LegalPage,
  NavItem,
  RichText,
  SiteSettings,
  TaxonomyRef,
  TeamMember,
} from "./types";
import type { FilterState } from "@/lib/filters/engine";
import { matchesFilters } from "@/lib/filters/engine";

/* --------------------------------------------------------------- Adapter */

let cachedAdapter: ContentAdapter | null = null;

export function getAdapter(): ContentAdapter {
  if (cachedAdapter) return cachedAdapter;
  const sanityConfig = readSanityConfig();
  cachedAdapter = sanityConfig ? createSanityAdapter(sanityConfig) : localAdapter;
  return cachedAdapter;
}

/** Test seam — lets unit tests swap in a stub adapter. */
export function __setAdapterForTests(adapter: ContentAdapter | null): void {
  cachedAdapter = adapter;
}

async function ctx(explicit?: PolicyContext): Promise<PolicyContext> {
  return explicit ?? (await resolvePolicyContext());
}

/* --------------------------------------------------------- Site settings */

/**
 * Navigation is filtered by feature flag here so a disabled route can never
 * render as dead navigation anywhere (§3.4, §6.1).
 */
function filterNav(items: NavItem[], settings: SiteSettings): NavItem[] {
  return items.filter((item) => !item.featureFlag || settings.featureFlags[item.featureFlag]);
}

export const getSiteSettings = cache(async (context?: PolicyContext): Promise<SiteSettings> => {
  const policy = await ctx(context);
  const settings = await getAdapter().getSiteSettings();
  return {
    ...settings,
    navigation: filterNav(settings.navigation, settings),
    footerNavigation: filterNav(settings.footerNavigation, settings),
    // Only criteria whose own evidence clears the policy may ever be rendered.
    investmentCriteria: settings.investmentCriteria
      .filter((criterion) => canRenderEvidence(criterion.evidence, policy))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
});

/** Unfiltered settings, for the CI content-integrity report. */
export async function getRawSiteSettings(): Promise<SiteSettings> {
  return getAdapter().getSiteSettings();
}

export async function getFeatureFlags(): Promise<SiteSettings["featureFlags"]> {
  return (await getAdapter().getSiteSettings()).featureFlags;
}

/**
 * Routes that only exist while their flag is on.
 *
 * Navigation is filtered by `filterNav`, but a call-to-action button is authored
 * content with its own `href`, so it needs the same check — otherwise turning a
 * section off leaves buttons pointing at a 404.
 */
const FLAGGED_ROUTES: ReadonlyArray<[string, FeatureFlagKey]> = [
  ["/portfolio", "portfolio"],
  ["/fund", "fund"],
];

/**
 * Whether a route is currently *presented* — in navigation, in the sitemap, and
 * as a destination for on-page links.
 *
 * Deliberately not the same question as whether it resolves. A hidden route
 * still returns 200, because "hide it for now" and "break every link anyone has
 * already shared" are different instructions and only one of them was given.
 * What hiding does remove is discoverability: no nav entry, no sitemap entry, no
 * link from another page, and `noindex` so a crawler that finds it anyway does
 * not list it.
 */
export async function isRoutePublished(href: string, context?: PolicyContext): Promise<boolean> {
  const policy = await ctx(context);
  if (policy.mode === "preview") return true;
  const settings = await getAdapter().getSiteSettings();
  const match = FLAGGED_ROUTES.find(
    ([prefix]) => href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}#`),
  );
  return match ? settings.featureFlags[match[1]] : true;
}

export async function getInvestmentCriteria(
  context?: PolicyContext,
): Promise<InvestmentCriterion[]> {
  const settings = await getSiteSettings(context);
  return settings.featureFlags.investmentCriteria ? settings.investmentCriteria : [];
}

/* ------------------------------------------------------------- Home page */

export const getFundPage = cache(async (): Promise<FundPage> => getAdapter().getFundPage());

export const getHomePage = cache(async (): Promise<HomePage> => getAdapter().getHomePage());


export const getLegalPage = cache(async (slug: string): Promise<LegalPage | null> => {
  const pages = await getAdapter().getLegalPages();
  return pages.find((page) => page.slug === slug) ?? null;
});

/* ------------------------------------------------------------- Companies */

function taxonomySlugs(refs: TaxonomyRef[] | undefined): string[] {
  return (refs ?? []).map((ref) => ref.slug);
}

/**
 * Turns a raw company into exactly what a card may render. Every optional field
 * passes its own evidence check, so a partially approved record degrades field
 * by field instead of disappearing (§16.2).
 */
export function toCompanySummary(company: Company, policy: PolicyContext): CompanySummary {
  const { href, externalHref } = resolveCompanyHref(company, policy);
  const logoOk =
    canPublishCompanyField(company, "logo", policy) && canRenderImage(company.logo, policy);
  const taxonomyOk = (field: "stages" | "sectors" | "focuses") =>
    canPublishCompanyField(company, field, policy);

  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    href,
    externalHref,
    logo: logoOk ? (company.logo as ImageAsset) : null,
    logoAlt: company.logoAlt ?? `${company.name} logo`,
    logoFit: company.logoFit ?? "contain",
    logoSurface: company.logoSurface ?? "dark",
    opticalScale: company.opticalScale ?? 1,
    cardImage: canRenderImage(company.cardImage, policy) ? (company.cardImage as ImageAsset) : null,
    tagline: canPublishCompanyField(company, "tagline", policy) ? (company.tagline ?? null) : null,
    descriptor: canPublishCompanyField(company, "shortDescription", policy)
      ? (company.shortDescription ?? null)
      : null,
    stages: taxonomyOk("stages") ? (company.stages ?? []) : [],
    sectors: taxonomyOk("sectors") ? (company.sectors ?? []) : [],
    focuses: taxonomyOk("focuses") ? (company.focuses ?? []) : [],
    status: canPublishCompanyField(company, "status", policy) ? (company.status ?? null) : null,
    founders: canPublishCompanyField(company, "founders", policy) ? (company.founders ?? []) : [],
    featured: company.featured,
    sortOrder: company.sortOrder,
  };
}

/** Stable sort: `sortOrder`, then company name (§8.3). */
function sortCompanies(a: CompanySummary, b: CompanySummary): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "en");
}

const getListableCompanies = cache(async (context?: PolicyContext): Promise<Company[]> => {
  const policy = await ctx(context);
  const companies = await getAdapter().getCompanies();
  return companies.filter((company) => canListCompanyPublicly(company, policy));
});

export async function getCompanies(
  filters?: FilterState,
  context?: PolicyContext,
): Promise<CompanySummary[]> {
  const policy = await ctx(context);
  const companies = await getListableCompanies(policy);
  const summaries = companies.map((company) => toCompanySummary(company, policy));
  const filtered = filters
    ? summaries.filter((summary) =>
        matchesFilters(filters, {
          stage: taxonomySlugs(summary.stages),
          sector: taxonomySlugs(summary.sectors),
          focus: taxonomySlugs(summary.focuses),
          status: summary.status ? [summary.status] : [],
        }),
      )
    : summaries;
  return filtered.sort(sortCompanies);
}

export async function getFeaturedCompanies(
  slugs: string[],
  limit = 8,
  context?: PolicyContext,
): Promise<CompanySummary[]> {
  const all = await getCompanies(undefined, context);
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  // Editorial order from the home document wins; anything unpublishable drops out.
  const chosen = slugs
    .map((slug) => bySlug.get(slug))
    .filter((c): c is CompanySummary => Boolean(c));
  const fallback = all.filter((c) => c.featured && !slugs.includes(c.slug));
  return [...chosen, ...fallback].slice(0, limit);
}

export async function getCompanyBySlug(
  slug: string,
  context?: PolicyContext,
): Promise<CompanyDetailView | null> {
  const policy = await ctx(context);
  const companies = await getAdapter().getCompanies();
  const company = companies.find((c) => c.slug === slug);
  if (!company || !canPublishCompanyDetail(company, policy)) return null;

  const listable = (await getListableCompanies(policy))
    .map((c) => toCompanySummary(c, policy))
    .sort(sortCompanies);
  const index = listable.findIndex((c) => c.slug === slug);

  const dealLeadRef = canPublishCompanyField(company, "dealLead", policy)
    ? company.dealLead
    : undefined;
  const dealLead = dealLeadRef
    ? ((await getAdapter().getTeamMembers()).find((m) => m.id === dealLeadRef.id) ?? null)
    : null;

  return {
    company,
    summary: toCompanySummary(company, policy),
    dealLead: dealLead && canListTeamMemberPublicly(dealLead, policy) ? dealLead : null,
    previous: index > 0 ? listable[index - 1] : null,
    next: index >= 0 && index < listable.length - 1 ? listable[index + 1] : null,
  };
}

/** Slugs that may be statically generated — same policy as the sitemap (§16.8). */
export async function getPublishableCompanySlugs(
  context: PolicyContext = PRODUCTION_POLICY,
): Promise<string[]> {
  const companies = await getAdapter().getCompanies();
  return companies.filter((c) => canPublishCompanyDetail(c, context)).map((c) => c.slug);
}

/**
 * Facets are built from approved taxonomy on *listable* companies only, and a
 * group with fewer than two values is dropped entirely (§8.2).
 */
export async function getCompanyFacets(context?: PolicyContext): Promise<FacetGroup[]> {
  const policy = await ctx(context);
  const summaries = await getCompanies(undefined, policy);

  const collect = (
    key: FacetGroup["key"],
    legend: string,
    pick: (summary: CompanySummary) => TaxonomyRef[],
  ): FacetGroup | null => {
    const counts = new Map<string, { title: string; count: number }>();
    for (const summary of summaries) {
      for (const ref of pick(summary)) {
        const existing = counts.get(ref.slug);
        if (existing) existing.count += 1;
        else counts.set(ref.slug, { title: ref.title, count: 1 });
      }
    }
    if (counts.size < 2) return null;
    return {
      key,
      legend,
      control: "checkbox",
      options: Array.from(counts.entries())
        .map(([slug, { title, count }]) => ({ slug, title, count }))
        .sort((a, b) => a.slug.localeCompare(b.slug, "en")),
    };
  };

  const statusGroup = ((): FacetGroup | null => {
    const counts = new Map<string, number>();
    for (const summary of summaries) {
      if (!summary.status || summary.status === "inactive") continue;
      counts.set(summary.status, (counts.get(summary.status) ?? 0) + 1);
    }
    if (counts.size < 2) return null;
    const titles: Record<string, string> = {
      active: "Active",
      exited: "Exited",
      realized: "Realized",
    };
    return {
      key: "status",
      legend: "Status",
      control: "checkbox",
      options: Array.from(counts.entries())
        .map(([slug, count]) => ({ slug, title: titles[slug] ?? slug, count }))
        .sort((a, b) => a.slug.localeCompare(b.slug, "en")),
    };
  })();

  return [
    collect("stage", "Stage", (s) => s.stages),
    collect("sector", "Sector", (s) => s.sectors),
    collect("focus", "Focus", (s) => s.focuses),
    statusGroup,
  ].filter((group): group is FacetGroup => group !== null);
}

/* ------------------------------------------------------------------ Team */

export const getTeamMembers = cache(async (context?: PolicyContext): Promise<TeamMember[]> => {
  const policy = await ctx(context);
  const members = await getAdapter().getTeamMembers();
  return members
    .filter((member) => canListTeamMemberPublicly(member, policy))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en"));
});

/** Contact people for the footer and CTA — resolved from Team, never duplicated. */
export async function getContactPeople(context?: PolicyContext): Promise<TeamMember[]> {
  const policy = await ctx(context);
  const settings = await getSiteSettings(policy);
  const members = await getTeamMembers(policy);
  const byId = new Map(members.map((m) => [m.id, m]));
  return settings.contactPeople
    .map((ref) => byId.get(ref.id))
    .filter((m): m is TeamMember => Boolean(m));
}

/** Contact channels a member has approved for public display (§10.3, §16.3). */
export function teamContactChannels(
  member: TeamMember,
  policy: PolicyContext,
): { email: string | null; phone: string | null; linkedinUrl: string | null } {
  return {
    email: canPublishTeamField(member, "email", policy) ? (member.email ?? null) : null,
    phone: canPublishTeamField(member, "phone", policy) ? (member.phone ?? null) : null,
    linkedinUrl: canPublishTeamField(member, "linkedinUrl", policy)
      ? (member.linkedinUrl ?? null)
      : null,
  };
}

/* ------------------------------------------------------------------ Posts */

export function richTextToPlainText(body: RichText | undefined): string {
  if (!body) return "";
  const parts: string[] = [];
  for (const block of body) {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "blockquote":
        parts.push(block.spans.map((span) => span.text).join(""));
        break;
      case "list":
        for (const item of block.items) parts.push(item.map((span) => span.text).join(""));
        break;
      default:
        break;
    }
  }
  return parts.join(" ");
}

/* ---------------------------------------------------- Raw, for CI reports */

export const rawContent = {
  siteSettings: () => getAdapter().getSiteSettings(),
  homePage: () => getAdapter().getHomePage(),
  fundPage: () => getAdapter().getFundPage(),
  companies: () => getAdapter().getCompanies(),
  teamMembers: () => getAdapter().getTeamMembers(),
  legalPages: () => getAdapter().getLegalPages(),
};

export { isOwnerApproved };
