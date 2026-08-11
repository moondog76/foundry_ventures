/**
 * Pitch storage drivers.
 *
 * `file` writes each submission and its outbox event in one atomic operation
 * (temp file + rename, guarded by a per-process mutex) so a crash can never
 * leave a submission without a delivery record (§11.3).
 *
 * The filesystem driver is the documented dev/staging default. Serverless
 * filesystems are ephemeral, so `checkPitchReadiness()` blocks a production
 * deploy that still relies on it (§30).
 */

import "server-only";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { OutboxEvent, PitchStore, PitchSubmission } from "./types";
import { readPitchConfig } from "./config";

type StoredRecord = { submission: PitchSubmission; event: OutboxEvent };

/* ------------------------------------------------------------ File driver */

/** All local submission data lives under this one statically known root. */
const DATA_ROOT = "data";

function createFileStore(subfolder: string): PitchStore {
  // Statically scoped on purpose: a fully dynamic `path.resolve(cwd, x)` makes
  // the bundler trace the entire project into the server output.
  const root = path.join(process.cwd(), `.${DATA_ROOT}`, subfolder);
  // Serialises writes within this process so two submissions cannot interleave.
  let queue: Promise<unknown> = Promise.resolve();

  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const recordPath = (id: string) => path.join(root, `${id}.json`);

  async function readRecord(id: string): Promise<StoredRecord | null> {
    try {
      return JSON.parse(await readFile(recordPath(id), "utf8")) as StoredRecord;
    } catch {
      return null;
    }
  }

  async function writeRecord(record: StoredRecord): Promise<void> {
    await mkdir(root, { recursive: true });
    const target = recordPath(record.submission.id);
    const temp = `${target}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(record, null, 2), { encoding: "utf8", mode: 0o600 });
    // rename() is atomic within a filesystem: the record is either absent or complete.
    await rename(temp, target);
  }

  async function readAll(): Promise<StoredRecord[]> {
    try {
      const files = await readdir(root);
      const records = await Promise.all(
        files
          .filter((file) => file.endsWith(".json"))
          .map((file) => readRecord(path.basename(file, ".json"))),
      );
      return records.filter((record): record is StoredRecord => record !== null);
    } catch {
      return [];
    }
  }

  async function updateEvent(
    eventId: string,
    mutate: (record: StoredRecord) => void,
  ): Promise<void> {
    await serialize(async () => {
      const records = await readAll();
      const record = records.find((entry) => entry.event.id === eventId);
      if (!record) return;
      mutate(record);
      await writeRecord(record);
    });
  }

  return {
    name: "file",

    async create(submission, event) {
      return serialize(async () => {
        const existing = await readRecord(submission.id);
        // Idempotency: a retried POST returns the original record untouched.
        if (existing) return existing.submission;
        await writeRecord({ submission, event });
        return submission;
      });
    },

    async findById(id) {
      return (await readRecord(id))?.submission ?? null;
    },

    async listPendingEvents(now) {
      const records = await readAll();
      return records
        .map((record) => record.event)
        .filter((event) => event.status === "pending" && new Date(event.nextAttemptAt) <= now)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async markEventSent(eventId) {
      await updateEvent(eventId, (record) => {
        record.event.status = "sent";
        record.event.attempts += 1;
        record.submission.notificationStatus = "sent";
        record.submission.notificationAttempts = record.event.attempts;
        delete record.submission.nextNotificationAttemptAt;
      });
    },

    async markEventFailed(eventId, error, nextAttemptAt) {
      await updateEvent(eventId, (record) => {
        record.event.attempts += 1;
        record.event.lastError = error;
        record.event.nextAttemptAt = nextAttemptAt.toISOString();
        record.submission.notificationAttempts = record.event.attempts;
        record.submission.nextNotificationAttemptAt = nextAttemptAt.toISOString();
      });
    },

    async markEventDeadLettered(eventId, error) {
      await updateEvent(eventId, (record) => {
        record.event.status = "dead-letter";
        record.event.attempts += 1;
        record.event.lastError = error;
        record.submission.notificationStatus = "failed";
        record.submission.notificationAttempts = record.event.attempts;
      });
    },

    async purgeOlderThan(cutoff) {
      return serialize(async () => {
        const records = await readAll();
        let removed = 0;
        for (const record of records) {
          if (new Date(record.submission.createdAt) >= cutoff) continue;
          await unlink(recordPath(record.submission.id)).catch(() => undefined);
          removed += 1;
        }
        return removed;
      });
    },
  };
}

/* ---------------------------------------------------------- Memory driver */

export function createMemoryStore(): PitchStore {
  const records = new Map<string, StoredRecord>();

  return {
    name: "memory",
    async create(submission, event) {
      const existing = records.get(submission.id);
      if (existing) return existing.submission;
      records.set(submission.id, { submission, event });
      return submission;
    },
    async findById(id) {
      return records.get(id)?.submission ?? null;
    },
    async listPendingEvents(now) {
      return Array.from(records.values())
        .map((record) => record.event)
        .filter((event) => event.status === "pending" && new Date(event.nextAttemptAt) <= now)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async markEventSent(eventId) {
      for (const record of records.values()) {
        if (record.event.id !== eventId) continue;
        record.event.status = "sent";
        record.event.attempts += 1;
        record.submission.notificationStatus = "sent";
        record.submission.notificationAttempts = record.event.attempts;
        delete record.submission.nextNotificationAttemptAt;
      }
    },
    async markEventFailed(eventId, error, nextAttemptAt) {
      for (const record of records.values()) {
        if (record.event.id !== eventId) continue;
        record.event.attempts += 1;
        record.event.lastError = error;
        record.event.nextAttemptAt = nextAttemptAt.toISOString();
        record.submission.notificationAttempts = record.event.attempts;
        record.submission.nextNotificationAttemptAt = nextAttemptAt.toISOString();
      }
    },
    async markEventDeadLettered(eventId, error) {
      for (const record of records.values()) {
        if (record.event.id !== eventId) continue;
        record.event.status = "dead-letter";
        record.event.attempts += 1;
        record.event.lastError = error;
        record.submission.notificationStatus = "failed";
        record.submission.notificationAttempts = record.event.attempts;
      }
    },
    async purgeOlderThan(cutoff) {
      let removed = 0;
      for (const [id, record] of records) {
        if (new Date(record.submission.createdAt) >= cutoff) continue;
        records.delete(id);
        removed += 1;
      }
      return removed;
    },
  };
}

let cachedStore: PitchStore | null = null;

export function getPitchStore(): PitchStore {
  if (cachedStore) return cachedStore;
  const config = readPitchConfig();
  cachedStore =
    config.storeDriver === "memory" ? createMemoryStore() : createFileStore(config.storeDirectory);
  return cachedStore;
}

/** Test seam. */
export function __setPitchStoreForTests(store: PitchStore | null): void {
  cachedStore = store;
}
