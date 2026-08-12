/**
 * Offering (§7.4).
 *
 * Carries the stable `#offering` anchor: `/offering` from the old Squarespace IA
 * 308-redirects to `/#offering` (§12.6), so this id is a published contract and
 * must not be renamed. `scroll-margin-top` keeps the target clear of the fixed
 * header.
 *
 * The four numbered items are statements, not destinations — there is no
 * offering detail surface, so the cards get no hover affordance that would imply
 * one.
 */

import type { HomePage } from "@/content/types";
import { type PolicyContext } from "@/content/policy";
import { Container, Section, cx } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { renderableText } from "./text";
import styles from "./offering-grid.module.css";

export type OfferingGridProps = {
  offering: HomePage["offering"];
  policy: PolicyContext;
};

export function OfferingGrid({ offering, policy }: OfferingGridProps) {
  const eyebrow = renderableText(offering.eyebrow, policy);
  const items = offering.items
    .map((item) => ({ number: item.number, body: renderableText(item.body, policy) }))
    .filter((item): item is { number: string; body: string } => item.body !== null);

  // No approved copy means no section — better than an empty anchored frame.
  if (items.length === 0) return null;

  return (
    <Section
      id="offering"
      surface="off-white"
      className={styles.section}
      aria-labelledby="offering-heading"
    >
      <Container>
        {eyebrow ? (
          <h2 id="offering-heading" className={cx("type-label", styles.eyebrowHeading)}>
            {eyebrow}
          </h2>
        ) : (
          // Structural label only; the authored eyebrow is the real heading.
          <h2 id="offering-heading" className="visually-hidden">
            Offering
          </h2>
        )}

        {items.length > 0 ? (
          <ol className={styles.items} role="list">
            {items.map((item, index) => (
              // Stagger capped at four steps so the last card never lags (§5.6).
              <Reveal
                as="li"
                key={item.number}
                className={styles.item}
                delay={Math.min(index, 3) * 70}
              >
                {/* The ordered list already conveys sequence; the printed numeral
                    is the visual treatment of that same fact, so it is hidden
                    from assistive technology to avoid a doubled announcement. */}
                <span className={styles.number} aria-hidden="true">
                  {item.number}
                </span>
                <p className={styles.body}>{item.body}</p>
              </Reveal>
            ))}
          </ol>
        ) : null}
      </Container>
    </Section>
  );
}
