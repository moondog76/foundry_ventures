/**
 * Field builders shared by every document type.
 *
 * The publishing policy in `src/content/policy.ts` reads the same four control
 * fields on almost every record — `publicationStatus`, `verificationStatus`,
 * `fieldEvidence` and `sortOrder`. Defining them once means an editor sees the
 * identical wording and the identical option list wherever they appear, and a
 * change to that wording cannot drift between document types.
 *
 * Nothing here is a component or a query: these are plain builders that return
 * the object literals described in `../schema-types`.
 */

import type {
  SanityCustomCheck,
  SanityField,
  SanityPreviewValue,
  SanitySelectOption,
  SanityValidationRule,
} from "../schema-types";
import { RICH_TEXT_MEMBERS } from "./objects/richText";

/* ------------------------------------------------------------ Option lists */

/** `PublicationStatus` in `src/content/types.ts`. */
export const PUBLICATION_STATUS_OPTIONS: SanitySelectOption[] = [
  { title: "Draft — work in progress, never public", value: "draft" },
  { title: "In review — waiting for an owner to check it", value: "review" },
  { title: "Published — may appear on the public site", value: "published" },
];

/** `VerificationStatus` in `src/content/types.ts`. */
export const VERIFICATION_STATUS_OPTIONS: SanitySelectOption[] = [
  { title: "Unverified — nothing checked yet", value: "unverified" },
  { title: "Partially verified — some facts confirmed", value: "partially-verified" },
  { title: "Verified — every public fact confirmed", value: "verified" },
];

/** `ApprovalStatus` in `src/content/types.ts`. */
export const APPROVAL_STATUS_OPTIONS: SanitySelectOption[] = [
  { title: "Unapproved", value: "unapproved" },
  { title: "Approved", value: "approved" },
];

/** `EvidenceStatus` in `src/content/types.ts`. */
export const EVIDENCE_STATUS_OPTIONS: SanitySelectOption[] = [
  { title: "Unverified — no source at all", value: "unverified" },
  { title: "Observed — seen on a source, not yet approved", value: "observed" },
  { title: "Owner approved — cleared for the public site", value: "owner-approved" },
];

/**
 * Slugs are lowercase kebab-case and are used verbatim in URLs and query
 * strings (§8.2). The same pattern guards the revalidation webhook in
 * `src/app/api/revalidate/route.ts`, so a slug that does not match here will
 * also fail to invalidate its own page after an edit.
 */
export const KEBAB_SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

export const SLUG_VALIDATION: SanityValidationRule = {
  required: true,
  max: 96,
  regex: { pattern: KEBAB_SLUG_PATTERN, name: "lowercase kebab-case" },
};

/* -------------------------------------------------------- Preview plumbing */

export function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Sanity stores a slug as `{ _type: "slug", current: "…" }`. */
export function readSlugValue(value: unknown): string | undefined {
  const record = asRecord(value);
  return record ? readString(record.current) : readString(value);
}

export function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

const TITLE_BY_VALUE = (options: SanitySelectOption[], value: unknown): string | undefined => {
  const raw = readString(value);
  if (!raw) return undefined;
  const match = options.find((option) => option.value === raw);
  // Option titles carry an explanatory clause; the list only needs the first part.
  return match ? match.title.split(" — ")[0] : raw;
};

/**
 * The subtitle every document list uses: publication state first, then how far
 * verification has got, then any extra context the document wants to add.
 * Seeing both at a glance is the point — "published" alone hides the fact that
 * production will still refuse to render most of the record (§16.8).
 */
export function statusSubtitle(
  selection: Record<string, unknown>,
  extra?: Array<string | undefined>,
): string {
  const parts = [
    TITLE_BY_VALUE(PUBLICATION_STATUS_OPTIONS, selection.publicationStatus),
    TITLE_BY_VALUE(VERIFICATION_STATUS_OPTIONS, selection.verificationStatus),
    ...(extra ?? []),
  ];
  return parts.filter((part): part is string => Boolean(part)).join(" · ");
}

/** Keeps `title` a `string`, which `SanityPreviewValue` requires. */
export function previewTitle(value: unknown, fallback: string): string {
  return readString(value) ?? fallback;
}

export function preview(title: string, subtitle: string, media?: unknown): SanityPreviewValue {
  return media === undefined ? { title, subtitle } : { title, subtitle, media };
}

/* ------------------------------------------------------- Cross-field rules */

/**
 * `canListPostPublicly` and every dated surface require a real publication
 * date; a published record without one silently drops out of the archive
 * instead of failing loudly. Catching it in the Studio is much cheaper.
 */
export const publishedRequiresDate: SanityCustomCheck = (value) => {
  const document = asRecord(value);
  if (!document) return true;
  if (readString(document.publicationStatus) !== "published") return true;
  return readString(document.publishedAt)
    ? true
    : 'A published record needs a publication date. Set "Published at", or move the status back to draft.';
};

/* ---------------------------------------------------------- Field builders */

export function publicationStatusField(recordLabel: string): SanityField {
  return {
    name: "publicationStatus",
    title: "Publication status",
    type: "string",
    description: `Where this ${recordLabel} is in the editorial workflow. Only "Published" can reach the public site — and even then, each individual fact still needs its own approved evidence below.`,
    options: { list: PUBLICATION_STATUS_OPTIONS, layout: "radio" },
    initialValue: "draft",
    validationRule: { required: true },
  };
}

export function verificationStatusField(recordLabel: string): SanityField {
  return {
    name: "verificationStatus",
    title: "Verification status",
    type: "string",
    description: `A summary of how much of this ${recordLabel} has been checked against a source. It is a reporting aid for editors: the site decides what to show from the per-field evidence, not from this field.`,
    options: { list: VERIFICATION_STATUS_OPTIONS, layout: "radio" },
    initialValue: "unverified",
    validationRule: { required: true },
  };
}

export function sortOrderField(recordLabel: string, description?: string): SanityField {
  return {
    name: "sortOrder",
    title: "Sort order",
    type: "number",
    description:
      description ??
      `Position in lists of ${recordLabel}. Lower numbers come first; equal numbers fall back to alphabetical order. Leave gaps (10, 20, 30…) so a new entry can be slotted in without renumbering everything.`,
    initialValue: 100,
    validationRule: { required: true, integer: true, min: 0 },
  };
}

export function featuredField(description: string): SanityField {
  return {
    name: "featured",
    title: "Featured",
    type: "boolean",
    description,
    initialValue: false,
  };
}

export function slugField(description: string, source = "name"): SanityField {
  return {
    name: "slug",
    title: "Slug",
    type: "slug",
    description,
    options: { source, maxLength: 96 },
    validationRule: SLUG_VALIDATION,
  };
}

export function seoField(recordLabel: string): SanityField {
  return {
    name: "seo",
    title: "Search & social",
    type: "seoFields",
    description: `Optional overrides for how this ${recordLabel} appears in search results and when its link is shared. Leave it empty and the site derives everything from approved page content — filling it in is only worth it when the derived text is wrong.`,
    group: "seo",
  };
}

/**
 * A `fieldEvidence` object: one evidence record per publicly claimed fact.
 *
 * This is the backbone of the publishing policy (§16.8) — in production a field
 * renders only when its own evidence says `owner-approved`. It is collapsed by
 * default because it is long, and every entry names the field it unlocks.
 */
export function fieldEvidenceField(
  recordLabel: string,
  entries: Array<{ name: string; title: string; description: string }>,
): SanityField {
  return {
    name: "fieldEvidence",
    title: "Evidence",
    type: "object",
    description: `Where each public fact about this ${recordLabel} comes from, and whether an owner has cleared it. This is what the live site actually checks: a field with no evidence, or with evidence below "Owner approved", is hidden in production even when the value is filled in.`,
    options: { collapsible: true, collapsed: true },
    group: "evidence",
    fields: entries.map((entry) => ({
      name: entry.name,
      title: entry.title,
      type: "fieldEvidence",
      description: entry.description,
    })),
  };
}

/** A long-form field using the shared, deliberately narrow rich-text editor. */
export function richTextField(
  name: string,
  title: string,
  description: string,
  extra?: Partial<SanityField>,
): SanityField {
  return {
    name,
    title,
    type: "array",
    description,
    of: RICH_TEXT_MEMBERS,
    ...extra,
  };
}

/** An `editorialText` field — every user-visible string on an editorial page. */
export function editorialTextField(
  name: string,
  title: string,
  description: string,
  extra?: Partial<SanityField>,
): SanityField {
  return {
    name,
    title,
    type: "editorialText",
    description,
    ...extra,
  };
}

/** A repeating list of `editorialText`, e.g. the paragraphs of a section. */
export function editorialTextListField(
  name: string,
  title: string,
  description: string,
  extra?: Partial<SanityField>,
): SanityField {
  return {
    name,
    title,
    type: "array",
    description,
    of: [{ type: "editorialText" }],
    ...extra,
  };
}
