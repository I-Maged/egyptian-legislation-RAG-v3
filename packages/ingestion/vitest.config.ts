import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "ingestion-parser",
    environment: "node",
    include: ["src/parser/**/*.{test,spec}.?(c|m)[jt]s"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    watch: false,
  },
});
