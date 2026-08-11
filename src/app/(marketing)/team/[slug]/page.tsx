/**
 * `/team/[slug]` — person detail (§10.2, §21).
 *
 * The route only exists for people the *production* policy would publish, so a
 * statically generated page can never be one the sitemap refuses to list. A
 * person without an approved long bio deliberately has no page at all — thin
 * profiles are forbidden — and the team index links to `/team#slug` instead.
 *
 * Preview still resolves any slug on demand, which is how editors review
 * unapproved records behind the draft banner.
 *
 * The whole section sits behind the `team` feature flag, off since 2026-08-11 on
 * owner instruction, so in production this route 404s regardless.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishableTeamSlugs,
  getSiteSettings,
  getTeamMemberBySlug,
  teamContactChannels,
} from "@/content";
import { resolveFeatureGate } from "@/components/insights/feature-gate";
import { canIndexTeamMember } from "@/content/policy";
import type { TeamMember } from "@/content/types";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, personJsonLd } from "@/lib/seo/json-ld";
import { PitchBanner } from "@/components/global/PitchBanner";
import { SeoJsonLd } from "@/components/global/SeoJsonLd";
import type { Crumb } from "@/components/global/Breadcrumbs";
import { TEAM_TITLE } from "@/components/team/TeamIndex";
import { TeamProfile } from "@/components/team/TeamProfile";
import { deriveProfileDescription } from "@/components/team/text";

type RouteParams = { slug: string };

export async function generateStaticParams(): Promise<RouteParams[]> {
  // Defaults to PRODUCTION_POLICY — the same gate the sitemap uses (§16.8).
  // `getPublishableTeamSlugs` already returns nothing while the flag is off.
  const slugs = await getPublishableTeamSlugs();
  return slugs.map((slug) => ({ slug }));
}

function crumbsFor(name: string, slug: string): Crumb[] {
  return [
    { name: "Home", path: "/" },
    { name: TEAM_TITLE, path: "/team" },
    { name, path: `/team/${slug}` },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { policy, hidden } = await resolveFeatureGate("team");
  // Nothing may hint that a hidden route or an unpublishable record exists (§3.4).
  if (hidden) return HIDDEN_ROUTE_METADATA;
  const view = await getTeamMemberBySlug(slug, policy);
  if (!view) return HIDDEN_ROUTE_METADATA;

  const settings = await getSiteSettings(policy);

  return buildMetadata({
    settings,
    policy,
    path: `/team/${view.slug}`,
    fallbackTitle: view.name,
    fallbackDescription: deriveProfileDescription(view, policy, settings.defaultSeoDescription),
    seo: view.seo,
    noIndex: !canIndexTeamMember(view, policy),
  });
}

export default async function TeamMemberPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const { policy, hidden } = await resolveFeatureGate("team");
  if (hidden) notFound();
  const view = await getTeamMemberBySlug(slug, policy);
  if (!view) notFound();

  const settings = await getSiteSettings(policy);
  const crumbs = crumbsFor(view.name, view.slug);

  /*
   * `personJsonLd` reads `email` and `sameAs` straight off the record, so the
   * record it is given is the policy-filtered one: structured data must assert
   * exactly the same facts the page renders, never a channel whose evidence was
   * not approved (§16.3, §21.3).
   */
  const channels = teamContactChannels(view, policy);
  const publishableMember: TeamMember = {
    ...view,
    email: channels.email ?? undefined,
    phone: channels.phone ?? undefined,
    linkedinUrl: channels.linkedinUrl ?? undefined,
  };

  return (
    <>
      <TeamProfile view={view} policy={policy} crumbs={crumbs} />

      <SeoJsonLd
        data={[
          breadcrumbJsonLd(
            settings,
            crumbs.map((crumb) => ({ name: crumb.name, path: crumb.path })),
          ),
          personJsonLd(settings, publishableMember),
        ]}
      />

      <PitchBanner />
    </>
  );
}
