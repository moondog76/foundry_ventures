/**
 * Previous / next company (§9.1).
 *
 * The neighbours come from the same sorted, policy-filtered list the archive
 * renders, so the pager can never walk into a company the archive does not show.
 *
 * A neighbour without an internal detail route (`href === null`) is skipped
 * rather than linked to its external site: a pager that sometimes leaves the
 * site is a trap. When neither neighbour has a page, nothing renders at all.
 */

import Link from "next/link";
import type { CompanySummary } from "@/content/types";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/global/icons";
import styles from "./company-pager.module.css";

export function CompanyPager({
  previous,
  next,
  label = "More portfolio companies",
}: {
  previous: CompanySummary | null;
  next: CompanySummary | null;
  label?: string;
}) {
  const previousHref = previous?.href ?? null;
  const nextHref = next?.href ?? null;
  if (!previousHref && !nextHref) return null;

  return (
    <nav className={styles.pager} aria-label={label}>
      {previousHref && previous ? (
        <Link href={previousHref} className={styles.link} rel="prev" data-direction="previous">
          <span className={styles.direction}>
            <ArrowLeftIcon />
            Previous
          </span>
          <span className={styles.name}>{previous.name}</span>
        </Link>
      ) : (
        /* Keeps "next" in the right-hand field without rendering a disabled
           control the user could try to activate. */
        <span className={styles.spacer} aria-hidden="true" />
      )}

      {nextHref && next ? (
        <Link href={nextHref} className={styles.link} rel="next" data-direction="next">
          <span className={styles.direction}>
            Next
            <ArrowRightIcon />
          </span>
          <span className={styles.name}>{next.name}</span>
        </Link>
      ) : null}
    </nav>
  );
}
