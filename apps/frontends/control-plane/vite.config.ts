/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import env from "vite-plugin-env-compatible";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
  plugins: [reactRouter(), env(), devtoolsJson()],
});
