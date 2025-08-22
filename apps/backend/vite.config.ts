/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import env from "vite-plugin-env-compatible";

export default defineConfig({
  plugins: [env()],
});
