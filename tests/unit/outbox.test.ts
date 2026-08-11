/**
 * §26.1 — outbox delivery (§11.3).
 *
 * The rule the outbox exists to guarantee: a stored pitch may never sit
 * silently unnotified. So the failure paths matter more than the happy one —
 * a retry has to be scheduled at the right moment, and running out of attempts
 * has to both dead-letter the event *and* alert a human.
 *
 * Everything runs against the real in-memory store driver, so the assertions
 * are about observable stored state rather than about calls to a mock.
 */

import { describe, expect, it, vi } from "vitest";
import {
  MAX_ATTEMPTS,
  backoffDelayMs,
  buildNotificationPayload,
  deliverEvent,
  processOutbox,
} from "@/lib/pitch/outbox";
import { createMemoryStore } from "@/lib/pitch/store";
import type {
  OutboxEvent,
  PitchEscalator,
  PitchNotifier,
  PitchStore,
  PitchSubmission,
} from "@/lib/pitch/types";

const NOW = new Date("2026-08-10T12:00:00.000Z");

function makeSubmission(overrides: Partial<PitchSubmission> = {}): PitchSubmission {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    createdAt: NOW.toISOString(),
    status: "new",
    country: "Sweden",
    firstName: "Fixture",
    lastName: "Founder",
    email: "founder@example.com",
    companyName: "Testcorp Fixture",
    stage: "MVP",
    fundingRaisedEur: 0,
    oneLinePitch: "A synthetic one-line pitch used only by the unit tests.",
    description: "A synthetic description used only by the unit tests.",
    privacyConsentAt: NOW.toISOString(),
    notificationStatus: "pending",
    notificationAttempts: 0,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    id: "event-1",
    submissionId: makeSubmission().id,
    type: "pitch.received",
    createdAt: NOW.toISOString(),
    attempts: 0,
    nextAttemptAt: NOW.toISOString(),
    status: "pending",
    ...overrides,
  };
}

function stubNotifier(behaviour: "ok" | "fail"): PitchNotifier & { calls: number } {
  const notifier = {
    name: "stub",
    calls: 0,
    async send() {
      notifier.calls += 1;
      if (behaviour === "fail") throw new Error("SMTP refused the message");
    },
  };
  return notifier;
}

function stubEscalator(): PitchEscalator & { calls: Array<Record<string, unknown>> } {
  const escalator = {
    name: "stub",
    calls: [] as Array<Record<string, unknown>>,
    async escalate(payload: { submissionId: string; attempts: number; lastError: string }) {
      escalator.calls.push({ ...payload });
    },
  };
  return escalator;
}

async function seedStore(submission: PitchSubmission, event: OutboxEvent): Promise<PitchStore> {
  const store = createMemoryStore();
  await store.create(submission, event);
  return store;
}

/* ------------------------------------------------------------- Backoff */

describe("backoffDelayMs", () => {
  it("doubles from 30 seconds", () => {
    expect(backoffDelayMs(0)).toBe(30_000);
    expect(backoffDelayMs(1)).toBe(60_000);
    expect(backoffDelayMs(2)).toBe(120_000);
    expect(backoffDelayMs(3)).toBe(240_000);
    expect(backoffDelayMs(4)).toBe(480_000);
  });

  it("caps at six hours and never grows beyond it", () => {
    const cap = 6 * 60 * 60 * 1000;

    expect(backoffDelayMs(10)).toBe(cap);
    expect(backoffDelayMs(MAX_ATTEMPTS)).toBeLessThanOrEqual(cap);
    expect(backoffDelayMs(1000)).toBe(cap);
  });

  it("treats a negative attempt count as zero rather than shrinking below the base", () => {
    expect(backoffDelayMs(-5)).toBe(30_000);
  });

  it("grows monotonically across the whole retry sequence", () => {
    const delays = Array.from({ length: MAX_ATTEMPTS }, (_, index) => backoffDelayMs(index));
    for (let index = 1; index < delays.length; index += 1) {
      expect(delays[index]).toBeGreaterThanOrEqual(delays[index - 1]);
    }
  });
});

/* -------------------------------------------------------------- Payload */

describe("buildNotificationPayload", () => {
  it("carries only what an operator needs to find the record", () => {
    const submission = makeSubmission();
    const payload = buildNotificationPayload(submission, "https://ops.example.com/pitches/");

    expect(payload).toEqual({
      submissionId: submission.id,
      companyName: "Testcorp Fixture",
      senderName: "Fixture Founder",
      senderEmail: "founder@example.com",
      createdAt: submission.createdAt,
      reviewUrl: `https://ops.example.com/pitches/${submission.id}`,
    });
    // The pitch itself never travels in the notification.
    expect(JSON.stringify(payload)).not.toContain(submission.oneLinePitch);
    expect(JSON.stringify(payload)).not.toContain(submission.description);
  });

  it("omits the review URL when no base is configured", () => {
    const payload = buildNotificationPayload(makeSubmission(), null);
    expect(payload.reviewUrl).toBeUndefined();
  });
});

/* ------------------------------------------------------------- Delivery */

describe("deliverEvent", () => {
  it("marks the event sent on success", async () => {
    const submission = makeSubmission();
    const event = makeEvent();
    const store = await seedStore(submission, event);
    const notifier = stubNotifier("ok");
    const escalator = stubEscalator();

    const outcome = await deliverEvent({
      event,
      store,
      notifier,
      escalator,
      reviewUrlBase: null,
      now: NOW,
    });

    expect(outcome).toBe("sent");
    expect(notifier.calls).toBe(1);
    expect(escalator.calls).toEqual([]);

    const stored = await store.findById(submission.id);
    expect(stored?.notificationStatus).toBe("sent");
    expect(stored?.notificationAttempts).toBe(1);
    expect(stored?.nextNotificationAttemptAt).toBeUndefined();
    // A sent event is no longer pending, however far the clock is wound forward.
    expect(await store.listPendingEvents(new Date("2030-01-01T00:00:00.000Z"))).toEqual([]);
  });

  it("schedules a retry at now + the backoff for the attempts already made", async () => {
    const submission = makeSubmission();
    // Two attempts have already failed, so the next delay is backoffDelayMs(2).
    const event = makeEvent({ attempts: 2 });
    const store = await seedStore(submission, event);

    const outcome = await deliverEvent({
      event,
      store,
      notifier: stubNotifier("fail"),
      escalator: stubEscalator(),
      reviewUrlBase: null,
      now: NOW,
    });

    expect(outcome).toBe("retry");

    const expectedAt = new Date(NOW.getTime() + backoffDelayMs(2)).toISOString();
    const stored = await store.findById(submission.id);
    expect(stored?.nextNotificationAttemptAt).toBe(expectedAt);
    expect(stored?.notificationAttempts).toBe(3);
    // Still pending, but not before the scheduled moment.
    expect(await store.listPendingEvents(new Date(NOW.getTime() + 1000))).toEqual([]);
    expect(await store.listPendingEvents(new Date(expectedAt))).toHaveLength(1);
  });

  it("records the failure reason without ever storing the payload", async () => {
    const submission = makeSubmission();
    const event = makeEvent();
    const store = await seedStore(submission, event);

    await deliverEvent({
      event,
      store,
      notifier: stubNotifier("fail"),
      escalator: stubEscalator(),
      reviewUrlBase: null,
      now: NOW,
    });

    const pending = await store.listPendingEvents(new Date("2030-01-01T00:00:00.000Z"));
    expect(pending[0]?.lastError).toBe("SMTP refused the message");
    expect(JSON.stringify(pending[0])).not.toContain(submission.description);
  });

  it("dead-letters and escalates once the attempts run out", async () => {
    const submission = makeSubmission();
    // One attempt short of the limit: this delivery is the last one.
    const event = makeEvent({ attempts: MAX_ATTEMPTS - 1 });
    const store = await seedStore(submission, event);
    const escalator = stubEscalator();

    const outcome = await deliverEvent({
      event,
      store,
      notifier: stubNotifier("fail"),
      escalator,
      reviewUrlBase: null,
      now: NOW,
    });

    expect(outcome).toBe("dead-letter");
    expect(escalator.calls).toEqual([
      {
        submissionId: submission.id,
        attempts: MAX_ATTEMPTS,
        lastError: "SMTP refused the message",
      },
    ]);

    const stored = await store.findById(submission.id);
    expect(stored?.notificationStatus).toBe("failed");
    expect(stored?.notificationAttempts).toBe(MAX_ATTEMPTS);
    // A dead-lettered event is never retried silently.
    expect(await store.listPendingEvents(new Date("2030-01-01T00:00:00.000Z"))).toEqual([]);
  });

  it("dead-letters an event whose submission has gone missing", async () => {
    const store = createMemoryStore();
    const escalator = stubEscalator();
    const notifier = stubNotifier("ok");

    const outcome = await deliverEvent({
      event: makeEvent({ submissionId: "does-not-exist" }),
      store,
      notifier,
      escalator,
      reviewUrlBase: null,
      now: NOW,
    });

    expect(outcome).toBe("dead-letter");
    expect(notifier.calls).toBe(0);
  });
});

/* ------------------------------------------------------------- Processing */

describe("processOutbox", () => {
  it("counts each outcome and only touches events that are due", async () => {
    const store = createMemoryStore();
    const dueSubmission = makeSubmission({ id: "due-1" });
    const futureSubmission = makeSubmission({ id: "future-1" });

    await store.create(dueSubmission, makeEvent({ id: "event-due", submissionId: "due-1" }));
    await store.create(
      futureSubmission,
      makeEvent({
        id: "event-future",
        submissionId: "future-1",
        nextAttemptAt: new Date(NOW.getTime() + 60_000).toISOString(),
      }),
    );

    const result = await processOutbox({
      store,
      notifier: stubNotifier("ok"),
      escalator: stubEscalator(),
      reviewUrlBase: null,
      now: NOW,
    });

    expect(result).toEqual({ delivered: 1, failed: 0, deadLettered: 0 });
    expect((await store.findById("due-1"))?.notificationStatus).toBe("sent");
    expect((await store.findById("future-1"))?.notificationStatus).toBe("pending");
  });

  it("reports failures without throwing", async () => {
    const store = await seedStore(makeSubmission(), makeEvent());

    const result = await processOutbox({
      store,
      notifier: stubNotifier("fail"),
      escalator: stubEscalator(),
      reviewUrlBase: null,
      now: NOW,
    });

    expect(result).toEqual({ delivered: 0, failed: 1, deadLettered: 0 });
  });

  it("respects the batch limit", async () => {
    const store = createMemoryStore();
    for (let index = 0; index < 3; index += 1) {
      await store.create(
        makeSubmission({ id: `submission-${index}` }),
        makeEvent({
          id: `event-${index}`,
          submissionId: `submission-${index}`,
          createdAt: new Date(NOW.getTime() + index).toISOString(),
        }),
      );
    }

    const notifier = stubNotifier("ok");
    const result = await processOutbox({
      store,
      notifier,
      escalator: stubEscalator(),
      reviewUrlBase: null,
      now: NOW,
      limit: 2,
    });

    expect(result.delivered).toBe(2);
    expect(notifier.calls).toBe(2);
  });
});

/* -------------------------------------------------------------- Retention */

describe("memory store retention", () => {
  it("purges submissions older than the cutoff and keeps the rest", async () => {
    const store = createMemoryStore();
    await store.create(
      makeSubmission({ id: "old", createdAt: "2025-01-01T00:00:00.000Z" }),
      makeEvent({ id: "event-old", submissionId: "old" }),
    );
    await store.create(
      makeSubmission({ id: "recent" }),
      makeEvent({ id: "event-recent", submissionId: "recent" }),
    );

    const removed = await store.purgeOlderThan(new Date("2026-01-01T00:00:00.000Z"));

    expect(removed).toBe(1);
    expect(await store.findById("old")).toBeNull();
    expect(await store.findById("recent")).not.toBeNull();
  });

  it("is idempotent on create, so a retried POST cannot duplicate a pitch", async () => {
    const store = createMemoryStore();
    const submission = makeSubmission();

    await store.create(submission, makeEvent());
    const second = await store.create(
      { ...submission, companyName: "A different name" },
      makeEvent({ id: "event-2" }),
    );

    expect(second.companyName).toBe("Testcorp Fixture");
    expect(await store.listPendingEvents(NOW)).toHaveLength(1);
  });
});

/* ------------------------------------------------------------ Sanity check */

describe("server-only guard", () => {
  it("loads the outbox module under test without a React Server runtime", async () => {
    // `@/lib/pitch/outbox` imports the `server-only` marker package, which the
    // test config maps to that package's own empty entry point. If that mapping
    // regressed, this import would throw instead of resolving.
    await expect(import("@/lib/pitch/outbox")).resolves.toBeDefined();
    expect(vi.isMockFunction(deliverEvent)).toBe(false);
  });
});
