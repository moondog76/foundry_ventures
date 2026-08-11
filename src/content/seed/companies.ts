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
 *  - Newly, Skattio and BuilderBase have **no** caption. None is invented; those
 *    cards render the logo and the name alone.
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
  /** Verbatim live caption, or null when the live site has none. */
  caption: string | null;
  logo: Company["logo"];
  logoFit: NonNullable<Company["logoFit"]>;
  /** Which field the supplied artwork needs — measured, not guessed. */
  logoSurface: NonNullable<Company["logoSurface"]>;
  opticalScale: number;
  sortOrder: number;
  captionNote?: string;
};

function seedCompany(input: SeedCompanyInput): Company {
  // A live caption is Foundry's own published copy, approved with the rest of
  // the migration. Where the live site has none, none is invented — the card
  // simply shows the logo and the name (§C.6).
  const captionEvidence = input.caption
    ? ownerApprovedFromLive(FOUNDRY_PORTFOLIO_SOURCE)
    : unverified(`No caption exists for ${input.name}; nothing may be invented`);

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
      tagline: captionEvidence,
      shortDescription: captionEvidence,
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
    // Captions double as the tagline candidate; both stay behind the same evidence.
    tagline: input.caption ?? undefined,
    shortDescription: input.caption ?? undefined,
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
    caption:
      "Empley is the AI-powered simulation platform helping enterprises model, plan, and optimize their workforce - faster, smarter, and automated.",
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
    caption:
      "Agaton delivers AI sales superiority for higher conversion rates, driving measurable revenue growth and rapid ROI.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.agaton,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 20,
    captionNote:
      'Must not be merged with the prototype\'s separate "Agaton Group" entry without owner confirmation.',
  }),
  seedCompany({
    slug: "grand",
    name: "Grand",
    websiteUrl: "https://grandsystems.com/en/",
    // The live source has a hard line break between the two sentences.
    caption:
      "AI-assisted hospitality management.\nWe help you do more across all hospitality operations, delivering excellence in every guest interaction.",
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
    caption:
      "Wilgot upgrades your product catalog so AI search engines, ad systems, and shopping agents can find, recommend, and sell your products.",
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
    caption:
      "Openroll is reimagining how Compensation and People teams work, automate, and operate with AI—bringing all data into one collaborative platform.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.openroll,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 50,
    captionNote:
      "The dash before 'bringing' is a non-ASCII character in the live source; confirm the exact glyph on export.",
  }),
  seedCompany({
    slug: "newly",
    name: "Newly",
    websiteUrl: "https://newly.app/",
    // No <figcaption> exists on the live site. Nothing is invented (§C.6).
    caption: null,
    logo: SUPPLIED_PORTFOLIO_LOGOS.newly,
    // The supplied artwork is a black tile rather than a transparent mark, so
    // it reads as a deliberate tile against the light field and disappears
    // against a dark one.
    logoSurface: "light",
    logoFit: "compact",
    opticalScale: 1.25,
    sortOrder: 60,
  }),
  seedCompany({
    slug: "skattio",
    name: "Skattio",
    websiteUrl: "https://skattio.se/",
    caption: null,
    logo: SUPPLIED_PORTFOLIO_LOGOS.skattio,
    logoSurface: "dark",
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 70,
  }),
  seedCompany({
    slug: "builderbase",
    name: "BuilderBase",
    // No website supplied and none on the live portfolio, so none is invented.
    // The card renders logo + name until a URL is confirmed.
    websiteUrl: undefined,
    caption: null,
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
    caption: "Study smarter, get better grades.",
    logo: SUPPLIED_PORTFOLIO_LOGOS.memmo,
    logoSurface: "light",
    logoFit: "wide",
    opticalScale: 0.92,
    sortOrder: 80,
    captionNote:
      "Consistent with the linked study platform observed 2026-08-10, but still requires editorial approval.",
  }),
];
