/**
 * Image assets for the seed dataset.
 *
 * Spec §5.5 and Appendix A.2. The live Squarespace/Visual Electric URLs are
 * *export references*, not licensed production assets, and are never hotlinked.
 * Each entry therefore records:
 *   - `sourceUrl`  : where the rights-cleared original must be exported from
 *   - `available`  : whether the binary exists in this workspace
 *   - `hotspot`    : the observed focal point, to be carried into the CMS crop
 *
 * Until originals land, Foundry-owned placeholder artwork renders in its place.
 * The content-integrity report lists every placeholder still in use.
 */

import type { ImageAsset } from "../types";
import { OBSERVED_AT } from "./evidence";

/**
 * Foundry-owned stand-in artwork. Rights are clear (we authored it), so it may
 * render, but it is flagged as a placeholder so it can never ship unnoticed.
 */
function placeholder(
  id: string,
  src: string,
  width: number,
  height: number,
  options: Partial<ImageAsset> = {},
): ImageAsset {
  return {
    id,
    src,
    width,
    height,
    rightsStatus: "approved",
    rightsOwner: "Foundry Ventures (placeholder artwork authored for this rebuild)",
    available: true,
    isPlaceholder: true,
    alt: "",
    ...options,
  };
}

/**
 * A live asset recorded for migration. Never rendered — `available: false`
 * routes every surface to its typographic fallback (§16.2, §19.4.1).
 */
export function exportReference(
  id: string,
  sourceUrl: string,
  width: number,
  height: number,
  options: Partial<ImageAsset> = {},
): ImageAsset {
  return {
    id,
    // Expected destination once the rights-cleared original is exported.
    src: `/images/${id}`,
    width,
    height,
    rightsStatus: "unverified",
    sourceUrl,
    available: false,
    ...options,
  };
}

/**
 * The live site serves the same ocean bytes under two asset IDs; the rebuild
 * deduplicates to a single asset (§5.5, §28.2).
 */
export const OCEAN_IMAGE: ImageAsset = placeholder(
  "hero-ocean",
  "/images/placeholder/ocean.svg",
  2500,
  1667,
  {
    hotspot: { x: 0.5, y: 0.5 },
    sourceUrl:
      "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/15102936-1965-4aea-a4ca-f0b698b89536/pexels-matthardy-1533720_motion_blur.jpg?format=original",
    caption: `Placeholder pending licensed original (observed ${OBSERVED_AT}: 2500×1667, cover, focal 50%/50%).`,
  },
);

export const ARCHITECTURE_IMAGE: ImageAsset = placeholder(
  "offering-architecture",
  "/images/placeholder/architecture.svg",
  1024,
  1024,
  {
    hotspot: { x: 0.008, y: 0.168 },
    sourceUrl:
      "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/35139d14-b3a4-415c-a79d-3d022a82a236/visualelectric-1736931308116.png?format=original",
    caption: `Placeholder pending licensed original (observed ${OBSERVED_AT}: 1024×1024, cover, focal 0.8%/16.8%).`,
  },
);

export const SILHOUETTE_IMAGE: ImageAsset = placeholder(
  "offering-silhouette",
  "/images/placeholder/silhouette.svg",
  896,
  1280,
  {
    hotspot: { x: 0.5, y: 0.5 },
    sourceUrl:
      "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/e624d0a7-e9d5-495e-94c1-93a4ca778230/visualelectric-1737705941785.png?format=original",
    caption: `Placeholder pending licensed original (observed ${OBSERVED_AT}: 896×1280, contain, centred).`,
  },
);

/**
 * The default social card is generated at request time by the Foundry OG
 * template (`opengraph-image`), so no raster file is stored here. The live
 * white-on-transparent PNG is explicitly not reusable as an OG image (§21.2).
 */
export const DEFAULT_OG_IMAGE: ImageAsset = {
  id: "og-default",
  src: "/opengraph-image",
  width: 1200,
  height: 630,
  rightsStatus: "approved",
  rightsOwner: "Foundry Ventures",
  available: true,
  alt: "",
};

/**
 * Logo files supplied by the content owner on 2026-08-11 and prepared for the
 * web by `scripts/prepare-supplied-assets.mjs`.
 *
 * `sourceUrl` keeps the Appendix C.4 live reference so the provenance chain
 * stays intact, but the bytes now come from the owner's own originals rather
 * than the Squarespace CDN, which is what §5.5 asks for.
 */
function suppliedLogo(
  slug: string,
  file: string,
  width: number,
  height: number,
  owner: string,
  sourceUrl?: string,
): ImageAsset {
  return {
    id: `portfolio/${slug}`,
    src: `/images/portfolio/${file}`,
    width,
    height,
    rightsStatus: "approved",
    rightsOwner: owner,
    sourceUrl,
    available: true,
    alt: "",
  };
}

export const SUPPLIED_PORTFOLIO_LOGOS = {
  empley: suppliedLogo("empley", "empley.png", 1510, 400, "Empley"),
  agaton: suppliedLogo("agaton", "agaton.png", 768, 181, "Agaton"),
  grand: suppliedLogo("grand", "grand.png", 2027, 332, "Grand"),
  wilgot: suppliedLogo("wilgot", "wilgot.png", 5468, 1700, "Wilgot"),
  openroll: suppliedLogo("openroll", "openroll.png", 1056, 276, "Openroll"),
  // Rendered from the supplied A4 PDF and cropped to the logo tile, which
  // carries its own black field — the same square the live site served.
  newly: suppliedLogo("newly", "newly.png", 1001, 1001, "Newly"),
  skattio: suppliedLogo("skattio", "skattio.png", 701, 176, "Skattio"),
  // The viewBox is tightened to the artwork by the prep script, so these are
  // the wordmark's own proportions rather than the 810×810 artboard.
  memmo: suppliedLogo("memmo", "memmo.svg", 639, 98, "Memmo"),
} as const;

/** Superseded live-CDN references, retained for the migration record. */
export const PORTFOLIO_LOGO_REFERENCES = {
  empley: exportReference(
    "portfolio/empley.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/5ba924e8-8feb-4322-b300-71de643e84a5/Empley_large+%281%29.png",
    1510,
    400,
  ),
  agaton: exportReference(
    "portfolio/agaton.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/6a512678-53fd-45b1-92b6-cc4c752d4c74/Group+427319613.png",
    549,
    181,
  ),
  grand: exportReference(
    "portfolio/grand.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/3e1e25fe-a619-4880-8f4f-19b025ddf44d/Grand+Logo+Golden+glow.png",
    2027,
    332,
  ),
  wilgot: exportReference(
    "portfolio/wilgot.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/ff1e9400-bdf6-4c0e-9d19-76dfe6fa83ac/wilgot_logo_white_rgb.png",
    5468,
    1700,
  ),
  openroll: exportReference(
    "portfolio/openroll.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/b25aadf3-b0f9-4f0e-8500-b430b5a6526e/Openroll_Logo_NoTagline_white.png",
    1056,
    276,
  ),
  newly: exportReference(
    "portfolio/newly.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/d009bc2f-3c77-4503-ad2e-5ea6be029f16/newly-primary+logo-white-black+background.png",
    1000,
    1000,
  ),
  skattio: exportReference(
    "portfolio/skattio.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/1b5a7ab5-b21c-45f1-b73c-9b5501004b8c/logovit.png",
    701,
    176,
  ),
  memmo: exportReference(
    "portfolio/memmo.png",
    "https://images.squarespace-cdn.com/content/v1/67ab5780efadac2ccbdd70ea/43a78f7a-f42a-460e-bff1-3f044340c16a/logo-green.png",
    2160,
    2160,
  ),
} as const;
