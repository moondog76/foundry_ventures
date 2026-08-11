/**
 * Network filter facets (§14, §8.2).
 *
 * The content API ships `getCompanyFacets()` and `getPostFacets()` but no
 * network equivalent, so this derives the same shape under the same rules:
 *
 *  - facets are built from *listable* people only, which the route has already
 *    resolved through `getNetworkPeople()`;
 *  - a person's taxonomy only counts when its own evidence clears the policy —
 *    a facet built from unapproved taxonomy would itself be an unapproved claim
 *    (§16.2);
 *  - a group with fewer than two distinct values is dropped entirely: a filter
 *    that cannot narrow anything is noise;
 *  - options are sorted by slug, which is the same alphabetical order the engine
 *    serialises query values in.
 *
 * Vertical is single-select (radio) and Expertise is multi-select (checkbox);
 * that difference is expressed once, here, and the shared filter component reads
 * it from `FacetGroup.control`.
 */

import { canRenderEvidence, type PolicyContext } from "@/content/policy";
import type { FacetGroup, NetworkPerson, TaxonomyRef } from "@/content/types";

type GroupKey = Extract<FacetGroup["key"], "vertical" | "expertise">;

function collect(
  people: NetworkPerson[],
  policy: PolicyContext,
  key: GroupKey,
  legend: string,
  control: FacetGroup["control"],
  pick: (person: NetworkPerson) => TaxonomyRef[],
  evidenceField: "verticals" | "expertise",
): FacetGroup | null {
  const counts = new Map<string, { title: string; count: number }>();

  for (const person of people) {
    if (!canRenderEvidence(person.fieldEvidence[evidenceField], policy)) continue;
    // De-duplicate within one person so a record tagged twice cannot inflate a
    // count above the number of people it actually describes.
    const seen = new Set<string>();
    for (const ref of pick(person)) {
      if (seen.has(ref.slug)) continue;
      seen.add(ref.slug);
      const existing = counts.get(ref.slug);
      if (existing) existing.count += 1;
      else counts.set(ref.slug, { title: ref.title, count: 1 });
    }
  }

  if (counts.size < 2) return null;

  return {
    key,
    legend,
    control,
    options: Array.from(counts.entries())
      .map(([slug, { title, count }]) => ({ slug, title, count }))
      .sort((a, b) => a.slug.localeCompare(b.slug, "en")),
  };
}

export function buildNetworkFacets(people: NetworkPerson[], policy: PolicyContext): FacetGroup[] {
  return [
    collect(people, policy, "vertical", "Vertical", "radio", (p) => p.verticals, "verticals"),
    collect(people, policy, "expertise", "Expertise", "checkbox", (p) => p.expertise, "expertise"),
  ].filter((group): group is FacetGroup => group !== null);
}

/** Slugs actually present in a facet group; an absent group yields no vocabulary. */
export function facetSlugs(facets: FacetGroup[], key: GroupKey): string[] {
  return facets.find((facet) => facet.key === key)?.options.map((option) => option.slug) ?? [];
}
