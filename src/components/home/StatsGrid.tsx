/**
 * Statistics (§7.6).
 *
 * `getStats()` returns `[]` when the flag is off or when no stat's evidence is
 * owner-approved, and derived metrics have already been recomputed from the
 * published portfolio, so a number here can never drift from the archive it
 * describes. Nothing to show means nothing is rendered.
 */

import type { Stat } from "@/content/types";
import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { CountUpValue } from "./CountUpValue";
import styles from "./stats-grid.module.css";

export type StatsGridProps = {
  stats: Stat[];
  /** Approved section heading, or null while still unapproved. */
  heading: string | null;
};

export function StatsGrid({ stats, heading }: StatsGridProps) {
  if (stats.length === 0) return null;

  return (
    <Section
      surface="dark"
      spacing="tight"
      className={styles.section}
      aria-labelledby={heading ? "stats-heading" : undefined}
      aria-label={heading ? undefined : "Key figures"}
    >
      <Container>
        {heading ? (
          <Reveal>
            <h2 id="stats-heading" className={styles.heading}>
              {heading}
            </h2>
          </Reveal>
        ) : null}

        <ul className={styles.grid} role="list" data-count={Math.min(stats.length, 4)}>
          {stats.map((stat, index) => (
            <Reveal
              as="li"
              key={`${stat.sortOrder}-${stat.label}`}
              className={styles.item}
              delay={Math.min(index, 3) * 70}
            >
              {/* Value and label share one paragraph so the pair is announced as
                  a single phrase ("12 Portfolio companies") rather than as two
                  unrelated fragments. */}
              <p className={styles.figure}>
                <span className={styles.value}>
                  <CountUpValue value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </span>
                <span className={styles.label}>{stat.label}</span>
              </p>
              {stat.sourceNote ? <p className={styles.note}>{stat.sourceNote}</p> : null}
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
