"use client";

/**
 * Shared pointer + scroll parallax, extracted from the supplied
 * `ocean-motion-background` package so the hero video and the editorial stills
 * move by the same rules rather than two near-copies drifting apart.
 *
 * It writes three CSS custom properties on the element and nothing else:
 *
 *     --motion-x   --motion-y   --motion-rotate
 *
 * The consumer decides what to do with them, which is why the same hook can
 * drive a `<video>` and an `<img>`.
 *
 * Invariants worth keeping:
 *
 *  - **Offsets are clamped to the element's own overscan.** Pointer, scroll and
 *    rotation all draw on one budget whose worst case depends on the viewport's
 *    aspect ratio, so the limit is computed per frame from the live box rather
 *    than assumed. Without this, a short window slides the media's edge into
 *    frame while a tall one looks fine.
 *  - **Motion is refused, not reduced.** `prefers-reduced-motion` and Save-Data
 *    both pin every value at 0.
 *  - **Pointer parallax needs a fine pointer.** On touch there is no hover
 *    position to track, so only the scroll component runs.
 *  - **Nothing runs off-screen.** An IntersectionObserver stops the work while
 *    the element is out of view, so a background that nobody can see costs
 *    nothing.
 */

import { useEffect, type RefObject } from "react";

export type ParallaxSettings = {
  /** Horizontal pointer travel, as a fraction of viewport width. */
  pointerX: number;
  /** Vertical pointer travel, as a fraction of viewport height. */
  pointerY: number;
  /** Vertical drift across the element's own scroll, as a fraction of height. */
  scrollTravel: number;
  /** Degrees of tilt at the far edges. */
  rotation: number;
  /** Follow speed. Higher tracks the pointer more tightly. */
  easing: number;
  /** How far the media oversizes its frame each side, as a fraction. */
  overscan: number;
};

/** Leaves margin so rounding and the rotation's corner sweep stay covered. */
const SAFE_FRACTION = 0.82;

export type ParallaxOptions = {
  settings: ParallaxSettings;
  /** Runs whenever motion is enabled or disabled — used to pause video. */
  onMotionChange?: (enabled: boolean) => void;
};

export function useAmbientParallax(
  ref: RefObject<HTMLElement | null>,
  { settings, onMotionChange }: ParallaxOptions,
): void {
  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } & EventTarget }
    ).connection;

    const target = { x: 0, y: 0, scrollY: 0, rotation: 0 };
    const current = { ...target };
    let frame = 0;
    let visible = true;

    const motionAllowed = () => !reducedMotion.matches && connection?.saveData !== true;
    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

    const schedule = () => {
      if (!frame && visible) frame = requestAnimationFrame(render);
    };

    function render() {
      frame = 0;
      let moving = false;
      for (const key of ["x", "y", "scrollY", "rotation"] as const) {
        current[key] += (target[key] - current[key]) * settings.easing;
        if (Math.abs(target[key] - current[key]) > 0.08) moving = true;
      }

      const { width, height } = scene!.getBoundingClientRect();
      const x = clamp(current.x, width * settings.overscan * SAFE_FRACTION);
      // Pointer and scroll share the vertical budget, so they are clamped
      // together: either alone stays inside it, both at their extremes do not.
      const y = clamp(current.y + current.scrollY, height * settings.overscan * SAFE_FRACTION);

      scene!.style.setProperty("--motion-x", `${x.toFixed(2)}px`);
      scene!.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      scene!.style.setProperty("--motion-rotate", `${current.rotation.toFixed(3)}deg`);
      if (moving) schedule();
    }

    const resetPointer = () => {
      target.x = 0;
      target.y = 0;
      target.rotation = 0;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!motionAllowed() || !finePointer.matches) return;
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      target.x = -nx * window.innerWidth * settings.pointerX;
      target.y = -ny * window.innerHeight * settings.pointerY;
      target.rotation = nx * settings.rotation;
      schedule();
    };

    const onScroll = () => {
      if (!motionAllowed()) {
        target.scrollY = 0;
        schedule();
        return;
      }
      const rect = scene!.getBoundingClientRect();
      // -1 as the element enters from below, 0 as it centres, +1 as it leaves
      // above. Centring on 0 keeps a mid-page image neutral when it is the thing
      // you are actually looking at.
      const centre = rect.top + rect.height / 2;
      const progress = (window.innerHeight / 2 - centre) / Math.max(1, window.innerHeight);
      target.scrollY = clamp(progress, 1) * window.innerHeight * settings.scrollTravel;
      schedule();
    };

    const syncMotionMode = () => {
      const enabled = motionAllowed();
      scene.dataset.static = enabled ? "false" : "true";
      onMotionChange?.(enabled);
      if (!enabled) {
        resetPointer();
        target.scrollY = 0;
      }
      schedule();
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) resetPointer();
    };

    // Out of view costs nothing: the loop stops and the listeners idle. Where
    // the API is missing the element simply counts as always visible, so the
    // effect degrades to "always on" rather than failing.
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

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", syncMotionMode);
    reducedMotion.addEventListener("change", syncMotionMode);
    finePointer.addEventListener("change", resetPointer);
    connection?.addEventListener?.("change", syncMotionMode);

    onScroll();
    syncMotionMode();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", syncMotionMode);
      reducedMotion.removeEventListener("change", syncMotionMode);
      finePointer.removeEventListener("change", resetPointer);
      connection?.removeEventListener?.("change", syncMotionMode);
    };
    // `settings` is a module-level constant at every call site, so the effect
    // runs once per mount rather than on every render.
  }, [ref, settings, onMotionChange]);
}
