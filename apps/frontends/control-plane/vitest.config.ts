import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    setupFiles: ["./setupTests.ts"],
    server: {
      deps: {
        inline: ["@emotion/styled"],
      },
    },
    globals: true,
    environment: "jsdom",
    pool: "vmThreads",
    deps: {
      web: {
        transformCss: true,
      },
    },
  },
});
