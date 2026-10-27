import { bonesIn } from "@skullet/test-cases";
import { afterEach, describe, expect, it } from "vitest";
import { Ghost } from "..";

afterEach(() => {
  document.body.replaceChildren();
});

// Where the type's lines fall, measured the same way a browser lays the text out
function lines(text: Element) {
  const style = getComputedStyle(text);
  const context = document.createElement("canvas").getContext("2d")!;
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const box = context.measureText("H");
  const range = document.createRange();
  range.selectNodeContents(text);
  const rect = range.getClientRects()[0]!;
  const baseline =
    rect.top +
    (rect.height - box.fontBoundingBoxAscent - box.fontBoundingBoxDescent) / 2 +
    box.fontBoundingBoxAscent;
  return {
    baseline,
    capHeight: box.actualBoundingBoxAscent,
    xHeight: context.measureText("xz").actualBoundingBoxAscent,
    ascender: context.measureText("bdfhkl").actualBoundingBoxAscent,
    descender: context.measureText("gjpqy").actualBoundingBoxDescent,
  };
}

function bar(rules: string) {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = `font: 40px/2 sans-serif; ${rules}`;
  root.innerHTML = `<div skullet-ghost><span>Typography</span></div>`;
  new Ghost(root, { exact: true }).destroy();
  const type = lines(root.querySelector("span")!);
  const rect = bonesIn(root)[0]!.getBoundingClientRect();
  return { rect, type };
}

describe("typography rules", () => {
  it("runs from ascender to descender by default — hanging letters included", () => {
    const { rect, type } = bar("");
    expect(rect.top).toBeCloseTo(type.baseline - type.ascender, 0);
    expect(rect.bottom).toBeCloseTo(type.baseline + type.descender, 0);
  });

  it("follows the rules it is given", () => {
    const { rect, type } = bar(
      "--skullet-text-top: x-height; --skullet-text-bottom: baseline",
    );
    expect(rect.top).toBeCloseTo(type.baseline - type.xHeight, 0);
    expect(rect.bottom).toBeCloseTo(type.baseline, 0);
  });

  it("stops at cap height when asked", () => {
    const { rect, type } = bar("--skullet-text-top: cap-height");
    expect(rect.top).toBeCloseTo(type.baseline - type.capHeight, 0);
  });

  it("ignores a rule it doesn't know", () => {
    const { rect, type } = bar("--skullet-text-top: shoulder");
    expect(rect.top).toBeCloseTo(type.baseline - type.ascender, 0);
  });
});
