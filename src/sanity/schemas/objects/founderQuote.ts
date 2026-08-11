/**
 * `FounderQuote` — a founder speaking on their own company's page.
 *
 * Distinct from the `testimonial` document, which is a quote *about Foundry*
 * shown on the home page and therefore carries a formal consent record. This one
 * lives on the company page and is governed by the company record's evidence.
 * Both share the same rule: the words must be what the person actually said.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString } from "../shared";

export const founderQuoteSchema: SanityObjectSchema = {
  name: "founderQuote",
  title: "Founder quote",
  type: "object",
  description:
    "A short quotation from a founder of this company, shown on the company page. Only fill this in when the person has actually said it and is happy to be quoted.",
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: "quote",
      title: "Quote",
      type: "text",
      description:
        "Their words, without surrounding quotation marks — the design adds those. Keep the wording as they said or wrote it; tidying punctuation is fine, rewriting the sentence is not.",
      validationRule: { required: true, min: 20, max: 400 },
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      description: "The person's full name, spelled the way they spell it.",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      description: 'Their role, e.g. "Co-founder & CEO". Leave empty if you are not certain.',
      validationRule: { max: 80 },
    },
    {
      name: "location",
      title: "Location",
      type: "string",
      description:
        'Optional city or country, e.g. "Stockholm". Only worth adding where it says something — otherwise leave it out.',
      validationRule: { max: 80 },
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn",
      type: "url",
      description:
        "The speaker's own profile, if the quote should link to them. Confirm the profile is theirs before adding it.",
      validationRule: { uri: { scheme: ["https"] } },
    },
  ],
  preview: {
    select: { title: "name", quote: "quote", subtitle: "title" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Unattributed quote"),
      subtitle: readString(selection.subtitle) ?? readString(selection.quote) ?? "",
    }),
  },
};
