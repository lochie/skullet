// @vitest-environment node
import { expect, it } from "vitest";
import {
  committed,
  inlineScript,
  source,
} from "../../../scripts/build-inline.mjs";

it("inline.generated.ts is built from the current boot.ts", async () => {
  expect(committed(), "run `node scripts/build-inline.mjs`").toBe(
    source(await inlineScript()),
  );
});
