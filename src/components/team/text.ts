/**
 * Metadata copy derived from a team record (§10.2, §21.1).
 *
 * `buildMetadata` refuses to invent a description, so the route has to hand it
 * one that is derived deterministically from already-approved fields. The order
 * below is descending specificity, and every candidate is gated on its own
 * evidence first:
 *
 *   approved short bio → the approved long bio's opening words → the approved
 *   site-level description
 *
 * Truncation only ever removes text; it never adds a word that an editor did not
 * write.
 */

import { richTextToPlainText } from "@/content";
import { canPublishTeamField, type PolicyContext } from "@/content/policy";
import type { TeamMember } from "@/content/types";

/** Search engines truncate around 160 characters; do it ourselves, on a word. */
const MAX_DESCRIPTION_LENGTH = 160;

/** Meta descriptions and social cards must not carry source line breaks. */
function collapseWhitespace(value: string): string {
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

export function deriveProfileDescription(
  member: TeamMember,
  policy: PolicyContext,
  fallback: string,
): string {
  const shortBio = canPublishTeamField(member, "shortBio", policy)
    ? collapseWhitespace(member.shortBio ?? "")
    : "";
  if (shortBio) return truncateAtWord(shortBio);

  const longBio = canPublishTeamField(member, "longBio", policy) ? member.longBio : undefined;
  const bioText = collapseWhitespace(richTextToPlainText(longBio));
  if (bioText) return truncateAtWord(bioText);

  return fallback;
}
