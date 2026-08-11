/**
 * `POST /api/pitch` — the only way a pitch enters the system (§11.3).
 *
 * This handler is deliberately thin. Validation, anti-spam, rate limiting, the
 * atomic submission + outbox write and delivery all live in `submitPitch`; the
 * route's job is to police the transport and translate one outcome union into
 * one HTTP response.
 *
 * Two rules govern everything below:
 *
 *  1. **Nothing from the body is ever logged or echoed.** Not the pitch, not the
 *     deck or Loom URL, not the email, not even in an error message. A log line
 *     is a copy of personal data in a place with none of the retention controls
 *     the store has (§11.4), and an error that quotes a submitted value turns a
 *     failed request into a reflection gadget.
 *  2. **The body is bounded before it is parsed.** `JSON.parse` on an unbounded
 *     string is a denial-of-service primitive, so the size check happens on the
 *     raw text and on the declared length before anything is interpreted.
 */

import { submitPitch } from "@/lib/pitch/service";
import type { PitchApiMethodNotAllowed, PitchApiResponse } from "@/components/forms/pitch-api";

/** The store writes to the filesystem, so this cannot run on the edge runtime. */
export const runtime = "nodejs";
/** Every submission is a distinct write; nothing here is ever cacheable. */
export const dynamic = "force-dynamic";

/**
 * Comfortably above a full-length pitch (3 000 + 400 characters of prose plus
 * three 2 048-character URLs is under 12 KB) and far below anything that could
 * hurt. Multi-byte characters are counted as bytes, not as JavaScript units.
 */
const MAX_BODY_BYTES = 64 * 1024;

const ALLOWED_METHODS = "POST";

/**
 * One generic refusal for every anti-spam outcome. Naming the check that tripped
 * would tell an author of bots exactly what to change.
 */
const REJECTION_MESSAGE =
  "We could not accept this submission. Please reload the page and try again.";
const SERVER_MESSAGE =
  "We could not save your pitch. Nothing was stored, so please try again in a moment.";

function json(
  body: PitchApiResponse | PitchApiMethodNotAllowed,
  status: number,
  headers: Record<string, string> = {},
): Response {
  // A submission response is per-request by definition and must never be stored
  // by a proxy or a back/forward cache.
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

function methodNotAllowed(): Response {
  return json({ ok: false, kind: "method-not-allowed" }, 405, { allow: ALLOWED_METHODS });
}

function rejected(status: number): Response {
  return json({ ok: false, kind: "rejected", message: REJECTION_MESSAGE }, status);
}

/** `application/json` only — a form-encoded POST here is not our client. */
function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return contentType.split(";")[0].trim().toLowerCase() === "application/json";
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export async function POST(request: Request): Promise<Response> {
  if (!isJsonRequest(request)) return rejected(415);

  // Cheap pre-check on the declared size, before a single byte is buffered.
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return rejected(413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    // A truncated or aborted upload. Nothing to report beyond "it did not work".
    return rejected(400);
  }
  if (byteLength(raw) > MAX_BODY_BYTES) return rejected(413);

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return rejected(400);
  }
  // The schema expects an object; an array or a bare scalar is not a near-miss
  // worth a field-by-field explanation.
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return rejected(400);
  }

  let outcome: Awaited<ReturnType<typeof submitPitch>>;
  try {
    outcome = await submitPitch({ payload, headers: request.headers });
  } catch (error) {
    // The error *name* only. A message can carry a filesystem path or, from a
    // third-party client, a fragment of the request it failed on.
    console.error(
      `[pitch] submission failed unexpectedly: ${error instanceof Error ? error.name : "unknown"}`,
    );
    return json({ ok: false, kind: "server", message: SERVER_MESSAGE }, 500);
  }

  if (outcome.ok) {
    // 201: the submission and its outbox event are on disk. Delivery may still
    // be retrying in the background, but the pitch itself can no longer be lost.
    return json({ ok: true, submissionId: outcome.submissionId }, 201);
  }

  switch (outcome.kind) {
    case "validation":
      // Field messages come from the schema, never from the submitted values.
      return json({ ok: false, kind: "validation", errors: outcome.errors }, 400);

    case "rate-limit": {
      const minutes = Math.max(1, Math.ceil(outcome.retryAfterSeconds / 60));
      return json(
        {
          ok: false,
          kind: "rate-limit",
          retryAfterSeconds: outcome.retryAfterSeconds,
          message: `Too many submissions from this connection. Please try again in about ${minutes} ${
            minutes === 1 ? "minute" : "minutes"
          }.`,
        },
        429,
        { "retry-after": String(outcome.retryAfterSeconds) },
      );
    }

    case "spam":
      return rejected(400);

    case "server":
      // `submitPitch` already decided nothing was persisted; it logs no payload
      // and neither do we.
      console.error("[pitch] submission could not be stored");
      return json({ ok: false, kind: "server", message: SERVER_MESSAGE }, 500);
  }
}

/*
 * Next would answer an unexported method with its own 405, but the `Allow`
 * header and the body shape are part of this endpoint's contract, so they are
 * stated explicitly rather than inherited.
 */
export function GET(): Response {
  return methodNotAllowed();
}
/** A HEAD response must carry no body, so this one states itself in headers only. */
export function HEAD(): Response {
  return new Response(null, {
    status: 405,
    headers: { "cache-control": "no-store", allow: ALLOWED_METHODS },
  });
}
export function PUT(): Response {
  return methodNotAllowed();
}
export function PATCH(): Response {
  return methodNotAllowed();
}
export function DELETE(): Response {
  return methodNotAllowed();
}
export function OPTIONS(): Response {
  return methodNotAllowed();
}
