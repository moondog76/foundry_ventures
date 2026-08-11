/**
 * Insights card (§12.1, §19.4.1).
 *
 * Rules encoded here:
 *  - the whole card is exactly one link. An internal post goes to
 *    `/insights/[slug]`; an external post goes straight to the publisher's URL,
 *    opened safely with `rel="noopener noreferrer"` and an accessible-name hint.
 *    The rebuild never creates a thin internal duplicate of somebody else's
 *    article (§12.1), so `PostSummary.href` is already the right destination;
 *  - a post with no rights-cleared image gets the deliberate Foundry-branded
 *    typographic surface (`ResponsiveImage`'s fallback: the title set in Ivar
 *    over the post type), never a stock photo and never a broken placeholder;
 *  - `:focus-visible` produces exactly the same visual response as `:hover`, and
 *    hover styling is gated behind a real hover-capable pointer so a tap does
 *    not leave the card stuck in its hover state;
 *  - nothing animates on its own.
 *
 * Post strings are not `EditorialText`: a post reaches this component only after
 * `canListPostPublicly` has confirmed `editorialApprovalStatus === "approved"`
 * in production, so title and excerpt are already cleared for publication.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { PolicyContext } from "@/content/policy";
import type { PostSummary } from "@/content/types";
import { ExternalIcon, Tag } from "@/components/ui";
import { ArrowRightIcon } from "@/components/global/icons";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { POST_TYPE_LABELS } from "./labels";
import { formatIsoDate } from "./text";
import styles from "./post-card.module.css";

export type PostCardProps = {
  post: PostSummary;
  policy: PolicyContext;
  /** Overrides the default archive-grid `sizes` when the card is reused. */
  sizes?: string;
  priority?: boolean;
};

const DEFAULT_SIZES = "(min-width: 992px) 30vw, (min-width: 768px) 45vw, 92vw";

export function PostCard({ post, policy, sizes = DEFAULT_SIZES, priority = false }: PostCardProps) {
  const typeLabel = POST_TYPE_LABELS[post.type];
  const published = formatIsoDate(post.publishedAt);

  const body = (
    <>
      <ResponsiveImage
        image={post.heroImage}
        policy={policy}
        /* Decorative: the title and type sit next to the image as real text, so
           repeating them in the alt would double every announcement. */
        alt=""
        sizes={sizes}
        priority={priority}
        frameClassName={styles.media}
        /* No rights-cleared artwork → the branded typographic surface. */
        fallbackLabel={post.title}
        fallbackMeta={typeLabel}
      />

      <div className={styles.content}>
        <p className={styles.meta}>
          <Tag className={styles.type}>{typeLabel}</Tag>
          {published ? (
            <time className={styles.date} dateTime={published.dateTime}>
              {published.label}
            </time>
          ) : null}
        </p>

        <h3 className={styles.title}>
          <span className={styles.titleText}>{post.title}</span>
        </h3>

        {post.excerpt.trim() ? <p className={styles.excerpt}>{post.excerpt}</p> : null}

        <span className={styles.arrow} aria-hidden="true">
          {post.isExternal ? <ExternalIcon /> : <ArrowRightIcon />}
        </span>
      </div>
    </>
  );

  return (
    <article className={styles.card}>
      <CardShell href={post.href} isExternal={post.isExternal}>
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
  href: string;
  isExternal: boolean;
  children: ReactNode;
}) {
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
