/**
 * Policy-mode resolution.
 *
 * `preview` renders unapproved records behind a banner and `noindex`;
 * `production` renders only owner-approved fields (§6.4, §16.8).
 *
 * Resolution order:
 *   1. `FOUNDRY_POLICY_MODE` — explicit override, used by CI and the deploy gate.
 *   2. Next.js draft mode cookie — an editor previewing unpublished content.
 *   3. `NODE_ENV` — development and test default to preview so the whole site is
 *      reviewable locally; a production runtime defaults to production.
 */

import { cache } from "react";
import { PREVIEW_POLICY, PRODUCTION_POLICY, type PolicyContext } from "./policy";

export function policyModeFromEnv(): PolicyContext | null {
  const mode = process.env.FOUNDRY_POLICY_MODE;
  if (mode === "production") return PRODUCTION_POLICY;
  if (mode === "preview") return PREVIEW_POLICY;
  return null;
}

/**
 * Reads draft mode when a request context exists. `draftMode()` throws outside
 * one (sitemap generation, static metadata), which is treated as "not preview".
 */
async function isDraftModeEnabled(): Promise<boolean> {
  try {
    const { draftMode } = await import("next/headers");
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

export const resolvePolicyContext = cache(async (): Promise<PolicyContext> => {
  const override = policyModeFromEnv();
  if (override) return override;
  if (await isDraftModeEnabled()) return PREVIEW_POLICY;
  return process.env.NODE_ENV === "production" ? PRODUCTION_POLICY : PREVIEW_POLICY;
});

/**
 * Sitemap, robots and canonical metadata always answer for the public site,
 * never for the previewing editor (§21.4).
 */
export function publicPolicyContext(): PolicyContext {
  return PRODUCTION_POLICY;
}
