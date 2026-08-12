"use client";

/**
 * The ocean field, its pause control, and whatever sits between them.
 *
 * This wrapper exists for one reason: **focus order must follow visual order**
 * (§14.5). The control is painted in the hero's bottom corner, below the
 * headline and the CTAs, but it is a sibling of the video — so rendering it
 * inside `AmbientOcean` put it before the hero content in the DOM, and a
 * keyboard user reached "Pause background" before "Meet the teams".
 *
 * CSS `order` cannot fix that, and should not: tab order follows the DOM, which
 * is correct behaviour. So the shared `paused` state lives here instead, and the
 * three pieces render in the order a sighted user reads them:
 *
 *     background  →  {children}  →  pause control
 *
 * `children` is server-rendered content passed through a client boundary, which
 * costs nothing: it is already serialised into the RSC payload and this
 * component never inspects it.
 */

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { AmbientOcean } from "./AmbientOcean";
import { MotionControl } from "./MotionControl";
import { oceanPreference } from "./ocean-preference";

export type OceanFieldProps = {
  /** Class applied to the media layer itself, for the hero's own positioning. */
  mediaClassName?: string;
  children: ReactNode;
};

export function OceanField({ mediaClassName, children }: OceanFieldProps) {
  /*
   * Session-scoped, so the choice survives navigation without becoming a
   * long-lived preference nobody remembers setting. `sessionStorage` is not a
   * cookie and carries no consent obligation, which keeps §12.8 intact.
   */
  const paused = useSyncExternalStore(
    oceanPreference.subscribe,
    oceanPreference.getSnapshot,
    oceanPreference.getServerSnapshot,
  );

  const togglePaused = useCallback(() => {
    oceanPreference.setPaused(!oceanPreference.getSnapshot());
  }, []);

  return (
    <>
      <AmbientOcean className={mediaClassName} paused={paused} />
      {children}
      <MotionControl paused={paused} onToggle={togglePaused} />
    </>
  );
}
