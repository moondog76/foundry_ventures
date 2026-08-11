/**
 * `Stat` — one number in the home-page statistics block (§7.6).
 *
 * A published number that disagrees with the list it describes is a credibility
 * problem, so anything countable is *derived* rather than typed: set
 * `derivedKey` and `getStats` recomputes the value from the same published
 * records the portfolio archive shows, ignoring whatever is stored here.
 *
 * Numbers that cannot be derived — capital deployed, follow-on rate — are typed
 * by hand and therefore need evidence, a source note and an "as of" date, because
 * a hand-typed figure ages the moment it is saved.
 */

import type { SanityCustomCheck, SanityObjectSchema } from "../../schema-types";
import { asRecord, previewTitle, readString, sortOrderField } from "../shared";

/** `Stat["derivedKey"]` in `src/content/types.ts`. */
const DERIVED_KEY_OPTIONS = [
  { title: "Number of active portfolio companies", value: "activeCompanyCount" },
  { title: "Total number of portfolio companies", value: "totalCompanyCount" },
];

const handTypedNumbersAgeOut: SanityCustomCheck = (value) => {
  const stat = asRecord(value);
  if (!stat) return true;
  if (readString(stat.derivedKey)) return true;
  return readString(stat.asOfDate)
    ? true
    : 'A number that is typed in by hand needs an "as of" date, so a reader can tell how old it is. Numbers that count portfolio companies can be derived instead — see the field above.';
};

export const statSchema: SanityObjectSchema = {
  name: "stat",
  title: "Statistic",
  type: "object",
  description: "One number shown in the statistics block, with the story of where it came from.",
  validationRule: {
    custom: 'A statistic that is not derived from live content requires an "as of" date.',
    customCheck: handTypedNumbersAgeOut,
  },
  fields: [
    {
      name: "derivedKey",
      title: "Count this automatically",
      type: "string",
      description:
        "If the number is simply a count of portfolio companies, choose it here and the site counts them for you every time the page is built. The value below is then ignored, so the number can never drift from the portfolio page.",
      options: { list: DERIVED_KEY_OPTIONS, layout: "dropdown" },
    },
    {
      name: "value",
      title: "Value",
      type: "number",
      description:
        "The number itself, digits only — no currency symbol, no plus sign, no thousands separator. Those go in the prefix and suffix fields so the animation counts correctly. Leave at 0 when the number is counted automatically.",
      initialValue: 0,
      validationRule: { required: true, min: 0 },
    },
    {
      name: "prefix",
      title: "Prefix",
      type: "string",
      description: 'What goes immediately before the number, e.g. "€" or "$". Usually empty.',
      validationRule: { max: 4 },
    },
    {
      name: "suffix",
      title: "Suffix",
      type: "string",
      description: 'What goes immediately after the number, e.g. "+", "%" or "M". Usually empty.',
      validationRule: { max: 4 },
    },
    {
      name: "label",
      title: "Label",
      type: "string",
      description:
        'What the number counts, e.g. "Portfolio companies". Two or three words; it sits directly under the figure.',
      validationRule: { required: true, min: 2, max: 60 },
    },
    {
      name: "sourceNote",
      title: "Source note",
      type: "string",
      description:
        'A short line explaining what is being counted, e.g. "Derived from published portfolio records". Shown next to the number where the design allows it, so write it for a reader rather than for the team.',
      validationRule: { max: 160 },
    },
    {
      name: "asOfDate",
      title: "As of",
      type: "date",
      description:
        "The date this figure was true. Required for numbers typed in by hand; unnecessary for counted numbers, which are always current.",
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "evidence",
      title: "Evidence",
      type: "fieldEvidence",
      description:
        'Where the number comes from and who signed it off. The statistic is hidden on the public site until this says "Owner approved" — including counted ones, because a count is only meaningful once the list it counts is approved.',
      validationRule: { required: true },
    },
    sortOrderField("statistics", "Position in the block. Lower numbers come first."),
  ],
  preview: {
    select: {
      title: "label",
      value: "value",
      prefix: "prefix",
      suffix: "suffix",
      derivedKey: "derivedKey",
      status: "evidence.status",
    },
    prepare: (selection) => {
      const rendered = readString(selection.derivedKey)
        ? "counted automatically"
        : `${readString(selection.prefix) ?? ""}${
            typeof selection.value === "number" ? selection.value : "?"
          }${readString(selection.suffix) ?? ""}`;
      return {
        title: previewTitle(selection.title, "Untitled statistic"),
        subtitle: [
          rendered,
          readString(selection.status) === "owner-approved" ? "approved" : "not published",
        ].join(" · "),
      };
    },
  },
};
