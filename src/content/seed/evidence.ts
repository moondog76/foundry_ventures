/**
 * Evidence and editorial-copy constructors for the seed dataset.
 *
 * Spec §25.1 and §30. Approval is a human act recorded through these helpers,
 * never a default: `ownerApproved` takes a named approver and a date with no
 * fallback value for either, so an approval always leaves an audit trail.
 *
 * The content owner approved publication on 2026-08-11. That approval covers
 * what Foundry already publishes — company names, websites, logos, the live
 * captions and the migrated home copy — and nothing beyond it. Anything the live
 * site does not state (taxonomy, company status, founders, the prototype's
 * ticket range) is still `unverified` and still cannot reach production.
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

/**
 * The content owner who approved this dataset, and when.
 *
 * Recorded rather than implied: §16.8 only unlocks production rendering for
 * fields with a named approver and a date, so every approval below is auditable
 * and reversible.
 */
export const CONTENT_OWNER = "anders.nygren@asortventures.com";
export const OWNER_APPROVED_AT = "2026-08-11";

const OWNER_INSTRUCTION: SourceReference = {
  label: "Content owner instruction to publish (2026-08-11)",
  observedAt: OWNER_APPROVED_AT,
};

/** Owner approval for a fact already observed on the live Foundry site. */
export function ownerApprovedFromLive(
  source: SourceReference = FOUNDRY_HOME_SOURCE,
): FieldEvidence {
  return ownerApproved(CONTENT_OWNER, OWNER_APPROVED_AT, [source, OWNER_INSTRUCTION]);
}

/** Owner approval for something the owner supplied or confirmed directly. */
export function ownerConfirmed(note: string): FieldEvidence {
  return ownerApproved(CONTENT_OWNER, OWNER_APPROVED_AT, [
    { label: note, observedAt: OWNER_APPROVED_AT },
    OWNER_INSTRUCTION,
  ]);
}

/**
 * Copy lifted word-for-word from the frozen live snapshot (§25.1).
 *
 * The content owner approved the migration of Foundry's own published copy on
 * 2026-08-11, so these render in production. This is a migration approval and
 * nothing more — the §25.2 copy-edit list (`AI native` → `AI-native`, the
 * missing apostrophe in `worlds`, and so on) is still an open editorial diff,
 * and the values here remain exactly what the live site publishes.
 */
export function migratedVerbatim(
  value: string,
  options?: { sourceUrl?: string; normalizationNote?: string },
): EditorialText {
  return {
    value,
    origin: "migrated-verbatim",
    approvalStatus: "approved",
    approvedBy: CONTENT_OWNER,
    approvedAt: OWNER_APPROVED_AT,
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
