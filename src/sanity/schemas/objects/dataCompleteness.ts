/**
 * `Company.dataCompleteness` — an editor's checklist, not a gate.
 *
 * The site never reads these four booleans to decide what to publish; that is
 * `fieldEvidence`'s job, per field. What they give is a coarse answer to "is
 * this record finished?" that a person can set deliberately and a report can
 * count, without re-deriving it from fifteen evidence records.
 */

import type { SanityObjectSchema } from "../../schema-types";

export const dataCompletenessSchema: SanityObjectSchema = {
  name: "dataCompleteness",
  title: "Completeness",
  type: "object",
  description:
    "A checklist of how finished this record is. It does not control what the site shows — each fact is still governed by its own evidence — but it tells the team where the gaps are.",
  options: { collapsible: true, collapsed: true, columns: 2 },
  fields: [
    {
      name: "coreIdentity",
      title: "Core identity done",
      type: "boolean",
      description:
        "Name, logo and website are all present and approved. This is the minimum for a portfolio card that is more than a name.",
      initialValue: false,
    },
    {
      name: "editorial",
      title: "Editorial done",
      type: "boolean",
      description:
        "Tagline, short description and the long description are written and approved — the material a detail page needs before it is worth having one.",
      initialValue: false,
    },
    {
      name: "relations",
      title: "Relations done",
      type: "boolean",
      description:
        "Deal lead, founders and the stage / sector / focus labels are filled in and point at the right records.",
      initialValue: false,
    },
    {
      name: "seo",
      title: "Search & social done",
      type: "boolean",
      description:
        "Someone has checked how this record appears in search results and when its link is shared, and either approved an override or confirmed the derived text reads well.",
      initialValue: false,
    },
  ],
  preview: {
    select: {
      coreIdentity: "coreIdentity",
      editorial: "editorial",
      relations: "relations",
      seo: "seo",
    },
    prepare: (selection) => {
      const done = ["coreIdentity", "editorial", "relations", "seo"].filter(
        (key) => selection[key] === true,
      ).length;
      return { title: `${done} of 4 areas complete` };
    },
  },
};
