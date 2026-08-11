/**
 * Portfolio company card (§8.4).
 *
 * Rules encoded here:
 *  - the whole card is exactly one link, using `summary.href` when the internal
 *    detail route exists and `summary.externalHref` otherwise; when both are
 *    null the card is not a link at all and must not look interactive;
 *  - tagline, stage, sector and status render only when the policy layer left
 *    the corresponding field non-null — no "—", no "Coming soon";
 *  - `:focus-visible` produces exactly the same visual response as `:hover`, and
 *    hover styling is gated behind a real hover-capable pointer so a tap does
 *    not leave the card stuck in its hover state;
 *  - nothing animates on its own: there is no autoplay, no slideshow, no carousel.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { PolicyContext } from "@/content/policy";
import type { CompanySummary } from "@/content/types";
import { ExternalIcon, Tag } from "@/components/ui";
import { CompanyLogoFrame } from "./CompanyLogoFrame";
import { STATUS_LABELS } from "./labels";
import styles from "./company-card.module.css";

export type CompanyCardProps = {
  summary: CompanySummary;
  policy: PolicyContext;
  /** Overrides the default archive-grid `sizes` when the card is reused. */
  sizes?: string;
  priority?: boolean;
};

const DEFAULT_SIZES = "(min-width: 992px) 30vw, (min-width: 768px) 45vw, 92vw";

export function CompanyCard({
  summary,
  policy,
  sizes = DEFAULT_SIZES,
  priority = false,
}: CompanyCardProps) {
  const isExternal = summary.href === null && summary.externalHref !== null;
  const destination = summary.href ?? summary.externalHref;

  const tags: string[] = [
    ...summary.stages.map((stage) => stage.title),
    ...summary.sectors.map((sector) => sector.title),
    ...(summary.status ? [STATUS_LABELS[summary.status]] : []),
  ];

  const body = (
    <>
      <CompanyLogoFrame
        logo={summary.logo}
        name={summary.name}
        logoFit={summary.logoFit}
        opticalScale={summary.opticalScale}
        policy={policy}
        sizes={sizes}
        priority={priority}
        className={styles.logo}
      />
      <div className={styles.content}>
        <h3 className={styles.name}>
          <span className={styles.nameText}>{summary.name}</span>
          {isExternal ? <ExternalIcon /> : null}
        </h3>
        {summary.tagline ? <p className={styles.tagline}>{summary.tagline}</p> : null}
        {tags.length > 0 ? (
          <ul className={styles.tags} role="list">
            {tags.map((label) => (
              <li key={label}>
                <Tag className={styles.tag}>{label}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );

  return (
    <article className={styles.card} data-interactive={destination ? "true" : undefined}>
      <CardShell href={destination} isExternal={isExternal}>
        {body}
      </CardShell>
    </article>
  );
}

function CardShell({
  href,
  isExternal,
  children,
}: {
  href: string | null;
  isExternal: boolean;
  children: ReactNode;
}) {
  if (!href) {
    // No approved destination: a plain, non-interactive record. Rendering a "#"
    // or a dead link here would be worse than rendering no link at all.
    return <div className={styles.shell}>{children}</div>;
  }

  if (isExternal) {
    return (
      <a className={styles.shell} href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link className={styles.shell} href={href}>
      {children}
    </Link>
  );
}
