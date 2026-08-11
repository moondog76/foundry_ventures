/**
 * `taxonomy` — the shared vocabulary behind every filter (§8.2, §16.2).
 *
 * One document type holds all six groups rather than six near-identical types,
 * because they behave identically: a title an editor sees, a slug the URL uses,
 * and a group saying which filter the term belongs to.
 *
 * The slug is the part that matters technically. It is used **verbatim** in
 * query strings — `/portfolio?sector=applied-ai` — so renaming a slug breaks
 * every link anyone has shared, and `parseFilters` silently drops values it does
 * not recognise, which means a mistyped slug fails quietly rather than loudly.
 * Change the title freely; treat the slug as permanent.
 *
 * Filter groups with fewer than two values are dropped from the UI entirely, so
 * a group with a single term will simply not appear as a filter.
 */

import type { SanityDocumentSchema } from "../schema-types";
import { previewTitle, readSlugValue, readString, slugField } from "./shared";

/** `TaxonomyGroup` in `src/content/types.ts`. */
export const TAXONOMY_GROUP_OPTIONS = [
  { title: "Stage — funding stage of a company", value: "stage" },
  { title: "Sector — the market a company sells into", value: "sector" },
  { title: "Focus — the technology or theme", value: "focus" },
  { title: "Status — lifecycle state of an investment", value: "status" },
  { title: "Vertical — a network person's industry", value: "vertical" },
  { title: "Expertise — what a network person is good at", value: "expertise" },
];

export const taxonomySchema: SanityDocumentSchema = {
  name: "taxonomy",
  title: "Taxonomy term",
  type: "document",
  description:
    "One term used to tag and filter content: a stage, a sector, a focus, a status, a vertical or an area of expertise.",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      description:
        'What visitors read on the filter and on the tag, e.g. "Applied AI". Sentence case, no trailing punctuation. Safe to change at any time.',
      validationRule: { required: true, min: 2, max: 60 },
    },
    slugField(
      'The term as it appears in the web address, e.g. "applied-ai": lowercase, words joined by hyphens, no spaces or accents. It is part of every filter link anyone shares, so once this term is in use, do not change it — create a new term instead.',
      "title",
    ),
    {
      name: "group",
      title: "Group",
      type: "string",
      description:
        "Which filter this term belongs to. A term belongs to exactly one group; if the same word is needed in two groups, create two terms. Companies use stage, sector, focus and status; network people use vertical and expertise.",
      options: { list: TAXONOMY_GROUP_OPTIONS, layout: "radio" },
      validationRule: { required: true },
    },
    {
      name: "editorialNote",
      title: "Internal note",
      type: "text",
      description:
        "What counts as this term and what does not, so tagging stays consistent between editors. Internal only — never rendered on the site.",
      validationRule: { max: 400 },
    },
  ],
  preview: {
    select: { title: "title", slug: "slug", group: "group" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Untitled term"),
      subtitle: [readString(selection.group), readSlugValue(selection.slug)]
        .filter((part): part is string => Boolean(part))
        .join(" · "),
    }),
  },
};
