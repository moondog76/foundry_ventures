/**
 * `post` — news and insights (§12, §16.4).
 *
 * The field that changes everything is **target**.
 *
 * `internal` means Foundry hosts the article: it needs a slug and a body, and it
 * gets `/insights/[slug]`.
 *
 * `external` means the article lives somewhere else — a founder's blog, a
 * newspaper, a podcast. It needs the external address, and it deliberately gets
 * **no internal page**: `canPublishPostDetail` returns false for anything that
 * is not `internal`, so there is no `/insights/[slug]` route, no entry in the
 * sitemap and no metadata for it. A thin internal page whose only content is a
 * link out is a duplicate of someone else's article and is worth nothing to a
 * reader (§12.1). The card in the archive links straight to the source instead.
 *
 * A post also needs `publishedAt` before it can be listed at all: the archive
 * sorts by date and the article header prints it, so a published post without a
 * date drops out of the list silently. The rule below catches that in the Studio
 * instead.
 *
 * Relations run one way (§16.4.1): a post names its authors and the companies it
 * is about. Team profiles and company pages resolve those in reverse — nobody
 * has to remember to update two records.
 */

import type { SanityCustomCheck, SanityDocumentSchema } from "../schema-types";
import {
  APPROVAL_STATUS_OPTIONS,
  asRecord,
  featuredField,
  isNonEmptyArray,
  preview,
  previewTitle,
  publicationStatusField,
  readSlugValue,
  readString,
  richTextField,
  seoField,
  slugField,
  statusSubtitle,
} from "./shared";

/** `PostType` in `src/content/types.ts`. */
const POST_TYPE_OPTIONS = [
  { title: "Article — something Foundry has written", value: "article" },
  { title: "Portfolio news — news about a portfolio company", value: "portfolio-news" },
];

/** `Post["target"]` in `src/content/types.ts`. */
const POST_TARGET_OPTIONS = [
  { title: "On this site — we host the article", value: "internal" },
  { title: "Elsewhere — the article lives on another site", value: "external" },
];

/**
 * All three cross-field rules in one check, reported one at a time so the editor
 * gets a single actionable message rather than a list to decode.
 */
const targetAndDateRules: SanityCustomCheck = (value) => {
  const document = asRecord(value);
  if (!document) return true;

  const target = readString(document.target);

  if (target === "internal") {
    if (!readSlugValue(document.slug)) {
      return "An article hosted on this site needs a slug — that is its web address.";
    }
    if (!isNonEmptyArray(document.body)) {
      return "An article hosted on this site needs a body. If the writing lives somewhere else, set the destination to “Elsewhere” and give the address instead.";
    }
    if (readString(document.externalUrl)) {
      return "This article is hosted on this site, so the external address is not used. Clear it, or change the destination to “Elsewhere”.";
    }
  }

  if (target === "external" && !readString(document.externalUrl)) {
    return "An article hosted elsewhere needs the address it lives at — that is where the card links to. No page is created on this site for it.";
  }

  if (readString(document.publicationStatus) === "published" && !readString(document.publishedAt)) {
    return "A published post needs a publication date, otherwise it never appears in the archive.";
  }

  return true;
};

export const postSchema: SanityDocumentSchema = {
  name: "post",
  title: "Post",
  type: "document",
  description:
    "An article Foundry has written, or news about a portfolio company published somewhere else.",
  validationRule: {
    custom:
      "Hosted here: slug and body required, external address must be empty. Hosted elsewhere: external address required, and no page is generated on this site. Published: publication date required.",
    customCheck: targetAndDateRules,
  },
  groups: [
    { name: "editorial", title: "Article", default: true },
    { name: "relations", title: "Relations" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      description:
        "The headline, in the archive and at the top of the article. For a post about someone else's article, use their headline rather than writing a new one.",
      group: "editorial",
      validationRule: { required: true, min: 4, max: 160 },
    },
    {
      name: "target",
      title: "Where the article lives",
      type: "string",
      description:
        "“On this site” gives the article its own page here and needs a slug and a body below. “Elsewhere” links straight out to the original — no page is created on this site, because a page containing only a link to someone else's article is worth nothing to a reader.",
      group: "editorial",
      options: { list: POST_TARGET_OPTIONS, layout: "radio" },
      initialValue: "internal",
      validationRule: { required: true },
    },
    {
      ...slugField(
        'The address of the article, e.g. "why-shipping-velocity-compounds" becomes /insights/why-shipping-velocity-compounds. Lowercase, hyphens between words. Required for articles hosted here; ignored for articles hosted elsewhere. Do not change it after publication — links people have shared would break.',
        "title",
      ),
      group: "editorial",
    },
    {
      name: "externalUrl",
      title: "Address of the original",
      type: "url",
      description:
        "Where the article actually lives. Required when the destination is “Elsewhere”, and the archive card links here directly, opening in a new tab. Leave empty for articles hosted on this site.",
      group: "editorial",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "type",
      title: "Type",
      type: "string",
      description:
        "What kind of post this is. Visitors filter the archive by this, so choose from the reader's point of view: “portfolio news” is news about one of our companies, whoever wrote it.",
      group: "editorial",
      options: { list: POST_TYPE_OPTIONS, layout: "radio" },
      initialValue: "article",
      validationRule: { required: true },
    },
    {
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      description:
        "The summary on the archive card and in search results. One or two sentences that say what the reader will get; not the first sentence of the article pasted in. Around 160 characters reads best.",
      group: "editorial",
      validationRule: { required: true, min: 20, max: 320 },
    },
    {
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      description:
        "When the article was published. It orders the whole archive and is printed on the card, so it must be the real date — required before the post can be published.",
      group: "editorial",
      validationRule: { required: true },
    },
    {
      name: "updatedAt",
      title: "Last updated",
      type: "datetime",
      description:
        "Only when the article has been meaningfully revised after publication. Fixing a typo is not a revision; correcting a fact is.",
      group: "editorial",
    },
    {
      name: "heroImage",
      title: "Lead image",
      type: "imageAsset",
      description:
        "The image at the top of the article and on the archive card. Needs approved rights — for an article hosted elsewhere that usually means we cannot reuse their picture, and the card falls back to the typographic treatment.",
      group: "editorial",
    },
    richTextField(
      "body",
      "Body",
      "The article itself. Required for articles hosted on this site, and left empty for articles hosted elsewhere — do not paste in someone else's text. Use Heading 2 for sections; the reading time is calculated from what is written here.",
      { group: "editorial" },
    ),
    { ...publicationStatusField("post"), group: "editorial" },
    {
      name: "editorialApprovalStatus",
      title: "Editorial approval",
      type: "string",
      description:
        "Whether the writing itself has been signed off. Separate from publication status: a post can be marked published and still wait here, and it stays off the public site until both agree.",
      group: "editorial",
      options: { list: APPROVAL_STATUS_OPTIONS, layout: "radio" },
      initialValue: "unapproved",
      validationRule: { required: true },
    },
    {
      ...featuredField(
        "Tick to give this post priority in the home page's latest-insights block. Featured posts come first, then the newest.",
      ),
      group: "editorial",
    },
    {
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description:
        "Rarely needed — the archive sorts by date. Set a number only to pin a post to a particular position; lower numbers come first.",
      group: "editorial",
      validationRule: { integer: true, min: 0 },
    },

    {
      name: "authors",
      title: "Authors",
      type: "array",
      description:
        "Who wrote it. Each author's profile page automatically lists everything they have written, so this is the only place the connection is recorded. Leave empty for an article written by someone outside Foundry.",
      group: "relations",
      of: [{ type: "reference", to: [{ type: "teamMember" }], options: { disableNew: true } }],
      validationRule: { unique: true },
    },
    {
      name: "companies",
      title: "Companies",
      type: "array",
      description:
        "Portfolio companies this post is about. Each company's page automatically shows the posts that name it, and posts sharing a company are suggested as related reading.",
      group: "relations",
      of: [{ type: "reference", to: [{ type: "company" }], options: { disableNew: true } }],
      validationRule: { unique: true },
    },
    {
      name: "relatedPosts",
      title: "Related reading",
      type: "array",
      description:
        "Posts to suggest at the end of this one, in this order. Only worth filling in when the automatic suggestions — same company, then same author — get it wrong. At most three are shown.",
      group: "relations",
      of: [{ type: "reference", to: [{ type: "post" }], options: { disableNew: true } }],
      validationRule: { max: 5, unique: true },
    },

    seoField("post"),
  ],
  preview: {
    select: {
      title: "title",
      target: "target",
      type: "type",
      publicationStatus: "publicationStatus",
      editorialApprovalStatus: "editorialApprovalStatus",
      publishedAt: "publishedAt",
      media: "heroImage",
    },
    prepare: (selection) => {
      const publishedAt = readString(selection.publishedAt);
      return preview(
        previewTitle(selection.title, "Untitled post"),
        statusSubtitle(selection, [
          readString(selection.editorialApprovalStatus) === "approved"
            ? "copy approved"
            : "copy not approved",
          readString(selection.target) === "external" ? "hosted elsewhere" : undefined,
          readString(selection.type),
          // Date only: the time of day is noise in a list of articles.
          publishedAt ? publishedAt.slice(0, 10) : "no date",
        ]),
        selection.media,
      );
    },
  },
};
