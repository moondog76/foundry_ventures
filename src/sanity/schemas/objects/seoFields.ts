/**
 * `SeoFields` — per-page search and social overrides.
 *
 * `buildMetadata` in `src/lib/seo/metadata.ts` uses an explicit title or
 * description in production **only** when `approvalStatus` is `approved`;
 * otherwise it derives them from already-approved page content. So an
 * unapproved override is not "better than nothing" — it is ignored. Leaving
 * this object empty is the normal, correct state for most pages.
 */

import type { SanityObjectSchema } from "../../schema-types";
import { APPROVAL_STATUS_OPTIONS, previewTitle, readString } from "../shared";

export const seoFieldsSchema: SanityObjectSchema = {
  name: "seoFields",
  title: "Search & social",
  type: "object",
  description:
    "Overrides for the search-result title, the description and the social share image. Optional — leave empty to let the site derive them from the page.",
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: "title",
      title: "Search title",
      type: "string",
      description:
        'The headline shown in search results and browser tabs, without the brand name — the site appends " — Foundry Ventures" itself. Aim for under about 60 characters so it is not cut off.',
      validationRule: { max: 70 },
    },
    {
      name: "description",
      title: "Search description",
      type: "text",
      description:
        "The summary under the search result. One or two plain sentences describing this page specifically; around 150 characters reads best. Do not repeat the title.",
      validationRule: { max: 200 },
    },
    {
      name: "ogImage",
      title: "Share image",
      type: "imageAsset",
      description:
        "The picture shown when this page's link is shared. Leave empty to use the generated Foundry share card, which is the right choice almost always. If you do supply one, it needs approved rights like any other image, and 1200×630 pixels is the size that survives every platform.",
    },
    {
      name: "approvalStatus",
      title: "Approval",
      type: "string",
      description:
        "The title and description above are ignored on the public site until this says approved — the site falls back to text it already trusts rather than publishing unreviewed metadata.",
      options: { list: APPROVAL_STATUS_OPTIONS, layout: "radio" },
      initialValue: "unapproved",
    },
    {
      name: "sources",
      title: "Sources",
      type: "array",
      description:
        "Where any factual claim in the title or description comes from. Usually empty; fill it in when the description states a number or a status.",
      of: [{ type: "sourceReference" }],
    },
    {
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      description:
        "Tick to ask search engines not to list this page. Use it for pages that must exist but should not be found — not as a way to publish thin content quietly.",
      initialValue: false,
    },
    {
      name: "canonicalOverride",
      title: "Canonical URL",
      type: "url",
      description:
        "Only for pages that duplicate content published elsewhere: the address search engines should treat as the original. Leave empty and the page's own address is used.",
      validationRule: { uri: { scheme: ["https"] } },
    },
  ],
  preview: {
    select: { title: "title", approvalStatus: "approvalStatus", noIndex: "noIndex" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Derived from page content"),
      subtitle: [
        readString(selection.approvalStatus) === "approved" ? "Approved" : "Not approved",
        selection.noIndex === true ? "hidden from search" : undefined,
      ]
        .filter((part): part is string => Boolean(part))
        .join(" · "),
    }),
  },
};
