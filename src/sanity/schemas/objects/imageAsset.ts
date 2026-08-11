/**
 * `ImageAsset` — an image plus its rights record.
 *
 * Extends Sanity's built-in `image` type, so the upload, the CDN URL, the
 * dimensions, the blur placeholder and the hotspot editor all come for free.
 * The GROQ projection in `src/content/adapters/sanity.ts` derives these from the
 * asset and never asks an editor for them:
 *
 *   id · src · width · height · blurDataUrl · available
 *
 * `available` is `defined(asset->url)`: an image record with no uploaded binary
 * renders nothing at all rather than a broken frame (§16.2, Appendix A.2).
 *
 * The fields below are the ones a human has to answer. `rightsStatus` is the
 * important one — `canRenderImage` refuses to render anything that is not
 * `approved` in production (§16.7), because "we found it on the old site" is not
 * a licence.
 */

import type { SanityImageSchema } from "../../schema-types";
import { readString } from "../shared";

const RIGHTS_STATUS_OPTIONS = [
  { title: "Unverified — we do not know if we may use this", value: "unverified" },
  { title: "Approved — we hold the rights to publish it", value: "approved" },
];

export const imageAssetSchema: SanityImageSchema = {
  name: "imageAsset",
  title: "Image",
  type: "image",
  description:
    "An image together with the record of who owns it and whether we are allowed to publish it.",
  // The hotspot is what keeps a face or a focal point in frame across the very
  // different crops the layout uses at 320px and at 1920px.
  options: { hotspot: true },
  fields: [
    {
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        'What the image shows, for people who cannot see it. Describe the content, not the file: "Two founders at a whiteboard", not "photo". Leave it completely empty for purely decorative images — an empty value is a real answer here and tells screen readers to skip it.',
      options: { isHighlighted: true },
      validationRule: { max: 240 },
    },
    {
      name: "caption",
      title: "Caption",
      type: "string",
      description:
        "Optional line printed under the image where the design shows captions. Only fill this in when the caption adds something; it is not a place to repeat the alt text.",
      options: { isHighlighted: true },
      validationRule: { max: 300 },
    },
    {
      name: "rightsStatus",
      title: "Rights",
      type: "string",
      description:
        'Whether we may publish this image. It stays hidden on the public site until this says "Approved" — including images that were already on the old site, because appearing there is not proof of a licence.',
      options: { list: RIGHTS_STATUS_OPTIONS, layout: "radio" },
      initialValue: "unverified",
      validationRule: { required: true },
    },
    {
      name: "rightsOwner",
      title: "Rights holder",
      type: "string",
      description:
        'Who owns the image: the photographer, the stock library and licence, or "Foundry Ventures" for work we commissioned. Required in practice before rights can be approved.',
      validationRule: { max: 200 },
    },
    {
      name: "sourceUrl",
      title: "Where the original came from",
      type: "url",
      description:
        "The address the rights-cleared original was exported from, e.g. the stock licence page or the old site's asset URL. Recorded for the audit trail — the site never loads the image from here.",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "checksumSha256",
      title: "Checksum (SHA-256)",
      type: "string",
      description:
        "Optional fingerprint of the exact file, used when migrating to prove that the uploaded image is byte-for-byte the licensed original. Leave empty unless you were given one.",
      validationRule: {
        regex: { pattern: "^[a-f0-9]{64}$", name: "64 lowercase hex characters" },
      },
    },
    {
      name: "isPlaceholder",
      title: "Placeholder artwork",
      type: "boolean",
      description:
        "Tick when this is Foundry-owned stand-in artwork used until the real image arrives. It still renders, but every placeholder is listed in the content-gaps report so none of them ships unnoticed.",
      initialValue: false,
    },
  ],
  preview: {
    select: { alt: "alt", caption: "caption", rightsStatus: "rightsStatus", media: "asset" },
    prepare: (selection) => ({
      title:
        readString(selection.alt) ?? readString(selection.caption) ?? "Image (no alt text yet)",
      subtitle:
        readString(selection.rightsStatus) === "approved"
          ? "Rights approved"
          : "Rights unverified — will not render publicly",
      media: selection.media,
    }),
  },
};
