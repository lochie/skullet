import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// One source for the stylesheet: the string the library injects at runtime
const { SKELE_CSS } = await import(resolve(root, "dist/index.mjs"));
writeFileSync(resolve(root, "dist/styles.css"), `${SKELE_CSS.trim()}\n`);
