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
  observed,
  proposed,
  unverified,
} from "./evidence";
import { DEFAULT_OG_IMAGE } from "./images";
import { ANDERS_REF, JULIA_REF } from "./team";

export const CANONICAL_ORIGIN = "https://www.foundryventures.ai";

export const SEED_SITE_SETTINGS: SiteSettings = {
  displayBrandName: "Foundry ventures",
  legalName: undefined,
  seoBrandName: "Foundry Ventures",
  canonicalOrigin: CANONICAL_ORIGIN,
  defaultSeoTitle: "Foundry Ventures",
  defaultSeoDescription:
    "Early-Stage Investor | Focused on AI-Driven SaaS 2.0 | Partnering with Visionary Founders to Build Tomorrow's Critical Tech",
  defaultOgImage: DEFAULT_OG_IMAGE,

  // No verified general inbox exists — see §16.1. Contact routes through people.
  contactEmail: undefined,
  contactPhone: undefined,
  contactPeople: [ANDERS_REF, JULIA_REF],
  address: undefined,
  organizationNumber: undefined,

  linkedinUrl: "https://www.linkedin.com/company/foundry-ventures-ai/",
  careersUrl: undefined,

  fieldEvidence: {
    displayBrandName: observed(FOUNDRY_HOME_SOURCE, {
      note: 'Live wordmark and <title> render "Foundry ventures" (lowercase v). Casing decision is open.',
    }),
    seoBrandName: unverified(
      'Company name is commonly written "Foundry Ventures"; owner must decide',
    ),
    legalName: unverified("No legal entity name published on the live site"),
    contactEmail: unverified("No general inbox observed — must not be invented"),
    contactPhone: unverified("No general phone number observed"),
    address: unverified("No physical address published on the live site"),
    organizationNumber: unverified("No organisation number published on the live site"),
    linkedinUrl: unverified(
      "LinkedIn company URL not confirmed in the audit material — verify the canonical HTTPS URL before publishing",
    ),
    careersUrl: unverified("No careers destination configured"),
  },

  /**
   * Target IA once every route is published (§6.1). Flagged items are filtered
   * out entirely rather than rendered as dead navigation.
   */
  navigation: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "Team", href: "/team" },
    { label: "Insights", href: "/insights", featureFlag: "insights" },
    { label: "About", href: "/about", featureFlag: "about" },
    { label: "Network", href: "/network", featureFlag: "network" },
    { label: "Pitch", href: "/pitch" },
  ],

  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Team", href: "/team" },
    { label: "Insights", href: "/insights", featureFlag: "insights" },
    { label: "About", href: "/about", featureFlag: "about" },
    { label: "Pitch", href: "/pitch" },
  ],

  legalNavigation: [{ label: "Privacy", href: "/privacy" }],

  /**
   * §7.2. Ticket range and sweet spot come only from the Claude prototype and
   * are NOT live-verified — they stay `unverified` and cannot render. The four
   * live-observed rows are `observed`, which is still not enough to publish.
   * `Industry: Agnostic` and `Technology focus` stay separate rows; they are
   * deliberately not collapsed into an ambiguous "Sector: Generalist".
   */
  investmentCriteria: [
    {
      label: "Ticket range",
      value: "€50k–€300k",
      evidence: unverified("Claude prototype only — never observed on the live site"),
      editorialNote: "Blocked until a content owner confirms the real ticket range.",
      sortOrder: 10,
    },
    {
      label: "Sweet spot",
      value: "€200k",
      evidence: unverified("Claude prototype only — never observed on the live site"),
      editorialNote: "Blocked until a content owner confirms the real sweet spot.",
      sortOrder: 20,
    },
    {
      label: "Stage",
      value: "Pre-seed",
      evidence: observed(FOUNDRY_HOME_SOURCE),
      sortOrder: 30,
    },
    {
      label: "Industry",
      value: "Agnostic",
      evidence: observed(FOUNDRY_HOME_SOURCE),
      sortOrder: 40,
    },
    {
      label: "Technology focus",
      value: "AI / services-as-a-software",
      evidence: observed(FOUNDRY_HOME_SOURCE, {
        note: "Exact terminology must be approved — the live site mixes 'services-as-a-software' and 'SaaS 2.0'",
      }),
      sortOrder: 50,
    },
    {
      label: "Geography",
      value: "Nordics",
      evidence: observed(FOUNDRY_HOME_SOURCE),
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
      url: "https://www.linkedin.com/company/foundry-ventures-ai/",
      label: "Foundry Ventures on LinkedIn",
    },
  ],

  brandStatement: proposed("Foundry backs Nordic pre-seed founders building AI-native companies."),

  /**
   * §30 safe defaults. Every content-dependent surface stays off until real,
   * approved content exists. A disabled route 404s in production, is absent
   * from navigation and sitemap, and generates no metadata (§3.4).
   */
  featureFlags: {
    investmentCriteria: false,
    insights: false,
    about: false,
    network: false,
    stats: false,
    testimonials: false,
  },
};

/** Recorded so the prototype's provenance stays traceable in review. */
export const PROTOTYPE_ONLY_CRITERIA_SOURCE = CLAUDE_PROTOTYPE_SOURCE;
