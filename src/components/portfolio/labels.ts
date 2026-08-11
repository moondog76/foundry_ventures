/**
 * Deterministic labels for the portfolio surfaces.
 *
 * Nothing here is marketing copy: `STATUS_LABELS` mirrors the same titles the
 * content layer already uses for the status facet (`getCompanyFacets`), and the
 * pluralisation helper only ever describes a number the page actually rendered.
 */

import type { CompanyStatus } from "@/content/types";

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  active: "Active",
  exited: "Exited",
  realized: "Realized",
  // Internal lifecycle state — only reachable in preview, where showing the real
  // state is more honest than hiding it (§8.2).
  inactive: "Inactive",
};

export function companyCountLabel(count: number): string {
  return `${count} ${count === 1 ? "company" : "companies"}`;
}
