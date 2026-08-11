"use client";

/**
 * Visible summary of everything currently selected (§8.2, §18.1).
 *
 * Each chip is a real `<a href>` pointing at the URL that results from removing
 * that one value, so the archive is still fully operable without JavaScript and
 * "open in a new tab" behaves. With JavaScript we intercept a plain left click
 * and route through `router.push(..., { scroll: false })` instead, which is what
 * keeps the browser Back button stepping one filter at a time.
 */

import { isPlainLeftClick } from "./link-intent";
import styles from "./filter-chip-summary.module.css";

export type FilterChip = {
  groupKey: string;
  groupLegend: string;
  slug: string;
  title: string;
  /** Canonical href with this one value removed. */
  href: string;
};

export type FilterChipSummaryProps = {
  chips: FilterChip[];
  clearAllHref: string;
  onRemove: (chip: FilterChip) => void;
  onClearAll: () => void;
};

export function FilterChipSummary({
  chips,
  clearAllHref,
  onRemove,
  onClearAll,
}: FilterChipSummaryProps) {
  // Nothing selected: no chips, no "Clear all", no reserved empty strip.
  if (chips.length === 0) return null;

  return (
    <div className={styles.summary}>
      <ul className={styles.list} role="list">
        {chips.map((chip) => (
          <li key={`${chip.groupKey}:${chip.slug}`}>
            <a
              className={styles.chip}
              href={chip.href}
              onClick={(event) => {
                if (!isPlainLeftClick(event)) return;
                event.preventDefault();
                onRemove(chip);
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
        href={clearAllHref}
        onClick={(event) => {
          if (!isPlainLeftClick(event)) return;
          event.preventDefault();
          onClearAll();
        }}
      >
        Clear all
      </a>
    </div>
  );
}
