/**
 * The adapter contract.
 *
 * Spec §4.2: UI components never import the Sanity client. Both adapters return
 * the same normalised domain types, so no component can tell which one is live.
 * Adapters return *raw records* — publishing policy, relation resolution and
 * view-model shaping happen once, above them, in `src/content/index.ts`.
 */

import type {
  AboutPage,
  Company,
  HomePage,
  LegalPage,
  NetworkPerson,
  Post,
  SiteSettings,
  TeamMember,
  Testimonial,
} from "../types";

export type ContentAdapter = {
  readonly name: "local" | "sanity";
  getSiteSettings(): Promise<SiteSettings>;
  getHomePage(): Promise<HomePage>;
  getAboutPage(): Promise<AboutPage>;
  getCompanies(): Promise<Company[]>;
  getTeamMembers(): Promise<TeamMember[]>;
  getPosts(): Promise<Post[]>;
  getTestimonials(): Promise<Testimonial[]>;
  getNetworkPeople(): Promise<NetworkPerson[]>;
  getLegalPages(): Promise<LegalPage[]>;
};
