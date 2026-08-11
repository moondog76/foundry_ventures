/**
 * `legalPage` — privacy notice and any other legal document (§15.1).
 *
 * A legal page owns a bare top-level address: slug `privacy` is served at
 * `/privacy`. That makes the slug more consequential than elsewhere — it can
 * shadow a section of the site — so the check below refuses the paths the app
 * already owns.
 *
 * The body is deliberately the same rich-text editor as everywhere else. A
 * privacy notice that states what the code actually does is verifiable; one
 * pasted from a template is not, and the reviewer cannot tell the difference
 * from the formatting.
 */

import type { SanityCustomCheck, SanityDocumentSchema } from "../schema-types";
import {
  asRecord,
  isNonEmptyArray,
  previewTitle,
  readSlugValue,
  readString,
  richTextField,
  seoField,
  slugField,
} from "./shared";

/**
 * Paths owned by the application itself. `src/proxy.ts` and the route tree
 * resolve these first, so a legal page using one of them would be unreachable.
 */
const RESERVED_PATHS = [
  "about",
  "api",
  "insights",
  "network",
  "pitch",
  "portfolio",
  "team",
  "robots",
  "sitemap",
];

const slugIsAvailable: SanityCustomCheck = (value) => {
  const document = asRecord(value);
  if (!document) return true;
  const slug = readSlugValue(document.slug);
  if (!slug) return true;
  return RESERVED_PATHS.includes(slug)
    ? `"${slug}" is already used by a section of the site, so this page would never be reachable. Choose another address.`
    : true;
};

export const legalPageSchema: SanityDocumentSchema = {
  name: "legalPage",
  title: "Legal page",
  type: "document",
  description:
    "A legal document such as the privacy notice. Published at the top level of the site, e.g. /privacy.",
  validationRule: {
    custom: "The slug must not collide with a section of the site.",
    customCheck: slugIsAvailable,
  },
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      description:
        'The heading at the top of the page and the label in the footer, e.g. "Privacy". Keep it short — it appears in the legal row of the footer.',
      validationRule: { required: true, min: 2, max: 80 },
    },
    slugField(
      'The address this page is served at, directly off the root: "privacy" becomes /privacy. Lowercase, hyphens between words. Legal pages are linked from elsewhere and cited in notices, so do not change it once published.',
      "title",
    ),
    {
      name: "lastUpdated",
      title: "Last updated",
      type: "date",
      description:
        "The date this text was last changed. It is printed on the page: readers use it to tell whether they have seen the current version, so update it whenever the wording changes in a way that matters.",
      options: { dateFormat: "YYYY-MM-DD" },
      validationRule: { required: true },
    },
    richTextField(
      "body",
      "Body",
      "The document itself. Use Heading 2 for each main section so the page can be scanned and linked to. Say what actually happens — the retention period, the recipients, the legal basis — rather than what a template says; anything stated here has to be true of the running system.",
      { validationRule: { required: true, min: 1 } },
    ),
    seoField("legal page"),
  ],
  preview: {
    select: { title: "title", slug: "slug", lastUpdated: "lastUpdated", body: "body" },
    prepare: (selection) => {
      const slug = readSlugValue(selection.slug);
      const updated = readString(selection.lastUpdated);
      return {
        title: previewTitle(selection.title, "Untitled legal page"),
        subtitle: [
          slug ? `/${slug}` : "no address yet",
          updated ? `updated ${updated}` : "never updated",
          isNonEmptyArray(selection.body) ? undefined : "empty",
        ]
          .filter((part): part is string => Boolean(part))
          .join(" · "),
      };
    },
  },
};
