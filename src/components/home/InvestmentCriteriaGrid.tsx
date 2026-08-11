/**
 * Investment criteria strip (§7.2).
 *
 * The data arrives already filtered: `getInvestmentCriteria()` returns `[]` when
 * the feature flag is off *or* when nothing clears the evidence policy, so this
 * component renders nothing at all rather than an empty frame. Every seeded
 * criterion is `observed`, never `owner-approved`, which is why the strip is
 * legitimately absent in production.
 */

import type { CSSProperties } from "react";
import type { InvestmentCriterion } from "@/content/types";
import { ButtonLink, Container, Section, cx } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./investment-criteria.module.css";

export type InvestmentCriteriaGridProps = {
  criteria: InvestmentCriterion[];
  /** Destination and label for the closing CTA, resolved by the page. */
  ctaHref: string;
  ctaLabel: string;
};

/**
 * Column count that can never leave an orphan cell.
 *
 * Rules, in the order they apply:
 *   - five approved values render as five even columns (§7.2, explicit);
 *   - six default to 3×2 (§7.2, explicit);
 *   - anything else that fits on a single row occupies a single row;
 *   - otherwise the widest count whose final row still holds at least two cells
 *     wins, so 7 becomes 4/3 and 10 becomes 4/4/2 — never 4/4/1.
 *
 * Exported so the layout rule is unit-testable without rendering.
 */
export function criteriaColumnCount(count: number, maxColumns: number): number {
  if (count <= 1) return 1;
  if (count === 5 && maxColumns >= 5) return 5;
  if (count === 6 && maxColumns >= 3) return 3;
  // Beyond four a row reads as a ticker rather than a grid, so four is the cap
  // for every count except the explicit five.
  const cap = Math.min(maxColumns, 4);
  if (count <= cap) return count;
  for (let columns = cap; columns >= 2; columns -= 1) {
    const remainder = count % columns;
    if (remainder === 0 || remainder >= 2) return columns;
  }
  // No orphan-free option exists at this width (e.g. 7 values on a tablet).
  // The widest allowed row at least keeps the trailing cell as large as possible.
  return cap;
}

/**
 * Two mobile columns are only safe when every label and value is short enough to
 * survive a 320px viewport without breaking mid-word, and only when the count is
 * even — an odd count would strand a single cell on the last row.
 */
function mobileColumnCount(criteria: InvestmentCriterion[]): number {
  const fits = criteria.every(
    (criterion) => criterion.value.length <= 14 && criterion.label.length <= 18,
  );
  return fits && criteria.length % 2 === 0 ? 2 : 1;
}

export function InvestmentCriteriaGrid({
  criteria,
  ctaHref,
  ctaLabel,
}: InvestmentCriteriaGridProps) {
  if (criteria.length === 0) return null;

  const desktopColumns = criteriaColumnCount(criteria.length, 5);
  const tabletColumns = criteriaColumnCount(criteria.length, 3);
  const mobileColumns = mobileColumnCount(criteria);

  return (
    <Section
      surface="light"
      spacing="tight"
      className={styles.section}
      aria-labelledby="investment-criteria-heading"
    >
      <Container>
        {/*
          The live site publishes no heading for this strip and none may be
          invented, so the region is named by a structural, non-factual label
          that only assistive technology sees.
        */}
        <h2 id="investment-criteria-heading" className="visually-hidden">
          Investment criteria
        </h2>

        <Reveal>
          <dl
            className={styles.list}
            style={
              {
                "--criteria-columns": desktopColumns,
                "--criteria-columns-tablet": tabletColumns,
                "--criteria-columns-mobile": mobileColumns,
              } as CSSProperties
            }
            /* The same three values as data attributes: the border rules need to
               address "first cell in a row" per breakpoint, and `nth-child()`
               cannot read a custom property. */
            data-columns={desktopColumns}
            data-tablet-columns={tabletColumns}
            data-mobile-columns={mobileColumns}
          >
            {criteria.map((criterion) => (
              <div key={`${criterion.sortOrder}-${criterion.label}`} className={styles.item}>
                <dt className={cx("type-label", styles.label)}>{criterion.label}</dt>
                <dd className={styles.value}>{criterion.value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.cta}>
            <ButtonLink href={ctaHref} full>
              {ctaLabel}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
