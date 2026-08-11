/**
 * News & Insights seed.
 *
 * The 2026-08-10 snapshot contains no published Foundry articles or portfolio
 * news, so this list is empty by design. §31.13 forbids inventing content, and
 * §7.8 requires the "Latest Insights" home section to be hidden entirely rather
 * than rendering a public empty state.
 *
 * The `insights` feature flag stays off until real posts exist (§30).
 */

import type { Post } from "../types";

export const SEED_POSTS: Post[] = [];
