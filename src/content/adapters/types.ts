/**
 * The adapter contract.
 *
 * Spec §4.2: UI components never import the Sanity client. Both adapters return
 * the same normalised domain types, so no component can tell which one is live.
 * Adapters return *raw records* — publishing policy, relation resolution and
 * view-model shaping happen once, above them, in `src/content/index.ts`.
 *
 * The contract shrank on 2026-08-12 with the route pruning in §7.1. Posts,
 * testimonials, network people and the About page are gone: the public site is
 * `/`, `/portfolio`, `/fund` and `/privacy`, and §17 rules the rest out
 * permanently. Keeping their methods would have left the Sanity adapter running
 * queries against schemas nothing renders.
 */

import type {
  Company,
  FundPage,
  HomePage,
  LegalPage,
  SiteSettings,
  TeamMember,
} from "../types";

export type ContentAdapter = {
  readonly name: "local" | "sanity";
  getSiteSettings(): Promise<SiteSettings>;
  getHomePage(): Promise<HomePage>;
  getFundPage(): Promise<FundPage>;
  getCompanies(): Promise<Company[]>;
  getTeamMembers(): Promise<TeamMember[]>;
  getLegalPages(): Promise<LegalPage[]>;
};
