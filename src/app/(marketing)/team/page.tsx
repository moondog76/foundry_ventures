/**
 * `/team` — the team index (§10.1).
 *
 * Server component. `getTeamMembers()` has already applied the publishing policy
 * and the canonical sort order, so this route neither filters nor re-sorts.
 *
 * Behind the `team` feature flag, off since 2026-08-11 on owner instruction: the
 * site has no team page and Anders appears in the contact block instead. The
 * route therefore 404s in production and stays previewable for editors, exactly
 * like Insights, About and Network (§3.4). Turning the flag back on restores the
 * route, the navigation entry and the sitemap entries together.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings, getTeamMembers, teamMemberHasDetail } from "@/content";
import { resolveFeatureGate } from "@/components/insights/feature-gate";
import { buildMetadata, HIDDEN_ROUTE_METADATA } from "@/lib/seo/metadata";
import { PitchBanner } from "@/components/global/PitchBanner";
import { TEAM_TITLE, TeamIndex, type TeamIndexEntry } from "@/components/team/TeamIndex";

const TEAM_PATH = "/team";

export async function generateMetadata(): Promise<Metadata> {
  const { policy, hidden } = await resolveFeatureGate("team");
  if (hidden) return HIDDEN_ROUTE_METADATA;
  const settings = await getSiteSettings(policy);

  return buildMetadata({
    settings,
    policy,
    path: TEAM_PATH,
    // The index's own name, and the site-level description — no page-specific
    // copy exists for this route and none is invented here (§21.1).
    fallbackTitle: TEAM_TITLE,
    fallbackDescription: settings.defaultSeoDescription,
  });
}

export default async function TeamPage() {
  const { policy, hidden } = await resolveFeatureGate("team");
  if (hidden) notFound();
  const [settings, members] = await Promise.all([getSiteSettings(policy), getTeamMembers(policy)]);

  // Whether `/team/[slug]` exists is a policy question, and `teamMemberHasDetail`
  // is its single source of truth. Resolved once, here, so the card components
  // never re-derive it — and so a "Read more" link can never point at a route
  // that would 404 in production (§10.2).
  const entries: TeamIndexEntry[] = await Promise.all(
    members.map(async (member) => ({
      member,
      hasDetail: await teamMemberHasDetail(member, policy),
    })),
  );

  return (
    <>
      <TeamIndex
        entries={entries}
        policy={policy}
        /* The only site-level statement that could ever introduce this page.
           It is a real content-layer record and is gated by
           `canRenderEditorialText`; nothing is written here. */
        introCandidates={[settings.brandStatement]}
      />

      <PitchBanner />
    </>
  );
}
