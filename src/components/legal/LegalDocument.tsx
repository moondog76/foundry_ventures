/**
 * Shared legal-page template (§15.1).
 *
 * Used by `/privacy` and reusable by any further legal document without change:
 * title, "Last updated", an auto-generated table of contents, the body, and a
 * print treatment that drops every piece of screen chrome.
 *
 * NOTE ON LOCATION: this template lives in the About component directory because
 * that is this work package's home for institutional page templates. If a second
 * legal route is ever added, the integrator should move it (and
 * `legal-sections.ts`) to `src/components/legal/` — the API takes a `LegalPage`
 * and nothing else, so the move is a rename.
 *
 * Two deliberate decisions:
 *
 *  - the TOC only appears once the document is long enough to need one. A
 *    two-heading notice reads better without a navigation apparatus in front of
 *    it, and the threshold is a constant rather than a guess per page;
 *  - the anchors are real, server-rendered `<section id>` elements produced by
 *    `splitLegalSections`, not ids injected after hydration. The contents list
 *    therefore works with JavaScript disabled and in print preview, and no link
 *    can ever point at a target that does not exist.
 *
 * Legal text is rendered as authored. It is not `EditorialText` and carries no
 * per-field evidence, so the publishing decision for the document as a whole is
 * the route's (a legal notice is either published or it is not).
 */

import type { PolicyContext } from "@/content/policy";
import type { LegalPage } from "@/content/types";
import { Container, Section } from "@/components/ui";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { formatIsoDate } from "@/components/legal/text";
import { splitLegalSections, tableOfContents } from "./legal-sections";
import styles from "./legal-document.module.css";

export type LegalDocumentProps = {
  page: LegalPage;
  policy: PolicyContext;
};

/** Below this many linkable headings a contents list is noise, not navigation. */
const MIN_TOC_ENTRIES = 4;

export function LegalDocument({ page, policy }: LegalDocumentProps) {
  const sections = splitLegalSections(page.body);
  const contents = tableOfContents(sections);
  const showToc = contents.length >= MIN_TOC_ENTRIES;
  const updated = formatIsoDate(page.lastUpdated);

  return (
    <Section as="div" spacing="tight">
      {/* `narrow` caps the column at a long-form reading width; the rich-text
          module then holds paragraphs to ~60–75 characters inside it. */}
      <Container width="narrow">
        <article className={styles.document}>
          <header className={styles.header}>
            <h1 className={styles.title}>{page.title}</h1>
            {updated ? (
              <p className={styles.updated}>
                Last updated <time dateTime={updated.dateTime}>{updated.label}</time>
              </p>
            ) : null}
          </header>

          {showToc ? (
            <nav
              className={styles.toc}
              aria-labelledby="legal-contents"
              /* Screen navigation only: the printed document has the headings
                 themselves and page anchors mean nothing on paper. */
              data-print-hidden
            >
              <h2 id="legal-contents" className={styles.tocHeading}>
                Contents
              </h2>
              <ol className={styles.tocList}>
                {contents.map((entry) => (
                  <li key={entry.id} className={styles.tocItem}>
                    <a className={styles.tocLink} href={`#${entry.id}`}>
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className={styles.body}>
            {sections.map((section, index) =>
              section.id ? (
                <section key={section.id} id={section.id} className={styles.section}>
                  <RichTextRenderer value={section.blocks} policy={policy} />
                </section>
              ) : (
                <RichTextRenderer
                  key={`preamble-${index}`}
                  value={section.blocks}
                  policy={policy}
                />
              ),
            )}
          </div>
        </article>
      </Container>
    </Section>
  );
}
