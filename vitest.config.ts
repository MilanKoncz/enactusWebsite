import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // next's package.json has no "exports" map, so Vite's strict ESM
      // resolver can't find the "next/navigation" subpath the way
      // Next's own webpack/turbopack resolution does. next-intl's
      // navigation helpers import it unconditionally (even just for
      // Link), so this alias is needed for any test that touches them.
      "next/navigation": fileURLToPath(new URL("./node_modules/next/navigation.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    globals: true,
    server: {
      // Without this, next-intl (a node_modules package) is externalized and
      // resolves "next/navigation" via plain Node resolution, bypassing the
      // alias above entirely.
      deps: { inline: [/next-intl/] },
    },
  },
});
