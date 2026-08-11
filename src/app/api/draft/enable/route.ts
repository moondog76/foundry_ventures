/**
 * `GET /api/draft/enable` — the only way into preview (§6.4, §23).
 *
 * Preview renders unapproved, unverified and unpublished records (§16.8), so
 * this endpoint is a privileged one and is written like it:
 *
 *  - **404 when `DRAFT_MODE_SECRET` is not configured.** Not 401, not 500 — an
 *    endpoint that cannot be used should not confirm that it exists. This is
 *    the same posture `/api/pitch/maintenance` takes, and it means a deployment
 *    that has not been given the secret has no draft surface at all.
 *  - **The secret is compared in constant time.** Both sides are hashed first
 *    so `timingSafeEqual` always receives two 32-byte buffers; comparing raw
 *    strings of different lengths makes it throw, and that throw is itself a
 *    length oracle.
 *  - **The redirect target is validated before the cookie is issued**, by the
 *    shared guard in `../redirect-target`. A request that fails validation
 *    leaves without a preview cookie.
 *  - **The response is `noindex` and un-cacheable, and sends no referrer.**
 *    `next.config.ts` already sets `X-Robots-Tag` for `/api/draft/:path*`; it
 *    is repeated here so the header does not depend on host configuration. The
 *    `Referrer-Policy` is the one that is easy to miss: the secret is in the
 *    query string, and under the site's default policy a same-origin navigation
 *    would send this full URL — secret included — as the `Referer` of the page
 *    we redirect to, and from there into an access log.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { safeRedirectPath } from "../redirect-target";

/** `node:crypto` requires the Node runtime. */
export const runtime = "nodejs";
/** Issues a cookie against a per-request secret; nothing here is cacheable. */
export const dynamic = "force-dynamic";

const BASE_HEADERS: Record<string, string> = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

function readDraftSecret(): string | null {
  const value = process.env.DRAFT_MODE_SECRET?.trim();
  return value ? value : null;
}

/** 404 with no body: the endpoint does not advertise itself when unconfigured. */
function notFound(): Response {
  return new Response(null, { status: 404, headers: BASE_HEADERS });
}

function secretMatches(presented: string, expected: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  const expected = readDraftSecret();
  if (!expected) return notFound();

  const url = new URL(request.url);
  const presented = url.searchParams.get("secret");
  if (!presented || !secretMatches(presented, expected)) {
    // No `WWW-Authenticate`: this is not an HTTP-auth resource, and prompting
    // for credentials would invite guessing.
    return new Response(null, { status: 401, headers: BASE_HEADERS });
  }

  const target = safeRedirectPath(url.searchParams.get("redirect"));
  if (target === null) {
    // A rejected target is worth surfacing rather than silently rewriting: it
    // is either a mistyped link or an attempt to use preview as a redirector,
    // and quietly sending the editor to "/" would hide both.
    return new Response(null, { status: 400, headers: BASE_HEADERS });
  }

  (await draftMode()).enable();

  // A relative `Location` is valid per RFC 7231 and is resolved by the browser
  // against the current URL — which avoids reconstructing an absolute URL from
  // a possibly proxied `Host`. Next merges the draft-mode `Set-Cookie` into
  // whatever response the handler returns, including this one.
  return new Response(null, {
    status: 307,
    headers: { ...BASE_HEADERS, location: target },
  });
}

/*
 * Every other method answers 404, configured or not — see the note at the top.
 * A 405 with an `Allow` header would confirm the endpoint exists.
 */
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
