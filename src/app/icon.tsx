/**
 * Browser tab icon (§5.1, §21.2).
 *
 * Generated, not copied. The live site serves a 147×256 PNG favicon; upscaling
 * or letterboxing a non-square bitmap into a square slot is exactly the kind of
 * asset mangling the brand rules forbid, so this route composes a square from
 * the delivered vector instead.
 *
 * Two states, both honest:
 *
 *  - **the symbol master is present** — it is inlined byte-for-byte from
 *    `public/brand/` and centred on a Foundry-blue field, at its own aspect
 *    ratio. The white variant is used because the field is dark
 *    (`BRAND_ASSETS.iconWhite.usage`).
 *  - **it is absent**, which is the state of this workspace — the field ships
 *    on its own. This is a **placeholder pending the delivered symbol**: a flat
 *    Foundry-blue square, with no invented glyph, no initial and no traced
 *    approximation of the mark. Dropping `foundry-icon-white.svg` into
 *    `public/brand/` (see that directory's README) upgrades it with no code
 *    change; `pnpm brand:verify:strict` is the gate that stops a production
 *    build shipping the placeholder.
 *
 * Deliberately duplicated with `apple-icon.tsx` rather than shared: each of
 * these is an independent metadata route with its own dimensions, and Next
 * treats the files, not a helper module, as the unit.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_ASSETS, ICON_VIEWBOX } from "@/lib/brand/manifest";
import { BRAND_ASSET_AVAILABILITY } from "@/lib/brand/availability";

/** Reading the delivered master from disk requires the Node runtime. */
export const runtime = "nodejs";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** `--color-foundry-blue`. Satori has no cascade, so tokens cannot be used. */
const FOUNDRY_BLUE = "#00308f";

/** Optical padding: the mark occupies 62% of the square's height. */
const MARK_HEIGHT = Math.round(size.height * 0.62);
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

export default function Icon(): ImageResponse {
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
