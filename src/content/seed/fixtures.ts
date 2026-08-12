/**
 * ============================ SYNTHETIC TEST DATA ============================
 *
 * Everything in this file is FICTIONAL. It exists so end-to-end tests can drive
 * filters, detail routes, related content and the production publishing policy
 * against approved-looking records — none of which exist in the real Foundry
 * dataset yet.
 *
 * It is NOT Foundry content and must never reach a public deployment. Two
 * independent switches are required to load it, and the CI deploy gate asserts
 * that neither is set in a production environment:
 *
 *     FOUNDRY_CONTENT_FIXTURE=e2e
 *     FOUNDRY_ALLOW_FIXTURES=1
 *
 * ============================================================================
 */

import type {
  Company,
  FundPage,
  HomePage,
  RichText,
  SiteSettings,
  TaxonomyRef,
  TeamMember,
} from "../types";
import { SEED_FUND_PAGE } from "./fund";
import { SEED_HOME_PAGE } from "./home";
import { SEED_SITE_SETTINGS } from "./site-settings";

export function isFixtureModeEnabled(): boolean {
  return (
    process.env.FOUNDRY_CONTENT_FIXTURE === "e2e" && process.env.FOUNDRY_ALLOW_FIXTURES === "1"
  );
}

const FIXTURE_APPROVAL = {
  status: "owner-approved" as const,
  sources: [{ label: "Synthetic end-to-end fixture", observedAt: "2026-08-10" }],
  approvedBy: "automated-test-fixture",
  approvedAt: "2026-08-10",
};

const approvedText = (value: string) => ({
  value,
  origin: "proposed" as const,
  approvalStatus: "approved" as const,
  approvedBy: "automated-test-fixture",
  approvedAt: "2026-08-10",
});

const tax = (group: TaxonomyRef["group"], slug: string, title: string): TaxonomyRef => ({
  group,
  slug,
  title,
});

const STAGE_PRE_SEED = tax("stage", "pre-seed", "Pre-seed");
const STAGE_SEED = tax("stage", "seed", "Seed");
const SECTOR_INFRA = tax("sector", "ai-infrastructure", "AI infrastructure");
const SECTOR_HEALTH = tax("sector", "healthtech", "Healthtech");
const SECTOR_FINTECH = tax("sector", "fintech", "Fintech");
const FOCUS_B2B = tax("focus", "b2b", "B2B");
const FOCUS_B2C = tax("focus", "b2c", "B2C");

const body: RichText = [
  {
    type: "paragraph",
    spans: [
      { text: "Fixture body copy used to exercise the article and company detail templates." },
    ],
  },
  { type: "heading", level: 2, spans: [{ text: "A fixture subheading" }] },
  {
    type: "paragraph",
    spans: [
      { text: "A second paragraph with " },
      { text: "emphasis", marks: [{ type: "em" }] },
      { text: " and an " },
      {
        text: "external link",
        marks: [{ type: "link", href: "https://example.org/", isExternal: true }],
      },
      { text: "." },
    ],
  },
  { type: "list", style: "bullet", items: [[{ text: "First point" }], [{ text: "Second point" }]] },
];

function fixtureCompany(input: {
  slug: string;
  name: string;
  stages: TaxonomyRef[];
  sectors: TaxonomyRef[];
  focuses: TaxonomyRef[];
  status: Company["status"];
  sortOrder: number;
  featured?: boolean;
  sparse?: boolean;
}): Company {
  const full = !input.sparse;
  return {
    id: `fixture-${input.slug}`,
    name: input.name,
    slug: input.slug,
    publicationStatus: "published",
    verificationStatus: "verified",
    dataCompleteness: { coreIdentity: true, editorial: full, relations: full, seo: full },
    fieldEvidence: {
      name: FIXTURE_APPROVAL,
      logo: FIXTURE_APPROVAL,
      websiteUrl: FIXTURE_APPROVAL,
      tagline: FIXTURE_APPROVAL,
      shortDescription: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      body: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      stages: FIXTURE_APPROVAL,
      sectors: FIXTURE_APPROVAL,
      focuses: FIXTURE_APPROVAL,
      status: FIXTURE_APPROVAL,
      founders: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      headquarters: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      investmentYear: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      dealLead: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
      whyWeInvested: full ? FIXTURE_APPROVAL : { status: "unverified", sources: [] },
    },
    logoAlt: `${input.name} logo`,
    logoFit: "contain",
    opticalScale: 1,
    tagline: `${input.name} builds fixture software for automated tests.`,
    shortDescription: full
      ? `${input.name} is a synthetic record used to exercise the company detail template end to end.`
      : undefined,
    body: full ? body : undefined,
    stages: input.stages,
    sectors: input.sectors,
    focuses: input.focuses,
    status: input.status,
    founders: full ? [{ name: "Fixture Founder", role: "CEO" }] : undefined,
    websiteUrl: `https://example.com/${input.slug}`,
    headquarters: full ? "Stockholm, Sweden" : undefined,
    investmentYear: full ? 2025 : undefined,
    dealLead: full
      ? { id: "team-anders-nygren", slug: "anders-nygren", name: "Anders Nygren" }
      : undefined,
    whyWeInvested: full
      ? [{ type: "paragraph", spans: [{ text: "Fixture rationale for the investment." }] }]
      : undefined,
    founderQuote: full
      ? { quote: "Working with Foundry is a fixture quote.", name: "Fixture Founder", title: "CEO" }
      : undefined,
    featured: input.featured ?? false,
    sortOrder: input.sortOrder,
  };
}

const companies: Company[] = [
  fixtureCompany({
    slug: "northbound",
    name: "Northbound",
    stages: [STAGE_PRE_SEED],
    sectors: [SECTOR_INFRA],
    focuses: [FOCUS_B2B],
    status: "active",
    sortOrder: 10,
    featured: true,
  }),
  fixtureCompany({
    slug: "harbourline",
    name: "Harbourline",
    stages: [STAGE_PRE_SEED, STAGE_SEED],
    sectors: [SECTOR_HEALTH],
    focuses: [FOCUS_B2B, FOCUS_B2C],
    status: "active",
    sortOrder: 20,
    featured: true,
  }),
  fixtureCompany({
    slug: "coldpress",
    name: "Coldpress",
    stages: [STAGE_SEED],
    sectors: [SECTOR_FINTECH],
    focuses: [FOCUS_B2C],
    status: "exited",
    sortOrder: 30,
    featured: true,
  }),
  fixtureCompany({
    slug: "granite-works",
    name: "Granite Works",
    stages: [STAGE_PRE_SEED],
    sectors: [SECTOR_INFRA, SECTOR_FINTECH],
    focuses: [FOCUS_B2B],
    status: "realized",
    sortOrder: 40,
  }),
  // Sparse record: only core identity is approved, so it must render as a card
  // that links straight to the external site and must NOT get a detail route.
  fixtureCompany({
    slug: "sparse-signal",
    name: "Sparse Signal",
    stages: [STAGE_PRE_SEED],
    sectors: [SECTOR_INFRA],
    focuses: [FOCUS_B2B],
    status: "active",
    sortOrder: 50,
    sparse: true,
  }),
  // Internal lifecycle state — must never appear in the public archive.
  {
    ...fixtureCompany({
      slug: "dormant-co",
      name: "Dormant Co",
      stages: [STAGE_PRE_SEED],
      sectors: [SECTOR_INFRA],
      focuses: [FOCUS_B2B],
      status: "inactive",
      sortOrder: 60,
    }),
    status: "inactive",
  },
];

const teamMembers: TeamMember[] = [
  {
    id: "team-anders-nygren",
    name: "Anders Nygren",
    slug: "anders-nygren",
    role: "Partner",
    publicationStatus: "published",
    verificationStatus: "verified",
    fieldEvidence: {
      name: FIXTURE_APPROVAL,
      role: FIXTURE_APPROVAL,
      email: FIXTURE_APPROVAL,
      phone: FIXTURE_APPROVAL,
      shortBio: FIXTURE_APPROVAL,
      longBio: FIXTURE_APPROVAL,
      expertise: FIXTURE_APPROVAL,
    },
    shortBio: "Fixture short bio for the team index.",
    longBio: body,
    expertise: ["Go-to-market", "AI-native operating models"],
    email: "anders.nygren@foundryventures.ai",
    ownsInvestmentDecision: true,
    phone: "+46 733 460006",
    active: true,
    sortOrder: 10,
  },
  {
    // Thin profile: no long bio, so the detail route must not exist (§10.2).
    id: "team-julia-siljehag",
    name: "Julia Siljehag",
    slug: "julia-siljehag",
    role: "Community Manager",
    publicationStatus: "published",
    verificationStatus: "partially-verified",
    fieldEvidence: {
      name: FIXTURE_APPROVAL,
      role: FIXTURE_APPROVAL,
      email: FIXTURE_APPROVAL,
      shortBio: FIXTURE_APPROVAL,
    },
    shortBio: "Fixture short bio without a long bio.",
    email: "julia.siljehag@foundryventures.ai",
    ownsInvestmentDecision: false,
    active: true,
    sortOrder: 20,
  },
];

const siteSettings: SiteSettings = {
  ...SEED_SITE_SETTINGS,
  fieldEvidence: {
    ...SEED_SITE_SETTINGS.fieldEvidence,
    displayBrandName: FIXTURE_APPROVAL,
    seoBrandName: FIXTURE_APPROVAL,
    linkedinUrl: FIXTURE_APPROVAL,
  },
  investmentCriteria: SEED_SITE_SETTINGS.investmentCriteria.map((criterion) => ({
    ...criterion,
    evidence: FIXTURE_APPROVAL,
  })),
  featureFlags: {
    investmentCriteria: true,
    // Both on, so the fixture build exercises the founder-quote block and the
    // institutional disclosure that the real dataset legitimately hides.
    founderQuote: true,
    institutionalDetails: true,
  },
};

function approveHome(page: HomePage): HomePage {
  const t = approvedText;
  return {
    ...page,
    publicationStatus: "published",
    hero: {
      ...page.hero,
      eyebrow: page.hero.eyebrow ? t(page.hero.eyebrow.value) : undefined,
      heading: t(page.hero.heading.value),
      paragraphs: page.hero.paragraphs.map((x) => t(x.value)),
      primaryCta: { ...page.hero.primaryCta, label: t(page.hero.primaryCta.label.value) },
      secondaryCta: { ...page.hero.secondaryCta, label: t(page.hero.secondaryCta.label.value) },
    },
    vision: {
      eyebrow: t(page.vision.eyebrow.value),
      heading: t(page.vision.heading.value),
      paragraphs: page.vision.paragraphs.map((x) => t(x.value)),
    },
    offering: {
      ...page.offering,
      eyebrow: t(page.offering.eyebrow.value),
      items: page.offering.items.map((item) => ({ ...item, body: t(item.body.value) })),
    },
    featuredPortfolio: {
      ...page.featuredPortfolio,
      heading: t(page.featuredPortfolio.heading.value),
      ctaLabel: page.featuredPortfolio.ctaLabel
        ? t(page.featuredPortfolio.ctaLabel.value)
        : undefined,
      companyIds: companies
        .filter((c) => c.featured)
        .map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    },
    contact: {
      ...page.contact,
      heading: t(page.contact.heading.value),
      paragraphs: page.contact.paragraphs.map((x) => t(x.value)),
      primaryCta: { ...page.contact.primaryCta, label: t(page.contact.primaryCta.label.value) },
    },
    seo: { ...page.seo, approvalStatus: "approved" },
  };
}

/** The fund page, with every string forced approved (§8.11). */
function approveFund(page: FundPage): FundPage {
  const t = approvedText;
  return {
    ...page,
    publicationStatus: "published",
    hero: { heading: t(page.hero.heading.value), intro: t(page.hero.intro.value) },
    factsHeading: t(page.factsHeading.value),
    model: {
      heading: t(page.model.heading.value),
      body: t(page.model.body.value),
      steps: page.model.steps.map((step) => ({
        ...step,
        title: t(step.title.value),
        body: t(step.body.value),
      })),
    },
    people: { ...page.people, heading: t(page.people.heading.value) },
    contact: {
      ...page.contact,
      heading: t(page.contact.heading.value),
      body: t(page.contact.body.value),
    },
    seo: { ...page.seo, approvalStatus: "approved" },
  };
}

export const FIXTURE_DATASET = {
  siteSettings,
  homePage: approveHome(SEED_HOME_PAGE),
  fundPage: approveFund(SEED_FUND_PAGE),
  companies,
  teamMembers,
};
