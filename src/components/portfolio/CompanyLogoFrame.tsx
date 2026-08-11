/**
 * Optically calibrated company logo frame (§5.5, §8.4).
 *
 * The portfolio mixes a 5468×1700 wordmark with a 1000×1000 square mark. Simply
 * running `object-fit: contain` inside one box makes the square dominate and the
 * wordmark disappear. So the frame does two things:
 *
 *  1. `logoFit` picks the *shape* of the target area — a wide wordmark gets a
 *     short, wide box; a square mark gets a tall, narrow one. Both boxes have a
 *     comparable area, so the marks read as equal weight.
 *  2. `opticalScale` is the per-company trim on top of that, carried from the
 *     content layer. It is clamped here so a bad CMS value can never blow the
 *     frame apart or shrink a logo to nothing.
 *
 * When no rights-cleared logo exists, the frame renders the deliberate
 * typographic treatment with the company's real name — never a stock mark and
 * never a broken image (§16.7, §19.4.1).
 */

import type { CSSProperties } from "react";
import { canRenderImage, type PolicyContext } from "@/content/policy";
import type { ImageAsset } from "@/content/types";
import { cx } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import styles from "./company-logo-frame.module.css";

export type CompanyLogoFrameProps = {
  /** Already policy-gated by `toCompanySummary`; null means "no approved logo". */
  logo: ImageAsset | null;
  name: string;
  logoFit: "contain" | "wide" | "compact";
  /** Which field the artwork needs behind it — see `Company.logoSurface`. */
  logoSurface?: "dark" | "light";
  opticalScale: number;
  policy: PolicyContext;
  sizes: string;
  priority?: boolean;
  className?: string;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.4;

export function CompanyLogoFrame({
  logo,
  name,
  logoFit,
  logoSurface = "dark",
  opticalScale,
  policy,
  sizes,
  priority = false,
  className,
}: CompanyLogoFrameProps) {
  const scale = Number.isFinite(opticalScale)
    ? Math.min(Math.max(opticalScale, MIN_SCALE), MAX_SCALE)
    : 1;

  // The summary should already have nulled an unrenderable logo; re-checking
  // keeps the typographic fallback authoritative even if a caller passes a raw
  // asset, instead of letting ResponsiveImage return nothing at all.
  const showLogo = canRenderImage(logo, policy);

  return (
    <div
      className={cx(styles.frame, className)}
      data-fit={logoFit}
      // The typographic fallback is set in white, so it always wants the dark
      // field regardless of what the missing artwork would have needed.
      data-surface={showLogo ? logoSurface : "dark"}
      style={{ "--logo-optical-scale": scale } as CSSProperties}
    >
      {showLogo ? (
        <ResponsiveImage
          image={logo}
          policy={policy}
          /* Decorative: the company name is always rendered next to the frame,
             so announcing "<name> logo" as well would just repeat it (§20.1). */
          alt=""
          sizes={sizes}
          fit="contain"
          priority={priority}
          frameClassName={styles.logoBox}
        />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          {name}
        </span>
      )}
    </div>
  );
}
