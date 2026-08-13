/**
 * `homePage` — the single home-page document (§16.1.1).
 *
 * Every user-visible string here is an `editorialText`, not a bare string. That
 * looks heavy for a heading until you remember what the home page is: the
 * densest concentration of claims on the site, most of them carried over
 * verbatim from a live site nobody has re-approved. Wrapping each one means a
 * reviewer can approve the vision paragraph without also, silently, approving
 * the tagline next to it — and production renders only the ones that have been
 * approved (§25.1).
 *
 * The structure mirrors the sections of the page, so an editor can see which
 * block they are editing. Sections that can be switched off in site settings —
 * statistics, testimonials, latest insights — keep only their headings here;
 * their content comes from the records themselves.
 */

import type { SanityDocumentSchema, SanityField } from "../schema-types";
import {
  editorialTextField,
  editorialTextListField,
  publicationStatusField,
  readString,
  statusSubtitle,
} from "./shared";

/**
 * A button: approved label plus a destination. The destination is a plain
 * string because it is a route, not a claim — there is nothing to approve about
 * "/pitch", and the approval that matters is of the words on the button.
 */
function ctaField(name: string, title: string, description: string): SanityField {
  return {
    name,
    title,
    type: "object",
    description,
    fields: [
      editorialTextField(
        "label",
        "Button label",
        "The words on the button. Two or three at most — a button is not a sentence. Like all copy, it stays hidden until approved.",
      ),
      {
        name: "href",
        title: "Destination",
        type: "string",
        description:
          'Where the button goes. A path on this site starting with "/", e.g. /pitch or /portfolio.',
        validationRule: {
          required: true,
          max: 300,
          regex: { pattern: "^/", name: "path starting with /" },
        },
      },
    ],
    preview: {
      select: { label: "label.value", href: "href" },
      prepare: (selection) => ({
        title: readString(selection.label) ?? "No label",
        subtitle: readString(selection.href) ?? "",
      }),
    },
  };
}

export const homePageSchema: SanityDocumentSchema = {
  name: "homePage",
  title: "Home page",
  type: "document",
  description:
    "The content of the home page. There is only one of these documents. Every piece of copy here is approved individually — unapproved copy is visible in preview but never on the public site.",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "vision", title: "Vision" },
    { name: "offering", title: "Offering" },
    { name: "portfolio", title: "Portfolio" },
    { name: "optional", title: "Optional sections" },
    { name: "contact", title: "Contact" },
    { name: "seo", title: "Search & social" },
  ],
  fields: [
    { ...publicationStatusField("page"), group: "hero" },

    {
      name: "hero",
      title: "Hero",
      type: "object",
      description:
        "The first screen: the one claim a visitor reads before deciding whether to keep scrolling.",
      group: "hero",
      fields: [
        editorialTextField(
          "eyebrow",
          "Eyebrow",
          'The small line above the headline, e.g. "Early stage · Nordics". Optional — leave it out rather than filling it with a slogan.',
        ),
        editorialTextField(
          "heading",
          "Headline",
          "The main headline of the site, and the largest text on it. One sentence. This is the claim everything else has to live up to, so it is worth reviewing slowly.",
          { validationRule: { required: true } },
        ),
        editorialTextListField(
          "paragraphs",
          "Paragraphs",
          "The paragraphs under the headline, in order. One entry per paragraph — do not put blank lines inside a single entry. Two paragraphs is usually the most the hero can carry.",
          { validationRule: { max: 3 } },
        ),
        ctaField(
          "primaryCta",
          "Primary button",
          "The main action — normally submitting a pitch, since that is what a founder came here to do.",
        ),
        ctaField(
          "secondaryCta",
          "Secondary button",
          "The alternative for someone not ready to pitch — normally the portfolio.",
        ),
        {
          name: "image",
          title: "Hero image",
          type: "imageAsset",
          description:
            "The image behind or beside the headline. It needs approved rights before it renders; without them the hero falls back to its typographic treatment, which is a designed state rather than a failure.",
          validationRule: { required: true },
        },
      ],
    },

    {
      name: "vision",
      title: "Vision",
      type: "object",
      description: "The section explaining how Foundry sees the shift it is investing in.",
      group: "vision",
      fields: [
        editorialTextField(
          "eyebrow",
          "Eyebrow",
          'The small label above the heading, e.g. "Vision".',
          { validationRule: { required: true } },
        ),
        editorialTextField(
          "heading",
          "Heading",
          "The claim this section argues for. One sentence.",
          {
            validationRule: { required: true },
          },
        ),
        editorialTextListField(
          "paragraphs",
          "Paragraphs",
          "The argument, one entry per paragraph, in order.",
          { validationRule: { max: 5 } },
        ),
      ],
    },

    {
      name: "offering",
      title: "Offering",
      type: "object",
      description: "The numbered list of what Foundry gives the companies it backs.",
      group: "offering",
      fields: [
        editorialTextField(
          "eyebrow",
          "Eyebrow",
          'The small label above the list, e.g. "Offering".',
          { validationRule: { required: true } },
        ),
        {
          name: "items",
          title: "Items",
          type: "array",
          description:
            "What Foundry offers, in order. Each item is one concrete thing — not a value, a thing a founder actually receives.",
          of: [
            {
              type: "object",
              name: "offeringItem",
              title: "Offering item",
              fields: [
                {
                  name: "number",
                  title: "Number",
                  type: "string",
                  description:
                    'The numeral shown beside the item, written the way it should appear, e.g. "01". Kept as text so the leading zero survives.',
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
        {
          name: "images",
          title: "Images",
          type: "array",
          description:
            "The images beside the list, in order. Each needs approved rights; any that are not approved are left out and the layout adapts.",
          of: [{ type: "imageAsset" }],
          validationRule: { max: 4 },
        },
      ],
    },

    {
      name: "featuredPortfolio",
      title: "Featured portfolio",
      type: "object",
      description: "The portfolio companies shown on the home page.",
      group: "portfolio",
      fields: [
        editorialTextField("heading", "Heading", "The heading above the company logos.", {
          validationRule: { required: true },
        }),
        editorialTextField(
          "intro",
          "Introduction",
          "An optional sentence under the heading. Leave it out unless it says something the logos do not.",
        ),
        {
          name: "companyIds",
          title: "Companies",
          type: "array",
          description:
            "Which companies to show, in the order they should appear. Any company that is not publishable yet is skipped rather than shown half-built, and the remaining places are filled from companies marked as featured. Around eight works best.",
          of: [{ type: "reference", to: [{ type: "company" }], options: { disableNew: true } }],
          validationRule: { max: 12, unique: true },
        },
        editorialTextField(
          "ctaLabel",
          "Button label",
          'The words on the button under the logos, e.g. "See full portfolio".',
          { validationRule: { required: true } },
        ),
        {
          name: "ctaHref",
          title: "Button destination",
          type: "string",
          description:
            "Always the portfolio archive. Fixed, because there is nowhere else this button could sensibly go.",
          initialValue: "/portfolio",
          readOnly: true,
        },
      ],
    },

    {
      name: "optionalSections",
      title: "Optional sections",
      type: "object",
      description:
        "Headings for the sections that can be switched off in site settings. Their content comes from the statistics, testimonials and posts themselves — only the headings live here, and a section that is off ignores its heading completely.",
      group: "optional",
      options: { collapsible: true, collapsed: true },
      fields: [
        editorialTextField(
          "statsHeading",
          "Statistics heading",
          "The heading above the numbers block.",
        ),
        editorialTextField(
          "testimonialsHeading",
          "Testimonials heading",
          "The heading above the founder quotes.",
        ),
        editorialTextField(
          "latestInsightsHeading",
          "Latest insights heading",
          "The heading above the most recent posts.",
        ),
        editorialTextField(
          "latestInsightsCtaLabel",
          "Latest insights button label",
          "The words on the button leading to the full archive.",
        ),
      ],
    },

    {
      name: "contact",
      title: "Contact",
      type: "object",
      description: "The closing section inviting founders to get in touch.",
      group: "contact",
      fields: [
        editorialTextField("heading", "Heading", "The closing question or invitation.", {
          validationRule: { required: true },
        }),
        editorialTextListField(
          "paragraphs",
          "Paragraphs",
          "What follows the heading, one entry per paragraph.",
          { validationRule: { max: 3 } },
        ),
        ctaField("primaryCta", "Primary button", "The main action — normally the pitch form."),
        {
          name: "secondaryCta",
          title: "Secondary button",
          type: "object",
          description:
            "A direct route to one person, for founders who would rather write an email than fill in a form.",
          fields: [
            editorialTextField(
              "label",
              "Button label",
              'The words on the button, e.g. "Email Anders".',
            ),
            {
              name: "contactPerson",
              title: "Person",
              type: "reference",
              description:
                "Whose address the button uses. Taken from their team record, so it stays correct if it changes — and it only appears at all if that person has approved publishing their email.",
              to: [{ type: "teamMember" }],
              options: { disableNew: true },
            },
          ],
        },
        {
          name: "contactPeople",
          title: "People shown",
          type: "array",
          description:
            "The people listed in this section, in order. Their names, roles and channels come from their own records; each person controls which of their channels is published.",
          of: [{ type: "reference", to: [{ type: "teamMember" }], options: { disableNew: true } }],
          validationRule: { max: 4, unique: true },
        },
      ],
    },

    {
      name: "seo",
      title: "Search & social",
      type: "seoFields",
      description:
        "How the home page appears in search results and when its link is shared. The home page is the one page where filling this in is usually worth it.",
      group: "seo",
      validationRule: { required: true },
    },
  ],
  preview: {
    select: { publicationStatus: "publicationStatus", heading: "hero.heading.value" },
    prepare: (selection) => ({
      title: "Home page",
      subtitle: statusSubtitle(selection, [readString(selection.heading)]),
    }),
  },
};
