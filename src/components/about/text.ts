/**
 * Editorial-copy helpers for `/about` (§13, §16.8).
 *
 * Every CMS string on this page passes through `canRenderEditorialText` exactly
 * once, here, so no section re-implements the publishing rule. In production the
 * seed's `unapproved` copy resolves to `null` and the calling section hides
 * itself rather than rendering a stub — that is the intended behaviour, not a
 * bug (§25.1).
 */

import { canRenderEditorialText, type PolicyContext } from "@/content/policy";
import type { AboutPage, EditorialText } from "@/content/types";
import { collapseWhitespace, truncateAtWord } from "@/components/insights/text";

/** The route's own name. Matches `SiteSettings.navigation` and the breadcrumb. */
export const ABOUT_TITLE = "About";

export const ABOUT_PATH = "/about";

/** The string when policy allows it to render, otherwise null. */
export function renderableText(
  text: EditorialText | undefined,
  policy: PolicyContext,
): string | null {
  // The value is passed through untouched: whitespace normalisation is an
  // import-time decision recorded on the record itself (§16.1.1), never a
  // render-time one.
  return canRenderEditorialText(text, policy) ? (text as EditorialText).value : null;
}

/** Only the paragraphs policy allows, in their authored order. */
export function renderableTexts(
  texts: readonly EditorialText[] | undefined,
  policy: PolicyContext,
): string[] {
  return (texts ?? [])
    .filter((text) => canRenderEditorialText(text, policy))
    .map((text) => text.value);
}

/** A `{ title, body }` pair reduced to whatever policy actually allows. */
export type AboutStatement = { title: string | null; body: string | null };

export function renderableStatements(
  items: ReadonlyArray<{ title: EditorialText; body: EditorialText }>,
  policy: PolicyContext,
): AboutStatement[] {
  return (
    items
      .map((item) => ({
        title: renderableText(item.title, policy),
        body: renderableText(item.body, policy),
      }))
      // A pair whose title and body are both unapproved contributes nothing; one
      // that kept either half is still a real, publishable statement.
      .filter((item) => item.title !== null || item.body !== null)
  );
}

/**
 * Descending specificity, each candidate already policy-gated:
 *   the first approved intro paragraph → the site-level description.
 */
export function deriveAboutDescription(
  about: AboutPage,
  policy: PolicyContext,
  fallback: string,
): string {
  const intro = renderableTexts(about.intro, policy)
    .map(collapseWhitespace)
    .find((paragraph) => paragraph.length > 0);
  return intro ? truncateAtWord(intro) : fallback;
}
