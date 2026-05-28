import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração Playwright — testes E2E dos caminhos críticos.
 *
 * Comportamento:
 *  - `npm run e2e`         → dev server em background + roda chromium
 *  - `npm run e2e:ui`      → modo interativo
 *  - `npm run e2e:report`  → abre relatório HTML
 *
 * Em CI (env CI=true) roda em headless com 1 retry e mais paralelismo.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile",   use: { ...devices["iPhone 13"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 5173",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
