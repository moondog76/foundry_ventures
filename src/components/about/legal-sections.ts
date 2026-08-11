/**
 * Section splitting for the legal template (§15.1).
 *
 * A legal document needs a table of contents, and a table of contents needs
 * anchors. `RichTextRenderer` deliberately emits no heading ids, and inventing a
 * TOC whose links point at `#` would be exactly the dead-link pattern the build
 * contract forbids.
 *
 * So the body is split at every `h2` and each chunk is rendered inside a
 * `<section id>` this module owns. The heading itself still goes through
 * `RichTextRenderer` — nothing about the rich-text pipeline is bypassed — and
 * the anchor target is the wrapper. The result is a real, server-rendered,
 * JavaScript-free TOC.
 *
 * Slugs are derived from the heading text an editor actually wrote, so a
 * shared link stays stable as long as the heading does.
 */

import type { RichText, RichTextBlock } from "@/content/types";

export type LegalSection = {
  /** Anchor id, or null for the preamble that precedes the first `h2`. */
  id: string | null;
  /** The heading text, or null for the preamble. */
  title: string | null;
  blocks: RichText;
};

/** Lowercase, alphanumeric-and-hyphen, no leading/trailing or repeated hyphens. */
export function slugifyHeading(text: string): string {
  return (
    text
      .normalize("NFKD")
      // Strip combining marks so an accented heading still yields an ASCII anchor.
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function headingText(block: Extract<RichTextBlock, { type: "heading" }>): string {
  return block.spans
    .map((span) => span.text)
    .join("")
    .trim();
}

/**
 * Splits a rich-text body into one section per `h2`. Blocks before the first
 * `h2` become an unnamed preamble; a document with no `h2` at all yields a
 * single preamble section, and the caller then renders no TOC.
 */
export function splitLegalSections(body: RichText): LegalSection[] {
  const sections: LegalSection[] = [];
  const used = new Map<string, number>();

  const nextId = (title: string, index: number): string => {
    const base = slugifyHeading(title) || `section-${index + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    // Two identically titled headings would otherwise share an id, which would
    // silently break the second anchor.
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };

  for (const block of body) {
    if (block.type === "heading" && block.level === 2) {
      const title = headingText(block);
      sections.push({ id: nextId(title, sections.length), title, blocks: [block] });
      continue;
    }

    const current = sections[sections.length - 1];
    if (current) {
      current.blocks.push(block);
    } else {
      sections.push({ id: null, title: null, blocks: [block] });
    }
  }

  return sections;
}

/** Only the sections that can actually be linked to. */
export function tableOfContents(sections: LegalSection[]): Array<{ id: string; title: string }> {
  return sections
    .filter((section): section is LegalSection & { id: string; title: string } =>
      Boolean(section.id && section.title),
    )
    .map((section) => ({ id: section.id, title: section.title }));
}
