# Foundry Ventures

The Foundry Ventures website — a Nordic pre-seed AI venture firm.

Next.js 16 (App Router) · React 19 · TypeScript strict · CSS Modules · pnpm.
Server Components by default; `"use client"` only for genuine interactivity.

---

## Read this first: the production build looks empty, and that is correct

If you build this repository in production mode you will get a site with **no
portfolio companies, no team members, no articles and no home-page copy**. Every
route renders, every layout is intact, and almost nothing is in them.

Nothing is broken. The content layer will not publish a fact that nobody has
approved.

Every factual claim on this site carries an evidence record with one of three
statuses — `unverified`, `observed`, `owner-approved` — and production renders
**only** `owner-approved`. Every string carries `unapproved` / `approved` and
production renders only `approved`. The entire seed dataset, which was migrated
from the 2026-08-10 live snapshot, is `observed` or `unverified`, and every
string is `unapproved`. So production publishes almost nothing.

`observed` deliberately is not enough. It means "the old site said this", which
is evidence about the old site, not a decision that the new one should repeat it.
Migrating a fact and approving a fact are different acts, and this codebase makes
the second one happen explicitly.

**Development and test default to `preview` mode**, which renders everything
behind a banner with indexing disabled — so `pnpm dev` shows you the full site.
That is why "it works locally" and "production is empty" are both true.

| Mode         | When                                                                   | Renders                                      |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| `preview`    | `pnpm dev`, tests, draft-mode cookie, or `FOUNDRY_POLICY_MODE=preview` | Everything, with a banner and `noindex`      |
| `production` | a production runtime, or `FOUNDRY_POLICY_MODE=production`              | Only owner-approved fields and approved copy |

Resolution order is: `FOUNDRY_POLICY_MODE` → draft-mode cookie → `NODE_ENV`
(`src/content/context.ts`).

To see what production would actually publish:

```bash
FOUNDRY_POLICY_MODE=production pnpm dev
```

To see the complete list of what is blocking launch and who owns each item:
**[`docs/content-gaps.md`](docs/content-gaps.md)**.

---

## Getting started

Requires Node ≥ 20.9 (CI uses 22) and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

No environment variables, credentials or network access are needed. The site
builds and tests entirely from `src/content/seed/**`.

Two things will look wrong on first run, and both are expected:

- **The logo is a marked placeholder frame.** The five delivered brand SVG
  masters are not in this repository; they are supplied out of band. See
  `public/brand/README.md`. The logotype is never recreated with text.
- **Headings render in Georgia, not Ivar Display.** The licensed font file is
  not in the repository either. `pnpm dev` prints a warning explaining this.
  Inter is never a substitute.

---

## Documentation

| Document                                           | For                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`docs/build-contract.md`](docs/build-contract.md) | **Read before writing code.** Conventions, tokens, primitives, accessibility floor. |
| [`docs/decisions.md`](docs/decisions.md)           | Why the codebase is the way it is, and how to reverse each decision.                |
| [`docs/content-gaps.md`](docs/content-gaps.md)     | Everything blocking launch, with an owner per item.                                 |
| [`docs/editor-guide.md`](docs/editor-guide.md)     | For content owners: adding records, approving fields, using preview.                |
| [`.env.example`](.env.example)                     | Every environment variable the code reads.                                          |

---

## Project layout

```
src/
  app/                  App Router routes, API handlers, metadata routes
  components/
    ui/                 Primitives (Container, Section, Grid, ButtonLink, …)
    global/             Header, footer, logo, breadcrumbs, skip link
    home/ portfolio/ team/ insights/ network/ about/ forms/
  content/
    types.ts            The domain model — the only shape components see
    index.ts            The content API. Import from "@/content", nothing deeper.
    policy.ts           The single publishing policy. No scattered if-statements.
    context.ts          Policy-mode resolution
    integrity.ts        Record-level content integrity report
    adapters/           local (seed) and sanity, returning identical types
    seed/               The migrated dataset, with evidence attached
  lib/                  brand, filters, pitch, seo, security, validation, analytics
  styles/               tokens.css, fonts.css, typography.css, global.css
  middleware.ts         Legacy 410/308 routing and canonical host normalisation
scripts/                Node ESM gates and checks (no dependencies)
tests/                  unit/ · components/ · e2e/
public/                 brand/ (empty by design) · fonts/ · images/
content-quarantine/     Source material not confirmed as current Foundry content
```

**Import content only from `@/content`.** Never import a seed file or a Sanity
client from a component — that is how a publishing rule gets bypassed.

---

## The content adapter

`getAdapter()` picks the source at runtime:

- **Sanity** when **both** `SANITY_PROJECT_ID` and `SANITY_DATASET` are set.
- **Local seed** otherwise — the default.

Both return the same normalised types from `src/content/types.ts`, so no
component can tell which is active, and the whole site is reviewable with no
credentials ([D-003](docs/decisions.md#d-003)).

A third source exists for tests only: `src/content/seed/fixtures.ts` holds
**fictional** companies, people and posts with approved-looking evidence, so
Playwright can exercise filters, detail routes and related content that the real
dataset cannot yet reach. Loading it requires **two** independent switches:

```bash
FOUNDRY_CONTENT_FIXTURE=e2e FOUNDRY_ALLOW_FIXTURES=1
```

The production gate fails if either is set. Never use them outside a test run.

---

## Environment variables

Full annotated list in [`.env.example`](.env.example). Copy it to `.env.local`
and fill in what you need — nothing is required for development.

There are deliberately **no `NEXT_PUBLIC_*` variables**. Every value the code
reads is server-only: no recipient address, CMS token or shared secret may reach
the client bundle.

Grouped by what they unlock:

| Group     | Variables                                                                                                                                                                                                                          | Without them                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Policy    | `FOUNDRY_POLICY_MODE`, `FOUNDRY_ENFORCE_CANONICAL_HOST`                                                                                                                                                                            | Mode is inferred from `NODE_ENV`; no host normalisation              |
| Preview   | `DRAFT_MODE_SECRET`                                                                                                                                                                                                                | `/api/draft/enable` answers 404 — no preview surface at all          |
| CMS       | `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `SANITY_READ_TOKEN`, `SANITY_WEBHOOK_SECRET`                                                                                                                          | The local seed adapter is used; the revalidation webhook answers 404 |
| Pitch     | `PITCH_RECIPIENTS`, `PITCH_ESCALATION_EMAIL`, `PITCH_FROM_EMAIL`, `RESEND_API_KEY`, `PITCH_FINGERPRINT_SALT`, `PITCH_STORE_DRIVER`, `PITCH_STORE_DIR`, `PITCH_RETENTION_DAYS`, `PITCH_REVIEW_URL_BASE`, `PITCH_MAINTENANCE_SECRET` | Production `/pitch` shows a contact fallback instead of the form     |
| Test only | `FOUNDRY_CONTENT_FIXTURE`, `FOUNDRY_ALLOW_FIXTURES`                                                                                                                                                                                | —                                                                    |

---

## Scripts

```bash
pnpm dev                  # dev server (preview policy; runs fonts:check first)
pnpm build                # production build
pnpm start                # serve the production build

pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint
pnpm format               # prettier --write .
pnpm format:check         # prettier --check .

pnpm test                 # vitest run — unit + component + content integrity
pnpm test:watch           # vitest in watch mode
pnpm e2e                  # playwright test
pnpm e2e:install          # install the Chromium browser Playwright needs

pnpm brand:verify         # report brand SVGs against the Appendix A.1 hashes
pnpm brand:verify:strict  # …and fail when any is missing (production gate)
pnpm fonts:check          # warn about the missing Ivar Display file (never fails)
pnpm content:gate         # the production content gate (see below)

pnpm verify               # typecheck + lint + test + build
```

### Testing

- `tests/unit/` — the policy layer, the filter engine, metadata, validation, and
  the record-level content integrity report.
- `tests/components/` — components in jsdom via Testing Library.
- `tests/e2e/` — Playwright, driven by the synthetic fixture dataset.

End-to-end tests need the fixtures **at build time**, because pages are rendered
when the site is built:

```bash
FOUNDRY_CONTENT_FIXTURE=e2e FOUNDRY_ALLOW_FIXTURES=1 pnpm build
FOUNDRY_CONTENT_FIXTURE=e2e FOUNDRY_ALLOW_FIXTURES=1 pnpm e2e
```

### The production gate

Two halves, run together in CI, neither sufficient alone:

| Command             | Checks                                                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`         | Record-level fields — which company is still `observed`, which paragraph is still unapproved, which placeholder image is still referenced. Needs the TypeScript content layer, so it runs inside Vitest. |
| `pnpm content:gate` | Environment and assets — policy mode, fixture switches, canonical host, privileged secrets, pitch readiness, brand asset hashes, remaining placeholder artwork. Dependency-free Node ESM.                |

`pnpm content:gate` prints an itemised report and exits non-zero on any blocker.
It is expected to fail today: the brand masters are not in the repository and the
placeholder artwork is still in use. Both are launch decisions, not build errors.

Secret _values_ are never printed — only whether a variable is usable — so the
output is safe in a public CI log.

---

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml), Node 22 with pnpm and
Playwright browsers cached.

**`verify`** — every push and pull request: typecheck → lint → unit and component
tests → brand asset report → production build → rebuild with fixtures →
Playwright. The production build runs with `FOUNDRY_POLICY_MODE=production` and
the real seed, so it proves the site builds correctly while publishing almost
nothing.

**`production-gate`** — `main` only, after `verify`: runs
`scripts/content-integrity.mjs` and `node scripts/verify-brand-assets.mjs
--strict`. **This is the job a production deploy must be required to pass.** It
reads the secrets named in `.env.example`; a missing repository secret arrives as
an empty string and is reported as missing, which is the intended behaviour.

---

## Deployment

Any host that can run `next build` and `next start` on Node ≥ 20.9. There is one
platform-aware behaviour: when `VERCEL=1`, the pitch readiness check rejects the
filesystem submission store, because a serverless filesystem does not survive the
request.

Before a production deploy:

1. `production-gate` passes.
2. Brand SVG masters are in `public/brand/` and hash-verified.
3. `FOUNDRY_POLICY_MODE=production` and `FOUNDRY_ENFORCE_CANONICAL_HOST=1`.
4. DNS and TLS cover both `www.foundryventures.ai` and the apex; the apex
   308-redirects to `www` in a single hop.
5. Pitch pipeline configured with a durable store, or `/pitch` knowingly showing
   the contact fallback.
6. `PITCH_MAINTENANCE_SECRET` set **and** `POST /api/pitch/maintenance` on a
   schedule — otherwise the retention purge promised in the privacy notice never
   runs and failed pitch notifications are never retried.

Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy`) are set in `next.config.ts`. **HSTS is
deliberately absent** until the canonical host and every subdomain are confirmed
over HTTPS — it is very hard to undo.

### Content freshness

`POST /api/revalidate` is the CMS webhook. It verifies Sanity's
`sanity-webhook-signature` in constant time, rejects replays outside a five-minute
window, and revalidates only paths from a fixed vocabulary in the handler — no
path from the request is ever used. Unconfigured, it answers 404.

---

## Preview

`GET /api/draft/enable?secret=…&redirect=/portfolio` issues the preview cookie
and renders unapproved and unpublished content behind a banner, always
`noindex`. `redirect` must be a same-origin path and cannot point into `/api/*`.
Unconfigured, the endpoint answers 404 to every method rather than confirming it
exists. `GET /api/draft/disable` always works and needs no secret.

A preview _deployment_ (`FOUNDRY_POLICY_MODE=preview`) serves a `robots.txt` that
disallows everything and references no sitemap.

See [`docs/editor-guide.md`](docs/editor-guide.md#previewing-unapproved-work).

---

## Rollback

Three different things can go wrong, and they roll back in three different ways.

**Bad code** — redeploy the previous commit. The build is deterministic from the
repository and the environment; there is no build-time state to unwind.

**Bad content, seed-backed** — revert the commit. Content is code today, so a
content mistake has the same rollback as a code mistake.

**Bad content, CMS-backed** — the fastest correct action is usually not a
deploy. In order of blast radius:

1. **Un-approve the field.** Set its evidence back below `owner-approved`, or
   flip an `EditorialText` to `unapproved`. It disappears from production on the
   next revalidation. This is the finest-grained lever and the one to reach for
   first.
2. **Un-publish the record.** Set `publicationStatus` away from `"published"`.
   The record leaves the archive, its detail route stops being generated, and it
   drops out of the sitemap and any related-content query.
3. **Turn off the feature flag.** The whole surface 404s, leaves navigation and
   leaves the sitemap. This is the kill switch for a section, not a record.
4. **Revoke consent** (testimonials only). A `revoked` testimonial disappears
   everywhere immediately, preview included.

None of these require a deploy once the CMS is connected. Each is also reversible
in the same way it was applied.

**A wrongly published fact** is worth one extra note: removing it from the site
does not remove it from search indexes or from anyone who copied it. Re-check
what was exposed, and prefer approving carefully over rolling back quickly —
which is the reason the approval gate exists in the first place.
