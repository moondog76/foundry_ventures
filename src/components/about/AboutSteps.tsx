/**
 * A numbered sequence (§13).
 *
 * Used twice on `/about`: "How we work" (the four offerings, which carry a
 * number and a body) and the investment process (which additionally carries a
 * step title).
 *
 * A real `<ol>`: the sequence is part of the meaning, so it lives in the markup
 * rather than only in the printed numerals. Those numerals are the visual
 * treatment of the same fact and are therefore hidden from assistive technology
 * to avoid a doubled announcement.
 */

import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./about.module.css";

export type AboutStep = {
  /** The authored numeral, e.g. "01". Content, not a computed index. */
  number: string;
  title: string | null;
  body: string | null;
};

export type AboutStepsProps = {
  /** Structural section label from §13 — a region name, not a claim. */
  title: string;
  headingId: string;
  steps: AboutStep[];
  surface?: "light" | "off-white";
};

export function AboutSteps({ title, headingId, steps, surface = "off-white" }: AboutStepsProps) {
  // Nothing approved: the whole section disappears rather than framing an empty
  // list (§25.1).
  if (steps.length === 0) return null;

  return (
    <Section surface={surface} aria-labelledby={headingId}>
      <Container>
        <Reveal>
          <h2 id={headingId} className={styles.sectionHeading}>
            {title}
          </h2>
        </Reveal>

        <ol className={styles.stepList} role="list">
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.number}
              className={styles.step}
              delay={Math.min(index, 3) * 70}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                {step.number}
              </span>
              {step.title ? <h3 className={styles.stepTitle}>{step.title}</h3> : null}
              {step.body ? <p className={styles.stepBody}>{step.body}</p> : null}
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
