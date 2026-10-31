// Safari 18 runs an older WebKit than any current Playwright ships, and it broke
// where the newer one didn't. Playwright 1.50 ships WebKit 18.2: this drives the
// built site in it, reloading every homepage demo and checking each stays drawn.
// Usage: pnpm e2e:safari18 [url] — the site served from `next start -p 3123` by default.
import { webkit } from "playwright";
import { PNG } from "pngjs";

const url = process.argv[2] ?? "http://localhost:3123/";
const failures = [];

// How much a screenshot's pixels vary — near 0 for a blank region
function spread(png) {
  const { data, width, height } = PNG.sync.read(png);
  let sum = 0;
  let squares = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += luma;
    squares += luma * luma;
  }
  const mean = sum / (width * height);
  return Math.sqrt(Math.max(squares / (width * height) - mean * mean, 0));
}

async function blanks(page, label) {
  const reveals = page.locator("[skullet-reveal]");
  for (let i = 0; i < (await reveals.count()); i++) {
    const box = await reveals.nth(i).boundingBox();
    if (!box || box.height < 20) continue;
    // Skipped when it moved since its box was read
    const shot = await page.screenshot({ clip: box }).catch(() => null);
    if (shot && spread(shot) <= 2) {
      failures.push(`reveal ${i} blank ${label}`);
    }
  }
}

const browser = await webkit.launch();
// Tall enough for every demo: a full-page screenshot resizes the viewport, which re-measures what it checks
const page = await browser.newPage({ viewport: { width: 1400, height: 2000 } });
console.log(`WebKit ${browser.version()} → ${url}`);
await page.goto(url);
await page.waitForTimeout(3000);

// Every card reloaded: each one sweeps its content in over its skeleton, the homepage's reveal
const cards = page.getByRole("button", { name: "Reload this demo" });
for (let i = 0; i < (await cards.count()); i++) {
  // In the top padding: clear of the rounded corner, and of anything inside that takes its own click
  await cards.nth(i).click({ position: { x: 40, y: 8 } });
}
const start = Date.now();
while (Date.now() - start < 2500) await blanks(page, "mid-sweep");
await page.waitForTimeout(1500);
await blanks(page, "after the sweep");

// Safari doesn't render an element whose filter points at nothing
const dangling = await page.evaluate(
  () =>
    [...document.querySelectorAll("[skullet-pane]")].filter((pane) => {
      const id = pane.style.filter.match(/#([\w-]+)/)?.[1];
      return id && !document.getElementById(id);
    }).length,
);
if (dangling) failures.push(`${dangling} panes filtered by a removed filter`);

await browser.close();
if (failures.length) {
  console.error([...new Set(failures)].join("\n"));
  process.exit(1);
}
console.log("Every demo stayed drawn.");
