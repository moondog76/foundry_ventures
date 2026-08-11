#!/usr/bin/env node
/**
 * Production deploy gate — environment and asset half (§16.8, §29, §31.6).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS SCRIPT DOES *NOT* CHECK
 *
 * The record-level checks — which company field is still `observed`, which home
 * paragraph is still `unapproved`, which placeholder image a published record
 * still points at — live in `buildIntegrityReport()` (`src/content/integrity.ts`)
 * and run from the Vitest content-integrity test. They need the TypeScript
 * content layer, and this repository has no runtime TypeScript loader: the app
 * is compiled by Next.js and the tests by Vitest, so a plain `node` script
 * cannot import `src/content/**` at all.
 *
 * Rather than pretend, this script owns the half a plain Node process *can*
 * verify honestly from the filesystem and the environment, and CI runs both:
 *
 *     pnpm test          → record-level field checks (Vitest)
 *     pnpm content:gate  → this script
 *
 * Neither is sufficient alone. The `production-gate` job in
 * `.github/workflows/ci.yml` runs this script plus
 * `node scripts/verify-brand-assets.mjs --strict`, and that job is what blocks a
 * production deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   node scripts/content-integrity.mjs      report + exit non-zero on any block
 *   pnpm content:gate                       same thing
 *
 * Secret *values* are never printed — only the variable name and whether it is
 * usable — so this output is safe to leave in a public CI log.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Mirrors EMAIL_PATTERN in src/lib/pitch/config.ts so the gate and the runtime agree. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The literal default in readPitchConfig(); its presence means "not configured". */
const DEV_FINGERPRINT_SALT = "foundry-dev-salt";

/* ------------------------------------------------------------------ Results */

/** @typedef {{ ok: boolean; label: string; detail?: string }} Line */
/** @typedef {{ id: string; title: string; lines: Line[] }} Check */

/** @type {Check[]} */
const checks = [];

/**
 * @param {string} id
 * @param {string} title
 * @param {Line[]} lines
 */
function record(id, title, lines) {
  checks.push({ id, title, lines });
}

const env = (name) => process.env[name]?.trim() ?? "";

/**
 * Reports only whether a secret is usable — never its value, not even a prefix.
 * @param {string} name
 * @param {string} why
 * @returns {Line}
 */
function requireSecret(name, why) {
  const value = env(name);
  return value
    ? { ok: true, label: `${name} is set` }
    : { ok: false, label: `${name} is missing`, detail: why };
}

/* -------------------------------------------------------------- 1. Policy */

function checkPolicyMode() {
  const value = env("FOUNDRY_POLICY_MODE");
  record("policy-mode", "Publication policy is forced to production", [
    value === "production"
      ? { ok: true, label: 'FOUNDRY_POLICY_MODE="production"' }
      : {
          ok: false,
          label: `FOUNDRY_POLICY_MODE is ${value === "" ? "unset" : `"${value}"`}, needs "production"`,
          detail:
            "Left to inference the mode falls back to NODE_ENV, and a build run outside a production runtime would render unapproved records.",
        },
  ]);
}

/* ------------------------------------------------------------ 2. Fixtures */

function checkFixtures() {
  /** @type {Line[]} */
  const lines = [];
  for (const name of ["FOUNDRY_CONTENT_FIXTURE", "FOUNDRY_ALLOW_FIXTURES"]) {
    const value = env(name);
    lines.push(
      value === ""
        ? { ok: true, label: `${name} is unset` }
        : {
            ok: false,
            label: `${name}="${value}" is set`,
            detail:
              "src/content/seed/fixtures.ts is fictional test data. It must never reach a public deployment.",
          },
    );
  }
  record("fixtures", "Synthetic e2e fixtures are disabled", lines);
}

/* -------------------------------------------------------- 3. Canonical host */

function checkCanonicalHost() {
  const value = env("FOUNDRY_ENFORCE_CANONICAL_HOST");
  record("canonical-host", "Canonical host normalisation is enabled", [
    value === "1"
      ? { ok: true, label: 'FOUNDRY_ENFORCE_CANONICAL_HOST="1"' }
      : {
          ok: false,
          label: `FOUNDRY_ENFORCE_CANONICAL_HOST is ${value === "" ? "unset" : `"${value}"`}, needs "1"`,
          detail:
            "Without it the apex host and plain HTTP serve the site directly, duplicating every canonical URL (src/proxy.ts).",
        },
  ]);
}

/* ---------------------------------------------------- 4. Privileged secrets */

function checkPrivilegedSecrets() {
  record("privileged-secrets", "Privileged endpoints are configured", [
    requireSecret(
      "DRAFT_MODE_SECRET",
      "Without it /api/draft/enable answers 404 and no editor can review unapproved content before it is approved.",
    ),
    requireSecret(
      "SANITY_WEBHOOK_SECRET",
      "Without it POST /api/revalidate answers 404 and published edits never invalidate the static pages.",
    ),
  ]);
}

/* --------------------------------------------------------- 5. Pitch pipeline */

/**
 * Deliberately duplicates checkPitchReadiness() from src/lib/pitch/config.ts
 * rather than importing it (that module is `server-only` TypeScript). Keep the
 * two in step: this gate is what stops a deploy, that function is what hides the
 * form at runtime, and they must never disagree about what "ready" means.
 */
function checkPitchPipeline() {
  /** @type {Line[]} */
  const lines = [];

  const recipients = env("PITCH_RECIPIENTS")
    .split(/[,;]/)
    .map((value) => value.trim())
    .filter((value) => EMAIL_PATTERN.test(value));
  lines.push(
    recipients.length > 0
      ? { ok: true, label: `PITCH_RECIPIENTS resolves to ${recipients.length} valid address(es)` }
      : {
          ok: false,
          label: "PITCH_RECIPIENTS has no valid address",
          detail:
            "A public pitch form with no recipient accepts submissions and loses them. Entries that fail the email pattern are dropped silently at runtime.",
        },
  );

  for (const [name, why] of [
    [
      "PITCH_ESCALATION_EMAIL",
      "Dead-lettered notifications would fail silently with nowhere to escalate.",
    ],
    ["PITCH_FROM_EMAIL", "The email provider needs a verified sender address."],
  ]) {
    const value = env(name);
    if (value === "") {
      lines.push({ ok: false, label: `${name} is missing`, detail: why });
    } else if (!EMAIL_PATTERN.test(value)) {
      lines.push({
        ok: false,
        label: `${name} is not a valid email address`,
        detail: "The runtime discards it and behaves exactly as if it were unset.",
      });
    } else {
      lines.push({ ok: true, label: `${name} is set and well-formed` });
    }
  }

  lines.push(
    requireSecret(
      "RESEND_API_KEY",
      "Without a provider key the notifier falls back to the `log` driver, which only writes a console line.",
    ),
  );

  const salt = env("PITCH_FINGERPRINT_SALT");
  if (salt === "") {
    lines.push({
      ok: false,
      label: "PITCH_FINGERPRINT_SALT is missing",
      detail: "The runtime falls back to the shared development salt.",
    });
  } else if (salt === DEV_FINGERPRINT_SALT) {
    lines.push({
      ok: false,
      label: "PITCH_FINGERPRINT_SALT is still the development default",
      detail: "A shared salt makes submitter fingerprints correlatable across environments.",
    });
  } else {
    lines.push({ ok: true, label: "PITCH_FINGERPRINT_SALT is set to a deployment-specific value" });
  }

  const driver = env("PITCH_STORE_DRIVER");
  lines.push(
    driver === "memory"
      ? {
          ok: false,
          label: 'PITCH_STORE_DRIVER="memory"',
          detail: "The in-memory store loses every submission on restart.",
        }
      : {
          ok: true,
          label: `PITCH_STORE_DRIVER=${driver === "" ? '"file" (default)' : `"${driver}"`}`,
        },
  );

  record("pitch", "Pitch conversion path can actually deliver a submission", lines);
}

/* ------------------------------------------------------------ 6. Brand SVGs */

function checkBrandAssets() {
  const script = path.join(REPO_ROOT, "scripts", "verify-brand-assets.mjs");
  const result = spawnSync(process.execPath, [script, "--strict"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

  // Reuse the existing verifier rather than duplicating the Appendix A.1 hashes:
  // two copies of a manifest are two chances for one of them to drift.
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (result.error) {
    record("brand-assets", "Delivered brand SVGs match the Appendix A.1 manifest", [
      {
        ok: false,
        label: "scripts/verify-brand-assets.mjs could not be run",
        detail: result.error.message,
      },
    ]);
    return;
  }

  const ok = result.status === 0;
  record("brand-assets", "Delivered brand SVGs match the Appendix A.1 manifest", [
    ok
      ? { ok: true, label: "verify-brand-assets --strict passed" }
      : {
          ok: false,
          label: "verify-brand-assets --strict failed",
          detail:
            "The five SVG masters are delivered out of band and are not in this repository. Copy them byte-for-byte into public/brand/ — the logotype must never be recreated with text or edited.",
        },
    ...output.map((line) => ({ ok, label: `  ${line}` })),
  ]);
}

/* ----------------------------------------------------- 7. Placeholder artwork */

/**
 * Every line in a file that creates a placeholder image asset.
 *
 * Two spellings count as a placeholder: a call to the `placeholder()` factory in
 * `seed/images.ts`, and a hand-written `isPlaceholder: true` anywhere else. The
 * one `isPlaceholder: true` *inside* the factory body is skipped — it is the
 * definition, and its products are already counted at their call sites, so
 * counting both would report the same asset twice.
 *
 * @param {string} source
 * @returns {Array<{ line: number; text: string }>}
 */
function findPlaceholderReferences(source) {
  const lines = source.split("\n");

  // Locate the body of `function placeholder(...)`, if the file declares one.
  let factoryStart = -1;
  let factoryEnd = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!/function\s+placeholder\s*\(/.test(lines[i])) continue;
    factoryStart = i;

    // Braces are only counted after the parameter list closes: a default value
    // such as `options: Partial<ImageAsset> = {}` would otherwise open and close
    // the body on the signature line and end the scan before it started.
    let parenDepth = 0;
    let inParams = true;
    let braceDepth = 0;
    let bodyOpened = false;

    for (let j = i; j < lines.length; j += 1) {
      for (const character of lines[j]) {
        if (inParams) {
          if (character === "(") parenDepth += 1;
          else if (character === ")") {
            parenDepth -= 1;
            if (parenDepth === 0) inParams = false;
          }
          continue;
        }
        if (character === "{") {
          braceDepth += 1;
          bodyOpened = true;
        } else if (character === "}") {
          braceDepth -= 1;
        }
      }
      if (bodyOpened && braceDepth <= 0) {
        factoryEnd = j;
        break;
      }
    }
    break;
  }

  const insideFactory = (index) =>
    factoryStart !== -1 && factoryEnd !== -1 && index >= factoryStart && index <= factoryEnd;

  /** @type {Array<{ line: number; text: string }>} */
  const found = [];
  lines.forEach((text, index) => {
    const isFactoryCall = /=\s*placeholder\(/.test(text);
    const isLiteralFlag = /isPlaceholder:\s*true/.test(text);
    if (!isFactoryCall && !isLiteralFlag) return;
    if (isLiteralFlag && !isFactoryCall && insideFactory(index)) return;
    found.push({ line: index + 1, text: text.trim() });
  });
  return found;
}

/**
 * Foundry-owned stand-in artwork is rights-clear, so nothing at runtime stops it
 * rendering — which is exactly why it needs a gate of its own.
 */
function checkPlaceholderArtwork() {
  const seedDir = path.join(REPO_ROOT, "src", "content", "seed");
  /** @type {Line[]} */
  const lines = [];
  /** @type {string[]} */
  const hits = [];

  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.endsWith(".ts")) continue;
      const relative = path.relative(REPO_ROOT, full);
      for (const hit of findPlaceholderReferences(readFileSync(full, "utf8"))) {
        hits.push(`${relative}:${hit.line}  ${hit.text}`);
      }
    }
  };

  walk(seedDir);

  if (hits.length === 0) {
    lines.push({ ok: true, label: "No placeholder artwork is referenced by the seed content" });
  } else {
    lines.push({
      ok: false,
      label: `${hits.length} placeholder image reference(s) still in the seed content`,
      detail:
        'Foundry-owned stand-in artwork renders because its rights are clear. Replace each with the licensed original (rightsStatus: "approved", available: true) and drop the isPlaceholder flag.',
    });
    for (const hit of hits) lines.push({ ok: false, label: `  ${hit}` });
  }

  // The files themselves are only informational: they are what the references
  // above point at, and they are harmless once nothing references them.
  const publicPlaceholders = path.join(REPO_ROOT, "public", "images", "placeholder");
  if (existsSync(publicPlaceholders)) {
    const files = readdirSync(publicPlaceholders).filter((f) => !f.startsWith("."));
    if (files.length > 0) {
      lines.push({
        ok: true,
        label: `  (public/images/placeholder/ holds ${files.length} file(s): ${files.join(", ")})`,
      });
    }
  }

  record("placeholder-artwork", "No placeholder artwork ships to production", lines);
}

/* ------------------------------------------------------------------- Report */

function report() {
  const width = 78;
  const failing = checks.filter((check) => check.lines.some((line) => !line.ok));

  console.log("");
  console.log("Foundry Ventures — production content gate");
  console.log("=".repeat(width));
  console.log("Environment and asset checks. Record-level field checks run separately");
  console.log("in the Vitest content-integrity test (`pnpm test`); CI runs both.");
  console.log("");

  for (const check of checks) {
    const checkOk = check.lines.every((line) => line.ok);
    console.log(`${checkOk ? "PASS" : "FAIL"}  ${check.title}  [${check.id}]`);
    for (const line of check.lines) {
      console.log(`      ${line.ok ? "·" : "✗"} ${line.label}`);
      if (line.detail) console.log(`        ${line.detail}`);
    }
    console.log("");
  }

  console.log("-".repeat(width));

  if (failing.length === 0) {
    console.log(`All ${checks.length} checks passed. This deployment may serve production.`);
    console.log("");
    return 0;
  }

  console.log(`${failing.length} of ${checks.length} checks block a production deploy:`);
  for (const check of failing) console.log(`  - ${check.id}: ${check.title}`);
  console.log("");
  console.log("Every item above is a launch decision, not a build error. See");
  console.log("docs/content-gaps.md for who owns each one and .env.example for the");
  console.log("variables this gate reads.");
  console.log("");
  return 1;
}

/* --------------------------------------------------------------------- Run */

checkPolicyMode();
checkFixtures();
checkCanonicalHost();
checkPrivilegedSecrets();
checkPitchPipeline();
checkBrandAssets();
checkPlaceholderArtwork();

process.exit(report());
