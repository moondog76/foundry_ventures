/**
 * XML sitemap (§21.4).
 *
 * Three rules govern every line below.
 *
 *  1. **The sitemap answers for the public site, never for the editor looking at
 *     it.** It resolves `publicPolicyContext()` explicitly rather than
 *     `resolvePolicyContext()`, so an editor with a draft-mode cookie can never
 *     cause unapproved records to be advertised to Google. Preview is `noindex`
 *     by definition (§16.8) and therefore has nothing to contribute here.
 *
 *  2. **Inclusion is decided by the same policy functions the routes use.**
 *     `getPublishableCompanySlugs`, `getPublishableTeamSlugs` and
 *     `getPublishablePostSlugs` are what `generateStaticParams` and the detail
 *     routes call, so a URL can never be listed here and 404 when fetched — nor
 *     the reverse. Drafts, unverified records, external-only posts (which have
 *     no internal route at all) and feature-flagged routes drop out inside those
 *     functions, not with a second set of `if`s here.
 *
 *  3. **`lastModified` is a claim, so it is only emitted where the data supports
 *     one.** A post carries `updatedAt`/`publishedAt` and a legal page carries
 *     `lastUpdated`; companies and team members carry no change timestamp at
 *     all. Stamping those with `new Date()` would tell crawlers the whole site
 *     changes on every deploy, which is false and actively harmful to crawl
 *     budget — so the field is simply absent.
 *
 * `changeFrequency` and `priority` are deliberately omitted: the major crawlers
 * ignore both, and inventing values for them would be inventing signal.
 *
 * The canonical root is `/`. `/home` is a legacy path that `src/proxy.ts`
 * 308s away, and it must never appear in this document.
 */

import type { MetadataRoute } from "next";
import { getLegalPage, getPublishableCompanySlugs, getSiteSettings } from "@/content";
import { publicPolicyContext } from "@/content/context";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * The sitemap is a public, cacheable document built from content, so it is
 * statically generated and re-derived hourly. `/api/revalidate` invalidates it
 * immediately when a document that appears in it is published (§4.3).
 */
export const revalidate = 3600;

type SitemapEntry = {
  path: string;
  /** ISO 8601, or absent when the record has no real change date. */
  lastModified?: string;
};

/**
 * Normalises a stored date to the W3C datetime the sitemap schema expects.
 * A malformed value yields `undefined` rather than an invented "now".
 */
function toChangeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const policy = publicPolicyContext();
  const settings = await getSiteSettings(policy);
  const { canonicalOrigin, featureFlags } = settings;

  /*
   * The public routes of §7.1. `/` is the canonical root — never `/home`.
   *
   * §12.5 asks for an explicit decision on `/privacy` rather than an automatic
   * `noindex`: public legal transparency itself supports institutional trust.
   * It is listed below, with an honest `lastModified` from the document's own
   * revision date.
   */
  const entries: SitemapEntry[] = [{ path: "/" }];
  // A hidden route is absent here for the same reason it is absent from the
  // navigation: the sitemap is where a site says what it wants found.
  if (featureFlags.portfolio) entries.push({ path: "/portfolio" });
  if (featureFlags.fund) entries.push({ path: "/fund" });

  // The privacy notice is a real document with a real revision date, so it can
  // carry an honest `lastModified`. It is listed only when the record exists.
  const privacy = await getLegalPage("privacy");
  if (privacy) {
    entries.push({ path: "/privacy", lastModified: toChangeDate(privacy.lastUpdated) });
  }

  // Company detail routes live under `/portfolio`, so hiding the archive hides
  // them too — listing a child of a page nobody can navigate to is worse than
  // listing neither.
  const companySlugs = featureFlags.portfolio ? await getPublishableCompanySlugs(policy) : [];

  // Sorted so the generated XML is byte-stable between builds and a diff of the
  // sitemap shows real content changes rather than iteration order.
  for (const slug of [...companySlugs].sort()) {
    // Company records carry no change timestamp — no `lastModified` is claimed.
    entries.push({ path: `/portfolio/${slug}` });
  }


  return entries.map(({ path, lastModified }) => ({
    // One origin for canonical tags, JSON-LD and this document (§21.1).
    url: absoluteUrl(canonicalOrigin, path),
    ...(lastModified ? { lastModified } : {}),
  }));
}
