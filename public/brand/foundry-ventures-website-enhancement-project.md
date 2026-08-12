# Foundry Ventures website enhancement and rebuild project

**Status:** Implementation brief for Claude Code  
**Prepared:** 12 August 2026  
**Live site audited:** <https://foundryventures-production.up.railway.app/>  
**Benchmark set:** Ten leading global pre-seed and seed venture websites  
**Core mandate:** Make Foundry feel world-class to founders and LPs without turning the website into a content platform, application funnel, or feature catalogue.

---

## 0. How Claude Code should use this document

This is a rebuild directive, not an invitation to add features.

Before changing code:

1. Read this file completely.
2. Inspect the actual repository, framework, routing, content source, deployment configuration, and current uncommitted changes.
3. Preserve the existing stack and CMS/content approach unless there is a concrete technical reason not to. The live site appears to be a Next.js application, but the repository is the source of truth.
4. Inventory all existing brand, image, video, font, portfolio, legal, and metadata assets before creating replacements.
5. Capture baseline screenshots at the QA viewports listed in this document.
6. Do not invent fund facts, performance data, team biographies, founder quotes, LP names, regulatory language, legal entities, investment dates, or portfolio outcomes. Missing approved content must result in a clearly tracked content requirement, not fabricated production copy.
7. Never publish placeholders, draft legal language, lorem ipsum, dead routes, or example metrics.
8. Implement the recommended direction as one coherent system. Do not put multiple visual or copy concepts into production for the user to choose between.

The design test throughout the rebuild is:

> **Boutique and inevitable on arrival. Institutional on inspection.**

The site must feel more considered, not larger.

---

## 1. Executive verdict

The current Foundry site has a strong brand hypothesis and a good technical foundation, but it does not yet feel like the public face of a significantly scaled fund.

Its best asset is the clarity of its point of view. A visitor immediately understands that Foundry is focused on Nordic AI teams, writes fixed early cheques, invests frequently, and values the founding team above false precision. The deep-blue ocean field, large serif headlines, direct language, and absence of a pitch-upload funnel already separate it from many generic VC sites.

Its central weakness is not a lack of content or features. It is a gap between **conviction** and **institutional completeness**.

For a founder, the site largely works: it is direct, specific, and human. For an LP, the same site currently raises unanswered questions. The public team is almost absent. The operating model is asserted more than evidenced. The copy says “Foundry is not a venture fund” and later calls the model an “industrial angel,” which directly undercuts the scaled-fund ambition. The portfolio is credible but presented as a uniform card grid rather than evidence of judgment. Several production-trust details are visibly unfinished beneath the surface.

### The strategic move

Do not add a blog, a resources hub, a newsletter, a pitch form, a founder portal, a data-room feature, or multiple audience journeys.

Instead:

- Compress the homepage from roughly 783 main-content words to approximately 350–450 words, excluding portfolio names and legal footer text.
- Keep one strong hero idea and make every subsequent section prove it.
- Move portfolio proof into the first two scrolls.
- Replace broad claims with a few concrete operating facts.
- Add a quiet, minimal fund page that gives LPs institutional confidence without making the public experience look like fundraising collateral.
- Show the person or people who make the investment decision.
- Use one real founder proof point, if an approved and specific one is available.
- Make the ocean field, typography, spacing, image art direction, and motion feel authored down to the last pixel.
- Fix the font, metadata, legal, staging, and migration defects before treating the site as launch-ready.

### Keep, elevate, remove

| Keep | Elevate | Remove or reframe |
|---|---|---|
| AI-only focus | The “team-first” thesis | “Foundry is not a venture fund” |
| Nordic focus | Fixed ticket and monthly cadence | “Industrial angel” as public category language |
| Direct email rather than an application form | Portfolio as proof of taste and access | Claims that market or defensibility work is irrelevant |
| Deep Foundry blue and black/white discipline | Real team identity and fund structure | Long, repeated explanations of the thesis |
| Ambient ocean motion | One signature interaction and stronger art direction | Anonymous moodboard imagery without a clear relationship to Foundry |
| Editorial serif plus rational sans | Correctly licensed and loaded typography | Dead pitch-form references and links |
| No advertising or marketing trackers | Quiet legal and institutional signals | Generic VC vocabulary and feature creep |

### Current-site scorecard

These scores are qualitative and calibrated against the benchmark set in this report, not against generic small-fund websites.

| Dimension | Current score | Read |
|---|---:|---|
| Visual craft | 8.0/10 | Strong palette and hero atmosphere; some sections still feel like a polished template rather than a proprietary system. |
| Brand distinctiveness | 8.5/10 | AI-only, team-first, fixed-ticket positioning is memorable. Ocean/serif execution can become more ownable. |
| Founder relevance | 8.8/10 | Direct criteria, no deck requirement, direct partner contact, and real portfolio proof. |
| LP confidence | 5.8/10 | Insufficient team/fund evidence; public language actively denies the fund category; legal details are incomplete. |
| Content restraint | 6.9/10 | No blog or feature sprawl, but the homepage is still long and repetitive for the amount of information conveyed. |
| Motion and interaction craft | 7.6/10 | Ambient ocean, surface-aware header, reveals, and card states are sound; interaction is not yet a signature. |
| Accessibility foundation | 9.4/10 | Semantic structure, focus styles, reduced-motion rules, and Lighthouse accessibility are strong. Continuous video still needs a user pause treatment. |
| Technical/launch hygiene | 7.4/10 | Good security headers, SEO structure, and desktop performance; font, link preview, privacy, staging, and mobile main-thread defects remain. |
| Overall | **7.6/10** | A compelling early version that needs editorial compression and institutional finishing more than expansion. |

---

## 2. Detailed audit of the live Foundry site

### 2.1 Audit scope

The following public routes and states were reviewed:

- `/` — homepage
- `/portfolio` — portfolio page
- `/privacy` — privacy notice
- Custom 404 state and referenced `/pitch` route
- Desktop at 1440 × 1000 and common browser dimensions
- Mobile around 390 × 844
- Page structure, computed typography, motion, media, responsive behavior, metadata, headers, console state, sitemap, robots, and lab performance

The site was reviewed visually in the live in-app browser, from rendered DOM and computed styles, and through direct HTTP and Lighthouse checks.

### 2.2 What the homepage currently communicates in ten seconds

A founder can answer most of the right questions quickly:

- What: Nordic AI investing
- Ticket: €100k or €200k
- Pace: one to three investments per month
- Decision lens: the team
- Help: customer introductions, operations, and community
- Contact: direct email to Anders

An LP cannot yet answer several equally important questions:

- Who, beyond one name in the final section, owns the decision and manages the strategy?
- Why is this investment cadence repeatable rather than opportunistic angel activity?
- What makes the support model defensible or operationally real?
- Is this actually a fund, a syndicate, an angel vehicle, or a brand around personal investing?
- What entity, governance, or institutional infrastructure sits behind the site?
- What evidence demonstrates Foundry’s judgment at entry, not simply the existence of a portfolio?

The rebuild should preserve the founder clarity and answer the LP questions quietly within one or two clicks.

### 2.3 Visual design

#### Hero

The current hero is the strongest section.

- A full-viewport deep-blue ocean field creates atmosphere without resorting to generic AI particles, gradients, circuitry, or 3D globes.
- The white Foundry wordmark has confident scale on desktop.
- A large editorial serif headline contrasts well with the rational sans-serif body.
- The copy is left-aligned with significant negative space, producing a premium rather than conversion-led feeling.
- The direct portfolio CTA is appropriately simple.

Weaknesses:

- The hero contains two long support paragraphs. The core proposition is understood before either paragraph ends.
- The line “Foundry is not a venture fund” is memorable but strategically damaging for a fund that is scaling.
- At common laptop heights, the hero uses a great deal of vertical space before revealing proof.
- On mobile, the hero is clear but text-heavy. The visitor gets almost an entire screen of body copy after the headline.
- The ocean is beautiful but only loosely connected to the investment thesis. It currently reads as premium atmosphere rather than a purposeful Foundry brand device.

#### Typography

The intended display typeface is `Ivar Display`, with `Helvetica Neue`/Helvetica/Arial for body text. The combination is appropriate: human judgment in the serif, operating precision in the sans.

However, `/fonts/IvarDisplay-Regular.woff2` currently returns HTTP 404. The display face silently falls back to a Georgia/Times-like face. This changes line breaks, proportions, brand recognition, and the apparent finish of every major heading. It also produces a console error and is the reason the lab best-practices score is not perfect.

This is a P0 defect. Do not tune heading sizes or line breaks until the production font decision is resolved.

#### Color

The core palette is sound:

- Foundry blue around `#00308F`
- Deep navy around `#001848`
- Black
- White
- Off-white around `#F5F5F4`
- Muted graphite around `#595957`

The main opportunity is consistency. The current experience alternates navy, white, off-white, and black well, but some accents and image colors feel introduced for a section rather than derived from a tightly controlled system.

#### Layout and rhythm

The 24-column desktop grid, wide gutters, fine rules, and sticky/surface-aware header create a disciplined foundation. The thesis split is especially effective: a large statement on the left and supporting copy on the right.

The overall page is too long for its information density:

- Desktop rendered height at 1440 px wide: approximately 6,749 px
- Mobile rendered height around 390 px wide: approximately 9,218 px
- Main-content word count: approximately 783 words
- Homepage portfolio cards: nine

The “What you get” section consumes roughly 1,576 desktop pixels because the four claims and two editorial images are given a full visual chapter. The portfolio then consumes roughly another 1,796 pixels. The scroll feels elegant at first but eventually becomes more extensive than the brand promise requires.

#### Imagery

The brutalist architecture image has some relationship to “Foundry”: material, constructed, engineered, Nordic. The anonymous silhouette image is stylish but semantically weak. Together they read more like an art-direction moodboard than evidence of Foundry’s world.

The rebuild should use fewer images with stronger provenance:

1. The ocean field as the signature atmospheric asset.
2. One material/industrial image that genuinely relates to the brand system.
3. One real founder/community image, if excellent photography exists.
4. One real portrait of each public decision-maker.

If those assets are unavailable, use less imagery. Do not fill gaps with generic conference, handshake, city, laptop, or synthetic “AI” photography.

### 2.4 Brand and copy

#### What is working

- “AI only · Teams only · Nordics” is a strong three-part filter.
- “We only invest in AI. We only invest in teams.” is direct and unusual.
- Fixed tickets and monthly cadence communicate a real operating model.
- “Tell us who you are building with” is a better opening than “upload your deck.”
- “In AI, the team is the only thing that compounds” is the best thesis line on the page.
- The language is more opinionated than the average VC website.

#### What is not working

- “Foundry is not a venture fund” creates category confusion and undermines LP confidence.
- “Industrial angel” makes the model sound personal, small, and non-institutional at the exact moment the business is scaling.
- “We do not size your market,” “we do not ask for a competitive matrix,” and dismissals of early defensibility may appeal to founders, but collectively they can imply a lack of investment discipline. The intended point is that team-learning speed is the most durable early signal—not that markets and competition are irrelevant.
- Several concepts repeat across the hero, criteria, thesis, support section, contact section, and footer.
- Portfolio descriptions are accurate but too long for the homepage. Many run to 45–60 words.
- “What you get” is category-standard wording. It makes Foundry sound like a package of services.

### 2.5 Features and interactions

The site correctly avoids product-like feature sprawl. It has:

- A surface-aware fixed header
- A decorative autoplay ocean video with poster and responsive source
- Scroll-based reveal transitions
- Portfolio card hover/focus states
- Direct external company links
- Direct email and telephone links
- Responsive layout and header-surface behavior; route navigation itself is absent/incomplete
- Reduced-motion CSS handling

This is enough. The next version should not add more categories of interaction. It should make one interaction feel signature and refine the rest.

Recommended signature: treat the ocean as a **conviction field**—a single, slow, continuous visual current that appears in the hero and returns once, very subtly, at the final contact section. All other motion should be brief, responsive, and non-continuous.

The ocean must have:

- A static poster for reduced-motion and data-saving users
- A visible or readily discoverable pause/resume control for continuous motion
- No sound
- No scroll-jacking
- No cursor-following distortion
- No dependency on JavaScript for the hero copy to appear

### 2.6 Portfolio presentation

Strengths:

- Nine real companies create meaningful proof.
- Logos are optically normalized into consistent frames.
- External-link states and accessible labels are present.
- The dedicated portfolio page is simple and does not overcomplicate a small portfolio with filters.

Weaknesses:

- The homepage shows the entire grid, making it almost redundant with `/portfolio`.
- Uniform cards present companies as inventory rather than a curated expression of taste.
- Long descriptions create a corporate directory feeling.
- There is no entry-point evidence: what Foundry saw, when it invested, or why the team fit the thesis.
- No founder face, founding artifact, or precise relationship proof humanizes the portfolio.

The homepage should show six selected companies at most. The full page can show all. If three approved “what we saw at entry” facts are available, use them as short progressive proof; otherwise do not fabricate them.

### 2.7 Team and institutional confidence

The current public experience contains Anders’s name, role, email, and telephone number in the closing section and footer. It does not provide a portrait, biography, operating history, investment track record, or explanation of decision ownership. No other current team member is visible on the live site.

This is the single largest audience gap.

For founders, a named human reduces friction. For LPs, a visible decision-maker and an accurate description of fund infrastructure are basic diligence signals. The solution does not require a large team directory. A concise, well-photographed partner section and a minimal fund page are sufficient.

### 2.8 Responsive behavior

The site responds cleanly around 390 px:

- No horizontal overflow was observed.
- The hero copy remains legible.
- The criteria grid becomes a clear two-column layout.
- Portfolio cards stack correctly.
- Touch targets and focus foundations are generally sound.

Opportunities:

- Increase the optical presence of the mobile logo slightly; it currently feels closer to a utility mark than the main brand.
- Cut mobile hero body copy by roughly half.
- Ensure the header gives access to Portfolio and Fund without relying on a hero CTA or footer.
- Reduce long vertical gaps once sections stack.
- Preserve editorial line breaks intentionally at 320, 375, and 390 px rather than relying only on fluid type.

### 2.9 Technical, accessibility, performance, and SEO baseline

#### Strong foundations

- Next.js server rendering and prerendering are in place.
- Security headers are unusually good for a small fund site: CSP, `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, and restrictive permissions policy.
- No third-party advertising, marketing, or analytics requests were observed.
- Semantic landmarks, headings, skip link, accessible external-link labels, focus-visible styles, and reduced-motion rules are present.
- `robots.txt` and `sitemap.xml` exist.
- Canonical URLs, Open Graph tags, Twitter card tags, an SVG favicon, and JSON-LD exist in the implementation.
- Repeated mobile Lighthouse runs scored 100 for accessibility and SEO; desktop performance scored 100 in a lab run.

#### Lab measurements from repeated mobile Lighthouse runs

These are point-in-time lab numbers, not field Core Web Vitals. The Railway preview varied materially between runs, so ranges are more honest than a single flattering score:

| Metric | Result |
|---|---:|
| Performance score | 82–93 |
| Accessibility score | 100 |
| Best practices score | 96 |
| SEO score | 100 |
| First Contentful Paint | 1.1 s |
| Largest Contentful Paint | 2.3–2.6 s |
| Speed Index | approximately 1.1–4.4 s |
| Total Blocking Time | 130–540 ms |
| Cumulative Layout Shift | 0 |
| Transferred page weight | approximately 381 KiB |

The largest mobile transfers were the ocean poster, a main JavaScript chunk, the mobile WebM, and application JavaScript. The site is not heavy overall, but the slow run shows too much main-thread variance for a page with almost no interactive product behavior. Treat the better run as evidence that the page can be fast, not as permission to skip bundle and hydration work.

#### Launch-critical defects

1. **Display font 404:** `/fonts/IvarDisplay-Regular.woff2` fails on every route. The intended typeface is not rendering.
2. **Broken production social image:** metadata on staging points to `https://www.foundryventures.ai/opengraph-image`, which currently returns 404 on the canonical production domain. Shared links can have broken previews.
3. **Broken structured-data logo:** JSON-LD references the canonical-domain brand asset while the old production site does not serve the new path.
4. **Draft privacy notice is public:** `/privacy` is indexable and sitemapped but says registered entity details and address are “pending confirmation” and will be added “before this notice is published.” It is already published.
5. **Privacy notice describes a non-existent pitch flow:** it documents pitch-form fields, deck/video links, consent, notifications, and a 730-day retention policy, while `/pitch` returns 404 and the current public product intentionally has no pitch form.
6. **Custom 404 links to `/pitch`:** the 404 page offers “Pitch us,” leading to another 404 and contradicting the site strategy.
7. **Staging is indexable:** the Railway production-preview host returns `index, follow`. Canonicals reduce some duplication risk, but an unfinished staging environment with draft legal copy should be `noindex, nofollow` and excluded from production sitemaps.
8. **SEO migration is incomplete:** the current Squarespace production site exposes `/home`, `/offering`, `/instructors`, `/pricing`, and `/portfolio`. The new site only has `/`, `/portfolio`, and `/privacy`. A cutover without redirects will preserve irrelevant template URLs or create dead search results.

These are P0 items and must be fixed before aesthetic polish is considered complete.

---

## 3. Benchmark methodology and selection

“Top ten” is not an objective league table. The following set was selected because it represents globally respected or highly relevant pre-seed/seed brands and offers a useful range of design archetypes:

1. [First Round](https://www.firstround.com/)
2. [Seedcamp](https://seedcamp.com/)
3. [Pear VC](https://pear.vc/)
4. [NFX](https://www.nfx.com/)
5. [Precursor Ventures](https://precursorvc.com/)
6. [LocalGlobe / Phoenix Court](https://www.phoenixcourt.vc/)
7. [Point Nine](https://www.pointnine.com/)
8. [Kima Ventures](https://kimavc.com/)
9. [Speedinvest](https://www.speedinvest.com/)
10. [Creandum](https://creandum.com/)

The ranking below reflects relevance to Foundry’s brief, not fund performance or objective industry status. Scores are an editorial comparison aid rather than a statistically weighted index; the evidence and borrowing guidance in section 4 matter more than decimal-place ordering.

### Evaluation criteria

- **Visual craft:** typography, composition, image art direction, color, spacing, responsiveness, and finish
- **Brand distinctiveness:** whether the firm owns a recognizable verbal and visual idea
- **Founder relevance:** speed with which the right founder can understand fit, behavior, and value
- **LP confidence:** evidence of judgment, repeatability, team quality, institutional maturity, and track record
- **Restraint:** how much signal is delivered without content or feature overload
- **Interaction craft:** whether motion and interaction add meaning rather than novelty

### Comparative ranking for Foundry’s use case

| Rank | Firm | Visual craft | Brand | Founder relevance | LP confidence | Restraint | Interaction | Reference value |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | First Round | 9.8 | 9.9 | 9.8 | 9.5 | 9.1 | 9.5 | **9.7** |
| 2 | Creandum | 9.4 | 9.6 | 8.8 | 8.7 | 8.4 | 9.4 | **9.1** |
| 3 | LocalGlobe / Phoenix Court | 8.8 | 9.2 | 9.0 | 9.7 | 7.6 | 7.5 | **8.9** |
| 4 | Point Nine | 8.6 | 9.3 | 9.7 | 7.9 | 8.8 | 8.0 | **8.8** |
| 5 | Pear VC | 8.9 | 8.8 | 9.6 | 9.4 | 6.3 | 8.2 | **8.8** |
| 6 | Speedinvest | 8.7 | 8.6 | 9.6 | 9.5 | 6.7 | 7.8 | **8.7** |
| 7 | Seedcamp | 8.7 | 9.1 | 9.1 | 9.5 | 5.7 | 8.4 | **8.6** |
| 8 | NFX | 8.7 | 9.5 | 9.7 | 9.0 | 4.7 | 8.5 | **8.5** |
| 9 | Kima Ventures | 8.2 | 9.6 | 9.2 | 5.8 | 9.8 | 8.5 | **8.4** |
| 10 | Precursor Ventures | 8.0 | 8.4 | 9.0 | 7.5 | 8.6 | 7.8 | **8.2** |
| — | Current Foundry | 8.0 | 8.5 | 8.8 | 5.8 | 6.9 | 7.6 | **7.6** |

---

## 4. Detailed benchmark review

### 4.1 First Round — the strongest architecture reference

**Primary idea:** “Beginnings Matter.”

First Round’s current homepage opens on an almost-black field with an exceptionally short thesis: the beginning of a company matters, and the firm goes to unreasonable lengths when founders may only have an “imagine if.” Portfolio proof is integrated immediately into the experience through ten small company objects. Each opens a full-screen, color-coded origin story containing early insight, original pitch or product artifacts, founder imagery, short outcome proof, and sometimes video.

The crucial design decision is progressive disclosure. The site contains substantial depth without forcing ten case studies into the default scroll. A casual founder receives the idea and the proof. A curious founder or LP can inspect what First Round saw before consensus. The site demonstrates investment judgment rather than saying “we have judgment.”

Visually, it combines near-black and warm paper surfaces, bespoke sans and serif typography, archival imagery, small floating portfolio objects, and a controlled family of jewel/pastel story colors. Motion is deliberate: objects enter, lift slightly, preview on hover, and transition into full-screen stories. Reduced-motion behavior is coded.

Founder relevance is exceptional because the entire site is about the ambiguous first stage. LP relevance is equally strong because iconic outcomes, original artifacts, and the firm’s willingness to show mistakes communicate institutional memory.

**Borrow:**

- One short, ownable thesis
- Portfolio proof in the first screen or two
- “What we saw then” rather than only “what it became”
- Optional depth instead of a long default page
- Archival or entry-stage evidence
- Motion that reveals judgment

**Avoid:**

- Reproducing ten bespoke modal experiences without the content and frontend budget to sustain them
- Copying its floating-tile composition, “beginnings” language, or exact palette
- Creating a resources/program ecosystem that Foundry does not genuinely operate

### 4.2 Creandum — the strongest premium Scandinavian finish

**Primary idea:** “We back the companies of tomorrow before it’s obvious.”

Creandum pairs a dark forest-green world, high-contrast white typography, cinematic founder/team photography, and serif/sans editorial rhythm with unusually human interaction. Founder testimonials from Spotify, iZettle, Depop, Trade Republic, KRY, and others appear as part of the opening atmosphere rather than a late-page proof carousel. Portfolio commitments, team presence across four cities, a 2003–2026 history signal, editorial perspectives, and a detailed regulatory footer provide institutional depth.

Its signature mechanic is “hold to play” on human portraits, supported by numbered sliders and restrained motion. The interaction is memorable because it humanizes still imagery; it is not a layer of generic fade-ups.

The brand achieves a useful duality. Founders encounter intuition, guts, culture, product, and ambition. LPs encounter longevity, global offices, recognizable outcomes, governance, policies, and institutional staff. It does not need an LP-sales hero.

**Borrow:**

- One dark, ownable color field
- Founder proof in the opening atmosphere
- One intentional human interaction
- Quiet regulatory and institutional depth in the footer and secondary pages
- Portfolio history presented as lineage, not inventory
- Premium motion with restraint

**Avoid:**

- A long philosophy section after the visitor already understands the thesis
- Multiple press/update modules that dilute the premium surface
- High-motion portrait treatments without touch, performance, pause, and reduced-motion fallbacks

### 4.3 LocalGlobe / Phoenix Court — the strongest quiet LP layer

**Primary idea:** a place-based, multi-stage institution around founders.

LocalGlobe’s fund page and the newer Phoenix Court umbrella site together show how a founder-facing brand can hold an institutional capital story underneath. LocalGlobe emphasizes pre-seed/seed, companies, founders, community, events, jobs, and a physical home. Phoenix Court shows the broader LocalGlobe → Latitude → Solar lifecycle, portfolio tabs, founder testimonials, and the organizational group.

Most notably, LocalGlobe has a dedicated LP page that names institutional backers. This is unusual public proof and gives LP visitors immediate confidence without placing LP logos in the founder hero.

The visual identity uses a fluid blue–green–yellow gradient family and treats Phoenix Court’s physical location as part of the product. The brand feels rooted, civic, cultured, and quietly institutional.

**Borrow:**

- Founder warmth on the surface; institutional structure one layer down
- One specific founder quote about behavior rather than generic support
- A quiet fund/LP page
- A sense of place, if Foundry can express the Nordics authentically
- Lifecycle or portfolio logic shown simply

**Avoid:**

- Competing fund and umbrella narratives
- Stale event modules
- Showing multi-vehicle complexity before the visitor needs it
- Naming LPs without explicit permission

### 4.4 Point Nine — the strongest operating specificity

**Primary idea:** a small, thesis-driven partnership with explicit capacity.

Point Nine says, in the opening screen, that it is a small equal partnership, that four partners each work closely with six to eight companies, and that it invests $1–10 million per company. This is outstanding audience design. A founder immediately understands stage, range, partner attention, and how the relationship is supposed to work.

The visual system is plain but authored: white canvas, oversized black sans, compact uppercase labels, a stacked wordmark, candid partner video, and relaxed imagery. The tone is cerebral, intimate, transparent, and lightly irreverent. Phrases such as “unfair shortcuts,” a partnership “grown like a bonsai,” and “No bribes involved, promise” build personality because they sit beside precise facts.

Its portfolio and long operating history provide LP proof, though the LP story remains implicit.

**Borrow:**

- Quantify relationship capacity or cadence
- State the cheque and operating model early
- A short candid human video or portrait treatment
- One verbal quirk native to the team
- Useful specificity instead of generic “hands-on” claims

**Avoid:**

- Extremely long testimonial walls
- Hidden placeholder content; the current crawl contains lorem ipsum, which is a useful QA warning
- Allowing portfolio or library feeds to overwhelm the opening clarity

### 4.5 Pear VC — the strongest proof of founder services

**Primary idea:** specialists in pre-seed and seed with an operating platform.

Pear opens with full-width b-roll, a direct stage statement, and the high-efficiency proof line “We’ve seeded companies worth over $300B.” The page then translates support into concrete founder problems: first hires, founder-led sales, fundraising narrative, and introductions. It quantifies 175 hires by its in-house recruiting team.

The system uses a friendly serif/sans pairing, a cream base, periwinkle, yellow, orange, olive, and lime bands, candid team/community photography, rounded images, carousels, and a long logo ticker. The feeling is optimistic, West Coast, high-touch, and company-building oriented.

Pear is a useful lesson in making “support” real. It is also a warning about abundance: the mega-navigation, multiple service bands, testimonials, posts, press, programs, and footer taxonomy become an inventory.

**Borrow:**

- One defensible portfolio or operating metric immediately after the hero
- Two or three concrete examples of how Foundry changes the odds
- Real founder evidence attached to each claim
- Candid, well-art-directed community media

**Avoid:**

- A service-platform promise that Foundry does not intend to staff
- Mega-navigation and taxonomy sprawl
- Generic autoplay event b-roll
- Too many cheerful section colors for a discreet institutional brand

### 4.6 Speedinvest — the strongest scaled-platform signal

**Primary idea:** “The Power of More.”

Speedinvest communicates scale through sector teams, seed-to-growth coverage, six offices, portfolio reach, and hard metrics: 85% of initial investments led, 100+ follow-on rounds annually, 70+ Series A rounds in four years, and a top-1% claim. Separate founder and LP logins live in the footer.

Vivid orange and white, large type, metric panels, sector navigation, and functional filters make the site feel energetic, international, and operational. Founders receive clear stage/check information and network support; LPs see capital depth, organization, follow-on capacity, and institutional systems.

Its weakness is density. Many claims compete before the visitor forms an emotional impression.

**Borrow:**

- Two or three operational metrics with real meaning
- Quiet founder/LP utilities only if those systems actually exist
- Precise cheque ranges on the fund page
- Scale proof paired with human testimony

**Avoid:**

- A dashboard of metrics
- Repeating one slogan through many variants
- Generalist breadth that blurs Foundry’s sharp AI-only identity
- Unsupported ranking claims

### 4.7 Seedcamp — the strongest European ecosystem energy

**Primary idea:** “By Your Side from Day One.”

Seedcamp combines a dark forest-green base, fluorescent green accent, wide uppercase typography, founder cutouts layered over photography, a company carousel, moving statement marquee, and autoplay founder testimonials. Revolut, Wise, UiPath, Synthesia, and other outcomes create powerful European proof. A current-fund announcement and FCA disclosure give LPs an institutional layer.

The brand feels like a movement and network rather than a quiet partnership. That is effective for Seedcamp, but the homepage eventually becomes a very long news and hiring feed.

**Borrow:**

- One unmistakable accent color used with discipline
- Founder imagery rather than investor self-portraiture
- A current fund signal, if needed, kept secondary
- Regulatory disclosure in the footer

**Avoid:**

- Marquee + carousel + autoplay testimonial running at the same time
- News and hiring walls
- Generic “network, advice, support” language without a Foundry-specific mechanism
- Turning the website into a live campaign for the fundraise

### 4.8 NFX — the strongest intellectual/media brand, and the clearest anti-pattern for restraint

**Primary idea:** “See what others do not.”

NFX combines deep navy, pale blue, green, a giant condensed serif, monospaced microcopy, a typewriter hero, a very large editorial archive, founder software, topic navigation, a newsletter read by 322K+ startup teams, and a 400+ founder guild.

It feels cerebral, contrarian, software-native, and prolific. Founder utility is exceptional. LP proof comes through audience, founder network, media reach, tools, and operator history.

For Foundry, NFX is more useful as a boundary than a blueprint. Content, news, software, topics, multiple newsletter prompts, and founder rails all compete with the investment franchise. The hero’s critical text is initially client-typed, which also weakens initial HTML/search accessibility; Foundry must render its core proposition server-side and animate only as enhancement.

**Borrow:**

- High-contrast editorial typography
- A short, ownable worldview
- One useful public artifact only if it genuinely exists
- Sparing analytical/monospaced texture

**Avoid:**

- Becoming a media portal
- Typewriter effects as AI/technology shorthand
- Newsletter conversion as a dominant goal
- Hiding the fund beneath founder tools

### 4.9 Kima Ventures — the strongest compression

**Primary idea:** “The Kima Deal.”

Kima’s current site is almost a one-screen manifesto: the most active business angel, two startups per week, €150k one-off tickets, 100 deals a year, a portfolio link, and a repeating latest-investment ticker. Its black/teal high-contrast execution, all-caps copy, and near-zero interaction make it feel fast, blunt, internet-native, and mildly rebellious.

It behaves as a filter rather than a brochure. Founders can qualify themselves immediately. The trade-off is weak LP confidence: team, governance, structure, outcomes, and fund operations are largely invisible.

**Borrow:**

- Radical proposition discipline
- A memorable name for an operating model, if Foundry has one worth naming
- One live activity signal instead of a news archive
- A single continuous motion gesture

**Avoid:**

- Mystery as a substitute for institutional proof
- Unsupported superlatives
- Ambiguous stage/ticket language
- Copying a rebel visual treatment without the organizational model behind it

### 4.10 Precursor Ventures — the strongest literal expression of “people first”

**Primary idea:** “We invest in people over product.”

Precursor uses a warm beige and burgundy palette, Playfair-style serif with clean sans, a scenic San Francisco hero, organic waves, a company logo marquee, and a large mosaic of founder portraits with hover labels. The proof literally embodies the thesis: people, not abstract claims.

Its practical Philosophy page gives check size, stage, geography, reserve policy, and annual investment pace. The brand is welcoming, patient, and boutique. LP confidence is more limited because outcomes, institutional structure, and fund information are not prominent.

**Borrow:**

- Make the visual proof embody the thesis
- Use real founder or decision-maker faces
- Put practical criteria one layer deeper
- Favor one short principle over a services inventory

**Avoid:**

- Generic city/location imagery
- A familiar premium-template combination of Playfair, pills, waves, marquees, and fade-ups
- Large portrait walls without differentiation
- Emotional “people first” language without evidence of repeatable investment discipline

---

## 5. Cross-benchmark synthesis

### 5.1 The common pattern among the best sites

The best early-stage VC websites consistently do the following:

1. **Open with one worldview, not a menu of services.**
2. **Show founder proof before institutional adjectives.**
3. **Let the same evidence serve founders and LPs.** Founders see understanding and behavior; LPs infer access, judgment, and repeatability.
4. **Use portfolio as the product.** The most persuasive sites do more than show logos; they show what was seen early.
5. **Quantify one or two behaviors.** Partner capacity, lead rate, cheque range, investment cadence, or introductions are useful because they explain how the firm operates.
6. **Keep institutional signals quiet.** Team depth, policies, regulatory language, LP names, portals, and structures live in secondary pages and footers.
7. **Use one signature mechanic.** First Round has origin-story objects; Creandum has hold-to-play portraits; Kima has the ticker; Precursor has the portrait wall.
8. **Treat motion as punctuation.** Continuous animation is rare and purposeful; most states last 180–800 ms.
9. **Avoid a desperate inbound posture.** “Pitch us” is secondary, absent, or replaced by a genuine relationship/program path.
10. **Lose signal when they become content feeds.** NFX, Seedcamp, and parts of Pear demonstrate how recency can overwhelm brand clarity.

### 5.2 The reference recipe for Foundry

Foundry should not imitate any one site. Its target combination is:

- **First Round:** progressive disclosure and proof of early judgment
- **Creandum:** premium Scandinavian surface, human confidence, and motion quality
- **Point Nine:** operational specificity and partner-level intimacy
- **Kima:** compression and the courage to stop
- **LocalGlobe/Phoenix Court:** quiet institutional and LP depth

It should explicitly avoid:

- Seedcamp’s news volume
- NFX’s portal density
- Pear’s service inventory
- Speedinvest’s metric wall
- Precursor’s generic location/mood imagery
- Any large pitch/upload funnel

### 5.3 The five questions the rebuilt site must answer

Within the first screen and one natural scroll, any qualified visitor should know:

1. **What does Foundry invest in?** Nordic AI-native teams at pre-seed.
2. **How does Foundry invest?** €100k or €200k, one to three teams a month, with a team-first decision lens.
3. **Why does Foundry exist?** Because at AI pre-seed, the durable signal is the team’s rate of learning while products and models move.
4. **What happens after investment?** Relevant introductions and practical operating support, stated only as specifically as the portfolio can verify.
5. **Who stands behind it?** Named, credible decision-makers and a real fund organization.

---

## 6. Recommended brand and positioning direction

### 6.1 Experience north star

**Nordic conviction. AI velocity. Human judgment.**

The visual world should feel like a small institution with sharp taste, not a lifestyle brand, an accelerator, a bank, or an AI product landing page.

Desired emotional sequence:

1. **Arrival:** calm, ownable, confident
2. **First scroll:** specific and highly qualified
3. **Portfolio:** credible and current
4. **Thesis:** intellectually coherent
5. **Human proof:** personal and trustworthy
6. **Inspection:** institutionally complete
7. **Exit:** direct path to a real person

### 6.2 Positioning statement

Internal positioning, not necessarily homepage copy. This must remain a strategic aspiration until every behavior claim is evidenced:

> Foundry is the focused Nordic AI pre-seed fund that backs teams before conventional venture evidence exists, then stays close through relevant introductions and practical operating support.

### 6.3 Recommended public message hierarchy

1. **Brand idea:** Teams first, while everything else is moving.
2. **Category:** Nordic AI pre-seed fund.
3. **Operating facts:** €100k or €200k; one to three investments a month.
4. **Investment belief:** The team’s speed of learning is the most durable early advantage.
5. **Post-investment behavior:** Relevant customer introductions and less operational drag.
6. **Proof:** Portfolio, real founder evidence, visible decision-makers, and fund structure.

### 6.4 Recommended hero copy

This is working copy and must be reviewed for factual, legal, and tonal accuracy before publication.

**Eyebrow**

> Nordic AI pre-seed · €100k / €200k

**Headline**

> We only invest in AI. We invest in teams first.

**Support**

> One to three teams a month. We underwrite a team’s rate of learning, then help create the first customer momentum.

Publish `help create the first customer momentum` only if the portfolio can substantiate that behavior. Lower-claim fallback:

> One to three teams a month. We underwrite a team’s rate of learning, then stay close through the earliest commercial and operating questions.

**Primary link**

> Meet the teams

This preserves the equity in the existing line while replacing “teams only,” which can sound as though Foundry does not invest through companies or care about the market.

If the exact current headline is non-negotiable, keep it, but the support line must identify Foundry as a fund and clarify the team-first lens immediately. Do not retain “Foundry is not a venture fund.”

### 6.5 Copy to retain, reframe, or delete

| Current idea | Action | Recommended treatment |
|---|---|---|
| We only invest in AI | Retain | Core filter and category clarity. |
| We only invest in teams | Reframe | “We invest in teams first.” |
| AI only · Teams only · Nordics | Reframe | Avoid duplicating the hero. Use “Nordic AI pre-seed · €100k / €200k.” |
| €100k or €200k | Retain | One of the strongest qualification facts. |
| 1–3 per month | Retain | Communicates a system and real pace. |
| In AI, the team is the only thing that compounds | Retain | Use as the short thesis section heading. |
| Foundry is not a venture fund | Delete | Contradicts the scaled-fund ambition and creates institutional ambiguity. |
| Industrial angel | Remove from public category copy | May survive as internal shorthand, not the main public identity. |
| We do not size your market / ask for a competitive matrix | Reframe | Explain epistemic humility without implying absence of diligence. |
| You do not need a deck | Retain carefully | “Start with a conversation. A deck is optional.” Direct and founder-friendly. |
| Tell us who you are building with | Retain | Strong, human final instruction. |
| What you get | Replace | “What changes after Foundry.” |

### 6.6 Voice rules

Use:

- Short declarative sentences
- Specific nouns, numbers, and verbs
- “We” and “you,” used sparingly
- Calm confidence
- Plain descriptions of behavior
- One opinion per paragraph
- British/European English consistently (`cheque`, not `check`, if that is the chosen house style)

Avoid:

- Visionary
- World-class
- Unwavering
- Relentless support
- Value-add
- Ecosystem
- Supercharge
- Unlock
- Revolutionise
- Founder-friendly
- Global network
- Hands-on, unless followed by a concrete behavior
- Any unqualified “best,” “first,” “leading,” or ranking claim
- Copy that tells founders what they already know about AI changing the world

### 6.7 Homepage copy budget

| Section | Target words |
|---|---:|
| Hero eyebrow, headline, support | 35–50 |
| Criteria | 12–24 |
| Selected portfolio descriptors | 60–90 total |
| Thesis | 55–75 |
| What changes after Foundry | 70–100 total |
| Founder proof | 20–35 |
| Team/fund preview | 45–70 |
| Contact | 25–40 |
| **Target total** | **approximately 350–450** |

Do not hit the budget by shrinking text or hiding it in accordions. Edit.

---

## 7. Information architecture

### 7.1 Recommended public routes

Keep the public site intentionally small:

| Route | Purpose |
|---|---|
| `/` | Brand, qualification, portfolio proof, thesis, behavior, human trust, contact |
| `/portfolio` | Complete public portfolio with concise company context |
| `/fund` | Quiet institutional layer for LPs and high-intent founders: model, people, structure, approach, verified legal signals |
| `/privacy` | Accurate, final privacy notice matching the actual data flows |
| `/terms` | Only if counsel or the actual operating model requires it |

Do not add a separate Team route at launch unless there are enough public team members and approved content to justify it. The homepage and `/fund` can carry the team well. If the public team later grows to four or more people, a Team route can be added without changing the core architecture.

### 7.2 Header navigation

Desktop:

- Foundry logo → `/`
- Portfolio → `/portfolio`
- Fund → `/fund`
- LinkedIn → external, text or small icon
- Contact → anchored direct-email link or understated text button

Mobile:

- Foundry logo
- A plain `Menu` label or accessible compact trigger
- Full-screen or sheet menu only because it is required for space, not as a visual event
- Same four destinations, no dropdown taxonomy

Do not create separate “Founder” and “LP” navigation modes. Both audiences should see the same conviction and proof; LP depth is available through `/fund`.

### 7.3 Founder journey

```text
Hero fit → criteria → selected teams → thesis → what changes → human proof → direct conversation
```

No form. No deck upload. No qualification wizard.

### 7.4 LP journey

```text
Hero focus → cadence/portfolio → team-first rationale → Fund → people/strategy/institutional facts → direct partner contact
```

No public data room. No performance claims or fundraise terms unless approved for public distribution.

---

## 8. Page-by-page implementation specification

### 8.1 Global header

#### Purpose

Make the site feel complete and navigable without adding chrome.

#### Desktop behavior

- Fixed at top.
- Transparent over the hero, with white mark/type.
- Transitions to a paper/white surface with blue mark and hairline border after leaving the hero.
- Height approximately 96–110 px on large screens.
- Logo should retain current authority but not dominate the nav; target rendered height 56–64 px rather than the current maximum 74 px if the nav becomes visually unbalanced.
- Navigation labels at 14–16 px, medium weight, no all-caps.
- Contact can be a text link with an animated underline or a square-outline button. Use only one treatment.

#### Mobile behavior

- Height 64–72 px.
- Logo rendered around 108–128 px wide, subject to the wordmark’s actual aspect ratio.
- Menu trigger at least 44 × 44 px.
- Header must not cover heading anchors.

#### Motion

- Surface and logo crossfade: 240–320 ms.
- No header hide-on-scroll; the page is short enough to keep orientation.
- Active nav state uses a hairline, not a filled pill.

#### Acceptance

- All destinations are reachable by keyboard and screen reader.
- No flash between white and transparent states on load.
- Correct logo variant is visible at every surface boundary.
- Core navigation works without client-side JavaScript.

### 8.2 Homepage section 1 — hero

#### Purpose

Deliver a memorable worldview, qualify the audience, and establish Foundry’s visual signature.

#### Content

- Eyebrow: category + ticket
- One H1, maximum two conceptual sentences
- One support paragraph, maximum 28–32 words
- One primary text/button link to the portfolio
- Optional secondary text link to `/fund`; omit if it creates visual competition

#### Layout

Desktop:

- Minimum height: `max(760px, 92svh)`; avoid forcing a full 100vh when browser height is short.
- Content anchored in the lower half, not pinned to the very bottom.
- H1 maximum width approximately 12–14 display words per line system, controlled with editorial line breaks.
- H1 target: `clamp(64px, 6.4vw, 112px)` with tuned leading around 0.94–1.0 depending on the final licensed face.
- Support width: 42–50 characters.
- Do not use two side-by-side support paragraphs.

Mobile:

- Minimum height should respond to content; do not trap the hero at exactly one viewport if text overflows.
- H1 target: `clamp(40px, 11vw, 54px)`.
- One support paragraph.
- Keep the primary link above the first viewport boundary on common 390 × 844 devices if possible without compressing the brand.

#### Visual

- Keep the ocean loop.
- Apply a deep-blue tonal treatment so copy maintains contrast.
- Avoid excessive blur or dark overlay that turns the video into an indistinct gradient.
- Consider a very subtle 1 px horizontal “current line” or crop shift that connects the ocean to the site’s hairline system.
- No particles, 3D objects, globes, code, grids, or glowing AI motifs.

#### Motion

- Ocean is the only continuous motion on the page.
- On first load: eyebrow, headline, support, and link reveal over 450–650 ms with 60–100 ms staggering.
- Do not animate each word or character.
- Static server-rendered text must exist before animation.
- Respect reduced motion and data saving.
- Provide pause/resume.

#### Acceptance

- In five seconds, a visitor can state category, region, stage, and ticket.
- H1 never clips at 320 px or common laptop heights.
- Poster frame looks intentional when video does not load.
- LCP remains within the performance budget.

### 8.3 Homepage section 2 — investment model strip

#### Purpose

Turn the worldview into an operating system using six facts and no prose.

#### Recommended facts

| Label | Value |
|---|---|
| First cheque | €100k or €200k |
| Pace | 1–3 teams / month |
| Stage | Pre-seed |
| Focus | AI-native |
| Geography | Nordics |
| Decision lens | Team first |

Use the exact approved terminology. If “AI-native” is too restrictive, retain “AI only.” Do not show both.

#### Layout

- White or paper surface directly after the hero.
- Six cells in a 3 × 2 desktop grid or six-column strip depending on the final breakpoint and word lengths.
- Two columns on mobile.
- Hairline dividers; no cards, shadows, rounded boxes, icons, or illustrations.
- Values use the display face at a compact scale.
- The accessible H2 may be visually hidden if the strip is sufficiently clear, but the section requires a label for screen readers.

#### Motion

- One section reveal only. Do not animate six counters or values independently.

### 8.4 Homepage section 3 — selected portfolio proof

#### Purpose

Prove Foundry’s access and taste before asking the visitor to read the thesis.

#### Content

- H2: `The teams we back`
- Six approved companies, editorially chosen rather than simply the first six in data order
- Company logo
- Company name if the logo is not text-accessible
- One descriptor, maximum 10–14 words
- Optional entry-stage proof for up to three companies, only if verified and approved
- Link: `See all teams`

#### Selection principles

The six should collectively show:

- Quality of founder/company brand
- Breadth within AI without looking unfocused
- Nordic relevance
- Current momentum
- A coherent Foundry taste

Do not rank by favoritism. Rotate only when there is a real portfolio reason, not to make the page look active.

Foundry—not Claude Code—must approve the selected six and their order. Until that decision exists, preserve the current portfolio data order and render all nine in the implementation preview, clearly logging the six-company selection as a content decision. Do not infer `current momentum`, portfolio importance, or founder preference from public signals.

#### Layout

- Three columns desktop, two tablet, one or two mobile depending on content.
- Preserve optical logo normalization.
- Reduce card copy and vertical height significantly.
- Use black/white/paper surfaces from the system; do not let nine unrelated brand colors dominate the page.
- Cards may invert from paper to black on hover/focus with the logo treatment switching appropriately.

#### Progressive proof option

If excellent entry-stage material exists, one or two selected cards can reveal a short line such as:

> Backed when: two founders and a working prototype.

This line is an example format, not approved content. Never publish it without company confirmation.

Do not build modal case studies at launch unless the underlying stories and assets are ready. A refined card grid is preferable to empty interaction.

### 8.5 Homepage section 4 — thesis

#### Purpose

Explain the intellectual model once, sharply.

#### Heading

> In AI, the team is the only thing that compounds.

#### Working body copy

> Models change monthly. Products can be rebuilt in a weekend. The durable advantage at pre-seed is a small group of people who learn faster than the field moves. That is what we underwrite: fixed cheques and a short decision path, aligned with the speed of the teams we back.

Review before publication. Target 55–75 words, one paragraph.

Only introduce a stronger claim such as `a portfolio designed to act like a working group` if Foundry can show the actual mechanism and founders confirm that it is true. Otherwise keep the lower-claim version above.

#### Layout

- White/paper split composition.
- Large sticky heading on desktop only if it remains useful at common laptop heights.
- Body set larger than standard paragraph text, approximately 20–24 px desktop.
- No three-paragraph manifesto.
- No icons or diagrams.

### 8.6 Homepage section 5 — what changes after Foundry

#### Purpose

Describe behavior without pretending Foundry is a full-service operating platform.

#### Heading

> What changes after Foundry

#### Four concise items

1. **Capital**  
   Fixed €100k or €200k first cheques, with a process built for the pace of pre-seed.

2. **Customers**  
   Relevant introductions where there is a real product and relationship fit.

3. **Company craft**  
   Less recurring legal, finance, and operating friction around the work of building.

4. **Peers**  
   A working group of AI-native founders solving adjacent problems at the same moment.

These are working descriptions. Every claim must match what Foundry consistently delivers.

#### Layout

- Four columns desktop, two tablet, one mobile.
- Hairlines and index numbers are acceptable.
- Remove the current large two-image composition unless replacement imagery passes the art-direction standard.
- If one real community/founder photograph is excellent, use it as a single full-width or offset image after the four items.

#### Motion

- One staggered reveal of 60–80 ms per item is acceptable.
- No animated icons.

### 8.7 Homepage section 6 — founder proof and decision-maker

#### Purpose

Make the model human and provide the single strongest missing trust signal.

#### Founder proof

Use one quote only, with these rules:

- 20–35 words
- Specific behavior or outcome
- Named founder, company, and role
- Written approval to publish
- No “hands-on,” “great network,” or “amazing partner” generalities
- No carousel

Good subject matter:

- Speed and clarity of the decision
- A precise customer introduction
- Help through a difficult early company moment
- The value of the founder working group

If no quote meets the standard, omit the quote section at launch.

#### Decision-maker block

Show each public person who materially owns investment decisions:

- Excellent, consistent portrait
- Name and role
- 45–70 word biography focused on relevant operating/investment pattern recognition
- Direct email or LinkedIn
- Link to `/fund`

Do not create inflated titles, generic biography copy, or an implied team larger than reality.

#### Layout

- One calm editorial composition, not a staff-card grid.
- If there is one partner, own that intimacy instead of padding the page.
- If there are two or three decision-makers, use a balanced sequence with consistent portraits.

### 8.8 Homepage section 7 — contact

#### Purpose

End with a direct human action that matches how the best teams actually enter the network.

#### Working copy

**Heading**

> Building a Nordic AI company?

**Body**

> Start with a conversation. A deck is optional. Tell us who you are building with and what you have learned faster than everyone else.

**Action**

> Email Anders

Review wording and contact owner before publishing.

#### Visual

- Return to the deep-blue conviction field.
- Reuse the ocean poster/current very subtly, or use a static deep-blue crop. Do not run a second independent video.
- Show the actual email address on larger screens so the destination is transparent.
- No form.

### 8.9 Global footer

#### Content

- White Foundry wordmark
- One sentence: category, region, and ticket; no repeated manifesto
- Home, Portfolio, Fund
- Named contact and direct email
- LinkedIn
- Accurate legal entity, registered address, organization number, and regulatory disclosure if required and approved
- Privacy and Terms if applicable
- Correct copyright and capitalization

#### Design

- Black surface
- Three-column desktop, stacked mobile
- Fine rule between primary and legal rows
- Legal text can be small but must remain legible and contrast-compliant
- No newsletter form
- No social-icon cluster beyond LinkedIn

### 8.10 Portfolio page

#### Purpose

Provide complete, current proof without becoming a database product.

#### Hero

- H1: `Portfolio`
- One short sentence restating the focus; maximum 24 words
- Black or deep-blue field
- Do not repeat the full homepage proposition

#### Grid

- All active public companies
- Three columns desktop, two tablet, one mobile
- Logo, company name, one-sentence descriptor capped around 22–28 words
- Optional metadata only if complete and useful across the full portfolio: stage at Foundry entry, location, theme
- External company link
- Consistent optical logo treatment

Do not add filters until the public portfolio exceeds roughly 24 companies or has meaningful, maintained metadata. Nine filters for nine companies would signal product thinking rather than taste.

#### Optional future enhancement

Once Foundry has at least three strong, approved origin stories, selected company detail pages may show:

- What the team had built at entry
- What Foundry noticed
- One founder quote
- Relevant public milestone

This is a later content capability, not a launch requirement.

### 8.11 Fund page

#### Purpose

Give LPs and serious founders confidence that the focused public brand is backed by a repeatable institution.

The page should remain shorter than a fundraising deck and should not expose confidential offering information. Hard budget: approximately 400–500 words, no more than four visible content modules before the footer, and no repeated homepage copy.

#### Recommended structure

1. **Hero and public facts**  
   H1: `A focused system for Nordic AI pre-seed.`  
   One paragraph, maximum 45 words, followed by stage, focus, geography, first ticket, investment cadence, and decision model. Use only approved facts.

2. **Why the model exists and how it works**  
   One 70–100 word explanation of team-first underwriting in a fast-moving AI market, followed by three compact steps: conversations and decision; first cheque; customer/operating work. Avoid false timeline promises.

3. **People**  
   Decision-makers and relevant operator/investor biographies.

4. **Contact**  
   Direct partner email. If there is a separate investor-relations contact, show it accurately.

Place management company/fund entity, registered address, organization number, regulatory status, and policy links in a compact institutional disclosure at the bottom of the page or in the global footer. List administrator, auditor, or counsel only if public, approved, and genuinely useful; do not turn vendors into a content section.

#### Optional public LP proof

Named LPs, fund size, vintage, deployment data, or performance-related information may be shown only when:

- Accurate and current
- Approved for public distribution
- Permitted by counsel and agreements
- Useful to the public audience

Do not imitate LocalGlobe’s LP page by inserting names merely because the benchmark does so.

#### Explicit exclusions

- No public data room
- No LP lead form
- No return charts
- No target-return language
- No live fundraising thermometer
- No invented “institutional-grade” adjective
- No portal link unless a real, supported portal exists

### 8.12 Privacy, terms, and 404

#### Privacy

Rewrite the notice to match actual production data flows.

If the rebuilt site has only direct `mailto:` and `tel:` links and no analytics/cookies/forms:

- Remove all pitch-form fields and retention claims.
- Remove consent-checkbox language.
- State accurately what server/hosting logs may be processed and for how long, after confirming with the host and counsel.
- Insert the final legal entity, registered address, and contact.
- Remove all “pending confirmation,” “before publication,” or draft notes.
- Set a real last-updated date.
- Obtain legal approval before launch.

If privacy-preserving analytics are added, document the exact data, provider, legal basis, cookies, and retention. Do not add analytics first and update privacy later.

#### Terms

Add only if required. A VC site does not need boilerplate Terms merely to look institutional; inaccurate boilerplate is worse than omission.

#### 404

Use:

- Short heading
- Home
- Portfolio
- Fund
- Direct contact

Remove `/pitch`. Test every 404 action.

---

## 9. Visual design system

All pixel values, widths, timings, and type sizes below are implementation starting constraints, not a substitute for optical judgment. Claude Code must tune them against the final licensed font, approved media, real copy, and target devices while preserving the stated hierarchy and budgets.

### 9.1 Design territory: Nordic industrial editorial

The system should combine:

- Nordic spatial restraint
- The material seriousness implied by “Foundry”
- Editorial human judgment
- AI-era speed expressed through motion and precision, not visual clichés

It should not resemble:

- A fintech dashboard
- A luxury fashion house
- A brutalist design experiment
- An accelerator or coworking community
- A neon AI SaaS landing page
- A traditional private-equity website

### 9.2 Color tokens

Use the existing brand values as the basis. Confirm exact logo/source colors before finalizing.

```css
:root {
  --color-ink: #050505;
  --color-paper: #f5f5f2;
  --color-white: #ffffff;
  --color-foundry-blue: #00308f;
  --color-deep-blue: #001848;
  --color-ocean-slate: #53627d;
  --color-text: #0a0a0a;
  --color-text-muted: #595957;
  --color-text-inverse-muted: rgba(255, 255, 255, 0.74);
  --color-line: rgba(0, 0, 0, 0.14);
  --color-line-inverse: rgba(255, 255, 255, 0.18);
  --color-focus: #1a5cff;
}
```

Rules:

- Foundry blue is a signature, not a generic CTA color applied everywhere.
- Black and paper should carry most non-hero sections.
- Ocean slate may appear in imagery, hover surfaces, or very limited metadata.
- Do not add a rainbow portfolio palette to the core UI.
- Every combination must pass WCAG AA; body copy should target stronger contrast than the minimum.

### 9.3 Typography

#### Display

Preferred: retain Ivar Display only if Foundry owns an appropriate web license and valid WOFF2 assets.

If not, select one properly licensed editorial display serif with:

- High legibility at 40–112 px
- Distinctive lowercase and numerals
- Strong Nordic/editorial character without fashion fragility
- A stable webfont and permitted self-hosting
- Regular weight only unless another weight has a real use

Do not choose a typeface by visual similarity alone. Licensing is a release criterion.

#### Sans

Use one stable, licensed sans family rather than relying on Helvetica Neue being installed. It should be neutral, slightly warm, and excellent at 12–24 px. Two weights are enough: regular and medium.

#### Loading

- Use `next/font/local` or the repository’s equivalent local-font mechanism.
- Self-host WOFF2.
- Subset to required Latin characters, including Nordic characters and euro punctuation.
- Preload only the above-the-fold faces actually used.
- `font-display: swap` or `optional`, selected after testing line-shift trade-offs.
- Supply metric-adjusted fallbacks to avoid layout shift.
- Test the actual URL returns 200 in production and staging.

#### Suggested scale

```css
--text-label: clamp(0.68rem, 0.65rem + 0.1vw, 0.78rem);
--text-small: clamp(0.82rem, 0.78rem + 0.16vw, 0.94rem);
--text-body: clamp(1rem, 0.95rem + 0.2vw, 1.125rem);
--text-body-large: clamp(1.18rem, 1.05rem + 0.55vw, 1.45rem);
--text-h3: clamp(1.8rem, 1.35rem + 1.6vw, 3rem);
--text-h2: clamp(2.6rem, 1.7rem + 3.4vw, 5rem);
--text-h1: clamp(3.1rem, 2rem + 5.2vw, 7rem);
```

Tune against the final font, not against fallback Georgia.

### 9.4 Grid and container

- Maximum content width: 1440 px
- Wide desktop gutter: 42–56 px or approximately 3vw
- Mobile gutter: 22–24 px
- Tablet gutter: 28–36 px
- Use the existing 24-column grid if it is already robust; otherwise a 12-column grid is sufficient.
- Text measure: 48–68 characters depending on display/body use
- Avoid arbitrary nested max-widths that create misaligned edges.

### 9.5 Spacing

Use an 8 px base with a small semantic scale. Avoid a huge token catalogue.

```css
--space-1: 0.5rem;   /* 8 */
--space-2: 0.75rem;  /* 12 */
--space-3: 1rem;     /* 16 */
--space-4: 1.5rem;   /* 24 */
--space-5: 2rem;     /* 32 */
--space-6: 3rem;     /* 48 */
--space-7: 4.5rem;   /* 72 */
--space-8: 6rem;     /* 96 */
--space-9: 9rem;     /* 144 */
```

Recommended section padding:

- Desktop: 104–152 px
- Tablet: 88–112 px
- Mobile: 72–96 px
- Criteria strip: tighter, approximately 56–80 px

### 9.6 Rules, radius, shadow, and surfaces

- Hairlines: 1 px, low-contrast neutral
- Radius: 0–2 px for most UI; image crops may use 0 or a very restrained radius
- Shadows: none by default
- Cards: flat surfaces defined by rules, contrast, and spacing
- No glassmorphism, blur cards, pill containers, soft elevated bento tiles, or ornamental gradients

### 9.7 Buttons and links

Only two action styles:

1. **Primary rectangular action:** white on dark or black on paper; square corners; 44–52 px height.
2. **Editorial text link:** text plus animated hairline or small arrow.

Rules:

- One primary action per viewport/section.
- Never use multiple colored CTA buttons.
- Hover: invert or fill over 180–240 ms.
- Focus-visible: 2 px high-contrast outline with at least 3 px offset.
- External links use a small arrow only where it adds clarity; do not repeat noisy icons in every sentence.

### 9.8 Image art direction

Every image must belong to one of these categories:

- Foundry atmosphere: ocean/current/material
- Real decision-makers
- Real founders/teams at work
- Entry-stage artifacts: early product, whiteboard, prototype, first customer moment
- Portfolio logo/product imagery

Reject:

- Stock handshakes
- Anonymous city skylines
- Conference crowd b-roll
- People pointing at laptops
- Generic servers/circuit boards
- Synthetic chrome shapes
- Humanoid robots
- Neon code
- Images selected only because they share the color palette

Use consistent aspect ratios and explicit focal points. Store source, crop, rights, attribution, and alt-text intent alongside each asset.

### 9.9 Iconography

- Use text first.
- LinkedIn and pause/play are the only likely UI icons.
- External arrow may be drawn with a simple inline SVG.
- Do not introduce an icon library for four support claims.

---

## 10. Motion and interaction specification

### 10.1 Motion principle

Motion should express current, attention, and decision—not “technology.”

There should be one continuous motion source: the ocean. Everything else responds briefly to user or scroll state.

### 10.2 Timing tokens

```css
--duration-instant: 100ms;
--duration-fast: 180ms;
--duration-base: 280ms;
--duration-reveal: 560ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-foundry: cubic-bezier(0.22, 1, 0.36, 1);
```

### 10.3 Allowed motion

| Element | Behavior |
|---|---|
| Hero content | Opacity + 12–20 px translate; short stagger; once |
| Ocean | Slow, muted video; poster fallback; pauseable |
| Header surface | 240–320 ms color/logo crossfade |
| Section reveal | Opacity + up to 16 px translate; once |
| Portfolio card | Surface invert and image/logo scale up to 1.02–1.03 |
| Text link | Hairline expands or arrow moves 3–4 px |
| Founder portrait | Optional subtle desaturation-to-color or still-to-short-loop only with real media and controls |

### 10.4 Forbidden motion

- Scroll-jacking
- Horizontal scroll sections
- Cursor blobs
- Magnetic buttons
- Word-by-word or character-by-character hero animation
- Typewriters
- Multiple marquees
- Autoplay testimonial carousels
- Animated counters
- 3D tilt cards
- Loading screens
- Custom cursor
- Parallax greater than a few percent
- Anything that delays access to content

### 10.5 Reduced motion and user control

When `prefers-reduced-motion: reduce`:

- Do not play video.
- Use the ocean poster.
- Render reveals immediately.
- Remove transforms from hover/focus states that are not necessary.
- Preserve color and underline feedback.

For the continuous ocean loop:

- Provide a pause/resume button with accessible state and label.
- Remember the choice for the session.
- Pause when the page is hidden.
- Do not autoplay when `navigator.connection.saveData` is true where supported.

---

## 11. Content model and component architecture

### 11.1 Content principle

Content must be easy to update without turning the site into a publishing platform.

Use the existing CMS if it already manages companies, team, legal content, and homepage text reliably. If there is no CMS, typed local content is sufficient. Do not introduce a new SaaS CMS solely for nine companies and four pages.

### 11.2 Suggested typed content model

Adapt names to the repository rather than copying blindly.

```ts
type FundFact = {
  label: string;
  value: string;
  order: number;
};

type Company = {
  slug: string;
  name: string;
  websiteUrl: string;
  logo: ImageAsset;
  logoSurface: "light" | "dark";
  logoScale?: number;
  shortDescriptor: string; // 10–14 words on home
  descriptor: string; // 22–28 words on portfolio
  featured: boolean;
  featuredOrder?: number;
  location?: string;
  foundryEntryStage?: string; // publish only when complete/approved
  entryProof?: string; // optional, approved, concise
};

type Person = {
  slug: string;
  name: string;
  role: string;
  biography: string;
  portrait: ImageAsset;
  email?: string;
  linkedinUrl?: string;
  ownsInvestmentDecision: boolean;
  publicOrder: number;
};

type FounderQuote = {
  quote: string;
  founderName: string;
  founderRole: string;
  companyName: string;
  portrait?: ImageAsset;
  approvedForPublicUse: boolean;
};

type InstitutionalDetails = {
  legalName: string;
  organizationNumber?: string;
  registeredAddress: string;
  regulatoryStatement?: string;
  privacyContact: string;
};
```

### 11.3 Guardrails

- Build validation that fails production builds when required legal fields contain `TODO`, `TBC`, `pending`, `placeholder`, or empty strings.
- Do the same for public team biographies and metadata images.
- Enforce descriptor length in schema validation where practical.
- Require `approvedForPublicUse === true` before rendering a founder quote.
- Do not expose unpublished or draft content in static HTML.
- Keep one source of truth for companies across home and portfolio.

### 11.4 Suggested components

```text
SiteHeader
MobileMenu
FoundryLogo
AmbientOcean
MotionControl
HomeHero
FundFacts
FeaturedPortfolio
CompanyCard
ThesisSection
FoundryDifference
FounderProof
DecisionMakerSection
ContactSection
FundHero
FundModel
InstitutionalDetails
SiteFooter
LegalDocument
```

Do not make every text block a generic “content module.” The homepage should have a small number of authored components with clear design intent.

---

## 12. Technical implementation requirements

### 12.1 Rendering architecture

- Use Server Components/static rendering for all content sections if the stack supports it.
- Client JavaScript should be limited to header surface state, mobile menu, ocean playback control, and reveal enhancement.
- Core content, navigation, links, and company data must work without hydration.
- Do not add a large motion library if CSS and a small IntersectionObserver utility are sufficient.
- If the repository already uses a motion library, import only the required modules and verify bundle impact.
- The live build exposes clues consistent with Next.js 16 and a React canary build. Confirm the actual lockfile before changing anything; production should use supported, stable framework and React releases unless there is a documented reason to remain on a prerelease.
- Remove or route-split dormant pitch, form, network, article, filter, and portal component styles/code if repository inspection confirms they are no longer used. The public routes should not ship the remnants of abandoned features.

### 12.2 Media

The current ocean files are efficiently sized in WebM, with larger MP4 fallbacks. Preserve or improve this pattern.

- Responsive WebM and MP4 sources
- Poster at each necessary crop
- `muted`, `playsInline`, `loop`, decorative semantics
- No preload of both desktop and mobile video
- Poster should be high priority only if it is the LCP visual
- Video should begin after critical copy/paint where possible
- Pause offscreen or when the page is hidden
- Lazy-load all below-fold editorial and portfolio images
- Use correct `sizes` attributes; do not serve 3840 px sources to 400 px cards
- Give immutable, versioned brand/media assets long-lived caching where the deployment platform permits it; retain content-hashed immutable caching for framework chunks

### 12.3 Fonts

- Resolve licensing first.
- Replace the broken path.
- Test `document.fonts.check()` for the production family.
- Add an automated HTTP test for every self-hosted font asset.
- Verify Nordic characters: Å, Ä, Ö, Ø, Æ, å, ä, ö, ø, æ.

### 12.4 Metadata and social sharing

Every production route needs:

- Unique title
- Concise description
- Correct canonical
- Open Graph title, description, URL, image, width, height, and type
- Twitter large-image card
- Favicon and Apple icon
- A valid web-app manifest only if the product actually needs install metadata; otherwise remove stale manifest references rather than shipping a 404
- `Organization` and `WebSite` JSON-LD with verified URLs

Requirements:

- Generate or serve a real 1200 × 630 Open Graph asset at a stable production URL.
- Verify it returns `200 image/png` or `image/jpeg` after DNS cutover.
- Do not point staging metadata at production assets that do not yet exist.
- Make metadata base environment-aware.
- Use production canonical URLs only in production.
- Set staging and preview deployments to `noindex, nofollow` and disallow crawling.

Recommended Open Graph composition:

- Deep-blue ocean still or solid field
- White Foundry wordmark
- Short line: `Nordic AI pre-seed. Teams first.`
- Large safe margins
- No tiny criteria or portfolio logo wall

### 12.5 Robots and sitemap

Production sitemap should contain only real, canonical public routes.

Expected at launch:

```text
/
/portfolio
/fund
/terms  # only if real
```

Privacy and terms must remain directly linked and accessible to users and regulators, but they are not acquisition pages. Omit them from the sitemap unless the final SEO/legal decision gives a reason to include them. Decide `index, follow` versus `noindex, follow` explicitly with the launch owner; do not apply `noindex` automatically, because public legal transparency can itself support institutional trust. Exclude draft, preview, studio, API, and private routes.

Preview/staging:

- `X-Robots-Tag: noindex, nofollow` where possible
- Page-level robots metadata as a second layer
- No production sitemap submission

### 12.6 Migration redirects

The old Squarespace production sitemap currently exposes template-era routes. Configure permanent redirects at cutover after checking any backlinks and final destination semantics.

Recommended starting map:

```text
/home        → /
/offering    → /fund or /#what-changes-after-foundry
/instructors → /fund#people
/pricing     → /fund#model or /
/portfolio   → /portfolio  # preserve directly
```

Use server/CDN 301 or 308 redirects, not client-side navigation. Do not redirect every unknown URL to home; preserve a real 404 for unrelated paths.

After cutover:

- Replace the old sitemap immediately.
- Submit the new sitemap in Google Search Console and Bing Webmaster Tools if used.
- Inspect redirects and canonical selection.
- Check the highest-linked old URLs.
- Monitor 404s for at least the first month.

### 12.7 Security and privacy

Preserve the current strong header posture.

- Keep a restrictive CSP and remove sources no longer used.
- Avoid `'unsafe-eval'`.
- Remove unused `frame-src`/media origins and narrow `'unsafe-inline'` where the deployed framework and nonce/hash strategy make that practical.
- Retain `frame-ancestors 'none'`, nosniff, referrer policy, and restrictive permissions policy.
- Verify production sends HSTS after the canonical domain is fully HTTPS-only; do not infer production behavior from the Railway preview host.
- Do not add third-party scripts by default.
- If embedding external video later, use privacy-enhanced modes and load only after user action.
- Do not include personal telephone numbers unless deliberately approved for public use.

### 12.8 Analytics

Default recommendation: keep the site free of third-party marketing analytics.

If measurement is required, use a privacy-preserving, cookieless approach and collect only:

- Route view
- Portfolio outbound click
- Fund-page view
- Email-link click

Do not track scroll depth, cursor behavior, form identity, or cross-site advertising audiences. Update privacy before release.

### 12.9 Performance budgets

Target on a repeatable mobile Lighthouse run, acknowledging normal lab variance:

| Budget | Target |
|---|---:|
| Performance | ≥ 90 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | ≤ 2.0 s in the repeatable lab profile; ≤ 2.5 s at the field p75 |
| CLS | ≤ 0.05 |
| Total Blocking Time | ≤ 200 ms |
| Initial transferred page weight | ≤ 500 KiB |
| Initial JS transferred | ≤ 130 KiB where feasible |
| Mobile hero poster | ≤ 100 KiB |
| Mobile WebM | approximately ≤ 80 KiB |
| Desktop WebM | approximately ≤ 180 KiB |

The page is simple. Performance should feel effortless.

### 12.10 Accessibility

Meet WCAG 2.2 AA and preserve the current strong semantic foundation.

Required:

- One H1 per route
- Logical heading hierarchy
- Skip link
- Keyboard-complete navigation and motion control
- 44 × 44 px interactive targets where practical
- Visible focus on all interactive elements
- Contrast testing on every video/image frame, not only on the poster
- Meaningful alt text for informative images; empty alt for decorative imagery
- Accessible names for logo, LinkedIn, external links, and pause/play
- No information available only on hover
- Touch equivalent for every hover reveal
- Reduced-motion behavior
- Pause for continuous motion
- Correct language attribute
- Error-free zoom at 200% and reflow at 320 CSS px
- Server-rendered primary copy

Automated Lighthouse 100 is a floor, not proof of full conformance.

---

## 13. Execution plan for Claude Code

### Work package 0 — preflight and baseline

Deliverables:

- Repository/stack inventory
- Route and content-source map
- Existing asset inventory with rights/license status where known
- Baseline screenshots
- Baseline contact sheet or clearly named captures for: desktop hero/header, desktop first two scrolls through portfolio, full desktop page, 390 px mobile hero/header, 390 px mobile portfolio stack, portfolio route, fund route once built, and custom 404
- Baseline Lighthouse and link check
- Dependency-channel check: confirm no accidental React/framework canary is being shipped
- List of user-owned/unrelated working-tree changes to preserve
- Content gap list mapped to the inputs in section 16

Done when:

- Claude understands the actual repository and has not overwritten unrelated changes.
- All unverified facts are identified.

### Work package 1 — P0 trust repairs

Deliverables:

- Working licensed font or explicit approved replacement
- Valid Open Graph image, favicon/icon set, and structured-data asset URLs
- No broken or unnecessary manifest reference
- Staging/preview `noindex`
- Removed `/pitch` link from 404
- Privacy content aligned to current functionality, with legal-content blockers clearly marked and not deployed as final until approved
- Environment-aware metadata
- Redirect configuration drafted and tested locally

Done when:

- No asset 404s or console errors occur.
- No public page contains “pending,” “before this is published,” placeholder, or non-existent form language.

### Work package 2 — design foundations

Deliverables:

- Final color, type, spacing, grid, rule, link, button, surface, and motion tokens
- Local fonts and fallback metrics
- Global reset/base styles
- Focus and reduced-motion foundations
- Storybook or isolated component previews only if the repository already supports them; do not introduce a documentation platform solely for this project

Done when:

- Tokens cover the real page needs without a bloated abstract system.
- Key typography is visually verified at all target breakpoints.

### Work package 3 — global shell and hero

Deliverables:

- Header and mobile menu
- Hero content/layout
- Responsive ocean sources and poster
- Playback control
- Initial reveal and reduced-motion behavior
- Investment model strip

Done when:

- The first screen answers the four qualification questions.
- The hero works with video off, JavaScript off, reduced motion, and Save Data.

### Work package 4 — homepage proof and compression

Deliverables:

- Six-company featured portfolio
- Compressed thesis
- Four-item post-investment behavior section
- Founder proof, only if approved
- Decision-maker block
- Contact section
- Footer

Done when:

- Homepage copy is within the budget.
- The entire page tells one argument without repetition.
- No generic filler imagery remains.

### Work package 5 — portfolio

Deliverables:

- Shared company source of truth
- Refined all-company grid
- Concise descriptors
- Optical logo normalization
- Accessible external links and touch states
- No filters unless data scale now justifies them

Done when:

- Home and portfolio cannot drift.
- Every public company link, logo, name, and descriptor is verified.

### Work package 6 — fund and institutional layer

Deliverables:

- `/fund` page
- Public facts and people
- Approved institutional details
- Direct LP/partner contact
- Footer legal layer

Done when:

- An LP can find focus, model, team, organization, portfolio, and contact within two clicks.
- No confidential or unapproved fundraising information is exposed.

### Work package 7 — legal, SEO, and migration

Deliverables:

- Final privacy/terms as applicable
- Route metadata
- OG image
- JSON-LD
- Production robots and sitemap
- Preview noindex
- Old-route redirects
- Custom 404

Done when:

- All metadata URLs return 200.
- Production and preview crawling behavior differ correctly.
- A recursive link check finds no internal failures.

### Work package 8 — polish and verification

Deliverables:

- Responsive visual QA
- Browser QA
- Keyboard/screen-reader smoke test
- Reduced-motion and pause testing
- Performance optimization
- Final Lighthouse runs
- Final screenshot set
- Content/asset verification checklist
- Clean production build, lint, typecheck, and repository-native tests

Done when:

- Every acceptance criterion below passes.
- No required work is left hidden behind “follow-up polish.”

---

## 14. Acceptance criteria

### 14.1 Experience

- The first screen feels calm, ownable, and premium rather than conversion-oriented.
- Within the first screen and one natural scroll, a visitor can state focus, region, stage, ticket, and monthly cadence.
- Portfolio proof appears within the first two scrolls on desktop.
- A founder reaches a real person without completing a form.
- An LP reaches the fund model, people, institutional details, and contact within two clicks.
- Only one continuous motion layer exists.
- No section feels like a generic SaaS bento grid or content feed.

### 14.2 Content

- Homepage main copy is approximately 350–450 words, excluding names and legal text.
- No paragraph exceeds roughly 80 words.
- Homepage company descriptors are 10–14 words.
- Portfolio descriptors are approximately 22–28 words.
- One founder quote maximum; none if not strong and approved.
- No “not a venture fund,” “industrial angel,” pitch-upload, or draft legal language.
- All names, titles, tickets, cadence, locations, claims, and dates are verified.
- Capitalization is consistent: `Foundry Ventures` in prose; logo styling follows the brand asset.

### 14.3 Visual

- Licensed display font visibly renders; no fallback masquerades as final typography.
- Ocean poster and motion crops are art-directed at every breakpoint.
- Section edges share a consistent grid.
- No unintended overflow at 320 px.
- No generic stock imagery.
- All logo optical scales are intentionally reviewed.
- Hover, touch, keyboard, and reduced-motion states are all designed.

### 14.4 Technical

- Production build, lint, typecheck, and repository tests pass.
- No browser console errors or asset 404s.
- All internal and external links pass a link check at release time.
- Font files, OG image, favicon, Apple icon, logos, posters, and videos return correct content types.
- Mobile Lighthouse meets the budgets or any exception is documented with evidence.
- Staging is noindex; production is indexable.
- Sitemap includes only real canonical production routes.
- Legal utility routes follow the deliberate index/sitemap policy in section 12.5.
- Redirects return 301/308 and land on semantically correct destinations.
- Core content and links remain available without client JavaScript.

### 14.5 Accessibility and legal

- WCAG 2.2 AA manual smoke test passes.
- Continuous motion can be paused.
- Reduced-motion users receive a static, complete experience.
- Focus order follows visual order.
- Privacy notice matches actual data collection and has approved entity details.
- Any regulatory statement is counsel-approved and accurate.
- No unapproved founder quote, LP name, or investment fact is public.

---

## 15. QA matrix

### Viewports

- 320 × 568
- 375 × 812
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1280 × 720
- 1440 × 900
- 1728 × 1117
- 2560 × 1440

### Browsers/devices

- Safari on current iOS
- Chrome on current Android
- Safari on macOS
- Chrome on macOS/Windows
- Firefox on macOS/Windows
- Edge on Windows

### Modes

- Keyboard only
- Screen-reader smoke test with VoiceOver or NVDA
- Reduced motion
- Increased contrast where supported
- 200% browser zoom
- Save Data / slow 4G simulation
- Video blocked
- Images blocked
- JavaScript disabled for core-content check
- Dark-mode OS preference, ensuring the site remains intentionally branded rather than accidentally recolored

### Visual regression checkpoints

- Header at hero top
- Header after surface transition
- Hero with video and with poster
- Criteria desktop/mobile
- Portfolio card default/hover/focus/touch
- Thesis at short laptop height
- Decision-maker block with one, two, and three people only if those are real supported states
- Contact/footer boundary
- Portfolio grid last row
- Fund institutional details
- Privacy long-form typography
- 404

---

## 16. Content and asset inputs required from Foundry

The rebuild can proceed structurally without every input, but production release cannot.

### Required

- Confirmed public category language: fund, management company, or other legally accurate term
- Final legal entity name
- Organization/registration number
- Registered postal address
- Regulatory statement, if any
- Privacy contact and legally approved retention/log language
- Final public list of decision-makers
- Approved roles and 45–70 word biographies
- High-resolution, consistently art-directed portraits
- Confirmed direct contact owner and public email/telephone policy
- Latest public company list
- Approved logos and company URLs
- Short and long company descriptors
- Confirmation of ticket, stage, geography, and cadence wording
- Font license and files, or approval to replace
- Rights confirmation for ocean and editorial imagery
- Final Open Graph line

### Strongly recommended

- One approved, specific founder quote
- Up to three approved “what we saw at entry” facts
- One excellent real founder/community image
- One defensible operating metric beyond cadence, only if meaningful and public
- Decision on whether selected LP names or service providers may be public

### Graceful fallback when inputs are missing

- Missing quote → omit the module
- Missing real community imagery → use less imagery, not stock
- Missing entry facts → use concise company descriptors only
- Missing public LP data → keep `/fund` focused on strategy, people, and verified legal details
- Missing font license → ship an approved licensed replacement, not a broken imitation
- Missing legal approval → block production release of the affected page; do not publish draft language

---

## 17. Explicitly do not build

- Pitch form
- Deck upload
- Founder/LP audience toggle
- Chatbot
- Newsletter signup
- Blog or insights archive
- Press feed
- Jobs board
- Portfolio filters for a nine-company portfolio
- Autoplay testimonial carousel
- Multiple marquees
- Animated counters
- 3D globe or map
- AI particle field
- Generic bento grid
- Founder portal
- LP portal unless a real one already exists
- Public data room
- CMS migration without a demonstrated need
- Cookie banner if no consent-requiring technology exists
- Tracking stack “for later”
- Team directory padded with advisers or service providers to look larger
- Fake metrics, example quotes, or unsourced outcomes

---

## 18. Claude Code execution directive

Use the following as the operating instruction after this file is placed in the real site repository:

> Read `foundry-ventures-website-enhancement-project.md` completely, then inspect the repository and current working tree. Create a concise implementation plan mapped to the work packages in section 13. Preserve unrelated user changes. Execute the rebuild through verified, reviewable increments. Use the current stack and content source unless a change is justified. Do not invent or publish unverified fund, legal, team, LP, founder, or portfolio information. When approved content is missing, implement a graceful omission and record the exact requirement. Do not add features on the explicit exclusion list. After implementation, run the repository’s build, lint, typecheck, tests, link checks, responsive visual QA, accessibility smoke tests, and mobile/desktop Lighthouse. Do not call the work complete while P0 trust defects, placeholder content, asset failures, or acceptance-criteria failures remain.

---

## 19. Research sources

Primary live sources reviewed on 12 August 2026:

- Foundry live build: <https://foundryventures-production.up.railway.app/>
- Foundry portfolio: <https://foundryventures-production.up.railway.app/portfolio>
- Foundry privacy: <https://foundryventures-production.up.railway.app/privacy>
- First Round: <https://www.firstround.com/>
- Seedcamp: <https://seedcamp.com/>
- Pear VC: <https://pear.vc/>
- NFX: <https://www.nfx.com/>
- Precursor Ventures: <https://precursorvc.com/>
- LocalGlobe: <https://localglobecapital.com/>
- Phoenix Court: <https://www.phoenixcourt.vc/>
- Point Nine: <https://www.pointnine.com/>
- Kima Ventures: <https://kimavc.com/>
- Speedinvest: <https://www.speedinvest.com/>
- Creandum: <https://creandum.com/>
- Creandum design case study: <https://immersive-g.com/projects/creandum/>

The competitor scores are a design/audience assessment for this brief, not a claim about investment performance. Any time-sensitive metric or page feature should be rechecked before using it in public copy.

---

## Final direction in one paragraph

Keep Foundry small on purpose. Let the ocean, wordmark, editorial type, and one clear thesis create the arrival. Follow immediately with the six operating facts and a curated portfolio. Explain the team-first logic once, show exactly what changes after the cheque, put a real decision-maker and one specific founder proof in view, and end in a direct conversation. Give LPs a quiet fund page with people, model, organization, and verified legal facts. Remove every draft, contradictory, generic, or conversion-led element. The result should not look like Foundry added a website department; it should look like the fund has always known exactly what it is.
