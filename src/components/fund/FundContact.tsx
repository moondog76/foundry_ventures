/**
 * The fund page's closing contact block (§8.11.4).
 *
 * Deliberately says that founders and prospective investors reach the same
 * person. Inventing a separate investor-relations desk would be inventing an
 * organisation, which §0.6 forbids and which any LP would discover in one email.
 */

import type { FundPage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { getContactPeople, teamContactChannels } from "@/content";
import { Container, Section } from "@/components/ui";
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

  if (!heading && !body && !email) return null;

  return (
    <Section surface="off-white" spacing="tight" aria-labelledby="fund-contact-heading">
      <Container>
        <Reveal>
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
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
