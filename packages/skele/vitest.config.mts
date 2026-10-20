import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Geometry needs real layout, which happy-dom doesn't have — `*.browser.test.*` runs in Chromium and WebKit, for Safari
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.browser.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        plugins: [svelte()],
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: "chromium" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
