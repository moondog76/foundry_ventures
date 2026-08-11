/**
 * `POST /api/pitch/maintenance` — the scheduled half of the pitch pipeline
 * (§11.3, §11.4).
 *
 * Two jobs, both idempotent and both safe to run on a cron:
 *
 *  - `purgeExpiredSubmissions()` enforces the retention window. Retention that
 *    only exists in a policy document is not retention.
 *  - `processOutbox()` retries notifications that failed at submission time.
 *    Without it a stored pitch could sit unnoticed forever, which is the exact
 *    failure the outbox exists to prevent.
 *
 * Access control is a shared secret compared in constant time. When the secret
 * is not configured the endpoint answers 404 to *every* method, including the
 * ones it does not implement: a 405 with an `Allow` header would confirm the
 * route exists, and an endpoint that is not deployable should not advertise
 * itself while it waits to be.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { readPitchConfig } from "@/lib/pitch/config";
import { createEscalator, getPitchNotifier } from "@/lib/pitch/notifier";
import { processOutbox } from "@/lib/pitch/outbox";
import { purgeExpiredSubmissions } from "@/lib/pitch/service";
import { getPitchStore } from "@/lib/pitch/store";

/** `node:crypto` and the filesystem store both require the Node runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

function notFound(): Response {
  return new Response(null, { status: 404, headers: NO_STORE });
}

function readMaintenanceSecret(): string | null {
  const value = process.env.PITCH_MAINTENANCE_SECRET?.trim();
  return value ? value : null;
}

/** `Authorization: Bearer <secret>`, with a plain header as the cron-friendly alternative. */
function presentedSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization && /^bearer\s+/i.test(authorization)) {
    return authorization.replace(/^bearer\s+/i, "").trim();
  }
  return request.headers.get("x-pitch-maintenance-secret")?.trim() ?? null;
}

/**
 * Both sides are hashed first so `timingSafeEqual` always gets two equal-length
 * buffers — it throws otherwise, and that throw would itself leak the length of
 * the configured secret.
 */
function secretMatches(presented: string, expected: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const expected = readMaintenanceSecret();
  if (!expected) return notFound();

  const presented = presentedSecret(request);
  if (!presented || !secretMatches(presented, expected)) {
    return new Response(null, {
      status: 401,
      headers: { ...NO_STORE, "www-authenticate": "Bearer" },
    });
  }

  try {
    const config = readPitchConfig();
    const store = getPitchStore();
    const notifier = getPitchNotifier();

    const purged = await purgeExpiredSubmissions();
    const delivery = await processOutbox({
      store,
      notifier,
      escalator: createEscalator(config, notifier),
      reviewUrlBase: config.reviewUrlBase,
    });

    // Counts only. Submission ids, addresses and error strings stay server-side.
    return Response.json(
      {
        ok: true,
        purged,
        delivered: delivery.delivered,
        retryScheduled: delivery.failed,
        deadLettered: delivery.deadLettered,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(
      `[pitch] maintenance run failed: ${error instanceof Error ? error.name : "unknown"}`,
    );
    return Response.json({ ok: false }, { status: 500, headers: NO_STORE });
  }
}

/* Every other method is a 404, configured or not — see the note at the top. */
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
