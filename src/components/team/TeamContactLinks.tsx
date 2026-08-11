/**
 * Contact channels for one person (§10.3, §16.3).
 *
 * Shared by the team index and the profile template so the publishing rules for
 * a person's contact data are expressed exactly once.
 *
 * What matters here:
 *  - the channels come from `teamContactChannels`, which is the single place the
 *    per-field evidence gate lives. A number that was never published (Julia's
 *    phone) is simply absent — it is never invented and never stubbed;
 *  - `mailtoHref` / `telHref` reject anything that is not a real address or a
 *    dialable number, so a malformed CMS value drops the link instead of
 *    rendering a dead `mailto:`;
 *  - every link says what it is and where it goes ("Email Anders Nygren", then
 *    the address itself). There is no bare icon: an icon-only contact link fails
 *    both the accessible-name requirement and the 44px target rule (§20.1, §20.2).
 */

import type { TeamMember } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { teamContactChannels } from "@/content";
import { mailtoHref, sanitizeWebUrl, telHref } from "@/lib/security/url";
import { ExternalLink } from "@/components/global/ExternalLink";
import { cx } from "@/components/ui";
import styles from "./team-contact-links.module.css";

export type TeamContactLinksProps = {
  member: TeamMember;
  policy: PolicyContext;
  /** Visible group label. Omit on the index, where each link is self-describing. */
  heading?: string;
  /** Required when `heading` is set — it becomes the list's accessible name. */
  headingId?: string;
  className?: string;
};

export function TeamContactLinks({
  member,
  policy,
  heading,
  headingId,
  className,
}: TeamContactLinksProps) {
  const channels = teamContactChannels(member, policy);
  const email = channels.email;
  const emailHref = mailtoHref(email);
  const phone = channels.phone;
  const phoneHref = telHref(phone);
  // Stricter than `sanitizeUrl`: a profile URL must be http(s) with a real host.
  const linkedinUrl = sanitizeWebUrl(channels.linkedinUrl);

  // Nothing approved to show: render nothing at all, not an empty "Contact" block.
  if (!emailHref && !phoneHref && !linkedinUrl) return null;

  const labelledBy = heading && headingId ? headingId : undefined;

  return (
    <div className={cx(styles.contact, className)}>
      {heading && headingId ? (
        <p id={headingId} className={styles.label}>
          {heading}
        </p>
      ) : null}

      <ul
        className={styles.list}
        role="list"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : `Ways to contact ${member.name}`}
      >
        {emailHref && email ? (
          <li className={styles.item}>
            <a className={styles.link} href={emailHref}>
              <span className={styles.linkLabel}>Email {member.name}</span>
              {/* The address is part of the link text so the destination is
                  visible before the click, not only in the status bar. */}
              <span className={styles.linkValue}>{email}</span>
            </a>
          </li>
        ) : null}

        {phoneHref && phone ? (
          <li className={styles.item}>
            <a className={styles.link} href={phoneHref}>
              <span className={styles.linkLabel}>Call {member.name}</span>
              <span className={styles.linkValue}>{phone}</span>
            </a>
          </li>
        ) : null}

        {linkedinUrl ? (
          <li className={styles.item}>
            <ExternalLink href={linkedinUrl} className={styles.externalLink}>
              {member.name} on LinkedIn
            </ExternalLink>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
