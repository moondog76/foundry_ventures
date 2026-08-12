"use client";

/**
 * The ocean field — the site's single continuous motion source (§10.1).
 *
 * What makes it acceptable under §2.5, §10.5 and §14.5:
 *
 *  - the poster is a CSS background, so the still frame is painted before any
 *    video loads and remains the whole experience if it never does;
 *  - `prefers-reduced-motion: reduce` and Save-Data drop straight to that still
 *    — the video is hidden *and* paused, never merely slowed;
 *  - a visible pause/resume control exists (owned by `OceanField`, which also
 *    fixes its position in the tab order), and its choice wins over the OS
 *    preference in both directions;
 *  - playback pauses when the tab is hidden or the hero scrolls away;
 *  - a decode error falls back to the still rather than a black rectangle;
 *  - no sound, no scroll-jacking, no cursor tracking.
 *
 * Server markup renders the video with the poster already applied, so nothing
 * depends on hydration to look right.
 */

import { useCallback, useRef } from "react";
import { useAmbientParallax, type ParallaxSettings } from "./use-ambient-parallax";
import styles from "./ambient-ocean.module.css";

/**
 * §10.4 caps parallax at "a few percent". 5% of viewport height across the
 * hero's own scroll is perceptible as depth and never as an effect.
 */
const SETTINGS: ParallaxSettings = {
  scrollTravel: 0.05,
  easing: 0.09,
  overscan: 0.08,
};

export function AmbientOcean({ className, paused }: { className?: string; paused: boolean }) {
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

  useAmbientParallax(sceneRef, { settings: SETTINGS, onMotionChange, paused });

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
        /*
         * The small crop, unconditionally. The CSS background is the real still
         * frame and swaps to the full-size file above 768px; this attribute
         * only has to stop the video element flashing empty before the first
         * frame decodes. Pointing it at the 2560px file pulled 90 KiB onto
         * every phone for something nobody sees (§12.2).
         */
        poster="/media/ocean/ocean-poster-mobile.jpg"
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
