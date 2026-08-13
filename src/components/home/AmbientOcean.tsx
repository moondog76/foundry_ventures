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
 *  - no sound, and no scroll-jacking: the page never takes over the scroll,
 *    the background only responds to it.
 *
 * Server markup renders the video with the poster already applied, so nothing
 * depends on hydration to look right.
 */

import { useCallback, useRef } from "react";
import { useAmbientParallax, type ParallaxSettings } from "./use-ambient-parallax";
import styles from "./ambient-ocean.module.css";

/**
 * Motion strength, restored on the owner's instruction 2026-08-13.
 *
 * The enhancement brief cut these to a fifth (§10.4: no cursor tracking, no
 * parallax beyond "a few percent"). The owner asked for the stronger version
 * twice and chose it over the brief; `docs/content-gaps.md` §F3 records that.
 *
 * Every value is a fraction of the viewport, so the effect is proportional on a
 * laptop and a 5K display alike. `overscan` is the whole travel budget: the hook
 * clamps pointer, scroll and rotation into it per frame, and the CSS oversizes
 * the video by the same amount — the two must stay equal or an edge appears.
 */
const SETTINGS: ParallaxSettings = {
  pointerX: 0.14,
  pointerY: 0.1,
  scrollTravel: 0.32,
  rotation: 1.6,
  easing: 0.09,
  overscan: 0.22,
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
