/**
 * Outbound company links: website, LinkedIn, careers (§9.1).
 *
 * Every href goes through `sanitizeWebUrl` (http/https only, real hostname), so
 * a malformed CMS value drops out instead of rendering a dead or unsafe link.
 * The whole block disappears when nothing survives — no empty "Links" heading.
 *
 * Each link is labelled by what it is and reads as the address it goes to, so
 * the destination is visible before the click. The address is a deterministic
 * reformat of the real URL (protocol and `www.` removed, trailing slash
 * dropped) and is allowed to break mid-token so a long path can never push the
 * page sideways at 320px.
 */

import { ExternalLink } from "@/components/global/ExternalLink";
import { sanitizeWebUrl } from "@/lib/security/url";
import styles from "./company-links.module.css";

export type CompanyLinksProps = {
  websiteUrl: string | null;
  linkedinUrl: string | null;
  careersUrl: string | null;
  labelId: string;
};

/** `https://grandsystems.com/en/` → `grandsystems.com/en` */
function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${host}${path}${parsed.search}`;
  } catch {
    // `sanitizeWebUrl` already parsed it once, so this is unreachable in
    // practice; showing the raw value beats showing nothing.
    return url;
  }
}

export function CompanyLinks({ websiteUrl, linkedinUrl, careersUrl, labelId }: CompanyLinksProps) {
  const candidates: Array<{ key: string; label: string; url: string | null }> = [
    { key: "website", label: "Website", url: sanitizeWebUrl(websiteUrl) },
    { key: "linkedin", label: "LinkedIn", url: sanitizeWebUrl(linkedinUrl) },
    { key: "careers", label: "Careers", url: sanitizeWebUrl(careersUrl) },
  ];
  const entries = candidates.filter(
    (entry): entry is { key: string; label: string; url: string } => entry.url !== null,
  );

  if (entries.length === 0) return null;

  return (
    <nav className={styles.links} aria-labelledby={labelId}>
      <p id={labelId} className={styles.label}>
        Links
      </p>
      <ul className={styles.list} role="list">
        {entries.map((entry) => (
          <li key={entry.key} className={styles.item}>
            <span className={styles.itemLabel}>{entry.label}</span>
            <ExternalLink href={entry.url} className={styles.link}>
              <span className={styles.url}>{displayUrl(entry.url)}</span>
            </ExternalLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
