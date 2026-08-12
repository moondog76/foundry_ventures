/**
 * Edge routing rules: legacy status codes and host normalisation (§15.2).
 *
 * The combination matrix from the spec, in precedence order:
 *
 *   1. `/instructors`, `/pricing`  → HTTP 410 immediately, no host redirect first
 *   2. `/home`                     → 308 to `https://www.foundryventures.ai/`
 *      `/offering`                 → 308 to `https://www.foundryventures.ai/#offering`
 *   3. any other path on HTTP or the apex host
 *                                  → 308 to the same path + query on HTTPS + www
 *   4. canonical HTTPS + www       → normal route response
 *
 * Legacy rules and host normalisation are decided together so no request ever
 * takes two hops. Trailing-slash normalisation folds into the same decision.
 *
 * `notFound()` returns 404 and cannot express 410, so Gone is produced here and
 * asserted by an end-to-end test against the real status code.
 */

import { NextResponse, type NextRequest } from "next/server";

export const CANONICAL_ORIGIN = "https://www.foundryventures.ai";
export const CANONICAL_HOST = "www.foundryventures.ai";
export const APEX_HOST = "foundryventures.ai";

/** Demo pages from the previous Squarespace site with no semantic successor. */
const GONE_PATHS = new Set(["/instructors", "/pricing"]);

/**
 * Migration map for the Squarespace-era URLs (§12.6).
 *
 * Every destination is a route that exists today, checked against §7.1 — a
 * redirect to a 404 is worse than no redirect, because it launders a dead link
 * into a live-looking one. `/instructors` and `/pricing` stay in `GONE_PATHS`
 * above rather than moving here: they were template demo pages with no
 * successor, and §12.6 warns against redirecting every unknown URL somewhere
 * plausible.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  "/home": "/",
  /*
   * §12.6 offers `/fund` or a what-changes anchor. The anchor is the closer
   * match — the old page described what a founder gets, not the fund — but the
   * id stays `#offering` rather than being renamed to match the brief's example
   * URL. It is already a published contract with end-to-end coverage, and
   * breaking a live anchor to match an illustrative map would trade a real
   * inbound link for a cosmetic one.
   */
  "/offering": "/#offering",
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}

function goneResponse(): NextResponse {
  return new NextResponse(GONE_BODY, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-robots-tag": "noindex",
    },
  });
}

export function proxy(request: NextRequest): NextResponse {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);

  // 1. Gone wins outright — never redirect a dead page to a live host first.
  if (GONE_PATHS.has(path)) return goneResponse();

  const enforceHost = process.env.FOUNDRY_ENFORCE_CANONICAL_HOST === "1";
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = (request.headers.get("host") ?? url.host).toLowerCase().split(":")[0];
  const needsHostFix =
    enforceHost && (forwardedProto !== "https" || host === APEX_HOST || host !== CANONICAL_HOST);

  // 2. Legacy path redirects resolve straight to the canonical absolute URL.
  const legacyTarget = LEGACY_REDIRECTS[path];
  if (legacyTarget) {
    const target = new URL(legacyTarget, CANONICAL_ORIGIN);
    // Attribution parameters survive, but only ahead of the fragment.
    for (const [key, value] of url.searchParams) target.searchParams.append(key, value);
    return NextResponse.redirect(target, 308);
  }

  // 3. Everything else on a non-canonical host moves in exactly one hop, with
  //    the path already trailing-slash normalised.
  if (needsHostFix) {
    const target = new URL(path + url.search, CANONICAL_ORIGIN);
    return NextResponse.redirect(target, 308);
  }

  // Trailing slash on the canonical host still needs one normalising hop.
  if (path !== url.pathname) {
    const target = new URL(path + url.search, url.origin);
    return NextResponse.redirect(target, 308);
  }

  // 4. Canonical request — hand off to the route.
  const response = NextResponse.next();

  /*
   * Belt-and-braces `noindex` for every non-production deployment (§12.5).
   *
   * The per-route `robots` metadata already says this, but a header also covers
   * responses that carry no meta tag at all — the sitemap, JSON, redirects and
   * any asset served through this matcher. Both layers read the same env var,
   * so they can never disagree.
   */
  if (process.env.FOUNDRY_INDEXABLE !== "1") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Static assets, image optimisation and metadata files bypass this entirely.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/|fonts/).*)"],
};

/** Minimal branded Gone page. No navigation into content that no longer exists. */
const GONE_BODY = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page removed — Foundry Ventures</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#000; color:#fff; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
         padding:24px; }
  main { max-width:44ch; }
  h1 { font-family:Georgia,"Times New Roman",serif; font-weight:400; font-size:clamp(2rem,6vw,3rem);
       line-height:1.1; letter-spacing:0.01em; margin:0 0 16px; }
  p { color:rgba(255,255,255,.74); line-height:1.5; margin:0 0 24px; }
  a { display:inline-flex; min-height:44px; align-items:center; padding:0 24px; color:#000;
      background:#fff; text-decoration:none; font-weight:500; letter-spacing:.04em; font-size:.9rem; }
  a:focus-visible { outline:2px solid #fff; outline-offset:3px; }
</style>
</head>
<body>
<main>
  <h1>This page has been removed</h1>
  <p>It was part of an old template and has no replacement. Everything current lives on the Foundry Ventures site.</p>
  <a href="${CANONICAL_ORIGIN}/">Go to Foundry Ventures</a>
</main>
</body>
</html>`;
