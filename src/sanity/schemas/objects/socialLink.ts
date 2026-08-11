/**
 * `SocialLink` — a profile Foundry actually maintains.
 *
 * The platform list matches `SocialLink["platform"]` in the domain model; those
 * are the only four the footer knows how to label and draw an icon for. Add a
 * row only for an account that exists and is in use — an empty profile is worse
 * than no link.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { previewTitle, readString } from "../shared";

const PLATFORM_OPTIONS = [
  { title: "LinkedIn", value: "linkedin" },
  { title: "X", value: "x" },
  { title: "YouTube", value: "youtube" },
  { title: "Instagram", value: "instagram" },
];

export const socialLinkSchema: SanityObjectSchema = {
  name: "socialLink",
  title: "Social profile",
  type: "object",
  description: "A social account Foundry maintains, shown in the footer.",
  fields: [
    {
      name: "platform",
      title: "Platform",
      type: "string",
      description:
        "Which network this is. Only these four are supported — the footer has an icon and an accessible name for each of them and for nothing else.",
      options: { list: PLATFORM_OPTIONS, layout: "radio" },
      validationRule: { required: true },
    },
    {
      name: "url",
      title: "Profile URL",
      type: "url",
      description:
        "The full https:// address of the profile page. Use the canonical address the platform itself shows, not a shortened or tracked link.",
      validationRule: { required: true, uri: { scheme: ["https"] } },
    },
    {
      name: "label",
      title: "Accessible name",
      type: "string",
      description:
        'What a screen reader announces for the icon, e.g. "Foundry Ventures on LinkedIn". The icon alone says nothing, so this is required.',
      validationRule: { required: true, min: 3, max: 80 },
    },
  ],
  preview: {
    select: { title: "label", platform: "platform", url: "url" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Social profile"),
      subtitle: [readString(selection.platform), readString(selection.url)]
        .filter((part): part is string => Boolean(part))
        .join(" · "),
    }),
  },
};
