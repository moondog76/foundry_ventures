import "server-only";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { BRAND_ASSETS, type BrandAssetKey } from "./manifest";

/**
 * Whether each delivered brand SVG is actually present in `public/brand/`.
 *
 * Checked once per process at module load. The logotype must never be recreated
 * with text (§5.1), so when a master is missing the logo component renders a
 * clearly marked missing-asset frame in development and the production gate
 * (`pnpm brand:verify --strict`) fails the build.
 */
const brandDir = path.resolve(process.cwd(), "public/brand");

/**
 * Accepts either the delivered Appendix A.1 master or the variant derived from
 * the owner-supplied `Foundry logo.pdf`. Byte-exactness is asserted by
 * `pnpm brand:verify`; this only decides whether the component has something
 * real to render, so it deliberately does not re-hash on every boot.
 */
function check(key: BrandAssetKey): boolean {
  const asset = BRAND_ASSETS[key];
  const filePath = path.join(brandDir, asset.file);
  try {
    if (!existsSync(filePath)) return false;
    const { size } = statSync(filePath);
    return size === asset.bytes || size === asset.derivedBytes;
  } catch {
    return false;
  }
}

export const BRAND_ASSET_AVAILABILITY: Record<BrandAssetKey, boolean> = {
  logoBlue: check("logoBlue"),
  logoWhite: check("logoWhite"),
  logoBlack: check("logoBlack"),
  iconBlue: check("iconBlue"),
  iconWhite: check("iconWhite"),
};

export const ALL_BRAND_ASSETS_PRESENT = Object.values(BRAND_ASSET_AVAILABILITY).every(Boolean);

export const MISSING_BRAND_ASSETS = (Object.keys(BRAND_ASSET_AVAILABILITY) as BrandAssetKey[])
  .filter((key) => !BRAND_ASSET_AVAILABILITY[key])
  .map((key) => BRAND_ASSETS[key].file);
