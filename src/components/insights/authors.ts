/**
 * Author resolution for an article (§12.2, §10.2).
 *
 * Whether `/team/[slug]` exists is a policy question and `teamMemberHasDetail`
 * is its single source of truth. Resolving it once, here, means a byline can
 * never link to a route that would 404 in production — and a person without an
 * approved long bio simply renders as text rather than as a dead link.
 *
 * Role and short bio are gated on their own evidence, so a partially approved
 * record degrades field by field instead of disappearing.
 */

import { teamMemberHasDetail } from "@/content";
import { canPublishTeamField, type PolicyContext } from "@/content/policy";
import type { TeamMember } from "@/content/types";

export type ArticleAuthor = {
  id: string;
  name: string;
  role: string | null;
  shortBio: string | null;
  /** `/team/[slug]` when that route exists in this policy mode, else null. */
  href: string | null;
};

export async function resolveArticleAuthors(
  members: TeamMember[],
  policy: PolicyContext,
): Promise<ArticleAuthor[]> {
  return Promise.all(
    members.map(async (member) => {
      const role = canPublishTeamField(member, "role", policy) ? member.role.trim() : "";
      const shortBio = canPublishTeamField(member, "shortBio", policy)
        ? (member.shortBio ?? "").trim()
        : "";
      return {
        id: member.id,
        name: member.name,
        role: role || null,
        shortBio: shortBio || null,
        href: (await teamMemberHasDetail(member, policy)) ? `/team/${member.slug}` : null,
      };
    }),
  );
}
