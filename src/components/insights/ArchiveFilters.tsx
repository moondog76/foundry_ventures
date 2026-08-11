"use client";

/**
 * URL-synced archive filters, shared by `/insights` and `/network`
 * (§8.2, §12.1, §14, §18.1, §19.3).
 *
 * The URL is the source of truth; this component never re-implements the filter
 * semantics, it only drives `@/lib/filters/engine`. It is schema-driven, so the
 * same component renders the Insights type checkboxes and the Network
 * radio + checkbox pair without either archive owning a copy of this logic.
 *
 * Behaviour contract:
 *  - every explicit user action issues `router.push(href, { scroll: false })`,
 *    so Back walks one filter step at a time and the viewport does not jump;
 *  - `router.replace(normalizeHref, { scroll: false })` fires **once**, and only
 *    when the incoming URL was not already canonical. The href is computed by
 *    the server so params this component does not own (`?page=`) survive the
 *    normalisation instead of being silently dropped;
 *  - a filter change deliberately does *not* carry `?page=` forward: a new
 *    result set starts at page one;
 *  - the control the user activated keeps focus: one input tree, keyed by value,
 *    stays mounted across the navigation instead of being rebuilt;
 *  - the result count lives in an `aria-live="polite"` region;
 *  - below 768px a compact toolbar toggles an INLINE panel. It is not a modal
 *    and not a bottom sheet, so it is deliberately NOT a focus trap: the page
 *    behind it stays reachable. Escape closes it and returns focus to the
 *    trigger; the "Show N …" button closes it and moves focus to the count.
 *
 * A radio group renders an explicit "All" option because a native radio cannot
 * be unchecked by clicking it again — "All" is the absence of the parameter, and
 * choosing it clears the group.
 *
 * When the caller passed no facets (the content layer found fewer than two
 * values in every group) this renders nothing at all: an archive too small to
 * filter must not be dressed up with controls that cannot filter.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  clearAll,
  clearGroup,
  countSelected,
  filtersToHref,
  parseFilters,
  serializeFilters,
  toggleValue,
  type FilterSchema,
  type FilterState,
} from "@/lib/filters/engine";
import type { FacetGroup } from "@/content/types";
import { isPlainLeftClick } from "./link-intent";
import styles from "./archive-filters.module.css";

/** Singular/plural noun for the archive's records. Serializable by design: a
 *  formatter function cannot cross the server/client boundary. */
export type ArchiveNoun = { one: string; other: string };

export type ArchiveFiltersProps = {
  /** Route the filters belong to, e.g. "/insights". */
  basePath: string;
  facets: FacetGroup[];
  /** The exact schema the server parsed with, so client and server agree. */
  schema: FilterSchema;
  /** Parsed, canonical filter state for the incoming URL. */
  initialState: FilterState;
  /** Canonical *filter* query for the incoming URL, without "?". */
  canonicalQuery: string;
  /**
   * Full canonical href for the incoming request, or null when the URL was
   * already canonical. Includes non-filter params such as `?page=`.
   */
  normalizeHref: string | null;
  /** Records the server rendered for this URL, before pagination. */
  resultCount: number;
  /** Records with no filters applied. */
  totalCount: number;
  noun: ArchiveNoun;
  /** Visually hidden name for the filter region. */
  heading: string;
  /** Label for the "no value selected" option of a radio group. */
  allOptionLabel?: string;
};

type Chip = {
  groupKey: string;
  groupLegend: string;
  slug: string;
  title: string;
  /** Canonical href with this one value removed. */
  href: string;
};

export function ArchiveFilters({
  basePath,
  facets,
  schema,
  initialState,
  canonicalQuery,
  normalizeHref,
  resultCount,
  totalCount,
  noun,
  heading,
  allOptionLabel = "All",
}: ArchiveFiltersProps) {
  const router = useRouter();
  const uid = useId();
  const panelId = `${uid}-panel`;

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
   * renders that would otherwise pull the inputs back to a stale state.
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
    if (!normalizeHref) return;
    // Exactly one replace, only for a non-canonical incoming URL. `scroll: false`
    // so a shared deep link does not yank the reader to the top of the page.
    router.replace(normalizeHref, { scroll: false });
    // Intentionally mount-only: whether the URL needed normalising is a property
    // of the request we were rendered for, not of any later state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------- mutations */

  const applyState = useCallback(
    (next: FilterState) => {
      setState(next);
      const query = serializeFilters(schema, next);
      pendingQueryRef.current = query;
      // Deliberately built from filters alone: changing a filter returns the
      // reader to the first page of the new result set.
      const href = query ? `${basePath}?${query}` : basePath;
      startTransition(() => router.push(href, { scroll: false }));
    },
    [basePath, router, schema],
  );

  const handleToggleValue = useCallback(
    (key: string, value: string) => {
      applyState(toggleValue(schema, state, key, value));
    },
    [applyState, schema, state],
  );

  const handleClearGroup = useCallback(
    (key: string) => {
      applyState(clearGroup(state, key));
    },
    [applyState, state],
  );

  const handleClearAll = useCallback(() => {
    applyState(clearAll());
  }, [applyState]);

  const handleToggleOpen = useCallback((key: string) => {
    setOpenGroups((current) => ({ ...current, [key]: !(current[key] ?? true) }));
  }, []);

  /* ----------------------------------------------- inline panel (< 768px) */

  /**
   * Set when the "Show N …" button closes the panel. The focus move is deferred
   * to the effect below so it happens *after* the panel has actually collapsed —
   * measuring the count's position while the panel is still laid out would
   * scroll the page for no reason.
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
  const countLabel = useCallback(
    (value: number) => `${value} ${value === 1 ? noun.one : noun.other}`,
    [noun],
  );

  const chips = useMemo<Chip[]>(() => {
    const result: Chip[] = [];
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

  const summaryLabel =
    selectedCount > 0 ? `${resultCount} of ${countLabel(totalCount)}` : countLabel(resultCount);

  /*
   * An archive too small to produce two values in any group gets no filter UI at
   * all. The hooks above still ran, which is deliberate: the schema built from an
   * empty vocabulary rejects every incoming param, so the one-shot replace still
   * strips a stale `?type=…` from a shared link instead of leaving a query string
   * that does nothing.
   */
  if (facets.length === 0) return null;

  return (
    <section className={styles.filters} aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`} className="visually-hidden">
        {heading}
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
      {chips.length > 0 ? (
        <div className={styles.summary}>
          <ul className={styles.chipList} role="list">
            {chips.map((chip) => (
              <li key={`${chip.groupKey}:${chip.slug}`}>
                <a
                  className={styles.chip}
                  href={chip.href}
                  onClick={(event) => {
                    if (!isPlainLeftClick(event)) return;
                    event.preventDefault();
                    applyState(toggleValue(schema, state, chip.groupKey, chip.slug));
                  }}
                >
                  <span className={styles.chipLabel}>
                    <span className={styles.chipGroup}>{chip.groupLegend}:</span> {chip.title}
                  </span>
                  <span className={styles.chipRemove} aria-hidden="true">
                    ×
                  </span>
                  <span className="visually-hidden"> — remove filter</span>
                </a>
              </li>
            ))}
          </ul>

          <a
            className={styles.clearAll}
            href={basePath}
            onClick={(event) => {
              if (!isPlainLeftClick(event)) return;
              event.preventDefault();
              handleClearAll();
            }}
          >
            Clear all
          </a>
        </div>
      ) : null}

      <div
        id={panelId}
        className={styles.panel}
        data-open={panelOpen ? "true" : "false"}
        onKeyDown={handlePanelKeyDown}
      >
        <div className={styles.groups}>
          {facets.map((facet) => {
            const selected = state[facet.key] ?? [];
            const open = openGroups[facet.key] ?? true;
            const contentId = `${uid}-group-${facet.key}`;
            const groupName = `${uid}-${facet.key}`;

            return (
              <fieldset key={facet.key} className={styles.group}>
                <legend className={styles.legend}>
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() => handleToggleOpen(facet.key)}
                  >
                    <span className={styles.legendText}>{facet.legend}</span>
                    {selected.length > 0 ? (
                      <span className={styles.selectedCount}>
                        {selected.length}
                        <span className="visually-hidden"> selected</span>
                      </span>
                    ) : null}
                    <svg
                      className={styles.chevron}
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M2.5 4.5L6 8l3.5-3.5" />
                    </svg>
                  </button>
                </legend>

                <div id={contentId} className={styles.options} data-open={open ? "true" : "false"}>
                  <ul className={styles.optionList} role="list">
                    {facet.control === "radio" ? (
                      <li className={styles.optionRow}>
                        <input
                          id={`${uid}-${facet.key}-all`}
                          className={styles.input}
                          type="radio"
                          name={groupName}
                          value=""
                          checked={selected.length === 0}
                          onChange={() => handleClearGroup(facet.key)}
                        />
                        <label className={styles.option} htmlFor={`${uid}-${facet.key}-all`}>
                          <span className={styles.optionTitle}>{allOptionLabel}</span>
                        </label>
                      </li>
                    ) : null}

                    {facet.options.map((option) => {
                      const inputId = `${uid}-${facet.key}-${option.slug}`;
                      return (
                        /* Keyed by the value, never by index: React must reuse the
                           exact same DOM input across a filter navigation so the
                           control the user just activated keeps focus (§18.1). */
                        <li key={option.slug} className={styles.optionRow}>
                          <input
                            id={inputId}
                            className={styles.input}
                            type={facet.control === "radio" ? "radio" : "checkbox"}
                            name={groupName}
                            value={option.slug}
                            checked={selected.includes(option.slug)}
                            onChange={() => handleToggleValue(facet.key, option.slug)}
                          />
                          <label className={styles.option} htmlFor={inputId}>
                            <span className={styles.optionTitle}>{option.title}</span>
                            <span className={styles.optionCount}>
                              {option.count}
                              <span className="visually-hidden">
                                {` ${option.count === 1 ? noun.one : noun.other}`}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </fieldset>
            );
          })}
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
            Show {countLabel(resultCount)}
          </button>
        </div>
      </div>

      <p
        ref={countRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-busy={isPending || undefined}
        className={styles.count}
      >
        {summaryLabel}
      </p>
    </section>
  );
}
