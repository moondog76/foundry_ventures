/**
 * `robots.txt` (§21.4).
 *
 * Two jobs: point crawlers at the sitemap on the one canonical origin, and keep
 * them out of everything that is not public content.
 *
 * The disallow list is deliberately short and prefix-based:
 *  - `/api/` — every endpoint, including `/api/draft/*`. None of them render
 *    content, and the draft endpoints exist only to hand an editor a preview
 *    cookie. `next.config.ts` additionally serves them with
 *    `X-Robots-Tag: noindex, nofollow`, so this is the second of two locks.
 *  - `/preview` — reserved for any preview entry point that lands later. Naming
 *    it now means a future preview route cannot be indexed during the window
 *    between it shipping and someone remembering this file.
 *  - `/studio` — the CMS. A prefix rule, so `/studio/desk/...` is covered too.
 *
 * A preview deployment answers "disallow everything". A `robots.txt` that
 * invites indexing is far harder to undo than one that does not, and a preview
 * build renders unapproved records by design (§16.8).
 */

import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/content";
import { policyModeFromEnv, publicPolicyContext } from "@/content/context";
import { isIndexableDeployment } from "@/lib/seo/indexability";
import { absoluteUrl } from "@/lib/seo/metadata";

/*
 * Evaluated per request, not at build time.
 *
 * `robots.txt` is a tiny document, so the caching is worth nothing next to the
 * failure it prevents: a build that ran without `FOUNDRY_INDEXABLE` would
 * otherwise bake `Disallow: /` into production, or — far worse in the other
 * direction — a build that ran with it would bake `Allow` into a preview.
 * Reading the variable at request time means the crawler directive always
 * matches the environment actually serving it.
 */
export const dynamic = "force-dynamic";

const DISALLOWED_PREFIXES = ["/api/", "/api/draft/", "/preview", "/studio"];

/**
 * Mirrors the resolution order in `@/content/context`, minus the draft-mode
 * cookie: `robots.txt` is one document for everyone, so a single visitor's
 * cookie must not decide what it says.
 */
function isPreviewDeployment(): boolean {
  /*
   * Indexing is opt-in (see `@/lib/seo/indexability`). `NODE_ENV` is not a
   * usable signal here: Railway runs its preview with `NODE_ENV=production`,
   * which is precisely how an unfinished staging environment ended up serving
   * `index, follow` alongside draft legal copy (§2.9 defect 7).
   */
  if (!isIndexableDeployment()) return true;
  const override = policyModeFromEnv();
  if (override) return override.mode === "preview";
  return false;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isPreviewDeployment()) {
    // No sitemap reference either — nothing here is meant to be discovered.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const settings = await getSiteSettings(publicPolicyContext());

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PREFIXES,
      },
    ],
    sitemap: absoluteUrl(settings.canonicalOrigin, "/sitemap.xml"),
  };
}
