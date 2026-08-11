"use client";

/**
 * Post-submission confirmation (§19.5, §20.5).
 *
 * Replaces the form entirely, which is also the last line of double-submit
 * defence: there is no longer a button to press twice.
 *
 * Announcement is deliberately belt-and-braces, because losing a confirmation is
 * worse than hearing it twice: the region carries `role="status"` (polite, so it
 * never interrupts), and focus moves to the heading so a screen-reader user is
 * placed at the start of the confirmation rather than left where the submit
 * button used to be.
 */

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./forms.module.css";

export type FormSuccessProps = {
  headingId: string;
  title: string;
  children: ReactNode;
  /** Shown so a founder can quote it if they ever need to follow up. */
  reference?: string | null;
  referenceLabel?: string;
};

export function FormSuccess({
  headingId,
  title,
  children,
  reference,
  referenceLabel = "Reference",
}: FormSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={styles.success} role="status">
      <h2 id={headingId} ref={headingRef} className={styles.successHeading} tabIndex={-1}>
        {title}
      </h2>
      <div className={styles.successBody}>{children}</div>
      {reference ? (
        <p className={styles.successReference}>
          {referenceLabel}: <code>{reference}</code>
        </p>
      ) : null}
    </div>
  );
}
