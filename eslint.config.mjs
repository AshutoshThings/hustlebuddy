import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Extension scripts share top-level names across files through the
  // manifest (config.js defines APP_ORIGIN, extract.js a function used by
  // content.js), so "unused" there means "used by another script".
  {
    files: ["extension/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^(APP_ORIGIN|extractJobDetails)$" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Built extension output (scripts/build-extension.mjs).
    "dist/**",
  ]),
]);

export default eslintConfig;
