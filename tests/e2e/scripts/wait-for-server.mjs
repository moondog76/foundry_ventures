#!/usr/bin/env node
/**
 * Blocks until the URL given as the first argument answers.
 *
 * The real-dataset server (port 3101) serves the *same* build as the fixture
 * server (port 3000), so it must not start before that build exists. Playwright
 * starts `webServer` entries in order, but this makes the dependency explicit
 * and safe even if that ever changes: waiting for the fixture server to respond
 * proves both that the build finished and that it is servable.
 *
 * Any HTTP response counts — a 404 or a 500 still means Next is up.
 */

const TIMEOUT_MS = 10 * 60_000;
const POLL_INTERVAL_MS = 1_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("[e2e] wait-for-server.mjs needs a URL argument");
    return 1;
  }

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      // `HEAD` is enough, and avoids rendering a page just to prove liveness.
      await fetch(target, { method: "HEAD" });
      console.info(`[e2e] ${target} is up; starting the real-dataset server`);
      return 0;
    } catch {
      // Not listening yet — the build is still running.
      await sleep(POLL_INTERVAL_MS);
    }
  }

  console.error(`[e2e] timed out after ${TIMEOUT_MS / 1000}s waiting for ${target}`);
  return 1;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`[e2e] wait-for-server.mjs failed: ${error?.message ?? error}`);
    process.exit(1);
  },
);
