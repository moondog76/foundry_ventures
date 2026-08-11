/**
 * `EditorialText` — one user-visible string, plus its provenance.
 *
 * Every claim-making sentence on an editorial page travels as one of these, and
 * `canRenderEditorialText` refuses to render it in production until
 * `approvalStatus` is `approved` (§25.1). The two origins mean different things
 * to a reviewer:
 *
 *  - `migrated-verbatim` — copied word for word from the frozen live snapshot,
 *    including its current spelling. Reviewing it is a decision about whether
 *    Foundry still wants to say this.
 *  - `proposed` — new copy from the rebuild. Reviewing it is a decision about
 *    whether Foundry wants to start saying this.
 *
 * Rewriting migrated copy is allowed — but then it is no longer verbatim, and
 * the origin has to change with it. `normalizationNote` exists for the one case
 * that is *not* a rewrite: collapsing non-semantic whitespace on import.
 */

import type { SanityCustomCheck, SanityObjectSchema } from "../../schema-types";
import { APPROVAL_STATUS_OPTIONS, asRecord, previewTitle, readString } from "../shared";

const ORIGIN_OPTIONS = [
  {
    title: "Migrated verbatim — copied word for word from an existing source",
    value: "migrated-verbatim",
  },
  { title: "Proposed — newly written for this site", value: "proposed" },
];

const provenanceIsComplete: SanityCustomCheck = (value) => {
  const text = asRecord(value);
  if (!text) return true;

  if (readString(text.origin) === "migrated-verbatim" && !readString(text.sourceUrl)) {
    return 'Copy marked "migrated verbatim" needs the address it was copied from, so a reviewer can compare the two.';
  }

  if (readString(text.approvalStatus) === "approved") {
    const missing: string[] = [];
    if (!readString(text.approvedBy)) missing.push("who approved it");
    if (!readString(text.approvedAt)) missing.push("the approval date");
    if (missing.length > 0) {
      return `Approved copy goes live as-is, so it needs ${missing.join(" and ")}.`;
    }
  }

  return true;
};

export const editorialTextSchema: SanityObjectSchema = {
  name: "editorialText",
  title: "Editorial text",
  type: "object",
  description:
    "A piece of copy that appears on the site, together with where it came from and whether it has been approved.",
  validationRule: {
    custom:
      "Migrated copy needs a source URL; approved copy needs an approver and an approval date.",
    customCheck: provenanceIsComplete,
  },
  fields: [
    {
      name: "value",
      title: "Text",
      type: "text",
      description:
        "Exactly what the visitor reads. No HTML and no markdown — the design supplies the styling. Write it as one paragraph; use several separate entries where the layout expects several paragraphs.",
      validationRule: { required: true, min: 1, max: 1200 },
    },
    {
      name: "origin",
      title: "Where the wording came from",
      type: "string",
      description:
        'Choose "migrated verbatim" only if the words are unchanged from the source, down to the punctuation. If you have edited it at all, it is "proposed".',
      options: { list: ORIGIN_OPTIONS, layout: "radio" },
      initialValue: "proposed",
      validationRule: { required: true },
    },
    {
      name: "approvalStatus",
      title: "Approval",
      type: "string",
      description:
        "Unapproved copy is visible in preview but never on the public site. Move it to approved once someone has taken responsibility for these exact words.",
      options: { list: APPROVAL_STATUS_OPTIONS, layout: "radio" },
      initialValue: "unapproved",
      validationRule: { required: true },
    },
    {
      name: "sourceUrl",
      title: "Copied from",
      type: "url",
      description:
        'The page the wording was taken from. Required for "migrated verbatim"; useful on proposed copy too when it paraphrases something.',
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "observedAt",
      title: "Date observed",
      type: "date",
      description: "The day the source page was read. Leave empty for copy written from scratch.",
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "approvedAt",
      title: "Approved on",
      type: "date",
      description: "The day these exact words were approved.",
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "approvedBy",
      title: "Approved by",
      type: "string",
      description: "The name of the person who approved these exact words.",
      validationRule: { max: 120 },
    },
    {
      name: "normalizationNote",
      title: "Whitespace note",
      type: "text",
      description:
        'Only for whitespace cleanup during import, e.g. "the source has two spaces between two words; collapsed to one". Wording changes do not belong here — they make the text "proposed" instead. Internal only.',
      validationRule: { max: 400 },
    },
  ],
  preview: {
    select: { title: "value", origin: "origin", approvalStatus: "approvalStatus" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Empty text"),
      subtitle: [
        readString(selection.approvalStatus) === "approved" ? "Approved" : "Not approved",
        readString(selection.origin) === "migrated-verbatim" ? "verbatim" : "proposed",
      ].join(" · "),
    }),
  },
};
