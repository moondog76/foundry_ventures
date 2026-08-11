/**
 * Archive body: filters above, results below (§8.2, §8.3).
 *
 * A server component. The filtered list is resolved before the response is sent,
 * so the first paint already matches the incoming URL — there is no unfiltered
 * flash and no client-side refetch. Only `PortfolioFilters` crosses into the
 * client, and only because checkbox state and the inline panel are genuinely
 * interactive.
 *
 * The filter block sits above the grid rather than in a side rail so that DOM
 * order equals reading order at every breakpoint, and so the live result count
 * ends up immediately before the results it describes.
 */

import type { PolicyContext } from "@/content/policy";
import type { CompanySummary, FacetGroup } from "@/content/types";
import type { FilterSchema, FilterState } from "@/lib/filters/engine";
import { countSelected } from "@/lib/filters/engine";
import { Container, Section } from "@/components/ui";
import { PortfolioFilters } from "./PortfolioFilters";
import { PortfolioResults } from "./PortfolioResults";

export type PortfolioArchiveProps = {
  basePath: string;
  policy: PolicyContext;
  facets: FacetGroup[];
  schema: FilterSchema;
  state: FilterState;
  canonicalQuery: string;
  didNormalize: boolean;
  companies: CompanySummary[];
  totalCount: number;
};

const RESULTS_HEADING_ID = "portfolio-results-heading";

export function PortfolioArchive({
  basePath,
  policy,
  facets,
  schema,
  state,
  canonicalQuery,
  didNormalize,
  companies,
  totalCount,
}: PortfolioArchiveProps) {
  const hasActiveFilters = countSelected(state) > 0;

  return (
    <Section spacing="default" aria-labelledby={RESULTS_HEADING_ID}>
      <Container>
        <PortfolioFilters
          basePath={basePath}
          facets={facets}
          schema={schema}
          initialState={state}
          canonicalQuery={canonicalQuery}
          didNormalize={didNormalize}
          resultCount={companies.length}
          totalCount={totalCount}
        />
        <PortfolioResults
          companies={companies}
          policy={policy}
          hasActiveFilters={hasActiveFilters}
          clearAllHref={basePath}
          headingId={RESULTS_HEADING_ID}
        />
      </Container>
    </Section>
  );
}
