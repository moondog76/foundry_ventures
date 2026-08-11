/**
 * Image primitive (§5.5, §22.2).
 *
 * Behaviour that matters:
 *  - an asset that is missing, unlicensed or not rights-cleared renders the
 *    deliberate typographic fallback, never a broken image or a stock photo;
 *  - the hotspot becomes `object-position` so crops stay correct per breakpoint;
 *  - only the hero passes `priority`; everything else lazy-loads;
 *  - decorative images take an explicitly empty `alt`.
 */

import NextImage from "next/image";
import type { ImageAsset } from "@/content/types";
import { canRenderImage, type PolicyContext } from "@/content/policy";
import styles from "./ui.module.css";
import { cx } from "./index";

export type ResponsiveImageProps = {
  image: ImageAsset | null | undefined;
  policy: PolicyContext;
  /** Overrides the asset's own alt. Pass "" for decorative use. */
  alt?: string;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  frameClassName?: string;
  /** Rendered inside the fallback surface when no image is available. */
  fallbackLabel?: string;
  fallbackMeta?: string;
  quality?: number;
};

function objectPosition(image: ImageAsset): string | undefined {
  if (!image.hotspot) return undefined;
  return `${(image.hotspot.x * 100).toFixed(2)}% ${(image.hotspot.y * 100).toFixed(2)}%`;
}

export function ResponsiveImage({
  image,
  policy,
  alt,
  sizes,
  priority = false,
  fit = "cover",
  className,
  frameClassName,
  fallbackLabel,
  fallbackMeta,
  quality,
}: ResponsiveImageProps) {
  if (!canRenderImage(image, policy)) {
    if (!fallbackLabel) return null;
    return (
      <div
        className={cx(styles.imageFrame, styles.imageFallback, frameClassName)}
        role="img"
        aria-label={fallbackLabel}
      >
        <span aria-hidden="true">
          <span className={styles.imageFallbackLabel}>{fallbackLabel}</span>
          {fallbackMeta ? <span className={styles.imageFallbackMeta}>{fallbackMeta}</span> : null}
        </span>
      </div>
    );
  }

  const resolvedAlt = alt ?? image.alt ?? "";
  // SVG placeholders bypass the optimiser; raster assets go through it.
  const unoptimized = image.src.endsWith(".svg");

  return (
    <div className={cx(styles.imageFrame, frameClassName)}>
      <NextImage
        src={image.src}
        alt={resolvedAlt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={quality}
        unoptimized={unoptimized}
        placeholder={image.blurDataUrl ? "blur" : "empty"}
        blurDataURL={image.blurDataUrl}
        className={cx(styles.image, fit === "contain" && styles.imageContain, className)}
        style={{ objectPosition: objectPosition(image) }}
      />
    </div>
  );
}
