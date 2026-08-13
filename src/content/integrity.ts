/**
 * Content integrity report (§16.8).
 *
 * Answers one question precisely: *which records and fields are blocking
 * publication right now?* CI runs this and prints the list, so a launch
 * conversation is about named gaps rather than "the site looks empty".
 *
 * It deliberately reports rather than throws — the caller decides whether a gap
 * is fatal (production gate) or informational (`docs/content-gaps.md`).
 */

import { rawContent } from "./index";
import type { EditorialText, FundPage, HomePage, ImageAsset } from "./types";
import {
  COMPANY_CORE_IDENTITY_FIELDS,
  COMPANY_DETAIL_REQUIRED_FIELDS,
  PRODUCTION_POLICY,
  canListCompanyPublicly,
  canListTeamMemberPublicly,
  canPublishCompanyDetail,
  canPublishCompanyField,
  canPublishTeamDetail,
  canPublishTeamField,
  isOwnerApproved,
  type PolicyBlock,
} from "./policy";

export type IntegrityReport = {
  blocks: PolicyBlock[];
  /** Placeholder artwork still referenced by published content. */
  placeholderImages: Array<{ id: string; src: string; caption?: string }>;
  /** Copy that would render publicly but has not been approved. */
  unapprovedCopy: Array<{ path: string; origin: EditorialText["origin"]; excerpt: string }>;
  summary: {
    companies: { total: number; listable: number; withDetail: number };
    teamMembers: { total: number; listable: number; withDetail: number };
    investmentCriteria: { total: number; approved: number };
  };
};

function excerpt(value: string, max = 72): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`;
}

function collectEditorialText(page: HomePage): Array<{ path: string; text: EditorialText }> {
  const found: Array<{ path: string; text: EditorialText }> = [];
  const add = (path: string, text: EditorialText | undefined) => {
    if (text) found.push({ path, text });
  };

  add("hero.eyebrow", page.hero.eyebrow);
  add("hero.heading", page.hero.heading);
  page.hero.paragraphs.forEach((t, i) => add(`hero.paragraphs[${i}]`, t));
  add("hero.primaryCta.label", page.hero.primaryCta.label);
  add("hero.secondaryCta.label", page.hero.secondaryCta.label);

  add("vision.eyebrow", page.vision.eyebrow);
  add("vision.heading", page.vision.heading);
  page.vision.paragraphs.forEach((t, i) => add(`vision.paragraphs[${i}]`, t));

  add("offering.eyebrow", page.offering.eyebrow);
  page.offering.items.forEach((item, i) => add(`offering.items[${i}].body`, item.body));

  add("featuredPortfolio.heading", page.featuredPortfolio.heading);
  add("featuredPortfolio.intro", page.featuredPortfolio.intro);
  add("featuredPortfolio.ctaLabel", page.featuredPortfolio.ctaLabel);

  add("contact.heading", page.contact.heading);
  page.contact.paragraphs.forEach((t, i) => add(`contact.paragraphs[${i}]`, t));
  add("contact.primaryCta.label", page.contact.primaryCta.label);

  return found;
}

/** The same walk as `collectEditorialText`, for the fund page (§8.11). */
function collectFundEditorialText(page: FundPage): Array<{ path: string; text: EditorialText }> {
  const found: Array<{ path: string; text: EditorialText }> = [];
  const add = (path: string, text: EditorialText | undefined) => {
    if (text) found.push({ path: `fund.${path}`, text });
  };
  add("hero.heading", page.hero.heading);
  add("hero.intro", page.hero.intro);
  add("factsHeading", page.factsHeading);
  add("model.heading", page.model.heading);
  add("model.body", page.model.body);
  page.model.steps.forEach((step, i) => {
    add(`model.steps[${i}].title`, step.title);
    add(`model.steps[${i}].body`, step.body);
  });
  add("contact.heading", page.contact.heading);
  add("contact.body", page.contact.body);
  return found;
}

export async function buildIntegrityReport(): Promise<IntegrityReport> {
  const policy = PRODUCTION_POLICY;
  const [settings, home, fund, companies, teamMembers] = await Promise.all([
    rawContent.siteSettings(),
    rawContent.homePage(),
    rawContent.fundPage(),
    rawContent.companies(),
    rawContent.teamMembers(),
  ]);

  const blocks: PolicyBlock[] = [];
  const placeholderImages: IntegrityReport["placeholderImages"] = [];
  const seenImages = new Set<string>();

  const notePlaceholder = (image: ImageAsset | undefined) => {
    if (!image?.isPlaceholder || seenImages.has(image.id)) return;
    seenImages.add(image.id);
    placeholderImages.push({ id: image.id, src: image.src, caption: image.caption });
  };

  /* ------------------------------------------------------------ Companies */

  for (const company of companies) {
    if (company.publicationStatus !== "published") {
      blocks.push({
        recordType: "company",
        recordId: company.slug,
        field: "publicationStatus",
        reason: `is "${company.publicationStatus}", needs "published"`,
      });
    }
    for (const field of COMPANY_CORE_IDENTITY_FIELDS) {
      if (canPublishCompanyField(company, field, policy)) continue;
      blocks.push({
        recordType: "company",
        recordId: company.slug,
        field,
        reason: `evidence is "${company.fieldEvidence[field]?.status ?? "missing"}"${
          company.fieldEvidence[field]?.note ? ` — ${company.fieldEvidence[field]?.note}` : ""
        }`,
      });
    }
    // Detail-only requirements are reported separately: a company can legitimately
    // ship as a sparse card without them.
    for (const field of COMPANY_DETAIL_REQUIRED_FIELDS) {
      if (canPublishCompanyField(company, field, policy)) continue;
      blocks.push({
        recordType: "company",
        recordId: company.slug,
        field: `${field} (detail route only)`,
        reason: `evidence is "${company.fieldEvidence[field]?.status ?? "missing"}"`,
      });
    }
    notePlaceholder(company.logo);
    notePlaceholder(company.cardImage);
    notePlaceholder(company.heroImage);
  }

  /* ---------------------------------------------------------- Team members */

  for (const member of teamMembers) {
    if (member.publicationStatus !== "published") {
      blocks.push({
        recordType: "teamMember",
        recordId: member.slug,
        field: "publicationStatus",
        reason: `is "${member.publicationStatus}", needs "published"`,
      });
    }
    for (const field of ["name", "role"] as const) {
      if (canPublishTeamField(member, field, policy)) continue;
      blocks.push({
        recordType: "teamMember",
        recordId: member.slug,
        field,
        reason: `evidence is "${member.fieldEvidence[field]?.status ?? "missing"}"`,
      });
    }
    notePlaceholder(member.portrait);
  }

  /* ----------------------------------------------------------- Site-level */

  for (const [field, evidence] of Object.entries(settings.fieldEvidence)) {
    if (isOwnerApproved(evidence)) continue;
    blocks.push({
      recordType: "siteSettings",
      recordId: "siteSettings",
      field,
      reason: `evidence is "${evidence?.status ?? "missing"}"${evidence?.note ? ` — ${evidence.note}` : ""}`,
    });
  }

  for (const criterion of settings.investmentCriteria) {
    if (isOwnerApproved(criterion.evidence)) continue;
    blocks.push({
      recordType: "siteSettings",
      recordId: "investmentCriteria",
      field: criterion.label,
      reason: `evidence is "${criterion.evidence.status}"${
        criterion.editorialNote ? ` — ${criterion.editorialNote}` : ""
      }`,
    });
  }

  /* ------------------------------------------- Home and fund page copy */

  const unapprovedCopy = [...collectEditorialText(home), ...collectFundEditorialText(fund)]
    .filter(({ text }) => text.approvalStatus !== "approved")
    .map(({ path, text }) => ({
      path,
      origin: text.origin,
      excerpt: excerpt(text.value),
    }));

  if (home.publicationStatus !== "published") {
    blocks.push({
      recordType: "homePage",
      recordId: "homePage",
      field: "publicationStatus",
      reason: `is "${home.publicationStatus}", needs "published"`,
    });
  }

  notePlaceholder(home.hero.image);
  home.offering.images?.forEach(notePlaceholder);
  notePlaceholder(settings.defaultOgImage);

  return {
    blocks,
    placeholderImages,
    unapprovedCopy,
    summary: {
      companies: {
        total: companies.length,
        listable: companies.filter((c) => canListCompanyPublicly(c, policy)).length,
        withDetail: companies.filter((c) => canPublishCompanyDetail(c, policy)).length,
      },
      teamMembers: {
        total: teamMembers.length,
        listable: teamMembers.filter((m) => canListTeamMemberPublicly(m, policy)).length,
        withDetail: teamMembers.filter((m) => canPublishTeamDetail(m, policy)).length,
      },
      investmentCriteria: {
        total: settings.investmentCriteria.length,
        approved: settings.investmentCriteria.filter((c) => isOwnerApproved(c.evidence)).length,
      },
    },
  };
}

/** Human-readable rendering, used by CI output and the content-gaps doc. */
export function formatIntegrityReport(report: IntegrityReport): string {
  const lines: string[] = [];
  const { summary } = report;

  lines.push("Content integrity report (production policy)");
  lines.push("");
  lines.push(
    `  companies          ${summary.companies.listable}/${summary.companies.total} listable, ${summary.companies.withDetail} with a detail route`,
  );
  lines.push(
    `  team members       ${summary.teamMembers.listable}/${summary.teamMembers.total} listable, ${summary.teamMembers.withDetail} with a profile`,
  );
  lines.push(
    `  criteria approved  ${summary.investmentCriteria.approved}/${summary.investmentCriteria.total}`,
  );

  if (report.blocks.length > 0) {
    lines.push("", `Blocking fields (${report.blocks.length}):`);
    const byRecord = new Map<string, PolicyBlock[]>();
    for (const block of report.blocks) {
      const key = `${block.recordType}:${block.recordId}`;
      byRecord.set(key, [...(byRecord.get(key) ?? []), block]);
    }
    for (const [key, group] of byRecord) {
      lines.push(`  ${key}`);
      for (const block of group) lines.push(`    - ${block.field}: ${block.reason}`);
    }
  }

  if (report.unapprovedCopy.length > 0) {
    lines.push("", `Unapproved copy (${report.unapprovedCopy.length}):`);
    for (const item of report.unapprovedCopy) {
      lines.push(`  - ${item.path} [${item.origin}] "${item.excerpt}"`);
    }
  }

  if (report.placeholderImages.length > 0) {
    lines.push("", `Placeholder artwork still in use (${report.placeholderImages.length}):`);
    for (const image of report.placeholderImages) {
      lines.push(`  - ${image.id} (${image.src})`);
    }
  }

  return lines.join("\n");
}
