/**
 * Editorial-copy helpers for the home page (§7, §16.8).
 *
 * Every CMS string on this page passes through `canRenderEditorialText` exactly
 * once, here, so no section re-implements the publishing rule. In production the
 * seed's `unapproved` copy resolves to `null` and the calling section hides
 * itself rather than rendering a stub — that is the intended behaviour, not a
 * bug (§25.1).
 *
 * These are pure functions with no server-only imports, so client components
 * (the testimonial carousel) can use them too.
 */

import { canRenderEditorialText, type PolicyContext } from "@/content/policy";
import type { EditorialText, NavItem } from "@/content/types";

/** The string when policy allows it to render, otherwise null. */
export function renderableText(
  text: EditorialText | undefined,
  policy: PolicyContext,
): string | null {
  // The value is passed through untouched: whitespace normalisation is an import
  // -time decision recorded on the record itself (§16.1.1), never a render-time one.
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

/**
 * A destination's own navigation label, used as the deterministic fallback for
 * a CTA whose authored label is still unapproved. It comes from SiteSettings —
 * the same source the header renders — so nothing is invented here.
 */
export function navLabel(items: readonly NavItem[], href: string, fallback: string): string {
  return items.find((item) => item.href === href)?.label ?? fallback;
}
