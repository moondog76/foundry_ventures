/**
 * Central publication policy.
 *
 * Spec §16.8: "Implementera en central policyfunktion, inte utspridda if-satser."
 * `generateStaticParams`, the sitemap, filter facets and related-content queries
 * all route through these functions so a record can never be publishable in one
 * surface and not another.
 *
 * The single rule that governs everything: **a field is publishable in
 * production only when its own `FieldEvidence.status` is `owner-approved`.**
 * `observed` is what a live-site scrape produces and is explicitly not enough.
 */

import type {
  Company,
  CompanyFactField,
  EditorialText,
  FieldEvidence,
  ImageAsset,
  TeamMember,
  TeamMemberEvidenceField,
} from "./types";

export type PolicyMode = "production" | "preview";

export type PolicyContext = {
  mode: PolicyMode;
};

export const PRODUCTION_POLICY: PolicyContext = { mode: "production" };
export const PREVIEW_POLICY: PolicyContext = { mode: "preview" };

/** A record blocked from publishing, with the exact reason — used by CI (§16.8). */
export type PolicyBlock = {
  recordType:
    | "company"
    | "teamMember"
    | "post"
    | "testimonial"
    | "networkPerson"
    | "siteSettings"
    | "homePage";
  recordId: string;
  field: string;
  reason: string;
};

/* --------------------------------------------------------------- Primitives */

export function isOwnerApproved(evidence: FieldEvidence | undefined): boolean {
  return evidence?.status === "owner-approved";
}

/**
 * Preview renders unapproved data (clearly flagged); production never does.
 */
export function canRenderEvidence(
  evidence: FieldEvidence | undefined,
  context: PolicyContext,
): boolean {
  if (context.mode === "preview") return true;
  return isOwnerApproved(evidence);
}

export function canRenderEditorialText(
  text: EditorialText | undefined,
  context: PolicyContext,
): boolean {
  if (!text || text.value.trim() === "") return false;
  if (context.mode === "preview") return true;
  return text.approvalStatus === "approved";
}

/**
 * Every rendered image needs cleared rights in production (§16.7). A missing or
 * unverified image falls back to the defined typographic treatment — it is never
 * swapped for a stock or placeholder picture.
 */
export function canRenderImage(
  image: ImageAsset | undefined | null,
  context: PolicyContext,
): image is ImageAsset {
  if (!image) return false;
  // An export reference whose binary is not in the workspace must never render;
  // hotlinking the live CDN is explicitly out of scope (§5.5, Appendix A.2).
  if (!image.available) return false;
  if (context.mode === "preview") return true;
  return image.rightsStatus === "approved";
}

/* ------------------------------------------------------------------ Company */

/** Core identity is the minimum a sparse portfolio card may show (§16.2). */
export const COMPANY_CORE_IDENTITY_FIELDS: CompanyFactField[] = ["name", "logo", "websiteUrl"];

/** Fields the internal detail template actually renders as claims. */
export const COMPANY_DETAIL_REQUIRED_FIELDS: CompanyFactField[] = [
  "name",
  "shortDescription",
  "body",
];

export function canPublishCompanyField(
  company: Company,
  field: CompanyFactField,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  return canRenderEvidence(company.fieldEvidence[field], context);
}

/**
 * A company may appear in the public archive when it is published and at least
 * its name is owner-approved. Logo and website are individually gated so a
 * name-only record degrades to the typographic fallback rather than disappearing.
 */
export function canListCompanyPublicly(
  company: Company,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return true;
  if (company.publicationStatus !== "published") return false;
  // `inactive` is an internal lifecycle state and never surfaces publicly (§8.2).
  if (company.status === "inactive" && canPublishCompanyField(company, "status", context)) {
    return false;
  }
  return canPublishCompanyField(company, "name", context);
}

/**
 * The internal `/portfolio/[slug]` route only exists when the template has
 * enough approved substance to justify it — `noindex` is not a substitute (§16.2).
 */
export function canPublishCompanyDetail(
  company: Company,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return true;
  if (company.publicationStatus !== "published") return false;
  if (!COMPANY_CORE_IDENTITY_FIELDS.every((f) => canPublishCompanyField(company, f, context))) {
    return false;
  }
  if (!COMPANY_DETAIL_REQUIRED_FIELDS.every((f) => canPublishCompanyField(company, f, context))) {
    return false;
  }
  return Boolean(company.body?.length) && Boolean(company.shortDescription?.trim());
}

export function canIndexCompany(
  company: Company,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return false;
  if (company.seo?.noIndex) return false;
  return canPublishCompanyDetail(company, context);
}

/** Card destination resolution — internal detail, else verified external site. */
export function resolveCompanyHref(
  company: Company,
  context: PolicyContext = PRODUCTION_POLICY,
): { href: string | null; externalHref: string | null } {
  const detail = canPublishCompanyDetail(company, context);
  const websiteApproved =
    canPublishCompanyField(company, "websiteUrl", context) && Boolean(company.websiteUrl);
  return {
    href: detail ? `/portfolio/${company.slug}` : null,
    externalHref: !detail && websiteApproved ? (company.websiteUrl as string) : null,
  };
}

/* --------------------------------------------------------------- TeamMember */

export function canPublishTeamField(
  member: TeamMember,
  field: TeamMemberEvidenceField,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  return canRenderEvidence(member.fieldEvidence[field], context);
}

export function canListTeamMemberPublicly(
  member: TeamMember,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return true;
  if (!member.active) return false;
  if (member.publicationStatus !== "published") return false;
  return (
    canPublishTeamField(member, "name", context) && canPublishTeamField(member, "role", context)
  );
}

/**
 * Thin profile pages are forbidden (§10.2): without an approved long bio the
 * person stays on `/team#slug`.
 */
export function canPublishTeamDetail(
  member: TeamMember,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return true;
  if (!canListTeamMemberPublicly(member, context)) return false;
  if (!canPublishTeamField(member, "longBio", context)) return false;
  return Boolean(member.longBio?.length);
}

export function canIndexTeamMember(
  member: TeamMember,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  if (context.mode === "preview") return false;
  if (member.seo?.noIndex) return false;
  return canPublishTeamDetail(member, context);
}

/* -------------------------------------------------------------------- Post */

/* --------------------------------------------------- Generic entry points */

type PolicyRecord =
  | { kind: "company"; record: Company }
  | { kind: "teamMember"; record: TeamMember };

export function canListPublicly(
  entry: PolicyRecord,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  switch (entry.kind) {
    case "company":
      return canListCompanyPublicly(entry.record, context);
    case "teamMember":
      return canListTeamMemberPublicly(entry.record, context);
  }
}

export function canPublishDetail(
  entry: PolicyRecord,
  context: PolicyContext = PRODUCTION_POLICY,
): boolean {
  switch (entry.kind) {
    case "company":
      return canPublishCompanyDetail(entry.record, context);
    case "teamMember":
      return canPublishTeamDetail(entry.record, context);
    default:
      return false;
  }
}

export function canIndex(entry: PolicyRecord, context: PolicyContext = PRODUCTION_POLICY): boolean {
  switch (entry.kind) {
    case "company":
      return canIndexCompany(entry.record, context);
    case "teamMember":
      return canIndexTeamMember(entry.record, context);
    default:
      return false;
  }
}

/* ------------------------------------------------- Content integrity report */

/**
 * Explains precisely which records/fields block publication. Consumed by the CI
 * content-integrity test and by `docs/content-gaps.md` generation (§16.8).
 */
export function collectCompanyBlocks(company: Company): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  if (company.publicationStatus !== "published") {
    blocks.push({
      recordType: "company",
      recordId: company.slug,
      field: "publicationStatus",
      reason: `publicationStatus is "${company.publicationStatus}", needs "published"`,
    });
  }
  for (const field of COMPANY_CORE_IDENTITY_FIELDS) {
    if (!canPublishCompanyField(company, field)) {
      blocks.push({
        recordType: "company",
        recordId: company.slug,
        field,
        reason: `evidence is "${company.fieldEvidence[field]?.status ?? "missing"}", needs "owner-approved"`,
      });
    }
  }
  return blocks;
}

export function collectTeamMemberBlocks(member: TeamMember): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  if (member.publicationStatus !== "published") {
    blocks.push({
      recordType: "teamMember",
      recordId: member.slug,
      field: "publicationStatus",
      reason: `publicationStatus is "${member.publicationStatus}", needs "published"`,
    });
  }
  for (const field of ["name", "role"] as TeamMemberEvidenceField[]) {
    if (!canPublishTeamField(member, field)) {
      blocks.push({
        recordType: "teamMember",
        recordId: member.slug,
        field,
        reason: `evidence is "${member.fieldEvidence[field]?.status ?? "missing"}", needs "owner-approved"`,
      });
    }
  }
  return blocks;
}
