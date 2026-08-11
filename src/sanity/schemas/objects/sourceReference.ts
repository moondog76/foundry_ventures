/**
 * `SourceReference` — where a single fact was seen.
 *
 * Used inside `fieldEvidence` and `seoFields`. A source is a note about the
 * *world*, not about the CMS: it records what was observed and when, so that a
 * claim on the public site can be traced back to something a person can check.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString } from "../shared";

export const sourceReferenceSchema: SanityObjectSchema = {
  name: "sourceReference",
  title: "Source",
  type: "object",
  description: "One place a fact was seen, and the date it was seen there.",
  fields: [
    {
      name: "label",
      title: "What the source is",
      type: "string",
      description:
        'A short description a colleague would recognise, e.g. "Founder confirmation by email" or "Company press release". Not a URL — that goes in the next field.',
      validationRule: { required: true, min: 3, max: 160 },
    },
    {
      name: "url",
      title: "Link to the source",
      type: "url",
      description:
        "The web address of the source, if it is online. Leave empty for offline sources such as a phone call or a signed document; describe those in the label and the note instead.",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "observedAt",
      title: "Date observed",
      type: "date",
      description:
        "The day this source was actually looked at. Not today's date by habit — an old observation is still useful, but only if the date is honest.",
      options: { dateFormat: "YYYY-MM-DD" },
      validationRule: { required: true },
    },
    {
      name: "note",
      title: "Note",
      type: "text",
      description:
        "Anything a later reader needs in order to judge the source: an exact quote, a caveat, a page reference. Internal only — never shown on the site.",
      validationRule: { max: 500 },
    },
  ],
  preview: {
    select: { title: "label", observedAt: "observedAt", url: "url" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Source"),
      subtitle: [readString(selection.observedAt), readString(selection.url)]
        .filter((part): part is string => Boolean(part))
        .join(" · "),
    }),
  },
};
