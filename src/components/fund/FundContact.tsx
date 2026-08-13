/**
 * The fund page's closing contact block (§8.11.4).
 *
 * Deliberately says that founders and prospective investors reach the same
 * person. Inventing a separate investor-relations desk would be inventing an
 * organisation, which §0.6 forbids and which any LP would discover in one email.
 */

import type { FundPage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { canPublishTeamField } from "@/content/policy";
import { getContactPeople, teamContactChannels } from "@/content";
import { Container, Section } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { renderableText } from "@/components/home/text";
import styles from "./fund-contact.module.css";

export type FundContactProps = {
  contact: FundPage["contact"];
  policy: PolicyContext;
};

export async function FundContact({ contact, policy }: FundContactProps) {
  const heading = renderableText(contact.heading, policy);
  const body = renderableText(contact.body, policy);

  const people = await getContactPeople(policy);
  const person = people.find((member) => member.id === contact.contactPerson.id);
  const email = person ? teamContactChannels(person, policy).email : undefined;

  /*
   * The portrait goes through the same policy gate as every other field, so an
   * unapproved or rights-unverified image simply does not render — the section
   * then falls back to the single-column layout rather than reserving an empty
   * frame for a face that is not there.
   */
  const portrait =
    person && canPublishTeamField(person, "portrait", policy) ? person.portrait : undefined;

  if (!heading && !body && !email) return null;

  return (
    <Section surface="off-white" spacing="tight" aria-labelledby="fund-contact-heading">
      <Container>
        <Reveal>
          <div className={styles.layout} data-has-portrait={portrait ? "true" : "false"}>
            {portrait ? (
              <ResponsiveImage
                image={portrait}
                policy={policy}
                /*
                 * The name is printed directly beneath, so a screen reader that
                 * announced it twice would be describing the same fact twice.
                 * §12.10: decorative when the meaning is carried in text.
                 */
                alt=""
                sizes="(min-width: 768px) 18rem, 60vw"
                frameClassName={styles.portrait}
              />
            ) : null}

            <div className={styles.block}>
            {heading ? (
              <h2 id="fund-contact-heading" className={styles.heading}>
                {heading}
              </h2>
            ) : null}
            {body ? <p className={styles.body}>{body}</p> : null}
            {/* §8.8: show the real address on larger screens so the destination
                is transparent rather than hidden behind a label. */}
            {email ? (
              <a className={styles.email} href={`mailto:${email}`}>
                {email}
              </a>
            ) : null}
            {person ? (
              <p className={styles.person}>
                <span className={styles.personName}>{person.name}</span>
                <span className={styles.personRole}>{person.role}</span>
              </p>
            ) : null}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
