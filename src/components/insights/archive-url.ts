/**
 * URL state for the Insights archive (§12.1, §18.1).
 *
 * The archive owns two independent pieces of URL state and they must not fight
 * each other:
 *
 *  - the **filters**, parsed and serialised exclusively by
 *    `@/lib/filters/engine`;
 *  - the **page**, which is appended after the filters so a canonical URL reads
 *    `/insights?type=article&page=2`.
 *
 * Everything here is pure and server-side, so the page can compute one canonical
 * href, compare it to the incoming one, and hand the client a single
 * already-correct normalisation target. That is what lets the filter component
 * issue exactly one `router.replace` without ever losing `?page=`.
 */

import type { FacetGroup } from "@/content/types";
import { serializeFilters, type FilterSchema, type FilterState } from "@/lib/filters/engine";
import { POST_FILTER_SCHEMA } from "@/lib/filters/schemas";

/** §12.1: pagination appears once the archive passes this many posts. */
export const POSTS_PER_PAGE = 24;

export const PAGE_PARAM = "page";

/**
 * Narrows the shared post vocabulary to the values the content layer actually
 * produced a facet for.
 *
 * `getPostFacets()` drops the group entirely when fewer than two types are
 * published, and in that case the filter UI is hidden. A `?type=` param must
 * then be discarded as unknown rather than silently honoured — otherwise a
 * shared link could filter an archive that offers no way to unfilter it. This is
 * the same data-driven-vocabulary rule the portfolio archive uses (§8.2).
 */
export function narrowPostSchema(facets: FacetGroup[]): FilterSchema {
  const present = new Set(
    facets.find((facet) => facet.key === "type")?.options.map((option) => option.slug) ?? [],
  );
  return POST_FILTER_SCHEMA.map((group) => ({
    ...group,
    allowedValues: group.allowedValues.filter((value) => present.has(value)),
  }));
}

/** First page, or the requested one. Anything unparseable is page one. */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 1;
  // Deliberately strict: "2abc", "-1", "1.5" and "" are all page one.
  if (!/^\d+$/.test(value.trim())) return 1;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 1 ? parsed : 1;
}

export function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) return 1;
  return Math.min(Math.max(page, 1), pageCount);
}

/**
 * Canonical query string for a filter state and a page. Page one is expressed by
 * the parameter being absent, exactly as "All" is for a filter group.
 */
export function archiveQuery(schema: FilterSchema, state: FilterState, page: number): string {
  const filters = serializeFilters(schema, state);
  if (page <= 1) return filters;
  return filters ? `${filters}&${PAGE_PARAM}=${page}` : `${PAGE_PARAM}=${page}`;
}

export function archiveHref(
  basePath: string,
  schema: FilterSchema,
  state: FilterState,
  page: number,
): string {
  const query = archiveQuery(schema, state, page);
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * The incoming query rendered in submission order, so a reordered-but-equivalent
 * URL still counts as needing normalisation. Mirrors the comparison
 * `parseFilters` makes internally, extended to the params this module owns.
 */
export function incomingQueryString(params: Record<string, string | string[] | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) search.append(key, entry);
    } else {
      search.append(key, value);
    }
  }
  return search.toString();
}
