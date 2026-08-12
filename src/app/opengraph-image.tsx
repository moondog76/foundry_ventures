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
 *  - **the display face is loaded explicitly.** Satori has no access to system
 *    fonts and cannot read WOFF2, so the card previously rendered in a fallback
 *    and carried no typographic identity at all. `src/fonts/newsreader-og.ttf`
 *    is a ~90-character TTF subset built by `scripts/prepare-fonts.mjs` for
 *    exactly this purpose; the OFL permits the embedding.
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
const FOUNDRY_WHITE = "#ffffff";
const FOUNDRY_BLUE = "#00308f";
const FOUNDRY_DEEP_BLUE = "#001848";
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

/**
 * The display face, read once per render from the subset built for this card.
 *
 * Best-effort in the same way as the logo: if the file cannot be read the card
 * still renders, in Satori's fallback, rather than failing the route and
 * serving no social image at all.
 */
function displayFace(): Buffer | null {
  try {
    return readFileSync(path.resolve(process.cwd(), "src/fonts/newsreader-og.ttf"));
  } catch {
    return null;
  }
}

export default async function OpenGraphImage(): Promise<ImageResponse> {
  // The card is a public artefact: it answers for the published site, never for
  // an editor's preview session (§21.4).
  const settings = await getSiteSettings(publicPolicyContext());

  const title = settings.defaultSeoTitle;
  /*
   * §12.4's recommended composition is a short line, not the meta description —
   * a 130-character paragraph set at 26px is unreadable in a LinkedIn feed
   * thumbnail. This is the same claim the site's own eyebrow makes, so it needs
   * no separate approval.
   */
  const description = "Nordic AI pre-seed. Teams first.";
  const logo = inlineLogo();
  const face = displayFace();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // §12.4: a deep-blue field, not black. It ties the card to the hero and
        // is more distinctive than black in a feed of black cards.
        backgroundColor: FOUNDRY_DEEP_BLUE,
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
            // Falls back silently to Satori's default when the subset is
            // unreadable, which is the same posture as the missing logo above.
            fontFamily: face ? "Newsreader" : "serif",
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
    {
      ...size,
      ...(face
        ? { fonts: [{ name: "Newsreader", data: face, weight: 400, style: "normal" as const }] }
        : {}),
    },
  );
}
