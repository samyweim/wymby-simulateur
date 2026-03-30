import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@wymby/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@wymby/config": resolve(__dirname, "../../packages/config/src/index.ts"),
      "@wymby/engine": resolve(__dirname, "../../packages/engine/src/index.ts"),
      "@test-cases": resolve(__dirname, "../../test_cases_2026.ts"),
    },
  },
});
