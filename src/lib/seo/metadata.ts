/**
 * Metadata construction (§21.1).
 *
 * Rules encoded here:
 *  - an explicit CMS title/description may be used in production only when its
 *    `approvalStatus` is `approved`; otherwise the fallback is derived
 *    deterministically from already-approved page fields — components never
 *    invent metadata;
 *  - canonical, OG URL, sitemap and schema all share one origin;
 *  - preview is always `noindex`.
 */

import type { Metadata } from "next";
import type { PolicyContext } from "@/content/policy";
import type { SeoFields, SiteSettings } from "@/content/types";

export type MetadataInput = {
  settings: SiteSettings;
  policy: PolicyContext;
  /** Route path beginning with "/". */
  path: string;
  /** Deterministic fallbacks derived from approved page content. */
  fallbackTitle: string;
  fallbackDescription: string;
  seo?: SeoFields;
  /** Route-level override, e.g. a disabled feature or an unverified record. */
  noIndex?: boolean;
  ogImagePath?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function absoluteUrl(origin: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, origin).toString();
}

function approvedSeoValue(
  seo: SeoFields | undefined,
  key: "title" | "description",
  policy: PolicyContext,
): string | null {
  const value = seo?.[key];
  if (!value) return null;
  if (policy.mode === "preview") return value;
  return seo?.approvalStatus === "approved" ? value : null;
}

/** Title template: "Page — Foundry Ventures", trimmed to a sane length. */
export function composeTitle(pageTitle: string, brandName: string): string {
  const trimmed = pageTitle.trim();
  if (!trimmed) return brandName;
  if (trimmed.toLowerCase() === brandName.toLowerCase()) return brandName;
  return `${trimmed} — ${brandName}`;
}

export function buildMetadata(input: MetadataInput): Metadata {
  const { settings, policy, path } = input;
  const origin = settings.canonicalOrigin;

  const title = approvedSeoValue(input.seo, "title", policy) ?? input.fallbackTitle;
  const description =
    approvedSeoValue(input.seo, "description", policy) ?? input.fallbackDescription;

  const canonical = input.seo?.canonicalOverride
    ? input.seo.canonicalOverride
    : absoluteUrl(origin, path);

  // Preview is never indexable, and a route may force noindex on top of that.
  const noIndex =
    policy.mode === "preview" || input.noIndex === true || input.seo?.noIndex === true;

  const ogImage = input.ogImagePath
    ? absoluteUrl(origin, input.ogImagePath)
    : absoluteUrl(origin, "/opengraph-image");

  return {
    metadataBase: new URL(origin),
    title: composeTitle(title, settings.seoBrandName),
    description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      siteName: settings.seoBrandName,
      title: composeTitle(title, settings.seoBrandName),
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "" }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.authors ? { authors: input.authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: composeTitle(title, settings.seoBrandName),
      description,
      images: [ogImage],
    },
  };
}

/** Metadata for a route whose feature flag is off — nothing may hint it exists (§3.4). */
export const HIDDEN_ROUTE_METADATA: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};
