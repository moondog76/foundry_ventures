/**
 * Network archive body: filters above, grouped results below (§14).
 *
 * A server component. The filtered list is resolved before the response is sent,
 * so the first paint already matches the incoming URL — there is no unfiltered
 * flash and no client-side refetch. Only `ArchiveFilters` crosses into the
 * client, and only because the radio/checkbox state and the inline panel are
 * genuinely interactive.
 *
 * The filter block sits above the grid rather than in a side rail so that DOM
 * order equals reading order at every breakpoint, and so the live result count
 * ends up immediately before the results it describes.
 *
 * `Vertical` is a single-select radio group and `Expertise` is a multi-select
 * checkbox group: OR inside Expertise, AND between the two. That is the engine's
 * standard semantics — `matchesFilters` already implements it and nothing is
 * re-derived here.
 */

import type { PolicyContext } from "@/content/policy";
import type { FacetGroup, NetworkPerson } from "@/content/types";
import { countSelected, type FilterSchema, type FilterState } from "@/lib/filters/engine";
import { Container, Section } from "@/components/ui";
import { ArchiveFilters } from "@/components/insights/ArchiveFilters";
import { NetworkResults } from "./NetworkResults";
import { PERSON_NOUN } from "./labels";

export type NetworkArchiveProps = {
  basePath: string;
  policy: PolicyContext;
  facets: FacetGroup[];
  schema: FilterSchema;
  state: FilterState;
  canonicalQuery: string;
  /** Full canonical href, or null when the incoming URL was already canonical. */
  normalizeHref: string | null;
  people: NetworkPerson[];
  /** People with no filters applied. */
  totalCount: number;
};

const RESULTS_HEADING_ID = "network-results-heading";

export function NetworkArchive({
  basePath,
  policy,
  facets,
  schema,
  state,
  canonicalQuery,
  normalizeHref,
  people,
  totalCount,
}: NetworkArchiveProps) {
  const hasActiveFilters = countSelected(state) > 0;

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
          resultCount={people.length}
          totalCount={totalCount}
          noun={PERSON_NOUN}
          heading="Filter the network"
          /* "All" is the absence of the `vertical` parameter; a native radio
             cannot be unchecked, so the option has to exist. */
          allOptionLabel="All"
        />

        <NetworkResults
          people={people}
          policy={policy}
          hasActiveFilters={hasActiveFilters}
          clearAllHref={basePath}
          headingId={RESULTS_HEADING_ID}
        />
      </Container>
    </Section>
  );
}
