/**
 * Root layout.
 *
 * Every public route gets: skip link first in the tab order, exactly one
 * `<main id="main-content">`, the site header, and the footer (§6.2, §6.3).
 */

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getSiteSettings } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/json-ld";
import { brandAssetPath } from "@/lib/brand/manifest";
import { SkipLink } from "@/components/global/SkipLink";
import { SiteHeader } from "@/components/global/SiteHeader";
import { SiteFooter } from "@/components/global/SiteFooter";
import { DraftModeBanner } from "@/components/global/DraftModeBanner";
import { SeoJsonLd } from "@/components/global/SeoJsonLd";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);
  return {
    ...buildMetadata({
      settings,
      policy,
      path: "/",
      fallbackTitle: settings.defaultSeoTitle,
      fallbackDescription: settings.defaultSeoDescription,
    }),
    // Square icons generated from the delivered blue symbol vector (§5.1).
    icons: {
      icon: [{ url: brandAssetPath("iconBlue"), type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);

  return (
    <html lang="en">
      <body>
        <SkipLink />
        <DraftModeBanner />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <SeoJsonLd
          data={[organizationJsonLd(settings, brandAssetPath("logoBlue")), webSiteJsonLd(settings)]}
        />
      </body>
    </html>
  );
}
