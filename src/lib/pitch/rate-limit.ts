/**
 * Request fingerprinting and rate limiting (§11.3, §11.4).
 *
 * A raw IP address is never stored. The address is combined with a
 * per-deployment salt and hashed; only the hash is kept, and only for as long
 * as the sliding window needs it.
 */

import "server-only";
import { createHash } from "node:crypto";

export function fingerprintHash(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Best-effort client address from proxy headers. */
export function clientAddressFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

type Window = { count: number; resetAt: number };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * In-process sliding window. Adequate for a single-instance deployment; a
 * multi-instance production host should point this at a shared store, which is
 * why the interface is kept narrow.
 */
const windows = new Map<string, Window>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number; remaining: number };

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  max: number = MAX_PER_WINDOW,
  windowMs: number = WINDOW_MS,
): RateLimitResult {
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0, remaining: max - existing.count };
}

/** Drops expired windows so fingerprints are not retained beyond their purpose. */
export function pruneRateLimits(now: number = Date.now()): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export function __resetRateLimitsForTests(): void {
  windows.clear();
}
