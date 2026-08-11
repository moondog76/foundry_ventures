/**
 * Text helpers shared by the Insights, About and Privacy routes.
 *
 * Nothing here writes copy. Every function either reformats a string an editor
 * already wrote (whitespace, truncation, date presentation) or picks between
 * candidates that have already cleared the publishing policy. Truncation only
 * ever removes text — it never adds a word nobody wrote (§21.1, §25.1).
 */

import { richTextToPlainText } from "@/content";
import type { PostDetailView, RichText } from "@/content/types";

/** Search engines truncate around 160 characters; do it ourselves, on a word. */
const MAX_DESCRIPTION_LENGTH = 160;

/** Meta descriptions and social cards must not carry source line breaks. */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateAtWord(value: string, maxLength = MAX_DESCRIPTION_LENGTH): string {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  // Fall back to a hard cut only when the text has no space to break at, which
  // would otherwise throw away most of a very long single token.
  const head = lastSpace > maxLength / 2 ? clipped.slice(0, lastSpace) : clipped;
  return `${head.replace(/[\s,;:.–—-]+$/u, "")}…`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type FormattedDate = { label: string; dateTime: string };

/**
 * Formats an ISO date without constructing a `Date`, so the rendered day can
 * never shift by one depending on the server's timezone, and so the server and
 * any pre-render agree byte for byte.
 */
export function formatIsoDate(iso: string | null | undefined): FormattedDate | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return null;
  return { label: `${Number(day)} ${monthName} ${year}`, dateTime: `${year}-${month}-${day}` };
}

/**
 * Descending specificity, each candidate already policy-approved by the content
 * layer before it reaches this function:
 *   the post's own excerpt → the opening words of its body → the site default.
 */
export function deriveArticleDescription(view: PostDetailView, fallback: string): string {
  const excerpt = collapseWhitespace(view.post.excerpt ?? "");
  if (excerpt) return truncateAtWord(excerpt);

  const body = collapseWhitespace(richTextToPlainText(view.post.body));
  if (body) return truncateAtWord(body);

  return fallback;
}

/** First real paragraph of a rich-text document, for a legal page description. */
export function deriveRichTextDescription(body: RichText | undefined, fallback: string): string {
  const text = collapseWhitespace(richTextToPlainText(body));
  return text ? truncateAtWord(text) : fallback;
}
