/**
 * Home hero (§7.1).
 *
 * A full-bleed ocean crop with a controlled overlay, the page's single `<h1>`,
 * the migrated support copy and the two CTAs. Static background only — no WebGL,
 * no canvas, no parallax.
 *
 * Deliberately *not* wrapped in `Reveal`: this block is the LCP surface and is
 * always in the initial viewport, so animating it would only delay the largest
 * paint without ever being seen mid-transition.
 */

import type { HomePage } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { ButtonLink, Container } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { renderableText, renderableTexts } from "./text";
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
        The crop is decorative: the heading carries the meaning, so alt is empty.
        No `fallbackLabel` is passed — when the licensed original is missing the
        image simply drops out and the deep-navy wash below stands on its own,
        rather than printing a caption across the whole viewport.
      */}
      <ResponsiveImage
        image={hero.image}
        policy={policy}
        alt=""
        sizes="100vw"
        priority
        frameClassName={styles.mediaFrame}
      />
      <div className={styles.overlay} aria-hidden="true" />

      <Container className={styles.container}>
        <div className={styles.content}>
          <div className={styles.headingBlock}>
            {eyebrow ? <p className={`type-label ${styles.eyebrow}`}>{eyebrow}</p> : null}
            <h1 id="home-hero-heading" className={styles.heading}>
              {heading}
            </h1>
          </div>

          {paragraphs.length > 0 ? (
            <div className={styles.support} data-columns={paragraphs.length > 1 ? "two" : "one"}>
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <div className={styles.actions}>
            <ButtonLink href={hero.primaryCta.href} onDark>
              {primaryLabel}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="secondary" onDark>
              {secondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
