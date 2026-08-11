/**
 * `Address` — the postal address, used for structured data (§21.3).
 *
 * Nothing here may be guessed. An address is either published because Foundry
 * has decided to publish it, or it is absent; a half-remembered street name in
 * `schema.org` markup is a fabricated fact like any other.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString } from "../shared";

export const addressSchema: SanityObjectSchema = {
  name: "address",
  title: "Address",
  type: "object",
  description:
    "The postal address published on the site and in the structured data search engines read. Leave the whole object empty unless the real address has been confirmed.",
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: "streetAddress",
      title: "Street address",
      type: "string",
      description: "Street name and number, including any floor or suite on the same line.",
      validationRule: { max: 160 },
    },
    {
      name: "postalCode",
      title: "Postal code",
      type: "string",
      description: "Postal code exactly as it is written locally, spacing included.",
      validationRule: { max: 20 },
    },
    {
      name: "addressLocality",
      title: "City",
      type: "string",
      description: "The city or town.",
      validationRule: { max: 100 },
    },
    {
      name: "addressCountry",
      title: "Country",
      type: "string",
      description:
        'The two-letter country code used by structured data, e.g. "SE" for Sweden, "NO" for Norway, "DK" for Denmark, "FI" for Finland.',
      validationRule: {
        max: 2,
        regex: { pattern: "^[A-Z]{2}$", name: "two-letter uppercase country code" },
      },
    },
  ],
  preview: {
    select: { street: "streetAddress", locality: "addressLocality", country: "addressCountry" },
    prepare: (selection) => ({
      title: previewTitle(selection.street, "No address"),
      subtitle: [readString(selection.locality), readString(selection.country)]
        .filter((part): part is string => Boolean(part))
        .join(", "),
    }),
  },
};
