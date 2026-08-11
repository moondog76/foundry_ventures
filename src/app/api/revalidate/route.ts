/**
 * `POST /api/revalidate` — the CMS webhook that keeps the static site fresh
 * (§4.3, §23).
 *
 * The endpoint has two independent jobs, and both are about refusing things.
 *
 * **1. Authenticate the caller, in constant time.**
 * The signature scheme is Sanity's own, because `SANITY_WEBHOOK_SECRET` is a
 * Sanity secret and a webhook that cannot verify what the CMS actually sends is
 * decorative. The header is
 *
 *     sanity-webhook-signature: t=<epoch-ms>,v1=<base64url HMAC-SHA256>
 *
 * over the string `` `${t}.${rawBody}` ``. Three consequences:
 *
 *   - the body must be read as **raw text** and hashed before it is parsed;
 *     re-serialising parsed JSON would change key order and whitespace and the
 *     signature would never match;
 *   - the timestamp is inside the signed material, so it cannot be edited
 *     without invalidating it — which is what makes the freshness window below
 *     real replay protection rather than a suggestion;
 *   - comparison hashes both sides to a fixed 32 bytes before `timingSafeEqual`,
 *     which throws on unequal lengths and would otherwise leak the digest length.
 *
 * Unconfigured is 404, not 500: a deployment without the secret has no webhook,
 * and should not confirm that one is waiting to be enabled. A bad signature is
 * 401.
 *
 * **2. Revalidate only what the payload can be trusted to name.**
 * The caller sends a document type and a slug. It does **not** send a path, and
 * no path from the request is ever passed to `revalidatePath` — the mapping
 * below is the entire vocabulary of this endpoint. A slug is only ever
 * interpolated after it matches a strict kebab-case pattern, and only under a
 * prefix this file chose. An unrecognised document type revalidates nothing and
 * still answers 200, so a CMS that starts emitting a new type does not enter a
 * webhook retry loop.
 *
 * Not covered, by design: a company rename also appears on the team profile
 * that led the deal and on posts that reference it. Chasing every reverse
 * relation from here would end at "revalidate everything" on every edit; those
 * surfaces settle on their own revalidation interval instead.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getLegalPage } from "@/content";

/** `node:crypto` requires the Node runtime. */
export const runtime = "nodejs";
/** Every call is a distinct cache mutation; nothing here is cacheable. */
export const dynamic = "force-dynamic";

const SIGNATURE_HEADER = "sanity-webhook-signature";

/** Generous for a single document payload, far below anything that could hurt. */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * How far the signed timestamp may be from ours. Five minutes is Sanity's own
 * default: wide enough for clock drift and a retry, narrow enough that a
 * captured request stops being replayable quickly.
 */
const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

/** Content slugs are lowercase kebab-case (§8.2); anything else is not ours. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 128;

/**
 * A Sanity `_type` is a schema identifier. Constraining it before it is echoed
 * in the response or written to a log line closes the only two places where
 * caller-controlled text leaves this handler — a `_type` containing newlines
 * would otherwise be able to forge log entries.
 */
const DOCUMENT_TYPE_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;

const NO_STORE: Record<string, string> = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

/** A path this endpoint is willing to invalidate, and at which granularity. */
type RevalidationTarget = { path: string; scope: "page" | "layout" };

const page = (path: string): RevalidationTarget => ({ path, scope: "page" });
const layout = (path: string): RevalidationTarget => ({ path, scope: "layout" });

function notFound(): Response {
  return new Response(null, { status: 404, headers: NO_STORE });
}

function unauthorized(): Response {
  return new Response(null, { status: 401, headers: NO_STORE });
}

function readWebhookSecret(): string | null {
  const value = process.env.SANITY_WEBHOOK_SECRET?.trim();
  return value ? value : null;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/* ------------------------------------------------------------- Signature */

type ParsedSignature = { timestamp: number; signature: string };

function parseSignatureHeader(value: string | null): ParsedSignature | null {
  if (!value) return null;
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of value.split(",")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    // `slice` rather than `split("=")`: base64url has no "=" but padded base64
    // does, and truncating a signature at the first one would be silent.
    const raw = part.slice(separator + 1).trim();
    if (key === "t") {
      const parsed = Number(raw);
      if (Number.isSafeInteger(parsed) && parsed > 0) timestamp = parsed;
    } else if (key === "v1" && raw !== "") {
      signature = raw;
    }
  }

  if (timestamp === null || signature === null) return null;
  return { timestamp, signature };
}

/** Accepts either base64 or base64url spelling of the same digest. */
function toBase64Url(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signatureMatches(
  rawBody: string,
  { timestamp, signature }: ParsedSignature,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64url");
  // Fixed-length operands so `timingSafeEqual` cannot throw on a crafted length.
  const a = createHash("sha256").update(toBase64Url(signature)).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/* --------------------------------------------------------------- Payload */

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** Sanity sends `slug` as `{ current }`; a projection may flatten it to a string. */
function readSlug(payload: Record<string, unknown>): string | null {
  const raw = payload.slug;
  const value =
    typeof raw === "object" && raw !== null
      ? readString((raw as Record<string, unknown>).current)
      : readString(raw);
  if (!value || value.length > MAX_SLUG_LENGTH) return null;
  return SLUG_PATTERN.test(value) ? value : null;
}

/**
 * The complete vocabulary of this endpoint. Every path is a literal chosen
 * here; the only caller-supplied fragment is a slug that has already matched
 * `SLUG_PATTERN`, and only ever behind a prefix this function picked.
 */
async function resolveTargets(
  documentType: string,
  slug: string | null,
): Promise<RevalidationTarget[]> {
  switch (documentType) {
    case "company": {
      // The home page carries featured companies; the archive carries all of
      // them; the sitemap carries the ones with a publishable detail route.
      const targets = [page("/"), page("/portfolio"), page("/sitemap.xml")];
      if (slug) targets.push(page(`/portfolio/${slug}`));
      return targets;
    }

    case "teamMember": {
      const targets = [page("/"), page("/team"), page("/sitemap.xml")];
      if (slug) targets.push(page(`/team/${slug}`));
      return targets;
    }

    case "post": {
      const targets = [page("/"), page("/insights"), page("/sitemap.xml")];
      if (slug) targets.push(page(`/insights/${slug}`));
      return targets;
    }

    case "testimonial":
      // Testimonials only surface in the home carousel.
      return [page("/")];

    case "networkPerson":
      return [page("/network")];

    case "homePage":
      return [page("/")];

    case "aboutPage":
      return [page("/about")];

    case "legalPage": {
      // A legal page owns a bare top-level path, so the slug alone is not
      // enough authority to build one. It has to name a legal document that
      // actually exists in the content layer.
      if (!slug) return [];
      const legal = await getLegalPage(slug);
      return legal ? [page(`/${slug}`), page("/sitemap.xml")] : [];
    }

    case "siteSettings":
      // Navigation, footer, contact people, feature flags and the canonical
      // origin appear on every page, so the root layout is the honest scope.
      // The metadata routes are listed separately: they are not rendered inside
      // that layout and would otherwise stay stale.
      return [layout("/"), page("/sitemap.xml"), page("/robots.txt"), page("/opengraph-image")];

    default:
      // Unknown to this deployment. Answering 200 with nothing revalidated
      // keeps a new document type from turning into a webhook retry storm.
      return [];
  }
}

/* ----------------------------------------------------------------- Route */

export async function POST(request: Request): Promise<Response> {
  const secret = readWebhookSecret();
  if (!secret) return notFound();

  const parsedSignature = parseSignatureHeader(request.headers.get(SIGNATURE_HEADER));
  if (!parsedSignature) return unauthorized();

  // Freshness is checked before the HMAC so an obviously stale replay costs one
  // subtraction rather than a hash — and after parsing, so the value being
  // checked is the one that was signed.
  if (Math.abs(Date.now() - parsedSignature.timestamp) > SIGNATURE_TOLERANCE_MS) {
    return unauthorized();
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: NO_STORE });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response(null, { status: 400, headers: NO_STORE });
  }
  if (byteLength(rawBody) > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: NO_STORE });
  }

  // Signature first, parsing second. An unauthenticated body is never given to
  // `JSON.parse`.
  if (!signatureMatches(rawBody, parsedSignature, secret)) return unauthorized();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400, headers: NO_STORE });
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return new Response(null, { status: 400, headers: NO_STORE });
  }

  const document = payload as Record<string, unknown>;
  const documentType = readString(document._type);
  if (!documentType || !DOCUMENT_TYPE_PATTERN.test(documentType)) {
    return new Response(null, { status: 400, headers: NO_STORE });
  }

  const targets = await resolveTargets(documentType, readSlug(document));

  try {
    for (const target of targets) {
      revalidatePath(target.path, target.scope);
    }
  } catch (error) {
    // The error name only — a message can carry an internal path.
    console.error(
      `[revalidate] failed for "${documentType}": ${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return Response.json({ ok: false }, { status: 500, headers: NO_STORE });
  }

  return Response.json(
    { ok: true, documentType, revalidated: targets },
    { status: 200, headers: NO_STORE },
  );
}

/*
 * Every other method answers 404, configured or not. A 405 with an `Allow`
 * header would confirm the endpoint exists to anyone probing for it.
 */
export function GET(): Response {
  return notFound();
}
export function HEAD(): Response {
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
