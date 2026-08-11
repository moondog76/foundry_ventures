/**
 * Draft preview banner (§6.4, §16.8).
 *
 * Preview renders unapproved and incomplete records, so it must always announce
 * itself and always be `noindex` — the metadata layer handles the latter. The
 * banner also offers a one-click exit so an editor cannot get stuck in preview.
 */

import { draftMode } from "next/headers";
import { policyModeFromEnv } from "@/content/context";
import styles from "./draft-banner.module.css";

export async function DraftModeBanner() {
  const explicit = policyModeFromEnv();
  let enabled = false;
  try {
    enabled = (await draftMode()).isEnabled;
  } catch {
    enabled = false;
  }

  // Development renders in preview policy by default; say so plainly.
  const previewByEnvironment =
    explicit?.mode === "preview" || (explicit === null && process.env.NODE_ENV !== "production");

  if (!enabled && !previewByEnvironment) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        <strong>Preview mode.</strong> Unapproved and unverified content is visible here and this
        page is not indexed. Production shows only owner-approved fields.
      </p>
      {enabled ? (
        <a className={styles.exit} href="/api/draft/disable">
          Exit preview
        </a>
      ) : null}
    </div>
  );
}
