/**
 * Home page seed content.
 *
 * Rewritten on 2026-08-11 for the repositioning the owner set out: Foundry is
 * not a venture fund but a high-frequency, team-only investor in AI. Every
 * user-visible string below is `authoredOnInstruction` — written for that brief
 * and approved by it, but explicitly not reviewed line by line, which the
 * integrity report keeps saying until someone does.
 *
 * What the copy asserts as fact, all of it stated by the owner:
 *   - cheques are €100k or €200k, nothing in between and nothing outside;
 *   - one to three investments a month;
 *   - AI only, teams only, industry agnostic;
 *   - the offer after the cheque is customer introductions, legal and
 *     operations support, and the portfolio community.
 *
 * What it deliberately does **not** claim: returns, fund size, portfolio
 * outcomes, response times, or any number nobody has given us.
 *
 * The previous Appendix C copy (services-as-a-software, "the era of", the three
 * Vision paragraphs) described the old position and is superseded. It remains in
 * git history and in the buildspec's Appendix C if it is ever needed.
 */

import type { HomePage } from "../types";
import { authoredOnInstruction } from "./evidence";
import { ARCHITECTURE_IMAGE, DEFAULT_OG_IMAGE, OCEAN_IMAGE, SILHOUETTE_IMAGE } from "./images";
import { ANDERS_REF } from "./team";
import { SEED_COMPANIES } from "./companies";

export const SEED_HOME_PAGE: HomePage = {
  publicationStatus: "published",

  hero: {
    // The two rules, in the order they disqualify people. Anyone outside them
    // saves a meeting, which is the point of putting them this high.
    eyebrow: authoredOnInstruction("AI only · Teams only · Nordics"),
    /*
     * The position stated as two rules rather than a label. "Industrialised
     * super angel" is the internal shorthand, but "super angel" already means a
     * prolific individual investor, and a coined compound has to be explained
     * every time it is used. Rules travel; labels get forgotten. The term itself
     * appears once, as a definition, in the thesis below.
     */
    heading: authoredOnInstruction("We only invest in AI. We only invest in teams."),
    paragraphs: [
      authoredOnInstruction(
        "Foundry is not a venture fund. We write €100k or €200k into AI teams, one to three times a month, and we decide on the people in front of us — not on a market map, a moat, or a product that does not exist yet.",
      ),
      authoredOnInstruction(
        "After the cheque we do the two things founders actually ask for: we introduce you to customers, and we take legal and operations off your desk. Around that sits a community of AI founders solving the same problems in the same month.",
      ),
    ],
    /*
     * The primary CTA still points at `/pitch`, which is behind a disabled flag,
     * so the page hides it and promotes the secondary. Keeping the destination
     * here rather than repointing it means re-enabling the flag restores the
     * pair intact instead of leaving two buttons to the same place.
     */
    primaryCta: { label: authoredOnInstruction("Talk to us"), href: "/pitch" },
    secondaryCta: { label: authoredOnInstruction("See the portfolio"), href: "/portfolio" },
    image: OCEAN_IMAGE,
  },

  vision: {
    eyebrow: authoredOnInstruction("Thesis"),
    /*
     * This is the argument that makes "we ignore PMF and moats" read as a
     * deliberate bet rather than an absence of diligence — which is the first
     * thing a co-investor or an LP will test the position against.
     */
    heading: authoredOnInstruction("In AI, the team is the only thing that compounds"),
    paragraphs: [
      authoredOnInstruction(
        "Almost everything a venture investor is trained to price has become unreliable. Models change monthly. Product surfaces get rebuilt in a weekend. A moat described in a deck rarely survives the next release. What still compounds is a small group of people who ship faster than the field moves.",
      ),
      authoredOnInstruction(
        "So we stopped pretending to price the rest. We do not size your market for you, we do not ask for a competitive matrix, and we are not looking for a defensibility story written before you have customers. We back the team, at a fixed cheque, and we do it often.",
      ),
      authoredOnInstruction(
        "That is a different job from venture capital and it needs a different shape: a decision measured in conversations rather than months, a standing offer of capital and customer introductions, and a portfolio that behaves like a working group instead of a list of logos. If it needs a name, call it an industrial angel.",
      ),
    ],
  },

  offering: {
    eyebrow: authoredOnInstruction("What you get"),
    items: [
      {
        number: "01",
        body: authoredOnInstruction(
          "Capital. €100k or €200k, decided on the team, one to three times a month.",
        ),
      },
      {
        number: "02",
        body: authoredOnInstruction(
          "Customer introductions. The first thing founders ask for, and the thing we spend most of our time on.",
        ),
      },
      {
        number: "03",
        body: authoredOnInstruction(
          "Operations support best practices so you can build, ship and scale.",
        ),
      },
      {
        number: "04",
        body: authoredOnInstruction(
          "A working community of AI founders hitting the same problems in the same month, with dedicated channels and events.",
        ),
      },
    ],
    images: [ARCHITECTURE_IMAGE, SILHOUETTE_IMAGE],
  },

  featuredPortfolio: {
    heading: authoredOnInstruction("The teams we back"),
    companyIds: SEED_COMPANIES.slice(0, 9).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
    })),
    /*
     * No trailing link under the tiles, on owner instruction 2026-08-11: the
     * hero's own button and the footer already reach the archive, and a third
     * link directly beneath nine cards that are themselves links added nothing.
     * The destination stays so restoring it means supplying a label again.
     */
    ctaLabel: undefined,
    ctaHref: "/portfolio",
  },

  optionalSections: {
    statsHeading: authoredOnInstruction("Foundry in numbers"),
    testimonialsHeading: authoredOnInstruction("From the teams we back"),
    latestInsightsHeading: authoredOnInstruction("News & Insights"),
    latestInsightsCtaLabel: authoredOnInstruction("See all insights"),
  },

  contact: {
    heading: authoredOnInstruction("Building an AI company?"),
    paragraphs: [
      authoredOnInstruction(
        "We decide on the team, so the fastest way to start is a conversation rather than a document. You do not need a deck.",
      ),
      authoredOnInstruction("Email Anders and tell us who you are building with."),
    ],
    primaryCta: { label: authoredOnInstruction("Talk to us"), href: "/pitch" },
    secondaryCta: { label: authoredOnInstruction("Email Anders"), contactPerson: ANDERS_REF },
    contactPeople: [ANDERS_REF],
  },

  seo: {
    title: "Foundry Ventures",
    description:
      "We back AI teams in the Nordics with €100k or €200k, one to three times a month. Team-only conviction, plus capital and customer introductions.",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "approved",
    sources: [
      {
        label: "Content owner repositioning brief",
        observedAt: "2026-08-11",
        note: "AI only, teams only, €100k/€200k cheques, one to three investments a month",
      },
    ],
  },
};
