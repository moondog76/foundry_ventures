/**
 * Pitch notification delivery.
 *
 * §11.3: the notification carries only what a reviewer needs to *find* the
 * record — sender name, company, email and id. The pitch body, deck URL, Loom
 * URL and any other personal detail stay in durable storage and never appear in
 * an email body, a log line or an error message.
 */

import "server-only";
import type {
  EscalationPayload,
  NotificationPayload,
  PitchEscalator,
  PitchNotifier,
} from "./types";
import { readPitchConfig, type PitchConfig } from "./config";

function subjectFor(payload: NotificationPayload): string {
  return `New pitch: ${payload.companyName}`;
}

function bodyFor(payload: NotificationPayload): string {
  const lines = [
    `A new pitch was submitted at ${payload.createdAt}.`,
    "",
    `Company: ${payload.companyName}`,
    `From: ${payload.senderName} <${payload.senderEmail}>`,
    `Submission id: ${payload.submissionId}`,
  ];
  if (payload.reviewUrl) lines.push("", `Open: ${payload.reviewUrl}`);
  lines.push(
    "",
    "The pitch itself is stored securely and is deliberately not included in this email.",
  );
  return lines.join("\n");
}

/** Development/staging driver: records that a notification *would* be sent. */
export function createLogNotifier(): PitchNotifier {
  return {
    name: "log",
    async send(payload) {
      // No personal data beyond the reviewer-facing identifiers (§11.3).
      console.info(
        `[pitch] notification for submission ${payload.submissionId} (${payload.companyName})`,
      );
    },
  };
}

export function createResendNotifier(config: PitchConfig): PitchNotifier {
  return {
    name: "resend",
    async send(payload) {
      if (!config.resendApiKey || !config.fromAddress || config.recipients.length === 0) {
        throw new Error("Resend notifier is not fully configured");
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
          // Provider-side idempotency, so a retry cannot duplicate an email.
          "Idempotency-Key": payload.submissionId,
        },
        body: JSON.stringify({
          from: config.fromAddress,
          to: config.recipients,
          reply_to: payload.senderEmail,
          subject: subjectFor(payload),
          text: bodyFor(payload),
        }),
      });
      if (!response.ok) {
        // Status only — a provider error body can echo the request back.
        throw new Error(`Email provider responded ${response.status}`);
      }
    },
  };
}

export function createEscalator(config: PitchConfig, notifier: PitchNotifier): PitchEscalator {
  return {
    name: `escalate:${notifier.name}`,
    async escalate(payload: EscalationPayload) {
      console.error(
        `[pitch] notification dead-lettered for submission ${payload.submissionId} after ${payload.attempts} attempts: ${payload.lastError}`,
      );
      if (!config.escalationAddress || !config.resendApiKey || !config.fromAddress) return;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.fromAddress,
          to: [config.escalationAddress],
          subject: `[action needed] Pitch notification failed (${payload.submissionId})`,
          text: [
            `A pitch was stored but could not be notified after ${payload.attempts} attempts.`,
            `Submission id: ${payload.submissionId}`,
            `Last error: ${payload.lastError}`,
            "",
            "The submission is safe in storage; someone needs to review it manually.",
          ].join("\n"),
        }),
      }).catch(() => undefined);
    },
  };
}

let cachedNotifier: PitchNotifier | null = null;

export function getPitchNotifier(): PitchNotifier {
  if (cachedNotifier) return cachedNotifier;
  const config = readPitchConfig();
  cachedNotifier =
    config.notifierDriver === "resend" ? createResendNotifier(config) : createLogNotifier();
  return cachedNotifier;
}

export function __setPitchNotifierForTests(notifier: PitchNotifier | null): void {
  cachedNotifier = notifier;
}
