/**
 * `/about` — how Foundry thinks and how it works (§13, §3.4).
 *
 * Feature-flagged. With `about` off the route 404s in production and returns
 * `HIDDEN_ROUTE_METADATA`, but still renders for an editor in preview — see
 * `requireFeature`.
 *
 * Server component with no interactivity: the page is a document, and the only
 * desktop enhancement (a sticky heading column) is pure CSS.
 */

import type { Metadata } from "next";
import { getAboutPage, getSiteSettings } from "@/content";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { PitchBanner } from "@/components/global/PitchBanner";
import { AboutView } from "@/components/about/AboutView";
import {
  ABOUT_PATH,
  ABOUT_TITLE,
  deriveAboutDescription,
  renderableText,
} from "@/components/about/text";
import { requireFeature, resolveFeatureGate } from "@/components/insights/feature-gate";

export async function generateMetadata(): Promise<Metadata> {
  const gate = await resolveFeatureGate("about");
  // Nothing may hint that a disabled route exists (§3.4).
  if (gate.hidden) return HIDDEN_ROUTE_METADATA;

  const [settings, about] = await Promise.all([getSiteSettings(gate.policy), getAboutPage()]);

  return buildMetadata({
    settings,
    policy: gate.policy,
    path: ABOUT_PATH,
    // The approved page heading when there is one, otherwise the route's own
    // navigation label. Both are existing facts; nothing is composed here.
    fallbackTitle: renderableText(about.heading, gate.policy) ?? ABOUT_TITLE,
    fallbackDescription: deriveAboutDescription(about, gate.policy, settings.defaultSeoDescription),
    seo: about.seo,
  });
}

export default async function AboutRoute() {
  const policy = await requireFeature("about");
  const about = await getAboutPage();

  return (
    <>
      <AboutView about={about} policy={policy} />
      <PitchBanner />
    </>
  );
}
