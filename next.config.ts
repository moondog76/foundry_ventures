import type { NextConfig } from "next";

/**
 * Security headers (§23).
 *
 * The CSP is deliberately tight: no third-party scripts are loaded at all
 * (§22.4), so `script-src` needs only 'self'. Next.js injects inline bootstrap
 * scripts and inline styles, which is why 'unsafe-inline' appears for those two
 * directives; everything else is locked down.
 *
 * HSTS is intentionally absent until the canonical host and all subdomains are
 * verified over HTTPS (§23) — enabling it early is hard to undo.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  // Rich-text embeds are provider-allowlisted in code; mirror that here.
  "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.loom.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Marketing pages and CMS details are prerendered (§4.3), which means the
   * dataset a page shows is fixed at build time. The end-to-end suite needs two
   * datasets — the real one and a synthetic fixture set — so it produces two
   * builds into two output directories and points a server at each.
   * Production always uses the default.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  images: {
    formats: ["image/avif", "image/webp"],
    // No remote patterns: live Squarespace assets are export references and are
    // never hotlinked in production (§5.5, Appendix A.2).
    remotePatterns: [],
    // SVG is only ever served unoptimised, from our own /public.
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Draft preview must never be cached or indexed (§6.4, §21.4).
        source: "/api/draft/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  // Legacy redirects live in `src/middleware.ts` so that host normalisation and
  // path rewrites resolve in a single hop and `/instructors` + `/pricing` can
  // answer 410 rather than 3xx (§15.2).
};

export default nextConfig;
