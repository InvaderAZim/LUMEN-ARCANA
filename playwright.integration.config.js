import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.LUMEN_LIVE_URL ||
  "https://lumen-arcana.kraplenii.workers.dev";

export default defineConfig({
  testDir: "./test/integration",
  timeout: 60_000,
  expect: {
    timeout: 12_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure"
  }
});
