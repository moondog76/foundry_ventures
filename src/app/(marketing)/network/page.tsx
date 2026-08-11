/**
 * `/network` — operating partners, advisors and the angel network (§14, §3.4).
 *
 * Feature-flagged. With `network` off the route 404s in production and returns
 * `HIDDEN_ROUTE_METADATA`, but still renders for an editor in preview — see
 * `requireFeature`.
 *
 * Server component. `searchParams` is awaited (Next 16), parsed against a schema
 * whose vocabulary is derived from the *actual* approved taxonomy on published
 * people, and the filtered result is rendered on the server, so the first paint
 * already matches the URL.
 *
 * The seed dataset is deliberately empty — no operating partners, advisors or
 * angels are published anywhere in the audit material and none may be invented
 * (§14, §32) — so the honest answer this page gives today, in preview, is its
 * empty state.
 */

import type { Metadata } from "next";
import { getNetworkPeople, getSiteSettings } from "@/content";
import { parseFilters } from "@/lib/filters/engine";
import { buildNetworkFilterSchema } from "@/lib/filters/schemas";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { PitchBanner } from "@/components/global/PitchBanner";
import { ArchiveHero } from "@/components/insights/ArchiveHero";
import { requireFeature, resolveFeatureGate } from "@/components/insights/feature-gate";
import { NetworkArchive } from "@/components/network/NetworkArchive";
import { buildNetworkFacets, facetSlugs } from "@/components/network/facets";
import { NETWORK_PATH, NETWORK_TITLE } from "@/components/network/labels";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const gate = await resolveFeatureGate("network");
  // Nothing may hint that a disabled route exists (§3.4).
  if (gate.hidden) return HIDDEN_ROUTE_METADATA;

  const settings = await getSiteSettings(gate.policy);

  return buildMetadata({
    settings,
    policy: gate.policy,
    path: NETWORK_PATH,
    // The archive's own name, and the site-level description — no page-specific
    // copy exists for this route and none is invented here (§21.1).
    fallbackTitle: NETWORK_TITLE,
    fallbackDescription: settings.defaultSeoDescription,
  });
}

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const policy = await requireFeature("network");
  const [params, settings, allPeople] = await Promise.all([
    searchParams,
    getSiteSettings(policy),
    getNetworkPeople(undefined, policy),
  ]);

  // The vocabulary is data-driven: a group the facet builder dropped (fewer than
  // two approved values) contributes no allowed values, so its params are
  // discarded as unknown rather than silently honoured.
  const facets = buildNetworkFacets(allPeople, policy);
  const schema = buildNetworkFilterSchema({
    vertical: facetSlugs(facets, "vertical"),
    expertise: facetSlugs(facets, "expertise"),
  });

  const parsed = parseFilters(schema, params);
  const people = await getNetworkPeople(parsed.state, policy);

  const canonicalHref = parsed.canonicalQuery
    ? `${NETWORK_PATH}?${parsed.canonicalQuery}`
    : NETWORK_PATH;

  return (
    <>
      <ArchiveHero
        title={NETWORK_TITLE}
        headingId="network-heading"
        policy={policy}
        /* The only site-level statement that could ever introduce this archive.
           It is a real content-layer record and is gated by
           `canRenderEditorialText`; nothing is written here. */
        introCandidates={[settings.brandStatement]}
      />

      <NetworkArchive
        basePath={NETWORK_PATH}
        policy={policy}
        facets={facets}
        schema={schema}
        state={parsed.state}
        canonicalQuery={parsed.canonicalQuery}
        normalizeHref={parsed.didNormalize ? canonicalHref : null}
        people={people}
        totalCount={allPeople.length}
      />

      <PitchBanner />
    </>
  );
}
