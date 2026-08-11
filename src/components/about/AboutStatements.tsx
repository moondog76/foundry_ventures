/**
 * A titled section of `{ title, body }` statements (§13).
 *
 * Used twice on `/about`: "What we believe" (the principles) and "What we look
 * for". Both are the same editorial shape, so they are the same component rather
 * than two near-identical ones.
 *
 * `sticky` opts the heading column into a desktop-only pinned treatment. It is
 * pure CSS — no scroll listener, no transform driven by scroll position — so it
 * cannot fight the reader's own scrolling, and it is disabled below 992px and on
 * short viewports where a pinned heading would eat the reading area (§19.3).
 * Nothing about the content depends on it: with the sticky rule removed the
 * section is still an ordinary heading followed by its statements.
 */

import { Container, Section, cx } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import type { AboutStatement } from "./text";
import styles from "./about.module.css";

export type AboutStatementsProps = {
  /**
   * Structural section label from §13. It names a region of the page rather
   * than making a claim, which is why it is a constant and not CMS copy — the
   * same rule the archive `h1`s follow.
   */
  title: string;
  headingId: string;
  statements: AboutStatement[];
  sticky?: boolean;
  surface?: "light" | "off-white";
};

export function AboutStatements({
  title,
  headingId,
  statements,
  sticky = false,
  surface = "light",
}: AboutStatementsProps) {
  // Nothing approved: the whole section disappears rather than framing an empty
  // list (§25.1).
  if (statements.length === 0) return null;

  return (
    <Section surface={surface} aria-labelledby={headingId}>
      <Container>
        <div className={styles.split}>
          <div className={cx(styles.splitHeading, sticky && styles.splitHeadingSticky)}>
            <Reveal>
              <h2 id={headingId} className={styles.sectionHeading}>
                {title}
              </h2>
            </Reveal>
          </div>

          <ul className={styles.statementList} role="list">
            {statements.map((statement, index) => (
              <Reveal
                as="li"
                key={statement.title ?? statement.body ?? index}
                className={styles.statement}
                /* Stagger capped at four steps so the last card never lags (§5.6). */
                delay={Math.min(index, 3) * 70}
              >
                {statement.title ? (
                  <h3 className={styles.statementTitle}>{statement.title}</h3>
                ) : null}
                {statement.body ? <p className={styles.statementBody}>{statement.body}</p> : null}
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
