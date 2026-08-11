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
  AboutPage,
  Company,
  HomePage,
  NetworkPerson,
  Post,
  SiteSettings,
  TeamMember,
  Testimonial,
  RichText,
  TaxonomyRef,
} from "../types";
import { SEED_ABOUT_PAGE } from "./about";
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
    active: true,
    sortOrder: 20,
  },
];

const posts: Post[] = [
  {
    id: "fixture-post-internal",
    publicationStatus: "published",
    editorialApprovalStatus: "approved",
    title: "A fixture article about shipping velocity",
    slug: "fixture-article-shipping-velocity",
    type: "article",
    target: "internal",
    publishedAt: "2026-06-01",
    excerpt: "A synthetic article used to exercise the internal article template.",
    body,
    authors: [{ id: "team-anders-nygren", slug: "anders-nygren", name: "Anders Nygren" }],
    companies: [{ id: "fixture-northbound", slug: "northbound", name: "Northbound" }],
    featured: true,
    sortOrder: 10,
  },
  {
    id: "fixture-post-external",
    publicationStatus: "published",
    editorialApprovalStatus: "approved",
    title: "Northbound raises a fixture round",
    type: "portfolio-news",
    target: "external",
    externalUrl: "https://example.org/northbound-round",
    publishedAt: "2026-05-02",
    excerpt: "A synthetic external news item that must link straight out.",
    authors: [],
    companies: [{ id: "fixture-northbound", slug: "northbound", name: "Northbound" }],
    featured: false,
    sortOrder: 20,
  },
  {
    id: "fixture-post-second-internal",
    publicationStatus: "published",
    editorialApprovalStatus: "approved",
    title: "A second fixture article",
    slug: "fixture-article-second",
    type: "article",
    target: "internal",
    publishedAt: "2026-04-03",
    excerpt: "Used to verify the related-content algorithm's shared-company branch.",
    body,
    authors: [{ id: "team-anders-nygren", slug: "anders-nygren", name: "Anders Nygren" }],
    companies: [{ id: "fixture-northbound", slug: "northbound", name: "Northbound" }],
    featured: false,
    sortOrder: 30,
  },
  {
    id: "fixture-post-draft",
    publicationStatus: "draft",
    editorialApprovalStatus: "unapproved",
    title: "A draft that must never appear publicly",
    slug: "fixture-draft",
    type: "article",
    target: "internal",
    excerpt: "Draft fixture.",
    body,
    authors: [],
    companies: [],
    featured: false,
  },
];

const testimonials: Testimonial[] = [
  {
    id: "fixture-testimonial-1",
    publicationStatus: "published",
    consentStatus: "granted",
    quote: "A fixture testimonial quote about working with the team.",
    personName: "Fixture Founder",
    personTitle: "CEO, Northbound",
    company: { id: "fixture-northbound", slug: "northbound", name: "Northbound" },
    featured: true,
    sortOrder: 10,
    fieldEvidence: { quote: FIXTURE_APPROVAL, personName: FIXTURE_APPROVAL },
  },
  {
    // A second consented quote so the carousel path is exercised end to end.
    // With only one, §7.7 requires a static block and the controls disappear —
    // both branches need coverage.
    id: "fixture-testimonial-2",
    publicationStatus: "published",
    consentStatus: "granted",
    quote: "A second fixture testimonial so the carousel has something to move between.",
    personName: "Second Fixture Founder",
    personTitle: "CTO, Harbourline",
    company: { id: "fixture-harbourline", slug: "harbourline", name: "Harbourline" },
    featured: true,
    sortOrder: 15,
    fieldEvidence: { quote: FIXTURE_APPROVAL, personName: FIXTURE_APPROVAL },
  },
  {
    id: "fixture-testimonial-revoked",
    publicationStatus: "published",
    consentStatus: "revoked",
    quote: "Consent revoked — must disappear everywhere immediately.",
    personName: "Revoked Person",
    featured: false,
    sortOrder: 20,
    fieldEvidence: { quote: FIXTURE_APPROVAL, personName: FIXTURE_APPROVAL },
  },
];

const networkPeople: NetworkPerson[] = [
  {
    id: "fixture-network-1",
    name: "Fixture Operator",
    slug: "fixture-operator",
    publicationStatus: "published",
    verificationStatus: "verified",
    fieldEvidence: { name: FIXTURE_APPROVAL, roleLine: FIXTURE_APPROVAL },
    group: "operating-partner",
    roleLine: "Operating partner, go-to-market",
    verticals: [tax("vertical", "b2b-software", "B2B software")],
    expertise: [tax("expertise", "go-to-market", "Go-to-market")],
    featured: true,
    sortOrder: 10,
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
    team: true,
    pitch: true,
    insights: true,
    about: true,
    network: true,
    stats: true,
    testimonials: true,
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
      ctaLabel: t(page.featuredPortfolio.ctaLabel.value),
      companyIds: companies
        .filter((c) => c.featured)
        .map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    },
    optionalSections: {
      statsHeading: t("Foundry in numbers"),
      testimonialsHeading: t("From the founders we back"),
      latestInsightsHeading: t("News & Insights"),
      latestInsightsCtaLabel: t("See all insights"),
    },
    contact: {
      ...page.contact,
      heading: t(page.contact.heading.value),
      paragraphs: page.contact.paragraphs.map((x) => t(x.value)),
      primaryCta: { ...page.contact.primaryCta, label: t(page.contact.primaryCta.label.value) },
      secondaryCta: {
        ...page.contact.secondaryCta,
        label: t(page.contact.secondaryCta.label.value),
      },
    },
    seo: { ...page.seo, approvalStatus: "approved" },
  };
}

function approveAbout(page: AboutPage): AboutPage {
  const t = approvedText;
  return {
    ...page,
    publicationStatus: "published",
    heading: t(page.heading.value),
    intro: page.intro.map((x) => t(x.value)),
    beliefs: page.beliefs.map((b) => ({ title: t(b.title.value), body: t(b.body.value) })),
    howWeWork: page.howWeWork.map((i) => ({ ...i, body: t(i.body.value) })),
    whatWeLookFor: page.whatWeLookFor.map((b) => ({
      title: t(b.title.value),
      body: t(b.body.value),
    })),
    process: page.process.map((s) => ({ ...s, title: t(s.title.value), body: t(s.body.value) })),
    seo: { ...page.seo, approvalStatus: "approved" },
  };
}

export const FIXTURE_DATASET = {
  siteSettings,
  homePage: approveHome(SEED_HOME_PAGE),
  aboutPage: approveAbout(SEED_ABOUT_PAGE),
  companies,
  teamMembers,
  posts,
  testimonials,
  networkPeople,
};
