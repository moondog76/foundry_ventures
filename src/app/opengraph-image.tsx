/**
 * Site Open Graph card (§21.2).
 *
 * `buildMetadata` points every route's `og:image` and `twitter:image` at this
 * one route, so it is the single social surface for the whole site until a
 * per-route template exists. That makes two things non-negotiable:
 *
 *  - **it must not reuse the live site's transparent white PNG.** A transparent
 *    logotype rendered on the black field every social platform composites
 *    against, or on the white field the rest use, is a coin flip between "fine"
 *    and "invisible". This template controls its own background instead.
 *  - **it must not fake the wordmark.** The delivered SVG masters are not in
 *    this workspace (see `public/brand/README.md`), so the mark is inlined only
 *    when `BRAND_ASSET_AVAILABILITY` says the byte-verified file is present. If
 *    it is not, the card ships without a mark. A text recreation of the
 *    logotype is forbidden (§5.1) and a "logo missing" box would be published
 *    to LinkedIn.
 *
 * Two constraints of the rasteriser shape the styling and are worth stating,
 * because the code looks wrong without them:
 *
 *  - **CSS custom properties do not exist here.** `ImageResponse` renders
 *    through Satori, which has no cascade, no `:root` and no stylesheet — every
 *    value must be a literal. The hex codes below are copied from
 *    `src/styles/tokens.css` (`--color-black`, `--color-white`,
 *    `--color-foundry-blue`, `--color-muted-on-dark`) and must be kept in step
 *    with it by hand.
 *  - **no font is loaded.** Ivar Display is identity-bearing but is not
 *    licensed for redistribution here, and Satori cannot read the WOFF2 format
 *    the site uses anyway; it also has no access to system fonts, so a serif
 *    stack cannot resolve the way it does in the browser. The declared stack
 *    below states the intent and is the single place a `fonts:` entry would
 *    attach if a licensed TTF/OTF is ever delivered. Until then the card
 *    deliberately carries no typographic identity claim rather than a faked one.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/content";
import { publicPolicyContext } from "@/content/context";
import { BRAND_ASSETS, FULL_LOGO_VIEWBOX } from "@/lib/brand/manifest";
import { BRAND_ASSET_AVAILABILITY } from "@/lib/brand/availability";

/**
 * Node, not edge: the presence of the delivered master is established by
 * reading the filesystem (`@/lib/brand/availability`), and the SVG bytes are
 * inlined from disk. Everything else in the template is edge-compatible — no
 * network access, no dynamic imports, no DOM.
 */
export const runtime = "nodejs";

export const alt = "Foundry Ventures";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Literal copies of the design tokens — see the note above. */
const FOUNDRY_BLACK = "#000000";
const FOUNDRY_WHITE = "#ffffff";
const FOUNDRY_BLUE = "#00308f";
const MUTED_ON_DARK = "rgba(255, 255, 255, 0.74)";

/**
 * Safe margin. Twitter crops a 1200×630 card to 2:1 (15px off the top and
 * bottom) and LinkedIn to 1.91:1; a 72×88 inset keeps every glyph clear of all
 * of them with room to spare.
 */
const PADDING_Y = 72;
const PADDING_X = 88;

/** Logo height on the card; width follows the master's aspect ratio exactly. */
const LOGO_HEIGHT = 76;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * FULL_LOGO_VIEWBOX.width) / FULL_LOGO_VIEWBOX.height);

/**
 * The white master, inlined as a data URI, or `null` when it is not present.
 *
 * The read is best-effort by design: on a host that does not ship `public/`
 * into the server bundle this returns `null`, and the card renders without the
 * mark — the same honest outcome as the file being absent from the repository.
 */
function inlineLogo(): string | null {
  if (!BRAND_ASSET_AVAILABILITY.logoWhite) return null;
  try {
    const file = path.resolve(process.cwd(), "public/brand", BRAND_ASSETS.logoWhite.file);
    return `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage(): Promise<ImageResponse> {
  // The card is a public artefact: it answers for the published site, never for
  // an editor's preview session (§21.4).
  const settings = await getSiteSettings(publicPolicyContext());

  const title = settings.defaultSeoTitle;
  const description = settings.defaultSeoDescription;
  // A short, factual label. The canonical host is the one piece of context that
  // is true by construction and needs no approval.
  const label = new URL(settings.canonicalOrigin).host.replace(/^www\./, "");
  const logo = inlineLogo();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: FOUNDRY_BLACK,
        padding: `${PADDING_Y}px ${PADDING_X}px`,
      }}
    >
      {/* Top band. Empty — never a placeholder — when the master is absent. */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {/* Satori rasterises this element itself — it is not a DOM <img>, so
              `next/image` is neither available nor meaningful here. */}
        {logo ? <img src={logo} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="" /> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* The one accent on the card, in Foundry blue. */}
        <div
          style={{
            display: "flex",
            width: 96,
            height: 4,
            backgroundColor: FOUNDRY_BLUE,
            marginBottom: 32,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 3,
            color: MUTED_ON_DARK,
            marginBottom: 22,
          }}
        >
          {label}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: 'Georgia, "Times New Roman", Times, serif',
            fontSize: 76,
            lineHeight: 1.06,
            letterSpacing: 1,
            color: FOUNDRY_WHITE,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 880,
            marginTop: 28,
            fontSize: 26,
            lineHeight: 1.4,
            color: MUTED_ON_DARK,
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    size,
  );
}
