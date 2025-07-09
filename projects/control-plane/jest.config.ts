import type { Config } from "jest";

const config: Config = {
  verbose: true,
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

export default config;
