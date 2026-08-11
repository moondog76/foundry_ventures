/**
 * Insights result grid (§12.1).
 *
 * Three columns on desktop, two on tablet, one on mobile. Server-rendered: the
 * filtered, paginated list arrives already resolved, so the first paint is the
 * real result for the incoming URL rather than an unfiltered flash.
 *
 * Two genuinely different empty states exist and they must not be conflated:
 *  - filters are active and matched nothing → explain, offer "Clear all";
 *  - nothing is published at all → say so plainly. With the current dataset this
 *    is the honest state (the seed carries no posts), and pretending a filter is
 *    at fault would be misleading.
 */

import type { PolicyContext } from "@/content/policy";
import type { PostSummary } from "@/content/types";
import { ButtonLink, EmptyState, uiStyles } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { FilterResetLink } from "./FilterResetLink";
import { PostCard } from "./PostCard";
import styles from "./insights-results.module.css";

export type InsightsResultsProps = {
  posts: PostSummary[];
  policy: PolicyContext;
  hasActiveFilters: boolean;
  /** Canonical href with every filter removed. */
  clearAllHref: string;
  headingId: string;
};

/** Stagger cap: after a handful of cards the sequence stops adding delay (§5.6). */
const MAX_STAGGER_STEPS = 5;
const STAGGER_MS = 60;

export function InsightsResults({
  posts,
  policy,
  hasActiveFilters,
  clearAllHref,
  headingId,
}: InsightsResultsProps) {
  return (
    <div className={styles.results}>
      <h2 id={headingId} className="visually-hidden">
        News and insights
      </h2>

      {posts.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No posts match these filters"
            description="Every selected type narrows the archive further. Clear the filters to see everything we have published."
            actions={
              <FilterResetLink href={clearAllHref} className={uiStyles.button}>
                Clear all filters
              </FilterResetLink>
            }
          />
        ) : (
          <EmptyState
            title="No insights are published yet"
            description="This archive lists the articles and portfolio news that have been confirmed for publication. Nothing is listed right now."
            actions={
              <ButtonLink href="/pitch" variant="secondary">
                Pitch us
              </ButtonLink>
            }
          />
        )
      ) : (
        <ul className={styles.grid} role="list">
          {posts.map((post, index) => (
            <Reveal
              key={post.id}
              as="li"
              className={styles.item}
              delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}
            >
              <PostCard
                post={post}
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
