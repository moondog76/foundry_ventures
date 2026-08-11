/**
 * Deterministic labels for the Insights surfaces.
 *
 * Nothing here is marketing copy. `POST_TYPE_LABELS` mirrors the titles the
 * content layer already uses for the type facet (`getPostFacets`), and the
 * pluralisation helpers only ever describe a number the page actually rendered.
 */

import type { PostType } from "@/content/types";

/** The archive's own name (§12.1). Used for the `h1`, breadcrumb and metadata. */
export const INSIGHTS_TITLE = "News & Insights";

export const INSIGHTS_PATH = "/insights";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  article: "Article",
  "portfolio-news": "Portfolio news",
};

/** Singular/plural noun used by the shared filter UI and the empty states. */
export const POST_NOUN = { one: "post", other: "posts" } as const;

export function postCountLabel(count: number): string {
  return `${count} ${count === 1 ? POST_NOUN.one : POST_NOUN.other}`;
}

/**
 * Reading time is computed by the content layer from the body that is actually
 * published, so the label never over-promises. External posts have no body here
 * and therefore no reading time.
 */
export function readingTimeLabel(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  return `${minutes} min read`;
}
