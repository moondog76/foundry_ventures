"use client";

/**
 * Pause/resume for the ocean loop (§10.5, §14.5).
 *
 * WCAG 2.2 SC 2.2.2 requires a mechanism to pause any motion that starts
 * automatically and runs for more than five seconds. The loop is decorative, so
 * a reduced-motion user never sees it — but a user who has *not* set that
 * preference and simply finds the movement distracting had no recourse before
 * this control existed, which is the gap the audit named at §2.5.
 *
 * Design notes, because a control on a video is easy to get subtly wrong:
 *
 *  - It is a `<button>` with a text label, not an icon-only affordance. The
 *    glyph is `aria-hidden` and the label carries the meaning, so the accessible
 *    name changes with state rather than needing `aria-pressed` to be
 *    interpreted (§14.5: accessible name for pause/play).
 *  - It sits in the hero's bottom corner at a 44×44px minimum target (§12.10),
 *    above the overlay so it is reachable by both pointer and keyboard.
 *  - Under `prefers-reduced-motion` the loop is already static, so the control
 *    hides itself rather than offering to pause something that is not moving.
 */

import styles from "./motion-control.module.css";

export type MotionControlProps = {
  paused: boolean;
  onToggle: () => void;
};

export function MotionControl({ paused, onToggle }: MotionControlProps) {
  return (
    <button type="button" className={styles.control} onClick={onToggle}>
      <span className={styles.glyph} aria-hidden="true">
        {paused ? "▶" : "❙❙"}
      </span>
      <span className={styles.label}>{paused ? "Play background" : "Pause background"}</span>
    </button>
  );
}
