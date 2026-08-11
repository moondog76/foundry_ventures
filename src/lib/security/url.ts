/**
 * URL and protocol sanitisation.
 *
 * Spec §23: allowlist `https`, `http`, `mailto` and `tel`; block `javascript:`
 * and everything else. Applied to every CMS-authored href, rich-text link and
 * user-submitted URL before it reaches the DOM.
 */

const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:"]);
const ALLOWED_WEB_PROTOCOLS = new Set(["https:", "http:"]);

/** Returns the URL unchanged when safe, otherwise null. Never throws. */
export function sanitizeUrl(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;

  // Relative and hash links never carry a protocol and are always safe.
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    // Protocol-relative URLs (`//evil.example`) are not treated as relative.
    if (trimmed.startsWith("//")) return null;
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
}

/** Stricter variant for company websites, decks and embeds: http(s) only. */
export function sanitizeWebUrl(input: string | undefined | null): string | null {
  if (!input) return null;
  try {
    const parsed = new URL(input.trim());
    if (!ALLOWED_WEB_PROTOCOLS.has(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isExternalUrl(href: string, canonicalOrigin: string): boolean {
  if (href.startsWith("/") || href.startsWith("#")) return false;
  try {
    const target = new URL(href);
    if (target.protocol === "mailto:" || target.protocol === "tel:") return false;
    return new URL(canonicalOrigin).origin !== target.origin;
  } catch {
    return false;
  }
}

/** `mailto:` with the address percent-encoded so a crafted value cannot inject headers. */
export function mailtoHref(email: string | undefined | null): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  // Deliberately strict: one @, a dotted domain, no whitespace or control chars.
  if (!/^[^\s@<>"'\\]+@[^\s@<>"'\\]+\.[^\s@<>"'\\]+$/.test(trimmed)) return null;
  return `mailto:${encodeURIComponent(trimmed).replace(/%40/g, "@")}`;
}

/** `tel:` with formatting stripped to the dialable form. */
export function telHref(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "");
  if (!/^\+?\d{6,15}$/.test(normalized)) return null;
  return `tel:${normalized}`;
}

/** Allowlisted rich-text embed providers (§12.2). */
const EMBED_HOSTS: Record<string, RegExp> = {
  youtube: /^(www\.)?(youtube\.com|youtu\.be)$/,
  vimeo: /^(www\.|player\.)?vimeo\.com$/,
  loom: /^(www\.)?loom\.com$/,
};

export function isAllowedEmbed(provider: string, url: string): boolean {
  const pattern = EMBED_HOSTS[provider];
  if (!pattern) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && pattern.test(parsed.hostname);
  } catch {
    return false;
  }
}
