/**
 * Vision (§7.3).
 *
 * Migrated verbatim copy: eyebrow, one heading, three paragraphs. Asymmetric on
 * the 24-column desktop grid (heading left, body right); stacked on mobile.
 */

import type { HomePage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { Container, Section, SectionEyebrow } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { renderableText, renderableTexts } from "./text";
import styles from "./vision-section.module.css";

export type VisionSectionProps = {
  vision: HomePage["vision"];
  policy: PolicyContext;
};

export function VisionSection({ vision, policy }: VisionSectionProps) {
  const eyebrow = renderableText(vision.eyebrow, policy);
  const heading = renderableText(vision.heading, policy);
  const paragraphs = renderableTexts(vision.paragraphs, policy);

  // Nothing publishable — the section disappears rather than rendering a frame
  // around approved-but-empty content.
  if (!heading && paragraphs.length === 0) return null;

  return (
    <Section
      surface="light"
      aria-labelledby={heading ? "vision-heading" : undefined}
      aria-label={heading ? undefined : "Vision"}
    >
      <Container>
        <div className={styles.grid}>
          <div className={styles.headingColumn}>
            <Reveal>
              {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
              {heading ? (
                <h2 id="vision-heading" className={styles.heading}>
                  {heading}
                </h2>
              ) : null}
            </Reveal>
          </div>

          {paragraphs.length > 0 ? (
            <div className={styles.bodyColumn}>
              {paragraphs.map((paragraph, index) => (
                // Staggered, but capped: three short steps, never a long cascade (§5.6).
                <Reveal key={paragraph} delay={Math.min(index, 2) * 80}>
                  <p className={styles.paragraph}>{paragraph}</p>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
