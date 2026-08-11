/**
 * Featured portfolio (§7.5).
 *
 * The list is always `getFeaturedCompanies(...)` — there is no hardcoded
 * fallback grid anywhere, so a company can never appear on the home page that
 * the archive would refuse to publish.
 *
 * Destination rule (build contract): `summary.href` when the internal detail
 * route exists, otherwise the verified external site marked as external, and no
 * link at all when both are null. A card is never a dead `#`.
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { CompanySummary } from "@/content/types";
import { canRenderImage, type PolicyContext } from "@/content/policy";
import { Container, ExternalIcon, Section, TextLink, cx } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./featured-portfolio.module.css";

export type FeaturedPortfolioProps = {
  companies: CompanySummary[];
  policy: PolicyContext;
  /** Approved section heading and intro, or null while still unapproved. */
  heading: string | null;
  intro: string | null;
  ctaLabel: string;
  ctaHref: string;
};

const CARD_SIZES = "(min-width: 992px) 30vw, (min-width: 768px) 45vw, 88vw";

function CardBody({ summary, policy }: { summary: CompanySummary; policy: PolicyContext }) {
  const hasLogo = canRenderImage(summary.logo, policy);
  const hasCardImage = canRenderImage(summary.cardImage, policy);

  return (
    <>
      <div
        className={styles.surface}
        data-fit={summary.logoFit}
        // Optical calibration from the CMS: mismatched logo aspect ratios are
        // scaled so they read as equal weight across the grid (§5.5).
        style={{ "--logo-scale": summary.opticalScale } as CSSProperties}
      >
        {hasCardImage ? (
          // Decorative crossfade layer only. It carries no information — name,
          // tagline and founders are permanent text below — so fading it in on
          // hover/focus never hides anything from anyone (§20.1).
          <ResponsiveImage
            image={summary.cardImage}
            policy={policy}
            alt=""
            sizes={CARD_SIZES}
            frameClassName={styles.cardImageFrame}
          />
        ) : null}

        {hasLogo ? (
          <ResponsiveImage
            image={summary.logo}
            policy={policy}
            alt=""
            sizes={CARD_SIZES}
            fit="contain"
            frameClassName={styles.logoFrame}
          />
        ) : (
          // Typographic fallback (§19.4.1). `aria-hidden` because the same name
          // is the card's heading immediately below, and a doubled accessible
          // name is worse than none.
          <span className={styles.wordmark} aria-hidden="true">
            {summary.name}
          </span>
        )}
      </div>

      <div className={styles.meta}>
        <h3 className={styles.name}>{summary.name}</h3>
        {summary.tagline ? <p className={styles.tagline}>{summary.tagline}</p> : null}
        {summary.founders.length > 0 ? (
          <p className={styles.founders}>
            <span className="visually-hidden">Founders: </span>
            {summary.founders.map((founder) => founder.name).join(", ")}
          </p>
        ) : null}
      </div>
    </>
  );
}

function Card({ summary, policy }: { summary: CompanySummary; policy: PolicyContext }) {
  const body: ReactNode = <CardBody summary={summary} policy={policy} />;

  if (summary.href) {
    return (
      <Link href={summary.href} className={cx(styles.card, styles.cardLink)}>
        {body}
      </Link>
    );
  }

  if (summary.externalHref) {
    return (
      <a
        href={summary.externalHref}
        className={cx(styles.card, styles.cardLink)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
        <span className={styles.externalMark} aria-hidden="true">
          <ExternalIcon />
        </span>
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    );
  }

  // Neither destination is publishable: the card stays a plain, non-interactive
  // tile rather than becoming a link to nowhere.
  return <div className={styles.card}>{body}</div>;
}

export function FeaturedPortfolio({
  companies,
  policy,
  heading,
  intro,
  ctaLabel,
  ctaHref,
}: FeaturedPortfolioProps) {
  if (companies.length === 0) return null;

  return (
    <Section
      surface="light"
      aria-labelledby={heading ? "featured-portfolio-heading" : undefined}
      aria-label={heading ? undefined : "Portfolio"}
    >
      <Container>
        {heading || intro ? (
          <Reveal className={styles.header}>
            {heading ? (
              <h2 id="featured-portfolio-heading" className={styles.heading}>
                {heading}
              </h2>
            ) : null}
            {intro ? <p className={styles.intro}>{intro}</p> : null}
          </Reveal>
        ) : null}

        <ul className={styles.grid} role="list">
          {companies.map((summary, index) => (
            <Reveal
              as="li"
              key={summary.id}
              className={styles.gridItem}
              // Stagger by column rather than by index, so the third row does
              // not arrive seconds after the first (§5.6).
              delay={(index % 3) * 80}
            >
              <Card summary={summary} policy={policy} />
            </Reveal>
          ))}
        </ul>

        <p className={styles.cta}>
          <TextLink href={ctaHref}>{ctaLabel}</TextLink>
        </p>
      </Container>
    </Section>
  );
}
