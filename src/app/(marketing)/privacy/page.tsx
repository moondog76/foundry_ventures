/**
 * `/privacy` — the privacy notice (§15.1).
 *
 * Deliberately NOT feature-flagged: a privacy notice is linked from the footer's
 * legal navigation and must resolve for every visitor, in every policy mode. Its
 * publishing decision belongs to the content layer — when `getLegalPage`
 * has no `privacy` document the route 404s rather than rendering an empty shell
 * or, worse, boilerplate nobody wrote.
 *
 * The template itself is shared (`LegalDocument`), so a second legal document
 * needs a route file and nothing else.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalPage, getSiteSettings } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { HIDDEN_ROUTE_METADATA, buildMetadata } from "@/lib/seo/metadata";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { deriveRichTextDescription } from "@/components/legal/text";

const PRIVACY_SLUG = "privacy";
const PRIVACY_PATH = "/privacy";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const [settings, page] = await Promise.all([getSiteSettings(policy), getLegalPage(PRIVACY_SLUG)]);
  // Nothing may hint that a document which does not exist could exist (§3.4).
  if (!page) return HIDDEN_ROUTE_METADATA;

  return buildMetadata({
    settings,
    policy,
    path: PRIVACY_PATH,
    // The document's own title, and its own opening words — no metadata is
    // composed here (§21.1).
    fallbackTitle: page.title,
    fallbackDescription: deriveRichTextDescription(page.body, settings.defaultSeoDescription),
    seo: page.seo,
  });
}

export default async function PrivacyPage() {
  const policy = await resolvePolicyContext();
  const page = await getLegalPage(PRIVACY_SLUG);
  if (!page) notFound();

  /*
   * No `PitchBanner` here. A legal notice is a reference document, not a
   * conversion surface, and a "Pitch us" panel below a data-protection notice
   * would be tonally wrong (§15.1).
   */
  return <LegalDocument page={page} policy={policy} />;
}
