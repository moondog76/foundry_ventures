# Content gaps — what is blocking launch

Everything below is derived from the actual seed dataset in
`src/content/seed/**`, not from a wishlist. Each row names the field, what is
missing, why the publishing policy refuses it, and who can resolve it.

## Status — updated 2026-08-11

The content owner approved publication on 2026-08-11. Production now renders the
home page, the team and **nine portfolio companies**. The approval deliberately
covers only what Foundry already states publicly, so the gate still refuses
everything below.

**Published.** Company names, websites, logos and a two-sentence description
drafted from each company's own site; the migrated
home copy (hero, vision, offering, contact); Anders' and Julia's names, roles and
email addresses; Anders' phone number; four investment criteria (Stage, Industry,
Technology focus, Geography).

**The 2026-08-11 repositioning.** The owner rewrote the position — AI only,
teams only, €100k or €200k, one to three investments a month — and asked for the
site copy to be rewritten without their review, explicitly wanting an outside
perspective. Every home and About string is now `authoredOnInstruction`:
approved by that instruction, but not read line by line. `pnpm test` lists them.

Two claims on that page are publicly checkable and will age:

| Claim                              | Watch for                                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "One to three investments a month" | ~12–36 a year. The portfolio currently lists nine companies, so a visitor can do the arithmetic. Revisit if the real rate settles elsewhere. |
| "€100k or €200k"                   | Stated as two fixed sizes, not a range. Any deal outside them contradicts the site.                                                          |

**Read these before launch.** The nine company descriptions were summarised from
each company's own website on 2026-08-11. The claims are theirs, but the wording
is not — every one carries an evidence note saying Foundry has not read it line
by line, and `pnpm test` prints them. Fifteen minutes with the portfolio page
clears this.

**Still refused, by design.**

| Blocked                                      | Why                                                                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every company detail route                   | No company has body copy, so `canPublishDetail` is false. Cards link straight to the company website instead of generating a thin page.                                             |
| Stage / sector / focus / status filters      | No approved taxonomy exists, so `getCompanyFacets()` returns nothing and the filter UI hides itself.                                                                                |
| Founders, investment year, deal lead, HQ     | The live site states none of them.                                                                                                                                                  |
| Ticket range €50k–€300k and sweet spot €200k | Claude-prototype values, never live-verified. The other four criteria publish; these two stay hidden.                                                                               |
| Captions for Newly, Skattio and BuilderBase  | None exists anywhere. Those three cards show logo and name only.                                                                                                                    |
| BuilderBase's website                        | Not supplied. Its card is deliberately not a link rather than pointing at a guessed domain.                                                                                         |
| Insights, About, Network                     | Feature flags off; no real content.                                                                                                                                                 |
| Team profile pages                           | Neither person has a long bio, so `/team/[slug]` is not generated.                                                                                                                  |
| Legal entity name, address, org. number      | Unknown.                                                                                                                                                                            |
| Foundry's LinkedIn URL                       | Never confirmed. The guessed URL was **removed** on 2026-08-11 — the header, footer and mobile menu now omit the link entirely rather than sending visitors to someone else's page. |

**Photography** is now the owner's own, supplied 2026-08-11: the ocean hero, the
brutalist architecture image and the dark silhouette. No placeholder artwork
remains, and `pnpm content:gate` confirms it.

One caveat: the hero arrived as a **screen capture** (1664×1108) rather than the
original export (2500×1667). Same 3:2 framing, but it is upscaled on a wide
display. The original would be better.

Team portraits are no longer needed for launch — the team section is off. They
come back onto the list if that flag is ever turned on.

Nothing here is an engineering task unless the Owner column says _Engineering_.

Two commands report the live state of these gaps:

```bash
pnpm content:gate   # environment + assets (scripts/content-integrity.mjs)
pnpm test           # record-level fields (buildIntegrityReport, via Vitest)
```

**Owners**

| Label             | Who                                                          |
| ----------------- | ------------------------------------------------------------ |
| **Content owner** | Foundry, for factual claims about the firm and its portfolio |
| **Design owner**  | Holder of the brand source archive and image licences        |
| **Legal owner**   | Whoever signs off the privacy notice and entity details      |
| **Engineering**   | This repository and the deployment environment               |

Where a field is somebody's own contact detail, only that person can supply and
approve it — and they may decline. "Not published" is a valid final answer for
every row below; the resolution is a recorded decision, not necessarily a value.

---

## A. Brand and typography assets

| #   | Item                                                                                                                           | What is missing                                                                                                                                                                                                                                                                                                                                                               | Owner         |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| A1  | `foundry-logo-blue.svg`, `foundry-logo-white.svg`, `foundry-logo-black.svg`, `foundry-icon-blue.svg`, `foundry-icon-white.svg` | The five delivered SVG masters are not in this workspace; `public/brand/` holds only a README. `FoundryLogo` renders a missing-asset frame and `pnpm brand:verify:strict` fails the production gate. Copy them in byte-for-byte — they are hash-checked against the Appendix A.1 manifest, so an SVGO pass or any path-data edit is rejected.                                 | Design owner  |
| A2  | Ivar Display licence                                                                                                           | `public/fonts/IvarDisplay-Regular.woff2` is absent, so `--font-display` falls back to metric-adjusted Georgia. The WOFF served from the live Squarespace site identifies the face but is not evidence of a redistribution licence. Confirm the licence, obtain the WOFF2 from the rights holder, and re-measure the four fallback metric overrides in `src/styles/fonts.css`. | Design owner  |
| A3  | `bright.svg`                                                                                                                   | Quarantined in `content-quarantine/`. Bright does not appear on the live portfolio. **Blocking question: is Bright a current portfolio company?** Until answered, the logo stays out of `public/` and Bright is not a company record.                                                                                                                                         | Content owner |

---

## B. Portfolio — the eight companies

All eight records (`src/content/seed/companies.ts`) are
`publicationStatus: "review"` with every field `observed` or `unverified`. None
of them lists publicly, and none gets a `/portfolio/[slug]` detail route.

Observed live order: Empley, Agaton, Grand, Wilgot, Openroll, Newly, Skattio,
Memmo. That ordering is recorded as `sortOrder` and is a **migration
observation**, not an editorial decision — confirm or re-order it.

| #   | Item                                        | What is missing                                                                                                                                                                                                                                                                                                                                                                            | Owner                                  |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| B1  | `publicationStatus` × 8                     | All eight are `"review"`. Nothing publishes until each is `"published"`.                                                                                                                                                                                                                                                                                                                   | Content owner                          |
| B2  | `name` evidence × 8                         | `observed`, and the note explains why that is weak: the live gallery markup has **no company-name field**. Each name was identified from the logo image, the link domain and the filename. Every name needs confirming against the real company, including its exact casing and any legal suffix.                                                                                          | Content owner                          |
| B3  | `websiteUrl` × 8                            | `observed` from the live portfolio links. Confirm each still resolves to the right company: this is the destination a sparse card links to, so a stale URL sends a visitor to the wrong place.                                                                                                                                                                                             | Content owner                          |
| B4  | `logo` × 8                                  | Every logo is an **export reference**: `available: false`, `rightsStatus: "unverified"`, `src` pointing at where the file _should_ land, `sourceUrl` at the Squarespace CDN. Nothing renders and nothing is hotlinked — cards fall back to the typographic name treatment. Each portfolio company must supply a rights-cleared logo (or grant written permission to use the existing one). | Content owner + each portfolio company |
| B5  | **Newly and Skattio have no caption**       | Neither has a `<figcaption>` on the live site, so `tagline` and `shortDescription` are absent and marked `unverified`. **No caption may be invented for them** — not from their websites, not from their logos, not from a plausible summary. Either the company supplies one or those cards stay caption-less.                                                                            | Content owner                          |
| B6  | Captions for the other six                  | Empley, Agaton, Grand, Wilgot, Openroll and Memmo have live captions, seeded verbatim as both `tagline` and `shortDescription` at `observed`. They need editorial approval before they render, and a decision on whether the same sentence should serve both roles.                                                                                                                        | Content owner                          |
| B7  | Grand's caption line break                  | The live source has a hard line break between "AI-assisted hospitality management." and the sentence after it. Preserved verbatim. Decide whether that is two fields (a tagline plus a description) or one string.                                                                                                                                                                         | Content owner                          |
| B8  | Openroll's caption glyph                    | The dash before "bringing" is a non-ASCII character in the live source. Confirm the exact glyph on export — an em dash, en dash and minus sign are three different characters and one of them is a typo.                                                                                                                                                                                   | Content owner                          |
| B9  | Memmo's caption                             | "Study smarter, get better grades." is consistent with the linked study platform observed 2026-08-10, but still needs editorial approval.                                                                                                                                                                                                                                                  | Content owner                          |
| B10 | **Taxonomy: stage, sector, focus** × 8      | The live site publishes **no taxonomy at all**, so none is seeded. Assigning stages or sectors now would be inventing facts. Until at least two companies share an approved value in a group, that filter group does not exist — `getCompanyFacets()` drops any group with fewer than two values, so the portfolio archive currently has no filters.                                       | Content owner                          |
| B11 | **Status** (active / exited / realized) × 8 | Not published live and not seeded. Also feeds the derived "Portfolio companies" stat (E6).                                                                                                                                                                                                                                                                                                 | Content owner                          |
| B12 | **Founders** × 8                            | Not published live. Names, roles and any LinkedIn URLs need each founder's own agreement, not just Foundry's.                                                                                                                                                                                                                                                                              | Content owner + each founder           |
| B13 | **Investment year** × 8                     | Not published live. Confirm what the date means before publishing it (first cheque, closing, announcement).                                                                                                                                                                                                                                                                                | Content owner                          |
| B14 | **Deal lead** × 8                           | Not published live. This is the canonical relation that produces "companies this person led" on a team profile, so it must be set on the company record, never duplicated on the person.                                                                                                                                                                                                   | Content owner                          |
| B15 | `body` and `whyWeInvested` × 8              | No long description exists anywhere in the source material. A `/portfolio/[slug]` detail page requires an approved `shortDescription` **and** a non-empty approved `body` — without both, the card correctly links straight to the company's own site instead. Deliberately thin pages are not created.                                                                                    | Content owner                          |
| B16 | `headquarters` × 8                          | Not published live.                                                                                                                                                                                                                                                                                                                                                                        | Content owner                          |
| B17 | "Natively" and "Agaton Group"               | Both appear in the Claude prototype's fallback list and neither is on the live portfolio. "Agaton Group" must **not** be merged automatically with the live entry "Agaton" — they may be different entities. Both stay quarantined.                                                                                                                                                        | Content owner                          |

---

## C. Team and contact

Two records in `src/content/seed/team.ts`, both `publicationStatus: "review"`.

| #   | Item                              | What is missing                                                                                                                                                                                                                                                   | Owner                          |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| C1  | `publicationStatus` × 2           | Both `"review"`.                                                                                                                                                                                                                                                  | Content owner                  |
| C2  | Names and roles                   | "Anders Nygren — Partner" and "Julia Siljehag — Community Manager" are `observed` from the live home page. Both need approval, including whether those role titles are current.                                                                                   | Anders Nygren / Julia Siljehag |
| C3  | **Julia Siljehag's phone number** | **Not published on the live site, and must not be invented.** There is no source for it in any audit material. Only Julia can supply one, and choosing not to publish a personal number is a perfectly good answer — the contact block simply renders without it. | Julia Siljehag                 |
| C4  | Anders Nygren's phone number      | `+46 733 460006` is `observed` — the live site renders it as plain text, not a `tel:` link. The rebuild makes verified values semantically clickable, so approving it means agreeing it becomes a tap-to-call link on mobile.                                     | Anders Nygren                  |
| C5  | Both email addresses              | `anders.nygren@foundryventures.ai` and `julia.siljehag@foundryventures.ai` are `observed`, again as plain text on the live site. Approving them means they become `mailto:` links and, for Anders, the fallback contact when `/pitch` is not production-ready.    | Anders Nygren / Julia Siljehag |
| C6  | Portraits × 2                     | No portrait is published on the live site. Needs a photograph, the photographer's licence and the subject's consent.                                                                                                                                              | Content owner + Design owner   |
| C7  | Short bios × 2                    | None exists. The team index shows name and role only until one does.                                                                                                                                                                                              | Anders Nygren / Julia Siljehag |
| C8  | Long bios × 2                     | None exists. A `/team/[slug]` profile page requires an approved, non-empty `longBio` — without one the person stays as a section on `/team#slug` and no thin profile page is generated.                                                                           | Anders Nygren / Julia Siljehag |
| C9  | Areas of expertise × 2            | Not published live.                                                                                                                                                                                                                                               | Anders Nygren / Julia Siljehag |
| C10 | Personal LinkedIn URLs × 2        | Neither is published on the live site.                                                                                                                                                                                                                            | Anders Nygren / Julia Siljehag |
| C11 | Is the team complete?             | The live site names exactly these two people. Confirm nobody is missing before `/team` is published as the firm's team page.                                                                                                                                      | Content owner                  |

---

## D. Legal entity and the privacy notice

| #   | Item                                   | What is missing                                                                                                                                                                                                                                                                                         | Owner                       |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| D1  | **Legal entity name**                  | `legalName` is `undefined`, `unverified`. No legal name is published on the live site. Required by the privacy notice, the footer and the `Organization` structured data.                                                                                                                               | Legal owner                 |
| D2  | **Registered address**                 | `address` is `undefined`, `unverified`. No physical address appears anywhere in the audit material.                                                                                                                                                                                                     | Legal owner                 |
| D3  | **Organisation number**                | `organizationNumber` is `undefined`, `unverified`.                                                                                                                                                                                                                                                      | Legal owner                 |
| D4  | Privacy notice — controller identity   | `src/content/seed/legal.ts` states plainly that entity details and postal address are "pending confirmation by our legal owner". That sentence must be replaced with real details before the page is published; it is honest as a draft and unacceptable as a published notice.                         | Legal owner                 |
| D5  | Privacy notice — retention period      | 730 days is asserted in the notice _and_ implemented as the `PITCH_RETENTION_DAYS` default, so the code and the text currently agree. The number itself is still "subject to confirmation". If it changes, change both — a retention promise the purge job does not implement is worse than no promise. | Legal owner + Engineering   |
| D6  | Privacy notice — supervisory authority | The notice names Integritetsskyddsmyndigheten (IMY) as the Swedish authority. That is correct **if** the controller is established in Sweden, which depends on D1. Confirm alongside the entity.                                                                                                        | Legal owner                 |
| D7  | Privacy notice — contact address       | Data-subject requests are currently directed to `anders.nygren@foundryventures.ai`, a personal address that is itself only `observed` (C5). A role address (E4) would be more durable, but do not invent one.                                                                                           | Legal owner + Content owner |
| D8  | Privacy notice — `lastUpdated`         | Set to `2026-08-10`, the snapshot date. Replace with the real publication date at sign-off.                                                                                                                                                                                                             | Legal owner                 |
| D9  | Privacy notice — approval              | `seo.approvalStatus` is `"unapproved"`, which keeps the page out of production.                                                                                                                                                                                                                         | Legal owner                 |
| D10 | Cookie claim                           | The notice states the site sets no advertising or analytics cookies and loads no third-party marketing scripts. That matches the current code and the CSP. Re-verify at sign-off and re-verify again if any analytics is ever added.                                                                    | Legal owner + Engineering   |

---

## E. Site-wide facts

| #   | Item                                     | What is missing                                                                                                                                                                                                                                                                                                                                                                                                                                            | Owner                       |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| E1  | **Brand-name casing**                    | `displayBrandName` is `"Foundry ventures"` (lowercase v — the live wordmark and `<title>`), `seoBrandName` is `"Foundry Ventures"`, and neither is approved. One of these is a deliberate typographic choice and the other is a typo; the source material does not say which. Not normalised on purpose ([D-011](./decisions.md#d-011)).                                                                                                                   | Content owner               |
| E2  | **Ticket range — €50k–€300k**            | Comes **only from the Claude prototype**, which is a layout study and explicitly not a source of fact. Never observed on the live site. `unverified`, so it cannot render. Confirm the real range — or that Foundry does not publish one.                                                                                                                                                                                                                  | Content owner               |
| E3  | **Sweet spot — €200k**                   | Same provenance and the same blocker as E2: prototype only, never live-verified.                                                                                                                                                                                                                                                                                                                                                                           | Content owner               |
| E4  | **General inbox**                        | `contactEmail` is `undefined`. **No general inbox exists in the audit material and none is invented.** All contact currently routes through named people. If Foundry wants a `hello@`/`info@` address it must be created and confirmed, not assumed.                                                                                                                                                                                                       | Content owner               |
| E5  | General phone number                     | `contactPhone` is `undefined`, `unverified`.                                                                                                                                                                                                                                                                                                                                                                                                               | Content owner               |
| E6  | Investment criteria — the four live rows | Stage (Pre-seed), Industry (Agnostic), Technology focus (AI / services-as-a-software) and Geography (Nordics) are all `observed` and need approval. The technology row carries an explicit note: **the live site mixes "services-as-a-software" and "SaaS 2.0"** and the exact terminology must be chosen. "Industry: Agnostic" and "Technology focus" are deliberately kept as two rows and must not be collapsed into an ambiguous "Sector: Generalist". | Content owner               |
| E7  | The "Portfolio companies" stat           | Its value is **derived** from published company records, so it is honest by construction — but it is meaningless until section B is resolved, and its evidence is `unverified` accordingly. The `stats` flag is off.                                                                                                                                                                                                                                       | Content owner               |
| E8  | **LinkedIn company URL**                 | `https://www.linkedin.com/company/foundry-ventures-ai/` is present but **not confirmed** in the audit material. Verify the canonical HTTPS URL before publishing — a wrong company URL in the footer and in structured data is a durable error. It appears twice (as `linkedinUrl` and in `socialLinks`) and both must match.                                                                                                                              | Content owner               |
| E9  | Careers URL                              | `careersUrl` is `undefined`, `unverified`. No careers destination is configured; the link simply does not render.                                                                                                                                                                                                                                                                                                                                          | Content owner               |
| E10 | Brand statement                          | "Foundry backs Nordic pre-seed founders building AI-native companies." is `proposed` and `unapproved` — new copy, not live copy.                                                                                                                                                                                                                                                                                                                           | Content owner               |
| E11 | Default SEO title and description        | `defaultSeoTitle` and `defaultSeoDescription` are migrated live values used as the metadata fallback for every route. Note for Engineering: unlike other site-settings fields, these two have **no** entry in `SiteSettingsEvidenceField`, so they render in production without an approval check. Approve the wording explicitly, and see the note in the README about whether they should be gated.                                                      | Content owner + Engineering |
| E12 | Canonical origin                         | `https://www.foundryventures.ai` is hard-coded as the canonical origin in both `site-settings.ts` and `middleware.ts`. Confirm this is the final production host, and that DNS and TLS cover both the apex and `www`, before `FOUNDRY_ENFORCE_CANONICAL_HOST=1` is set.                                                                                                                                                                                    | Content owner + Engineering |

---

## F3. Where the enhancement brief reverses your own instructions

The 2026-08-12 rebuild was built to the website enhancement brief, on the
instruction to "build according to plan". On six points that plan reverses
something you told me directly in the preceding days. All six are implemented as
the brief specifies; each row names the one place to change to put it back.

| # | Your instruction | What the brief says | Where to revert |
|---|---|---|---|
| 1 | "Foundry is not a venture fund" (11 Aug) | Delete it — category confusion that undercuts a fund actively raising (§6.5) | `seed/home.ts`, hero paragraph |
| 2 | Position as an "industrialised super angel"; "industrial angel" in the thesis | Remove from public category copy; may survive as internal shorthand (§6.5) | `seed/home.ts`, `vision.paragraphs` |
| 3 | "We only invest in AI. We only invest in teams." | "We invest in teams **first**" — "teams only" reads as not caring about the market (§6.4) | `seed/home.ts`, `hero.heading` |
| 4 | Less interested in PMF and moats | Reframe as epistemic humility, not absent diligence (§6.5) | `seed/home.ts`, `vision.paragraphs` |
| 5 | "Remove Portfolio from the navigation" (11 Aug) | The header must reach Portfolio and Fund without a hero CTA or the footer (§2.8, §7.2) | `seed/site-settings.ts`, `navigation` |
| 6 | "Make the ocean motion way more on scroll and cursor"; parallax on the stills | No cursor-following distortion; parallax no greater than a few percent; one continuous motion source (§2.5, §10.4) | `AmbientOcean.tsx`, `SCROLL_TRAVEL` |

Numbers 3 and 5 are the two most likely to matter to you. The brief itself offers
an escape hatch on 3 — §6.4 says the current headline may be kept if it is
non-negotiable, provided the support line identifies Foundry as a fund. That is
already true, so reverting the headline alone is safe.

Also removed on the brief's instruction, and worth knowing: the silhouette image
(§2.3 called it semantically weak), the two-image composition in the offering
section (§8.6), and the `/pitch`, `/insights`, `/network`, `/team` and `/about`
routes with their components, API and tests (§7.1, §17). All are recoverable from
git history at commit `58dbcd0`.

## F2. Copy drift introduced 2026-08-12

The owner supplied four new "What you get" items. They are the strongest-provenance
copy on the site (`ownerWrote`), but they no longer agree with the hero paragraph
and the SEO description, which were written on 2026-08-11:

| Where | Says | Conflicts with |
|---|---|---|
| Hero paragraph 2 | "we introduce you to customers" | Item 02, which now also promises **talent and partners** |
| Hero paragraph 2 | "we take **legal** and operations off your desk" | Item 03, which is now operations only — legal is gone |
| SEO description | "capital and customer introductions" | Item 02, as above |

Neither is a factual error, and nothing renders wrongly. But the hero and the
offering list are read within about ten seconds of each other, so the narrower
hero undersells 02 while over-promising legal. Resolve by either widening the
hero to "customers, talent and partners" and dropping legal, or narrowing the
offering back. One decision, three strings.

Two strings were corrected rather than taken verbatim; both carry a
`normalizationNote` naming the change:
- 03 was supplied as "do´s and donuts" → read as a typo for "don’ts". **Revert if the pun was intended.**
- 04 "AI native" → "AI-native", per the §25.2 house style.

## F. Editorial copy awaiting approval

Every string in `src/content/seed/home.ts` and `src/content/seed/about.ts` is
`unapproved`, whether it is `migrated-verbatim` (word-for-word live copy) or
`proposed` (new copy from the prototype or the buildspec). The home page is also
`publicationStatus: "review"`, and About is `"draft"`.

Approving migrated copy is a real decision, not a formality — it means "this
sentence, exactly as the old site wrote it, is what we want to say now". These
are the specific wording questions visible in the seed:

| #   | Item                                                         | What needs deciding                                                                                                                                                                                                                                                                                      | Owner         |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| F1  | "Many of the **worlds** challenges" (Vision)                 | Missing apostrophe in the live copy. Verbatim in the seed. Fix to "world's", or keep.                                                                                                                                                                                                                    | Content owner |
| F2  | "AI **native** products" vs "AI-**native** operating models" | Both spellings appear on the same page. Pick one.                                                                                                                                                                                                                                                        | Content owner |
| F3  | "**early stage** founders" vs "**Early-Stage** Investor"     | The body copy and the meta description disagree.                                                                                                                                                                                                                                                         | Content owner |
| F4  | "services-as-a-software" vs "SaaS 2.0"                       | The hero and vision say one, the meta description says the other. Same question as E6.                                                                                                                                                                                                                   | Content owner |
| F5  | Hero paragraph 2 whitespace                                  | The live source has two spaces between "for" and "cross"; collapsed to one. Recorded as a `normalizationNote` — whitespace only, wording unchanged. Confirm.                                                                                                                                             | Content owner |
| F6  | Apostrophe style                                             | The seed contains both typographic (`tomorrow's`) and straight (`Tomorrow's`) apostrophes, inherited from the two sources. Pick one convention.                                                                                                                                                          | Content owner |
| F7  | Proposed home copy                                           | The hero eyebrow "Pre-seed · Nordics", the CTA labels ("Submit your pitch", "Explore our portfolio", "Email Anders", "See full portfolio"), the featured-portfolio heading "The bold ones we stand behind" and the four optional section headings are all **new copy that has never appeared publicly**. | Content owner |
| F8  | The whole About page                                         | Drafted from live Foundry voice (§13) but entirely unapproved, and behind a flag that is off. Beliefs, "how we work", "what we look for" and the process steps all need review.                                                                                                                          | Content owner |

---

## G. Image rights

| #   | Item                                    | What is missing                                                                                                                                                                                                                                                    | Owner         |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| G1  | **Ocean / motion-blur hero photograph** | Live source is a Squarespace-hosted `pexels-matthardy-1533720_motion_blur.jpg` (2500×1667, focal 50%/50%). Rights `unverified`, `available: false` — never hotlinked. Confirm the Pexels licence terms and export a rights-cleared original, or replace the image. | Design owner  |
| G2  | **Architecture image** (offering)       | Squarespace-hosted `visualelectric-…png`, 1024×1024, focal 0.8%/16.8%. AI-generated via Visual Electric; confirm the generation terms and commercial usage rights.                                                                                                 | Design owner  |
| G3  | **Silhouette image** (offering)         | Squarespace-hosted `visualelectric-…png`, 896×1280, centred. Same question as G2.                                                                                                                                                                                  | Design owner  |
| G4  | ~~Placeholder artwork in use~~          | **Resolved 2026-08-11.** The owner supplied the real photography and the three Foundry-authored stand-ins were deleted. `pnpm content:gate` now passes this check.                                                                                                 | —             |
| G5  | The eight portfolio logos               | See B4. Export references only; each needs a rights-cleared file from the company.                                                                                                                                                                                 | Content owner |
| G6  | Duplicate ocean asset                   | The live site serves the same ocean bytes under two asset IDs. The rebuild deduplicates to one. Confirm no second, genuinely different image was intended.                                                                                                         | Design owner  |

---

## H. Feature-flagged surfaces

All six flags in `SEED_SITE_SETTINGS.featureFlags` are `false`
([D-005](./decisions.md#d-005)). Each 404s in production and is absent from
navigation and the sitemap.

| #   | Flag                 | What has to exist first                                                                                                                                                                                                                          | Owner         |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| H1  | `investmentCriteria` | At least the four live-observed rows approved (E6).                                                                                                                                                                                              | Content owner |
| H2  | `insights`           | `SEED_POSTS` is **empty** — the snapshot contains no Foundry articles or portfolio news. At least one approved, published post with a date. The home "Latest Insights" section stays hidden entirely rather than rendering a public empty state. | Content owner |
| H3  | `about`              | F8, plus the `/offering` redirect target decision ([D-012](./decisions.md#d-012)).                                                                                                                                                               | Content owner |
| H4  | `network`            | `SEED_NETWORK_PEOPLE` is **empty**. Publish only if Foundry has a real, approved network to show — operating partners, advisors or angels who have each agreed to be listed.                                                                     | Content owner |
| H5  | `stats`              | E7, which depends on section B.                                                                                                                                                                                                                  | Content owner |
| H6  | `testimonials`       | `SEED_TESTIMONIALS` is **empty**. A testimonial needs a real founder quote **and** recorded consent. Consent is tracked per record and a `revoked` testimonial disappears everywhere immediately, preview included.                              | Content owner |

---

## I. Deployment configuration

Not content, but on the same critical path — `pnpm content:gate` fails without
these. Full descriptions are in `.env.example`.

| #   | Item                                                                                                         | What is missing                                                                                                                                                                  | Owner                       |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| I1  | `PITCH_RECIPIENTS`, `PITCH_ESCALATION_EMAIL`, `PITCH_FROM_EMAIL`, `RESEND_API_KEY`, `PITCH_FINGERPRINT_SALT` | Until all five are set, production `/pitch` renders the contact fallback instead of the form. Deciding _who_ receives pitches is a Foundry decision; wiring it is Engineering's. | Content owner + Engineering |
| I2  | Durable pitch storage                                                                                        | The filesystem store is the dev/staging driver and is rejected on a serverless host, where the filesystem does not survive the request.                                          | Engineering                 |
| I3  | `PITCH_MAINTENANCE_SECRET` + a scheduled call                                                                | Without the cron, the retention purge (D5) never runs and failed notifications are never retried.                                                                                | Engineering                 |
| I4  | `DRAFT_MODE_SECRET`                                                                                          | Without it `/api/draft/enable` answers 404 and no one can preview unapproved content — which is how most of this list gets reviewed.                                             | Engineering                 |
| I5  | `SANITY_WEBHOOK_SECRET`                                                                                      | Only relevant once Sanity is connected; without it published edits never invalidate the static pages.                                                                            | Engineering                 |
| I6  | `FOUNDRY_ENFORCE_CANONICAL_HOST=1`                                                                           | Depends on E12.                                                                                                                                                                  | Engineering                 |

---

## How to approve a field

Approval is a deliberate act with a named approver and a date. There is no
default for either argument, on purpose.

### A fact (`FieldEvidence`)

Replace the `observed(...)` or `unverified(...)` call with `ownerApproved(...)`
from `src/content/seed/evidence.ts`:

```ts
import { ownerApproved, FOUNDRY_PORTFOLIO_SOURCE } from "./evidence";

fieldEvidence: {
  name: ownerApproved(
    "Anders Nygren",              // who approved it — a real person
    "2026-08-14",                 // when, ISO date
    [
      FOUNDRY_PORTFOLIO_SOURCE,   // the evidence behind the claim…
      {
        label: "Confirmed by Empley in writing",
        observedAt: "2026-08-14",
        note: "Email thread, company name and website confirmed",
      },
    ],
  ),
  // …every other field stays as it was. Approval is per field, so a record can
  // publish its name while its founders remain unverified.
}
```

The `sources` array is not decoration — it is what makes the approval auditable
in six months. Record where the fact came from, not just that someone said yes.

### A string (`EditorialText`)

`migratedVerbatim()` and `proposed()` always produce `approvalStatus:
"unapproved"`. Approving means overriding it, with the same audit trail:

```ts
heading: {
  ...migratedVerbatim("Partnering with visionary AI founders …", { sourceUrl: HOME_URL }),
  approvalStatus: "approved",
  approvedBy: "Anders Nygren",
  approvedAt: "2026-08-14",
},
```

`origin` never changes: copy that came from the live site stays
`migrated-verbatim` forever, even after it is approved and even if it is later
edited. That field records provenance, not status.

### An image (`ImageAsset`)

An image needs both gates open — `available: true` (the binary exists in this
workspace) and `rightsStatus: "approved"` — plus a named `rightsOwner` and no
`isPlaceholder` flag.

### A record

Fields are necessary but not sufficient. Also set `publicationStatus:
"published"` on the record, and for a testimonial `consentStatus: "granted"`.
See [`editor-guide.md`](./editor-guide.md) for exactly which combination makes
each record type appear.

### Once Sanity is connected

The same fields exist as CMS fields and the same policy applies — approval moves
into the Studio and stops being a code change. Until then, every approval above
is a pull request, which has the side benefit of making each one reviewable.
