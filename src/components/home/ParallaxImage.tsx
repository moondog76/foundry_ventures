"use client";

/**
 * A still image that drifts with the pointer and the scroll, using the same
 * motion rules as the hero's ocean loop (`useAmbientParallax`).
 *
 * The image is oversized inside its frame by `--overscan` and moved within it,
 * so the frame itself never changes size and the surrounding layout cannot
 * shift. `prefers-reduced-motion` and Save-Data pin it still, and the effect
 * pauses entirely while the frame is off-screen.
 *
 * Server markup renders the image at rest with no offsets, so nothing depends
 * on hydration to look correct.
 */

import { useRef } from "react";
import type { ImageAsset } from "@/content/types";
import type { PolicyContext } from "@/content/policy";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { useAmbientParallax, type ParallaxSettings } from "./use-ambient-parallax";
import styles from "./parallax-image.module.css";

/**
 * Gentler than the hero: these sit mid-page next to text, and the hero's
 * strength on a 40vw frame would read as a wobble rather than depth. The
 * overscan is larger in proportion because the frames are smaller, so the same
 * absolute travel needs more headroom.
 */
const SETTINGS: ParallaxSettings = {
  pointerX: 0.05,
  pointerY: 0.035,
  scrollTravel: 0.16,
  rotation: 0.5,
  easing: 0.08,
  overscan: 0.16,
};

export type ParallaxImageProps = {
  image: ImageAsset;
  policy: PolicyContext;
  sizes: string;
  className?: string;
};

export function ParallaxImage({ image, policy, sizes, className }: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  useAmbientParallax(frameRef, { settings: SETTINGS });

  return (
    <div ref={frameRef} className={[styles.frame, className].filter(Boolean).join(" ")}>
      <ResponsiveImage
        image={image}
        policy={policy}
        alt=""
        sizes={sizes}
        frameClassName={styles.media}
      />
    </div>
  );
}
