/**
 * Latest insights (§7.8).
 *
 * `getLatestPosts(3)` already applies the feature flag and the publishing
 * policy: an empty result hides the whole section rather than rendering a public
 * empty state. External posts link straight out — the rebuild never creates a
 * thin internal duplicate of somebody else's article (§12.1).
 */

import Link from "next/link";
import type { PostSummary } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { Container, ExternalIcon, Section, Tag, TextLink } from "@/components/ui";
import { ArrowRightIcon } from "@/components/global/icons";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./latest-insights.module.css";

export type LatestInsightsProps = {
  posts: PostSummary[];
  policy: PolicyContext;
  /** Approved section heading and CTA label, or null while unapproved. */
  heading: string | null;
  ctaLabel: string | null;
  ctaHref: string;
};

/** Display names for the two post types. UI chrome, not a claim about content. */
const TYPE_LABELS: Record<PostSummary["type"], string> = {
  article: "Article",
  "portfolio-news": "Portfolio news",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats an ISO date without touching `Date`, so the output can never shift by
 * a day depending on the server's timezone.
 */
function formatPublishedAt(iso: string | null): { label: string; dateTime: string } | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return null;
  return { label: `${Number(day)} ${monthName} ${year}`, dateTime: `${year}-${month}-${day}` };
}

const CARD_SIZES = "(min-width: 992px) 30vw, (min-width: 768px) 45vw, 88vw";

function InsightCard({ post, policy }: { post: PostSummary; policy: PolicyContext }) {
  const published = formatPublishedAt(post.publishedAt);

  const body = (
    <>
      <ResponsiveImage
        image={post.heroImage}
        policy={policy}
        alt=""
        sizes={CARD_SIZES}
        frameClassName={styles.media}
      />
      <div className={styles.cardBody}>
        <div className={styles.badges}>
          <Tag>{TYPE_LABELS[post.type]}</Tag>
        </div>
        <h3 className={styles.title}>{post.title}</h3>
        {published ? (
          <time className={styles.date} dateTime={published.dateTime}>
            {published.label}
          </time>
        ) : null}
        <span className={styles.arrow} aria-hidden="true">
          {post.isExternal ? <ExternalIcon /> : <ArrowRightIcon />}
        </span>
      </div>
    </>
  );

  if (post.isExternal) {
    return (
      <a href={post.href} className={styles.card} target="_blank" rel="noopener noreferrer">
        {body}
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={post.href} className={styles.card}>
      {body}
    </Link>
  );
}

export function LatestInsights({ posts, policy, heading, ctaLabel, ctaHref }: LatestInsightsProps) {
  if (posts.length === 0) return null;

  return (
    <Section
      surface="light"
      aria-labelledby={heading ? "latest-insights-heading" : undefined}
      aria-label={heading ? undefined : "Latest insights"}
    >
      <Container>
        <div className={styles.header}>
          {heading ? (
            <Reveal>
              <h2 id="latest-insights-heading" className={styles.heading}>
                {heading}
              </h2>
            </Reveal>
          ) : null}
          {ctaLabel ? (
            <p className={styles.headerCta}>
              <TextLink href={ctaHref}>{ctaLabel}</TextLink>
            </p>
          ) : null}
        </div>

        <ul className={styles.grid} role="list">
          {posts.map((post, index) => (
            <Reveal
              as="li"
              key={post.id}
              className={styles.gridItem}
              delay={Math.min(index, 2) * 80}
            >
              <InsightCard post={post} policy={policy} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
