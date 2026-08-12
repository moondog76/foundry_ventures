/**
 * Team seed data.
 *
 * Source: Appendix C.2 — the frozen 2026-08-10 live snapshot. Portraits, long
 * bios, personal LinkedIn URLs and precise areas of responsibility do not exist
 * on the live site, so they are absent and marked `unverified` (§10.1).
 *
 * Julia's phone number is not published live and is not invented (§C.6).
 * The live contact block renders plain text; the rebuild makes verified values
 * semantically clickable (§C.2).
 */

import type { TeamMember } from "../types";
import { FOUNDRY_HOME_SOURCE, ownerApprovedFromLive, unverified } from "./evidence";

export const SEED_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "team-anders-nygren",
    name: "Anders Nygren",
    slug: "anders-nygren",
    role: "Partner",
    publicationStatus: "published",
    verificationStatus: "partially-verified",
    fieldEvidence: {
      name: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      role: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      email: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      phone: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      portrait: unverified("No portrait published on the live site"),
      shortBio: unverified("No bio published on the live site"),
      longBio: unverified("No bio published on the live site"),
      expertise: unverified("Not published on the live site"),
      linkedinUrl: unverified("No personal LinkedIn URL published on the live site"),
    },
    email: "anders.nygren@foundryventures.ai",
    /*
     * §12.7: a personal telephone number is only public if deliberately
     * approved for public use. This one is on the live site today, so it is
     * migrated rather than introduced — but it is a mobile number, and the
     * decision to keep publishing it is flagged in `docs/content-gaps.md` §C.
     */
    phone: "+46 733 460006",
    ownsInvestmentDecision: true,
    active: true,
    sortOrder: 10,
  },
  {
    id: "team-julia-siljehag",
    name: "Julia Siljehag",
    slug: "julia-siljehag",
    role: "Community Manager",
    publicationStatus: "published",
    verificationStatus: "partially-verified",
    fieldEvidence: {
      name: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      role: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      email: ownerApprovedFromLive(FOUNDRY_HOME_SOURCE),
      phone: unverified("No phone number published on the live site — must not be invented"),
      portrait: unverified("No portrait published on the live site"),
      shortBio: unverified("No bio published on the live site"),
      longBio: unverified("No bio published on the live site"),
      expertise: unverified("Not published on the live site"),
      linkedinUrl: unverified("No personal LinkedIn URL published on the live site"),
    },
    email: "julia.siljehag@foundryventures.ai",
    // Community, not investment. Kept out of the decision-maker block by
    // record rather than by remembering to exclude her at each render site.
    ownsInvestmentDecision: false,
    active: true,
    sortOrder: 20,
  },
];

export const ANDERS_REF = {
  id: "team-anders-nygren",
  slug: "anders-nygren",
  name: "Anders Nygren",
} as const;

export const JULIA_REF = {
  id: "team-julia-siljehag",
  slug: "julia-siljehag",
  name: "Julia Siljehag",
} as const;
