/**
 * The Foundry logotype (§5.1).
 *
 * Absolute rules this component enforces:
 *  - it only ever renders a delivered SVG master, unmodified;
 *  - it never recolours the mark with a CSS filter — it picks the correct
 *    variant for the surface instead;
 *  - it never falls back to a text recreation of the wordmark.
 *
 * When a master is missing from `public/brand/` the component renders a frame
 * with the correct aspect ratio and an explicit "asset missing" note, so the
 * gap is visible in review instead of being papered over.
 */

import Link from "next/link";
import { BRAND_ASSETS, LOGO_SIZES, brandAssetPath, type BrandAssetKey } from "@/lib/brand/manifest";
import { BRAND_ASSET_AVAILABILITY } from "@/lib/brand/availability";
import styles from "./foundry-logo.module.css";

export type LogoVariant = "white" | "blue" | "black";
export type LogoSize = keyof typeof LOGO_SIZES;

const VARIANT_TO_ASSET: Record<LogoVariant, BrandAssetKey> = {
  white: "logoWhite",
  blue: "logoBlue",
  black: "logoBlack",
};

const ICON_VARIANT_TO_ASSET: Record<"white" | "blue", BrandAssetKey> = {
  white: "iconWhite",
  blue: "iconBlue",
};

export type FoundryLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  /** Wraps the mark in a link to the home page. */
  href?: string;
  /** Accessible name. Empty when an adjacent element already names the link. */
  title?: string;
  className?: string;
  priority?: boolean;
  /**
   * `"fixed"` stamps the height from `LOGO_SIZES` inline. `"inherit"` leaves it
   * to CSS, which is what the header needs: its logo has to *animate* between
   * two sizes in step with the colour change, and an inline height cannot be
   * transitioned by a stylesheet.
   */
  sizing?: "fixed" | "inherit";
};

export function FoundryLogo({
  variant = "white",
  size = "headerLarge",
  href,
  title = "Foundry Ventures",
  className,
  priority = false,
  sizing = "fixed",
}: FoundryLogoProps) {
  const assetKey = VARIANT_TO_ASSET[variant];
  const asset = BRAND_ASSETS[assetKey];
  const dimensions = LOGO_SIZES[size];
  const available = BRAND_ASSET_AVAILABILITY[assetKey];

  const mark = available ? (
    // Plain <img>: the master is a vector, so there is nothing to optimise and
    // nothing that may alter its bytes.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandAssetPath(assetKey)}
      alt={title}
      width={dimensions.width}
      height={dimensions.height}
      className={styles.mark}
      style={sizing === "fixed" ? { height: `${dimensions.height}px`, width: "auto" } : undefined}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
    />
  ) : (
    <span
      className={styles.missing}
      style={
        sizing === "fixed"
          ? {
              height: `${dimensions.height}px`,
              width: `${dimensions.width}px`,
              aspectRatio: `${asset.width} / ${asset.height}`,
            }
          : { aspectRatio: `${asset.width} / ${asset.height}` }
      }
      role="img"
      aria-label={title}
      data-brand-asset-missing={asset.file}
    >
      <span aria-hidden="true" className={styles.missingLabel}>
        LOGO ASSET
        <br />
        MISSING
      </span>
    </span>
  );

  const classes = [styles.logo, className].filter(Boolean).join(" ");

  if (!href) return <span className={classes}>{mark}</span>;

  return (
    <Link href={href} className={classes} aria-label={title || undefined}>
      {mark}
    </Link>
  );
}

/** The square symbol, for compact surfaces and icons. */
export function FoundryIcon({
  variant = "blue",
  height = 32,
  title = "Foundry Ventures",
  className,
}: {
  variant?: "white" | "blue";
  height?: number;
  title?: string;
  className?: string;
}) {
  const assetKey = ICON_VARIANT_TO_ASSET[variant];
  const asset = BRAND_ASSETS[assetKey];
  const width = Math.round((height * asset.width) / asset.height);

  if (!BRAND_ASSET_AVAILABILITY[assetKey]) {
    return (
      <span
        className={[styles.missing, className].filter(Boolean).join(" ")}
        style={{ height: `${height}px`, width: `${width}px` }}
        role="img"
        aria-label={title}
        data-brand-asset-missing={asset.file}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandAssetPath(assetKey)}
      alt={title}
      width={width}
      height={height}
      className={[styles.mark, className].filter(Boolean).join(" ")}
    />
  );
}
