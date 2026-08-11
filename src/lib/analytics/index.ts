/**
 * Analytics event contract (§24).
 *
 * Hard rule: never send a name, email, deck URL, Loom URL, pitch text or any
 * free-form form input. The event payloads below are the complete allowlist —
 * there is deliberately no generic `track(name, props)` escape hatch.
 *
 * The default adapter is a no-op: no marketing scripts load without explicit
 * consent (§22.4, §30).
 */

export type AnalyticsEvent =
  | { name: "nav_click"; destination: string; placement: "header" | "footer" | "mobile-menu" }
  | { name: "pitch_cta_click"; placement: string }
  | { name: "portfolio_filter_change"; group: string; values_count: number }
  | { name: "company_open"; slug: string; source: string }
  | { name: "external_company_click"; slug: string }
  | { name: "pitch_start" }
  | { name: "pitch_submit_success" }
  | { name: "pitch_submit_error"; category: "validation" | "rate-limit" | "server" | "network" }
  | { name: "insight_open"; slug: string; type: string };

export type AnalyticsAdapter = {
  readonly name: string;
  track(event: AnalyticsEvent): void;
};

export const noopAnalyticsAdapter: AnalyticsAdapter = {
  name: "noop",
  track() {
    /* Intentionally empty — no third-party analytics until consent exists. */
  },
};

let adapter: AnalyticsAdapter = noopAnalyticsAdapter;

export function setAnalyticsAdapter(next: AnalyticsAdapter): void {
  adapter = next;
}

export function track(event: AnalyticsEvent): void {
  try {
    adapter.track(event);
  } catch {
    // Analytics must never break a user interaction.
  }
}
