import fs from "node:fs";
import path from "node:path";
import { getDownloads } from "@/components/docs-layout/downloads";
import { Lab } from "@/surfaces/playground/lab";

// Written by `scripts/bundle-sizes.mjs` and gitignored, so it may not exist.
// cwd is the site through the workspace, the repo root when next runs directly.
function readBundleSizes() {
  const root = fs.existsSync("packages") ? "." : "..";
  const file = path.join(
    root,
    "site/src/surfaces/playground/bundle-sizes.json",
  );

  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
}

export default async function Page() {
  return (
    <Lab bundleSizes={readBundleSizes()} downloads={await getDownloads()} />
  );
}
