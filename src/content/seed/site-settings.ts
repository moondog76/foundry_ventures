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
  authoredOnInstruction,
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
    "We back AI teams in the Nordics with €100k or €200k, one to three times a month. Team-only conviction, plus capital and customer introductions.",
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
  navigation: [
    { label: "Team", href: "/team", featureFlag: "team" },
    { label: "Insights", href: "/insights", featureFlag: "insights" },
    { label: "About", href: "/about", featureFlag: "about" },
    { label: "Network", href: "/network", featureFlag: "network" },
    { label: "Pitch", href: "/pitch", featureFlag: "pitch" },
  ],

  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Team", href: "/team", featureFlag: "team" },
    { label: "Insights", href: "/insights", featureFlag: "insights" },
    { label: "About", href: "/about", featureFlag: "about" },
    { label: "Pitch", href: "/pitch", featureFlag: "pitch" },
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
      label: "Ticket",
      value: "€100k or €200k",
      evidence: ownerConfirmed("Ticket sizes stated by the content owner, 2026-08-11"),
      editorialNote:
        "Two fixed sizes, not a range. The prototype's €50k–€300k range and €200k sweet spot were never live-verified and are superseded by this.",
      sortOrder: 10,
    },
    {
      label: "Cadence",
      value: "1–3 per month",
      evidence: ownerConfirmed("Investment cadence stated by the content owner, 2026-08-11"),
      editorialNote:
        "A public, checkable commitment: roughly 12–36 investments a year. Worth revisiting if the real rate settles elsewhere.",
      sortOrder: 20,
    },
    {
      label: "We back",
      value: "The team",
      evidence: ownerConfirmed("Team-only thesis stated by the content owner, 2026-08-11"),
      sortOrder: 30,
    },
    {
      label: "Technology",
      value: "AI only",
      evidence: ownerConfirmed("AI-only mandate stated by the content owner, 2026-08-11"),
      sortOrder: 40,
    },
    {
      label: "Industry",
      value: "Agnostic",
      evidence: ownerConfirmed(
        "Industry-agnostic thesis restated by the content owner, 2026-08-11",
      ),
      sortOrder: 50,
    },
    {
      label: "Geography",
      value: "Nordics",
      evidence: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      sortOrder: 60,
    },
  ],

  /**
   * §7.6. Derived metrics recompute from live content; nothing is trusted from
   * a hand-entered number. No Luminar figures are copied.
   */
  stats: [
    {
      value: 0,
      label: "Portfolio companies",
      derivedKey: "activeCompanyCount",
      sourceNote: "Derived from published portfolio records",
      evidence: unverified("Requires an approved company list before it means anything"),
      sortOrder: 10,
    },
  ],

  socialLinks: [
    {
      platform: "linkedin",
      url: "https://www.linkedin.com/company/105719187/",
      label: "Foundry Ventures on LinkedIn",
    },
  ],

  brandStatement: authoredOnInstruction(
    "Foundry backs AI teams in the Nordics. €100k or €200k, one to three times a month, decided on the team.",
  ),

  /**
   * §30 safe defaults. Every content-dependent surface stays off until real,
   * approved content exists. A disabled route 404s in production, is absent
   * from navigation and sitemap, and generates no metadata (§3.4).
   */
  featureFlags: {
    investmentCriteria: true,
    // Off on owner instruction 2026-08-11: no team page, and Anders appears in
    // the contact block instead. Flip to true when portraits and bios exist and
    // the route, navigation and sitemap entries all come back.
    team: false,
    // Off on owner instruction 2026-08-11. The whole conversion path — route,
    // form, API, banner and every CTA — is intact behind this one boolean;
    // contact runs through Anders instead.
    pitch: false,
    insights: false,
    about: false,
    network: false,
    stats: false,
    testimonials: false,
  },
};

/** Recorded so the prototype's provenance stays traceable in review. */
export const PROTOTYPE_ONLY_CRITERIA_SOURCE = CLAUDE_PROTOTYPE_SOURCE;
