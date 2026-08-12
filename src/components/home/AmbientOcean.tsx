"use client";

/**
 * The hero's ambient ocean background.
 *
 * A port of the supplied `ocean-motion-background` package (kept in
 * `assets-supplied/` for reference). The parallax itself lives in
 * `useAmbientParallax`, shared with the editorial stills so the two cannot
 * drift apart; this component adds only what is specific to video.
 *
 * What makes the motion acceptable under §7.1 and §20.4:
 *
 *  - the poster is a CSS background, so the still frame is painted before any
 *    video loads and remains the whole experience if it never does;
 *  - `prefers-reduced-motion: reduce` and Save-Data drop straight to that still
 *    — the video is hidden *and* paused, never merely slowed;
 *  - parallax only responds to a fine pointer, and is skipped on touch;
 *  - playback pauses when the tab is hidden or the hero scrolls away, and a
 *    decode error falls back to the still rather than a black rectangle.
 *
 * Server markup renders the video with the poster already applied, so nothing
 * depends on hydration to look right.
 */

import { useCallback, useRef } from "react";
import { useAmbientParallax, type ParallaxSettings } from "./use-ambient-parallax";
import styles from "./ambient-ocean.module.css";

/**
 * The supplied package shipped these at roughly a quarter of these values —
 * deliberately subtle; the owner asked for considerably more on 2026-08-11.
 * Each is a fraction of the viewport, so the effect is proportional on a laptop
 * and a 5K display alike, and every offset is clamped to `overscan`.
 */
const SETTINGS: ParallaxSettings = {
  pointerX: 0.14,
  pointerY: 0.1,
  scrollTravel: 0.32,
  rotation: 1.6,
  easing: 0.09,
  overscan: 0.22,
};

export function AmbientOcean({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  // Playback follows the same switch as the motion: when motion is refused the
  // video is paused as well as hidden, so nothing decodes in the background.
  const onMotionChange = useCallback((enabled: boolean) => {
    const video = sceneRef.current?.querySelector("video");
    if (!video) return;
    if (!enabled) {
      video.pause();
      return;
    }
    // A refused autoplay is not an error worth surfacing — the poster is
    // already painted, so the scene simply stays static.
    void video.play().catch(() => {
      if (sceneRef.current) sceneRef.current.dataset.static = "true";
    });
  }, []);

  useAmbientParallax(sceneRef, { settings: SETTINGS, onMotionChange });

  return (
    <div
      ref={sceneRef}
      className={[styles.scene, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <video
        className={styles.video}
        // A decode or network failure leaves the poster in place rather than a
        // black rectangle.
        onError={() => {
          if (sceneRef.current) sceneRef.current.dataset.static = "true";
        }}
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
