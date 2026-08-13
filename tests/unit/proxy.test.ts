import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APEX_HOST, CANONICAL_HOST, CANONICAL_ORIGIN, proxy } from "@/proxy";

/**
 * The canonical-host redirect, and the healthcheck it once killed.
 *
 * On 2026-08-13 setting `FOUNDRY_ENFORCE_CANONICAL_HOST=1` failed every deploy.
 * The build was fine and the site was fine; Railway's healthcheck probes `/`
 * over plain HTTP from inside its own network, with no `x-forwarded-proto`
 * header, and the proxy read that absence as "not HTTPS" and answered 308.
 * The replica never became healthy and the release rolled back — a total
 * deployment outage produced by a flag that only meant to tidy up URLs.
 *
 * The first repair was worse than the bug, and these tests exist mostly to stop
 * it being tried again: "skip the redirect when `x-forwarded-proto` is absent"
 * reads correctly and passes a naive unit test, but **Next.js synthesises that
 * header on every request**, including a bare loopback one. It is never absent
 * at runtime. A hand-built `NextRequest` has no such header, so the fiction only
 * exists in the test.
 *
 * So `request()` below always attaches the headers the real runtime attaches.
 * The tests are only trustworthy because they cannot describe a request the
 * server could never receive.
 */

function request(
  url: string,
  { host, proto = "http" }: { host?: string; proto?: string } = {},
): NextRequest {
  const parsed = new URL(url);
  return new NextRequest(
    new Request(url, {
      headers: {
        host: host ?? parsed.host,
        // Always present — this is the header Next adds, verified against a
        // running `next start` rather than assumed.
        "x-forwarded-proto": proto,
        "x-forwarded-host": host ?? parsed.host,
      },
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("canonical host enforcement", () => {
  describe("when the flag is on", () => {
    beforeEach(() => {
      vi.stubEnv("FOUNDRY_ENFORCE_CANONICAL_HOST", "1");
    });

    /*
     * Every host the platform probes the container on. Each one is a
     * non-canonical host arriving over plain HTTP — indistinguishable from
     * public traffic by protocol alone, which is exactly why the old rule
     * caught them.
     */
    it.each([
      ["loopback IP", "http://127.0.0.1:8080/", "127.0.0.1"],
      ["localhost", "http://localhost:8080/", "localhost"],
      ["private network", "http://foundryventures.railway.internal:8080/", "foundryventures.railway.internal"],
    ])("lets the healthcheck through on %s", (_label, url, host) => {
      const response = proxy(request(url, { host, proto: "http" }));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("moves the platform hostname to the canonical one, in one hop", () => {
      const response = proxy(
        request("https://foundryventures-production.up.railway.app/portfolio", {
          host: "foundryventures-production.up.railway.app",
          proto: "https",
        }),
      );
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(`${CANONICAL_ORIGIN}/portfolio`);
    });

    it("moves the bare apex to www", () => {
      const response = proxy(
        request("https://foundryventures.ai/", { host: APEX_HOST, proto: "https" }),
      );
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(`${CANONICAL_ORIGIN}/`);
    });

    it("passes a correct edge request straight through", () => {
      const response = proxy(
        request("https://www.foundryventures.ai/privacy", { host: CANONICAL_HOST, proto: "https" }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("when the flag is off", () => {
    it("never redirects on host, however the request arrived", () => {
      vi.stubEnv("FOUNDRY_ENFORCE_CANONICAL_HOST", "");
      for (const host of ["localhost", APEX_HOST, "foundryventures-production.up.railway.app"]) {
        expect(proxy(request("http://localhost:8080/", { host })).status).toBe(200);
      }
    });
  });
});

describe("legacy paths are unconditional", () => {
  it("410s the retired demo pages whether or not the flag is on", () => {
    for (const value of ["1", ""]) {
      vi.stubEnv("FOUNDRY_ENFORCE_CANONICAL_HOST", value);
      expect(proxy(request("https://www.foundryventures.ai/instructors")).status).toBe(410);
      expect(proxy(request("https://www.foundryventures.ai/pricing")).status).toBe(410);
    }
  });

  it("308s the migrated paths to the canonical origin", () => {
    vi.stubEnv("FOUNDRY_ENFORCE_CANONICAL_HOST", "1");
    expect(proxy(request("https://www.foundryventures.ai/home")).headers.get("location")).toBe(
      `${CANONICAL_ORIGIN}/`,
    );
  });
});

