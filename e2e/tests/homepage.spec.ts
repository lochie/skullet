import { expect, test, type Page } from "@playwright/test";
import { spread } from "./pixels";

// The demo grid's reveals — one per demo, four in the stats card
const reveals = (page: Page) => page.locator("[skullet-reveal]");

// SVG's own animations, which Playwright's `animations: "disabled"` doesn't reach — held at their first frame
const holdSvg = (page: Page) =>
  page.evaluate(() => {
    for (const svg of document.querySelectorAll("svg")) {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
    }
  });

// Images from the network, which no golden can hold still
const remote = (page: Page) => [
  page.locator('img[src^="http"]'),
  page.locator('img[src*="picsum"]'),
];

test("loads and hydrates without a console error", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  // A failed request is reported below, by its URL
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !m.text().startsWith("Failed to load resource") &&
      errors.push(m.text()),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  // The site's own requests only — other hosts may turn a headless browser away. Vercel's analytics only exist on Vercel
  page.on(
    "response",
    (r) =>
      r.status() >= 400 &&
      r.url().startsWith(baseURL!) &&
      !r.url().includes("/_vercel/") &&
      errors.push(`${r.status()} ${r.url()}`),
  );
  await page.goto("/");
  await page.waitForTimeout(3000);
  expect(errors).toEqual([]);
});

test("every skeleton is drawn, before any data", async ({ page }) => {
  // Frozen timers: the demos' data never arrives
  const now = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: now });
  // A second ahead: before the page loads no timer exists to fire, and a nearer moment can already have passed
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await holdSvg(page);
  await expect(page).toHaveScreenshot("skeletons.png", {
    animations: "disabled",
    mask: remote(page),
  });
});

test("every demo settles into its content", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(4000);
  await holdSvg(page);
  await expect(page).toHaveScreenshot("loaded.png", {
    animations: "disabled",
    mask: remote(page),
  });
});

// The bug class only pixels show: a pane masked, filtered or faded to nothing while it's meant to be on screen
test("no demo is ever blank while it reveals", async ({ page }) => {
  // Tall enough for every demo: a full-page screenshot resizes the viewport, which re-measures what it's checking
  await page.setViewportSize({ width: 1400, height: 2000 });
  await page.goto("/");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Reload", exact: true }).click();
  const count = await reveals(page).count();
  const start = Date.now();
  while (Date.now() - start < 2500) {
    for (let i = 0; i < count; i++) {
      const reveal = reveals(page).nth(i);
      const box = await reveal.boundingBox();
      if (!box || box.height < 20) continue;
      // Skipped when it moved since its box was read
      const shot = await page.screenshot({ clip: box }).catch(() => null);
      if (!shot) continue;
      expect(
        spread(shot),
        `reveal ${i} blank ${Date.now() - start}ms after reload`,
      ).toBeGreaterThan(2);
    }
  }
});
