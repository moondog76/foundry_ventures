/**
 * Home page seed content.
 *
 * Rewritten 2026-08-12 against the website enhancement brief. The previous
 * version ran to 783 main-content words; §6.7 budgets 350-450. The compression
 * is the point rather than a side effect — the audit's finding was that the page
 * restated one argument across the hero, criteria, thesis, offering, contact and
 * footer instead of letting each section prove the one before it.
 *
 * Three copy directions here reverse copy the owner wrote or approved on
 * 11 August. They are implemented because §6.5 is explicit about all three, and
 * each is logged in `docs/content-gaps.md` §F3 with its one-line revert:
 *
 *   1. "Foundry is not a venture fund" is deleted (§6.5) — read by the audit as
 *      category confusion that undercuts a fund actively raising.
 *   2. "Industrial angel" is removed from public copy (§6.5). It may survive as
 *      internal shorthand; it is no longer the public category.
 *   3. "We only invest in teams" becomes "We invest in teams first" (§6.4), so
 *      the line cannot be read as "Foundry does not care about the market".
 *
 * What the copy still asserts as fact, all owner-stated: cheques are €100k or
 * €200k; one to three investments a month; AI only; Nordics; team-first
 * underwriting; introductions, operating support and the founder community after
 * the cheque. It claims no returns, fund size, outcomes or response times.
 */

import type { HomePage } from "../types";
import { authoredOnInstruction, fromEnhancementBrief, ownerWrote } from "./evidence";
import { DEFAULT_OG_IMAGE, OCEAN_IMAGE } from "./images";
import { ANDERS_REF } from "./team";
import { SEED_COMPANIES } from "./companies";

export const SEED_HOME_PAGE: HomePage = {
  publicationStatus: "published",

  hero: {
    // Category and ticket, per §6.4. The previous eyebrow repeated the headline's
    // "AI only / Teams only" directly above the headline itself; this one adds
    // the qualifying fact instead of saying the same thing twice.
    eyebrow: fromEnhancementBrief("Nordic AI pre-seed · €100k / €200k"),
    heading: fromEnhancementBrief("We only invest in AI. We invest in teams first."),
    /*
     * One paragraph, 22 words. The audit found both of the old hero paragraphs
     * were still going after the reader had understood the proposition.
     *
     * This is the lower-claim variant §6.4 offers. The higher-claim version —
     * "help create the first customer momentum" — is only publishable if the
     * portfolio can substantiate it, and that evidence has not been gathered.
     */
    paragraphs: [
      fromEnhancementBrief(
        "One to three teams a month. We underwrite a team’s rate of learning, then stay close through the earliest commercial questions.",
      ),
    ],
    primaryCta: { label: fromEnhancementBrief("Meet the teams"), href: "/portfolio" },
    secondaryCta: { label: fromEnhancementBrief("The fund"), href: "/fund" },
    image: OCEAN_IMAGE,
  },

  vision: {
    eyebrow: authoredOnInstruction("Thesis"),
    // Retained verbatim: §6.5 marks this the best thesis line on the page.
    heading: authoredOnInstruction("In AI, the team is the only thing that compounds"),
    /*
     * One paragraph, 66 words, inside the 55-75 budget. The old version ran to
     * three paragraphs and ended on "call it an industrial angel", which §6.5
     * removes from public copy.
     *
     * The last two sentences carry the reframe §6.5 asks for. The old copy said
     * Foundry does not size markets and does not ask for a competitive matrix,
     * which reads as an absence of diligence. This says the same thing as a claim
     * about what is knowable this early, which is the actual argument.
     */
    paragraphs: [
      fromEnhancementBrief(
        "Models change monthly. Products get rebuilt in a weekend. Almost everything an investor is trained to price at this stage is provisional, and a defensibility story written before the first customer is a guess in a suit. What is legible early is how fast a team learns. That is what we underwrite, at a fixed cheque and a short decision path.",
      ),
    ],
  },

  offering: {
    /*
     * §6.5 replaces "What you get": it framed Foundry as a package of services.
     * The four item bodies are the owner's own words, supplied 2026-08-12, and
     * are kept as written — the audit's objection was to the heading, not these.
     */
    eyebrow: fromEnhancementBrief("What changes after Foundry"),
    items: [
      {
        number: "01",
        body: ownerWrote("Capital. €100k or €200k, depending on the team and need for speed."),
      },
      {
        number: "02",
        body: ownerWrote(
          "Introductions. The first thing founders ask for, and the thing we spend most of our time on. Customers, talent, partners.",
        ),
      },
      {
        number: "03",
        body: ownerWrote(
          "Operations. Best practices, do’s and don’ts and more, so you can build, ship and scale.",
          {
            normalizationNote:
              "Supplied as “do´s and donuts”. Read as a typo for “don’ts” and corrected, and the acute accent set as a typographic apostrophe. Revert if the pun was intended.",
          },
        ),
      },
      {
        number: "04",
        body: ownerWrote(
          "Community. Nothing is more valuable than getting and giving support with true peers, AI-native builders.",
          {
            normalizationNote:
              "Double space closed; “AI native” hyphenated to “AI-native” per the §25.2 house style.",
          },
        ),
      },
    ],
  },

  featuredPortfolio: {
    heading: authoredOnInstruction("The teams we back"),
    /*
     * §8.4 wants six editorially selected companies — and says in the same
     * section that Foundry, not Claude Code, must approve which six and in what
     * order, and that until that decision exists the build preserves data order
     * and renders all nine. That is what happens here: nine, in observed live
     * order. The selection is logged in `docs/content-gaps.md` §C as the open
     * content decision it is, rather than guessed from public signals.
     */
    companyIds: SEED_COMPANIES.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    ctaLabel: fromEnhancementBrief("See all teams"),
    ctaHref: "/portfolio",
  },

  contact: {
    heading: fromEnhancementBrief("Building a Nordic AI company?"),
    paragraphs: [
      fromEnhancementBrief(
        "Start with a conversation. A deck is optional. Tell us who you are building with and what you have learned faster than everyone else.",
      ),
    ],
    // One action. No pitch route exists and none is coming (§17), so the direct
    // human path is the only path — which the audit found already worked.
    primaryCta: { label: fromEnhancementBrief("Email Anders"), contactPerson: ANDERS_REF },
    contactPeople: [ANDERS_REF],
  },

  seo: {
    title: "Foundry Ventures",
    description:
      "Nordic AI pre-seed. We write €100k or €200k into one to three teams a month, and underwrite the team before the market.",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "approved",
    sources: [
      {
        label: "Foundry Ventures website enhancement brief",
        observedAt: "2026-08-12",
        note: "§6.4 hero direction, §6.5 copy actions, §6.7 word budget",
      },
    ],
  },
};
