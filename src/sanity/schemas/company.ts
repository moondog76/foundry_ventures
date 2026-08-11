/**
 * `company` — a portfolio company (§8, §16.2).
 *
 * This is the type where the evidence system earns its keep. A company record
 * degrades **field by field** rather than all at once: with only an approved
 * name, logo and website it still appears in the archive as a sparse card
 * linking to the company's own site; as tagline, sectors and a long description
 * get approved, the same record grows into a card with substance and then into
 * a detail page. Nothing is invented to fill the gap in between — an unapproved
 * field is simply absent.
 *
 * `/portfolio/[slug]` exists only when name, logo and website are approved *and*
 * the short description and the body are approved and actually written. Below
 * that bar the card links straight to the company's own site, because a detail
 * page with a logo and one sentence on it is worse than no page — `noindex` is
 * not a substitute for having something to say.
 *
 * `logoFit` and `opticalScale` are the other unusual pair here: portfolio logos
 * arrive in wildly different aspect ratios, and a grid that scales them all to
 * the same box makes a square logo look enormous next to a wide one. They are
 * per-logo optical calibration, not styling preferences (§5.5).
 */

import type { SanityDocumentSchema } from "../schema-types";
import {
  featuredField,
  fieldEvidenceField,
  preview,
  previewTitle,
  publicationStatusField,
  readString,
  richTextField,
  seoField,
  slugField,
  sortOrderField,
  statusSubtitle,
  verificationStatusField,
} from "./shared";

/** `CompanyStatus` in `src/content/types.ts`. */
const COMPANY_STATUS_OPTIONS = [
  { title: "Active — a current holding", value: "active" },
  { title: "Exited — sold or listed", value: "exited" },
  { title: "Realized — the position has been closed out", value: "realized" },
  { title: "Inactive — internal only, never shown publicly", value: "inactive" },
];

/** `Company["logoFit"]` in `src/content/types.ts`. */
const LOGO_FIT_OPTIONS = [
  { title: "Contain — normal proportions", value: "contain" },
  { title: "Wide — a long horizontal wordmark", value: "wide" },
  { title: "Compact — square or nearly square", value: "compact" },
];

export const companySchema: SanityDocumentSchema = {
  name: "company",
  title: "Portfolio company",
  type: "document",
  description: "A company Foundry has invested in.",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "editorial", title: "Editorial" },
    { name: "relations", title: "Relations" },
    { name: "evidence", title: "Evidence" },
    { name: "seo", title: "Search & social" },
  ],
  fieldsets: [
    {
      name: "logoRendering",
      title: "Logo rendering",
      description:
        "How this particular logo is fitted into the portfolio grid. Adjust only if the logo looks wrong next to the others.",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      description:
        "The company's name as the company writes it, including capitalisation. Nothing about this company appears publicly until the name is approved below.",
      group: "identity",
      validationRule: { required: true, min: 1, max: 120 },
    },
    {
      ...slugField(
        'The address of the company page, e.g. "empley" becomes /portfolio/empley. Lowercase, hyphens between words, no accents. Do not change it once the page is live — links people have shared would break.',
        "name",
      ),
      group: "identity",
    },
    {
      name: "websiteUrl",
      title: "Website",
      type: "url",
      description:
        "The company's own site. It matters more than it looks: when there is not yet enough approved material for a page here, the portfolio card links to this address instead — so an approved website is what keeps a sparse card useful.",
      group: "identity",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "logo",
      title: "Logo",
      type: "imageAsset",
      description:
        "The company's logo, ideally on a transparent background. It needs approved rights like any other image — a logo taken from the old site is a reference, not a licence. Without an approved logo the card falls back to the company name set in type.",
      group: "identity",
      fieldset: "logoRendering",
    },
    {
      name: "logoAlt",
      title: "Logo alt text",
      type: "string",
      description:
        'What a screen reader announces for the logo. Leave empty and the site says "<Company> logo", which is right almost always. Fill it in only when the logo carries extra words, such as a tagline.',
      group: "identity",
      fieldset: "logoRendering",
      validationRule: { max: 160 },
    },
    {
      name: "logoFit",
      title: "Logo shape",
      type: "string",
      description:
        'Which shape this logo is, so the grid can give it the right amount of room: "wide" for long horizontal wordmarks, "compact" for square marks, "contain" for everything else. Wrong choices show up as one logo looking much larger than its neighbours.',
      group: "identity",
      fieldset: "logoRendering",
      options: { list: LOGO_FIT_OPTIONS, layout: "radio" },
      initialValue: "contain",
    },
    {
      name: "opticalScale",
      title: "Optical scale",
      type: "number",
      description:
        "Fine adjustment when a logo still reads heavier or lighter than the others, even with the right shape chosen. 1 means no adjustment; 0.8 makes it noticeably smaller. Change it by eye against the live grid, in small steps.",
      group: "identity",
      fieldset: "logoRendering",
      initialValue: 1,
      validationRule: { min: 0.4, max: 1.6 },
    },
    {
      name: "status",
      title: "Investment status",
      type: "string",
      description:
        'Where this investment stands. Visitors can filter by it, so it is a public statement about the company — approve it below before it shows. "Inactive" is an internal state: a company marked inactive never appears publicly at all.',
      group: "identity",
      options: { list: COMPANY_STATUS_OPTIONS, layout: "radio" },
    },
    {
      name: "headquarters",
      title: "Headquarters",
      type: "string",
      description:
        'Where the company is based, as city and country, e.g. "Stockholm, Sweden". Leave empty rather than guessing from a founder\'s location.',
      group: "identity",
      validationRule: { max: 120 },
    },
    {
      name: "investmentYear",
      title: "Year of investment",
      type: "number",
      description:
        "The year Foundry first invested — four digits. A date that is easy to get slightly wrong and awkward to correct in public, so confirm it internally before approving it.",
      group: "identity",
      validationRule: { integer: true, min: 2000, max: 2100 },
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn",
      type: "url",
      description: "The company's LinkedIn page, if it has one.",
      group: "identity",
      validationRule: { uri: { scheme: ["https"] } },
    },
    {
      name: "careersUrl",
      title: "Careers page",
      type: "url",
      description:
        "The company's jobs page. Only add it when the page exists and is kept current — a careers link that 404s reflects on both companies.",
      group: "identity",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    { ...publicationStatusField("company"), group: "identity" },
    { ...verificationStatusField("company"), group: "identity" },
    {
      ...featuredField(
        "Tick to make this company eligible for the home page. The home page picks its own order first and fills the rest from featured companies.",
      ),
      group: "identity",
    },
    { ...sortOrderField("portfolio companies"), group: "identity" },
    {
      name: "dataCompleteness",
      title: "Completeness",
      type: "dataCompleteness",
      description:
        "A quick checklist of how finished this record is. It does not decide what the site shows — the evidence below does — but it tells the team where the work is left.",
      group: "identity",
    },

    {
      name: "tagline",
      title: "Tagline",
      type: "string",
      description:
        "One line describing what the company does, in the company's own words wherever possible. Shown on the portfolio card. Around 100 characters; if it needs two sentences it belongs in the short description instead.",
      group: "editorial",
      validationRule: { max: 200 },
    },
    {
      name: "shortDescription",
      title: "Short description",
      type: "text",
      description:
        "Two or three sentences introducing the company, used at the top of its page. Together with the long description below, this is what decides whether the company gets a page here at all — without both, approved, the portfolio card links to the company's own site instead.",
      group: "editorial",
      validationRule: { max: 600 },
    },
    richTextField(
      "body",
      "Long description",
      "The full description on the company page: what they build, who for, why it matters. Required — and approved — before the page exists; a page containing a logo and one sentence is worse for the company than a card that links to their own site.",
      { group: "editorial" },
    ),
    richTextField(
      "whyWeInvested",
      "Why we invested",
      "Foundry's own view: what convinced us. This is the part a founder reading the site actually wants, and it is the part only we can write. Optional, but it is what makes a company page worth visiting.",
      { group: "editorial" },
    ),
    {
      name: "cardImage",
      title: "Card image",
      type: "imageAsset",
      description:
        "An optional image for the portfolio card, used instead of the logo treatment where the design allows it. Needs approved rights.",
      group: "editorial",
    },
    {
      name: "heroImage",
      title: "Header image",
      type: "imageAsset",
      description:
        "An optional wide image at the top of the company page. Needs approved rights; without one the page opens with the typographic treatment, which is a perfectly good default.",
      group: "editorial",
    },
    {
      name: "founderQuote",
      title: "Founder quote",
      type: "founderQuote",
      description:
        "A short quotation from a founder, shown on the company page. Only fill this in when they have actually said it and are happy to be quoted.",
      group: "editorial",
    },

    {
      name: "founders",
      title: "Founders",
      type: "array",
      description:
        "The people who founded the company. Naming someone publicly is a claim about a real person, so the whole list stays hidden until the founders evidence below is approved.",
      group: "relations",
      of: [{ type: "founder" }],
      validationRule: { max: 8 },
    },
    {
      name: "dealLead",
      title: "Deal lead",
      type: "reference",
      description:
        "The person at Foundry who led this investment. Their profile page automatically lists the companies they lead, so this is the only place the connection is recorded.",
      group: "relations",
      to: [{ type: "teamMember" }],
      options: { disableNew: true },
    },
    {
      name: "stages",
      title: "Stages",
      type: "array",
      description:
        'The funding stages this company is tagged with, from the shared vocabulary. Visitors filter the portfolio by them, so use the same term consistently across companies. Only terms in the "Stage" group belong here.',
      group: "relations",
      of: [
        { type: "reference", to: [{ type: "taxonomy" }], options: { filter: 'group == "stage"' } },
      ],
      validationRule: { unique: true },
    },
    {
      name: "sectors",
      title: "Sectors",
      type: "array",
      description:
        'The markets this company sells into, from the shared vocabulary. A filter with only one company behind it is not useful — prefer an existing term over a new one. Only terms in the "Sector" group belong here.',
      group: "relations",
      of: [
        { type: "reference", to: [{ type: "taxonomy" }], options: { filter: 'group == "sector"' } },
      ],
      validationRule: { unique: true },
    },
    {
      name: "focuses",
      title: "Focus areas",
      type: "array",
      description:
        'The technology or theme this company works on, from the shared vocabulary. Only terms in the "Focus" group belong here.',
      group: "relations",
      of: [
        { type: "reference", to: [{ type: "taxonomy" }], options: { filter: 'group == "focus"' } },
      ],
      validationRule: { unique: true },
    },

    fieldEvidenceField("company", [
      {
        name: "name",
        title: "Name",
        description:
          "That the company is named and spelled this way. Nothing about this company appears publicly until this is approved.",
      },
      {
        name: "logo",
        title: "Logo",
        description:
          "That we may publish this logo — normally the company's own confirmation. Required, together with name and website, before a page can exist here.",
      },
      {
        name: "websiteUrl",
        title: "Website",
        description:
          "That this is the company's current address. Also required for a page here, and it is what a sparse card links to.",
      },
      {
        name: "tagline",
        title: "Tagline",
        description: "That the company is happy to be described this way in one line.",
      },
      {
        name: "shortDescription",
        title: "Short description",
        description:
          "That this description is accurate and the company agrees with it. Required for a page here.",
      },
      {
        name: "body",
        title: "Long description",
        description: "That the long description is accurate. Also required for a page here.",
      },
      {
        name: "stages",
        title: "Stages",
        description:
          "That these stage labels are right. They are public filters, so a wrong label is a public claim about the company's funding.",
      },
      {
        name: "sectors",
        title: "Sectors",
        description: "That these market labels are how the company describes itself.",
      },
      {
        name: "focuses",
        title: "Focus areas",
        description: "That these technology labels are accurate.",
      },
      {
        name: "status",
        title: "Investment status",
        description:
          "That the status is current. Exits and realisations are often confidential until announced — check before approving.",
      },
      {
        name: "founders",
        title: "Founders",
        description:
          "That these people are the founders, their titles are right, and they are happy to be named here.",
      },
      {
        name: "headquarters",
        title: "Headquarters",
        description: "That the company is based where we say it is.",
      },
      {
        name: "investmentYear",
        title: "Year of investment",
        description:
          "That the year is right and Foundry is willing to state publicly when it invested.",
      },
      {
        name: "dealLead",
        title: "Deal lead",
        description:
          "That naming this person as the deal lead is agreed — by them and by the company.",
      },
      {
        name: "whyWeInvested",
        title: "Why we invested",
        description:
          "That this account of our reasoning can be published. It often touches on the company's plans, so it usually needs their agreement too.",
      },
    ]),

    seoField("company"),
  ],
  preview: {
    select: {
      title: "name",
      tagline: "tagline",
      status: "status",
      publicationStatus: "publicationStatus",
      verificationStatus: "verificationStatus",
      media: "logo",
    },
    prepare: (selection) =>
      preview(
        previewTitle(selection.title, "Unnamed company"),
        statusSubtitle(selection, [readString(selection.status), readString(selection.tagline)]),
        selection.media,
      ),
  },
};
