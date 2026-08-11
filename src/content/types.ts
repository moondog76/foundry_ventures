/**
 * Foundry Ventures domain model.
 *
 * Spec §16. These are the *normalised* types every route consumes. Neither the
 * Sanity client nor the local seed shape leaks past the content adapter (§4.2).
 *
 * The evidence system is the backbone of the whole publishing policy: every
 * public factual claim carries a `FieldEvidence` record, and production only
 * renders fields whose evidence is `owner-approved` (§16.8).
 */

/* ------------------------------------------------------------------ Evidence */

export type SourceReference = {
  label: string;
  url?: string;
  /** ISO date the source was observed. */
  observedAt: string;
  note?: string;
};

export type EvidenceStatus = "unverified" | "observed" | "owner-approved";

export type FieldEvidence = {
  status: EvidenceStatus;
  sources: SourceReference[];
  lastCheckedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  /** Internal annotation for editors and the content-gaps report. Never rendered. */
  note?: string;
};

export type PublicationStatus = "draft" | "review" | "published";
export type VerificationStatus = "unverified" | "partially-verified" | "verified";
export type ApprovalStatus = "unapproved" | "approved";

/* --------------------------------------------------------------- Media & SEO */

export type ImageAsset = {
  id: string;
  src: string;
  width: number;
  height: number;
  /** Production rendering requires `approved` (§16.7). */
  rightsStatus: "unverified" | "approved";
  rightsOwner?: string;
  sourceUrl?: string;
  checksumSha256?: string;
  /** Empty string is a deliberate, valid value for decorative imagery. */
  alt?: string;
  hotspot?: { x: number; y: number };
  caption?: string;
  /** Optional pre-computed blur placeholder (data URI). */
  blurDataUrl?: string;
  /**
   * Whether the binary actually exists in this workspace. Live-site URLs are
   * recorded as export references (Appendix A.2) with `available: false`; they
   * are never hotlinked, and rendering falls back to the typographic treatment
   * rather than a broken image.
   */
  available: boolean;
  /**
   * Foundry-owned stand-in artwork used until licensed originals are supplied.
   * Every placeholder still in use is listed by the content-integrity report.
   */
  isPlaceholder?: boolean;
};

export type SeoFields = {
  title?: string;
  description?: string;
  ogImage?: ImageAsset;
  approvalStatus?: ApprovalStatus;
  sources?: SourceReference[];
  noIndex?: boolean;
  canonicalOverride?: string;
};

/* ------------------------------------------------------------- Editorial copy */

/**
 * Every user-visible string that makes a claim travels as an `EditorialText`.
 * `migrated-verbatim` is Appendix C copy; `proposed` is new copy from the
 * prototype or the buildspec. Both start `unapproved` (§25.1).
 */
export type EditorialText = {
  value: string;
  origin: "migrated-verbatim" | "proposed";
  approvalStatus: ApprovalStatus;
  sourceUrl?: string;
  observedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  /**
   * Set when non-semantic whitespace was trimmed during import. Logged, but it
   * never changes `origin` or `approvalStatus` (§16.1.1).
   */
  normalizationNote?: string;
};

/* -------------------------------------------------------------- Rich text */

export type RichTextMark =
  | { type: "strong" }
  | { type: "em" }
  | { type: "code" }
  | { type: "link"; href: string; isExternal?: boolean };

export type RichTextSpan = {
  text: string;
  marks?: RichTextMark[];
};

export type RichTextBlock =
  | { type: "paragraph"; spans: RichTextSpan[] }
  | { type: "heading"; level: 2 | 3 | 4; spans: RichTextSpan[] }
  | { type: "list"; style: "bullet" | "number"; items: RichTextSpan[][] }
  | { type: "blockquote"; spans: RichTextSpan[]; attribution?: string }
  | { type: "image"; image: ImageAsset }
  | { type: "embed"; provider: "youtube" | "vimeo" | "loom"; url: string; title: string };

export type RichText = RichTextBlock[];

/* -------------------------------------------------------------- Taxonomy */

export type TaxonomyGroup = "stage" | "sector" | "focus" | "status" | "vertical" | "expertise";

export type TaxonomyRef = {
  /** lowercase kebab-case, used verbatim in query strings (§8.2). */
  slug: string;
  title: string;
  group: TaxonomyGroup;
};

/* ------------------------------------------------------------ Navigation */

export type NavItem = {
  label: string;
  href: string;
  /** Which feature flag, if any, gates this item. */
  featureFlag?: FeatureFlagKey;
  isExternal?: boolean;
};

export type SocialLink = {
  platform: "linkedin" | "x" | "youtube" | "instagram";
  url: string;
  label: string;
};

export type Address = {
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  addressCountry?: string;
};

/* --------------------------------------------------------- Feature flags */

export type FeatureFlags = {
  investmentCriteria: boolean;
  insights: boolean;
  about: boolean;
  network: boolean;
  stats: boolean;
  testimonials: boolean;
};

export type FeatureFlagKey = keyof FeatureFlags;

/* -------------------------------------------------------------- Criteria */

export type InvestmentCriterion = {
  label: string;
  value: string;
  evidence: FieldEvidence;
  /** Internal only — never rendered publicly. */
  editorialNote?: string;
  sortOrder: number;
};

/* ------------------------------------------------------------------- Stats */

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sourceNote?: string;
  asOfDate?: string;
  /** When set, `value` is recomputed from live content instead of trusted. */
  derivedKey?: "activeCompanyCount" | "totalCompanyCount";
  evidence: FieldEvidence;
  sortOrder: number;
};

/* ------------------------------------------------------------ SiteSettings */

export type SiteSettingsEvidenceField =
  | "displayBrandName"
  | "legalName"
  | "seoBrandName"
  | "contactEmail"
  | "contactPhone"
  | "address"
  | "organizationNumber"
  | "linkedinUrl"
  | "careersUrl";

export type SiteSettings = {
  displayBrandName: string;
  legalName?: string;
  seoBrandName: string;
  canonicalOrigin: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: ImageAsset;
  contactEmail?: string;
  contactPhone?: string;
  contactPeople: TeamMemberRef[];
  address?: Address;
  organizationNumber?: string;
  linkedinUrl: string;
  careersUrl?: string;
  fieldEvidence: Partial<Record<SiteSettingsEvidenceField, FieldEvidence>>;
  navigation: NavItem[];
  footerNavigation: NavItem[];
  legalNavigation: NavItem[];
  investmentCriteria: InvestmentCriterion[];
  stats: Stat[];
  socialLinks: SocialLink[];
  brandStatement?: EditorialText;
  featureFlags: FeatureFlags;
};

/* ------------------------------------------------------------------ People */

export type TeamMemberEvidenceField =
  | "name"
  | "role"
  | "portrait"
  | "shortBio"
  | "longBio"
  | "expertise"
  | "email"
  | "phone"
  | "linkedinUrl";

export type TeamMember = {
  id: string;
  name: string;
  slug: string;
  role: string;
  portrait?: ImageAsset;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  fieldEvidence: Partial<Record<TeamMemberEvidenceField, FieldEvidence>>;
  shortBio?: string;
  longBio?: RichText;
  expertise?: string[];
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  active: boolean;
  sortOrder: number;
  seo?: SeoFields;
};

export type TeamMemberRef = { id: string; slug: string; name: string };

/** Team profile view model, with reverse relations resolved (§16.4.1). */
export type TeamMemberView = TeamMember & {
  authoredPosts: PostSummary[];
  dealLeadCompanies: CompanySummary[];
};

/* --------------------------------------------------------------- Company */

export type CompanyFactField =
  | "name"
  | "logo"
  | "tagline"
  | "shortDescription"
  | "body"
  | "stages"
  | "status"
  | "focuses"
  | "sectors"
  | "founders"
  | "websiteUrl"
  | "headquarters"
  | "investmentYear"
  | "dealLead"
  | "whyWeInvested";

export type CompanyStatus = "active" | "exited" | "realized" | "inactive";

export type Founder = {
  name: string;
  role?: string;
  linkedinUrl?: string;
  image?: ImageAsset;
};

export type FounderQuote = {
  quote: string;
  name: string;
  title?: string;
  location?: string;
  linkedinUrl?: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  dataCompleteness: {
    coreIdentity: boolean;
    editorial: boolean;
    relations: boolean;
    seo: boolean;
  };
  fieldEvidence: Partial<Record<CompanyFactField, FieldEvidence>>;
  logo?: ImageAsset;
  logoAlt?: string;
  logoFit?: "contain" | "wide" | "compact";
  /**
   * The surface this logo needs behind it. Founders supply whichever variant
   * they have: some marks are white-on-transparent and need a dark field,
   * others are black-on-transparent and would be invisible on one. Defaults to
   * "dark", which suits the majority of the delivered artwork.
   */
  logoSurface?: "dark" | "light";
  /** Optical calibration so mismatched aspect ratios read as equal weight (§5.5). */
  opticalScale?: number;
  cardImage?: ImageAsset;
  heroImage?: ImageAsset;
  tagline?: string;
  shortDescription?: string;
  body?: RichText;
  stages?: TaxonomyRef[];
  status?: CompanyStatus;
  focuses?: TaxonomyRef[];
  sectors?: TaxonomyRef[];
  founders?: Founder[];
  websiteUrl?: string;
  linkedinUrl?: string;
  careersUrl?: string;
  headquarters?: string;
  investmentYear?: number;
  dealLead?: TeamMemberRef;
  whyWeInvested?: RichText;
  founderQuote?: FounderQuote;
  featured: boolean;
  sortOrder: number;
  seo?: SeoFields;
};

export type CompanyRef = { id: string; slug: string; name: string };

/**
 * What a card is allowed to render, resolved once by the policy layer so no
 * component re-derives publishing rules (§16.8).
 */
export type CompanySummary = {
  id: string;
  slug: string;
  name: string;
  /** Internal detail route, or null when `canPublishDetail` is false. */
  href: string | null;
  /** Verified external site — the card destination in the sparse fallback tier. */
  externalHref: string | null;
  logo: ImageAsset | null;
  logoAlt: string;
  logoFit: "contain" | "wide" | "compact";
  logoSurface: "dark" | "light";
  opticalScale: number;
  cardImage: ImageAsset | null;
  tagline: string | null;
  stages: TaxonomyRef[];
  sectors: TaxonomyRef[];
  focuses: TaxonomyRef[];
  status: CompanyStatus | null;
  founders: Founder[];
  featured: boolean;
  sortOrder: number;
};

export type CompanyDetailView = {
  company: Company;
  summary: CompanySummary;
  dealLead: TeamMember | null;
  relatedPosts: PostSummary[];
  previous: CompanySummary | null;
  next: CompanySummary | null;
};

/* ------------------------------------------------------------------ Posts */

export type PostType = "article" | "portfolio-news";

export type Post = {
  id: string;
  publicationStatus: PublicationStatus;
  editorialApprovalStatus: ApprovalStatus;
  title: string;
  slug?: string;
  type: PostType;
  target: "internal" | "external";
  externalUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: ImageAsset;
  excerpt: string;
  body?: RichText;
  authors: TeamMemberRef[];
  companies: CompanyRef[];
  relatedPosts?: PostRef[];
  featured: boolean;
  sortOrder?: number;
  seo?: SeoFields;
};

export type PostRef = { id: string; slug?: string; title: string };

export type PostSummary = {
  id: string;
  title: string;
  type: PostType;
  href: string;
  isExternal: boolean;
  excerpt: string;
  publishedAt: string | null;
  heroImage: ImageAsset | null;
  authors: TeamMemberRef[];
  companies: CompanyRef[];
  readingTimeMinutes: number | null;
};

export type PostDetailView = {
  post: Post;
  summary: PostSummary;
  authors: TeamMember[];
  companies: CompanySummary[];
  related: PostSummary[];
};

/* ----------------------------------------------------------- Testimonials */

export type Testimonial = {
  id: string;
  publicationStatus: PublicationStatus;
  consentStatus: "missing" | "requested" | "granted" | "revoked";
  quote: string;
  personName: string;
  personTitle?: string;
  company?: CompanyRef;
  image?: ImageAsset;
  featured: boolean;
  sortOrder: number;
  fieldEvidence: Partial<
    Record<"quote" | "personName" | "personTitle" | "company" | "image", FieldEvidence>
  >;
};

/* -------------------------------------------------------- Network people */

export type NetworkPerson = {
  id: string;
  name: string;
  slug: string;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  fieldEvidence: Partial<
    Record<
      "name" | "group" | "image" | "roleLine" | "linkedinUrl" | "verticals" | "expertise",
      FieldEvidence
    >
  >;
  group: "operating-partner" | "advisor" | "angel-network";
  image?: ImageAsset;
  roleLine: string;
  linkedinUrl?: string;
  verticals: TaxonomyRef[];
  expertise: TaxonomyRef[];
  featured: boolean;
  sortOrder: number;
};

/* ------------------------------------------------------------- Home page */

export type CtaContent = {
  label: EditorialText;
  href: string;
};

export type HomePage = {
  publicationStatus: PublicationStatus;
  hero: {
    eyebrow?: EditorialText;
    heading: EditorialText;
    paragraphs: EditorialText[];
    primaryCta: CtaContent;
    secondaryCta: CtaContent;
    image: ImageAsset;
  };
  vision: {
    eyebrow: EditorialText;
    heading: EditorialText;
    paragraphs: EditorialText[];
  };
  offering: {
    eyebrow: EditorialText;
    items: Array<{ number: string; body: EditorialText }>;
    images: ImageAsset[];
  };
  featuredPortfolio: {
    heading: EditorialText;
    intro?: EditorialText;
    companyIds: CompanyRef[];
    ctaLabel: EditorialText;
    ctaHref: "/portfolio";
  };
  optionalSections?: {
    statsHeading?: EditorialText;
    testimonialsHeading?: EditorialText;
    latestInsightsHeading?: EditorialText;
    latestInsightsCtaLabel?: EditorialText;
  };
  contact: {
    heading: EditorialText;
    paragraphs: EditorialText[];
    primaryCta: CtaContent;
    secondaryCta: { label: EditorialText; contactPerson: TeamMemberRef };
    contactPeople: TeamMemberRef[];
  };
  seo: SeoFields;
};

/* --------------------------------------------------------------- Pages */

export type LegalPage = {
  slug: string;
  title: string;
  lastUpdated: string;
  body: RichText;
  seo?: SeoFields;
};

export type AboutPage = {
  publicationStatus: PublicationStatus;
  heading: EditorialText;
  intro: EditorialText[];
  beliefs: Array<{ title: EditorialText; body: EditorialText }>;
  howWeWork: Array<{ number: string; body: EditorialText }>;
  whatWeLookFor: Array<{ title: EditorialText; body: EditorialText }>;
  process: Array<{ step: string; title: EditorialText; body: EditorialText }>;
  seo: SeoFields;
};

/* --------------------------------------------------------------- Filters */

export type CompanyFilters = {
  stage?: string[];
  sector?: string[];
  focus?: string[];
  status?: string[];
};

export type PostFilters = {
  type?: string[];
};

export type NetworkFilters = {
  vertical?: string;
  expertise?: string[];
};

/** A filter group rendered in the UI, built only from approved taxonomy (§16.2). */
export type FacetGroup = {
  key: "stage" | "sector" | "focus" | "status" | "type" | "vertical" | "expertise";
  legend: string;
  control: "checkbox" | "radio";
  options: Array<{ slug: string; title: string; count: number }>;
};
