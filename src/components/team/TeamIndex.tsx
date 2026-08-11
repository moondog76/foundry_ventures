/**
 * `/team` index (§10.1).
 *
 * Structure: one dark Foundry surface carrying the single `h1`, a jump list of
 * everyone on the page, then one `<section id={slug}>` per person.
 *
 * Two content decisions worth stating explicitly:
 *
 *  - the heading is the archive's own deterministic name — the same word the
 *    site navigation and the breadcrumb use. It is a label, not editorial copy,
 *    so it needs no approval; writing a headline about what the team *does*
 *    would be inventing brand voice (§25.1);
 *  - the intro is editorial copy, so it comes from the content layer and passes
 *    `canRenderEditorialText` before it renders. When nothing is approved the
 *    paragraph is absent — not stubbed, not padded with empty space.
 *
 * With no publishable people the page still renders its `h1` and an honest
 * empty state. It never 404s: `/team` is a real, navigable route whose current
 * answer is "nothing is published yet".
 */

import type { EditorialText, TeamMember } from "@/content/types";
import { canRenderEditorialText, type PolicyContext } from "@/content/policy";
import { Container, EmptyState, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { TeamHashFocus } from "./TeamHashFocus";
import { TeamMemberSection } from "./TeamMemberSection";
import styles from "./team-index.module.css";

/** The index's own name. Matches `SiteSettings.navigation` and the breadcrumb. */
export const TEAM_TITLE = "Team";

export type TeamIndexEntry = {
  member: TeamMember;
  /** `teamMemberHasDetail(member, policy)`, resolved once by the route. */
  hasDetail: boolean;
};

export type TeamIndexProps = {
  entries: TeamIndexEntry[];
  policy: PolicyContext;
  /**
   * Intro candidates in priority order; the first one that clears the
   * publishing policy renders. Passing several lets the page prefer a
   * team-specific intro over the generic brand statement without re-deriving
   * policy here.
   */
  introCandidates?: Array<EditorialText | undefined>;
  headingId?: string;
};

export function TeamIndex({
  entries,
  policy,
  introCandidates = [],
  headingId = "team-heading",
}: TeamIndexProps) {
  const intro = introCandidates.find((candidate) => canRenderEditorialText(candidate, policy));

  return (
    <>
      <Section surface="dark" spacing="tight" className={styles.hero} aria-labelledby={headingId}>
        <Container>
          <Reveal className={styles.heroInner}>
            <h1 id={headingId} className={styles.heading}>
              {TEAM_TITLE}
            </h1>
            {intro ? <p className={styles.intro}>{intro.value}</p> : null}
          </Reveal>
        </Container>
      </Section>

      <Section as="div" spacing="tight">
        <Container>
          {entries.length === 0 ? (
            <>
              {/* Keeps the heading levels contiguous (h1 → h2 → the empty
                  state's h3) on a page that has no person headings. */}
              <h2 className="visually-hidden">Team members</h2>
              <EmptyState
                title="No team profiles are published yet"
                description="This page lists the people whose details have been confirmed for publication. Nothing is listed right now."
              />
            </>
          ) : (
            <>
              <nav className={styles.jump} aria-labelledby="team-jump-label">
                <p id="team-jump-label" className={styles.jumpLabel}>
                  Team members
                </p>
                <ul className={styles.jumpList} role="list">
                  {entries.map(({ member }) => (
                    <li key={member.id}>
                      {/*
                       * A plain same-document anchor: it updates the URL, is
                       * shareable, works without JavaScript, and lets the
                       * browser own the scrolling (`scroll-margin-top` handles
                       * the fixed header).
                       */}
                      <a className={styles.jumpLink} href={`#${member.slug}`}>
                        {member.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className={styles.members}>
                {entries.map(({ member, hasDetail }) => (
                  <TeamMemberSection
                    key={member.id}
                    member={member}
                    policy={policy}
                    hasDetail={hasDetail}
                  />
                ))}
              </div>

              {/* Progressive enhancement only: moves focus to the target
                  heading after a hash navigation. Nothing depends on it. */}
              <TeamHashFocus />
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
