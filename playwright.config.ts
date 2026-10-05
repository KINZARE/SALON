import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 10 * 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  outputDir: "qa-artifacts/playwright-results",
  reporter: [["list"], ["html", { outputFolder: "qa-artifacts/playwright-report", open: "never" }], ["json", { outputFile: "qa-artifacts/playwright.json" }]],
  use: {
    baseURL: process.env.QA_BASE_URL ?? "http://127.0.0.1:3000",
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 25_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "workspace", testMatch: "workspace.spec.mjs" },
    { name: "simplicity", testMatch: "simplicity.spec.mjs" },
    { name: "responsive", testMatch: "responsive.spec.mjs" },
    ...[320, 390, 768, 1440].map(width => ({ name: `migration-${width}`, testMatch: "migration.spec.mjs", use: { viewport: { width, height: 900 } } })),
  ],
});
