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
import { absoluteUrl } from "@/lib/seo/metadata";

export const revalidate = 3600;

const DISALLOWED_PREFIXES = ["/api/", "/api/draft/", "/preview", "/studio"];

/**
 * Mirrors the resolution order in `@/content/context`, minus the draft-mode
 * cookie: `robots.txt` is one document for everyone, so a single visitor's
 * cookie must not decide what it says.
 */
function isPreviewDeployment(): boolean {
  const override = policyModeFromEnv();
  if (override) return override.mode === "preview";
  return process.env.NODE_ENV !== "production";
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
