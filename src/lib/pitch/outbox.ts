/**
 * Outbox delivery with exponential backoff (§11.3).
 *
 * An event is retried up to `MAX_ATTEMPTS` with growing delays. When it runs
 * out, the event dead-letters and a configured operator is alerted — a stored
 * pitch must never go unnoticed.
 */

import "server-only";
import type {
  OutboxEvent,
  PitchEscalator,
  PitchNotifier,
  PitchStore,
  PitchSubmission,
} from "./types";

export const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 6 * 60 * 60 * 1000;

/** 30s, 1m, 2m, 4m, 8m … capped at six hours. */
export function backoffDelayMs(attempts: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** Math.max(0, attempts), MAX_DELAY_MS);
}

export function buildNotificationPayload(
  submission: PitchSubmission,
  reviewUrlBase: string | null,
) {
  return {
    submissionId: submission.id,
    companyName: submission.companyName,
    senderName: `${submission.firstName} ${submission.lastName}`.trim(),
    senderEmail: submission.email,
    createdAt: submission.createdAt,
    reviewUrl: reviewUrlBase ? `${reviewUrlBase.replace(/\/$/, "")}/${submission.id}` : undefined,
  };
}

export type DeliveryResult = { delivered: number; failed: number; deadLettered: number };

export async function deliverEvent(options: {
  event: OutboxEvent;
  store: PitchStore;
  notifier: PitchNotifier;
  escalator: PitchEscalator;
  reviewUrlBase: string | null;
  now?: Date;
}): Promise<"sent" | "retry" | "dead-letter"> {
  const { event, store, notifier, escalator, reviewUrlBase } = options;
  const now = options.now ?? new Date();

  const submission = await store.findById(event.submissionId);
  if (!submission) {
    await store.markEventDeadLettered(event.id, "Submission record is missing");
    return "dead-letter";
  }

  try {
    await notifier.send(buildNotificationPayload(submission, reviewUrlBase));
    await store.markEventSent(event.id);
    return "sent";
  } catch (error) {
    // Never log the payload — only the failure reason.
    const message = error instanceof Error ? error.message : "Unknown notifier error";
    const attempts = event.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await store.markEventDeadLettered(event.id, message);
      await escalator.escalate({ submissionId: submission.id, attempts, lastError: message });
      return "dead-letter";
    }
    await store.markEventFailed(
      event.id,
      message,
      new Date(now.getTime() + backoffDelayMs(event.attempts)),
    );
    return "retry";
  }
}

export async function processOutbox(options: {
  store: PitchStore;
  notifier: PitchNotifier;
  escalator: PitchEscalator;
  reviewUrlBase: string | null;
  now?: Date;
  limit?: number;
}): Promise<DeliveryResult> {
  const now = options.now ?? new Date();
  const events = (await options.store.listPendingEvents(now)).slice(0, options.limit ?? 25);
  const result: DeliveryResult = { delivered: 0, failed: 0, deadLettered: 0 };

  for (const event of events) {
    const outcome = await deliverEvent({ ...options, event, now });
    if (outcome === "sent") result.delivered += 1;
    else if (outcome === "retry") result.failed += 1;
    else result.deadLettered += 1;
  }

  return result;
}
