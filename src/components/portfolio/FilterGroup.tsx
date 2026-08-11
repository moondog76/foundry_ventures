"use client";

/**
 * One filter group (§8.2, §18.1).
 *
 * Semantics that are non-negotiable:
 *  - a real `<fieldset>` with a real `<legend>` per group;
 *  - real `<input type="checkbox">` controls with globally unique ids, produced
 *    from the parent's `useId()` prefix so two instances could never collide;
 *  - the group heading is a real `<button>` carrying `aria-expanded` and
 *    `aria-controls`, and it surfaces the number of selected values so the count
 *    is available while the group is collapsed.
 *
 * The same markup serves every breakpoint. Collapsing is CSS/`data-open`, never
 * a second copy of the inputs — duplicated ids are the classic way this pattern
 * breaks label association and screen-reader navigation.
 */

import type { FacetGroup } from "@/content/types";
import styles from "./filter-group.module.css";

export type FilterGroupProps = {
  group: FacetGroup;
  selected: string[];
  open: boolean;
  idPrefix: string;
  onToggleOpen: (key: string) => void;
  onToggleValue: (key: string, value: string) => void;
};

export function FilterGroup({
  group,
  selected,
  open,
  idPrefix,
  onToggleOpen,
  onToggleValue,
}: FilterGroupProps) {
  const contentId = `${idPrefix}-group-${group.key}`;

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => onToggleOpen(group.key)}
        >
          <span className={styles.legendText}>{group.legend}</span>
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
          {group.options.map((option) => {
            const inputId = `${idPrefix}-${group.key}-${option.slug}`;
            return (
              /* Keyed by the value, never by index: React must reuse the exact
                 same DOM input across a filter navigation so the control the
                 user just activated keeps focus (§18.1). */
              <li key={option.slug} className={styles.optionRow}>
                <input
                  id={inputId}
                  className={styles.input}
                  type="checkbox"
                  name={group.key}
                  value={option.slug}
                  checked={selected.includes(option.slug)}
                  onChange={() => onToggleValue(group.key, option.slug)}
                />
                <label className={styles.option} htmlFor={inputId}>
                  <span className={styles.optionTitle}>{option.title}</span>
                  <span className={styles.optionCount}>
                    {option.count}
                    <span className="visually-hidden">
                      {option.count === 1 ? " company" : " companies"}
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
}
