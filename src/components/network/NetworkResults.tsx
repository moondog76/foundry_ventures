/**
 * Network result grid (§14).
 *
 * Four columns on desktop, two on tablet, one on mobile, grouped by the person's
 * relationship to Foundry. A group heading only exists when that group actually
 * has matches — filtering down to advisors must not leave two empty headings
 * behind.
 *
 * Two genuinely different empty states exist and they must not be conflated:
 *  - filters are active and matched nobody → explain, offer "Clear all";
 *  - nobody is published at all → say so plainly. With the current dataset that
 *    is the honest answer (the seed carries no network people, because none are
 *    published anywhere in the audit material), and pretending a filter is at
 *    fault would be misleading.
 */

import type { PolicyContext } from "@/content/policy";
import type { NetworkPerson } from "@/content/types";
import { EmptyState, uiStyles } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { FilterResetLink } from "@/components/insights/FilterResetLink";
import { NetworkPersonCard } from "./NetworkPersonCard";
import { NETWORK_GROUP_LABELS, NETWORK_GROUP_ORDER } from "./labels";
import styles from "./network-results.module.css";

export type NetworkResultsProps = {
  people: NetworkPerson[];
  policy: PolicyContext;
  hasActiveFilters: boolean;
  /** Canonical href with every filter removed. */
  clearAllHref: string;
  headingId: string;
};

/** Stagger cap: after a handful of cards the sequence stops adding delay (§5.6). */
const MAX_STAGGER_STEPS = 5;
const STAGGER_MS = 60;

export function NetworkResults({
  people,
  policy,
  hasActiveFilters,
  clearAllHref,
  headingId,
}: NetworkResultsProps) {
  const groups = NETWORK_GROUP_ORDER.map((group) => ({
    group,
    // The content layer already applied the canonical sort order, so this only
    // partitions — it never re-sorts.
    members: people.filter((person) => person.group === group),
  })).filter((entry) => entry.members.length > 0);

  // Only the first rendered group can be above the fold; everything after it
  // lazy-loads. Read defensively so a record with an unexpected group value
  // cannot throw here.
  const leadGroup = groups[0]?.group;

  return (
    <div className={styles.results}>
      {/* Keeps the heading levels contiguous: h1 (hero) → h2 (this) → h3 (group)
          → h4 (person). */}
      <h2 id={headingId} className="visually-hidden">
        Network members
      </h2>

      {people.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No one matches these filters"
            description="Every selected value narrows the network further. Clear the filters to see everyone we list."
            actions={
              <FilterResetLink href={clearAllHref} className={uiStyles.button}>
                Clear all filters
              </FilterResetLink>
            }
          />
        ) : (
          <EmptyState
            title="No network members are published yet"
            description="This page lists the operating partners, advisors and angels whose details have been confirmed for publication. Nobody is listed right now."
          />
        )
      ) : (
        <div className={styles.groups}>
          {groups.map(({ group, members }) => (
            <section
              key={group}
              className={styles.group}
              aria-labelledby={`network-group-${group}`}
            >
              <h3 id={`network-group-${group}`} className={styles.groupHeading}>
                {NETWORK_GROUP_LABELS[group]}
              </h3>

              <ul className={styles.grid} role="list">
                {members.map((person, index) => (
                  <Reveal
                    key={person.id}
                    as="li"
                    className={styles.item}
                    delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}
                  >
                    <NetworkPersonCard
                      person={person}
                      policy={policy}
                      priority={group === leadGroup && index < 4}
                    />
                  </Reveal>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
