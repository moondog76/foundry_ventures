/**
 * `/portfolio/[slug]` — company detail (§9, §21).
 *
 * The route only exists for companies the *production* policy would publish, so
 * a statically generated page can never be one the sitemap refuses to list.
 * Preview still resolves any slug on demand, which is how editors review
 * unapproved records behind the draft banner.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getPublishableCompanySlugs, getSiteSettings } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { canIndexCompany, canPublishCompanyField } from "@/content/policy";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, portfolioCompanyJsonLd } from "@/lib/seo/json-ld";
import { PitchBanner } from "@/components/global/PitchBanner";
import { SeoJsonLd } from "@/components/global/SeoJsonLd";
import type { Crumb } from "@/components/global/Breadcrumbs";
import { CompanyDetail } from "@/components/portfolio/CompanyDetail";
import { PORTFOLIO_TITLE } from "@/components/portfolio/PortfolioHero";

type RouteParams = { slug: string };

export async function generateStaticParams(): Promise<RouteParams[]> {
  // Defaults to PRODUCTION_POLICY — the same gate the sitemap uses (§16.8).
  const slugs = await getPublishableCompanySlugs();
  return slugs.map((slug) => ({ slug }));
}

function crumbsFor(name: string, slug: string): Crumb[] {
  return [
    { name: "Home", path: "/" },
    { name: PORTFOLIO_TITLE, path: "/portfolio" },
    { name, path: `/portfolio/${slug}` },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = await resolvePolicyContext();
  const view = await getCompanyBySlug(slug, policy);
  // Nothing may hint that an unpublishable record exists (§3.4).
  if (!view) return HIDDEN_ROUTE_METADATA;

  const { company, summary } = view;
  const settings = await getSiteSettings(policy);

  // Deterministic fallbacks, in descending order of specificity: the approved
  // short description, then the approved tagline, then the site default. No
  // description is composed here.
  const shortDescription = canPublishCompanyField(company, "shortDescription", policy)
    ? company.shortDescription?.trim()
    : undefined;
  const fallbackDescription =
    shortDescription || summary.tagline?.trim() || settings.defaultSeoDescription;

  return buildMetadata({
    settings,
    policy,
    path: `/portfolio/${company.slug}`,
    fallbackTitle: company.name,
    // Social cards and meta descriptions must not carry the source line break.
    fallbackDescription: fallbackDescription.replace(/\s+/g, " "),
    seo: company.seo,
    noIndex: !canIndexCompany(company, policy),
  });
}

export default async function CompanyPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const policy = await resolvePolicyContext();
  const view = await getCompanyBySlug(slug, policy);
  if (!view) notFound();

  const settings = await getSiteSettings(policy);
  const { company, summary } = view;
  const crumbs = crumbsFor(company.name, company.slug);

  const websiteUrl = canPublishCompanyField(company, "websiteUrl", policy)
    ? (company.websiteUrl ?? null)
    : null;

  return (
    <>
      <CompanyDetail view={view} policy={policy} crumbs={crumbs} />

      <SeoJsonLd
        data={[
          breadcrumbJsonLd(
            settings,
            crumbs.map((crumb) => ({ name: crumb.name, path: crumb.path })),
          ),
          /*
           * `portfolioCompanyJsonLd` reads `Organization.url` from
           * `externalHref`, which the summary nulls out precisely because this
           * internal route exists. The organisation's real URL is still its own
           * approved website, so it is supplied here — the emitted value is the
           * same approved fact the page renders as a link.
           */
          portfolioCompanyJsonLd(settings, { ...summary, externalHref: websiteUrl }),
        ]}
      />

      <PitchBanner />
    </>
  );
}
