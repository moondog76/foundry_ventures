"use client";

/**
 * The hero's ambient ocean background.
 *
 * A port of the supplied `ocean-motion-background` package (kept verbatim in
 * `assets-supplied/` for reference) into a scoped React component. Two changes
 * from the original, both deliberate:
 *
 *  - it is positioned inside the hero rather than `fixed` behind the whole
 *    document, because only the hero is a full-bleed dark surface here;
 *  - the listeners live in an effect with real teardown instead of a global
 *    IIFE, so nothing survives a client navigation.
 *
 * The behaviour that matters is unchanged and is what makes motion acceptable
 * under §7.1 and §20.4:
 *
 *  - the poster is a CSS background, so the still frame is painted before any
 *    video loads and remains the whole experience if it never does;
 *  - `prefers-reduced-motion: reduce` and Save-Data both drop straight to that
 *    still — the video is hidden *and* paused, never merely slowed;
 *  - parallax only responds to a fine pointer, and is skipped entirely on touch;
 *  - playback pauses when the tab is hidden, and a decode error falls back to
 *    the still rather than leaving a black rectangle.
 *
 * Server markup renders the video element with the poster already applied, so
 * nothing here depends on hydration to look right.
 */

import { useEffect, useRef } from "react";
import styles from "./ambient-ocean.module.css";

/**
 * Motion strength. The supplied package shipped these at roughly a quarter of
 * these values — deliberately subtle; the owner asked for considerably more on
 * 2026-08-11.
 *
 * Each number is a fraction of the viewport, so the effect is proportional on a
 * laptop and a 5K display alike. They are safe to raise further only alongside
 * `OVERSCAN`, which is what stops the video's own edge from sliding into view.
 */
const SETTINGS = {
  /** Horizontal pointer travel, as a fraction of viewport width. */
  pointerX: 0.14,
  /** Vertical pointer travel, as a fraction of viewport height. */
  pointerY: 0.1,
  /** Vertical drift across the hero's full scroll, as a fraction of height. */
  scrollTravel: 0.32,
  /** Degrees of tilt at the far edges. */
  rotation: 1.6,
  /** Follow speed. Higher tracks the pointer more tightly. */
  easing: 0.09,
} as const;

/**
 * How far the video oversizes its frame on each side, matching `--overscan` in
 * the stylesheet.
 *
 * This is the headroom the parallax moves within. Every offset is clamped to it
 * below rather than trusted to stay inside by arithmetic, because pointer, scroll
 * and rotation all consume the same budget and their worst case depends on the
 * viewport's aspect ratio — a short window runs out of vertical headroom long
 * before a tall one does.
 */
const OVERSCAN = 0.22;
/** Leaves a margin so rounding and the rotation's corner sweep stay covered. */
const SAFE_FRACTION = 0.82;

export function AmbientOcean({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const video = scene.querySelector("video");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } & EventTarget }
    ).connection;

    const target = { x: 0, y: 0, scrollY: 0, rotation: 0 };
    const current = { ...target };
    let frame = 0;

    const motionAllowed = () => !reducedMotion.matches && connection?.saveData !== true;

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

    function render() {
      frame = 0;
      let moving = false;
      for (const key of ["x", "y", "scrollY", "rotation"] as const) {
        current[key] += (target[key] - current[key]) * SETTINGS.easing;
        if (Math.abs(target[key] - current[key]) > 0.08) moving = true;
      }

      // Pointer and scroll share one vertical budget, so they are clamped
      // together: either alone stays well inside the overscan, but at the
      // extremes of both they would not.
      const { width, height } = scene!.getBoundingClientRect();
      const maxX = width * OVERSCAN * SAFE_FRACTION;
      const maxY = height * OVERSCAN * SAFE_FRACTION;
      const x = clamp(current.x, maxX);
      const y = clamp(current.y + current.scrollY, maxY);

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
      target.x = -nx * window.innerWidth * SETTINGS.pointerX;
      target.y = -ny * window.innerHeight * SETTINGS.pointerY;
      target.rotation = nx * SETTINGS.rotation;
      schedule();
    };

    const onScroll = () => {
      if (!motionAllowed()) {
        target.scrollY = 0;
        schedule();
        return;
      }
      // Parallax is driven by the hero's own travel, not the whole document:
      // once the hero has scrolled away there is nothing left to move.
      const rect = scene!.getBoundingClientRect();
      // 0 while the hero is at rest at the top of the page, rising to 1 once it
      // has scrolled fully past. Anchoring at 0 matters: a symmetric -1..+1
      // range would leave the crop already displaced on first paint, before the
      // visitor has done anything.
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      target.scrollY = progress * window.innerHeight * SETTINGS.scrollTravel;
      schedule();
    };

    const syncMotionMode = async () => {
      const isStatic = !motionAllowed();
      scene!.dataset.static = isStatic ? "true" : "false";
      if (isStatic || document.hidden) {
        video?.pause();
        resetPointer();
        target.scrollY = 0;
        schedule();
        return;
      }
      try {
        await video?.play();
        scene!.dataset.static = "false";
      } catch {
        // Autoplay refused (common on metered or low-power devices): the poster
        // is already painted, so there is nothing else to do.
        scene!.dataset.static = "true";
      }
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) resetPointer();
    };
    const onVideoError = () => {
      scene!.dataset.static = "true";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", syncMotionMode);
    video?.addEventListener("error", onVideoError);
    reducedMotion.addEventListener("change", syncMotionMode);
    finePointer.addEventListener("change", resetPointer);
    connection?.addEventListener?.("change", syncMotionMode);

    onScroll();
    void syncMotionMode();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", syncMotionMode);
      video?.removeEventListener("error", onVideoError);
      reducedMotion.removeEventListener("change", syncMotionMode);
      finePointer.removeEventListener("change", resetPointer);
      connection?.removeEventListener?.("change", syncMotionMode);
      video?.pause();
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className={[styles.scene, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/media/ocean/ocean-poster.jpg"
      >
        {/* Mobile encodes first: the media query picks them on small screens
            before the browser considers the 1440p pair. */}
        <source
          src="/media/ocean/ocean-loop-mobile.webm"
          type="video/webm"
          media="(max-width: 767px)"
        />
        <source
          src="/media/ocean/ocean-loop-mobile.mp4"
          type="video/mp4"
          media="(max-width: 767px)"
        />
        <source src="/media/ocean/ocean-loop-1440p.webm" type="video/webm" />
        <source src="/media/ocean/ocean-loop-1440p.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
