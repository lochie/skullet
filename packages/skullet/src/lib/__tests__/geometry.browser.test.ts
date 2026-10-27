import { afterEach, describe, expect, it } from "vitest";
import { CHECKS, GEOMETRY_CASES } from "@skullet/test-cases";
import { forgetShapes, Ghost, Reveal } from "..";

const api = { Ghost, Reveal, forgetShapes };

afterEach(() => {
  document.body.replaceChildren();
});

for (const testCase of GEOMETRY_CASES) {
  describe(testCase.label, () => {
    for (const [name, check] of Object.entries(CHECKS)) {
      it(name, () => {
        const stage = document.body.appendChild(document.createElement("div"));
        const result = check(api, testCase, stage);
        expect(result.pass, result.detail).toBe(true);
      });
    }
  });
}
