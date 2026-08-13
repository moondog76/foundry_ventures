/**
 * Global site settings seed.
 *
 * Spec §16.1 production defaults:
 *  - `canonicalOrigin` is exactly `https://www.foundryventures.ai`.
 *  - `displayBrandName` / `legalName` / `seoBrandName` are three separate
 *    decisions. The live wordmark and <title> read "Foundry ventures" while the
 *    company is usually written "Foundry Ventures". Casing is NOT normalised
 *    here — it is an open content-owner decision.
 *  - No general inbox exists in the audit material, so none is invented. Footer
 *    and CTA contact details derive from `contactPeople`.
 *  - Pitch recipients are server-only secrets and deliberately absent from this
 *    publicly queryable document (§11.3).
 */

import type { SiteSettings } from "../types";
import {
  CLAUDE_PROTOTYPE_SOURCE,
  FOUNDRY_HOME_SOURCE,
  fromEnhancementBrief,
  ownerApprovedFromLive,
  ownerConfirmed,
  unverified,
} from "./evidence";
import { DEFAULT_OG_IMAGE } from "./images";
import { ANDERS_REF } from "./team";

export const CANONICAL_ORIGIN = "https://www.foundryventures.ai";

export const SEED_SITE_SETTINGS: SiteSettings = {
  displayBrandName: "Foundry ventures",
  legalName: undefined,
  seoBrandName: "Foundry Ventures",
  canonicalOrigin: CANONICAL_ORIGIN,
  defaultSeoTitle: "Foundry Ventures",
  defaultSeoDescription:
    "Early-stage AI investing in the Nordics. We write €100k or €200k into one to three teams a month, and underwrite the team before the market.",
  defaultOgImage: DEFAULT_OG_IMAGE,

  // No verified general inbox exists — see §16.1. Contact routes through people.
  contactEmail: undefined,
  contactPhone: undefined,
  // Anders only, on owner instruction 2026-08-11. Julia's record still exists in
  // the content layer — she is simply not a published contact.
  contactPeople: [ANDERS_REF],
  address: undefined,
  organizationNumber: undefined,

  // Supplied by the content owner 2026-08-11. The URL they sent carried a
  // `lipi` session-tracking parameter from their own LinkedIn view; that is
  // personal telemetry, not part of the address, so only the canonical company
  // path is stored (§16.1 requires a canonical HTTPS URL).
  linkedinUrl: "https://www.linkedin.com/company/105719187/",
  careersUrl: undefined,

  fieldEvidence: {
    displayBrandName: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
    seoBrandName: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
    legalName: unverified("No legal entity name published on the live site"),
    contactEmail: unverified("No general inbox observed — must not be invented"),
    contactPhone: unverified("No general phone number observed"),
    address: unverified("No physical address published on the live site"),
    organizationNumber: unverified("No organisation number published on the live site"),
    linkedinUrl: ownerConfirmed("LinkedIn company URL supplied by the content owner"),
    careersUrl: unverified("No careers destination configured"),
  },

  /**
   * Target IA once every route is published (§6.1). Flagged items are filtered
   * out entirely rather than rendered as dead navigation.
   */
  /*
   * §7.2. Two destinations, no dropdowns, no separate founder/LP modes.
   *
   * Portfolio returns to the header, reversing the owner's 11 August instruction
   * to remove it: §2.8 requires the header to reach Portfolio and Fund without
   * depending on a hero CTA or the footer, and with `/fund` added there is now
   * a real navigation set rather than a single orphaned link. Logged in
   * `docs/content-gaps.md` §F3.
   */
  navigation: [
    { label: "Portfolio", href: "/portfolio", featureFlag: "portfolio" },
    { label: "Fund", href: "/fund", featureFlag: "fund" },
  ],

  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "Portfolio", href: "/portfolio", featureFlag: "portfolio" },
    { label: "Fund", href: "/fund", featureFlag: "fund" },
  ],

  legalNavigation: [{ label: "Privacy", href: "/privacy" }],

  /**
   * §7.2, rewritten for the 2026-08-11 repositioning.
   *
   * Every row is now a fact the content owner stated directly, which is what
   * finally unblocks the ticket size: the prototype's €50k–€300k range and
   * €200k sweet spot were never live-verified and never published. These are two
   * fixed cheque sizes, not a range.
   *
   * `Cadence` is the row to watch. "1–3 per month" is a public commitment anyone
   * can check against the portfolio, and it is the kind of claim that quietly
   * stops being true.
   */
  investmentCriteria: [
    {
      label: "First cheque",
      value: "€100k or €200k",
      evidence: ownerConfirmed("Ticket sizes stated by the content owner, 2026-08-11"),
      editorialNote:
        "Two fixed sizes, not a range. The prototype's €50k–€300k range and €200k sweet spot were never live-verified and are superseded by this.",
      sortOrder: 10,
    },
    {
      label: "Investment pace",
      value: "Monthly",
      evidence: ownerConfirmed("Investment pace restated by the content owner, 2026-08-13"),
      editorialNote:
        "Was “1–3 teams / month” until 2026-08-13. “Monthly” says Foundry invests every month without committing to a count, which removes the arithmetic a reader could previously run against the portfolio — and removes the sharpest operating fact on the strip. Both are deliberate.",
      sortOrder: 20,
    },
    {
      label: "Decision lens",
      value: "Team first",
      evidence: ownerConfirmed("Team-only thesis stated by the content owner, 2026-08-11"),
      sortOrder: 30,
    },
    {
      label: "Focus",
      value: "AI only",
      evidence: ownerConfirmed("AI-only mandate stated by the content owner, 2026-08-11"),
      sortOrder: 40,
    },
    {
      label: "Stage",
      value: "Early stage",
      evidence: ownerConfirmed("Stage wording set by the content owner, 2026-08-13"),
      editorialNote:
        "Replaces the Industry/Agnostic row. §8.3 lists Stage among the six facts and industry-agnostic is implied by an AI-only mandate; stage is the fact a founder actually screens on.",
      sortOrder: 50,
    },
    {
      label: "Geography",
      value: "Nordics",
      evidence: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      sortOrder: 60,
    },
  ],


  socialLinks: [
    {
      platform: "linkedin",
      url: "https://www.linkedin.com/company/105719187/",
      label: "Foundry Ventures on LinkedIn",
    },
  ],

  // §8.9: one sentence in the footer — category, region and ticket. No
  // repeated manifesto.
  brandStatement: fromEnhancementBrief(
    "Early-stage AI investing in the Nordics. First cheques of €100k or €200k, one to three teams a month.",
  ),

  /**
   * §30 safe defaults. Every content-dependent surface stays off until real,
   * approved content exists. A disabled route 404s in production, is absent
   * from navigation and sitemap, and generates no metadata (§3.4).
   */
  featureFlags: {
    /*
     * Off on owner instruction 2026-08-13: Foundry is showing a single page for
     * now. Both routes still resolve — a link already shared keeps working — but
     * nothing on the site points at them and neither is indexable. Flip either
     * back to `true` and its navigation entry, sitemap entry and on-page links
     * all return together.
     */
    portfolio: false,
    fund: false,
    investmentCriteria: true,
    // No founder quote is approved for publication. §8.7: if none meets the
    // standard, omit the section — do not weaken the standard to fill it.
    founderQuote: false,
    // No counsel-approved legal entity, registered address or organisation
    // number exists. §16 blocks the affected content rather than publishing
    // draft language, which is the defect the audit found on /privacy.
    institutionalDetails: false,
  },
};

/** Recorded so the prototype's provenance stays traceable in review. */
export const PROTOTYPE_ONLY_CRITERIA_SOURCE = CLAUDE_PROTOTYPE_SOURCE;
