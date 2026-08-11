/**
 * `/insights/[slug]` — article detail (§12.2, §3.4, §21).
 *
 * Feature-flagged. `getPublishablePostSlugs()` already returns `[]` while the
 * `insights` flag is off in production, so a disabled feature statically
 * generates nothing at all; `requireFeature` then 404s any direct hit.
 *
 * The route only exists for posts the *production* policy would publish, so a
 * statically generated page can never be one the sitemap refuses to list.
 * External posts deliberately have no route here at all — `canPublishPostDetail`
 * rejects them, because the rebuild never creates a thin internal duplicate of
 * somebody else's article (§12.1). Preview still resolves any slug on demand,
 * which is how editors review unapproved records behind the draft banner.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishablePostSlugs, getSiteSettings } from "@/content";
import { canIndexPost } from "@/content/policy";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { PitchBanner } from "@/components/global/PitchBanner";
import { SeoJsonLd } from "@/components/global/SeoJsonLd";
import type { Crumb } from "@/components/global/Breadcrumbs";
import { ArticleDetail } from "@/components/insights/ArticleDetail";
import { resolveArticleAuthors } from "@/components/insights/authors";
import { requireFeature, resolveFeatureGate } from "@/components/insights/feature-gate";
import { INSIGHTS_PATH, INSIGHTS_TITLE } from "@/components/insights/labels";
import { deriveArticleDescription } from "@/components/insights/text";

type RouteParams = { slug: string };

export async function generateStaticParams(): Promise<RouteParams[]> {
  // Defaults to PRODUCTION_POLICY — the same gate the sitemap uses (§16.8).
  const slugs = await getPublishablePostSlugs();
  return slugs.map((slug) => ({ slug }));
}

function crumbsFor(title: string, slug: string): Crumb[] {
  return [
    { name: "Home", path: "/" },
    { name: INSIGHTS_TITLE, path: INSIGHTS_PATH },
    { name: title, path: `${INSIGHTS_PATH}/${slug}` },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gate = await resolveFeatureGate("insights");
  // Nothing may hint that a disabled route exists (§3.4).
  if (gate.hidden) return HIDDEN_ROUTE_METADATA;

  const view = await getPostBySlug(slug, gate.policy);
  // Nor that an unpublishable record exists.
  if (!view) return HIDDEN_ROUTE_METADATA;

  const settings = await getSiteSettings(gate.policy);

  return buildMetadata({
    settings,
    policy: gate.policy,
    path: `${INSIGHTS_PATH}/${view.post.slug}`,
    fallbackTitle: view.post.title,
    fallbackDescription: deriveArticleDescription(view, settings.defaultSeoDescription),
    seo: view.post.seo,
    noIndex: !canIndexPost(view.post, gate.policy),
    type: "article",
    publishedTime: view.post.publishedAt,
    modifiedTime: view.post.updatedAt ?? view.post.publishedAt,
    /* `view.authors` has already passed `canListTeamMemberPublicly`, so every
       name here is one the page itself renders. */
    authors: view.authors.map((author) => author.name),
  });
}

export default async function ArticlePage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const policy = await requireFeature("insights");

  const view = await getPostBySlug(slug, policy);
  if (!view) notFound();

  const [settings, authors] = await Promise.all([
    getSiteSettings(policy),
    resolveArticleAuthors(view.authors, policy),
  ]);

  const crumbs = crumbsFor(view.post.title, view.post.slug as string);

  return (
    <>
      <ArticleDetail view={view} policy={policy} crumbs={crumbs} authors={authors} />

      <SeoJsonLd
        data={[
          breadcrumbJsonLd(
            settings,
            crumbs.map((crumb) => ({ name: crumb.name, path: crumb.path })),
          ),
          articleJsonLd(settings, view),
        ]}
      />

      <PitchBanner />
    </>
  );
}
