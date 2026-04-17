import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "workers/**",
      "e2e/**",
      "tests-e2e/**",
    ],
    coverage: {
      provider: "v8",
      include: ["components/**", "app/**", "utils/**"],
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.d.ts",
        "components/ui/**",
        "components/studio/constants.ts",
      ],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
