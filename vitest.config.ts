/**
 * Vitest configuration for the unit and component suites (§26.1, §26.2).
 *
 * Playwright owns `tests/e2e`, so the include patterns below name the two
 * directories Vitest owns explicitly rather than excluding the third — a new
 * `tests/**` directory should not silently become a Vitest suite.
 */

import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // `vite-tsconfig-paths` resolves the "@/*" alias straight from tsconfig.json,
  // so the alias can never drift between the app build and the test run.
  plugins: [tsconfigPaths(), react()],

  resolve: {
    alias: {
      /*
       * `server-only` is a marker package whose default entry point throws on
       * import; only the "react-server" condition resolves to the empty module.
       * Vitest runs under the plain Node condition, so a module that guards
       * itself with `import "server-only"` (the pitch store and outbox) could
       * not be unit-tested at all without this mapping. It substitutes the
       * package's own no-op entry point — nothing is stubbed or faked.
       */
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    // Suites mutate process.env (policy mode, fixture switches) and module-level
    // caches, so they must not share a worker's global state.
    isolate: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
