/**
 * `/team/[slug]` detail template (§10.2).
 *
 * Content order is fixed by the spec and identical in the DOM at every
 * breakpoint:
 *
 *   breadcrumb → name → role → portrait → long bio → expertise → contact
 *   → authored insights → portfolio companies led
 *
 * The desktop layout places the portrait beside the name and the expertise and
 * contact rail beside the bio with named grid areas — never by reordering the
 * markup, so the screen-reader sequence and the visual one agree (§19.4).
 *
 * The route only exists for a person with an approved long bio (§10.2), but
 * every other block is still gated on its own evidence: a profile without
 * approved expertise renders no expertise list, and one whose LinkedIn URL was
 * never verified renders no LinkedIn link. Nothing is stubbed, nothing reserves
 * empty space.
 */

import type { TeamMemberView } from "@/content/types";
import { canPublishTeamField, type PolicyContext } from "@/content/policy";
import { Breadcrumbs, type Crumb } from "@/components/global/Breadcrumbs";
import { Container, Section, Tag } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { Reveal } from "@/components/ui/Reveal";
import { TeamAuthoredPosts } from "./TeamAuthoredPosts";
import { TeamContactLinks } from "./TeamContactLinks";
import { TeamDealLeadCompanies } from "./TeamDealLeadCompanies";
import styles from "./team-profile.module.css";

export type TeamProfileProps = {
  view: TeamMemberView;
  policy: PolicyContext;
  crumbs: Crumb[];
};

const PORTRAIT_SIZES =
  "(min-width: 1440px) 480px, (min-width: 992px) 38vw, (min-width: 768px) 55vw, 88vw";

export function TeamProfile({ view, policy, crumbs }: TeamProfileProps) {
  const role = canPublishTeamField(view, "role", policy) ? view.role.trim() : null;
  const portrait = canPublishTeamField(view, "portrait", policy) ? view.portrait : undefined;
  const longBio = canPublishTeamField(view, "longBio", policy) ? view.longBio : undefined;
  const expertise = canPublishTeamField(view, "expertise", policy)
    ? (view.expertise ?? []).map((item) => item.trim()).filter((item) => item.length > 0)
    : [];

  const contact = (
    <TeamContactLinks
      member={view}
      policy={policy}
      heading="Contact"
      headingId="team-contact-label"
      className={styles.contact}
    />
  );

  return (
    <article className={styles.profile}>
      <Section spacing="tight" className={styles.heroSection}>
        <Container>
          <Breadcrumbs items={crumbs} />

          <div className={styles.hero}>
            <div className={styles.heroBody}>
              <h1 className={styles.name}>{view.name}</h1>
              {role ? <p className={styles.role}>{role}</p> : null}
            </div>

            <div className={styles.heroMedia}>
              <ResponsiveImage
                image={portrait}
                policy={policy}
                /* Informative: the picture shows who this is. */
                alt={role ? `${view.name}, ${role}` : view.name}
                sizes={PORTRAIT_SIZES}
                fit="cover"
                priority
                frameClassName={styles.portrait}
                /* No rights-cleared portrait: the deliberate typographic
                   surface, never a stand-in photo (§19.4.1). */
                fallbackLabel={view.name}
                fallbackMeta={role ?? undefined}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="tight" as="div">
        <Container>
          <div className={styles.body}>
            <Reveal className={styles.bio}>
              <RichTextRenderer value={longBio} policy={policy} className={styles.bioCopy} />
            </Reveal>

            <div className={styles.rail}>
              {expertise.length > 0 ? (
                <section className={styles.expertise} aria-labelledby="team-expertise">
                  <h2 id="team-expertise" className={styles.railHeading}>
                    Expertise
                  </h2>
                  <ul className={styles.expertiseList} role="list">
                    {expertise.map((item) => (
                      <li key={item}>
                        <Tag>{item}</Tag>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {contact}
            </div>
          </div>

          <TeamAuthoredPosts
            posts={view.authoredPosts}
            authorName={view.name}
            headingId="team-insights"
          />

          <TeamDealLeadCompanies
            companies={view.dealLeadCompanies}
            policy={policy}
            headingId="team-deal-lead"
          />
        </Container>
      </Section>
    </article>
  );
}
