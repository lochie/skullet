import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// One source for the stylesheet: the string the library injects at runtime
const { SKULLET_CSS } = await import(
  pathToFileURL(resolve(root, "dist/index.mjs")).href
);
writeFileSync(resolve(root, "dist/styles.css"), `${SKULLET_CSS.trim()}\n`);
