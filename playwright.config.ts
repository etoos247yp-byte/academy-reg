import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      TEST_MODE: "true",
      SESSION_SECRET: "test-secret-key-at-least-32-characters-long!!",
      PATH: process.env.PATH ?? "",
    },
  },
});
