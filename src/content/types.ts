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
  /**
   * Why this string is approved without having been read line by line. Present
   * only on copy the owner commissioned but explicitly chose not to review, so
   * the distinction between "Foundry wrote this" and "Foundry asked for this"
   * survives in the record rather than living in a commit message.
   */
  authoringNote?: string;
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

/**
 * Feature flags, reduced to the three surfaces that can genuinely be on or off.
 *
 * The old set gated routes that no longer exist. §7.1 fixes the public site at
 * `/`, `/portfolio`, `/fund` and `/privacy`, and §17 rules out the blog, pitch
 * form, network directory, stats wall and testimonial carousel permanently — so
 * a flag for each was a switch wired to nothing.
 *
 * What remains are the three surfaces blocked on *content* rather than on a
 * decision, which is exactly what a flag should express.
 */
export type FeatureFlags = {
  /** The six-fact investment model strip (§8.3). */
  investmentCriteria: boolean;
  /** The single founder quote (§8.7). Off until one is approved for publication. */
  founderQuote: boolean;
  /**
   * Legal entity, registered address, organisation number and any regulatory
   * statement, on `/fund` and in the footer (§8.11). Off until counsel approves
   * the values — §16 blocks release of draft legal language rather than
   * publishing a placeholder.
   */
  institutionalDetails: boolean;
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
  /**
   * Whether this person materially owns investment decisions (§8.7).
   *
   * This is what the decision-maker block and `/fund` render from — not
   * "everyone on the team". §8.7 forbids implying a team larger than reality,
   * and separating the two means adding an operations hire later cannot
   * silently promote them into the investment story.
   */
  ownsInvestmentDecision: boolean;
  active: boolean;
  sortOrder: number;
  seo?: SeoFields;
};

export type TeamMemberRef = { id: string; slug: string; name: string };

/** Team profile view model, with reverse relations resolved (§16.4.1). */
export type TeamMemberView = TeamMember & {
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
  /**
   * `bleed` is for artwork that carries its own field — Newly's mark ships as a
   * black square with the wordmark inside it, so it fills the frame instead of
   * floating as a small tile on a different colour.
   */
  logoFit?: "contain" | "wide" | "compact" | "bleed";
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
  logoFit: "contain" | "wide" | "compact" | "bleed";
  logoSurface: "dark" | "light";
  opticalScale: number;
  cardImage: ImageAsset | null;
  /**
   * The 10-14 word card descriptor (§8.4), for the homepage grid where nine or
   * ten of these sit together and length turns proof of taste into a directory.
   */
  tagline: string | null;
  /**
   * The 22-28 word descriptor (§8.10), for the `/portfolio` grid, where there
   * is room to say what the company does and who it is for.
   */
  descriptor: string | null;
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
  previous: CompanySummary | null;
  next: CompanySummary | null;
};

/* ------------------------------------------------------------------ Posts */

export type PostType = "article" | "portfolio-news";

/* ----------------------------------------------------------- Testimonials */

/* -------------------------------------------------------- Network people */

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
    /**
     * Editorial imagery beside the items. Optional and currently unused: §8.6
     * removes the two-image composition unless replacement art passes the
     * §9.8 standard, and §16 says use less imagery rather than fill the gap.
     */
    images?: ImageAsset[];
  };
  featuredPortfolio: {
    heading: EditorialText;
    intro?: EditorialText;
    companyIds: CompanyRef[];
    /** Omitted when the section should end on the tiles themselves. */
    ctaLabel?: EditorialText;
    ctaHref: "/portfolio";
  };
  contact: {
    heading: EditorialText;
    paragraphs: EditorialText[];
    /**
     * The single closing action, addressed to a person rather than a route.
     * §9.7 allows one primary action per section and §17 rules out a form, so
     * there is deliberately no second CTA to compete with this one.
     */
    primaryCta: { label: EditorialText; contactPerson: TeamMemberRef };
    contactPeople: TeamMemberRef[];
  };
  seo: SeoFields;
};

/**
 * The quiet institutional layer (§8.11).
 *
 * Budget: ~400-500 words, at most four modules before the footer, and no
 * repetition of homepage copy. Deliberately absent from this model, per §8.11's
 * explicit exclusions: fund size, vintage, deployment data, target returns, LP
 * names, data room, portal links and any lead form.
 */
export type FundPage = {
  publicationStatus: PublicationStatus;
  hero: {
    heading: EditorialText;
    /** One paragraph, maximum 45 words. */
    intro: EditorialText;
  };
  /** The same six facts as the homepage strip, from one source of truth. */
  factsHeading: EditorialText;
  model: {
    heading: EditorialText;
    /** One 70-100 word explanation of team-first underwriting. */
    body: EditorialText;
    /**
     * Three compact steps. §8.11 warns against false timeline promises, so
     * these describe sequence, never duration.
     */
    steps: Array<{ number: string; title: EditorialText; body: EditorialText }>;
  };
  people: {
    heading: EditorialText;
    /** Rendered from `TeamMember` records where `ownsInvestmentDecision`. */
    memberIds: TeamMemberRef[];
  };
  contact: {
    heading: EditorialText;
    body: EditorialText;
    contactPerson: TeamMemberRef;
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
