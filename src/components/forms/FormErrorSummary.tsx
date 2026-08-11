"use client";

/**
 * Validation error summary (§20.5).
 *
 * Rendered at the top of the form whenever a submission fails validation. Each
 * entry links to the control that produced it, and the container itself takes
 * focus so a screen-reader or keyboard user is put in front of the problem
 * instead of being left at the bottom of a form that silently did nothing.
 *
 * Focus is moved rather than announced through `role="alert"`: doing both makes
 * most screen readers read the summary twice.
 */

import { useEffect, useRef } from "react";
import styles from "./forms.module.css";

export type FormErrorSummaryItem = {
  /** Field name from the schema — used only as a React key. */
  field: string;
  /** Human label, e.g. "One-line pitch". Omitted for form-level messages. */
  label?: string;
  message: string;
  /** DOM id of the control, or null for an error that belongs to no field. */
  targetId: string | null;
};

export type FormErrorSummaryProps = {
  id: string;
  headingId: string;
  heading: string;
  items: FormErrorSummaryItem[];
  /**
   * Changes on every failed submit. Re-focuses the summary when a second
   * attempt fails, which a mount-only effect would miss.
   */
  focusToken: number;
};

export function FormErrorSummary({
  id,
  headingId,
  heading,
  items,
  focusToken,
}: FormErrorSummaryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, [focusToken]);

  if (items.length === 0) return null;

  return (
    <div
      id={id}
      ref={containerRef}
      className={styles.summary}
      tabIndex={-1}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={styles.summaryHeading}>
        {heading}
      </h2>
      <ul className={styles.summaryList}>
        {items.map((item) => (
          <li key={item.field}>
            {item.targetId ? (
              <a
                href={`#${item.targetId}`}
                className={styles.summaryLink}
                onClick={(event) => {
                  const target = document.getElementById(item.targetId as string);
                  if (!target) return; // Let the browser try the hash instead.
                  // Focusing the control is what the user actually wants; the
                  // default hash jump would only scroll. `scroll-margin-top` on
                  // the field keeps it clear of the fixed header.
                  event.preventDefault();
                  target.focus();
                }}
              >
                {item.label ? `${item.label}: ` : null}
                {item.message}
              </a>
            ) : (
              <span className={styles.summaryItemStatic}>
                {item.label ? `${item.label}: ` : null}
                {item.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
