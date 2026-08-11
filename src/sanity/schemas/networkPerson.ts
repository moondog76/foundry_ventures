/**
 * `networkPerson` — an operating partner, advisor or angel (§16.6).
 *
 * These are people who are *not* employed by Foundry, which changes the bar:
 * naming someone as an advisor is a public claim about a relationship they are
 * part of. `canListNetworkPersonPublicly` therefore requires the name and the
 * role line to be owner-approved before the person appears at all, and the whole
 * section stays behind the `network` feature flag until there is a real network
 * to show (§14).
 *
 * There is no detail route for a network person — the archive card is the whole
 * surface — so there is no long bio and no slug-driven page. The slug exists to
 * give each card a stable anchor and a stable key.
 */

import type { SanityDocumentSchema } from "../schema-types";
import {
  featuredField,
  fieldEvidenceField,
  preview,
  previewTitle,
  publicationStatusField,
  readString,
  slugField,
  sortOrderField,
  statusSubtitle,
  verificationStatusField,
} from "./shared";

/** `NetworkPerson["group"]` in `src/content/types.ts`. */
const NETWORK_GROUP_OPTIONS = [
  {
    title: "Operating partner — works hands-on with portfolio companies",
    value: "operating-partner",
  },
  { title: "Advisor — advises Foundry or its companies", value: "advisor" },
  { title: "Angel network — invests alongside Foundry", value: "angel-network" },
];

export const networkPersonSchema: SanityDocumentSchema = {
  name: "networkPerson",
  title: "Network person",
  type: "document",
  description:
    "An operating partner, advisor or angel in Foundry's network. Only add someone who has agreed to be listed.",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "relations", title: "Tags" },
    { name: "evidence", title: "Evidence" },
  ],
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description:
        "Full name, spelled and accented the way this person spells it. Required, and it must be approved below before the card appears publicly.",
      group: "identity",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      ...slugField(
        "A short identifier for this person, generated from the name. There is no separate page for a network person — this is used as the card's anchor and as a stable key when the list is re-ordered.",
        "name",
      ),
      group: "identity",
    },
    {
      name: "group",
      title: "Relationship",
      type: "string",
      description:
        "How this person relates to Foundry. It determines which section of the network page they appear in, so pick the one they would use to describe themselves.",
      group: "identity",
      options: { list: NETWORK_GROUP_OPTIONS, layout: "radio" },
      validationRule: { required: true },
    },
    {
      name: "roleLine",
      title: "Role line",
      type: "string",
      description:
        'The single line under the name, e.g. "Former CTO, Klarna" or "Angel investor, Stockholm". One line only — the card has room for one. Required and approved before the person appears publicly, because this line is the claim being made about them.',
      group: "identity",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      name: "image",
      title: "Portrait",
      type: "imageAsset",
      description:
        "A photograph, if the person has provided one and agreed to it being published. Without an approved image the card uses the typographic treatment.",
      group: "identity",
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn",
      type: "url",
      description:
        "Their LinkedIn profile, if they are happy to be linked to. Confirm the profile is theirs — a wrong link here points at a stranger.",
      group: "identity",
      validationRule: { uri: { scheme: ["https"] } },
    },
    { ...publicationStatusField("person"), group: "identity" },
    { ...verificationStatusField("person"), group: "identity" },
    {
      ...featuredField(
        "Tick to bring this person to the front of their section. Use it sparingly; if everyone is featured, nobody is.",
      ),
      group: "identity",
    },
    { ...sortOrderField("network people"), group: "identity" },

    {
      name: "verticals",
      title: "Verticals",
      type: "array",
      description:
        'The industries this person knows, chosen from the shared vocabulary. Visitors filter the network page by one vertical at a time, so pick the ones they would genuinely be the right person for. Only terms in the "Vertical" group belong here.',
      group: "relations",
      of: [
        {
          type: "reference",
          to: [{ type: "taxonomy" }],
          options: { filter: 'group == "vertical"' },
        },
      ],
      validationRule: { unique: true },
    },
    {
      name: "expertise",
      title: "Areas of expertise",
      type: "array",
      description:
        'What this person is good at, chosen from the shared vocabulary. Visitors can select several at once. Only terms in the "Expertise" group belong here.',
      group: "relations",
      of: [
        {
          type: "reference",
          to: [{ type: "taxonomy" }],
          options: { filter: 'group == "expertise"' },
        },
      ],
      validationRule: { unique: true },
    },

    fieldEvidenceField("person", [
      {
        name: "name",
        title: "Name",
        description:
          "That this person has agreed to be listed as part of Foundry's network under this name. Required before the card appears at all.",
      },
      {
        name: "group",
        title: "Relationship",
        description:
          "That they agree with how the relationship is described — advisor, operating partner or angel.",
      },
      {
        name: "image",
        title: "Portrait",
        description: "That they agreed to this photograph being published.",
      },
      {
        name: "roleLine",
        title: "Role line",
        description:
          "That this exact line is accurate and they are happy with it. Also required before the card appears.",
      },
      {
        name: "linkedinUrl",
        title: "LinkedIn",
        description: "That the profile is theirs and they are happy to be linked to.",
      },
      {
        name: "verticals",
        title: "Verticals",
        description: "That these industries reflect what they actually work in.",
      },
      {
        name: "expertise",
        title: "Areas of expertise",
        description: "That these areas reflect what they can actually help with.",
      },
    ]),
  ],
  preview: {
    select: {
      title: "name",
      roleLine: "roleLine",
      group: "group",
      publicationStatus: "publicationStatus",
      verificationStatus: "verificationStatus",
      media: "image",
    },
    prepare: (selection) =>
      preview(
        previewTitle(selection.title, "Unnamed person"),
        statusSubtitle(selection, [readString(selection.group), readString(selection.roleLine)]),
        selection.media,
      ),
  },
};
