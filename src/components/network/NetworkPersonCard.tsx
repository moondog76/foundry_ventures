/**
 * Network person card (§14, §19.4.1).
 *
 * Every field is gated on its own evidence, so a partially approved record
 * degrades field by field instead of disappearing. Name and role line are
 * guaranteed present: `canListNetworkPersonPublicly` already required both to be
 * owner-approved before the person could reach this component in production.
 *
 * The card is deliberately not a link — there is no person detail route in the
 * network IA — so the only interactive element is the LinkedIn link, which
 * carries its own 44px target and its own accessible name.
 *
 * Grayscale-to-colour on the portrait is decoration only: it is gated behind a
 * real hover-capable pointer, mirrored on `:focus-within` so keyboard users get
 * the same response, and it hides no information. Everything that matters —
 * name, role, verticals, expertise — is visible without hover (§20.2).
 */

import { canRenderEvidence, type PolicyContext } from "@/content/policy";
import type { NetworkPerson } from "@/content/types";
import { Tag } from "@/components/ui";
import { ExternalLink } from "@/components/global/ExternalLink";
import { LinkedInIcon } from "@/components/global/icons";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import styles from "./network-person-card.module.css";

export type NetworkPersonCardProps = {
  person: NetworkPerson;
  policy: PolicyContext;
  sizes?: string;
  priority?: boolean;
};

const DEFAULT_SIZES =
  "(min-width: 1440px) 340px, (min-width: 992px) 23vw, (min-width: 768px) 45vw, 92vw";

export function NetworkPersonCard({
  person,
  policy,
  sizes = DEFAULT_SIZES,
  priority = false,
}: NetworkPersonCardProps) {
  const roleLine = person.roleLine.trim();
  const portrait = canRenderEvidence(person.fieldEvidence.image, policy) ? person.image : undefined;
  const verticals = canRenderEvidence(person.fieldEvidence.verticals, policy)
    ? person.verticals
    : [];
  const expertise = canRenderEvidence(person.fieldEvidence.expertise, policy)
    ? person.expertise
    : [];
  const linkedinUrl = canRenderEvidence(person.fieldEvidence.linkedinUrl, policy)
    ? person.linkedinUrl
    : undefined;

  return (
    <article className={styles.card}>
      <ResponsiveImage
        image={portrait}
        policy={policy}
        /* Informative: the picture shows who this is. */
        alt={roleLine ? `${person.name}, ${roleLine}` : person.name}
        sizes={sizes}
        priority={priority}
        fit="cover"
        frameClassName={styles.portrait}
        className={styles.portraitImage}
        /* No rights-cleared portrait: the deliberate typographic surface, never
           a stand-in photo (§19.4.1). */
        fallbackLabel={person.name}
        fallbackMeta={roleLine || undefined}
      />

      <div className={styles.body}>
        <h4 className={styles.name}>{person.name}</h4>
        {roleLine ? <p className={styles.role}>{roleLine}</p> : null}

        {verticals.length > 0 ? (
          <div className={styles.taxonomy}>
            <p className={styles.taxonomyLabel}>Verticals</p>
            <ul className={styles.tags} role="list">
              {verticals.map((vertical) => (
                <li key={vertical.slug}>
                  <Tag className={styles.tag}>{vertical.title}</Tag>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {expertise.length > 0 ? (
          <div className={styles.taxonomy}>
            <p className={styles.taxonomyLabel}>Expertise</p>
            <ul className={styles.tags} role="list">
              {expertise.map((item) => (
                <li key={item.slug}>
                  <Tag className={styles.tag}>{item.title}</Tag>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {linkedinUrl ? (
          <p className={styles.contact}>
            <ExternalLink
              href={linkedinUrl}
              className={styles.linkedin}
              showIcon={false}
              /* The visible word "LinkedIn" repeats on every card, so the
                 accessible name names the person too (§20.1). */
              aria-label={`${person.name} on LinkedIn`}
            >
              <LinkedInIcon size={16} />
              <span>LinkedIn</span>
            </ExternalLink>
          </p>
        ) : null}
      </div>
    </article>
  );
}
