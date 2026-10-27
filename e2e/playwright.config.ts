import { defineConfig, devices } from "@playwright/test";

const viewport = { width: 1400, height: 1000 };

// Runs against a production build of the site: `pnpm site:build` first
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Golden screenshots are per platform and committed from macOS; CI runs the checks that hold anywhere
  ignoreSnapshots: !!process.env.CI,
  use: { baseURL: "http://localhost:3123" },
  // Tight enough that a changed mascot or header fails — the page is mostly demos, so 1% hid them
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport } },
  ],
  webServer: {
    command: "pnpm --filter=site exec next start -p 3123",
    url: "http://localhost:3123",
    reuseExistingServer: true,
  },
});
