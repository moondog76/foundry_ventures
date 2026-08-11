/**
 * Pitch submission service — the authoritative server path (§11.3).
 *
 * Order of operations, deliberately:
 *   1. anti-spam (honeypot + minimum fill time) and rate limit
 *   2. authoritative schema validation
 *   3. durable write of submission **and** outbox event, atomically
 *   4. best-effort immediate delivery; failure schedules a retry rather than
 *      failing the user's submission
 *
 * The user gets a success response as soon as step 3 succeeds, because at that
 * point the pitch cannot be lost.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import {
  pitchRequestSchema,
  MIN_FORM_FILL_MS,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/pitch";
import { readPitchConfig } from "./config";
import { getPitchStore } from "./store";
import { createEscalator, getPitchNotifier } from "./notifier";
import { deliverEvent } from "./outbox";
import { checkRateLimit, clientAddressFrom, fingerprintHash, pruneRateLimits } from "./rate-limit";
import type { OutboxEvent, PitchSubmission } from "./types";

export type SubmitOutcome =
  | { ok: true; submissionId: string; deduplicated: boolean }
  | { ok: false; kind: "validation"; errors: FieldErrors }
  | { ok: false; kind: "rate-limit"; retryAfterSeconds: number }
  | { ok: false; kind: "spam" }
  | { ok: false; kind: "server" };

export async function submitPitch(input: {
  payload: unknown;
  headers: Headers;
  now?: Date;
}): Promise<SubmitOutcome> {
  const now = input.now ?? new Date();
  const config = readPitchConfig();

  const parsed = pitchRequestSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { ok: false, kind: "validation", errors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot: a real user never sees this field, so any value is a bot.
  if (data.website2 && data.website2.length > 0) {
    return { ok: false, kind: "spam" };
  }
  // Time-to-fill: a form completed faster than a human could read it.
  if (typeof data.renderedAt === "number" && data.renderedAt > 0) {
    if (now.getTime() - data.renderedAt < MIN_FORM_FILL_MS) {
      return { ok: false, kind: "spam" };
    }
  }

  pruneRateLimits(now.getTime());
  const address = clientAddressFrom(input.headers);
  const fingerprint = fingerprintHash(address, config.fingerprintSalt);
  const limit = checkRateLimit(fingerprint, now.getTime());
  if (!limit.allowed) {
    return { ok: false, kind: "rate-limit", retryAfterSeconds: limit.retryAfterSeconds };
  }

  const store = getPitchStore();
  // The client-generated id makes a double submit idempotent.
  const submissionId = data.submissionId ?? randomUUID();

  const existing = await store.findById(submissionId);
  if (existing) return { ok: true, submissionId, deduplicated: true };

  const submission: PitchSubmission = {
    id: submissionId,
    createdAt: now.toISOString(),
    status: "new",
    country: data.country,
    countryOther: data.countryOther,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    companyName: data.companyName,
    companyWebsite: data.companyWebsite,
    stage: data.stage,
    stageOther: data.stageOther,
    fundingRaisedEur: data.fundingRaisedEur,
    oneLinePitch: data.oneLinePitch,
    description: data.description,
    deckUrl: data.deckUrl,
    loomUrl: data.loomUrl,
    source: data.source as PitchSubmission["source"],
    sourceOther: data.sourceOther,
    privacyConsentAt: now.toISOString(),
    notificationStatus: "pending",
    notificationAttempts: 0,
    requestFingerprintHash: fingerprint,
  };

  const event: OutboxEvent = {
    id: randomUUID(),
    submissionId,
    type: "pitch.received",
    createdAt: now.toISOString(),
    attempts: 0,
    nextAttemptAt: now.toISOString(),
    status: "pending",
  };

  try {
    await store.create(submission, event);
  } catch {
    // Storage failed, so nothing was persisted: this is the one case where the
    // user must be asked to retry.
    return { ok: false, kind: "server" };
  }

  // The pitch is safe from here on. Delivery problems are retried in the
  // background and never surface as a failed submission.
  const notifier = getPitchNotifier();
  await deliverEvent({
    event,
    store,
    notifier,
    escalator: createEscalator(config, notifier),
    reviewUrlBase: config.reviewUrlBase,
    now,
  }).catch(() => undefined);

  return { ok: true, submissionId, deduplicated: false };
}

/** Retention enforcement, invoked by the maintenance route (§11.4). */
export async function purgeExpiredSubmissions(now: Date = new Date()): Promise<number> {
  const config = readPitchConfig();
  const cutoff = new Date(now.getTime() - config.retentionDays * 24 * 60 * 60 * 1000);
  return getPitchStore().purgeOlderThan(cutoff);
}
