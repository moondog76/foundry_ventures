/**
 * Server-only pitch configuration (§11.3, §16.1).
 *
 * Recipients, provider credentials and the escalation address live in runtime
 * secrets — never in CMS payloads, the client bundle or `NEXT_PUBLIC_*`.
 * `assertPitchReady()` is the deploy gate: production must not ship a public
 * pitch form that accepts input and then drops it.
 */

import "server-only";

export type PitchConfig = {
  recipients: string[];
  escalationAddress: string | null;
  fromAddress: string | null;
  storeDriver: "file" | "memory";
  storeDirectory: string;
  notifierDriver: "resend" | "log";
  resendApiKey: string | null;
  fingerprintSalt: string;
  reviewUrlBase: string | null;
  retentionDays: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Rejects traversal and absolute paths so the store cannot escape `.data/`. */
function sanitizeSubfolder(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  return /^[a-z0-9][a-z0-9._-]*$/i.test(value) ? value : null;
}

function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((value) => value.trim())
    .filter((value) => EMAIL_PATTERN.test(value));
}

export function readPitchConfig(): PitchConfig {
  return {
    recipients: parseRecipients(process.env.PITCH_RECIPIENTS),
    escalationAddress: (() => {
      const value = process.env.PITCH_ESCALATION_EMAIL?.trim();
      return value && EMAIL_PATTERN.test(value) ? value : null;
    })(),
    fromAddress: (() => {
      const value = process.env.PITCH_FROM_EMAIL?.trim();
      return value && EMAIL_PATTERN.test(value) ? value : null;
    })(),
    storeDriver: process.env.PITCH_STORE_DRIVER === "memory" ? "memory" : "file",
    // A *subfolder name* under `.data/`, not a full path. Keeping the root
    // static stops the bundler from tracing the entire project (including
    // `public/`) into the server output.
    storeDirectory: sanitizeSubfolder(process.env.PITCH_STORE_DIR) ?? "pitch",
    notifierDriver: process.env.RESEND_API_KEY ? "resend" : "log",
    resendApiKey: process.env.RESEND_API_KEY ?? null,
    // A per-deployment salt keeps fingerprints from being correlated across
    // environments and makes them useless as a stable identifier.
    fingerprintSalt: process.env.PITCH_FINGERPRINT_SALT ?? "foundry-dev-salt",
    reviewUrlBase: process.env.PITCH_REVIEW_URL_BASE ?? null,
    retentionDays: Number(process.env.PITCH_RETENTION_DAYS ?? 730),
  };
}

export type ReadinessProblem = { key: string; message: string };

/**
 * Returns everything blocking a production launch of `/pitch`. Empty means the
 * conversion path is safe to expose.
 */
export function checkPitchReadiness(config: PitchConfig = readPitchConfig()): ReadinessProblem[] {
  const problems: ReadinessProblem[] = [];

  if (config.recipients.length === 0) {
    problems.push({
      key: "PITCH_RECIPIENTS",
      message:
        "No validated server-only recipient configured. A public pitch form with no recipient loses submissions.",
    });
  }
  if (!config.escalationAddress) {
    problems.push({
      key: "PITCH_ESCALATION_EMAIL",
      message:
        "No escalation address configured. Dead-lettered notifications would fail silently (§11.3).",
    });
  }
  if (config.notifierDriver === "log") {
    problems.push({
      key: "RESEND_API_KEY",
      message: "No email provider configured; notifications would only be logged.",
    });
  }
  if (config.notifierDriver === "resend" && !config.fromAddress) {
    problems.push({
      key: "PITCH_FROM_EMAIL",
      message: "An email provider is configured but no verified sender address is set.",
    });
  }
  if (config.storeDriver === "memory") {
    problems.push({
      key: "PITCH_STORE_DRIVER",
      message: "The in-memory store is not durable and must never be used in production.",
    });
  }
  if (config.storeDriver === "file" && process.env.VERCEL === "1") {
    problems.push({
      key: "PITCH_STORE_DRIVER",
      message:
        "The filesystem store is ephemeral on serverless hosts. Configure a durable store before launch.",
    });
  }
  if (config.fingerprintSalt === "foundry-dev-salt") {
    problems.push({
      key: "PITCH_FINGERPRINT_SALT",
      message: "The development fingerprint salt is still in use.",
    });
  }

  return problems;
}

export function assertPitchReady(config: PitchConfig = readPitchConfig()): void {
  const problems = checkPitchReadiness(config);
  if (problems.length === 0) return;
  const detail = problems.map((p) => `  - ${p.key}: ${p.message}`).join("\n");
  throw new Error(`Pitch conversion path is not production-ready:\n${detail}`);
}
