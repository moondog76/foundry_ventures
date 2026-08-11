/**
 * `testimonial` — a founder quote about Foundry (§16.5).
 *
 * Consent is the whole point of this type. `canListTestimonialPublicly` checks
 * four things, and only one of them is "is it published":
 *
 *  - `consentStatus === "revoked"` removes the quote **everywhere, immediately**,
 *    including preview. Withdrawing consent is not an editorial workflow step
 *    that waits for a deploy.
 *  - publication status must be `published`;
 *  - consent must be `granted`;
 *  - the quote and the person's name must both be owner-approved.
 *
 * So a testimonial with a granted consent but an unapproved quote does not
 * appear, and neither does an approved quote whose consent is only `requested`.
 * The two axes are independent on purpose: one is about accuracy, the other is
 * about permission.
 */

import type { SanityCustomCheck, SanityDocumentSchema } from "../schema-types";
import {
  asRecord,
  featuredField,
  fieldEvidenceField,
  preview,
  previewTitle,
  publicationStatusField,
  readString,
  sortOrderField,
  statusSubtitle,
} from "./shared";

/** `Testimonial["consentStatus"]` in `src/content/types.ts`. */
const CONSENT_STATUS_OPTIONS = [
  { title: "Missing — nobody has asked yet", value: "missing" },
  { title: "Requested — asked, no answer yet", value: "requested" },
  { title: "Granted — they agreed to us publishing this", value: "granted" },
  { title: "Revoked — they have withdrawn permission", value: "revoked" },
];

const publishingRequiresConsent: SanityCustomCheck = (value) => {
  const document = asRecord(value);
  if (!document) return true;
  if (readString(document.publicationStatus) !== "published") return true;
  return readString(document.consentStatus) === "granted"
    ? true
    : "A testimonial can only be published once the person has granted consent. Record the consent first, or leave this in draft.";
};

export const testimonialSchema: SanityDocumentSchema = {
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  description:
    "A quote about Foundry from someone we work with, shown on the home page. Requires recorded consent from the person quoted.",
  validationRule: {
    custom: "A published testimonial requires consent status “granted”.",
    customCheck: publishingRequiresConsent,
  },
  groups: [
    { name: "quote", title: "Quote", default: true },
    { name: "evidence", title: "Evidence" },
  ],
  fields: [
    {
      name: "quote",
      title: "Quote",
      type: "text",
      description:
        "What the person said, in their words and without surrounding quotation marks. Do not tighten or improve the sentence — if it needs editing, send the edit back to them and quote the version they approve.",
      group: "quote",
      validationRule: { required: true, min: 20, max: 400 },
    },
    {
      name: "personName",
      title: "Name",
      type: "string",
      description:
        "Who said it, spelled the way they spell it. Required, and it must be approved below before the quote appears — an anonymous or misattributed testimonial is not usable.",
      group: "quote",
      validationRule: { required: true, min: 2, max: 120 },
    },
    {
      name: "personTitle",
      title: "Title",
      type: "string",
      description:
        'Their role, e.g. "Co-founder & CEO". Leave empty rather than guessing; the company reference below usually carries enough context.',
      group: "quote",
      validationRule: { max: 80 },
    },
    {
      name: "company",
      title: "Company",
      type: "reference",
      description:
        "The portfolio company this person is from, if there is one. Links the quote to a record instead of repeating a company name as free text.",
      group: "quote",
      to: [{ type: "company" }],
      options: { disableNew: true },
    },
    {
      name: "image",
      title: "Portrait",
      type: "imageAsset",
      description:
        "Optional photograph of the person quoted. Needs approved rights, and a portrait generally needs the person's agreement as well.",
      group: "quote",
    },
    {
      name: "consentStatus",
      title: "Consent",
      type: "string",
      description:
        'Whether this person has agreed to us publishing this quote with their name. Nothing appears publicly below "Granted". Setting it to "Revoked" removes the quote from the site and from preview immediately — use it the moment someone withdraws permission.',
      group: "quote",
      options: { list: CONSENT_STATUS_OPTIONS, layout: "radio" },
      initialValue: "missing",
      validationRule: { required: true },
    },
    { ...publicationStatusField("testimonial"), group: "quote" },
    {
      ...featuredField(
        "Tick to put this quote first in the home-page carousel. Consent and approval still apply — featuring does not bypass either.",
      ),
      group: "quote",
    },
    { ...sortOrderField("testimonials"), group: "quote" },

    fieldEvidenceField("testimonial", [
      {
        name: "quote",
        title: "Quote",
        description:
          "That these are the person's actual words, checked against what they wrote or said. Required before the testimonial appears publicly.",
      },
      {
        name: "personName",
        title: "Name",
        description:
          "That the name is spelled correctly and belongs to the person who said it. Also required before it appears.",
      },
      {
        name: "personTitle",
        title: "Title",
        description: "That the role is current — titles go stale faster than quotes do.",
      },
      {
        name: "company",
        title: "Company",
        description: "That this person is who we say they are at that company.",
      },
      {
        name: "image",
        title: "Portrait",
        description:
          "That the person agreed to this photograph being published alongside the quote.",
      },
    ]),
  ],
  preview: {
    select: {
      title: "personName",
      quote: "quote",
      consentStatus: "consentStatus",
      publicationStatus: "publicationStatus",
      company: "company.name",
      media: "image",
    },
    prepare: (selection) => {
      const consent = readString(selection.consentStatus);
      return preview(
        previewTitle(selection.title, "Unattributed quote"),
        statusSubtitle(selection, [
          consent ? `consent ${consent}` : undefined,
          readString(selection.company),
          readString(selection.quote),
        ]),
        selection.media,
      );
    },
  },
};
