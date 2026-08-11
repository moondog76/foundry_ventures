/**
 * Related insights for a company (§9.1, §12.4).
 *
 * The relation is canonical on the post (`Post.companies`), already resolved and
 * policy-filtered by `getPostsForCompany`. When the Insights feature is off, or
 * nothing references this company, the list is empty and this renders nothing —
 * neither the heading nor the spacing it would have occupied.
 *
 * External posts link straight out; there is no thin internal duplicate route.
 */

import Link from "next/link";
import type { PostSummary } from "@/content/types";
import { ExternalLink } from "@/components/global/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./related-posts.module.css";

const POST_TYPE_LABELS: Record<PostSummary["type"], string> = {
  article: "Article",
  "portfolio-news": "Portfolio news",
};

/**
 * Fixed locale and UTC so the server and any pre-render agree byte for byte —
 * a locale-dependent date is a hydration mismatch waiting to happen.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return DATE_FORMAT.format(parsed);
}

export function RelatedPosts({ posts, headingId }: { posts: PostSummary[]; headingId: string }) {
  if (posts.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Related insights
      </h2>
      <ul className={styles.list} role="list">
        {posts.map((post, index) => {
          const published = formatDate(post.publishedAt);
          return (
            <Reveal key={post.id} as="li" className={styles.item} delay={Math.min(index, 3) * 60}>
              <p className={styles.meta}>
                <span className={styles.type}>{POST_TYPE_LABELS[post.type]}</span>
                {published && post.publishedAt ? (
                  <time dateTime={post.publishedAt} className={styles.date}>
                    {published}
                  </time>
                ) : null}
              </p>
              <p className={styles.title}>
                {post.isExternal ? (
                  <ExternalLink href={post.href}>{post.title}</ExternalLink>
                ) : (
                  <Link href={post.href} className={styles.link}>
                    {post.title}
                  </Link>
                )}
              </p>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
