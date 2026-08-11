/**
 * Portfolio companies this person leads (§10.2, §16.4.1).
 *
 * The relation is canonical on the company (`Company.dealLead`) and is resolved
 * in that one direction by `getTeamMemberBySlug`, which also drops any company
 * whose `dealLead` field is not itself owner-approved. Nothing is re-derived
 * here: this component only lays out summaries it is handed.
 *
 * `CompanyCard` is reused rather than reimplemented, so a company card behaves
 * identically on a person's profile and in the portfolio archive — including the
 * rule that a card with no approved destination is not a link at all.
 */

import type { CompanySummary } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { Reveal } from "@/components/ui/Reveal";
import { CompanyCard } from "@/components/portfolio/CompanyCard";
import styles from "./team-deal-lead-companies.module.css";

/** Stagger cap: after a handful of cards the sequence stops adding delay (§5.6). */
const MAX_STAGGER_STEPS = 3;
const STAGGER_MS = 60;

const CARD_SIZES = "(min-width: 1200px) 22vw, (min-width: 768px) 42vw, 88vw";

export function TeamDealLeadCompanies({
  companies,
  policy,
  headingId,
}: {
  companies: CompanySummary[];
  policy: PolicyContext;
  headingId: string;
}) {
  if (companies.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      {/* "Deal lead" is the vocabulary the company detail page already uses for
          this exact relation — the two pages must not name it differently. */}
      <h2 id={headingId} className={styles.heading}>
        Deal lead
      </h2>
      <ul className={styles.grid} role="list">
        {companies.map((summary, index) => (
          <Reveal
            key={summary.id}
            as="li"
            className={styles.item}
            delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}
          >
            <CompanyCard summary={summary} policy={policy} sizes={CARD_SIZES} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
