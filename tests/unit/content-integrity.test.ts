/**
 * §26.1 — the record-level content gate (§16.8).
 *
 * This is the test that turns "the site looks empty" into a named list of
 * records and fields. It walks the real seed with the production policy,
 * asserts the report is well formed, prints the blocking list so CI output is
 * actionable, and — most importantly — asserts the policy is *internally
 * consistent*: no record may be publishable on one surface while its own
 * evidence says it is not approved.
 *
 * It deliberately does not assert that the blocking list is empty. Right now it
 * is not, and that is the honest state of the frozen dataset: approving content
 * is a content-owner decision, not something a test can grant.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __setAdapterForTests, rawContent } from "@/content";
import { buildIntegrityReport, formatIntegrityReport } from "@/content/integrity";
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
} from "@/content/policy";
import { isFixtureModeEnabled } from "@/content/seed/fixtures";

const RECORD_TYPES = new Set([
  "company",
  "teamMember",
  "post",
  "testimonial",
  "networkPerson",
  "siteSettings",
  "homePage",
]);

beforeEach(() => __setAdapterForTests(null));
afterEach(() => __setAdapterForTests(null));

describe("fixture isolation", () => {
  it("does not load the synthetic fixture dataset by default", async () => {
    // Two independent switches are required, and neither may be set outside an
    // end-to-end run. If this ever fails, synthetic records are one deploy away
    // from being published as Foundry content.
    expect(process.env.FOUNDRY_CONTENT_FIXTURE).not.toBe("e2e");
    expect(isFixtureModeEnabled()).toBe(false);

    const [companies, teamMembers] = await Promise.all([
      rawContent.companies(),
      rawContent.teamMembers(),
    ]);

    const ids = [...companies, ...teamMembers].map(
      (record) => record.id,
    );

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id.startsWith("fixture-"), `${id} looks like fixture data`).toBe(false);
    }
  });
});

describe("integrity report", () => {
  it("is well formed", async () => {
    const report = await buildIntegrityReport();

    for (const block of report.blocks) {
      expect(RECORD_TYPES.has(block.recordType)).toBe(true);
      expect(block.recordId).toBeTruthy();
      expect(block.field).toBeTruthy();
      // The reason is what a content owner actually reads, so it must say
      // something — an empty string would make the report useless.
      expect(block.reason.trim().length).toBeGreaterThan(0);
    }

    for (const image of report.placeholderImages) {
      expect(image.id).toBeTruthy();
      expect(image.src).toBeTruthy();
    }

    for (const copy of report.unapprovedCopy) {
      expect(copy.path).toBeTruthy();
      expect(["migrated-verbatim", "proposed"]).toContain(copy.origin);
      expect(copy.excerpt.length).toBeLessThanOrEqual(72);
    }

    const { summary } = report;
    expect(summary.companies.listable).toBeLessThanOrEqual(summary.companies.total);
    expect(summary.companies.withDetail).toBeLessThanOrEqual(summary.companies.listable);
    expect(summary.teamMembers.listable).toBeLessThanOrEqual(summary.teamMembers.total);
    expect(summary.teamMembers.withDetail).toBeLessThanOrEqual(summary.teamMembers.listable);
    expect(summary.investmentCriteria.approved).toBeLessThanOrEqual(
      summary.investmentCriteria.total,
    );
  });

  it("agrees with a direct walk of the seed", async () => {
    const report = await buildIntegrityReport();
    const [companies, teamMembers] = await Promise.all([
      rawContent.companies(),
      rawContent.teamMembers(),
    ]);

    expect(report.summary.companies.total).toBe(companies.length);
    expect(report.summary.companies.listable).toBe(
      companies.filter((c) => canListCompanyPublicly(c, PRODUCTION_POLICY)).length,
    );
    expect(report.summary.teamMembers.total).toBe(teamMembers.length);
  });

  it("names every record that is blocking publication", async () => {
    const report = await buildIntegrityReport();
    const companies = await rawContent.companies();

    // Nothing in the frozen dataset is owner-approved yet, so every company must
    // be accounted for by name rather than silently disappearing from the site.
    expect(report.blocks.length).toBeGreaterThan(0);
    const blockedIds = new Set(
      report.blocks.filter((b) => b.recordType === "company").map((b) => b.recordId),
    );
    for (const company of companies) {
      if (canPublishCompanyDetail(company, PRODUCTION_POLICY)) continue;
      expect(blockedIds.has(company.slug), `${company.slug} is missing from the report`).toBe(true);
    }
  });

  it("prints the blocking list for CI", async () => {
    const report = await buildIntegrityReport();

    const formatted = formatIntegrityReport(report);
    expect(formatted).toContain("Content integrity report (production policy)");

    // Deliberate console output: a launch conversation should be about named
    // gaps, and this is where CI logs them.
    console.log(`\n${formatted}\n`);
  });
});

describe("policy consistency (no record is publishable but unapproved)", () => {
  it("never gives a company a detail route it would not list", async () => {
    const companies = await rawContent.companies();

    for (const company of companies) {
      if (!canPublishCompanyDetail(company, PRODUCTION_POLICY)) continue;
      expect(
        canListCompanyPublicly(company, PRODUCTION_POLICY),
        `${company.slug} has a detail route but is not listable`,
      ).toBe(true);
    }
  });

  it("only lists a company whose identity is genuinely approved", async () => {
    const companies = await rawContent.companies();

    for (const company of companies) {
      if (!canListCompanyPublicly(company, PRODUCTION_POLICY)) continue;
      expect(company.publicationStatus).toBe("published");
      expect(isOwnerApproved(company.fieldEvidence.name)).toBe(true);
      expect(company.status).not.toBe("inactive");
    }
  });

  it("only gives a company a detail route when every required field is approved", async () => {
    const companies = await rawContent.companies();

    for (const company of companies) {
      if (!canPublishCompanyDetail(company, PRODUCTION_POLICY)) continue;
      for (const field of [...COMPANY_CORE_IDENTITY_FIELDS, ...COMPANY_DETAIL_REQUIRED_FIELDS]) {
        expect(
          canPublishCompanyField(company, field, PRODUCTION_POLICY),
          `${company.slug}.${field} is not approved but the detail route exists`,
        ).toBe(true);
      }
      expect(company.body?.length).toBeTruthy();
      expect(company.shortDescription?.trim()).toBeTruthy();
    }
  });

  it("never renders a company field whose own evidence is unapproved", async () => {
    const companies = await rawContent.companies();

    for (const company of companies) {
      for (const [field, evidence] of Object.entries(company.fieldEvidence)) {
        if (isOwnerApproved(evidence)) continue;
        expect(
          canPublishCompanyField(
            company,
            field as (typeof COMPANY_CORE_IDENTITY_FIELDS)[number],
            PRODUCTION_POLICY,
          ),
          `${company.slug}.${field} publishes on "${evidence?.status}" evidence`,
        ).toBe(false);
      }
    }
  });

  it("never gives a team member a profile page they would not be listed on", async () => {
    const members = await rawContent.teamMembers();

    for (const member of members) {
      if (!canPublishTeamDetail(member, PRODUCTION_POLICY)) continue;
      expect(canListTeamMemberPublicly(member, PRODUCTION_POLICY)).toBe(true);
      expect(canPublishTeamField(member, "longBio", PRODUCTION_POLICY)).toBe(true);
      expect(member.longBio?.length).toBeTruthy();
    }
  });

  it("only lists a team member whose name and role are approved and who is active", async () => {
    const members = await rawContent.teamMembers();

    for (const member of members) {
      if (!canListTeamMemberPublicly(member, PRODUCTION_POLICY)) continue;
      expect(member.active).toBe(true);
      expect(member.publicationStatus).toBe("published");
      expect(isOwnerApproved(member.fieldEvidence.name)).toBe(true);
      expect(isOwnerApproved(member.fieldEvidence.role)).toBe(true);
    }
  });
  it("only renders an investment criterion whose evidence is approved", async () => {
    const settings = await rawContent.siteSettings();
    const report = await buildIntegrityReport();

    const approved = settings.investmentCriteria.filter((c) => isOwnerApproved(c.evidence));
    expect(report.summary.investmentCriteria.approved).toBe(approved.length);

    // Every unapproved criterion must be named in the report rather than simply
    // vanishing from the site.
    const reported = new Set(
      report.blocks
        .filter((block) => block.recordId === "investmentCriteria")
        .map((block) => block.field),
    );
    for (const criterion of settings.investmentCriteria) {
      if (isOwnerApproved(criterion.evidence)) continue;
      expect(reported.has(criterion.label), `${criterion.label} is not reported`).toBe(true);
    }
  });
});
