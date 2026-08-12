/**
 * Home hero (§8.2).
 *
 * A full-bleed ocean field with a controlled overlay, the page's single `<h1>`,
 * one support paragraph and two links.
 *
 * The support block is deliberately single-column now. §8.2 allows one
 * paragraph of at most 28-32 words and explicitly forbids two side-by-side
 * paragraphs: the audit found the reader had understood the proposition before
 * either of the old ones finished.
 *
 * Deliberately *not* wrapped in `Reveal`: this block is the LCP surface and is
 * always in the initial viewport, so animating it would only delay the largest
 * paint without ever being seen mid-transition.
 */

import type { HomePage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { ButtonLink, Container, TextLink } from "@/components/ui";
import { renderableText, renderableTexts } from "./text";
import { OceanField } from "./OceanField";
import styles from "./home-hero.module.css";

export type HomeHeroProps = {
  hero: HomePage["hero"];
  policy: PolicyContext;
  /**
   * Rendered as the `<h1>` when the authored heading is not publishable. The
   * brand name is a structural SiteSettings value (the header, footer and logo
   * title already render it unconditionally), so the page always emits exactly
   * one h1 — even in production, where every seeded home string is unapproved.
   */
  fallbackHeading: string;
  /** Nav-derived labels, used when the authored CTA label is unapproved. */
  primaryCtaFallbackLabel: string;
  secondaryCtaFallbackLabel: string;
};

/**
 * Splits a heading on sentence boundaries so the CSS can break lines there.
 *
 * §8.2 asks for editorial line breaks rather than whatever the measure
 * produces. The trailing space is kept inside each span so the sentences still
 * read as one continuous string when they are inline on a narrow screen, and so
 * a screen reader announces "…in AI. We invest…" rather than running the words
 * together.
 *
 * A heading with no sentence break comes back as a single element, so this is
 * safe for any future copy.
 */
function splitSentences(heading: string): string[] {
  const parts = heading.match(/[^.!?]+[.!?]*\s*/g);
  return parts ? parts.map((part) => part.trim()).filter(Boolean) : [heading];
}

export function HomeHero({
  hero,
  policy,
  fallbackHeading,
  primaryCtaFallbackLabel,
  secondaryCtaFallbackLabel,
}: HomeHeroProps) {
  const eyebrow = renderableText(hero.eyebrow, policy);
  const heading = renderableText(hero.heading, policy) ?? fallbackHeading;
  const paragraphs = renderableTexts(hero.paragraphs, policy);
  const primaryLabel = renderableText(hero.primaryCta.label, policy) ?? primaryCtaFallbackLabel;
  const secondaryLabel =
    renderableText(hero.secondaryCta.label, policy) ?? secondaryCtaFallbackLabel;

  return (
    <section
      className={styles.hero}
      // Inverts the global focus ring over the dark crop (§20.2).
      data-surface="dark"
      /*
       * Opts `<main>` out of the fixed-header offset: this hero is designed to
       * run full bleed *under* the transparent header (§7.1). Every other page
       * keeps the offset so its first section is not occluded.
       */
      data-hero="full-bleed"
      aria-labelledby="home-hero-heading"
    >
      {/*
        Decorative: the heading carries the meaning, so the layer is aria-hidden
        and carries no alt text. The still poster is painted by CSS before any
        video loads, and remains the entire background under reduced motion,
        Save-Data, a refused autoplay or a decode error (§7.1, §20.4).
      */}
      <OceanField mediaClassName={styles.mediaFrame}>
        <div className={styles.overlay} aria-hidden="true" />

        <Container className={styles.container}>
          <div className={styles.content}>
            <div className={styles.headingBlock}>
              {eyebrow ? <p className={`type-label ${styles.eyebrow}`}>{eyebrow}</p> : null}
              <h1 id="home-hero-heading" className={styles.heading}>
                {splitSentences(heading).map((sentence) => (
                  <span key={sentence} className={styles.headingSentence}>
                    {sentence}{" "}
                  </span>
                ))}
              </h1>
            </div>

            {paragraphs.length > 0 ? (
              <div className={styles.support}>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {/* §9.7: one primary action per section. The fund link is a text link
              rather than a second button so it cannot compete with it. */}
            <div className={styles.actions}>
              <ButtonLink href={hero.primaryCta.href} onDark>
                {primaryLabel}
              </ButtonLink>
              <TextLink href={hero.secondaryCta.href} onDark>
                {secondaryLabel}
              </TextLink>
            </div>
          </div>
        </Container>
      </OceanField>
    </section>
  );
}
