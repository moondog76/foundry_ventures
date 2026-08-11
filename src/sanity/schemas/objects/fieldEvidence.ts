/**
 * `FieldEvidence` — the record that decides whether one fact may be published.
 *
 * This is the single most important object in the schema. `canRenderEvidence`
 * in `src/content/policy.ts` reads exactly one thing in production: whether
 * `status` is `owner-approved`. "Observed on the live site" is explicitly not
 * enough — a migration scrape proves the old site said something, not that it
 * is true or that Foundry wants to keep saying it.
 *
 * The Studio-side constraint below mirrors the `ownerApproved()` constructor in
 * `src/content/seed/evidence.ts`, which has no default approver and no default
 * date on purpose: an audit trail with blanks in it is not an audit trail.
 */

import type { SanityCustomCheck, SanityObjectSchema } from "../../schema-types";
import { EVIDENCE_STATUS_OPTIONS, asRecord, isNonEmptyArray, readString } from "../shared";

/** Approval is a named human act on a named day, backed by at least one source. */
const approvalIsAccountable: SanityCustomCheck = (value) => {
  const evidence = asRecord(value);
  if (!evidence) return true;
  if (readString(evidence.status) !== "owner-approved") return true;

  const missing: string[] = [];
  if (!readString(evidence.approvedBy)) missing.push("who approved it");
  if (!readString(evidence.approvedAt)) missing.push("the approval date");
  if (!isNonEmptyArray(evidence.sources)) missing.push("at least one source");

  return missing.length === 0
    ? true
    : `"Owner approved" unlocks this fact on the public site, so it needs ${missing.join(", ")}.`;
};

export const fieldEvidenceSchema: SanityObjectSchema = {
  name: "fieldEvidence",
  title: "Evidence",
  type: "object",
  description: "Where one fact comes from and whether an owner has cleared it for the public site.",
  options: { collapsible: true, collapsed: true },
  validationRule: {
    custom:
      'Status "owner approved" requires an approver, an approval date and at least one source.',
    customCheck: approvalIsAccountable,
  },
  fields: [
    {
      name: "status",
      title: "Status",
      type: "string",
      description:
        'How far this fact has got. The public site shows it only at "Owner approved" — "Observed" means we saw it somewhere but nobody has taken responsibility for it yet, and it stays hidden.',
      options: { list: EVIDENCE_STATUS_OPTIONS, layout: "radio" },
      initialValue: "unverified",
      validationRule: { required: true },
    },
    {
      name: "sources",
      title: "Sources",
      type: "array",
      description:
        "Everywhere this fact was seen. One is usually enough; add more when the fact is contested or when a second source is what made it credible.",
      of: [{ type: "sourceReference" }],
    },
    {
      name: "lastCheckedAt",
      title: "Last checked",
      type: "date",
      description:
        "The last time someone confirmed this is still true. Worth updating for facts that go stale — headcount, status, a job title — even when nothing changed.",
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "approvedAt",
      title: "Approved on",
      type: "date",
      description: 'The day the owner approved it. Required once the status is "Owner approved".',
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "approvedBy",
      title: "Approved by",
      type: "string",
      description:
        'The name of the person who took responsibility for publishing this fact. Required once the status is "Owner approved"; a team name is not enough.',
      validationRule: { max: 120 },
    },
    {
      name: "note",
      title: "Internal note",
      type: "text",
      description:
        "Context for editors and for the content-gaps report: what is missing, who has been asked, what would unblock it. Never rendered on the site.",
      validationRule: { max: 500 },
    },
  ],
  preview: {
    select: { status: "status", approvedBy: "approvedBy", note: "note" },
    prepare: (selection) => {
      const status = readString(selection.status) ?? "unverified";
      const match = EVIDENCE_STATUS_OPTIONS.find((option) => option.value === status);
      return {
        title: match ? match.title.split(" — ")[0] : status,
        subtitle: readString(selection.approvedBy) ?? readString(selection.note) ?? "",
      };
    },
  },
};
