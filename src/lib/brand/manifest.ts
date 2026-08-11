/**
 * Brand asset manifest (Appendix A.1).
 *
 * The delivered SVG masters are the only authoritative source for the Foundry
 * logotype: path data, proportions and wordmark must never be altered, and the
 * logo must never be recreated with text (§1.2, §5.1).
 *
 * These files are NOT present in this workspace — the source archive lives on
 * the design owner's machine. Drop them into `public/brand/` and
 * `pnpm brand:verify` confirms each byte-for-byte against the SHA-256 below.
 * Until then the production build gate fails and development renders a clearly
 * marked missing-asset frame rather than an invented wordmark.
 */

export type BrandAsset = {
  file: string;
  bytes: number;
  sha256: string;
  /** Intrinsic viewBox dimensions — aspect ratio must be preserved. */
  width: number;
  height: number;
  usage: string;
};

export const FULL_LOGO_VIEWBOX = { width: 355.68, height: 134.7 } as const;
export const ICON_VIEWBOX = { width: 77.01, height: 134.7 } as const;

export const BRAND_ASSETS = {
  logoBlue: {
    file: "foundry-logo-blue.svg",
    bytes: 5546,
    sha256: "1db42b83c1cfc1d4b58f98e77f38901ce7a0e4fc9bfacaf9cdc9c9d1d491a475",
    ...FULL_LOGO_VIEWBOX,
    usage: "Header on light surfaces, OG template",
  },
  logoWhite: {
    file: "foundry-logo-white.svg",
    bytes: 5546,
    sha256: "2f928f2b9550bdb81f5e23a1e6d9747a4785d4255867c38f5175641347c439dc",
    ...FULL_LOGO_VIEWBOX,
    usage: "Hero/header on dark surfaces, footer",
  },
  logoBlack: {
    file: "foundry-logo-black.svg",
    bytes: 5546,
    sha256: "775b7c8e797e3f90fa64e325f47bb6fb5d18ce04d7a758ae470125970cc4aeb6",
    ...FULL_LOGO_VIEWBOX,
    // The file deliberately uses #1f1f1f, not absolute black. Keep it as is.
    usage: "Print / neutral light surfaces (uses #1f1f1f by design)",
  },
  iconBlue: {
    file: "foundry-icon-blue.svg",
    bytes: 417,
    sha256: "de5f865ad31075d16f671d1fd05c93737db997d974e6e16e99bacf822bc85dd0",
    ...ICON_VIEWBOX,
    usage: "Favicon and app icons on light surfaces",
  },
  iconWhite: {
    file: "foundry-icon-white.svg",
    bytes: 417,
    sha256: "fda4e303cf2de4f5a3a8ea39e5967d1587cf0eaf7ed7c5160edb2b8959d8541a",
    ...ICON_VIEWBOX,
    usage: "Symbol on dark surfaces",
  },
} as const satisfies Record<string, BrandAsset>;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

/**
 * Quarantined (Appendix A.1): Bright is not a confirmed portfolio company, so
 * its logo stays out of `public/` until a content owner confirms it (§5.1).
 */
export const QUARANTINED_ASSETS = [
  {
    file: "bright.svg",
    bytes: 2195,
    sha256: "4a4103e041fe27e469ae324eef8bf50874cc6c34e3065536edb890897d6d6259",
    reason: "Bright is not confirmed as a current portfolio company",
  },
] as const;

/**
 * Logo sizing (§5.1). Height drives the box; width follows the master aspect
 * ratio so the wordmark is never distorted.
 */
export const LOGO_SIZES = {
  headerLarge: { height: 74, width: 195 },
  headerCompact: { height: 44, width: 116 },
  mobile: { height: 30, width: 79 },
  footer: { height: 58, width: 153 },
  footerLarge: { height: 74, width: 195 },
} as const;

export function brandAssetPath(key: BrandAssetKey): string {
  return `/brand/${BRAND_ASSETS[key].file}`;
}
