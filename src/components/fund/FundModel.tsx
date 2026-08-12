/**
 * "Why the model looks like this" plus the three steps (§8.11.2).
 *
 * The steps describe *sequence*, never duration. §8.11 warns explicitly against
 * false timeline promises, and a published "decision in 14 days" that Foundry
 * misses once is worse than no number — so the content model has no field for
 * one and this component has nowhere to put it.
 */

import type { FundPage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { renderableText } from "@/components/home/text";
import styles from "./fund-model.module.css";

export type FundModelProps = {
  model: FundPage["model"];
  policy: PolicyContext;
};

export function FundModel({ model, policy }: FundModelProps) {
  const heading = renderableText(model.heading, policy);
  const body = renderableText(model.body, policy);
  const steps = model.steps
    .map((step) => ({
      number: step.number,
      title: renderableText(step.title, policy),
      body: renderableText(step.body, policy),
    }))
    .filter((step): step is { number: string; title: string; body: string } =>
      Boolean(step.title && step.body),
    );

  if (!heading && !body && steps.length === 0) return null;

  return (
    <Section surface="light" aria-labelledby="fund-model-heading">
      <Container>
        <Reveal>
          <div className={styles.split}>
            {heading ? (
              <h2 id="fund-model-heading" className={styles.heading}>
                {heading}
              </h2>
            ) : null}
            {body ? <p className={styles.body}>{body}</p> : null}
          </div>
        </Reveal>

        {steps.length > 0 ? (
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <Reveal
                as="li"
                key={step.number}
                className={styles.step}
                // §10.3 allows a short stagger; 70ms per item keeps the whole
                // sequence inside the 560ms reveal budget for three steps.
                delay={index * 70}
              >
                {/* The ordered list already conveys sequence to assistive
                    technology, so the printed numeral is decorative. */}
                <span className={styles.number} aria-hidden="true">
                  {step.number}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </Reveal>
            ))}
          </ol>
        ) : null}
      </Container>
    </Section>
  );
}
