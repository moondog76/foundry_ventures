/**
 * Skip link (§6.2): the first focusable element on every page.
 */

import styles from "./skip-link.module.css";

export function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Skip to content
    </a>
  );
}
