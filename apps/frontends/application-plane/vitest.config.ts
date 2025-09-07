import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
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
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
