# Decision log

Every entry records a decision that shaped this rebuild, why it was made, what it
costs, and how to undo it. Reversal instructions are part of each entry on
purpose: a decision you cannot describe how to reverse is a decision nobody can
challenge later.

All entries are dated **2026-08-10** — the date of the frozen live snapshot the
rebuild was specified against. Spec references are to
`foundry-ventures-rebuild-buildspec.md`.

Related reading: [`build-contract.md`](./build-contract.md) (the conventions that
follow from these decisions), [`content-gaps.md`](./content-gaps.md) (what is
still blocking launch), [`editor-guide.md`](./editor-guide.md) (how a content
owner works within them).

| ID              | Decision                                                               | Status                      |
| --------------- | ---------------------------------------------------------------------- | --------------------------- |
| [D-001](#d-001) | Brand SVG masters stay out of the repository, behind a hash gate       | Active                      |
| [D-002](#d-002) | Ivar Display falls back to metric-adjusted Georgia                     | Active, blocking launch     |
| [D-003](#d-003) | The local seed adapter is the default content source                   | Active                      |
| [D-004](#d-004) | Field-level evidence and approval govern all publishing                | Active                      |
| [D-005](#d-005) | Six feature flags ship off                                             | Active                      |
| [D-006](#d-006) | Pitch runs on a file store and log notifier until secrets exist        | Active                      |
| [D-007](#d-007) | 308 for permanent redirects, 410 for removed pages, both in middleware | Active                      |
| [D-008](#d-008) | One canonical origin, single-hop normalisation, off by default         | Active                      |
| [D-009](#d-009) | Foundry-owned placeholder artwork instead of hotlinked originals       | Active, blocking launch     |
| [D-010](#d-010) | No Tailwind — CSS Modules over design tokens                           | Active                      |
| [D-011](#d-011) | Brand-name casing left unresolved on purpose                           | Open, needs a content owner |
| [D-012](#d-012) | `/offering` redirects to `/#offering` under P0                         | Active, revisit at P1       |

---

<a id="d-001"></a>

## D-001 — Brand SVG masters stay out of the repository, behind a hash gate

**Date:** 2026-08-10

**Decision.** The five delivered Foundry SVG masters
(`foundry-logo-blue|white|black.svg`, `foundry-icon-blue|white.svg`) are **not**
committed. `public/brand/` holds only a README. Their exact byte counts and
SHA-256 digests are recorded twice — in `src/lib/brand/manifest.ts` for the
application and in `scripts/verify-brand-assets.mjs` for CI — and
`node scripts/verify-brand-assets.mjs --strict` fails the production gate until
each file is present and matches. Until then `FoundryLogo` renders an explicit
missing-asset frame. `bright.svg` from the same source archive is quarantined
(see `content-quarantine/README.md`) because Bright is not a confirmed portfolio
company.

**Rationale.** The source archive lives on the design owner's machine and was not
delivered into this workspace. The two tempting shortcuts are both worse than an
empty directory: recreating the wordmark as styled text produces a logotype that
is _almost_ right and therefore ships unnoticed, and hotlinking the live site's
copy makes the brand depend on Squarespace staying up. Hashing rather than merely
checking for presence is what catches the third failure mode — a well-meant
"optimisation" pass through SVGO that quietly alters path data.

**Spec.** §1.2, §5.1, §31.5, Appendix A.1.

**Consequence.** No deploy can reach production until the masters are copied in,
and any modification to them is detected. Development is unaffected apart from a
visibly marked placeholder frame. The manifest is duplicated in two files and the
two must be kept in step.

**Reversal.** Copy the five files into `public/brand/` byte-for-byte and run
`pnpm brand:verify:strict`. To abandon the hash check entirely, delete the strict
step from the `production-gate` job in `.github/workflows/ci.yml` — but that
removes the only protection against a silently edited logotype.

---

<a id="d-002"></a>

## D-002 — Ivar Display falls back to metric-adjusted Georgia

**Date:** 2026-08-10

**Decision.** `src/styles/fonts.css` declares `@font-face` for Ivar Display
pointing at `/fonts/IvarDisplay-Regular.woff2`, which is not in the repository,
plus an `IvarDisplay Fallback` face that maps to local Georgia with
`ascent-override`, `descent-override` and `size-adjust` tuned to reduce the swap
reflow. `scripts/check-fonts.mjs` warns on `pnpm dev`. `.gitignore` excludes
`public/fonts/*.woff2` so the file cannot be committed by accident.

**Rationale.** The live site serves an `IvarDisplay-Regular.woff` from
Squarespace. That file identifies the typeface; it is not a licence to
redistribute it. Downloading it into `public/` would ship an unlicensed font from
Foundry's own origin. Georgia is the honest fallback: a serif with broadly
similar colour, present on effectively every device, requiring no network
request. Inter is explicitly not an option — it is a grotesque and would change
the brand's voice rather than approximate it.

**Spec.** §5.2, §22.3, §30.

**Consequence.** Headings render off-brand until the licence is resolved. Layout,
spacing and line-breaking are close but not identical, so the fallback metrics
are tuning defaults that must be re-measured against the real face. The font
check is a warning, never a gate: blocking a developer over an asset they cannot
legally obtain would achieve nothing.

**Reversal.** Obtain the licensed WOFF2 from the rights holder, place it at
`public/fonts/IvarDisplay-Regular.woff2`, and the existing `@font-face` activates
with no code change. Then re-measure the four override values in `fonts.css`
against the real metrics and remove the gitignore exclusion if the licence
permits committing the binary.

---

<a id="d-003"></a>

## D-003 — The local seed adapter is the default content source

**Date:** 2026-08-10

**Decision.** `getAdapter()` in `src/content/index.ts` selects the Sanity adapter
only when **both** `SANITY_PROJECT_ID` and `SANITY_DATASET` are set; otherwise it
returns `localAdapter`, which reads the TypeScript files in
`src/content/seed/**`. Both adapters return the same normalised domain types from
`src/content/types.ts`, so no component can tell which is active.

**Rationale.** The whole site — build, tests, review, a full visual pass — must be
runnable by anyone who clones the repository, with no credentials and no network.
Making the CMS the default would mean the first thing a new contributor meets is
an access request. It also keeps the migration honest: every fact currently on
the site exists as reviewable code with its provenance attached, rather than as
rows someone typed into a CMS.

**Spec.** §4.2, §30.

**Consequence.** Content changes are code changes until Sanity is connected, so a
content owner needs an engineer to make one (this is exactly what
[`editor-guide.md`](./editor-guide.md) documents). The seed and the Sanity schema
must be kept structurally in step; `src/sanity/schema-types.ts` is where that
correspondence is recorded.

**Reversal.** Set `SANITY_PROJECT_ID` and `SANITY_DATASET`. The adapter switches
on the next process start with no code change. To go back, unset them.

---

<a id="d-004"></a>

## D-004 — Field-level evidence and approval govern all publishing

**Date:** 2026-08-10

**Decision.** Every public factual claim carries a `FieldEvidence` record whose
`status` is `unverified`, `observed` or `owner-approved`. Every user-visible
string travels as an `EditorialText` with an `approvalStatus`. In production a
field renders **only** when its own evidence is `owner-approved` and a string
renders only when its `approvalStatus` is `approved`. Images additionally require
`rightsStatus: "approved"` and `available: true`. All of this is enforced through
one module, `src/content/policy.ts`, which `generateStaticParams`, the sitemap,
filter facets, related-content queries and every component route through. The
seed dataset marks everything `observed` or `unverified`, and every string
`unapproved`.

**Rationale.** The requirement that nothing may be invented is easy to state and
hard to keep if it lives in reviewer discipline. Making unverified data
structurally unrenderable moves it from a rule people follow to a rule the type
system and the policy layer enforce. `observed` deliberately does not publish:
what a scrape of the live site produces is evidence of what the _old_ site said,
not a decision that the new one should say it. And a scattering of `if` statements
would eventually let a record be publishable on the archive but not in the
sitemap; a single module cannot drift from itself.

**Spec.** §16.8, §25.1, §6.4, §16.7.

**Consequence.** **A production build of the current seed publishes almost
nothing.** Zero companies list, zero team members list, no home copy renders, no
detail route is generated. This is the gate working, not a broken build — the
same code with an approved dataset renders the full site, which is what the
Playwright fixtures demonstrate. Approving content is a deliberate human act with
a named approver and a date, and there is intentionally no default for either.

**Reversal.** Not reversible as a design without abandoning the no-invented-facts
requirement. Individual fields are "reversed" by approving them — see
[content-gaps.md § How to approve a field](./content-gaps.md#how-to-approve-a-field).
To see the whole site as it would look once approved, run in preview mode
(`FOUNDRY_POLICY_MODE=preview`), which renders unapproved records behind a banner
and `noindex`.

---

<a id="d-005"></a>

## D-005 — Six feature flags ship off

**Date:** 2026-08-10

**Decision.** `SEED_SITE_SETTINGS.featureFlags` sets `investmentCriteria`,
`insights`, `about`, `network`, `stats` and `testimonials` to `false`. A disabled
route calls `notFound()` in production, exports `HIDDEN_ROUTE_METADATA`, is
filtered out of navigation and the footer by `getSiteSettings()`, and is absent
from the sitemap. Disabled _content_ is not merely hidden: `getListablePosts()`
returns an empty array in production when `insights` is off, so a post cannot
leak through a related-content query on another page.

**Rationale.** Each flag guards a surface with no approved content behind it.
Insights and Network have literally empty seed arrays (`SEED_POSTS`,
`SEED_NETWORK_PEOPLE`) because the snapshot contains no articles and no published
network; Testimonials is empty because a testimonial needs both a real quote and
recorded consent; Stats would state a number derived from a portfolio that is not
yet approved; Investment criteria has two rows sourced only from the prototype;
About is drafted but unapproved. Shipping any of them would produce a public
empty state — a page that advertises a capability Foundry cannot currently
demonstrate — which is worse than the page not existing.

**Spec.** §3.4, §7.6, §12, §13, §14, §16.5, §30.

**Consequence.** Six routes 404 in production while remaining fully built and
reviewable in preview. Navigation is correspondingly short. Every flagged route
still has complete code, tests and metadata, so enabling one is a content
decision rather than an engineering project.

**Reversal.** Flip the flag in `src/content/seed/site-settings.ts` (or in the
`siteSettings` document once Sanity is connected). Do it only together with the
approved content the surface needs — the flag reveals the route, it does not
create anything to put on it.

---

<a id="d-006"></a>

## D-006 — Pitch runs on a file store and log notifier until secrets exist

**Date:** 2026-08-10

**Decision.** `readPitchConfig()` defaults to the `file` storage driver
(`.data/pitch`, written `0600`, atomic temp-file + rename) and the `log` notifier
when `RESEND_API_KEY` is absent. `checkPitchReadiness()` returns every unmet
requirement; `/pitch` renders the form in development and preview regardless, but
in production any unmet requirement means the form is replaced by a contact
fallback built from approved team email addresses. `scripts/content-integrity.mjs`
re-checks the same requirements in CI and blocks the production gate.

**Rationale.** The pipeline has to be genuinely exercisable end to end locally,
or nobody discovers the submission path is broken until a founder uses it. The
file store gives a real durable write on a developer machine and a real record to
inspect; the log notifier proves the notification would be sent without needing a
provider account. The asymmetry between development and production is the
important part: locally, a submission landing in `.data/pitch` is the correct
outcome, whereas in production a form that accepts twenty minutes of a founder's
writing and then drops it is the single worst failure this site could have. The
readiness list is duplicated in the CI script because that check must run before
a deploy, not during one.

**Spec.** §11.3, §11.4, §30.

**Consequence.** Production `/pitch` shows the contact fallback until
`PITCH_RECIPIENTS`, `PITCH_ESCALATION_EMAIL`, `PITCH_FROM_EMAIL`,
`RESEND_API_KEY` and a deployment-specific `PITCH_FINGERPRINT_SALT` are all set —
and, on a serverless host, until a durable store replaces the filesystem driver.
The readiness rules now exist in two places (`src/lib/pitch/config.ts` and
`scripts/content-integrity.mjs`) and must be kept in step.

**Reversal.** Set the variables listed in `.env.example` under _Pitch pipeline_.
Nothing else changes; the same code path activates.

---

<a id="d-007"></a>

## D-007 — 308 for permanent redirects, 410 for removed pages, both in middleware

**Date:** 2026-08-10

**Decision.** Legacy routing lives in `src/proxy.ts`, not in
`next.config.ts`. `/instructors` and `/pricing` answer **410 Gone** with a
minimal branded page. `/home` → `/` and `/offering` → `/#offering` answer **308
Permanent Redirect**. Gone is evaluated first, ahead of any host normalisation.

**Rationale.** 308 rather than 301 because 308 is the status that guarantees the
method and body are preserved. In practice these are all `GET`s, so the visible
behaviour is identical — the reason to prefer 308 is that 301's permission to
rewrite a `POST` into a `GET` is a legacy quirk with no upside, and picking the
unambiguous status costs nothing. 410 rather than 404 because these Squarespace
template demo pages are _known_ to be permanently gone rather than merely absent,
and crawlers drop a 410 considerably faster. The work has to happen in middleware
because `next.config.ts` redirects cannot express 410 and `notFound()` can only
produce 404; putting both in one place is also what lets the precedence be
explicit — redirecting a dead page to a live host first, and only then killing
it, would be two hops to a tombstone.

**Spec.** §15.2.

**Consequence.** All legacy routing decisions are in one file, evaluated in a
documented precedence order, and asserted by an end-to-end test against the real
status codes. The middleware matcher must keep excluding static assets and image
optimisation, or every asset request pays for this logic.

**Reversal.** Remove a path from `GONE_PATHS` or `LEGACY_REDIRECTS` in
`src/proxy.ts`. A removed `GONE_PATHS` entry falls through to a normal 404.

---

<a id="d-008"></a>

## D-008 — One canonical origin, single-hop normalisation, off by default

**Date:** 2026-08-10

**Decision.** `https://www.foundryventures.ai` is the single canonical origin. It
is stored once, in `SEED_SITE_SETTINGS.canonicalOrigin`, and feeds canonical
tags, OG URLs, the sitemap, `robots.txt` and JSON-LD through `buildMetadata`.
The middleware normalises plain HTTP, the apex host and trailing slashes to it in
exactly one 308 hop — but only when `FOUNDRY_ENFORCE_CANONICAL_HOST=1`. The
production gate requires that variable to be `1`.

**Rationale.** Duplicate origins split ranking signals and produce canonical tags
that disagree with the URL that served them, so the origin has to be single-
sourced. Chaining hops (HTTP → HTTPS, then apex → www, then trailing slash) is
the usual accidental result of implementing each rule separately; deciding them
together makes one hop structurally guaranteed. The environment gate exists
because the rule is actively wrong off production: a preview deployment or a
`localhost` dev server that enforced it would redirect developers and reviewers
straight off the host they are trying to look at.

**Spec.** §15.2, §21.1, §21.4, §23.

**Consequence.** Enforcement depends on an environment variable, which is a thing
that can be forgotten — so the content gate checks it explicitly rather than
trusting the deploy configuration. HSTS is deliberately _not_ enabled in
`next.config.ts` until the canonical host and all subdomains are confirmed over
HTTPS, because HSTS is very hard to undo.

**Reversal.** Set `FOUNDRY_ENFORCE_CANONICAL_HOST=0` to serve any host directly.
To change the canonical origin, edit `CANONICAL_ORIGIN` in
`src/content/seed/site-settings.ts` and the constants in `src/proxy.ts`
together — they are two copies of one fact and must move as a pair.

---

<a id="d-009"></a>

## D-009 — Foundry-owned placeholder artwork instead of hotlinked originals

**Date:** 2026-08-10

**Decision.** The live site's photographs (the ocean hero, the architecture and
silhouette pair) are recorded as **export references** — `sourceUrl` pointing at
the Squarespace CDN, `rightsStatus: "unverified"`, `available: false` — so
`canRenderImage()` refuses them everywhere. Three Foundry-authored SVGs in
`public/images/placeholder/` render in their place, flagged `isPlaceholder: true`.
Portfolio logos are export references with no stand-in at all: they degrade to
the typographic company-name treatment. `next.config.ts` sets
`images.remotePatterns: []`, so hotlinking is not merely discouraged but
impossible.

**Rationale.** Three separate reasons converge. Rights: the photographs' licences
are unconfirmed, and an unconfirmed licence is not a licence. Reliability:
hotlinking a CDN Foundry is migrating away from means the new site breaks when
the old one is switched off. Honesty: a broken image or a stock substitute both
misrepresent the finished design, whereas a flagged placeholder is visible in
review and is listed by name in the content-integrity report. Foundry-owned
artwork is used rather than a grey box because the layout, aspect ratios and
focal points need something real to be reviewed against.

**Spec.** §5.5, §16.7, §19.4.1, Appendix A.2.

**Consequence.** The site is visually complete for review but cannot ship: the
production gate fails while any placeholder is referenced. Each export reference
carries the observed intrinsic dimensions and focal point, so the licensed
original can be dropped in with its crop already known.

**Reversal.** Export the rights-cleared original, place it under `public/images/`,
and replace the `placeholder(...)` call in `src/content/seed/images.ts` with the
real asset (`rightsStatus: "approved"`, `available: true`, a named `rightsOwner`,
no `isPlaceholder`). The gate clears once no reference remains.

---

<a id="d-010"></a>

## D-010 — No Tailwind: CSS Modules over design tokens

**Date:** 2026-08-10

**Decision.** Styling is CSS Modules, one `*.module.css` beside each component,
composed with `cx()`, over the custom-property design tokens in
`src/styles/tokens.css`. No utility framework, no CSS-in-JS runtime.

**Rationale.** The design system here is unusually specific — a 24-column desktop
grid with an 11px gutter, `6vw`/`3vw` gutters, a 600ms underline easing, optical
scale factors per portfolio logo, breakpoints chosen from content rather than
device classes. Expressing that in utility classes means either a large bespoke
Tailwind config (a design system, just written in someone else's vocabulary) or
arbitrary-value escapes everywhere, which is worse than plain CSS. CSS Modules
also keep the server-component default intact: no runtime, no client boundary,
scoping by construction. And the token layer, not the class layer, is where the
brand is defined — so components reference `--space-lg`, and a spacing change
happens in one file.

**Spec.** §5, §19, and the design-token contract in `build-contract.md`.

**Consequence.** Contributors write real CSS, and shared patterns must be
deliberately extracted into `ui.module.css` rather than emerging from repeated
utility strings. Magic numbers are a review issue, since nothing mechanically
prevents one — the tokens table in `build-contract.md` is the reference.

**Reversal.** Would require rewriting every `*.module.css`. There is no partial
adoption path worth taking: two styling systems in one codebase is strictly worse
than either alone.

---

<a id="d-011"></a>

## D-011 — Brand-name casing left unresolved on purpose

**Date:** 2026-08-10

**Decision.** Three separate fields exist and are not reconciled:
`displayBrandName: "Foundry ventures"` (lowercase v, `observed` — matching the
live wordmark and `<title>`), `seoBrandName: "Foundry Ventures"` (`unverified`),
and `legalName: undefined`. No normalisation is applied anywhere.

**Rationale.** The live site renders "Foundry ventures"; the company is commonly
written "Foundry Ventures". One of those is a deliberate typographic choice and
the other is a typo, and the audit material does not say which. Picking either
would be inventing a brand decision — normalising to title case would silently
overwrite a possible design intent, and propagating the lowercase form would
spread a possible error into metadata and structured data. Modelling the display
name, the SEO name and the legal name as three fields is correct regardless of
how the casing question resolves: they legitimately differ for many companies.

**Spec.** §16.1, §25.2.

**Consequence.** `seoBrandName` is `unverified`, so it is listed as a block by
the content-integrity report and the site cannot pass the gate without an
explicit answer. The two spellings coexist in the seed until then.

**Reversal.** A content owner decides. Set the chosen value(s) and approve the
evidence with `ownerApproved(...)`. If display and SEO names should be identical,
set them identically — do not collapse the fields, since `legalName` is a third
answer and will differ from both.

---

<a id="d-012"></a>

## D-012 — `/offering` redirects to `/#offering` under P0

**Date:** 2026-08-10

**Decision.** `LEGACY_REDIRECTS` in `src/proxy.ts` maps `/offering` to
`/#offering`, a 308 to the anchor on the home page. `OfferingGrid` carries
`id="offering"` and treats it as a published contract. Query parameters are
preserved ahead of the fragment.

**Rationale.** The obvious destination is `/about#offering`, but `about` is a
feature flag that is currently off (D-005), so that target 404s today. Sending a
legacy URL to a 404 in order to be structurally tidy is the wrong trade: the home
page's offering section is the same content, published now. The anchor is stable
because the section renders whenever any offering item is approved, and the
component documents that when nothing is approved the section is hidden entirely
and `/offering` lands at the top of the home page — degraded, but never broken.

**Spec.** §15.2, §7.4, §30.

**Consequence.** One redirect target must move when About ships, and it is easy
to forget. It is recorded here and in the code comment for that reason.

**Reversal.** When the `about` flag is enabled and `/about#offering` is
link-tested, change the single entry in `LEGACY_REDIRECTS` to `/about#offering`
and update the end-to-end assertion for it.

## D-013 — The fixed header offsets `main`; only the home hero opts out

**Date.** 2026-08-11 (integration)

**Decision.** `main` carries `padding-top: var(--header-height)` in
`src/styles/global.css`. A section that is designed to run full bleed beneath the
transparent header marks itself `data-hero="full-bleed"`, and
`main:has([data-hero="full-bleed"])` removes the offset. Only `HomeHero` does so.
`TRANSPARENT_ROUTES` in `HeaderShell` was reduced to `/` for the same reason.

**Rationale.** The header is `position: fixed` (§6.1, matching the live site), so
it is out of flow. Visual QA at 1280×720 showed the `Team` H1 clipped behind it
and the `Portfolio` H1 colliding with the logo — every inner page was affected,
because only the home hero was built to sit underneath. Putting the offset on
`main` and opting *out* is the safe direction: a browser without `:has()` support
gets extra whitespace on the home page rather than occluded content everywhere.

**Spec.** §6.1, §6.2, §7.1, §19.1.

**Consequence.** A future full-bleed hero on another route needs the
`data-hero="full-bleed"` attribute, and that route needs adding to
`TRANSPARENT_ROUTES`; the two must change together or the header will float over
ordinary content.

**Reversal.** Remove the two rules from `global.css` and give each hero its own
top padding instead. That was rejected because it re-introduces the same bug the
next time a section is added without the padding.

## D-014 — The end-to-end suite builds twice, once per dataset

**Date.** 2026-08-11 (integration)

**Decision.** `tests/e2e/scripts/build-app.mjs` produces two builds selected by
`NEXT_DIST_DIR` (read in `next.config.ts`): `.next` for the real dataset and
`.next-e2e-fixture` for the synthetic fixtures. Each Playwright web server points
at its own output.

**Rationale.** The first version assumed that leaving `FOUNDRY_POLICY_MODE` unset
would keep `draftMode()` on the render path and make every page dynamic, so one
build could serve two datasets from two environments. It does not: `next build`
reports these routes as static, and a server cannot change HTML that is already
rendered. The preflight check caught it. The alternative — forcing the whole site
to render per request — would trade the spec's prerendering strategy for test
convenience, so the harness changed instead of the product.

**Spec.** §4.3, §26.3.

**Consequence.** The suite pays for two builds. The fixture output directory is
git-ignored and never deployed, which keeps the two-switch guarantee that no
deployable artefact contains invented company data.

**Reversal.** If these routes ever become genuinely dynamic, drop the second
build and the `NEXT_DIST_DIR` plumbing.

## D-015 — `middleware.ts` renamed to `proxy.ts`

**Date.** 2026-08-11 (integration)

**Decision.** The edge routing rules live in `src/proxy.ts`, exporting `proxy`.

**Rationale.** Next.js 16 deprecates the `middleware` file convention in favour
of `proxy` and warns on every build. The behaviour — 410s, legacy redirects and
single-hop host normalisation — is unchanged.

**Spec.** §15.2.

**Consequence.** Documentation and the content gate reference `src/proxy.ts`.

**Reversal.** Rename back and export `middleware`; the deprecation warning
returns.
