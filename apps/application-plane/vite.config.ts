/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
// import tailwindcss from "@tailwindcss/vite";
// import tsconfigPaths from "vite-tsconfig-paths";
// import devtoolsJson from "vite-plugin-devtools-json";
// import env from "vite-plugin-env-compatible";
// import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    // tailwindcss(),
    reactRouter(),
    // tsconfigPaths({}),
    // devtoolsJson(),
    // env(),
  ],
});
