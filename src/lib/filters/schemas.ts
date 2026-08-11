/**
 * Concrete filter schemas per archive.
 *
 * Allowed values are the *vocabulary*; which options actually render is decided
 * separately from approved taxonomy data, and a group with fewer than two real
 * values is hidden entirely (§8.2).
 */

import type { FilterSchema } from "./engine";

export const COMPANY_STATUS_VALUES = ["active", "exited", "realized"] as const;

/**
 * `inactive` is an internal lifecycle state: it is deliberately absent from the
 * public vocabulary so it can neither be selected nor shared in a link (§8.2).
 */
export const COMPANY_FILTER_SCHEMA: FilterSchema = [
  { key: "stage", control: "checkbox", allowedValues: [] },
  { key: "sector", control: "checkbox", allowedValues: [] },
  { key: "focus", control: "checkbox", allowedValues: ["b2b", "b2c"] },
  {
    key: "status",
    control: "checkbox",
    allowedValues: COMPANY_STATUS_VALUES,
    // Older shared links used a single combined value (§8.2).
    aliases: { "exit-realized": ["exited", "realized"] },
  },
];

export const POST_FILTER_SCHEMA: FilterSchema = [
  { key: "type", control: "checkbox", allowedValues: ["article", "portfolio-news"] },
];

export const NETWORK_FILTER_SCHEMA: FilterSchema = [
  { key: "vertical", control: "radio", allowedValues: [] },
  { key: "expertise", control: "checkbox", allowedValues: [] },
];

/**
 * Company filter vocabulary is data-driven: stage and sector slugs only exist
 * once approved taxonomy is attached to published companies. This rebuilds the
 * schema with the vocabulary actually present.
 */
export function buildCompanyFilterSchema(vocabulary: {
  stage: string[];
  sector: string[];
  focus: string[];
  status: string[];
}): FilterSchema {
  return [
    { key: "stage", control: "checkbox", allowedValues: [...vocabulary.stage].sort() },
    { key: "sector", control: "checkbox", allowedValues: [...vocabulary.sector].sort() },
    { key: "focus", control: "checkbox", allowedValues: [...vocabulary.focus].sort() },
    {
      key: "status",
      control: "checkbox",
      allowedValues: [...vocabulary.status].sort(),
      aliases: { "exit-realized": ["exited", "realized"] },
    },
  ];
}

export function buildNetworkFilterSchema(vocabulary: {
  vertical: string[];
  expertise: string[];
}): FilterSchema {
  return [
    { key: "vertical", control: "radio", allowedValues: [...vocabulary.vertical].sort() },
    { key: "expertise", control: "checkbox", allowedValues: [...vocabulary.expertise].sort() },
  ];
}
