/**
 * `GET /api/draft/disable` — the way out of preview (§6.4).
 *
 * `DraftModeBanner` links here with a plain anchor, which is why this is a GET
 * and why it takes no secret. Three deliberate asymmetries with `enable`:
 *
 *  - **no secret, and no 404 when one is unconfigured.** Leaving preview only
 *    clears the caller's own cookie; it grants nothing. An editor who somehow
 *    holds a stale cookie after the secret was rotated must still be able to
 *    get out, so this route is always available.
 *  - **an invalid `?redirect=` falls back to `/` instead of failing.** Exiting
 *    preview must never be blocked by a bad link — the important part of the
 *    request is the cookie deletion, not the destination.
 *  - **the cookie is cleared before the target is used**, so no failure path
 *    can leave preview enabled.
 *
 * The response is still `noindex` and un-cacheable: a cached redirect out of
 * preview would be harmless, but a cached *anything* on this path is not worth
 * reasoning about.
 */

import { draftMode } from "next/headers";
import { DEFAULT_REDIRECT_PATH, safeRedirectPath } from "../redirect-target";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_HEADERS: Record<string, string> = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

function notFound(): Response {
  return new Response(null, { status: 404, headers: BASE_HEADERS });
}

export async function GET(request: Request): Promise<Response> {
  (await draftMode()).disable();

  const requested = new URL(request.url).searchParams.get("redirect");
  const target = safeRedirectPath(requested) ?? DEFAULT_REDIRECT_PATH;

  // Relative `Location`, resolved by the browser — no `Host` reconstruction.
  // Next merges the draft-mode cookie deletion into this response.
  return new Response(null, {
    status: 307,
    headers: { ...BASE_HEADERS, location: target },
  });
}

/* Every other method is a 404 — this endpoint has exactly one shape. */
export function HEAD(): Response {
  return notFound();
}
export function POST(): Response {
  return notFound();
}
export function PUT(): Response {
  return notFound();
}
export function PATCH(): Response {
  return notFound();
}
export function DELETE(): Response {
  return notFound();
}
export function OPTIONS(): Response {
  return notFound();
}
