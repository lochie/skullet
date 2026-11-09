import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { BrowserCommand } from "vitest/node";

// DOM nodes still alive after a forced collection, which only Chromium's CDP can report
const liveNodes: BrowserCommand<[]> = async ({ context, page }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  for (let i = 0; i < 3; i++) await cdp.send("HeapProfiler.collectGarbage");
  const { metrics } = await cdp.send("Performance.getMetrics");
  await cdp.detach();
  return metrics.find((metric) => metric.name === "Nodes")!.value;
};

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
            commands: { liveNodes },
            instances: [
              { browser: "chromium" },
              { browser: "webkit" },
              { browser: "firefox" },
            ],
          },
        },
      },
    ],
  },
});
