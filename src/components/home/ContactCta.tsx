/**
 * Contact CTA (§7.9).
 *
 * Foundry's own words over the ocean crop, then the real people behind them.
 * The people are resolved from Team by `getContactPeople()` and their channels
 * by `teamContactChannels()`, so a phone number that was never published (Julia)
 * is simply absent — nothing here is invented, and no person's details are
 * duplicated into this section's own content.
 *
 * This is the home page's own closing CTA, which is exactly why `PitchBanner`
 * must not also be rendered on this route (§6.3).
 */

import type { HomePage, ImageAsset, TeamMember } from "@/content/types";
import { canPublishTeamField, type PolicyContext } from "@/content/policy";
import { teamContactChannels } from "@/content";
import { mailtoHref, telHref } from "@/lib/security/url";
import { ButtonLink, Container } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { renderableText, renderableTexts } from "./text";
import styles from "./contact-cta.module.css";

export type ContactCtaProps = {
  contact: HomePage["contact"];
  people: TeamMember[];
  policy: PolicyContext;
  /** Background crop — the same deduplicated ocean asset the hero uses (§5.5). */
  image: ImageAsset;
  /** Nav-derived label used when the authored CTA label is unapproved. */
  primaryCtaFallbackLabel: string;
  /** False when the CTA's destination is behind a disabled flag (§3.4). */
  primaryCtaEnabled?: boolean;
};

export function ContactCta({
  contact,
  people,
  policy,
  image,
  primaryCtaFallbackLabel,
  primaryCtaEnabled = true,
}: ContactCtaProps) {
  const heading = renderableText(contact.heading, policy);
  const paragraphs = renderableTexts(contact.paragraphs, policy);
  const primaryLabel = renderableText(contact.primaryCta.label, policy) ?? primaryCtaFallbackLabel;

  // Secondary CTA: the same TeamMember record the list below renders, resolved
  // once. Without a publishable address there is no button — never a dead link.
  const secondaryPerson = people.find(
    (member) => member.id === contact.secondaryCta.contactPerson.id,
  );
  const secondaryEmail = secondaryPerson
    ? mailtoHref(teamContactChannels(secondaryPerson, policy).email)
    : null;
  const secondaryLabel =
    renderableText(contact.secondaryCta.label, policy) ??
    (secondaryPerson ? `Email ${secondaryPerson.name}` : null);

  const hasCopy = Boolean(heading) || paragraphs.length > 0;
  const hasPeople = people.length > 0;
  if (!hasCopy && !hasPeople) return null;

  return (
    <section
      className={styles.cta}
      data-surface="dark"
      aria-labelledby={heading ? "contact-cta-heading" : undefined}
      aria-label={heading ? undefined : "Contact"}
    >
      {/* Decorative: the heading carries the meaning. */}
      <ResponsiveImage
        image={image}
        policy={policy}
        alt=""
        sizes="100vw"
        frameClassName={styles.mediaFrame}
      />
      <div className={styles.overlay} aria-hidden="true" />

      <Container className={styles.container}>
        <div className={styles.grid}>
          <Reveal className={styles.intro}>
            {heading ? (
              <h2 id="contact-cta-heading" className={styles.heading}>
                {heading}
              </h2>
            ) : null}
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <div className={styles.actions}>
              {primaryCtaEnabled ? (
                <ButtonLink href={contact.primaryCta.href} onDark>
                  {primaryLabel}
                </ButtonLink>
              ) : null}
              {secondaryEmail && secondaryLabel ? (
                <ButtonLink
                  href={secondaryEmail}
                  variant={primaryCtaEnabled ? "secondary" : "primary"}
                  onDark
                >
                  {secondaryLabel}
                </ButtonLink>
              ) : null}
            </div>
          </Reveal>

          {hasPeople ? (
            <ul className={styles.people} role="list">
              {people.map((member) => {
                const channels = teamContactChannels(member, policy);
                const email = mailtoHref(channels.email);
                const phone = telHref(channels.phone);
                const role = canPublishTeamField(member, "role", policy) ? member.role : null;

                return (
                  <li key={member.id} className={styles.person}>
                    <p className={styles.personName}>{member.name}</p>
                    {role ? <p className={styles.personRole}>{role}</p> : null}
                    {email ? (
                      <p className={styles.personChannel}>
                        <a href={email} className={styles.channelLink}>
                          {channels.email}
                        </a>
                      </p>
                    ) : null}
                    {phone ? (
                      <p className={styles.personChannel}>
                        <a href={phone} className={styles.channelLink}>
                          {channels.phone}
                        </a>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
