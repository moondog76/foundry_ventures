/**
 * Shared open-redirect guard for the draft-mode endpoints (§23).
 *
 * Both `/api/draft/enable` and `/api/draft/disable` take a `?redirect=` so an
 * editor lands back where they were. That parameter is attacker-controllable —
 * the enable link is pasted into Slack, forwarded and bookmarked — so it is the
 * one place on this site where a redirect target comes from the request. It
 * lives in a single module because two copies of a security check are two
 * chances for one of them to drift.
 *
 * The rule: only a *path-absolute, same-origin* reference is accepted, and it
 * is rebuilt from the parsed components rather than echoed back. Everything
 * else is rejected outright:
 *
 *   //evil.example        → protocol-relative; the URL parser resolves it to a
 *                           different origin, so the origin check catches it
 *   /\evil.example        → browsers normalise `\` to `/` for http(s); the
 *                           parser does too, so it also lands on a new origin
 *   https://evil.example  → absolute, different origin
 *   javascript:alert(1)   → not path-absolute, and never an origin of ours
 *   /foo\nbar             → control characters are stripped by the parser, so
 *                           nothing reaches the `Location` header that could
 *                           split it
 *
 * `/api/*` is refused as well. Preview exists to look at pages; bouncing the
 * freshly issued cookie straight back into the endpoint that issued it has no
 * legitimate use and makes the enable link a redirect chain primitive.
 */

/**
 * Any origin works as the resolution base — it is compared against itself and
 * never appears in the result. `.invalid` is reserved by RFC 2606 and can never
 * be a real host, which makes an accidental leak inert.
 */
const RESOLUTION_BASE = "http://draft.invalid";

/** Where preview starts and ends when no target is given. */
export const DEFAULT_REDIRECT_PATH = "/";

/**
 * Returns a safe same-origin path, or `null` when the value cannot be trusted.
 * An absent or empty parameter is not an error — it means "the home page".
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return DEFAULT_REDIRECT_PATH;
  const value = raw.trim();
  if (value === "") return DEFAULT_REDIRECT_PATH;

  // Cheap structural rejects first, so the parser is never asked to interpret
  // something we already know is not a path.
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;

  let parsed: URL;
  try {
    parsed = new URL(value, RESOLUTION_BASE);
  } catch {
    return null;
  }

  // The authoritative check: anything that moved the origin is not our path.
  if (parsed.origin !== RESOLUTION_BASE) return null;
  if (parsed.pathname.startsWith("/api/")) return null;

  // Rebuilt from parsed components, so the value that reaches `Location` is
  // normalised and percent-encoded rather than passed through.
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
