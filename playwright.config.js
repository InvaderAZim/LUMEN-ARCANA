import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/ui",
  timeout: 30_000,
  expect: {
    timeout: 7_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:8787",
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --port 8787",
    url: "http://127.0.0.1:8787/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
