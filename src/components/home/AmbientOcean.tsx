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

/** Motion strength, from the supplied package. Lower is calmer. */
const SETTINGS = {
  pointerX: 0.03,
  pointerY: 0.022,
  scrollTravel: 0.06,
  rotation: 0.16,
  easing: 0.085,
} as const;

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

    function render() {
      frame = 0;
      let moving = false;
      for (const key of ["x", "y", "scrollY", "rotation"] as const) {
        current[key] += (target[key] - current[key]) * SETTINGS.easing;
        if (Math.abs(target[key] - current[key]) > 0.08) moving = true;
      }
      scene!.style.setProperty("--motion-x", `${current.x.toFixed(2)}px`);
      scene!.style.setProperty("--motion-y", `${current.y.toFixed(2)}px`);
      scene!.style.setProperty("--scroll-y", `${current.scrollY.toFixed(2)}px`);
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
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      target.scrollY = (progress - 0.5) * window.innerHeight * SETTINGS.scrollTravel;
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
