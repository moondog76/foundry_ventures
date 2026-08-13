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
  /**
   * The homepage card descriptor: 10-14 words (§8.4). One clause, no second
   * sentence — nine of these sit in a grid and any longer turns proof of taste
   * into a corporate directory.
   */
  cardDescriptor: string;
  /**
   * The portfolio-page descriptor: 22-28 words (§8.10). Room for what the
   * company does and who it is for, still short enough to scan down a column.
   */
  descriptor: string;
  logo: Company["logo"];
  logoFit: NonNullable<Company["logoFit"]>;
  /** Which field the supplied artwork needs — measured, not guessed. */
  logoSurface: NonNullable<Company["logoSurface"]>;
  opticalScale: number;
  sortOrder: number;
  /** Anything a reviewer must know about this record. Surfaces in the report. */
  reviewNote?: string;
};

/**
 * §8.4 and §8.10 give the two descriptor lengths as hard budgets. They are
 * enforced here rather than trusted, because the failure mode is silent: an
 * over-long card descriptor does not break anything, it just quietly turns the
 * homepage grid back into the corporate directory the rebuild set out to remove.
 */
function assertDescriptorBudget(name: string, field: string, text: string, min: number, max: number) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < min || words > max) {
    throw new Error(
      `${name}: ${field} is ${words} words, outside the ${min}-${max} word budget. Edit the copy rather than the budget.`,
    );
  }
}

function seedCompany(input: SeedCompanyInput): Company {
  assertDescriptorBudget(input.name, "cardDescriptor", input.cardDescriptor, 10, 14);
  assertDescriptorBudget(input.name, "descriptor", input.descriptor, 22, 28);

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
    // Two lengths, one provenance: both are compressions of the same
    // website-drafted source, so they share an evidence record.
    tagline: input.cardDescriptor,
    shortDescription: input.descriptor,
    websiteUrl: input.websiteUrl,
    featured: true,
    sortOrder: input.sortOrder,
  };
}

/**
 * Display order.
 *
 * This started as the observed live order (§8.5) — Empley, Agaton, Grand,
 * Wilgot, Openroll, Newly, Skattio, Memmo — and is now an editorial decision on
 * top of it: BuilderBase was added 2026-08-11, Monava 2026-08-13, and the owner
 * swapped Memmo and Empley on 2026-08-13, putting Memmo in the lead tile.
 *
 * `sortOrder` is the single source of truth for the order, not the position of
 * a record in this array — a swap is one number rather than a block move, and
 * the diff shows which company changed rank rather than a wall of relocated
 * lines. `seed/home.ts` sorts by it before building the featured list, so the
 * home grid and `/portfolio` cannot disagree.
 */
export const SEED_COMPANIES: Company[] = [
  seedCompany({
    slug: "empley",
    name: "Empley",
    websiteUrl: "https://empley.com/",
    cardDescriptor:
      "Workforce planning tied to strategy and budget, watched by AI agents.",
    descriptor:
      "Connects workforce planning to strategy and financial execution. Its agents flag capacity gaps, recommend where to hire or upskill, and track the decision through.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.empley,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 80,
  }),
  seedCompany({
    slug: "agaton",
    name: "Agaton",
    websiteUrl: "https://www.agaton.ai/",
    cardDescriptor:
      "Real-time voice coaching for sales and service teams, inside their own tools.",
    descriptor:
      "Builds AI agents for sales and service teams, using voice analysis to coach people in real time inside the systems those teams already run.",
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
    cardDescriptor:
      "Cloud property management for hotels and venues, with AI through operations.",
    descriptor:
      "A cloud property management system covering bookings, calendars, catering, proposals and housekeeping for hotels and venues, with AI assistance running through daily operations.",
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
    cardDescriptor:
      "Rewrites product catalogues so AI shopping agents can find them.",
    descriptor:
      "Rewrites retail product catalogues so AI search, ad systems and shopping agents can find and recommend them, generating content built for agentic commerce.",
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
    cardDescriptor:
      "Compensation reviews, headcount planning and budgets, answered in plain language with an audit trail.",
    descriptor:
      "Automates compensation reviews, headcount planning and budget tracking on top of existing People and Finance systems, answering questions in plain language with auditable results.",
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
    cardDescriptor:
      "Turns a plain-English brief into a shipped native iOS and Android app.",
    descriptor:
      "Turns a plain-English description of an app into a working native build for iOS and Android, handing over the full React Native source code.",
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
    cardDescriptor:
      "Finds where a Swedish company's salary and dividend decisions cost money.",
    descriptor:
      "Reads a Swedish limited company's bookkeeping and finds where salary, dividend and preliminary-tax decisions cost the owner money, quantified as specific recommendations.",
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
    cardDescriptor:
      "Runs hackathons, accelerators and sprints end to end from one place.",
    descriptor:
      "Runs hackathons, accelerators and sprints from a single tool, covering applications, team formation, judging, sponsors and reporting instead of spreading them across several.",
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
    cardDescriptor:
      "Turns course notes and lectures into quizzes, flashcards, summaries and podcasts.",
    descriptor:
      "Turns course notes, documents and lectures into quizzes, flashcards, summaries and podcasts, tracking what a student knows across a library of 300,000+ textbooks.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.memmo,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 0.92,
    sortOrder: 10,
    reviewNote:
      "Consistent with the linked study platform observed 2026-08-10, but still requires editorial approval.",
  }),
  seedCompany({
    slug: "monava",
    name: "Monava",
    websiteUrl: "https://www.monava.io/",
    /*
     * Drafted from monava.io on 2026-08-13, the same provenance as the other
     * nine. Their own first line is "a defence company developing acoustic
     * machine learning" — the category is theirs, not an inference, and it is
     * kept because a reader who follows the link will find it in one sentence.
     */
    cardDescriptor:
      "Acoustic machine learning that detects, classifies and locates drones by sound.",
    descriptor:
      "A defence company applying machine learning to acoustic sensing, detecting, classifying and locating aerial and ground sound sources in conditions that defeat cameras and radar.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.monava,
    // A white wordmark on transparent — measured mean luminance 255, so it is
    // invisible on anything but a dark field.
    logoSurface: "dark",
    logoFit: "wide",
    // Aspect 6.20, between Grand (6.11) and BuilderBase (6.42), so it takes the
    // same optical reduction those two carry.
    opticalScale: 0.92,
    sortOrder: 100,
  }),
];
