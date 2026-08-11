/**
 * Portfolio archive hero (§8.1).
 *
 * Deliberately NOT a slideshow and deliberately not a Luminar-style gradient
 * panel: one dark Foundry surface, one `h1`, and at most one intro paragraph.
 *
 * The heading is the fixed, deterministic label for this archive — the same word
 * the site navigation uses. It is not editorial copy and therefore needs no
 * approval; inventing a headline here would be fabricating brand voice. The
 * intro, in contrast, IS editorial copy, so it comes from the content layer and
 * passes `canRenderEditorialText` before it renders. When nothing is approved,
 * the paragraph is absent — not stubbed, not padded with empty space.
 */

import { Container, Section } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { canRenderEditorialText, type PolicyContext } from "@/content/policy";
import type { EditorialText } from "@/content/types";
import styles from "./portfolio-hero.module.css";

/** The archive's own name. Matches `SiteSettings.navigation` and the breadcrumb. */
export const PORTFOLIO_TITLE = "Portfolio";

export type PortfolioHeroProps = {
  policy: PolicyContext;
  /**
   * Intro candidates in priority order; the first one that clears the publishing
   * policy renders. Passing several lets the page prefer a portfolio-specific
   * intro over the generic brand statement without re-deriving policy here.
   */
  introCandidates?: Array<EditorialText | undefined>;
  headingId?: string;
};

export function PortfolioHero({
  policy,
  introCandidates = [],
  headingId = "portfolio-heading",
}: PortfolioHeroProps) {
  const intro = introCandidates.find((candidate) => canRenderEditorialText(candidate, policy));

  return (
    <Section surface="dark" spacing="tight" className={styles.hero} aria-labelledby={headingId}>
      <Container>
        <Reveal className={styles.inner}>
          <h1 id={headingId} className={styles.heading}>
            {PORTFOLIO_TITLE}
          </h1>
          {intro ? <p className={styles.intro}>{intro.value}</p> : null}
        </Reveal>
      </Container>
    </Section>
  );
}
