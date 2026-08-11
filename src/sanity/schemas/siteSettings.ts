/**
 * `siteSettings` — the single global document (§16.1).
 *
 * There is exactly one of these. Everything in it appears on every page, so an
 * edit here is the highest-blast-radius edit in the CMS; the revalidation
 * webhook accordingly invalidates the whole layout plus the sitemap, robots and
 * the share-card image when this document changes.
 *
 * ## Pitch recipients are NOT in this document
 *
 * Where a pitch submission is emailed is configured through server-only
 * environment variables (`src/lib/pitch/config.ts`), never here. This document is
 * queryable by anyone with a read token, and a list of partner inboxes is both a
 * personal-data disclosure and an invitation to spam. If someone asks for a
 * "pitch recipients" field, the answer is an environment variable, not a
 * schema change (§11.3, §23).
 *
 * ## Three brand names, on purpose
 *
 * `displayBrandName`, `legalName` and `seoBrandName` are three separate
 * decisions, not three copies of one. The wordmark, the registered entity and
 * the name search engines should show can legitimately differ in capitalisation
 * or in wording, and collapsing them hides a real editorial question.
 */

import type { SanityDocumentSchema } from "../schema-types";
import { previewTitle, readString } from "./shared";

export const siteSettingsSchema: SanityDocumentSchema = {
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  description:
    "Global settings for the whole site: brand names, contact routes, navigation, investment criteria, statistics and which sections are switched on. There is only one of these documents. Pitch recipients are configured on the server and must never be added here.",
  groups: [
    { name: "brand", title: "Brand & SEO", default: true },
    { name: "contact", title: "Contact" },
    { name: "navigation", title: "Navigation" },
    { name: "criteria", title: "Criteria & numbers" },
    { name: "flags", title: "Sections" },
    { name: "evidence", title: "Evidence" },
  ],
  fields: [
    {
      name: "displayBrandName",
      title: "Display name",
      type: "string",
      description:
        "The brand name as it is written in visible copy — headings, the footer, the accessible name of the logo. Capitalisation matters and is a decision: write it exactly as it should appear.",
      group: "brand",
      validationRule: { required: true, min: 2, max: 80 },
    },
    {
      name: "legalName",
      title: "Legal name",
      type: "string",
      description:
        "The registered company name, used in legal text and structured data. Leave empty until it has been confirmed with someone who has seen the registration — do not assume it matches the display name.",
      group: "brand",
      validationRule: { max: 160 },
    },
    {
      name: "seoBrandName",
      title: "Name for search results",
      type: "string",
      description:
        'The brand name appended to every page title, e.g. "Portfolio — Foundry Ventures". Often written more formally than the display name; that difference is intentional.',
      group: "brand",
      validationRule: { required: true, min: 2, max: 80 },
    },
    {
      name: "canonicalOrigin",
      title: "Site address",
      type: "url",
      description:
        "The one address this site is published at, including https:// and the www prefix if that is the real one, and with no trailing slash. Every canonical link, share URL, sitemap entry and structured-data address is built from it, so getting it wrong is visible everywhere at once.",
      group: "brand",
      validationRule: { required: true, uri: { scheme: ["https"] } },
    },
    {
      name: "defaultSeoTitle",
      title: "Default search title",
      type: "string",
      description:
        "The title used for pages that have nothing more specific. Describes the firm rather than any one page.",
      group: "brand",
      validationRule: { required: true, min: 4, max: 70 },
    },
    {
      name: "defaultSeoDescription",
      title: "Default search description",
      type: "text",
      description:
        "The description used for pages that have nothing more specific. One or two sentences saying what Foundry does and who for; about 150 characters reads best in a search result.",
      group: "brand",
      validationRule: { required: true, min: 40, max: 200 },
    },
    {
      name: "defaultOgImage",
      title: "Default share image",
      type: "imageAsset",
      description:
        "The picture shown when a link to this site is shared and the page has no image of its own. The site generates a Foundry-branded card by default, which is usually the better choice — supply one here only if there is a specific reason.",
      group: "brand",
      validationRule: { required: true },
    },
    {
      name: "brandStatement",
      title: "Brand statement",
      type: "editorialText",
      description:
        "One sentence describing Foundry, reused wherever the design needs a short summary of the firm. Like all editorial text it stays hidden until approved.",
      group: "brand",
    },

    {
      name: "contactPeople",
      title: "Contact people",
      type: "array",
      description:
        "Who visitors should reach, in order. The footer and the contact block are built from these people's own records, so a name, role or email is maintained in one place — their team profile — and never duplicated here. Each person still controls which of their channels is published, through the evidence on their own record.",
      group: "contact",
      of: [{ type: "reference", to: [{ type: "teamMember" }], options: { disableNew: true } }],
      validationRule: { unique: true },
    },
    {
      name: "contactEmail",
      title: "General email",
      type: "string",
      description:
        "A general inbox such as hello@, if one genuinely exists and is monitored. Leave empty otherwise — contact then routes through the people above, which is better than an address nobody reads. Never invent one.",
      group: "contact",
      validationRule: {
        max: 160,
        regex: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", name: "email address" },
      },
    },
    {
      name: "contactPhone",
      title: "General phone",
      type: "string",
      description:
        "A general phone number in international form, if one exists. Leave empty otherwise.",
      group: "contact",
      validationRule: {
        max: 40,
        regex: { pattern: "^\\+?[0-9 ()-]{6,30}$", name: "international phone number" },
      },
    },
    {
      name: "address",
      title: "Postal address",
      type: "address",
      description:
        "The office address, if Foundry publishes one. It goes into the structured data search engines read, so leave it empty until the real address is confirmed.",
      group: "contact",
    },
    {
      name: "organizationNumber",
      title: "Organisation number",
      type: "string",
      description:
        "The company registration number, for legal pages. Leave empty until confirmed against the registration.",
      group: "contact",
      validationRule: { max: 40 },
    },
    {
      name: "linkedinUrl",
      title: "LinkedIn page",
      type: "url",
      description:
        "Foundry's own LinkedIn company page. Used in the footer and in structured data, so use the canonical address LinkedIn itself shows.",
      group: "contact",
      validationRule: { required: true, uri: { scheme: ["https"] } },
    },
    {
      name: "careersUrl",
      title: "Careers page",
      type: "url",
      description:
        "Where Foundry's own openings are listed, if anywhere. Leave empty rather than pointing at a page with nothing on it.",
      group: "contact",
      validationRule: { uri: { scheme: ["https", "http"] } },
    },
    {
      name: "socialLinks",
      title: "Social profiles",
      type: "array",
      description:
        "The accounts shown in the footer. Add a profile only if it exists and is in use — a dormant account found through the footer says more than no account at all.",
      group: "contact",
      of: [{ type: "socialLink" }],
    },

    {
      name: "navigation",
      title: "Header navigation",
      type: "array",
      description:
        "The links in the main navigation, in order. Keep it short — this list is also the mobile menu, and every entry competes with the others for attention. Links tied to a section that is switched off disappear automatically.",
      group: "navigation",
      of: [{ type: "navItem" }],
      validationRule: { max: 8 },
    },
    {
      name: "footerNavigation",
      title: "Footer navigation",
      type: "array",
      description:
        "The links in the footer, in order. May repeat the header and usually includes Home. Same rule about switched-off sections applies.",
      group: "navigation",
      of: [{ type: "navItem" }],
      validationRule: { max: 12 },
    },
    {
      name: "legalNavigation",
      title: "Legal links",
      type: "array",
      description:
        "The small print row at the very bottom: privacy notice and anything similar. Each one should point at a legal page that exists.",
      group: "navigation",
      of: [{ type: "navItem" }],
      validationRule: { max: 6 },
    },

    {
      name: "investmentCriteria",
      title: "Investment criteria",
      type: "array",
      description:
        "The rows describing what Foundry invests in — stage, geography, ticket range and so on. Founders read these as commitments and decide whether to pitch based on them, so each row carries its own evidence and any row that is not approved is dropped. A shorter honest block is the intended outcome.",
      group: "criteria",
      of: [{ type: "investmentCriterion" }],
      validationRule: { max: 10 },
    },
    {
      name: "stats",
      title: "Statistics",
      type: "array",
      description:
        "The numbers shown on the home page. Anything that counts portfolio companies should be set to count automatically, so the figure can never disagree with the portfolio page. Every number is hidden until its evidence is approved.",
      group: "criteria",
      of: [{ type: "stat" }],
      validationRule: { max: 6 },
    },

    {
      name: "featureFlags",
      title: "Sections",
      type: "object",
      description:
        "Which parts of the site exist. A section that is switched off is genuinely absent: its page returns not-found, it disappears from navigation and from the sitemap, and it generates no metadata. Switch a section on only once it has real, approved content — an empty section is more damaging than a missing one.",
      group: "flags",
      options: { columns: 2 },
      validationRule: { required: true },
      fields: [
        {
          name: "investmentCriteria",
          title: "Investment criteria block",
          type: "boolean",
          description:
            "The criteria block on the home page. Only shows rows whose evidence is approved, so switching it on with nothing approved shows nothing.",
          initialValue: false,
        },
        {
          name: "insights",
          title: "News & insights",
          type: "boolean",
          description:
            "The whole insights section: the archive, article pages, and the latest-insights block on the home page. Leave off until there are published posts.",
          initialValue: false,
        },
        {
          name: "about",
          title: "About page",
          type: "boolean",
          description: "The about / thesis page. Leave off until the copy has been approved.",
          initialValue: false,
        },
        {
          name: "network",
          title: "Network page",
          type: "boolean",
          description:
            "The operating partners, advisors and angels page. Leave off until there is a real network to show, with each person's agreement.",
          initialValue: false,
        },
        {
          name: "stats",
          title: "Statistics block",
          type: "boolean",
          description: "The numbers block on the home page.",
          initialValue: false,
        },
        {
          name: "testimonials",
          title: "Testimonials",
          type: "boolean",
          description:
            "The founder quotes on the home page. Leave off until at least one quote has consent and approval.",
          initialValue: false,
        },
      ],
    },

    {
      name: "fieldEvidence",
      title: "Evidence",
      type: "object",
      description:
        "Where each global fact comes from and whether it has been cleared for publication. Same rule as everywhere else: below “Owner approved”, the value is hidden on the public site even though it is filled in here.",
      group: "evidence",
      options: { collapsible: true, collapsed: true },
      fields: [
        {
          name: "displayBrandName",
          title: "Display name",
          type: "fieldEvidence",
          description:
            "That this is how the brand name is written in visible copy, capitalisation included.",
        },
        {
          name: "legalName",
          title: "Legal name",
          type: "fieldEvidence",
          description: "That this matches the company registration.",
        },
        {
          name: "seoBrandName",
          title: "Name for search results",
          type: "fieldEvidence",
          description: "That this is the form Foundry wants search engines to show.",
        },
        {
          name: "contactEmail",
          title: "General email",
          type: "fieldEvidence",
          description: "That this inbox exists and someone is reading it.",
        },
        {
          name: "contactPhone",
          title: "General phone",
          type: "fieldEvidence",
          description: "That this number is answered and may be published.",
        },
        {
          name: "address",
          title: "Postal address",
          type: "fieldEvidence",
          description:
            "That this is the address Foundry wants published — it goes into structured data as well as onto the page.",
        },
        {
          name: "organizationNumber",
          title: "Organisation number",
          type: "fieldEvidence",
          description: "That the number matches the registration.",
        },
        {
          name: "linkedinUrl",
          title: "LinkedIn page",
          type: "fieldEvidence",
          description: "That this is Foundry's own page, at its canonical address.",
        },
        {
          name: "careersUrl",
          title: "Careers page",
          type: "fieldEvidence",
          description: "That the page exists and is kept up to date.",
        },
      ],
    },
  ],
  preview: {
    select: { title: "displayBrandName", origin: "canonicalOrigin" },
    prepare: (selection) => ({
      title: previewTitle(selection.title, "Site settings"),
      subtitle: readString(selection.origin) ?? "no site address set",
    }),
  },
};
