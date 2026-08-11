/**
 * Deterministic labels for the Network surfaces (§14).
 *
 * Nothing here is marketing copy: the group labels are the display form of the
 * `NetworkPerson.group` enum in the domain model, and the pluralisation helper
 * only ever describes a number the page actually rendered.
 */

import type { NetworkPerson } from "@/content/types";

/** The archive's own name. Matches `SiteSettings.navigation` and the breadcrumb. */
export const NETWORK_TITLE = "Network";

export const NETWORK_PATH = "/network";

/** Fixed display order: the closest working relationships first. */
export const NETWORK_GROUP_ORDER: ReadonlyArray<NetworkPerson["group"]> = [
  "operating-partner",
  "advisor",
  "angel-network",
];

export const NETWORK_GROUP_LABELS: Record<NetworkPerson["group"], string> = {
  "operating-partner": "Operating partners",
  advisor: "Advisors",
  "angel-network": "Angel network",
};

/** Singular/plural noun used by the shared filter UI and the empty states. */
export const PERSON_NOUN = { one: "person", other: "people" } as const;

export function personCountLabel(count: number): string {
  return `${count} ${count === 1 ? PERSON_NOUN.one : PERSON_NOUN.other}`;
}
