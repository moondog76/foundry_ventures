/**
 * Local seed adapter.
 *
 * Spec §4.2 / §30: the site must build, test and review with no external
 * credentials. This adapter is the default whenever a Sanity project id and
 * dataset are absent.
 *
 * An optional fixture dataset (`FOUNDRY_CONTENT_FIXTURE=e2e`) exists so end-to-
 * end tests can exercise filters, detail routes and related content against
 * approved-looking records. Fixtures are clearly synthetic, live under
 * `seed/fixtures.ts`, and never load in dev or production.
 */

import type { ContentAdapter } from "./types";
import { SEED_SITE_SETTINGS } from "../seed/site-settings";
import { SEED_HOME_PAGE } from "../seed/home";
import { SEED_FUND_PAGE } from "../seed/fund";
import { SEED_COMPANIES } from "../seed/companies";
import { SEED_TEAM_MEMBERS } from "../seed/team";
import { SEED_LEGAL_PAGES } from "../seed/legal";
import { FIXTURE_DATASET, isFixtureModeEnabled } from "../seed/fixtures";

export const localAdapter: ContentAdapter = {
  name: "local",

  async getSiteSettings() {
    return isFixtureModeEnabled() ? FIXTURE_DATASET.siteSettings : SEED_SITE_SETTINGS;
  },
  async getHomePage() {
    return isFixtureModeEnabled() ? FIXTURE_DATASET.homePage : SEED_HOME_PAGE;
  },
  async getFundPage() {
    return isFixtureModeEnabled() ? FIXTURE_DATASET.fundPage : SEED_FUND_PAGE;
  },
  async getCompanies() {
    return isFixtureModeEnabled() ? FIXTURE_DATASET.companies : SEED_COMPANIES;
  },
  async getTeamMembers() {
    return isFixtureModeEnabled() ? FIXTURE_DATASET.teamMembers : SEED_TEAM_MEMBERS;
  },
  async getLegalPages() {
    return SEED_LEGAL_PAGES;
  },
};
