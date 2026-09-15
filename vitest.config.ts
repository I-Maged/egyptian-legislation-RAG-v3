import { defineConfig, mergeConfig } from "vitest/config";

// NOTE: explicit `.mts` extension is required by Vite's native config loader (plain Node `import()`).
// @ts-expect-error TS5097: `allowImportingTsExtensions` can't be enabled because `npm run build` uses `tsc` emit.
import webConfig from "./apps/web/vitest.config.mts";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "packages",
          root: ".",
          include: ["packages/**/*.{test,spec}.?(c|m)[jt]s"],
          exclude: ["**/node_modules/**", "**/dist/**"],
        },
      },
      mergeConfig({ test: { name: "web", root: "./apps/web" } }, webConfig),
    ],
  },
});
