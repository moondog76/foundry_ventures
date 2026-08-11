/**
 * Everything an article is connected to (§12.2, §12.4).
 *
 * Three independent blocks — companies, authors, related posts — each of which
 * disappears on its own when it has nothing to show. When all three are empty
 * this component renders nothing at all: no heading, no rule, and none of the
 * vertical space they would have occupied.
 *
 * The related posts arrive pre-computed by `getRelatedPosts` (§12.4: manual
 * order first, then shared companies, then shared authors, deduplicated and
 * capped at three), so no relevance logic is re-derived here.
 *
 * A company card's destination follows the same rule as the portfolio archive:
 * the internal detail route when it exists, otherwise the verified external
 * site, otherwise no link at all — never a "#".
 */

import Link from "next/link";
import type { CompanySummary, PostSummary } from "@/content/types";
import { Divider } from "@/components/ui";
import { ExternalLink } from "@/components/global/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import type { ArticleAuthor } from "./authors";
import { POST_TYPE_LABELS } from "./labels";
import { formatIsoDate } from "./text";
import styles from "./article-relations.module.css";

export type ArticleRelationsProps = {
  companies: CompanySummary[];
  authors: ArticleAuthor[];
  related: PostSummary[];
};

export function ArticleRelations({ companies, authors, related }: ArticleRelationsProps) {
  // Authors with neither a profile route nor an approved bio add nothing beyond
  // the byline already rendered in the header, so they do not open a block.
  const profiles = authors.filter((author) => author.href !== null || author.shortBio !== null);

  if (companies.length === 0 && profiles.length === 0 && related.length === 0) return null;

  return (
    <div className={styles.relations}>
      <Divider />

      {companies.length > 0 ? (
        <section className={styles.block} aria-labelledby="article-companies">
          <h2 id="article-companies" className={styles.heading}>
            Companies in this story
          </h2>
          <ul className={styles.companyList} role="list">
            {companies.map((company, index) => (
              <Reveal
                as="li"
                key={company.id}
                className={styles.companyItem}
                delay={Math.min(index, 3) * 60}
              >
                <p className={styles.companyName}>
                  <CompanyName company={company} />
                </p>
                {company.tagline ? (
                  <p className={styles.companyTagline}>{company.tagline}</p>
                ) : null}
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {profiles.length > 0 ? (
        <section className={styles.block} aria-labelledby="article-authors">
          <h2 id="article-authors" className={styles.heading}>
            {profiles.length === 1 ? "About the author" : "About the authors"}
          </h2>
          <ul className={styles.authorList} role="list">
            {profiles.map((author, index) => (
              <Reveal
                as="li"
                key={author.id}
                className={styles.authorItem}
                delay={Math.min(index, 3) * 60}
              >
                <p className={styles.authorName}>
                  {author.href ? (
                    <Link href={author.href} className={styles.link}>
                      {author.name}
                    </Link>
                  ) : (
                    author.name
                  )}
                </p>
                {author.role ? <p className={styles.authorRole}>{author.role}</p> : null}
                {author.shortBio ? <p className={styles.authorBio}>{author.shortBio}</p> : null}
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className={styles.block} aria-labelledby="article-related">
          <h2 id="article-related" className={styles.heading}>
            Related insights
          </h2>
          <ul className={styles.postList} role="list">
            {related.map((post, index) => {
              const published = formatIsoDate(post.publishedAt);
              return (
                <Reveal
                  as="li"
                  key={post.id}
                  className={styles.postItem}
                  delay={Math.min(index, 3) * 60}
                >
                  <p className={styles.postMeta}>
                    <span className={styles.postType}>{POST_TYPE_LABELS[post.type]}</span>
                    {published ? (
                      <time dateTime={published.dateTime} className={styles.postDate}>
                        {published.label}
                      </time>
                    ) : null}
                  </p>
                  <p className={styles.postTitle}>
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
      ) : null}
    </div>
  );
}

function CompanyName({ company }: { company: CompanySummary }) {
  if (company.href) {
    return (
      <Link href={company.href} className={styles.link}>
        {company.name}
      </Link>
    );
  }
  if (company.externalHref) {
    return <ExternalLink href={company.externalHref}>{company.name}</ExternalLink>;
  }
  // No approved destination: plain text is more honest than a dead link.
  return <>{company.name}</>;
}
