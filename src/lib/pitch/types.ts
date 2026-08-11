/**
 * Pitch submission storage contracts (§11.3, §11.4).
 *
 * The rule that shapes all of this: **durable storage happens before the email
 * notification.** Email alone is not a database, so a submission is written
 * atomically together with its outbox event, and delivery is retried from that
 * record. A saved pitch may never sit silently unnotified.
 */

export type PitchSubmissionStatus = "new" | "reviewing" | "contacted" | "declined" | "archived";

export type NotificationStatus = "pending" | "sent" | "failed";

export type PitchSubmission = {
  id: string;
  createdAt: string;
  status: PitchSubmissionStatus;
  country: string;
  countryOther?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyWebsite?: string;
  stage: string;
  stageOther?: string;
  fundingRaisedEur: number;
  oneLinePitch: string;
  description: string;
  deckUrl?: string;
  loomUrl?: string;
  source?: "referral" | "linkedin" | "event" | "portfolio-founder" | "search" | "other";
  sourceOther?: string;
  privacyConsentAt: string;
  notificationStatus: NotificationStatus;
  notificationAttempts: number;
  nextNotificationAttemptAt?: string;
  /** Salted hash used only for rate limiting — never a raw IP (§11.4). */
  requestFingerprintHash?: string;
};

/** One outbox row, written in the same operation as the submission. */
export type OutboxEvent = {
  id: string;
  submissionId: string;
  type: "pitch.received";
  createdAt: string;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string;
  status: "pending" | "sent" | "dead-letter";
};

export type PitchStore = {
  readonly name: string;
  /** Writes submission + outbox event atomically. Returns the stored record. */
  create(submission: PitchSubmission, event: OutboxEvent): Promise<PitchSubmission>;
  /** Idempotency: returns an existing record for a submission id, if any. */
  findById(id: string): Promise<PitchSubmission | null>;
  listPendingEvents(now: Date): Promise<OutboxEvent[]>;
  markEventSent(eventId: string): Promise<void>;
  markEventFailed(eventId: string, error: string, nextAttemptAt: Date): Promise<void>;
  markEventDeadLettered(eventId: string, error: string): Promise<void>;
  /** Deletes submissions past the retention window (§11.4). */
  purgeOlderThan(cutoff: Date): Promise<number>;
};

export type NotificationPayload = {
  submissionId: string;
  /** Deliberately minimal: enough to find the record, never the pitch itself. */
  companyName: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
  reviewUrl?: string;
};

export type PitchNotifier = {
  readonly name: string;
  send(payload: NotificationPayload): Promise<void>;
};

export type EscalationPayload = {
  submissionId: string;
  attempts: number;
  lastError: string;
};

/** Alerts a configured operator when an event dead-letters (§11.3). */
export type PitchEscalator = {
  readonly name: string;
  escalate(payload: EscalationPayload): Promise<void>;
};
