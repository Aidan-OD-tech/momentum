import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" throws outside a Next.js server build; tests import server files directly.
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
