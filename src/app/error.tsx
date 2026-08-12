"use client";

/**
 * Route error boundary (§6.4).
 *
 * An error boundary has to be a Client Component — React needs `reset` to be a
 * callable prop — but nothing about that requires it to be chatty. Two rules:
 *
 *  1. **The visitor never sees the error.** Not `error.message`, not the stack,
 *     not the constructor name. In production React already redacts the message
 *     to a generic string, but in development it is the real one, and a
 *     development build shown to a stakeholder must not leak a file path, a
 *     query fragment or an internal hostname into the page. Only `error.digest`
 *     is surfaced, and only as an opaque reference someone can quote to us — it
 *     is a hash, deliberately carrying no information on its own.
 *  2. **Recovery comes before explanation.** `reset()` re-renders the failed
 *     segment, which is genuinely the fix for a transient data error, so it is
 *     the first thing in the tab order after the heading.
 *
 * `reset` is a real `<button>` because it acts on this page; the other two are
 * real `<a>`s because they navigate (§20.2).
 */

import { useEffect } from "react";
import { ButtonLink, Container, SectionEyebrow, uiStyles } from "@/components/ui";
import styles from "./error.module.css";

export type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    // The digest correlates this render with the full server-side log entry.
    // The message itself stays out of it: the server has already logged it with
    // context, and repeating it here only copies it somewhere with none.
    console.error(`[error-boundary] render failed (digest: ${error.digest ?? "none"})`);
  }, [error.digest]);

  return (
    // A plain element rather than the `Section` primitive — see the note in
    // `not-found.tsx`: this page owns its own vertical rhythm.
    <div className={styles.page}>
      <Container>
        <div className={styles.inner}>
          <SectionEyebrow>Error</SectionEyebrow>

          <h1 className={styles.heading}>Something went wrong</h1>

          <p className={styles.body}>
            This page didn&rsquo;t finish loading. Trying again usually fixes it.
          </p>

          <div className={styles.actions}>
            <button type="button" className={uiStyles.button} onClick={reset}>
              Try again
            </button>
            <ButtonLink href="/" variant="secondary">
              Go to the home page
            </ButtonLink>
          </div>

          <p className={styles.followUp}>
            If it keeps happening, use the contact details at the bottom of this page.
          </p>

          {error.digest ? (
            <p className={styles.reference}>
              {/* Quoting this back to us is the fastest way to find the exact
                  failure in the server log. */}
              Reference <code className={styles.digest}>{error.digest}</code>
            </p>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
