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
  canListNetworkPersonPublicly,
  canListPostPublicly,
  canListTeamMemberPublicly,
  canListTestimonialPublicly,
  canPublishCompanyDetail,
  canPublishCompanyField,
  canPublishPostDetail,
  canPublishTeamDetail,
  canPublishTeamField,
  canRenderEvidence,
  canRenderImage,
  isOwnerApproved,
  resolveCompanyHref,
  type PolicyContext,
} from "./policy";
import type {
  AboutPage,
  Company,
  CompanyDetailView,
  CompanySummary,
  FacetGroup,
  HomePage,
  ImageAsset,
  InvestmentCriterion,
  LegalPage,
  NavItem,
  NetworkPerson,
  Post,
  PostDetailView,
  PostSummary,
  RichText,
  SiteSettings,
  Stat,
  TaxonomyRef,
  TeamMember,
  TeamMemberView,
  Testimonial,
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

export async function getInvestmentCriteria(
  context?: PolicyContext,
): Promise<InvestmentCriterion[]> {
  const settings = await getSiteSettings(context);
  return settings.featureFlags.investmentCriteria ? settings.investmentCriteria : [];
}

/* ------------------------------------------------------------- Home page */

export const getHomePage = cache(async (): Promise<HomePage> => getAdapter().getHomePage());

export const getAboutPage = cache(async (): Promise<AboutPage> => getAdapter().getAboutPage());

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
    relatedPosts: await getPostsForCompany(company.id, policy),
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

/** Whether `/team/[slug]` exists for this person (§10.2). */
export async function teamMemberHasDetail(
  member: TeamMember,
  context?: PolicyContext,
): Promise<boolean> {
  return canPublishTeamDetail(member, await ctx(context));
}

export async function getTeamMemberBySlug(
  slug: string,
  context?: PolicyContext,
): Promise<TeamMemberView | null> {
  const policy = await ctx(context);
  const members = await getAdapter().getTeamMembers();
  const member = members.find((m) => m.slug === slug);
  if (!member || !canPublishTeamDetail(member, policy)) return null;

  // Reverse relations — canonical direction is Company.dealLead and Post.authors.
  const companies = await getListableCompanies(policy);
  const dealLeadCompanies = companies
    .filter((c) => c.dealLead?.id === member.id && canPublishCompanyField(c, "dealLead", policy))
    .map((c) => toCompanySummary(c, policy))
    .sort(sortCompanies);

  const posts = await getListablePosts(policy);
  const authoredPosts = posts
    .filter((post) => post.authors.some((author) => author.id === member.id))
    .map(toPostSummary);

  return { ...member, authoredPosts, dealLeadCompanies };
}

export async function getPublishableTeamSlugs(
  context: PolicyContext = PRODUCTION_POLICY,
): Promise<string[]> {
  const members = await getAdapter().getTeamMembers();
  return members.filter((m) => canPublishTeamDetail(m, context)).map((m) => m.slug);
}

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

const WORDS_PER_MINUTE = 220;

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

export function readingTimeMinutes(body: RichText | undefined): number | null {
  const text = richTextToPlainText(body).trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function toPostSummary(post: Post): PostSummary {
  const isExternal = post.target === "external";
  return {
    id: post.id,
    title: post.title,
    type: post.type,
    href: isExternal ? (post.externalUrl as string) : `/insights/${post.slug}`,
    isExternal,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt ?? null,
    heroImage: post.heroImage?.available ? post.heroImage : null,
    authors: post.authors,
    companies: post.companies,
    readingTimeMinutes: isExternal ? null : readingTimeMinutes(post.body),
  };
}

const getListablePosts = cache(async (context?: PolicyContext): Promise<Post[]> => {
  const policy = await ctx(context);
  const settings = await getAdapter().getSiteSettings();
  // A disabled feature publishes nothing at all, not even related content (§3.4).
  if (!settings.featureFlags.insights && policy.mode === "production") return [];
  const posts = await getAdapter().getPosts();
  return posts
    .filter((post) => canListPostPublicly(post, policy))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
});

export async function getPosts(
  filters?: FilterState,
  context?: PolicyContext,
): Promise<PostSummary[]> {
  const posts = await getListablePosts(await ctx(context));
  const summaries = posts.map(toPostSummary);
  if (!filters) return summaries;
  return summaries.filter((summary) => matchesFilters(filters, { type: [summary.type] }));
}

/** Home "Latest Insights": featured posts first, then newest (§7.8). */
export async function getLatestPosts(limit = 3, context?: PolicyContext): Promise<PostSummary[]> {
  const posts = await getListablePosts(await ctx(context));
  const ordered = [...posts].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  });
  return ordered.slice(0, limit).map(toPostSummary);
}

export async function getPostsForCompany(
  companyId: string,
  context?: PolicyContext,
): Promise<PostSummary[]> {
  const posts = await getListablePosts(await ctx(context));
  return posts
    .filter((post) => post.companies.some((company) => company.id === companyId))
    .map(toPostSummary);
}

export async function getPostBySlug(
  slug: string,
  context?: PolicyContext,
): Promise<PostDetailView | null> {
  const policy = await ctx(context);
  const posts = await getAdapter().getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post || !canPublishPostDetail(post, policy)) return null;

  const members = await getAdapter().getTeamMembers();
  const authors = post.authors
    .map((ref) => members.find((m) => m.id === ref.id))
    .filter(
      (m): m is TeamMember => Boolean(m) && canListTeamMemberPublicly(m as TeamMember, policy),
    );

  const allCompanies = await getListableCompanies(policy);
  const companies = post.companies
    .map((ref) => allCompanies.find((c) => c.id === ref.id))
    .filter((c): c is Company => Boolean(c))
    .map((c) => toCompanySummary(c, policy));

  return {
    post,
    summary: toPostSummary(post),
    authors,
    companies,
    related: await getRelatedPosts(post, policy),
  };
}

/**
 * §12.4. Priority: manual `relatedPosts`, then shared companies, then shared
 * authors. Deduplicated after every step, current post excluded, automatic
 * candidates newest first, capped at three. No candidates → the caller hides
 * the whole section.
 */
export async function getRelatedPosts(
  post: Post,
  context?: PolicyContext,
  limit = 3,
): Promise<PostSummary[]> {
  const policy = await ctx(context);
  const candidates = await getListablePosts(policy);
  const chosen: Post[] = [];
  const seen = new Set<string>([post.id]);

  const take = (list: Post[]) => {
    for (const candidate of list) {
      if (chosen.length >= limit) return;
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      chosen.push(candidate);
    }
  };

  const byId = new Map(candidates.map((p) => [p.id, p]));
  // 1. Manual editorial order.
  take(
    (post.relatedPosts ?? []).map((ref) => byId.get(ref.id)).filter((p): p is Post => Boolean(p)),
  );
  // 2. Shared company, newest first.
  const companyIds = new Set(post.companies.map((c) => c.id));
  take(candidates.filter((p) => p.companies.some((c) => companyIds.has(c.id))));
  // 3. Shared author, newest first.
  const authorIds = new Set(post.authors.map((a) => a.id));
  take(candidates.filter((p) => p.authors.some((a) => authorIds.has(a.id))));

  return chosen.map(toPostSummary);
}

export async function getPublishablePostSlugs(
  context: PolicyContext = PRODUCTION_POLICY,
): Promise<string[]> {
  const settings = await getAdapter().getSiteSettings();
  if (!settings.featureFlags.insights && context.mode === "production") return [];
  const posts = await getAdapter().getPosts();
  return posts
    .filter((post) => canPublishPostDetail(post, context))
    .map((post) => post.slug as string);
}

export async function getPostFacets(context?: PolicyContext): Promise<FacetGroup[]> {
  const posts = await getPosts(undefined, context);
  const counts = new Map<string, number>();
  for (const post of posts) counts.set(post.type, (counts.get(post.type) ?? 0) + 1);
  if (counts.size < 2) return [];
  const titles: Record<string, string> = { article: "Article", "portfolio-news": "Portfolio news" };
  return [
    {
      key: "type",
      legend: "Type",
      control: "checkbox",
      options: Array.from(counts.entries())
        .map(([slug, count]) => ({ slug, title: titles[slug] ?? slug, count }))
        .sort((a, b) => a.slug.localeCompare(b.slug, "en")),
    },
  ];
}

/* ----------------------------------------------------------- Testimonials */

export async function getTestimonials(context?: PolicyContext): Promise<Testimonial[]> {
  const policy = await ctx(context);
  const settings = await getAdapter().getSiteSettings();
  if (!settings.featureFlags.testimonials && policy.mode === "production") return [];
  const testimonials = await getAdapter().getTestimonials();
  return testimonials
    .filter((t) => canListTestimonialPublicly(t, policy))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ---------------------------------------------------------------- Network */

export async function getNetworkPeople(
  filters?: FilterState,
  context?: PolicyContext,
): Promise<NetworkPerson[]> {
  const policy = await ctx(context);
  const settings = await getAdapter().getSiteSettings();
  if (!settings.featureFlags.network && policy.mode === "production") return [];
  const people = (await getAdapter().getNetworkPeople())
    .filter((person) => canListNetworkPersonPublicly(person, policy))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en"));
  if (!filters) return people;
  return people.filter((person) =>
    matchesFilters(filters, {
      vertical: taxonomySlugs(person.verticals),
      expertise: taxonomySlugs(person.expertise),
    }),
  );
}

/* ------------------------------------------------------------------ Stats */

/**
 * §7.6: derived metrics are computed from the same data the archives use, so a
 * published number can never drift from the list it describes.
 */
export async function getStats(context?: PolicyContext): Promise<Stat[]> {
  const policy = await ctx(context);
  const settings = await getSiteSettings(policy);
  if (!settings.featureFlags.stats) return [];

  const companies = await getCompanies(undefined, policy);
  const derive = (key: NonNullable<Stat["derivedKey"]>): number => {
    switch (key) {
      case "activeCompanyCount":
        return companies.filter((c) => c.status === "active" || c.status === null).length;
      case "totalCompanyCount":
        return companies.length;
    }
  };

  return settings.stats
    .filter((stat) => canRenderEvidence(stat.evidence, policy))
    .map((stat) => (stat.derivedKey ? { ...stat, value: derive(stat.derivedKey) } : stat))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ---------------------------------------------------- Raw, for CI reports */

export const rawContent = {
  siteSettings: () => getAdapter().getSiteSettings(),
  homePage: () => getAdapter().getHomePage(),
  aboutPage: () => getAdapter().getAboutPage(),
  companies: () => getAdapter().getCompanies(),
  teamMembers: () => getAdapter().getTeamMembers(),
  posts: () => getAdapter().getPosts(),
  testimonials: () => getAdapter().getTestimonials(),
  networkPeople: () => getAdapter().getNetworkPeople(),
  legalPages: () => getAdapter().getLegalPages(),
};

export { isOwnerApproved };
