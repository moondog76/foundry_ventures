/**
 * Portfolio result grid (§8.3, §8.4).
 *
 * Three columns on desktop, two on tablet, one on mobile. Server-rendered: the
 * filtered list arrives already resolved, so the first paint is the real result
 * for the incoming URL rather than an unfiltered flash.
 *
 * Two genuinely different empty states exist and they must not be conflated:
 *  - filters are active and matched nothing → explain, offer "Clear all", offer
 *    the pitch route;
 *  - nothing is published at all → say so plainly. With the current dataset this
 *    is the honest production state, and pretending a filter is at fault would
 *    be misleading.
 */

import type { PolicyContext } from "@/content/policy";
import type { CompanySummary } from "@/content/types";
import { ButtonLink, EmptyState, uiStyles } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { ClearFiltersLink } from "./ClearFiltersLink";
import { CompanyCard } from "./CompanyCard";
import styles from "./portfolio-results.module.css";

export type PortfolioResultsProps = {
  companies: CompanySummary[];
  policy: PolicyContext;
  hasActiveFilters: boolean;
  /** Canonical href with every filter removed. */
  clearAllHref: string;
  headingId: string;
};

/** Stagger cap: after a handful of cards the sequence stops adding delay (§5.6). */
const MAX_STAGGER_STEPS = 5;
const STAGGER_MS = 60;

export function PortfolioResults({
  companies,
  policy,
  hasActiveFilters,
  clearAllHref,
  headingId,
}: PortfolioResultsProps) {
  return (
    <div className={styles.results}>
      <h2 id={headingId} className="visually-hidden">
        Portfolio companies
      </h2>

      {companies.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No companies match these filters"
            description="Every selected value narrows the portfolio further. Clear the filters to see the full list, or tell us what you are building."
            actions={
              <>
                <ClearFiltersLink href={clearAllHref} className={uiStyles.button}>
                  Clear all filters
                </ClearFiltersLink>
                <ButtonLink href="/pitch" variant="secondary">
                  Pitch us
                </ButtonLink>
              </>
            }
          />
        ) : (
          <EmptyState
            title="No portfolio companies are published yet"
            description="This archive only lists companies whose details have been confirmed for publication. Nothing is listed right now."
            actions={
              <ButtonLink href="/pitch" variant="secondary">
                Pitch us
              </ButtonLink>
            }
          />
        )
      ) : (
        <ul className={styles.grid} role="list">
          {companies.map((summary, index) => (
            <Reveal
              key={summary.id}
              as="li"
              className={styles.item}
              delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}
            >
              <CompanyCard
                summary={summary}
                policy={policy}
                /* Only the first row is above the fold; everything else lazy-loads. */
                priority={index < 3}
              />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
