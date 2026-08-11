/**
 * "Why we invested" (§9.1).
 *
 * Fully conditional: without approved rich text the component renders neither
 * the heading nor the surrounding spacing, so a company without a rationale has
 * no gap where one used to be.
 */

import type { PolicyContext } from "@/content/policy";
import type { RichText } from "@/content/types";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./why-we-invested.module.css";

export function WhyWeInvested({
  body,
  policy,
  headingId,
}: {
  /** Already policy-gated by the caller; undefined means "do not render". */
  body: RichText | undefined;
  policy: PolicyContext;
  headingId: string;
}) {
  if (!body?.length) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <Reveal className={styles.inner}>
        <h2 id={headingId} className={styles.heading}>
          Why we invested
        </h2>
        <RichTextRenderer value={body} policy={policy} className={styles.body} />
      </Reveal>
    </section>
  );
}
