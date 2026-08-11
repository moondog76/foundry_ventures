/**
 * `NavItem` — one link in the header, footer or legal row.
 *
 * The `featureFlag` field is what keeps navigation honest: `getSiteSettings`
 * removes an item whose flag is off before anything renders, so a route that is
 * switched off can never appear as a dead link (§3.4, §6.1). It is the reason
 * this is a field rather than something an editor has to remember to delete.
 */

import type { SanityCustomCheck, SanityObjectSchema } from "../../schema-types";
import { asRecord, previewTitle, readString } from "../shared";

/** Keys of `FeatureFlags` in `src/content/types.ts`. */
export const FEATURE_FLAG_OPTIONS = [
  { title: "Insights — the news & insights section", value: "insights" },
  { title: "About — the about / thesis page", value: "about" },
  { title: "Network — the operating partners & advisors page", value: "network" },
  {
    title: "Investment criteria — the criteria block on the home page",
    value: "investmentCriteria",
  },
  { title: "Statistics — the numbers block on the home page", value: "stats" },
  { title: "Testimonials — the founder quotes on the home page", value: "testimonials" },
];

const hrefMatchesKind: SanityCustomCheck = (value) => {
  const item = asRecord(value);
  if (!item) return true;
  const href = readString(item.href);
  if (!href) return true;

  if (item.isExternal === true) {
    return href.startsWith("https://") || href.startsWith("http://")
      ? true
      : "A link marked as leaving the site needs a full address starting with https://.";
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return 'This looks like a link to another site. Tick "Leaves this site" so it opens in a new tab and is announced correctly.';
  }

  return href.startsWith("/")
    ? true
    : 'A link to a page on this site starts with "/", e.g. /portfolio.';
};

export const navItemSchema: SanityObjectSchema = {
  name: "navItem",
  title: "Navigation link",
  type: "object",
  description: "One link in the site navigation.",
  validationRule: {
    custom:
      'Internal links start with "/"; links that leave the site must be full https:// addresses and marked as external.',
    customCheck: hrefMatchesKind,
  },
  fields: [
    {
      name: "label",
      title: "Label",
      type: "string",
      description:
        "The word or two the visitor sees. Keep it to a single word where possible — the header has very little room on a phone.",
      validationRule: { required: true, min: 1, max: 30 },
    },
    {
      name: "href",
      title: "Destination",
      type: "string",
      description:
        'A path on this site starting with "/", such as /portfolio or /team. Use a full https:// address only for links that leave the site, and tick the box below when you do.',
      validationRule: { required: true, max: 300 },
    },
    {
      name: "featureFlag",
      title: "Only show when this section is switched on",
      type: "string",
      description:
        "Ties the link to a section that can be turned off. While that section is off the link disappears completely rather than leading to a missing page. Leave empty for links to pages that are always available.",
      options: { list: FEATURE_FLAG_OPTIONS, layout: "dropdown" },
    },
    {
      name: "isExternal",
      title: "Leaves this site",
      type: "boolean",
      description:
        "Tick for links to another website. The link then opens in a new tab and is announced as such to screen-reader users.",
      initialValue: false,
    },
  ],
  preview: {
    select: { title: "label", href: "href", featureFlag: "featureFlag" },
    prepare: (selection) => {
      const flag = readString(selection.featureFlag);
      return {
        title: previewTitle(selection.title, "Untitled link"),
        subtitle: [readString(selection.href), flag ? `only when ${flag} is on` : undefined]
          .filter((part): part is string => Boolean(part))
          .join(" · "),
      };
    },
  },
};
