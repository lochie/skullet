import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcSvelte = resolve(root, "src/svelte");
const distSvelte = resolve(root, "dist/svelte");

mkdirSync(distSvelte, { recursive: true });

// Copy .svelte sources to dist, rewriting the relative core import to 'skele'
const components = readdirSync(srcSvelte).filter((f) => f.endsWith(".svelte"));
for (const file of components) {
  const source = readFileSync(resolve(srcSvelte, file), "utf8");
  writeFileSync(
    resolve(distSvelte, file),
    source.replaceAll(`from '../lib'`, `from 'skele'`),
  );
}

// Create JS entry files that re-export from the .svelte files
const entry = components
  .map(
    (file) =>
      `export { default as ${basename(file, ".svelte")} } from "./${file}";\n`,
  )
  .join("");
writeFileSync(resolve(distSvelte, "index.mjs"), entry);
writeFileSync(resolve(distSvelte, "index.js"), entry);
