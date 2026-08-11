/**
 * iOS home-screen icon (§5.1, §21.2).
 *
 * 180×180, the size iOS asks for, and fully opaque: iOS applies its own corner
 * mask and composites the icon against the wallpaper, so a transparent source —
 * such as the live site's transparent white PNG — reads as a floating fragment
 * on a light background. The field is therefore painted here.
 *
 * Same two honest states as `icon.tsx`:
 *
 *  - **the symbol master is present** — inlined byte-for-byte from
 *    `public/brand/`, centred at its own aspect ratio, white on the Foundry-blue
 *    field it was drawn for.
 *  - **it is absent**, which is the state of this workspace — a **placeholder
 *    pending the delivered symbol**: a flat Foundry-blue square with no invented
 *    glyph. The logotype is never recreated, at any size (§5.1).
 *
 * Deliberately duplicated with `icon.tsx` rather than shared: each is an
 * independent metadata route with its own dimensions.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_ASSETS, ICON_VIEWBOX } from "@/lib/brand/manifest";
import { BRAND_ASSET_AVAILABILITY } from "@/lib/brand/availability";

/** Reading the delivered master from disk requires the Node runtime. */
export const runtime = "nodejs";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** `--color-foundry-blue`. Satori has no cascade, so tokens cannot be used. */
const FOUNDRY_BLUE = "#00308f";

/**
 * 56% rather than the 62% used at 32px: iOS rounds the corners aggressively, so
 * the mark needs more clearance from the edge than a square tab icon does.
 */
const MARK_HEIGHT = Math.round(size.height * 0.56);
const MARK_WIDTH = Math.round((MARK_HEIGHT * ICON_VIEWBOX.width) / ICON_VIEWBOX.height);

function inlineSymbol(): string | null {
  if (!BRAND_ASSET_AVAILABILITY.iconWhite) return null;
  try {
    const file = path.resolve(process.cwd(), "public/brand", BRAND_ASSETS.iconWhite.file);
    return `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;
  } catch {
    return null;
  }
}

export default function AppleIcon(): ImageResponse {
  const symbol = inlineSymbol();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: FOUNDRY_BLUE,
      }}
    >
      {/* Rasterised by Satori, not rendered into the DOM — `next/image` is
            neither available nor meaningful here. */}
      {symbol ? <img src={symbol} width={MARK_WIDTH} height={MARK_HEIGHT} alt="" /> : null}
    </div>,
    size,
  );
}
