/**
 * Insights archive body: filters above, results below, pagination underneath
 * (§12.1).
 *
 * A server component. The filtered list is resolved before the response is sent,
 * so the first paint already matches the incoming URL — there is no unfiltered
 * flash and no client-side refetch. Only `ArchiveFilters` crosses into the
 * client, and only because checkbox state and the inline panel are genuinely
 * interactive.
 *
 * The filter block sits above the grid rather than in a side rail so that DOM
 * order equals reading order at every breakpoint, and so the live result count
 * ends up immediately before the results it describes.
 *
 * Pagination slices here rather than in the content layer: `getPosts()` answers
 * "what matches", and the archive alone decides how much of that a page shows.
 */

import type { PolicyContext } from "@/content/policy";
import type { FacetGroup, PostSummary } from "@/content/types";
import { countSelected, type FilterSchema, type FilterState } from "@/lib/filters/engine";
import { Container, Pagination, Section } from "@/components/ui";
import { ArchiveFilters } from "./ArchiveFilters";
import { InsightsResults } from "./InsightsResults";
import { POSTS_PER_PAGE, archiveHref } from "./archive-url";
import { POST_NOUN } from "./labels";

export type InsightsArchiveProps = {
  basePath: string;
  policy: PolicyContext;
  facets: FacetGroup[];
  schema: FilterSchema;
  state: FilterState;
  /** Canonical *filter* query for the incoming URL, without "?". */
  canonicalQuery: string;
  /** Full canonical href, or null when the incoming URL was already canonical. */
  normalizeHref: string | null;
  /** Every post matching the current filters, unpaginated. */
  posts: PostSummary[];
  /** Posts with no filters applied. */
  totalCount: number;
  /** Already clamped to the available range by the route. */
  page: number;
};

const RESULTS_HEADING_ID = "insights-results-heading";

export function InsightsArchive({
  basePath,
  policy,
  facets,
  schema,
  state,
  canonicalQuery,
  normalizeHref,
  posts,
  totalCount,
  page,
}: InsightsArchiveProps) {
  const hasActiveFilters = countSelected(state) > 0;
  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;
  const visible = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <Section spacing="default" aria-labelledby={RESULTS_HEADING_ID}>
      <Container>
        <ArchiveFilters
          basePath={basePath}
          facets={facets}
          schema={schema}
          initialState={state}
          canonicalQuery={canonicalQuery}
          normalizeHref={normalizeHref}
          /* The count describes the whole filtered set, not the page slice. */
          resultCount={posts.length}
          totalCount={totalCount}
          noun={POST_NOUN}
          heading="Filter news and insights"
        />

        <InsightsResults
          posts={visible}
          policy={policy}
          hasActiveFilters={hasActiveFilters}
          clearAllHref={basePath}
          headingId={RESULTS_HEADING_ID}
        />

        {/* The primitive renders nothing at a single page, so the archive stays
            free of chrome until it genuinely passes 24 posts. Filters are
            preserved in every page href. */}
        <Pagination
          currentPage={page}
          totalPages={pageCount}
          buildHref={(target) => archiveHref(basePath, schema, state, target)}
          label="News and insights pages"
        />
      </Container>
    </Section>
  );
}
