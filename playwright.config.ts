import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Mobile Safari (WebKit) worker processes crashed outright (exit code
  // 3221226505 — STATUS_STACK_BUFFER_OVERRUN on Windows) under Playwright's
  // auto-detected worker count on a CI-sized runner; a single-worker rerun
  // of the exact same suite was clean. Not a real test failure retries can
  // paper over — the worker itself dies — so cap parallelism on CI instead.
  // Left uncapped locally, where a developer's own machine and worker count
  // aren't the thing this is guarding.
  workers: process.env.CI ? 2 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
