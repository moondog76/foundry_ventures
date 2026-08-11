/**
 * Rich text — the editor for `RichText` in `src/content/types.ts`.
 *
 * The domain model is deliberately small (§12.2): paragraphs, h2–h4, bullet and
 * numbered lists, blockquote-with-attribution, images and provider-allowlisted
 * embeds, with `strong` / `em` / `code` / `link` as the only inline marks.
 * `RichTextRenderer` renders exactly that set and silently drops anything else,
 * so the editor is configured to offer exactly that set and nothing more — an
 * editor who cannot choose an unsupported style cannot publish one.
 *
 * Two deliberate shape decisions:
 *
 *  - **Blockquote is an object, not a block style.** `RichTextBlock.blockquote`
 *    carries an `attribution`, which a Portable Text style cannot hold. Offering
 *    both a `blockquote` style and this object would give editors two ways to do
 *    the same thing, one of which loses the attribution, so the style is absent.
 *  - **Embeds are a first-class object** with an explicit provider, matching the
 *    allowlist in `src/lib/security/url.ts` and the `frame-src` directive in
 *    `next.config.ts`. A pasted URL from anywhere else is refused at save time
 *    rather than dropped silently at render time.
 */

import type { SanityArrayMember, SanityObjectSchema } from "../../schema-types";

/**
 * Providers the renderer and the Content-Security-Policy both allow. Keep in
 * step with `EMBED_HOSTS` in `src/lib/security/url.ts`.
 */
export const EMBED_PROVIDERS = [
  { title: "YouTube", value: "youtube" },
  { title: "Vimeo", value: "vimeo" },
  { title: "Loom", value: "loom" },
] as const;

const EMBED_HOST_PATTERN =
  "^https://(www\\.|player\\.)?(youtube\\.com|youtu\\.be|vimeo\\.com|loom\\.com)/";

export const richTextQuoteSchema: SanityObjectSchema = {
  name: "richTextQuote",
  title: "Pull quote",
  type: "object",
  description:
    "A quotation set apart from the running text, with an optional line saying who said it.",
  fields: [
    {
      name: "quote",
      title: "Quote",
      type: "text",
      description:
        "The quotation itself, without surrounding quotation marks — the design adds the typographic treatment.",
      validationRule: { required: true, min: 2, max: 400 },
    },
    {
      name: "attribution",
      title: "Attribution",
      type: "string",
      description:
        "Who said it, e.g. name and role. Leave empty if the quote is unattributed; never invent an attribution.",
      validationRule: { max: 120 },
    },
  ],
  preview: {
    select: { title: "quote", subtitle: "attribution" },
  },
};

export const richTextEmbedSchema: SanityObjectSchema = {
  name: "richTextEmbed",
  title: "Video embed",
  type: "object",
  description:
    "An embedded video from an approved provider. Anything hosted elsewhere cannot be embedded — link to it instead.",
  fields: [
    {
      name: "provider",
      title: "Provider",
      type: "string",
      description:
        "Where the video is hosted. Only these three providers are allowed to load inside the page.",
      options: { list: [...EMBED_PROVIDERS], layout: "radio" },
      validationRule: { required: true },
    },
    {
      name: "url",
      title: "Embed URL",
      type: "url",
      description:
        "The player URL from the provider's share/embed panel, starting with https://. A watch-page URL usually works too, but the embed URL is what the provider supports.",
      validationRule: {
        required: true,
        uri: { scheme: ["https"] },
        regex: { pattern: EMBED_HOST_PATTERN, name: "approved video provider" },
        custom:
          "Host must match the chosen provider. A mismatched URL is dropped at render time rather than shown broken.",
      },
    },
    {
      name: "title",
      title: "Accessible title",
      type: "string",
      description:
        "A short description of what the video shows. Screen-reader users hear this instead of the video frame, so it is required.",
      validationRule: { required: true, min: 3, max: 120 },
    },
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
};

/**
 * The member list for every rich-text field on the site. Exported so all five
 * long-form fields (company body, why we invested, team long bio, post body,
 * legal page body) offer an identical editor.
 */
export const RICH_TEXT_MEMBERS: SanityArrayMember[] = [
  {
    type: "block",
    // Only the styles `RichTextRenderer` knows how to render. `h1` is absent:
    // every page owns exactly one `<h1>`, and it is never authored in a body.
    styles: [
      { title: "Paragraph", value: "normal" },
      { title: "Heading 2", value: "h2" },
      { title: "Heading 3", value: "h3" },
      { title: "Heading 4", value: "h4" },
    ],
    lists: [
      { title: "Bulleted list", value: "bullet" },
      { title: "Numbered list", value: "number" },
    ],
    marks: {
      decorators: [
        { title: "Bold", value: "strong" },
        { title: "Italic", value: "em" },
        { title: "Code", value: "code" },
      ],
      annotations: [
        {
          name: "link",
          type: "object",
          title: "Link",
          fields: [
            {
              name: "href",
              title: "URL",
              type: "url",
              description:
                "Where the link goes. Use a path such as /portfolio for pages on this site, or a full https:// address for anywhere else.",
              validationRule: {
                required: true,
                uri: { scheme: ["https", "http", "mailto", "tel"], allowRelative: true },
              },
            },
            {
              name: "isExternal",
              title: "Opens in a new tab",
              type: "boolean",
              description:
                "Tick for links that leave this site. The link then gets an external-link icon and an accessible hint. Leave unticked for links to our own pages.",
              initialValue: false,
            },
          ],
        },
      ],
    },
  },
  {
    type: "imageAsset",
    title: "Image",
  },
  { type: "richTextQuote" },
  { type: "richTextEmbed" },
];
