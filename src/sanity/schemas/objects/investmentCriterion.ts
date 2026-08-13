/**
 * `InvestmentCriterion` — one row of the "what we invest in" block (§7.2).
 *
 * These rows are read as commitments: a founder decides whether to spend an
 * afternoon on a pitch based on a ticket range. So each row carries its own
 * evidence and `getSiteSettings` drops any row that is not owner-approved,
 * leaving a shorter honest block rather than a complete speculative one.
 *
 * `editorialNote` is where "blocked until the partner confirms the real range"
 * lives. It is internal and is never rendered.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString, sortOrderField } from "../shared";

export const investmentCriterionSchema: SanityObjectSchema = {
  name: "investmentCriterion",
  title: "Investment criterion",
  type: "object",
  description: "One label-and-value row describing what Foundry invests in.",
  fields: [
    {
      name: "label",
      title: "Label",
      type: "string",
      description:
        'The left-hand term, e.g. "Stage", "Geography", "Ticket range". One or two words; the design sets them in a narrow column.',
      validationRule: { required: true, min: 2, max: 40 },
    },
    {
      name: "value",
      title: "Value",
      type: "string",
      description:
        'The answer, e.g. "Early stage" or "Nordics". Write the exact figure or term Foundry is willing to stand behind — this row is read as a commitment, not as an illustration.',
      validationRule: { required: true, min: 1, max: 80 },
    },
    {
      name: "evidence",
      title: "Evidence",
      type: "fieldEvidence",
      description:
        'Who confirmed this row and when. The row is hidden on the public site until this says "Owner approved", so an unconfirmed ticket range simply does not appear rather than appearing wrong.',
      validationRule: { required: true },
    },
    {
      name: "editorialNote",
      title: "Internal note",
      type: "text",
      description:
        "Why this row is or is not ready — who needs to confirm it, what the open question is. Internal only; never rendered on the site.",
      validationRule: { max: 400 },
    },
    sortOrderField("criteria", "Position in the block. Lower numbers come first."),
  ],
  preview: {
    select: { title: "label", value: "value", status: "evidence.status" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Untitled criterion"),
      subtitle: [
        readString(selection.value),
        readString(selection.status) === "owner-approved" ? "approved" : "not published",
      ]
        .filter((part): part is string => Boolean(part))
        .join(" · "),
    }),
  },
};
