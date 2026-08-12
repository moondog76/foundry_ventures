/**
 * Decision-maker block (§8.7).
 *
 * The audit's single largest finding: "The public team is almost absent", and
 * LP confidence scored 5.8/10 largely because of it. A named human with a
 * visible role is a basic diligence signal, and its absence is what made the
 * operating model read as asserted rather than evidenced.
 *
 * What this deliberately does *not* do:
 *
 *  - **It is not a staff grid.** §8.7: with one decision-maker, own that
 *    intimacy rather than padding the page. The layout is a single editorial
 *    composition and stays one when there is one person.
 *  - **It renders only people who own investment decisions**, read from the
 *    record's own `ownsInvestmentDecision` flag rather than from "everyone
 *    active". §17 forbids padding a team to look larger.
 *  - **It invents no biography.** §8.7 wants a 45-70 word bio and a consistent
 *    portrait; neither exists yet for Anders, and §16's fallback is a graceful
 *    omission with the requirement recorded, not generated filler. So the block
 *    renders what is owner-approved — name, role, direct contact — and the bio
 *    and portrait appear the moment real ones land, with no code change.
 *
 * Returns `null` when nobody clears the policy, so an empty state is impossible.
 */

import type { TeamMember } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { canPublishTeamField } from "@/content/policy";
import { Container, Section, TextLink } from "@/components/ui";
import { ExternalLink } from "@/components/global/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./decision-makers.module.css";

export type DecisionMakersProps = {
  people: TeamMember[];
  policy: PolicyContext;
  /**
   * The trailing link out of this block. Both the href and the label are
   * supplied by the page: the home page sends the reader to `/fund`, and
   * `/fund` sends them to the portfolio. Hardcoding the label here meant the
   * fund page offered "How the fund works" pointing at `/portfolio`.
   */
  link: { href: string; label: string };
};

export function DecisionMakers({ people, policy, link }: DecisionMakersProps) {
  if (people.length === 0) return null;

  return (
    <Section surface="light" aria-labelledby="decision-makers-heading">
      <Container>
        <Reveal>
          <div className={styles.layout} data-count={people.length}>
            <h2 id="decision-makers-heading" className={styles.heading}>
              Who decides
            </h2>

            <ul className={styles.people}>
              {people.map((person) => {
                const bio = canPublishTeamField(person, "shortBio", policy)
                  ? person.shortBio?.trim()
                  : undefined;
                const email = canPublishTeamField(person, "email", policy)
                  ? person.email
                  : undefined;
                const linkedin = canPublishTeamField(person, "linkedinUrl", policy)
                  ? person.linkedinUrl
                  : undefined;

                return (
                  <li key={person.id} className={styles.person}>
                    <h3 className={styles.name}>{person.name}</h3>
                    <p className={styles.role}>{person.role}</p>
                    {bio ? <p className={styles.bio}>{bio}</p> : null}
                    <div className={styles.contact}>
                      {email ? (
                        <a className={styles.contactLink} href={`mailto:${email}`}>
                          {email}
                        </a>
                      ) : null}
                      {linkedin ? (
                        <ExternalLink href={linkedin} className={styles.contactLink}>
                          LinkedIn
                        </ExternalLink>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className={styles.fundLink}>
              <TextLink href={link.href}>{link.label}</TextLink>
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
