"use client";

/**
 * Portfolio filters (§8.2, §18.1, §19.3).
 *
 * The URL is the source of truth; this component never re-implements the filter
 * semantics, it only drives `@/lib/filters/engine`.
 *
 * Behaviour contract:
 *  - every explicit user action issues `router.push(href, { scroll: false })`,
 *    so Back walks one filter step at a time and the viewport does not jump;
 *  - `router.replace(..., { scroll: false })` fires **once**, and only when the
 *    incoming URL was not already canonical;
 *  - the control the user activated keeps focus: one input tree, keyed by value,
 *    stays mounted across the navigation instead of being rebuilt;
 *  - the result count lives in an `aria-live="polite"` region;
 *  - below 768px a compact toolbar toggles an INLINE panel. It is not a modal
 *    and not a bottom sheet, so it is deliberately NOT a focus trap: the page
 *    behind it stays reachable. Escape closes it and returns focus to the
 *    trigger; "Show N companies" closes it and moves focus to the count.
 *
 * When `getCompanyFacets()` produced nothing (fewer than two values in every
 * group), this renders nothing at all — a small portfolio must not be dressed up
 * with filters that cannot filter.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import {
  clearAll,
  countSelected,
  filtersToHref,
  parseFilters,
  serializeFilters,
  toggleValue,
  type FilterSchema,
  type FilterState,
} from "@/lib/filters/engine";
import { track } from "@/lib/analytics";
import type { FacetGroup } from "@/content/types";
import { FilterChipSummary, type FilterChip } from "./FilterChipSummary";
import { FilterGroup } from "./FilterGroup";
import { companyCountLabel } from "./labels";
import styles from "./portfolio-filters.module.css";

export type PortfolioFiltersProps = {
  /** Route the filters belong to, e.g. "/portfolio". */
  basePath: string;
  facets: FacetGroup[];
  /** The exact schema the server parsed with, so client and server agree. */
  schema: FilterSchema;
  /** Parsed, canonical state for the incoming URL. */
  initialState: FilterState;
  /** Canonical query string for the incoming URL, without "?". */
  canonicalQuery: string;
  /** True when the incoming URL was not canonical (see the one-shot replace). */
  didNormalize: boolean;
  /** Number of companies the server rendered for this URL. */
  resultCount: number;
  /** Number of companies with no filters applied. */
  totalCount: number;
};

export function PortfolioFilters({
  basePath,
  facets,
  schema,
  initialState,
  canonicalQuery,
  didNormalize,
  resultCount,
  totalCount,
}: PortfolioFiltersProps) {
  const router = useRouter();
  const uid = useId();
  const panelId = `${uid}-panel`;
  const countId = `${uid}-count`;

  const [state, setState] = useState<FilterState>(initialState);
  const [panelOpen, setPanelOpen] = useState(false);
  // Groups start expanded at every width: on desktop the panel is the whole
  // control surface, and on mobile a collapsed-by-default stack hides the
  // vocabulary the archive is filtered by.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(facets.map((facet) => [facet.key, true] as const)),
  );
  const [isPending, startTransition] = useTransition();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  /**
   * The query string of a navigation we started ourselves. While it is set we
   * ignore incoming props: a burst of quick toggles produces intermediate server
   * renders that would otherwise pull the checkboxes back to a stale state.
   */
  const pendingQueryRef = useRef<string | null>(null);
  const didNormalizeRef = useRef(false);

  /* ------------------------------------------------- URL → state (one way) */

  useEffect(() => {
    if (pendingQueryRef.current !== null) {
      if (pendingQueryRef.current === canonicalQuery) pendingQueryRef.current = null;
      return;
    }
    // Back/forward, or a link someone shared: the URL wins.
    setState((current) =>
      serializeFilters(schema, current) === canonicalQuery
        ? current
        : parseFilters(schema, new URLSearchParams(canonicalQuery)).state,
    );
  }, [canonicalQuery, schema]);

  /* --------------------------------------------- one-shot URL normalisation */

  useEffect(() => {
    if (didNormalizeRef.current) return;
    didNormalizeRef.current = true;
    if (!didNormalize) return;
    // Exactly one replace, only for a non-canonical incoming URL. `scroll: false`
    // so a shared deep link does not yank the reader to the top of the page.
    router.replace(canonicalQuery ? `${basePath}?${canonicalQuery}` : basePath, { scroll: false });
    // Intentionally mount-only: whether the URL needed normalising is a property
    // of the request we were rendered for, not of any later state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------- mutations */

  const applyState = useCallback(
    (next: FilterState, changedGroups: string[]) => {
      setState(next);
      const query = serializeFilters(schema, next);
      pendingQueryRef.current = query;
      const href = query ? `${basePath}?${query}` : basePath;
      startTransition(() => router.push(href, { scroll: false }));
      for (const group of changedGroups) {
        track({
          name: "portfolio_filter_change",
          group,
          values_count: next[group]?.length ?? 0,
        });
      }
    },
    [basePath, router, schema],
  );

  const handleToggleValue = useCallback(
    (key: string, value: string) => {
      applyState(toggleValue(schema, state, key, value), [key]);
    },
    [applyState, schema, state],
  );

  const handleClearAll = useCallback(() => {
    applyState(clearAll(), Object.keys(state));
  }, [applyState, state]);

  const handleToggleOpen = useCallback((key: string) => {
    setOpenGroups((current) => ({ ...current, [key]: !(current[key] ?? true) }));
  }, []);

  /* ----------------------------------------------- inline panel (< 768px) */

  /**
   * Set when "Show N companies" closes the panel. The focus move is deferred to
   * the effect below so it happens *after* the panel has actually collapsed —
   * measuring the count's position while the panel is still laid out would scroll
   * the page for no reason.
   */
  const focusCountOnCloseRef = useRef(false);

  useEffect(() => {
    if (panelOpen || !focusCountOnCloseRef.current) return;
    focusCountOnCloseRef.current = false;
    const node = countRef.current;
    if (!node) return;
    // Do not move the page for the sake of focus; scroll only when the count is
    // genuinely out of view now that the panel is gone.
    node.focus({ preventScroll: true });
    const rect = node.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [panelOpen]);

  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape" || !panelOpen) return;
      // Only meaningful while the compact toolbar actually exists. `offsetParent`
      // is null when the trigger is `display: none`, i.e. at >= 768px, where the
      // panel is permanently visible and there is nothing to close.
      const trigger = triggerRef.current;
      if (!trigger || trigger.offsetParent === null) return;
      event.stopPropagation();
      setPanelOpen(false);
      trigger.focus();
    },
    [panelOpen],
  );

  /* ----------------------------------------------------------- derivations */

  const selectedCount = countSelected(state);

  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];
    for (const facet of facets) {
      const selected = state[facet.key] ?? [];
      for (const option of facet.options) {
        if (!selected.includes(option.slug)) continue;
        result.push({
          groupKey: facet.key,
          groupLegend: facet.legend,
          slug: option.slug,
          title: option.title,
          href: filtersToHref(basePath, schema, toggleValue(schema, state, facet.key, option.slug)),
        });
      }
    }
    return result;
  }, [basePath, facets, schema, state]);

  const countLabel =
    selectedCount > 0
      ? `${resultCount} of ${companyCountLabel(totalCount)}`
      : companyCountLabel(resultCount);

  /*
   * A portfolio too small to produce two values in any group gets no filter UI
   * at all — no toolbar, no chips, no count. The hooks above still ran, which is
   * deliberate: the schema built from an empty vocabulary rejects every incoming
   * param, so the one-shot replace still strips a stale `?stage=...` from a
   * shared link instead of leaving a query string that does nothing.
   */
  if (facets.length === 0) return null;

  return (
    <section className={styles.filters} aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="visually-hidden">
        Filter portfolio companies
      </h2>

      <div className={styles.toolbar}>
        <button
          type="button"
          ref={triggerRef}
          className={styles.trigger}
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen((open) => !open)}
        >
          Filter
          {selectedCount > 0 ? (
            <span className={styles.triggerCount}>({selectedCount})</span>
          ) : null}
        </button>
      </div>

      {/* Deliberately outside the collapsible panel: every selected value keeps a
          visible clear affordance even while the compact panel is closed. */}
      <FilterChipSummary
        chips={chips}
        clearAllHref={basePath}
        onRemove={(chip) =>
          applyState(toggleValue(schema, state, chip.groupKey, chip.slug), [chip.groupKey])
        }
        onClearAll={handleClearAll}
      />

      <div
        id={panelId}
        className={styles.panel}
        data-open={panelOpen ? "true" : "false"}
        onKeyDown={handlePanelKeyDown}
      >
        <div className={styles.groups}>
          {facets.map((facet) => (
            <FilterGroup
              key={facet.key}
              group={facet}
              selected={state[facet.key] ?? []}
              open={openGroups[facet.key] ?? true}
              idPrefix={uid}
              onToggleOpen={handleToggleOpen}
              onToggleValue={handleToggleValue}
            />
          ))}
        </div>

        <div className={styles.panelFooter}>
          <button
            type="button"
            className={styles.applyButton}
            onClick={() => {
              focusCountOnCloseRef.current = true;
              setPanelOpen(false);
            }}
          >
            Show {companyCountLabel(resultCount)}
          </button>
        </div>
      </div>

      <p
        id={countId}
        ref={countRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-busy={isPending || undefined}
        className={styles.count}
      >
        {countLabel}
      </p>
    </section>
  );
}
