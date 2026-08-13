/**
 * `/fund` — the quiet institutional layer (§8.11).
 *
 * The audit's largest finding was an audience gap, not a content gap: the site
 * worked for founders and scored 5.8/10 for LPs, because the public team was
 * one name in a closing paragraph and the operating model was asserted rather
 * than evidenced. This page answers the LP questions one click from the
 * homepage, without turning the public brand into fundraising collateral.
 *
 * Held to §8.11's budget: ~400-500 words, four modules, no repeated homepage
 * copy. The facts strip is not duplicated here as prose — it renders from the
 * same `investmentCriteria` source as the homepage, so the two cannot drift.
 *
 * What is deliberately absent, per §8.11's explicit exclusions and §16's
 * fallback rules: fund size, vintage, deployment data, target or historic
 * returns, named LPs, service providers, a data room, a portal and any form.
 * None of those are approved for public distribution, and §16 says a missing
 * input becomes a graceful omission rather than a placeholder.
 *
 * The institutional disclosure block — legal entity, registered address,
 * organisation number, regulatory statement — is NOT here. It renders only when
 * `featureFlags.institutionalDetails` is on, which requires counsel-approved
 * values. §16: missing legal approval blocks release of the affected content
 * rather than shipping draft language, which is exactly the defect the audit
 * found on `/privacy`.
 */

import type { FundPage } from "../types";
import { fromEnhancementBrief } from "./evidence";
import { DEFAULT_OG_IMAGE } from "./images";
import { ANDERS_REF } from "./team";

export const SEED_FUND_PAGE: FundPage = {
  publicationStatus: "published",

  hero: {
    heading: fromEnhancementBrief("A focused system for early-stage AI in the Nordics."),
    // 41 words, inside the 45-word ceiling.
    intro: fromEnhancementBrief(
      "Foundry writes first cheques into AI teams in the Nordics. One decision lens, two cheque sizes, and a pace set by the founders rather than by a quarterly cycle. The same six facts govern every investment.",
    ),
  },

  factsHeading: fromEnhancementBrief("How we invest"),

  model: {
    heading: fromEnhancementBrief("Why the model looks like this"),
    /*
     * 88 words, inside the 70-100 budget. This is the LP-facing version of the
     * homepage thesis and deliberately makes a different argument: the homepage
     * says what Foundry underwrites, this says why that is a repeatable system
     * rather than opportunistic angel activity — which §2.2 lists as the
     * question an LP cannot currently answer.
     */
    body: fromEnhancementBrief(
      "Conventional early-stage underwriting prices a market, a product and a defensibility story. In AI, all three are re-drawn faster than a diligence process completes, so precision there is false precision. Underwriting the team instead is not a softer test — it is a narrower one, and a narrow test can be run consistently. Fixed cheques remove the negotiation. A short decision path removes the calendar. What remains is the judgement, applied the same way every time.",
    ),
    steps: [
      {
        number: "01",
        title: fromEnhancementBrief("Conversations, then a decision"),
        body: fromEnhancementBrief(
          "We meet the team, not the deck. The decision is ours to make quickly and to explain either way.",
        ),
      },
      {
        number: "02",
        title: fromEnhancementBrief("The first cheque"),
        body: fromEnhancementBrief(
          "€100k or €200k on standard terms, sized to the team and how fast they need to move.",
        ),
      },
      {
        number: "03",
        title: fromEnhancementBrief("Customers and operating work"),
        body: fromEnhancementBrief(
          "Introductions where there is real fit, practical operating support, and a founder group solving the same problems.",
        ),
      },
    ],
  },


  /*
   * There is no "Who decides" block. It was removed on owner instruction
   * 2026-08-13, which reverses §8.7 — the audit called the absent public team
   * the single largest audience gap and scored LP confidence 5.8/10 largely on
   * it. The contact section below carries Anders's portrait, name, role and
   * direct address instead, so the page still shows a real person; what it no
   * longer does is present him as the investment decision-maker.
   */
  contact: {
    heading: fromEnhancementBrief("Talk to us"),
    body: fromEnhancementBrief(
      "Founders and prospective investors reach the same person. There is no separate investor-relations desk, and pretending otherwise would misdescribe how Foundry works.",
    ),
    contactPerson: ANDERS_REF,
  },

  seo: {
    title: "The fund",
    description:
      "How Foundry invests: early-stage AI in the Nordics, €100k or €200k first cheques, one to three teams a month, and a team-first decision lens.",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "approved",
    sources: [
      {
        label: "Foundry Ventures website enhancement brief",
        observedAt: "2026-08-12",
        note: "§8.11 fund page structure and explicit exclusions",
      },
    ],
  },
};
