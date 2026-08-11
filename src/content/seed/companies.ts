/**
 * Portfolio seed data.
 *
 * Source: Appendix C.4 — the frozen 2026-08-10 live snapshot. Hard rules from
 * §8.5 that this file obeys literally:
 *
 *  - Every field is `observed`, never `owner-approved`. Nothing here publishes.
 *  - Newly and Skattio have **no** caption on the live site. None is invented;
 *    the image `alt` filename fallback is explicitly not approved copy.
 *  - The prototype's note fields (Openroll = "AI-native hiring", Agaton =
 *    "Industrial software") are placeholders and are NOT seeded.
 *  - Natively and Bright are NOT added. Bright's logo stays in
 *    `content-quarantine/`.
 *  - "Agaton Group" (prototype) is not merged with "Agaton" (live).
 *  - No stage/sector/focus/status is seeded: the live site publishes no
 *    taxonomy, so inventing one would be fabricating facts.
 *
 * `sortOrder` records the observed live ordering, flagged in
 * `docs/content-gaps.md` as a migration observation rather than a decision.
 */

import type { Company } from "../types";
import { FOUNDRY_PORTFOLIO_SOURCE, observed, unverified } from "./evidence";
import { PORTFOLIO_LOGO_REFERENCES } from "./images";

type SeedCompanyInput = {
  slug: string;
  name: string;
  websiteUrl: string;
  /** Verbatim live caption, or null when the live site has none. */
  caption: string | null;
  logo: Company["logo"];
  logoFit: NonNullable<Company["logoFit"]>;
  opticalScale: number;
  sortOrder: number;
  captionNote?: string;
};

function seedCompany(input: SeedCompanyInput): Company {
  const captionEvidence = input.caption
    ? observed(
        FOUNDRY_PORTFOLIO_SOURCE,
        input.captionNote ? { note: input.captionNote } : undefined,
      )
    : unverified(`No <figcaption> on the live portfolio for ${input.name}`);

  return {
    id: `company-${input.slug}`,
    name: input.name,
    slug: input.slug,
    publicationStatus: "review",
    verificationStatus: "partially-verified",
    dataCompleteness: {
      // Name + website + logo were all observed, but observation is not approval.
      coreIdentity: false,
      editorial: false,
      relations: false,
      seo: false,
    },
    fieldEvidence: {
      name: observed(FOUNDRY_PORTFOLIO_SOURCE, {
        note: "Identified from logo, link domain and filename; the live gallery markup has no company-name field",
      }),
      websiteUrl: observed(FOUNDRY_PORTFOLIO_SOURCE),
      logo: observed(FOUNDRY_PORTFOLIO_SOURCE, {
        note: "Export reference only — rights-cleared original not yet supplied",
      }),
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
 * Skattio, Memmo.
 */
export const SEED_COMPANIES: Company[] = [
  seedCompany({
    slug: "empley",
    name: "Empley",
    websiteUrl: "https://empley.com/",
    caption:
      "Empley is the AI-powered simulation platform helping enterprises model, plan, and optimize their workforce - faster, smarter, and automated.",
    logo: PORTFOLIO_LOGO_REFERENCES.empley,
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
    logo: PORTFOLIO_LOGO_REFERENCES.agaton,
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
    logo: PORTFOLIO_LOGO_REFERENCES.grand,
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
    logo: PORTFOLIO_LOGO_REFERENCES.wilgot,
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
    logo: PORTFOLIO_LOGO_REFERENCES.openroll,
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
    logo: PORTFOLIO_LOGO_REFERENCES.newly,
    logoFit: "compact",
    opticalScale: 0.78,
    sortOrder: 60,
  }),
  seedCompany({
    slug: "skattio",
    name: "Skattio",
    websiteUrl: "https://skattio.se/",
    caption: null,
    logo: PORTFOLIO_LOGO_REFERENCES.skattio,
    logoFit: "wide",
    opticalScale: 1,
    sortOrder: 70,
  }),
  seedCompany({
    slug: "memmo",
    name: "Memmo",
    websiteUrl: "https://www.memmo.org/",
    caption: "Study smarter, get better grades.",
    logo: PORTFOLIO_LOGO_REFERENCES.memmo,
    logoFit: "compact",
    opticalScale: 0.78,
    sortOrder: 80,
    captionNote:
      "Consistent with the linked study platform observed 2026-08-10, but still requires editorial approval.",
  }),
];
