/**
 * `teamMember` — a person at Foundry (§16.3).
 *
 * Two rules shape this type.
 *
 * **Thin profile pages are forbidden (§10.2).** `/team/[slug]` exists only when
 * the long bio is present *and* owner-approved; otherwise the person appears in
 * the team list and links to `/team#slug`. So the long bio is not decoration —
 * it is what decides whether a page exists at all, and a profile page with three
 * sentences on it is worse for the person than no page.
 *
 * **Every contact channel is approved separately (§10.3).** Email, phone and
 * LinkedIn each have their own evidence record, because "you may print my work
 * email" and "you may print my mobile number" are different consents. The site
 * shows exactly the channels whose evidence is approved and hides the rest.
 *
 * Relations point *at* this person, never from it: a company names its deal
 * lead and a post names its authors, and the profile page resolves those in
 * reverse (§16.4.1). There is deliberately no "companies" field here to fall out
 * of step with them.
 */

import type { SanityDocumentSchema } from "../schema-types";
import {
  fieldEvidenceField,
  isNonEmptyArray,
  preview,
  previewTitle,
  publicationStatusField,
  richTextField,
  seoField,
  slugField,
  sortOrderField,
  statusSubtitle,
  verificationStatusField,
} from "./shared";

export const teamMemberSchema: SanityDocumentSchema = {
  name: "teamMember",
  title: "Team member",
  type: "document",
  description: "A person who works at Foundry Ventures.",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "editorial", title: "Biography" },
    { name: "contact", title: "Contact" },
    { name: "evidence", title: "Evidence" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description:
        "Full name, spelled and accented the way this person spells it. Used as the heading of their profile and next to everything they author.",
      group: "identity",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      ...slugField(
        'The address of this person\'s profile, e.g. "anders-nygren" becomes /team/anders-nygren. Lowercase, hyphens between words, no accents. It is also the anchor used to jump to them in the team list, so avoid changing it once the site is live.',
        "name",
      ),
      group: "identity",
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      description:
        'Their job title, e.g. "Partner" or "Community Manager". Shown under the name everywhere. A person needs an approved name and role before they appear publicly at all.',
      group: "identity",
      validationRule: { required: true, min: 2, max: 80 },
    },
    {
      name: "portrait",
      title: "Portrait",
      type: "imageAsset",
      description:
        "A photograph of this person. Needs approved rights like every image; where there is no approved portrait the design falls back to a typographic treatment rather than a grey silhouette.",
      group: "identity",
    },
    {
      name: "active",
      title: "Currently at Foundry",
      type: "boolean",
      description:
        "Untick when someone leaves. They disappear from the team page immediately, while the record stays so old posts and deals keep their author and deal lead.",
      group: "identity",
      initialValue: true,
      validationRule: { required: true },
    },
    { ...publicationStatusField("person"), group: "identity" },
    { ...verificationStatusField("person"), group: "identity" },
    { ...sortOrderField("team members"), group: "identity" },

    {
      name: "shortBio",
      title: "Short bio",
      type: "text",
      description:
        "One or two sentences shown in the team list and next to authored posts. Written in the third person. Around 200 characters reads best; much longer and the card layout breaks.",
      group: "editorial",
      validationRule: { max: 400 },
    },
    richTextField(
      "longBio",
      "Long bio",
      "The full biography on the profile page. This field decides whether a profile page exists: without it — approved — this person stays on the team list and their name links to their entry there rather than to a page with two lines on it. Write several paragraphs, or leave it empty.",
      { group: "editorial" },
    ),
    {
      name: "expertise",
      title: "Areas of expertise",
      type: "array",
      description:
        'Short phrases describing what this person works on, e.g. "Go-to-market", "AI infrastructure". Free text, not the shared taxonomy — these are labels on a profile, not filters. Press Enter after each one.',
      group: "editorial",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      validationRule: { max: 8, unique: true },
    },

    {
      name: "email",
      title: "Email",
      type: "string",
      description:
        "Their work email address. It becomes a clickable mailto link — but only once the email evidence below is approved, because publishing an address invites everything that follows.",
      group: "contact",
      validationRule: {
        max: 160,
        regex: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", name: "email address" },
      },
    },
    {
      name: "phone",
      title: "Phone",
      type: "string",
      description:
        'Their phone number in international form, e.g. "+46 733 460006". Becomes a clickable tel link once its own evidence is approved. Do not add a number that has not been published before without asking the person first.',
      group: "contact",
      validationRule: {
        max: 40,
        regex: { pattern: "^\\+?[0-9 ()-]{6,30}$", name: "international phone number" },
      },
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn",
      type: "url",
      description:
        "Their personal LinkedIn profile, if they want it published. Confirm the profile is theirs.",
      group: "contact",
      validationRule: { uri: { scheme: ["https"] } },
    },

    fieldEvidenceField("person", [
      {
        name: "name",
        title: "Name",
        description:
          "Required before this person appears anywhere public. Approve once you have confirmed the spelling with them.",
      },
      {
        name: "role",
        title: "Role",
        description:
          "Also required before they appear publicly. A title is a claim about someone's job; confirm it with them rather than with an org chart.",
      },
      {
        name: "portrait",
        title: "Portrait",
        description:
          "That this person agreed to this photograph being published. Separate from the image's own rights record, which covers the photographer.",
      },
      {
        name: "shortBio",
        title: "Short bio",
        description: "That the person has read and approved this summary of themselves.",
      },
      {
        name: "longBio",
        title: "Long bio",
        description:
          "That the person has approved the full biography. Without this there is no profile page — the site refuses to build a page from unapproved text about a named individual.",
      },
      {
        name: "expertise",
        title: "Areas of expertise",
        description: "That these labels describe what the person actually does.",
      },
      {
        name: "email",
        title: "Email",
        description: "That this person agreed to their email address being published.",
      },
      {
        name: "phone",
        title: "Phone",
        description:
          "That this person agreed to their phone number being published. A separate decision from email — treat it as one.",
      },
      {
        name: "linkedinUrl",
        title: "LinkedIn",
        description: "That the profile is theirs and they are happy to be linked to.",
      },
    ]),

    seoField("profile"),
  ],
  preview: {
    select: {
      title: "name",
      role: "role",
      publicationStatus: "publicationStatus",
      verificationStatus: "verificationStatus",
      active: "active",
      longBio: "longBio",
      media: "portrait",
    },
    prepare: (selection) =>
      preview(
        previewTitle(selection.title, "Unnamed person"),
        statusSubtitle(selection, [
          typeof selection.role === "string" ? selection.role : undefined,
          selection.active === false ? "no longer at Foundry" : undefined,
          isNonEmptyArray(selection.longBio) ? undefined : "no profile page",
        ]),
        selection.media,
      ),
  },
};
