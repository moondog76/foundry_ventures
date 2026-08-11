/**
 * §26.1 — URL and protocol sanitisation (§23).
 *
 * Everything here is an injection boundary: a CMS-authored href, a rich-text
 * link or a founder-supplied URL reaching the DOM. The allowlist is
 * https/http/mailto/tel and the failure mode is always `null`, never a thrown
 * error and never a partially-cleaned string.
 */

import { describe, expect, it } from "vitest";
import {
  isAllowedEmbed,
  isExternalUrl,
  mailtoHref,
  sanitizeUrl,
  sanitizeWebUrl,
  telHref,
} from "@/lib/security/url";

const ORIGIN = "https://www.foundryventures.ai";

describe("sanitizeUrl", () => {
  it("passes through allowlisted absolute URLs", () => {
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(sanitizeUrl("http://example.com/path")).toBe("http://example.com/path");
    expect(sanitizeUrl("mailto:founder@example.com")).toBe("mailto:founder@example.com");
    expect(sanitizeUrl("tel:+46733460006")).toBe("tel:+46733460006");
  });

  it("passes through relative, hash and query-only links", () => {
    expect(sanitizeUrl("/portfolio")).toBe("/portfolio");
    expect(sanitizeUrl("#main-content")).toBe("#main-content");
    expect(sanitizeUrl("?status=active")).toBe("?status=active");
  });

  it("blocks javascript:, including whitespace-padded and cased variants", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("  javascript:alert(1)  ")).toBeNull();
    expect(sanitizeUrl("JavaScript:alert(1)")).toBeNull();
    expect(sanitizeUrl("\n\tjavascript:alert(1)")).toBeNull();
  });

  it("blocks data: and vbscript:", () => {
    expect(sanitizeUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("blocks protocol-relative URLs, which are not relative links", () => {
    expect(sanitizeUrl("//evil.example")).toBeNull();
    expect(sanitizeUrl("//evil.example/path")).toBeNull();
  });

  it("returns null for empty, blank and unparseable input", () => {
    expect(sanitizeUrl(undefined)).toBeNull();
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
    expect(sanitizeUrl("   ")).toBeNull();
    expect(sanitizeUrl("not a url at all")).toBeNull();
  });

  it("trims surrounding whitespace from a valid URL", () => {
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com/");
  });
});

describe("sanitizeWebUrl", () => {
  it("accepts only http(s) with a dotted hostname", () => {
    expect(sanitizeWebUrl("https://example.com")).toBe("https://example.com/");
    expect(sanitizeWebUrl(" http://example.com/deck ")).toBe("http://example.com/deck");
  });

  it("rejects mailto, tel, javascript and data URLs", () => {
    expect(sanitizeWebUrl("mailto:founder@example.com")).toBeNull();
    expect(sanitizeWebUrl("tel:+46733460006")).toBeNull();
    expect(sanitizeWebUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeWebUrl("data:text/html,<script>")).toBeNull();
  });

  it("rejects a hostless or dotless target", () => {
    expect(sanitizeWebUrl("https://localhost/deck")).toBeNull();
    expect(sanitizeWebUrl("/portfolio")).toBeNull();
    expect(sanitizeWebUrl("//evil.example")).toBeNull();
    expect(sanitizeWebUrl(undefined)).toBeNull();
  });
});

describe("mailtoHref", () => {
  it("round-trips a plain address", () => {
    const href = mailtoHref("Founder@Example.com");

    expect(href).toBe("mailto:Founder@Example.com");
    // The result must survive the generic sanitiser it will be passed through.
    expect(sanitizeUrl(href)).toBe("mailto:Founder@Example.com");
  });

  it("percent-encodes so a crafted value cannot inject mail headers", () => {
    const href = mailtoHref("founder+tag@example.com");

    expect(href).toBe("mailto:founder%2Btag@example.com");
  });

  it("rejects anything that is not a single dotted address", () => {
    expect(mailtoHref("founder@example.com%0ABcc:victim@example.com")).toBeNull();
    expect(mailtoHref("founder@example.com, other@example.com")).toBeNull();
    expect(mailtoHref("founder@localhost")).toBeNull();
    expect(mailtoHref("founder at example.com")).toBeNull();
    expect(mailtoHref("")).toBeNull();
    expect(mailtoHref(undefined)).toBeNull();
  });
});

describe("telHref", () => {
  it("strips formatting down to the dialable form", () => {
    expect(telHref("+46 733 460006")).toBe("tel:+46733460006");
    expect(telHref("(08) 123 456 78")).toBe("tel:0812345678");
    expect(sanitizeUrl(telHref("+46 733 460006") as string)).toBe("tel:+46733460006");
  });

  it("rejects a number that cannot be dialled", () => {
    expect(telHref("12345")).toBeNull();
    expect(telHref("+123456789012345678")).toBeNull();
    expect(telHref("call us")).toBeNull();
    expect(telHref(undefined)).toBeNull();
  });
});

describe("isAllowedEmbed", () => {
  it("accepts the allowlisted providers over https", () => {
    expect(isAllowedEmbed("youtube", "https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isAllowedEmbed("youtube", "https://youtu.be/abc")).toBe(true);
    expect(isAllowedEmbed("vimeo", "https://player.vimeo.com/video/1")).toBe(true);
    expect(isAllowedEmbed("loom", "https://www.loom.com/share/abc")).toBe(true);
  });

  it("rejects http, an unknown provider and a lookalike host", () => {
    expect(isAllowedEmbed("youtube", "http://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isAllowedEmbed("tiktok", "https://www.tiktok.com/@x/video/1")).toBe(false);
    expect(isAllowedEmbed("youtube", "https://youtube.com.evil.example/watch")).toBe(false);
    expect(isAllowedEmbed("vimeo", "https://evil.example/vimeo.com")).toBe(false);
    expect(isAllowedEmbed("loom", "not a url")).toBe(false);
  });
});

describe("isExternalUrl", () => {
  it("treats internal paths and hashes as internal", () => {
    expect(isExternalUrl("/portfolio", ORIGIN)).toBe(false);
    expect(isExternalUrl("#main-content", ORIGIN)).toBe(false);
    expect(isExternalUrl(`${ORIGIN}/portfolio`, ORIGIN)).toBe(false);
  });

  it("treats another origin as external", () => {
    expect(isExternalUrl("https://example.com/", ORIGIN)).toBe(true);
    // A different subdomain is a different origin.
    expect(isExternalUrl("https://foundryventures.ai/", ORIGIN)).toBe(true);
  });

  it("does not mark mailto or tel as external navigation", () => {
    expect(isExternalUrl("mailto:founder@example.com", ORIGIN)).toBe(false);
    expect(isExternalUrl("tel:+46733460006", ORIGIN)).toBe(false);
  });

  it("does not throw on an unparseable href", () => {
    expect(isExternalUrl("not a url", ORIGIN)).toBe(false);
  });
});
