/**
 * `aboutPage` — the about / thesis page.
 *
 * The page has a job (§13): systematise the voice Foundry already has, rather
 * than import a generic set of VC values. Every belief and every step should be
 * traceable to something Foundry already says or already does — which is what
 * the `editorialText` wrapper records: copy lifted from the live site is marked
 * as migrated with the address it came from, and anything new is marked as
 * proposed and has to be approved on its own merits.
 *
 * The page stays behind the `about` feature flag until that approval has
 * happened; while the flag is off the route returns not-found rather than
 * showing a draft.
 */

import type { SanityDocumentSchema, SanityField } from "../schema-types";
import {
  editorialTextField,
  editorialTextListField,
  publicationStatusField,
  readString,
  statusSubtitle,
} from "./shared";

/** A titled paragraph — the shape both the beliefs and the criteria lists use. */
function titledEntryField(
  name: string,
  title: string,
  description: string,
  memberName: string,
  titleDescription: string,
  bodyDescription: string,
  max: number,
): SanityField {
  return {
    name,
    title,
    type: "array",
    description,
    of: [
      {
        type: "object",
        name: memberName,
        title,
        fields: [
          editorialTextField("title", "Title", titleDescription, {
            validationRule: { required: true },
          }),
          editorialTextField("body", "Text", bodyDescription, {
            validationRule: { required: true },
          }),
        ],
        preview: {
          select: { title: "title.value", body: "body.value" },
          prepare: (selection) => ({
            title: readString(selection.title) ?? "Untitled",
            subtitle: readString(selection.body) ?? "",
          }),
        },
      },
    ],
    validationRule: { max },
  };
}

export const aboutPageSchema: SanityDocumentSchema = {
  name: "aboutPage",
  title: "About page",
  type: "document",
  description:
    "The about / thesis page: what Foundry believes, how it works and what it looks for. There is only one of these documents, and the page stays hidden until the About section is switched on in site settings.",
  groups: [
    { name: "intro", title: "Introduction", default: true },
    { name: "beliefs", title: "Beliefs" },
    { name: "work", title: "How we work" },
    { name: "process", title: "Process" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    { ...publicationStatusField("page"), group: "intro" },
    editorialTextField(
      "heading",
      "Heading",
      "The page heading. One line describing what the reader is about to get — how Foundry thinks and how it works.",
      { group: "intro", validationRule: { required: true } },
    ),
    editorialTextListField(
      "intro",
      "Introduction",
      "The opening paragraphs, one entry per paragraph. This is the right place to reuse wording Foundry already uses elsewhere; mark it as migrated and record where it came from.",
      { group: "intro", validationRule: { max: 4 } },
    ),

    titledEntryField(
      "beliefs",
      "Beliefs",
      "What Foundry believes about the shift it is investing in. Each belief should be something Foundry can point at evidence for, not a value statement anyone could sign.",
      "belief",
      "The belief, stated as a claim in one sentence.",
      "Why Foundry holds it, in two or three sentences.",
      6,
    ),

    {
      name: "howWeWork",
      title: "How we work",
      type: "array",
      description:
        "The numbered list of what Foundry actually does for the companies it backs, in order. Concrete commitments, not adjectives.",
      group: "work",
      of: [
        {
          type: "object",
          name: "howWeWorkItem",
          title: "Item",
          fields: [
            {
              name: "number",
              title: "Number",
              type: "string",
              description:
                'The numeral shown beside the item, written as it should appear, e.g. "01". Kept as text so the leading zero survives.',
              validationRule: {
                required: true,
                max: 4,
                regex: { pattern: "^[0-9]{1,3}$", name: "digits only" },
              },
            },
            editorialTextField("body", "Text", "The item itself, in one sentence.", {
              validationRule: { required: true },
            }),
          ],
          preview: {
            select: { number: "number", body: "body.value" },
            prepare: (selection) => ({
              title: readString(selection.body) ?? "Empty item",
              subtitle: readString(selection.number) ?? "",
            }),
          },
        },
      ],
      validationRule: { max: 6 },
    },

    titledEntryField(
      "whatWeLookFor",
      "What we look for",
      "What makes Foundry say yes. Written for a founder deciding whether to spend an afternoon on a pitch, so be specific enough to be useful to them.",
      "criterion",
      "The thing being looked for, in a few words.",
      "What it means in practice, in one or two sentences.",
      6,
    ),

    {
      name: "process",
      title: "Process",
      type: "array",
      description:
        "What happens after a pitch is submitted, step by step. Founders use this to know what they are committing to, so only describe steps that really happen and in the order they really happen.",
      group: "process",
      of: [
        {
          type: "object",
          name: "processStep",
          title: "Step",
          fields: [
            {
              name: "step",
              title: "Step number",
              type: "string",
              description:
                'The numeral shown beside the step, written as it should appear, e.g. "01".',
              validationRule: {
                required: true,
                max: 4,
                regex: { pattern: "^[0-9]{1,3}$", name: "digits only" },
              },
            },
            editorialTextField("title", "Title", "What the step is called, in a few words.", {
              validationRule: { required: true },
            }),
            editorialTextField(
              "body",
              "Text",
              "What happens in this step, and what the founder should expect from it.",
              { validationRule: { required: true } },
            ),
          ],
          preview: {
            select: { step: "step", title: "title.value", body: "body.value" },
            prepare: (selection) => ({
              title: readString(selection.title) ?? "Untitled step",
              subtitle: [readString(selection.step), readString(selection.body)]
                .filter((part): part is string => Boolean(part))
                .join(" · "),
            }),
          },
        },
      ],
      validationRule: { max: 8 },
    },

    {
      name: "seo",
      title: "Search & social",
      type: "seoFields",
      description:
        "How the about page appears in search results and when its link is shared. Leave empty to derive it from the page's own approved copy.",
      group: "seo",
      validationRule: { required: true },
    },
  ],
  preview: {
    select: { publicationStatus: "publicationStatus", heading: "heading.value" },
    prepare: (selection) => ({
      title: "About page",
      subtitle: statusSubtitle(selection, [readString(selection.heading)]),
    }),
  },
};
