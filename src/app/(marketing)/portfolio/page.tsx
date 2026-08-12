/**
 * `/portfolio` — the portfolio archive (§8).
 *
 * Server component. `searchParams` is awaited (Next 16), parsed against a schema
 * whose vocabulary is derived from the *actual* approved taxonomy, and the
 * filtered result is rendered on the server — the first paint already matches
 * the URL.
 *
 * The live site titles this page "Gallery 1", which is a documented defect
 * (an unedited Squarespace default). It is replaced here with the archive's real
 * name; the description falls back to the approved site-level description rather
 * than to invented marketing copy.
 */

import type { Metadata } from "next";
import { getCompanies, getCompanyFacets, getHomePage, getSiteSettings } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import type { FacetGroup } from "@/content/types";
import { parseFilters } from "@/lib/filters/engine";
import { buildCompanyFilterSchema } from "@/lib/filters/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { PortfolioArchive } from "@/components/portfolio/PortfolioArchive";
import { PORTFOLIO_TITLE, PortfolioHero } from "@/components/portfolio/PortfolioHero";

const PORTFOLIO_PATH = "/portfolio";

type SearchParams = Record<string, string | string[] | undefined>;

/** Slugs actually present in a facet group; an absent group yields no vocabulary. */
function facetSlugs(facets: FacetGroup[], key: FacetGroup["key"]): string[] {
  const group = facets.find((facet) => facet.key === key);
  return group ? group.options.map((option) => option.slug) : [];
}

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);

  return buildMetadata({
    settings,
    policy,
    path: PORTFOLIO_PATH,
    fallbackTitle: PORTFOLIO_TITLE,
    fallbackDescription: settings.defaultSeoDescription,
  });
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const policy = await resolvePolicyContext();
  const [params, settings, home, facets] = await Promise.all([
    searchParams,
    getSiteSettings(policy),
    getHomePage(),
    getCompanyFacets(policy),
  ]);

  // The vocabulary is data-driven: a group the content layer dropped (fewer than
  // two values) contributes no allowed values, so its params are discarded as
  // unknown rather than silently honoured.
  const schema = buildCompanyFilterSchema({
    stage: facetSlugs(facets, "stage"),
    sector: facetSlugs(facets, "sector"),
    focus: facetSlugs(facets, "focus"),
    status: facetSlugs(facets, "status"),
  });

  const parsed = parseFilters(schema, params);
  const [companies, allCompanies] = await Promise.all([
    getCompanies(parsed.state, policy),
    getCompanies(undefined, policy),
  ]);

  return (
    <>
      <PortfolioHero
        policy={policy}
        /* Both candidates are real content-layer records and both are gated by
           `canRenderEditorialText`; the portfolio-specific intro wins when it
           has been approved. Nothing is written here. */
        introCandidates={[home.featuredPortfolio.intro, settings.brandStatement]}
      />

      <PortfolioArchive
        basePath={PORTFOLIO_PATH}
        policy={policy}
        facets={facets}
        schema={schema}
        state={parsed.state}
        canonicalQuery={parsed.canonicalQuery}
        didNormalize={parsed.didNormalize}
        companies={companies}
        totalCount={allCompanies.length}
      />
    </>
  );
}
