/**
 * `Founder` — a named person on a portfolio company record.
 *
 * Naming someone publicly is a claim about a real person, so the whole list sits
 * behind the company's `founders` evidence record: unapproved, it does not
 * render at all. Add a person here only when Foundry knows the company is happy
 * to be represented this way.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString } from "../shared";

export const founderSchema: SanityObjectSchema = {
  name: "founder",
  title: "Founder",
  type: "object",
  description: "A founder of this company, as Foundry names them publicly.",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description: "The person's full name, spelled and accented the way they spell it themselves.",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      description:
        'Their title at the company, e.g. "Co-founder & CEO". Leave empty rather than guessing between co-founder titles.',
      validationRule: { max: 80 },
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn",
      type: "url",
      description:
        "The person's own LinkedIn profile. Only add it if you have confirmed the profile belongs to them — a wrong link here points at a stranger.",
      validationRule: { uri: { scheme: ["https"] } },
    },
    {
      name: "image",
      title: "Portrait",
      type: "imageAsset",
      description:
        "Optional portrait. Like every image it needs approved rights before it appears, and a portrait of a person generally needs that person's agreement.",
    },
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "image" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Unnamed founder"),
      subtitle: readString(selection.subtitle) ?? "",
      media: selection.media,
    }),
  },
};
