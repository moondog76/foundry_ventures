# End-to-end and accessibility suite

Playwright, covering buildspec §26.3 (critical flows), §26.4 (accessibility) and
§26.6 (responsive integrity).

## Running it

```bash
pnpm e2e:install     # once — downloads the Chromium build Playwright pins
pnpm e2e             # builds the app, starts both servers, runs everything
```

Useful variations:

```bash
pnpm e2e --project=desktop            # one project
pnpm e2e --project=mobile
pnpm e2e --project=reduced-motion
pnpm e2e --project=real-dataset
pnpm e2e tests/e2e/desktop/pitch.spec.ts
pnpm e2e --ui                         # interactive runner
pnpm exec playwright show-report      # last HTML report
```

The first run performs a full `next build`, so budget a few minutes for it. The
build is not repeated while the servers are still up: outside CI
`reuseExistingServer` is on, so a second `pnpm e2e` reuses whatever is already
listening on ports 3000 and 3101.

> **Careful with that.** If you have your own `pnpm dev` running on port 3000 it
> will be used as-is — and it has neither fixture switch set. `preflight.setup.ts`
> detects exactly this and fails with an explanation instead of letting thirty
> downstream tests fail mysteriously. Stop the dev server, or run with `CI=1` to
> force a fresh one.

## The fixture dataset, and its two switches

Filters need more than one value per group, detail routes need publishable
records, related content needs relations. None of that exists in the real
Foundry dataset yet (see `docs/content-gaps.md`), so the suite runs against the
**synthetic** dataset in `src/content/seed/fixtures.ts`.

Everything in that file is fictional. It is not Foundry content and must never
reach a public deployment, which is why loading it needs **two** independent
switches — one misconfigured variable is not enough:

```
FOUNDRY_CONTENT_FIXTURE=e2e
FOUNDRY_ALLOW_FIXTURES=1
```

`playwright.config.ts` sets both, on the test server process only. The
production-gate job in CI asserts that neither is set in a production
environment.

`tests/e2e/support/fixture-data.ts` restates the facts the tests rely on
(company names, which records have detail routes, which post is external) rather
than importing the fixture module — otherwise a test would only be asserting
that the fixture equals itself.

## Two servers, one build

| Port | Dataset                 | Used by                                            |
| ---- | ----------------------- | -------------------------------------------------- |
| 3000 | synthetic fixtures      | `preflight`, `desktop`, `mobile`, `reduced-motion` |
| 3101 | the real, shipping seed | `real-dataset`                                     |

One feature-flag requirement can only be checked against the real dataset: with
`insights`, `about` and `network` off, those routes must 404 in production and be
absent from navigation and the sitemap. The fixture dataset turns all three
**on**, so that behaviour is not observable on port 3000 — and a single Next
process has a single environment. Hence the second server.

Both servers serve the **same build**. That works because the build runs without
`FOUNDRY_POLICY_MODE`: `resolvePolicyContext()` then reads Next's draft-mode
cookie, which is a dynamic API, so every route is rendered per request and each
server process answers from its own environment.
`tests/e2e/scripts/build-app.mjs` is the two-line script that enforces this — it
strips `FOUNDRY_POLICY_MODE` and both fixture switches before calling
`next build`, so synthetic content is never baked into build output.

The one route Next freezes at build time is `/sitemap.xml` (it exports
`revalidate`). Because the build has no fixtures, the sitemap both servers serve
is the honest, real-dataset one — which is what `real-dataset/feature-flags.spec.ts`
asserts against, and why nothing in this suite expects fixture URLs to appear in
the sitemap.

## Pitch submissions

`/pitch` refuses to render a form it cannot deliver, so the config satisfies
every readiness requirement in `src/lib/pitch/config.ts` with deliberately fake
values: `.invalid` addresses (the reserved never-resolvable TLD) and a
placeholder Resend key.

The happy-path test therefore exercises the **real** local file store —
submissions land in `.data/e2e-pitch/`, which is git-ignored. The notification
attempt that follows fails (the provider key is not real), the outbox schedules
a retry, and by design none of that reaches the user. Delete `.data/e2e-pitch/`
whenever you want a clean slate.

Each test sends its own `x-forwarded-for` address so the per-fingerprint rate
limit (five submissions an hour) can never make a re-run fail.

## Projects

| Project          | Viewport | Notes                                                                               |
| ---------------- | -------- | ----------------------------------------------------------------------------------- |
| `preflight`      | 1440×900 | Asserts the fixture dataset is live. Every other fixture project depends on it.     |
| `desktop`        | 1440×900 | The bulk of the suite.                                                              |
| `mobile`         | 390×844  | Touch enabled — the navigation dialog and the compact filter panel only exist here. |
| `reduced-motion` | 1440×900 | `prefers-reduced-motion: reduce` for the whole context.                             |
| `real-dataset`   | 1440×900 | Port 3101. Not a dependent of `preflight`, because it must _not_ see the fixtures.  |

## Viewport matrix

Checked for horizontal overflow on `/`, `/portfolio`, `/team` and `/pitch`, at
the top of the page and again scrolled to the bottom, by
`desktop/layout.spec.ts`:

| Size      | Why                                                    |
| --------- | ------------------------------------------------------ |
| 320×568   | smallest supported phone                               |
| 375×812   | common phone                                           |
| 390×844   | design reference phone                                 |
| 768×1024  | tablet — the filter panel becomes permanent here       |
| 1024×768  | tablet landscape — the desktop navigation appears here |
| 1280×720  | laptop                                                 |
| 1440×900  | design reference desktop                               |
| 1920×1080 | wide                                                   |

The matrix is resized inside one browser context rather than being split into
eight browser projects: the assertion is about CSS, not about browser behaviour.

## What is covered

| File                                                                   | §26.3 flow                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `desktop/journey.spec.ts`                                              | Home → Portfolio → filter → company → Pitch                     |
| `desktop/filter-url.spec.ts`                                           | shared filtered URLs, one-step history, one-shot normalisation  |
| `mobile/menu.spec.ts`                                                  | navigation dialog: focus, Escape, scroll restoration            |
| `desktop/feature-flags.spec.ts` + `real-dataset/feature-flags.spec.ts` | both sides of the feature gate                                  |
| `desktop/pitch.spec.ts`                                                | submission against the local file store, and validation failure |
| `desktop/insights-links.spec.ts`                                       | internal versus external posts                                  |
| `desktop/team.spec.ts`                                                 | hash anchors, header clearance, thin-profile routes             |
| `desktop/redirects.spec.ts`                                            | 308s, real 410s, branded 404                                    |
| `desktop/layout.spec.ts`                                               | viewport matrix, skip link                                      |
| `desktop/accessibility.spec.ts`, `mobile/accessibility.spec.ts`        | axe scans + keyboard passes                                     |
| `reduced-motion/motion.spec.ts`                                        | nothing stranded at `opacity: 0`, nothing autoplays             |

Accessibility scans assert **zero** violations at `wcag2a`, `wcag2aa`,
`wcag21aa` and `wcag22aa`. Anything they report is a real defect, not a style
preference — the correct response is to fix the page, never to narrow the tag
list.

## Artifacts

`playwright-report/` and `test-results/` are git-ignored. Traces are captured on
the first retry only; open one with `pnpm exec playwright show-trace <path>`.
