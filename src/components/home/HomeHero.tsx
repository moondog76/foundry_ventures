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
import { renderableText, renderableTexts } from "./text";
import { AmbientOcean } from "./AmbientOcean";
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
  /** False when the CTA's destination is behind a disabled flag (§3.4). */
  primaryCtaEnabled?: boolean;
  secondaryCtaFallbackLabel: string;
};

export function HomeHero({
  hero,
  policy,
  fallbackHeading,
  primaryCtaFallbackLabel,
  primaryCtaEnabled = true,
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
      <AmbientOcean className={styles.mediaFrame} />
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
            {primaryCtaEnabled ? (
              <ButtonLink href={hero.primaryCta.href} onDark>
                {primaryLabel}
              </ButtonLink>
            ) : null}
            {/* The secondary CTA becomes the primary one when the first is
                gone, so the hero never ends without an action. */}
            <ButtonLink
              href={hero.secondaryCta.href}
              variant={primaryCtaEnabled ? "secondary" : "primary"}
              onDark
            >
              {secondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
