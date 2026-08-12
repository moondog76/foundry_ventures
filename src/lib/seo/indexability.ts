import "server-only";

/**
 * Whether this deployment may be indexed.
 *
 * §2.9 defect 7: the Railway preview host returned `index, follow`. The old
 * check was `NODE_ENV !== "production"`, which is exactly wrong for a hosted
 * preview — Railway builds and runs with `NODE_ENV=production`, so staging
 * looked like production to every crawler while serving draft legal copy.
 *
 * The fix inverts the default. Indexing is **opt-in**, gated on an explicit
 * environment variable that only the real production deployment sets. A new
 * preview environment, a branch deploy, a colleague's fork and a local
 * production build are all `noindex` without anyone remembering to configure
 * them — the failure mode is "not indexed yet", which is recoverable, rather
 * than "staging outranks production", which is not.
 *
 * §12.4 and §12.5 ask for two layers, and both read this one function:
 *   - `X-Robots-Tag: noindex, nofollow` from `src/proxy.ts`, which also covers
 *     non-HTML responses that carry no meta tag;
 *   - `robots` metadata per route, plus a `Disallow: /` robots.txt.
 */
export function isIndexableDeployment(): boolean {
  return process.env.FOUNDRY_INDEXABLE === "1";
}

/**
 * The same decision, for code that cannot import `server-only` — the proxy runs
 * in a different module graph. Kept as one exported constant name so a search
 * for `FOUNDRY_INDEXABLE` finds every reader.
 */
export const INDEXABLE_ENV_VAR = "FOUNDRY_INDEXABLE";
