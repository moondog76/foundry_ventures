/**
 * Archive hero for `/insights` and `/network` (§12.1, §14).
 *
 * Deliberately NOT a slideshow and deliberately not a gradient panel: one dark
 * Foundry surface, one `h1`, and at most one intro paragraph — the same
 * treatment `/portfolio` and `/team` already use, so the three archives read as
 * one system.
 *
 * The heading is the archive's own deterministic name. It is a label, not
 * editorial copy, so it needs no approval; writing a headline about what the
 * archive contains would be inventing brand voice. The intro *is* editorial
 * copy, so it comes from the content layer and passes `canRenderEditorialText`
 * before it renders. When nothing is approved the paragraph is absent — not
 * stubbed, not padded with empty space (§25.1).
 */

import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { canRenderEditorialText, type PolicyContext } from "@/content/policy";
import type { EditorialText } from "@/content/types";
import styles from "./archive-hero.module.css";

export type ArchiveHeroProps = {
  title: string;
  headingId: string;
  policy: PolicyContext;
  /**
   * Intro candidates in priority order; the first one that clears the publishing
   * policy renders. Passing several lets a page prefer a specific intro over the
   * generic brand statement without re-deriving policy here.
   */
  introCandidates?: Array<EditorialText | undefined>;
};

export function ArchiveHero({ title, headingId, policy, introCandidates = [] }: ArchiveHeroProps) {
  const intro = introCandidates.find((candidate) => canRenderEditorialText(candidate, policy));

  return (
    <Section surface="dark" spacing="tight" className={styles.hero} aria-labelledby={headingId}>
      <Container>
        <Reveal className={styles.inner}>
          <h1 id={headingId} className={styles.heading}>
            {title}
          </h1>
          {intro ? <p className={styles.intro}>{intro.value}</p> : null}
        </Reveal>
      </Container>
    </Section>
  );
}
