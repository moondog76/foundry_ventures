"use client";

/**
 * The ocean's slow vertical drift.
 *
 * This is deliberately much smaller than what it replaced. The previous hook
 * drove pointer-tracked translation, a rotation tilt and 32% of viewport height
 * of scroll travel, shared with two editorial stills. §10.4 of the enhancement
 * brief forbids cursor-following distortion and parallax "greater than a few
 * percent"; §10.1 allows exactly one continuous motion source, the ocean, with
 * everything else responding briefly to user or scroll state.
 *
 * That reverses an explicit instruction from 2026-08-11 to make the motion much
 * stronger on both scroll and cursor. It is logged in `docs/content-gaps.md`
 * §F3, and `SCROLL_TRAVEL` below is the single number to change to restore it.
 *
 * What survives, because it was right before and is still right:
 *
 *  - **Motion is refused, not reduced.** `prefers-reduced-motion` and Save-Data
 *    both pin the offset at 0 and pause playback.
 *  - **Nothing runs off-screen.** An IntersectionObserver stops the loop while
 *    the element is out of view.
 *  - **Offsets are clamped to the element's own overscan**, measured per frame
 *    from the live box rather than assumed, so a short viewport can never slide
 *    the media's edge into frame.
 */

import { useEffect, type RefObject } from "react";

export type ParallaxSettings = {
  /**
   * Vertical drift across the element's own scroll, as a fraction of its
   * height. §10.4's ceiling is "a few percent" — 0.05 reads as depth without
   * ever reading as an effect.
   */
  scrollTravel: number;
  /** Follow speed. Higher tracks scroll more tightly. */
  easing: number;
  /** How far the media oversizes its frame each side, as a fraction. */
  overscan: number;
};

/** Leaves margin so rounding never exposes an edge at the clamp boundary. */
const SAFE_FRACTION = 0.82;

export type ParallaxOptions = {
  settings: ParallaxSettings;
  /** Runs whenever motion is enabled or disabled — used to pause video. */
  onMotionChange?: (enabled: boolean) => void;
  /**
   * User-facing pause. Distinct from `prefers-reduced-motion`: this is the
   * §10.5 control, an explicit choice made in-session, and it must win over the
   * OS setting in both directions.
   */
  paused?: boolean;
};

export function useAmbientParallax(
  ref: RefObject<HTMLElement | null>,
  { settings, onMotionChange, paused = false }: ParallaxOptions,
): void {
  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } & EventTarget }
    ).connection;

    let target = 0;
    let current = 0;
    let frame = 0;
    let visible = true;

    const motionAllowed = () =>
      !paused && !reducedMotion.matches && connection?.saveData !== true;

    const schedule = () => {
      if (!frame && visible) frame = requestAnimationFrame(render);
    };

    function render() {
      frame = 0;
      current += (target - current) * settings.easing;
      const { height } = scene!.getBoundingClientRect();
      const limit = height * settings.overscan * SAFE_FRACTION;
      const y = Math.max(-limit, Math.min(limit, current));
      scene!.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      if (Math.abs(target - current) > 0.08) schedule();
    }

    const onScroll = () => {
      if (!motionAllowed()) {
        target = 0;
        schedule();
        return;
      }
      const rect = scene!.getBoundingClientRect();
      // -1 as the element enters from below, 0 as it centres, +1 as it leaves
      // above. Centring on 0 keeps the hero neutral when it is the thing you
      // are actually looking at.
      const centre = rect.top + rect.height / 2;
      const progress = (window.innerHeight / 2 - centre) / Math.max(1, window.innerHeight);
      target =
        Math.max(-1, Math.min(1, progress)) * window.innerHeight * settings.scrollTravel;
      schedule();
    };

    const syncMotionMode = () => {
      const enabled = motionAllowed();
      scene.dataset.static = enabled ? "false" : "true";
      onMotionChange?.(enabled);
      if (!enabled) target = 0;
      schedule();
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              if (visible) {
                onScroll();
              } else if (frame) {
                cancelAnimationFrame(frame);
                frame = 0;
              }
            },
            { rootMargin: "20% 0px" },
          );
    observer?.observe(scene);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", syncMotionMode);
    reducedMotion.addEventListener("change", syncMotionMode);
    connection?.addEventListener?.("change", syncMotionMode);

    onScroll();
    syncMotionMode();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", syncMotionMode);
      reducedMotion.removeEventListener("change", syncMotionMode);
      connection?.removeEventListener?.("change", syncMotionMode);
    };
  }, [ref, settings, onMotionChange, paused]);
}
