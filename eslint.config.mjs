import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".data/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
  {
    rules: {
      // Unused values are a real signal in this codebase: a policy check or an
      // evidence field that is computed and then dropped is usually a bug.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Playwright and Node scripts run outside the Next.js runtime.
    files: ["tests/e2e/**/*.ts", "scripts/**/*.mjs", "*.config.ts", "*.config.mjs"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
