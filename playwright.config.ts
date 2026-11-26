import { defineConfig, devices } from "@playwright/test";

/**
 * V2 Phase 5.4a smoke tests (md files/V2-phase5-playwright-smoke-spec.md).
 *
 * Local: `npm run e2e:local` starts the whole stack (scripts/e2e-local.mjs) and runs this config.
 * The servers are expected at these URLs; override them to point the same suite at another stack.
 */
const LEGACY_URL = process.env.E2E_LEGACY_URL ?? "http://127.0.0.1:3101";
const COOKIE_URL = process.env.E2E_COOKIE_URL ?? "http://127.0.0.1:3102";
const channel = process.env.E2E_BROWSER_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./test-results",
  // Serial on purpose: one shared seeded database and a rate-limited backend.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    channel,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "public-desktop",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel, baseURL: LEGACY_URL },
    },
    {
      name: "public-mobile",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Pixel 7"], channel, baseURL: LEGACY_URL },
    },
    {
      name: "auth-legacy",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel, baseURL: LEGACY_URL },
      metadata: { authMode: "legacy" },
    },
    {
      name: "auth-cookie",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel, baseURL: COOKIE_URL },
      metadata: { authMode: "cookie" },
    },
    {
      name: "workspaces",
      testMatch: /workspaces\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel, baseURL: LEGACY_URL },
    },
  ],
});
