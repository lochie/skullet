import { afterEach, describe, expect, it } from "vitest";
import { measureBones } from "..";

const mount = (markup: string) => {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = "position: relative; width: 240px";
  root.innerHTML = markup;
  return root;
};

const imageBone = (root: HTMLElement) =>
  measureBones(root, root, { mark: false }).find((bone) => bone.height > 50)!;

afterEach(() => document.body.replaceChildren());

describe("a block in a rounded box that clips", () => {
  it("takes the corners it sits in, and only those", () => {
    const root = mount(`
      <div style="border-radius: 16px; overflow: hidden">
        <a style="display: block">
          <img style="display: block; width: 100%; height: 120px">
          <span>Title</span>
        </a>
      </div>`);
    expect(imageBone(root).radius).toBe("16px 16px 0px 0px");
  });

  it("keeps its own corners where nothing rounds it", () => {
    const root = mount(`
      <div style="overflow: hidden">
        <img style="display: block; width: 100%; height: 120px; border-radius: 4px">
      </div>`);
    expect(imageBone(root).radius).toBe("4px");
  });

  it("keeps the larger of its own corner and the box's", () => {
    const root = mount(`
      <div style="border-radius: 8px; overflow: hidden">
        <img style="display: block; width: 100%; height: 120px; border-radius: 12px">
      </div>`);
    expect(imageBone(root).radius).toBe("12px 12px 12px 12px");
  });
});
