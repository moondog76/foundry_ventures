/**
 * Honest fallback for `/pitch` (§11.3, §30).
 *
 * Rendered instead of the form when `checkPitchReadiness()` reports a problem in
 * production — no recipient, no durable store, no escalation address. A form
 * that accepts a founder's pitch and then drops it is worse than no form, so the
 * page says so and hands over the contact routes that are actually verified.
 *
 * `contacts` is resolved by the page from `getContactPeople()` and
 * `teamContactChannels()`, so only addresses that cleared the publishing policy
 * ever reach this component. When none did, no channel is invented here — the
 * component simply points at the footer, which is present on every route.
 */

import styles from "./pitch-page.module.css";

export type PitchContact = {
  id: string;
  name: string;
  /** Only set when the person's role cleared the policy. */
  role: string | null;
  /** The address as written, for the visible link text. */
  email: string;
  /** The sanitised `mailto:` href. */
  href: string;
};

export function PitchUnavailable({
  contacts,
  headingId,
}: {
  contacts: PitchContact[];
  headingId: string;
}) {
  return (
    <div className={styles.unavailable}>
      <h2 id={headingId} className={styles.unavailableHeading}>
        The pitch form is not available right now
      </h2>
      <p className={styles.unavailableBody}>
        {contacts.length > 0
          ? "Rather than take a submission we cannot guarantee to receive, we would rather you reached us directly."
          : "Rather than take a submission we cannot guarantee to receive, we have turned the form off. The contact details in the site footer still reach us."}
      </p>

      {contacts.length > 0 ? (
        <ul className={styles.contactList} role="list">
          {contacts.map((contact) => (
            <li key={contact.id} className={styles.contact}>
              <span className={styles.contactName}>{contact.name}</span>
              {contact.role ? <span className={styles.contactRole}>{contact.role}</span> : null}
              <a href={contact.href} className={styles.contactLink}>
                {contact.email}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
