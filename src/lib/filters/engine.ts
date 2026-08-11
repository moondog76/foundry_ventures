/**
 * URL-synced filter engine, shared by Portfolio, Insights and Network (§18.1).
 *
 * Contract (§8.2, §12.1, §14):
 *  - The URL is the source of truth.
 *  - Multi-select serialises as **repeated parameters**, never comma lists.
 *  - Group order is fixed; values are sorted alphabetically inside each group.
 *  - "All" is expressed by the parameter being absent.
 *  - Unknown params, unknown values and duplicates are dropped/deduped.
 *  - Legacy aliases expand to canonical values (e.g. `status=exit-realized`
 *    becomes `status=exited&status=realized`).
 *
 * `parse()` reports `didNormalize` so the client can issue exactly one
 * `router.replace(..., { scroll: false })` when — and only when — the incoming
 * URL was not already canonical.
 */

export type FilterControl = "checkbox" | "radio";

export type FilterGroupSchema = {
  /** Query-string key. */
  key: string;
  control: FilterControl;
  /** Canonical slugs accepted for this group, in any order. */
  allowedValues: readonly string[];
  /**
   * Legacy value aliases that expand to one or more canonical values. Used to
   * keep already-shared links working (§8.2).
   */
  aliases?: Readonly<Record<string, readonly string[]>>;
};

/** Group order in the canonical query string. */
export type FilterSchema = readonly FilterGroupSchema[];

/** Selected values per group key. A radio group holds at most one value. */
export type FilterState = Record<string, string[]>;

export type ParsedFilters = {
  state: FilterState;
  /** Canonical query string without a leading "?" — empty when nothing is selected. */
  canonicalQuery: string;
  /** True when the incoming params differed from the canonical form. */
  didNormalize: boolean;
};

/** Anything Next.js may hand us as `searchParams`. */
export type SearchParamsInput =
  URLSearchParams | Record<string, string | string[] | undefined> | undefined | null;

function toEntries(input: SearchParamsInput): Array<[string, string]> {
  if (!input) return [];
  if (input instanceof URLSearchParams) return Array.from(input.entries());
  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) entries.push([key, v]);
    } else {
      entries.push([key, value]);
    }
  }
  return entries;
}

/**
 * Serialise state to the canonical query string: schema group order, then
 * alphabetical values, repeated keys.
 */
export function serializeFilters(schema: FilterSchema, state: FilterState): string {
  const params = new URLSearchParams();
  for (const group of schema) {
    const values = state[group.key];
    if (!values || values.length === 0) continue;
    const canonical = Array.from(new Set(values))
      .filter((v) => group.allowedValues.includes(v))
      .sort((a, b) => a.localeCompare(b, "en"));
    const limited = group.control === "radio" ? canonical.slice(0, 1) : canonical;
    for (const value of limited) params.append(group.key, value);
  }
  return params.toString();
}

/**
 * Parse incoming params into canonical state. Unknown keys and values are
 * dropped rather than preserved, so a hand-edited URL cannot poison the query.
 */
export function parseFilters(schema: FilterSchema, input: SearchParamsInput): ParsedFilters {
  const entries = toEntries(input);
  const state: FilterState = {};
  const byKey = new Map(schema.map((g) => [g.key, g]));

  for (const [key, rawValue] of entries) {
    const group = byKey.get(key);
    if (!group) continue;
    const value = rawValue.trim().toLowerCase();
    if (value === "") continue;

    const expanded = group.aliases?.[value] ?? [value];
    for (const candidate of expanded) {
      if (!group.allowedValues.includes(candidate)) continue;
      const bucket = (state[key] ??= []);
      if (!bucket.includes(candidate)) bucket.push(candidate);
    }
  }

  // A radio group keeps only its first valid value.
  for (const group of schema) {
    if (group.control === "radio" && state[group.key]?.length) {
      state[group.key] = state[group.key].slice(0, 1);
    }
  }

  for (const key of Object.keys(state)) {
    if (state[key].length === 0) delete state[key];
  }

  const canonicalQuery = serializeFilters(schema, state);

  // Compare against the incoming query rendered in submission order so that a
  // reordered-but-equivalent URL still counts as needing normalisation.
  const incoming = new URLSearchParams();
  for (const [key, value] of entries) incoming.append(key, value);

  return {
    state,
    canonicalQuery,
    didNormalize: incoming.toString() !== canonicalQuery,
  };
}

/** Count of selected values across every group — powers the `Filter (N)` label. */
export function countSelected(state: FilterState): number {
  return Object.values(state).reduce((total, values) => total + values.length, 0);
}

export function isEmptyState(state: FilterState): boolean {
  return countSelected(state) === 0;
}

/** Toggle one value, respecting the group's control type. */
export function toggleValue(
  schema: FilterSchema,
  state: FilterState,
  key: string,
  value: string,
): FilterState {
  const group = schema.find((g) => g.key === key);
  if (!group || !group.allowedValues.includes(value)) return state;

  const next: FilterState = { ...state };
  const current = next[key] ?? [];

  if (group.control === "radio") {
    next[key] = current[0] === value ? [] : [value];
  } else {
    next[key] = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  }

  if (next[key].length === 0) delete next[key];
  return next;
}

export function clearGroup(state: FilterState, key: string): FilterState {
  const next = { ...state };
  delete next[key];
  return next;
}

export function clearAll(): FilterState {
  return {};
}

/**
 * OR inside a group, AND between groups (§8.2). A record matches a group when
 * its own value set intersects the selected set.
 */
export function matchesFilters(
  state: FilterState,
  recordValues: Record<string, string[] | undefined>,
): boolean {
  for (const [key, selected] of Object.entries(state)) {
    if (!selected || selected.length === 0) continue;
    const own = recordValues[key] ?? [];
    if (!own.some((value) => selected.includes(value))) return false;
  }
  return true;
}

/** Build a full href from a pathname and filter state. */
export function filtersToHref(pathname: string, schema: FilterSchema, state: FilterState): string {
  const query = serializeFilters(schema, state);
  return query ? `${pathname}?${query}` : pathname;
}
