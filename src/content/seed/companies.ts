/**
 * Portfolio seed data.
 *
 * Source: Appendix C.4 — the frozen 2026-08-10 live snapshot. Hard rules from
 * §8.5 that this file obeys literally:
 *
 *  - The content owner approved publication on 2026-08-11. Approval covers only
 *    what Foundry already publishes about each company: name, website, logo and
 *    the live caption. Taxonomy, status, founders, investment year and deal lead
 *    stay `unverified` — the live site states none of them, so neither do we.
 *  - Descriptions are two sentences drafted from each company's own website on
 *    owner instruction (2026-08-11), replacing the live captions. The claims are
 *    the companies' own; the wording is a summary Foundry has not read line by
 *    line, and the evidence note says so.
 *  - The prototype's note fields (Openroll = "AI-native hiring", Agaton =
 *    "Industrial software") are placeholders and are NOT seeded.
 *  - BuilderBase was confirmed as a portfolio company by the owner on
 *    2026-08-11. Natively and Bright are still NOT added.
 *  - "Agaton Group" (prototype) is not merged with "Agaton" (live).
 *  - No stage/sector/focus/status is seeded: the live site publishes no
 *    taxonomy, so inventing one would be fabricating facts.
 *
 * `sortOrder` records the observed live ordering, flagged in
 * `docs/content-gaps.md` as a migration observation rather than a decision.
 */

import type { Company } from "../types";
import {
  FOUNDRY_PORTFOLIO_SOURCE,
  draftedFromCompanySite,
  ownerApprovedFromLive,
  ownerConfirmed,
  unverified,
} from "./evidence";
import { SUPPLIED_PORTFOLIO_LOGOS } from "./images";

/**
 * The content owner supplied the portfolio logo files directly on 2026-08-11,
 * which is an owner approval of the artwork itself — not of any other company
 * fact. Names, taglines, taxonomy and status all remain `observed`.
 */
const LOGO_SUPPLIED = ownerConfirmed("Logo file supplied directly by the content owner");

type SeedCompanyInput = {
  slug: string;
  name: string;
  /** Omitted when the owner has not supplied one; never guessed. */
  websiteUrl?: string;
  /** Two sentences drafted from the company's own website. */
  description: string;
  logo: Company["logo"];
  logoFit: NonNullable<Company["logoFit"]>;
  /** Which field the supplied artwork needs — measured, not guessed. */
  logoSurface: NonNullable<Company["logoSurface"]>;
  opticalScale: number;
  sortOrder: number;
  /** Anything a reviewer must know about this record. Surfaces in the report. */
  reviewNote?: string;
};

function seedCompany(input: SeedCompanyInput): Company {
  // Descriptions are drafted from each company's own website (owner instruction,
  // 2026-08-11), so the claims are the company's own rather than invented. The
  // evidence records the site it came from and that Foundry has not yet read it.
  const base = input.websiteUrl
    ? draftedFromCompanySite(input.websiteUrl)
    : unverified(`No website to describe ${input.name} from`);
  const descriptionEvidence = input.reviewNote
    ? { ...base, note: [base.note, input.reviewNote].filter(Boolean).join(" — ") }
    : base;

  return {
    id: `company-${input.slug}`,
    name: input.name,
    slug: input.slug,
    publicationStatus: "published",
    verificationStatus: "partially-verified",
    dataCompleteness: {
      // Name, website and logo are owner-approved; editorial copy is not.
      coreIdentity: true,
      editorial: false,
      relations: false,
      seo: false,
    },
    fieldEvidence: {
      name: ownerApprovedFromLive(FOUNDRY_PORTFOLIO_SOURCE),
      websiteUrl: input.websiteUrl
        ? ownerApprovedFromLive(FOUNDRY_PORTFOLIO_SOURCE)
        : unverified("No website URL supplied yet"),
      logo: LOGO_SUPPLIED,
      tagline: descriptionEvidence,
      shortDescription: descriptionEvidence,
      body: unverified("No long description exists on the live site"),
      stages: unverified("Live site publishes no stage taxonomy"),
      sectors: unverified("Live site publishes no sector taxonomy"),
      focuses: unverified("Live site publishes no focus taxonomy"),
      status: unverified("Live site publishes no active/exited status"),
      founders: unverified("Not published on the live site"),
      headquarters: unverified("Not published on the live site"),
      investmentYear: unverified("Not published on the live site"),
      dealLead: unverified("Not published on the live site"),
      whyWeInvested: unverified("Does not exist yet"),
    },
    logo: input.logo,
    logoAlt: `${input.name} logo`,
    logoFit: input.logoFit,
    logoSurface: input.logoSurface,
    opticalScale: input.opticalScale,
    // The description doubles as the card tagline; both share one evidence record.
    tagline: input.description,
    shortDescription: input.description,
    websiteUrl: input.websiteUrl,
    featured: true,
    sortOrder: input.sortOrder,
  };
}

/**
 * Observed live order (§8.5): Empley, Agaton, Grand, Wilgot, Openroll, Newly,
 * Skattio, Memmo — then BuilderBase, which the owner added on 2026-08-11.
 */
export const SEED_COMPANIES: Company[] = [
  seedCompany({
    slug: "empley",
    name: "Empley",
    websiteUrl: "https://empley.com/",
    description:
      "Empley connects workforce planning to business strategy and financial execution in a single platform. Its AI agents watch for capacity gaps, recommend where to hire, reallocate or upskill, and track those decisions through to execution.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.empley,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 10,
  }),
  seedCompany({
    slug: "agaton",
    name: "Agaton",
    websiteUrl: "https://www.agaton.ai/",
    description:
      "Agaton builds AI agents for sales and customer service teams, using voice analysis to coach people in real time. It plugs into the systems a team already runs, with the aim of lifting conversion rates and turning service into a revenue function.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.agaton,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 20,
    reviewNote:
      'Must not be merged with the prototype\'s separate "Agaton Group" entry without owner confirmation.',
  }),
  seedCompany({
    slug: "grand",
    name: "Grand",
    websiteUrl: "https://grandsystems.com/en/",
    description:
      "Grand is a cloud property management system for hotels and venues, covering bookings, calendars, catering, proposals and housekeeping in one place. AI assistance runs through the operations so teams can do more across every guest interaction.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.grand,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 0.95,
    sortOrder: 30,
  }),
  seedCompany({
    slug: "wilgot",
    name: "Wilgot",
    websiteUrl: "https://www.wilgot.ai/",
    description:
      "Wilgot rewrites product catalogues so AI search engines, ad systems and shopping agents can find and recommend what a retailer sells. It reads real customer queries and market data to generate product content built for agentic commerce.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.wilgot,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 0.9,
    sortOrder: 40,
  }),
  seedCompany({
    slug: "openroll",
    name: "Openroll",
    websiteUrl: "https://www.openroll.com/",
    description:
      "Openroll connects to the systems People and Finance teams already run and automates compensation reviews, headcount planning and budget tracking. Teams ask questions in plain language and get auditable answers and live dashboards back.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.openroll,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 50,
    reviewNote:
      "The dash before 'bringing' is a non-ASCII character in the live source; confirm the exact glyph on export.",
  }),
  seedCompany({
    slug: "newly",
    name: "Newly",
    websiteUrl: "https://newly.app/",
    description:
      "Newly turns a plain-English description of an app into a working native build for iOS and Android. It handles design, development and deployment on React Native and Expo, and hands over the full source code.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.newly,
    // The supplied artwork is a black square with the wordmark inside it, not a
    // transparent mark. It fills the frame so the card reads as one solid tile,
    // the same weight as Grand's, instead of a small square on another colour.
    logoSurface: "dark",
    logoFit: "bleed",
    opticalScale: 1,
    sortOrder: 60,
  }),
  seedCompany({
    slug: "skattio",
    name: "Skattio",
    websiteUrl: "https://skattio.se/",
    description:
      "Skattio reads a Swedish limited company's bookkeeping and finds where salary, dividend and preliminary-tax decisions are costing it money. It turns that into specific, quantified recommendations for the owner.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.skattio,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 70,
  }),
  seedCompany({
    slug: "builderbase",
    name: "BuilderBase",
    // Supplied by the content owner 2026-08-11.
    websiteUrl: "https://builderbase.com/",
    description:
      "BuilderBase runs hackathons, accelerators and sprints from one place, covering applications, team formation, judging, sponsors and reporting. It is built to keep the administration of an event in a single tool rather than spread across several.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.builderbase,
    // Measured luminance 61 — a dark mark that needs a light field.
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 0.92,
    sortOrder: 90,
  }),
  seedCompany({
    slug: "memmo",
    name: "Memmo",
    websiteUrl: "https://www.memmo.org/",
    description:
      "Memmo turns course notes, documents and lectures into quizzes, flashcards, summaries and podcasts. It tracks what a student actually knows and connects to a library of more than 300,000 textbooks.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.memmo,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 0.92,
    sortOrder: 80,
    reviewNote:
      "Consistent with the linked study platform observed 2026-08-10, but still requires editorial approval.",
  }),
];
