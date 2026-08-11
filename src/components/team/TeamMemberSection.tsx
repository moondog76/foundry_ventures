/**
 * One person on the `/team` index (§10.1).
 *
 * DOM order is fixed and identical at every breakpoint:
 *
 *   name → role → portrait → short bio → actions
 *
 * That is exactly the mobile reading order, so no breakpoint reorders anything.
 * The desktop layout (sticky name on the left, sticky role on the right, the
 * portrait and bio scrolling between them) is achieved purely with grid
 * placement — no `order`, no duplicated markup, nothing that would make the
 * screen-reader sequence disagree with the visual one (§19.4).
 *
 * Every field is gated on its own evidence: a person with no approved portrait
 * gets the typographic Foundry surface rather than a stock silhouette, and a
 * person with no approved bio simply has no bio paragraph.
 *
 * `Read more` appears only when `/team/[slug]` actually exists for this person.
 * A profile without an approved long bio deliberately has no route (§10.2), and
 * linking to one would 404 in production.
 */

import type { TeamMember } from "@/content/types";
import { canPublishTeamField, type PolicyContext } from "@/content/policy";
import { ButtonLink } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { TeamContactLinks } from "./TeamContactLinks";
import styles from "./team-member-section.module.css";

export type TeamMemberSectionProps = {
  member: TeamMember;
  policy: PolicyContext;
  /** Resolved by the page with `teamMemberHasDetail` — never re-derived here. */
  hasDetail: boolean;
};

/**
 * The portrait column is at most 420px wide, so the browser never has to fetch a
 * full-bleed asset for it.
 */
const PORTRAIT_SIZES =
  "(min-width: 1440px) 420px, (min-width: 992px) 30vw, (min-width: 768px) 60vw, 88vw";

export function TeamMemberSection({ member, policy, hasDetail }: TeamMemberSectionProps) {
  const headingId = `${member.slug}-name`;
  const role = canPublishTeamField(member, "role", policy) ? member.role.trim() : null;
  const portrait = canPublishTeamField(member, "portrait", policy) ? member.portrait : undefined;
  const shortBio = canPublishTeamField(member, "shortBio", policy)
    ? member.shortBio?.trim()
    : undefined;

  return (
    <section id={member.slug} className={styles.member} aria-labelledby={headingId}>
      {/*
       * `tabindex="-1"` is in the server markup, not added by script: it takes
       * the heading out of the tab order but makes it programmatically
       * focusable, which is all `TeamHashFocus` needs. With JavaScript off the
       * attribute is inert and the anchor still works.
       */}
      <h2 id={headingId} className={styles.name} tabIndex={-1} data-team-anchor-heading="">
        {member.name}
      </h2>

      {role ? <p className={styles.role}>{role}</p> : null}

      <Reveal className={styles.stream}>
        <ResponsiveImage
          image={portrait}
          policy={policy}
          /* The portrait is informative — it shows who this is — so the alt
             names the person and their role. */
          alt={role ? `${member.name}, ${role}` : member.name}
          sizes={PORTRAIT_SIZES}
          fit="cover"
          frameClassName={styles.portrait}
          /* No rights-cleared portrait: the deliberate typographic surface,
             never a placeholder photo (§19.4.1). */
          fallbackLabel={member.name}
          fallbackMeta={role ?? undefined}
        />

        {shortBio ? <p className={styles.bio}>{shortBio}</p> : null}

        <div className={styles.actions}>
          <TeamContactLinks member={member} policy={policy} />
          {hasDetail ? (
            /* `ButtonLink` rather than `TextLink`: it already guarantees the
               44px target and owns its hover/focus/active states, so nothing
               here has to out-specify a primitive to stay accessible. */
            <ButtonLink href={`/team/${member.slug}`} variant="secondary">
              Read more
              {/* The visible words are identical for every person, so the
                  accessible name carries the distinguishing part. */}
              <span className="visually-hidden"> about {member.name}</span>
            </ButtonLink>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
