/**
 * §26.1 — the URL-synced filter engine.
 *
 * The engine is the single place the archive's query-string contract lives, so
 * these tests are written against the contract in `docs/build-contract.md`
 * rather than against the implementation: repeated params (never comma lists),
 * fixed group order, alphabetical values inside a group, unknown keys/values
 * dropped, duplicates deduped, "All" expressed by absence, and exactly one
 * legacy alias expansion.
 */

import { describe, expect, it } from "vitest";
import {
  clearAll,
  clearGroup,
  countSelected,
  filtersToHref,
  isEmptyState,
  matchesFilters,
  parseFilters,
  serializeFilters,
  toggleValue,
  type FilterSchema,
} from "@/lib/filters/engine";
import {
  COMPANY_STATUS_VALUES,
  buildCompanyFilterSchema,
  buildNetworkFilterSchema,
} from "@/lib/filters/schemas";

/**
 * The company schema as it exists once real taxonomy has been approved. The
 * vocabulary is data-driven in production (`getCompanyFacets`), so the test
 * builds it the same way the archive route does instead of hardcoding a shape
 * the engine would never see.
 */
const SCHEMA: FilterSchema = buildCompanyFilterSchema({
  stage: ["seed", "pre-seed"],
  sector: ["healthtech", "ai-infrastructure"],
  focus: ["b2b", "b2c"],
  status: [...COMPANY_STATUS_VALUES],
});

const NETWORK_SCHEMA: FilterSchema = buildNetworkFilterSchema({
  vertical: ["b2b-software", "consumer"],
  expertise: ["go-to-market", "hiring"],
});

describe("parseFilters", () => {
  it("parses a single value", () => {
    const result = parseFilters(SCHEMA, new URLSearchParams("focus=b2b"));

    expect(result.state).toEqual({ focus: ["b2b"] });
    expect(result.canonicalQuery).toBe("focus=b2b");
    expect(result.didNormalize).toBe(false);
  });

  it("keeps several values from one group as an OR set", () => {
    const result = parseFilters(SCHEMA, new URLSearchParams("status=active&status=exited"));

    expect(result.state).toEqual({ status: ["active", "exited"] });
    expect(countSelected(result.state)).toBe(2);
  });

  it("keeps values from different groups as separate AND groups", () => {
    const result = parseFilters(
      SCHEMA,
      new URLSearchParams("focus=b2b&stage=pre-seed&status=active"),
    );

    expect(result.state).toEqual({
      stage: ["pre-seed"],
      focus: ["b2b"],
      status: ["active"],
    });
  });

  it("accepts Next.js searchParams objects as well as URLSearchParams", () => {
    const result = parseFilters(SCHEMA, {
      focus: ["b2b", "b2c"],
      status: "active",
      // `undefined` is what Next hands over for an absent param.
      stage: undefined,
    });

    expect(result.state).toEqual({ focus: ["b2b", "b2c"], status: ["active"] });
  });

  it("drops unknown keys and unknown values instead of preserving them", () => {
    const result = parseFilters(
      SCHEMA,
      new URLSearchParams("colour=blue&focus=b2b&status=nonsense&stage="),
    );

    expect(result.state).toEqual({ focus: ["b2b"] });
    expect(result.canonicalQuery).toBe("focus=b2b");
    // The incoming URL carried junk, so the client must normalise it once.
    expect(result.didNormalize).toBe(true);
  });

  it("dedupes repeated values and normalises case and padding", () => {
    const result = parseFilters(
      SCHEMA,
      new URLSearchParams("focus=b2b&focus=B2B&focus=%20b2b%20&focus=b2c"),
    );

    expect(result.state).toEqual({ focus: ["b2b", "b2c"] });
    expect(result.canonicalQuery).toBe("focus=b2b&focus=b2c");
  });

  it("treats an absent parameter as 'All'", () => {
    const result = parseFilters(SCHEMA, new URLSearchParams(""));

    expect(result.state).toEqual({});
    expect(isEmptyState(result.state)).toBe(true);
    expect(result.canonicalQuery).toBe("");
    expect(result.didNormalize).toBe(false);
  });

  it("keeps only one value for a radio group", () => {
    const result = parseFilters(
      NETWORK_SCHEMA,
      new URLSearchParams("vertical=consumer&vertical=b2b-software&expertise=hiring"),
    );

    expect(result.state.vertical).toEqual(["consumer"]);
    expect(result.state.expertise).toEqual(["hiring"]);
    expect(result.didNormalize).toBe(true);
  });

  it("expands the legacy status=exit-realized alias and reports the normalisation", () => {
    const result = parseFilters(SCHEMA, new URLSearchParams("status=exit-realized"));

    expect(result.state).toEqual({ status: ["exited", "realized"] });
    expect(result.canonicalQuery).toBe("status=exited&status=realized");
    expect(result.didNormalize).toBe(true);
  });

  it("reports didNormalize=false for an already canonical URL", () => {
    // Canonical form: schema group order (stage, sector, focus, status), then
    // alphabetical values inside each group, as repeated keys.
    const canonical = "stage=pre-seed&sector=healthtech&focus=b2b&status=active&status=exited";
    const result = parseFilters(SCHEMA, new URLSearchParams(canonical));

    expect(result.canonicalQuery).toBe(canonical);
    expect(result.didNormalize).toBe(false);
  });

  it("reports didNormalize=true when the same selection arrives out of order", () => {
    const result = parseFilters(SCHEMA, new URLSearchParams("status=active&focus=b2b"));

    expect(result.canonicalQuery).toBe("focus=b2b&status=active");
    expect(result.didNormalize).toBe(true);
  });
});

describe("serializeFilters", () => {
  it("emits fixed group order, alphabetical values and repeated keys", () => {
    const query = serializeFilters(SCHEMA, {
      status: ["realized", "active"],
      focus: ["b2c", "b2b"],
      stage: ["seed", "pre-seed"],
    });

    expect(query).toBe(
      "stage=pre-seed&stage=seed&focus=b2b&focus=b2c&status=active&status=realized",
    );
    // Repeated keys, never a comma list.
    expect(query).not.toContain(",");
    expect(query.split("focus=")).toHaveLength(3);
  });

  it("omits empty groups so 'All' is the absence of a parameter", () => {
    expect(serializeFilters(SCHEMA, { focus: [], status: ["active"] })).toBe("status=active");
    expect(serializeFilters(SCHEMA, {})).toBe("");
  });

  it("drops values that are not in the group's vocabulary", () => {
    expect(serializeFilters(SCHEMA, { status: ["active", "inactive"] })).toBe("status=active");
  });

  it("never emits more than one value for a radio group", () => {
    expect(serializeFilters(NETWORK_SCHEMA, { vertical: ["consumer", "b2b-software"] })).toBe(
      "vertical=b2b-software",
    );
  });

  it("round-trips a parsed state back to the same canonical query", () => {
    const parsed = parseFilters(SCHEMA, new URLSearchParams("status=exit-realized&focus=b2b"));
    expect(serializeFilters(SCHEMA, parsed.state)).toBe(parsed.canonicalQuery);
  });
});

describe("toggleValue", () => {
  it("adds and removes a checkbox value", () => {
    const added = toggleValue(SCHEMA, {}, "focus", "b2b");
    expect(added).toEqual({ focus: ["b2b"] });

    const removed = toggleValue(SCHEMA, added, "focus", "b2b");
    // The group is deleted rather than left as an empty array, so "All" and
    // "nothing selected in this group" are the same state.
    expect(removed).toEqual({});
    expect("focus" in removed).toBe(false);
  });

  it("replaces the value of a radio group and toggles it off when re-selected", () => {
    const first = toggleValue(NETWORK_SCHEMA, {}, "vertical", "consumer");
    expect(first.vertical).toEqual(["consumer"]);

    const swapped = toggleValue(NETWORK_SCHEMA, first, "vertical", "b2b-software");
    expect(swapped.vertical).toEqual(["b2b-software"]);

    const cleared = toggleValue(NETWORK_SCHEMA, swapped, "vertical", "b2b-software");
    expect(cleared.vertical).toBeUndefined();
  });

  it("ignores an unknown group or value", () => {
    const state = { focus: ["b2b"] };
    expect(toggleValue(SCHEMA, state, "colour", "blue")).toBe(state);
    expect(toggleValue(SCHEMA, state, "status", "made-up")).toBe(state);
  });

  it("does not mutate the state it was given", () => {
    const state = { focus: ["b2b"] };
    toggleValue(SCHEMA, state, "focus", "b2c");
    expect(state).toEqual({ focus: ["b2b"] });
  });
});

describe("clearGroup / clearAll", () => {
  const state = { stage: ["pre-seed"], focus: ["b2b", "b2c"], status: ["active"] };

  it("clears exactly one group and leaves the others untouched", () => {
    const next = clearGroup(state, "focus");

    expect(next).toEqual({ stage: ["pre-seed"], status: ["active"] });
    expect(serializeFilters(SCHEMA, next)).toBe("stage=pre-seed&status=active");
    // The original is untouched — every mutation returns a new object.
    expect(state.focus).toEqual(["b2b", "b2c"]);
  });

  it("clears everything", () => {
    const next = clearAll();

    expect(next).toEqual({});
    expect(countSelected(next)).toBe(0);
    expect(serializeFilters(SCHEMA, next)).toBe("");
  });
});

describe("matchesFilters", () => {
  const record = {
    stage: ["pre-seed"],
    sector: ["ai-infrastructure"],
    focus: ["b2b"],
    status: ["active"],
  };

  it("matches everything when nothing is selected", () => {
    expect(matchesFilters({}, record)).toBe(true);
  });

  it("ORs values inside one group", () => {
    expect(matchesFilters({ status: ["active", "exited"] }, record)).toBe(true);
    expect(matchesFilters({ status: ["exited", "realized"] }, record)).toBe(false);
  });

  it("ANDs across groups", () => {
    expect(matchesFilters({ focus: ["b2b"], status: ["active"] }, record)).toBe(true);
    // Every group must match: a record that satisfies only one of two fails.
    expect(matchesFilters({ focus: ["b2b"], status: ["exited"] }, record)).toBe(false);
  });

  it("matches a record with several values in one group", () => {
    const multi = { focus: ["b2b", "b2c"] };
    expect(matchesFilters({ focus: ["b2c"] }, multi)).toBe(true);
  });

  it("fails a group the record has no value for at all", () => {
    expect(matchesFilters({ stage: ["seed"] }, { stage: [] })).toBe(false);
    expect(matchesFilters({ stage: ["seed"] }, {})).toBe(false);
  });

  it("ignores a group that is present but empty", () => {
    expect(matchesFilters({ stage: [] }, { stage: [] })).toBe(true);
  });
});

describe("filtersToHref", () => {
  it("returns the bare pathname when nothing is selected", () => {
    expect(filtersToHref("/portfolio", SCHEMA, {})).toBe("/portfolio");
  });

  it("appends the canonical query string", () => {
    expect(filtersToHref("/portfolio", SCHEMA, { focus: ["b2c", "b2b"] })).toBe(
      "/portfolio?focus=b2b&focus=b2c",
    );
  });

  it("produces the href that removes one value, for a filter chip", () => {
    const state = { focus: ["b2b", "b2c"], status: ["active"] };
    const href = filtersToHref("/portfolio", SCHEMA, toggleValue(SCHEMA, state, "focus", "b2b"));

    expect(href).toBe("/portfolio?focus=b2c&status=active");
  });
});
