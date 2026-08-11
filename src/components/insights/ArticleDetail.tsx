/**
 * `/insights/[slug]` article template (§12.2).
 *
 * Content order is fixed by the spec and identical in the DOM at every
 * breakpoint:
 *
 *   breadcrumb → type + date + reading time → h1 → excerpt → byline
 *   → hero image → body → relations → back to the archive
 *
 * At >= 992px the header becomes a split: title and metadata in the left field,
 * the hero image in the right. That is done with named grid areas, never by
 * reordering the markup, so the screen-reader sequence and the visual one agree
 * (§19.4). Below 992px it is ordinary full-width flow and the body keeps a
 * readable measure inside the mobile gutter.
 *
 * The hero frame declares its aspect ratio in CSS, so the space is reserved
 * before the image decodes and nothing shifts.
 *
 * Post strings are not `EditorialText`: a post reaches this template only after
 * `canPublishPostDetail` cleared it, which in production requires
 * `editorialApprovalStatus === "approved"`. Author role and bio, which are team
 * fields, are still gated on their own evidence in `resolveArticleAuthors`.
 */

import Link from "next/link";
import type { PolicyContext } from "@/content/policy";
import type { PostDetailView } from "@/content/types";
import { Breadcrumbs, type Crumb } from "@/components/global/Breadcrumbs";
import { ArrowLeftIcon } from "@/components/global/icons";
import { Container, Section, Tag } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleRelations } from "./ArticleRelations";
import type { ArticleAuthor } from "./authors";
import { INSIGHTS_PATH, INSIGHTS_TITLE, POST_TYPE_LABELS, readingTimeLabel } from "./labels";
import { formatIsoDate } from "./text";
import styles from "./article-detail.module.css";

export type ArticleDetailProps = {
  view: PostDetailView;
  policy: PolicyContext;
  crumbs: Crumb[];
  authors: ArticleAuthor[];
};

const HERO_SIZES =
  "(min-width: 1440px) 620px, (min-width: 992px) 45vw, (min-width: 768px) 92vw, 92vw";

export function ArticleDetail({ view, policy, crumbs, authors }: ArticleDetailProps) {
  const { post, summary, companies, related } = view;
  const typeLabel = POST_TYPE_LABELS[post.type];
  const published = formatIsoDate(post.publishedAt);
  const readingTime = readingTimeLabel(summary.readingTimeMinutes);
  const hasHero = summary.heroImage !== null;

  return (
    <article className={styles.article}>
      <Section spacing="tight" className={styles.headerSection}>
        <Container>
          <Breadcrumbs items={crumbs} />

          <div className={styles.header} data-media={hasHero ? "true" : "false"}>
            <div className={styles.headerBody}>
              <p className={styles.meta}>
                <Tag className={styles.type}>{typeLabel}</Tag>
                {published ? (
                  <time className={styles.metaItem} dateTime={published.dateTime}>
                    {published.label}
                  </time>
                ) : null}
                {readingTime ? <span className={styles.metaItem}>{readingTime}</span> : null}
              </p>

              <h1 className={styles.title}>{post.title}</h1>

              {post.excerpt.trim() ? <p className={styles.lede}>{post.excerpt}</p> : null}

              {authors.length > 0 ? (
                <p className={styles.byline}>
                  <span className={styles.bylineLabel}>By</span>{" "}
                  {authors.map((author, index) => (
                    <span key={author.id}>
                      {index > 0 ? <span aria-hidden="true">, </span> : null}
                      {author.href ? (
                        <Link href={author.href} className={styles.bylineLink}>
                          {author.name}
                        </Link>
                      ) : (
                        /* No publishable profile route: the name is a fact, a
                           link to a page that would 404 is not. */
                        <span>{author.name}</span>
                      )}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>

            {/*
              Rendered only when a rights-cleared image exists. An article is
              complete without one, so the fallback surface — which is a *cover*
              treatment for a card, not a hero — is deliberately not used here.
            */}
            {hasHero ? (
              <div className={styles.headerMedia}>
                <ResponsiveImage
                  image={summary.heroImage}
                  policy={policy}
                  /* Decorative: the headline beside it already carries the
                     meaning, and the asset's own alt wins when it has one. */
                  sizes={HERO_SIZES}
                  priority
                  frameClassName={styles.heroFrame}
                />
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section spacing="tight" as="div">
        <Container>
          <Reveal className={styles.body}>
            <RichTextRenderer value={post.body} policy={policy} />
          </Reveal>

          <ArticleRelations companies={companies} authors={authors} related={related} />

          <p className={styles.back}>
            <Link href={INSIGHTS_PATH} className={styles.backLink}>
              <ArrowLeftIcon />
              <span>Back to {INSIGHTS_TITLE}</span>
            </Link>
          </p>
        </Container>
      </Section>
    </article>
  );
}
