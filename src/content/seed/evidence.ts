/**
 * Evidence and editorial-copy constructors for the seed dataset.
 *
 * Spec §25.1 and §30. Every fact carried over from the 2026-08-10 live snapshot
 * is seeded as `observed` — never `owner-approved`. Every string is seeded as
 * `unapproved`. Approval is a human act recorded through these helpers, not a
 * default.
 */

import type { EditorialText, FieldEvidence, SourceReference } from "../types";

/** The date the live site and prototype were captured (buildspec header). */
export const OBSERVED_AT = "2026-08-10";

export const FOUNDRY_HOME_SOURCE: SourceReference = {
  label: "Foundry Ventures home (live)",
  url: "https://www.foundryventures.ai/",
  observedAt: OBSERVED_AT,
  note: "Appendix C frozen snapshot",
};

export const FOUNDRY_PORTFOLIO_SOURCE: SourceReference = {
  label: "Foundry Ventures portfolio (live)",
  url: "https://www.foundryventures.ai/portfolio",
  observedAt: OBSERVED_AT,
  note: "Appendix C frozen snapshot",
};

export const CLAUDE_PROTOTYPE_SOURCE: SourceReference = {
  label: "Claude Design prototype (Foundry Ventures.dc.html)",
  observedAt: OBSERVED_AT,
  note: "Layout study only — not a source of fact (buildspec §1.2)",
};

export const BUILDSPEC_SOURCE: SourceReference = {
  label: "Foundry Ventures rebuild buildspec",
  observedAt: OBSERVED_AT,
  note: "Proposed copy pending editorial review",
};

/** A fact seen on the live site. Publishable in preview only. */
export function observed(
  source: SourceReference = FOUNDRY_HOME_SOURCE,
  extra?: Partial<FieldEvidence>,
): FieldEvidence {
  return {
    status: "observed",
    sources: [source],
    lastCheckedAt: OBSERVED_AT,
    ...extra,
  };
}

/** No source at all — the field must not be rendered anywhere as fact. */
export function unverified(note?: string): FieldEvidence {
  return {
    status: "unverified",
    sources: note ? [{ label: note, observedAt: OBSERVED_AT }] : [],
  };
}

/**
 * The only constructor that unlocks production rendering. It requires a named
 * approver and a date so the audit trail is real — there is deliberately no
 * default value for either argument.
 */
export function ownerApproved(
  approvedBy: string,
  approvedAt: string,
  sources: SourceReference[],
): FieldEvidence {
  return {
    status: "owner-approved",
    sources,
    approvedBy,
    approvedAt,
    lastCheckedAt: approvedAt,
  };
}

/** Copy lifted word-for-word from the frozen live snapshot (§25.1). */
export function migratedVerbatim(
  value: string,
  options?: { sourceUrl?: string; normalizationNote?: string },
): EditorialText {
  return {
    value,
    origin: "migrated-verbatim",
    approvalStatus: "unapproved",
    sourceUrl: options?.sourceUrl ?? "https://www.foundryventures.ai/",
    observedAt: OBSERVED_AT,
    ...(options?.normalizationNote ? { normalizationNote: options.normalizationNote } : {}),
  };
}

/** New copy from the prototype or the buildspec — always needs approval (§25.1). */
export function proposed(value: string): EditorialText {
  return {
    value,
    origin: "proposed",
    approvalStatus: "unapproved",
    observedAt: OBSERVED_AT,
  };
}
