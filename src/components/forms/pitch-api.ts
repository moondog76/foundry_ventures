/**
 * The wire contract between `PitchForm` and `POST /api/pitch` (§11.3, §19.5).
 *
 * Types only, plus the endpoint path. Deliberately no runtime message strings:
 * user-facing failure copy is composed by the route (the authoritative side) and
 * rendered verbatim by the form, so the two can never drift apart. The route
 * imports this module with `import type`, which is erased at compile time — no
 * component code is ever pulled into the server bundle.
 */

export const PITCH_ENDPOINT = "/api/pitch";

/** One message per field, keyed by the field names in `pitchFormSchema`. */
export type PitchFieldErrors = Record<string, string>;

export type PitchApiResponse =
  /** 201 — the submission is durably stored and can no longer be lost. */
  | { ok: true; submissionId: string }
  /** 400 — per-field problems the user can fix without losing anything. */
  | { ok: false; kind: "validation"; errors: PitchFieldErrors }
  /** 429 — accompanied by a `Retry-After` header. */
  | { ok: false; kind: "rate-limit"; retryAfterSeconds: number; message: string }
  /**
   * 400/413/415 — the request was refused. The message is deliberately generic:
   * telling a bot which anti-spam check tripped is telling it how to pass.
   */
  | { ok: false; kind: "rejected"; message: string }
  /** 500 — nothing was stored; retrying with the same values is safe. */
  | { ok: false; kind: "server"; message: string };

/** 405 payload; the response also carries an `Allow` header. */
export type PitchApiMethodNotAllowed = { ok: false; kind: "method-not-allowed" };
