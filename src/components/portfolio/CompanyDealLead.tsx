/**
 * Deal lead (§9.1, §10.2).
 *
 * The relation is canonical on the company (`Company.dealLead`), and the content
 * layer has already resolved it to a listable `TeamMember`. Two rules matter:
 *
 *  - the name links to `/team/[slug]` **only** when that route actually exists.
 *    `teamMemberHasDetail` is the single source of truth for that; a thin
 *    profile has no page, and linking to one would produce a 404 in production.
 *    When there is no page we render the name as plain text rather than invent a
 *    destination;
 *  - the portrait is gated on its own evidence and rights, so a member without a
 *    cleared portrait simply has no image — never a silhouette stand-in.
 */

import Link from "next/link";
import { canPublishTeamField, canRenderImage, type PolicyContext } from "@/content/policy";
import type { TeamMember } from "@/content/types";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import styles from "./company-deal-lead.module.css";

export function CompanyDealLead({
  member,
  hasDetailPage,
  policy,
  headingId,
}: {
  member: TeamMember | null;
  hasDetailPage: boolean;
  policy: PolicyContext;
  headingId: string;
}) {
  if (!member) return null;

  const portrait =
    canPublishTeamField(member, "portrait", policy) && canRenderImage(member.portrait, policy)
      ? member.portrait
      : null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Deal lead
      </h2>
      <div className={styles.person}>
        {portrait ? (
          <ResponsiveImage
            image={portrait}
            policy={policy}
            alt=""
            sizes="72px"
            fit="cover"
            frameClassName={styles.portrait}
          />
        ) : null}
        <div className={styles.identity}>
          <p className={styles.name}>
            {hasDetailPage ? <Link href={`/team/${member.slug}`}>{member.name}</Link> : member.name}
          </p>
          <p className={styles.role}>{member.role}</p>
        </div>
      </div>
    </section>
  );
}
