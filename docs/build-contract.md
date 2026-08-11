# Foundry Ventures — shared build contract

Everything in this repo is implemented against `foundry-ventures-rebuild-buildspec.md`.
This file records the conventions the foundation already establishes, so every
route and component built on top of it stays consistent. Read it before writing
code.

## Non-negotiables

1. **Never invent a fact.** Company names, taglines, statuses, team bios, legal
   details, statistics and contact data must come from the content layer. If a
   field is absent, hide the element — do not fill it with placeholder copy, a
   `#` link, an example address or demo text.
2. **Never recreate the logotype.** `FoundryLogo` renders a delivered SVG master
   or an explicit missing-asset frame. No text wordmark, no CSS filter recolour.
3. **Typography is Ivar Display + Helvetica Neue.** Never Inter. Use the token
   `--font-display` / `--font-sans` and the `type-*` utility classes.
4. **Core surfaces are Foundry black/white** with `--color-foundry-blue` as the
   accent. The extended prototype palette is a secondary tool, not the default.
5. **No content may start at `opacity: 0` in server markup.** Motion is applied
   after hydration via `Reveal`.
6. **Exactly one `<h1>` per page.** The root layout already provides the single
   `<main id="main-content">` — routes must not add another `<main>`.
7. **All motion respects `prefers-reduced-motion`.** Tokens already collapse
   durations; components must also skip transforms and staggering.

## Content access

Import from `@/content` only. Never import a Sanity client or a seed file from a
component.

```ts
import { getSiteSettings, getHomePage, getCompanies, getCompanyBySlug } from "@/content";
import { resolvePolicyContext } from "@/content/context";
```

`resolvePolicyContext()` returns `{ mode: "preview" | "production" }`. Pass it to
anything that renders CMS data:

- `canRenderEditorialText(text, policy)` — gate every `EditorialText` before
  rendering `text.value`.
- `canRenderImage(image, policy)` — gate every `ImageAsset`. `ResponsiveImage`
  does this internally and falls back to the typographic surface.
- `canPublishCompanyField(company, field, policy)` — already applied by
  `toCompanySummary`; use `CompanySummary` in cards rather than raw `Company`.

A `CompanySummary` has already resolved its destination:

- `summary.href` — internal `/portfolio/[slug]`, or `null`
- `summary.externalHref` — verified external site, only set when `href` is null

Card link rule: use `href` when present; otherwise `externalHref` marked as
external; if both are null the card is not a link at all.

## Design tokens

Defined in `src/styles/tokens.css`. Use them; no magic numbers in components.

| Purpose        | Token                                                         |
| -------------- | ------------------------------------------------------------- |
| Container max  | `--container-max` (1600px), `--container-inner-max` (1440px)  |
| Gutter         | `--gutter` (6vw mobile / 3vw desktop)                         |
| Grid           | `--grid-columns` (8 mobile / 24 desktop), `--grid-gap` (11px) |
| Section rhythm | `--section-y`, `--section-y-sm`, `--section-y-lg`             |
| Spacing        | `--space-3xs` … `--space-4xl`                                 |
| Type scale     | `--text-xs` … `--text-h1`                                     |
| Foundry easing | `--ease-foundry`, `--duration-underline` (600ms)              |
| Header height  | `--header-height` (already fed to `scroll-margin-top`)        |

Breakpoints, content-driven:

```
tiny 320–479 · mobile 480–767 · tablet 768–991 · desktop 992–1439 · wide 1440+
```

Navigation switches at **992px**. Sticky layouts are desktop-only (≥992px) and
must degrade to normal document flow below that and at short viewport heights.

Use `svh`/`dvh` for full-height sections, never bare `vh`.

## UI primitives

From `@/components/ui`:
`Container`, `Section`, `Grid`, `SectionEyebrow`, `ButtonLink`, `TextLink`,
`Tag`, `Divider`, `EmptyState`, `Pagination`, `ExternalIcon`, `cx`, `uiStyles`.

Separately: `@/components/ui/ResponsiveImage`, `@/components/ui/Reveal` (client),
`@/components/ui/RichTextRenderer`.

From `@/components/global`:
`FoundryLogo`, `FoundryIcon`, `SkipLink`, `SiteHeader`, `SiteFooter`,
`PitchBanner`, `ExternalLink`, `Breadcrumbs`, `SeoJsonLd`, `DraftModeBanner`,
plus icons in `icons.tsx`.

## Styling

CSS Modules, one `*.module.css` beside each component (primitives share
`ui.module.css`). Use `cx()` to compose. Dark surfaces set `data-surface="dark"`
so the global focus ring inverts.

## Metadata

Every route exports `generateMetadata` built with `buildMetadata` from
`@/lib/seo/metadata`. Never hand-write a `<title>`. Fallback title/description
must be derived from already-approved page fields — never invented in the
component.

Feature-flagged routes that are off must:

- call `notFound()` in production,
- export `HIDDEN_ROUTE_METADATA`,
- be absent from navigation (already handled by `getSiteSettings`) and sitemap.

## Filters

Use `@/lib/filters/engine`:
`parseFilters`, `serializeFilters`, `toggleValue`, `clearGroup`, `clearAll`,
`countSelected`, `matchesFilters`, `filtersToHref`.

Rules the engine already enforces — do not re-implement them:

- repeated params, never comma lists;
- fixed group order, alphabetical values;
- unknown keys/values dropped, duplicates deduped;
- `status=exit-realized` expands to `status=exited&status=realized`.

Client behaviour:

- every explicit user action uses `router.push(url, { scroll: false })` so back
  goes one filter step at a time;
- `router.replace(url, { scroll: false })` is used **only** to normalise a
  non-canonical incoming URL, once;
- result count announced via `aria-live="polite"`;
- the activated control keeps focus after the URL updates.

## Accessibility floor

- Visible `:focus-visible` (already global): 2px, offset 3px.
- Touch targets ≥ 44×44px.
- Real `<button>` for anything that acts; real `<a>` for anything that navigates.
- Checkboxes/radios have unique ids and a `<fieldset>`/`<legend>` per group.
- Hover-only information is forbidden; every hover state has a focus equivalent.
- Decorative SVG gets `aria-hidden="true" focusable="false"`.
- External links get `rel="noopener noreferrer"` and an accessible-name hint.

## Analytics

`track()` from `@/lib/analytics` with the typed event union only. Never send a
name, email, URL from a form field, or any free text.

## Directory ownership

Keep changes inside your assigned directories. Shared foundation files
(`src/content/**`, `src/lib/filters/**`, `src/lib/seo/**`, `src/styles/**`,
`src/components/ui/**`, `src/components/global/**`, `next.config.ts`,
`src/proxy.ts`) are owned by the integrator — if you need a change there,
note it in your summary instead of editing it.
