/**
 * `/insights` — the News & Insights archive (§12.1, §3.4).
 *
 * Feature-flagged. With `insights` off the route 404s in production and returns
 * `HIDDEN_ROUTE_METADATA`, but still renders for an editor in preview — see
 * `requireFeature`.
 *
 * Server component. `searchParams` is awaited (Next 16), parsed against a schema
 * whose vocabulary is derived from the *actual* published post types, and the
 * filtered result is rendered on the server, so the first paint already matches
 * the URL.
 *
 * The canonical URL for a request is computed here — filters first, then
 * `?page=` — and the client is handed one ready-made normalisation target. That
 * is what lets the filter component issue exactly one `router.replace` without
 * ever dropping the page from a shared deep link.
 */

import type { Metadata } from "next";
import { getPostFacets, getPosts, getSiteSettings } from "@/content";
import { parseFilters } from "@/lib/filters/engine";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { PitchBanner } from "@/components/global/PitchBanner";
import { ArchiveHero } from "@/components/insights/ArchiveHero";
import { InsightsArchive } from "@/components/insights/InsightsArchive";
import {
  POSTS_PER_PAGE,
  archiveQuery,
  clampPage,
  incomingQueryString,
  narrowPostSchema,
  parsePageParam,
} from "@/components/insights/archive-url";
import { requireFeature, resolveFeatureGate } from "@/components/insights/feature-gate";
import { INSIGHTS_PATH, INSIGHTS_TITLE } from "@/components/insights/labels";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const gate = await resolveFeatureGate("insights");
  // Nothing may hint that a disabled route exists (§3.4).
  if (gate.hidden) return HIDDEN_ROUTE_METADATA;

  const settings = await getSiteSettings(gate.policy);

  return buildMetadata({
    settings,
    policy: gate.policy,
    path: INSIGHTS_PATH,
    // The archive's own name, and the site-level description — no page-specific
    // copy exists for this route and none is invented here (§21.1).
    fallbackTitle: INSIGHTS_TITLE,
    fallbackDescription: settings.defaultSeoDescription,
  });
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const policy = await requireFeature("insights");
  const [params, settings, facets] = await Promise.all([
    searchParams,
    getSiteSettings(policy),
    getPostFacets(policy),
  ]);

  // The vocabulary is data-driven: when the content layer dropped the type group
  // (fewer than two published types) there is no filter UI, so a `?type=` param
  // is discarded as unknown rather than silently honoured.
  const schema = narrowPostSchema(facets);
  const parsed = parseFilters(schema, params);

  const [posts, allPosts] = await Promise.all([
    getPosts(parsed.state, policy),
    getPosts(undefined, policy),
  ]);

  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const page = clampPage(parsePageParam(params.page), pageCount);

  const canonicalQuery = archiveQuery(schema, parsed.state, page);
  const canonicalHref = canonicalQuery ? `${INSIGHTS_PATH}?${canonicalQuery}` : INSIGHTS_PATH;
  const normalizeHref = incomingQueryString(params) === canonicalQuery ? null : canonicalHref;

  return (
    <>
      <ArchiveHero
        title={INSIGHTS_TITLE}
        headingId="insights-heading"
        policy={policy}
        /* The only site-level statement that could ever introduce this archive.
           It is a real content-layer record and is gated by
           `canRenderEditorialText`; nothing is written here. */
        introCandidates={[settings.brandStatement]}
      />

      <InsightsArchive
        basePath={INSIGHTS_PATH}
        policy={policy}
        facets={facets}
        schema={schema}
        state={parsed.state}
        canonicalQuery={parsed.canonicalQuery}
        normalizeHref={normalizeHref}
        posts={posts}
        totalCount={allPosts.length}
        page={page}
      />

      <PitchBanner />
    </>
  );
}
