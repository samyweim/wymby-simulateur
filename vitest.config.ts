import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    conditions: ["source", "import", "module", "browser", "default"],
    alias: {
      "@wymby/types": resolve(__dirname, "packages/types/src/index.ts"),
      "@wymby/config": resolve(__dirname, "packages/config/src/index.ts"),
      "@wymby/engine": resolve(__dirname, "packages/engine/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/src/**/*.test.ts", "packages/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
