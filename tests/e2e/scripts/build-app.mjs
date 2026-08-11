#!/usr/bin/env node
/**
 * Builds the app twice for the end-to-end suite — once per dataset.
 *
 * Why two builds
 * --------------
 * Marketing routes, team pages and company details are **prerendered** (§4.3),
 * so the dataset a page shows is decided at build time, not per request. An
 * earlier version of this script assumed `draftMode()` on the render path would
 * keep every page dynamic and let one build serve two datasets; it does not —
 * `next build` reports these routes as static, and the server's environment
 * cannot change what has already been rendered.
 *
 * Rather than force the whole site to render per request (which would trade the
 * spec's prerendering strategy for test convenience), the suite builds:
 *
 *   .next                  the real, shipping dataset — what production builds
 *   .next-e2e-fixture      the synthetic fixture dataset
 *
 * `next.config.ts` reads `NEXT_DIST_DIR`, so the same variable selects the
 * output directory for both `next build` and `next start`.
 *
 * Fixture safety
 * --------------
 * The fixture switches are set for the fixture build **only**, and that build
 * lands in a directory that is git-ignored and never deployed. The default
 * `.next` build never sees them, so no deployable artefact can contain an
 * invented company name, quote or statistic.
 *
 * Both builds pin `FOUNDRY_POLICY_MODE=production` so the suite exercises the
 * real publishing policy rather than the permissive preview path.
 *
 * Run indirectly by `playwright.config.ts`; safe to run by hand.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FIXTURE_DIST_DIR, REAL_DIST_DIR } from "./dist-dirs.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function runBuild(label, extraEnv) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    // Start from a clean slate so an inherited CI value cannot leak across.
    delete env.FOUNDRY_CONTENT_FIXTURE;
    delete env.FOUNDRY_ALLOW_FIXTURES;
    Object.assign(env, { FOUNDRY_POLICY_MODE: "production", ...extraEnv });

    console.info(`[e2e] building ${label} → ${env.NEXT_DIST_DIR ?? ".next"}`);

    const child = spawn("pnpm", ["exec", "next", "build"], {
      cwd: repoRoot,
      env,
      stdio: "inherit",
      // `pnpm` is a shell script on Windows; this keeps the invocation portable.
      shell: process.platform === "win32",
    });

    child.on("error", (error) => reject(new Error(`could not start the build: ${error.message}`)));
    child.on("exit", (code, signal) => {
      if (signal) return reject(new Error(`${label} build terminated by signal ${signal}`));
      if (code !== 0) return reject(new Error(`${label} build exited with code ${code}`));
      resolve();
    });
  });
}

try {
  // Real dataset first: the fixture server waits on this process, and the
  // real-dataset server waits on the fixture server, so ordering is preserved.
  await runBuild("real dataset", { NEXT_DIST_DIR: REAL_DIST_DIR });
  await runBuild("fixture dataset", {
    NEXT_DIST_DIR: FIXTURE_DIST_DIR,
    FOUNDRY_CONTENT_FIXTURE: "e2e",
    FOUNDRY_ALLOW_FIXTURES: "1",
  });
} catch (error) {
  console.error(`[e2e] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
