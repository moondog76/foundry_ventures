/**
 * Feature-flag gate for the flagged P1 routes (§3.4).
 *
 * Insights, About and Network are OFF by default. "Off" has a precise meaning
 * and it is not the same in both policy modes:
 *
 *  - **production** — the route must behave as if it does not exist: `notFound()`
 *    from the page, `HIDDEN_ROUTE_METADATA` from `generateMetadata`, absent from
 *    navigation (already handled by `getSiteSettings`) and from the sitemap
 *    (already handled by the publishable-slug helpers).
 *  - **preview** — the route renders normally, so an editor can review the page
 *    behind the draft banner before the flag is turned on. Preview is always
 *    `noindex` (`buildMetadata` enforces that), so nothing leaks.
 *
 * Both facts a route needs — the resolved policy and whether it must hide — come
 * from one call, so a page and its `generateMetadata` can never disagree about
 * whether the route exists.
 *
 * This module lives in the Insights directory because it is the shared helper of
 * this work package; About and Network import it from here rather than each
 * re-deriving the rule.
 */

import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import type { PolicyContext } from "@/content/policy";
import type { FeatureFlagKey } from "@/content/types";

export type FeatureGate = {
  policy: PolicyContext;
  /** The raw flag value from the content layer. */
  enabled: boolean;
  /**
   * True when the route must behave as if it does not exist. Deliberately not
   * the same as `!enabled`: a disabled route is still fully previewable.
   */
  hidden: boolean;
};

export async function resolveFeatureGate(flag: FeatureFlagKey): Promise<FeatureGate> {
  const policy = await resolvePolicyContext();
  // Read the *unfiltered* flags: `getFeatureFlags()` reads the adapter document
  // directly, so a flag can never be masked by a navigation filter.
  const flags = await getFeatureFlags();
  const enabled = flags[flag];
  return { policy, enabled, hidden: !enabled && policy.mode === "production" };
}

/**
 * Page entry point: 404s a disabled route in production and returns the policy
 * context every downstream content call needs.
 */
export async function requireFeature(flag: FeatureFlagKey): Promise<PolicyContext> {
  const gate = await resolveFeatureGate(flag);
  // `notFound()` is typed `never`, so control never reaches the return below.
  if (gate.hidden) notFound();
  return gate.policy;
}
