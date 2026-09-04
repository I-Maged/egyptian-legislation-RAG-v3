import { defineConfig, mergeConfig } from "vitest/config";

import webConfig from "./apps/web/vitest.config";

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
