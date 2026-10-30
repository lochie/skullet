import { afterEach, describe, expect, it } from "vitest";
import { measureBones } from "..";

const mount = (markup: string) => {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = "position: relative; width: 300px";
  root.innerHTML = markup;
  return root;
};

const bones = (root: HTMLElement) => measureBones(root, root, { mark: false });

afterEach(() => document.body.replaceChildren());

describe("what an inset shadow paints", () => {
  it("draws a one-sided hairline as a divider, measuring what's inside", () => {
    const root = mount(`
      <div style="display: flex; gap: 8px; padding: 12px 0; box-shadow: inset 0 -1px 0 #333">
        <span style="display: block; width: 32px; height: 32px; border-radius: 50%; background: #888"></span>
        <span>Lochie</span>
      </div>`);
    const drawn = bones(root);
    expect(drawn).toHaveLength(2);
    expect(drawn.every((bone) => bone.width < 100)).toBe(true);
  });

  it("draws a ring all the way round as a surface, one block around its label", () => {
    const root = mount(`
      <span style="display: inline-block; padding: 4px 10px; box-shadow: inset 0 0 0 1px #333">Chip</span>`);
    const drawn = bones(root);
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.height).toBeGreaterThan(20);
  });

  it("draws any blurred shadow as a surface", () => {
    const root = mount(`
      <span style="display: inline-block; padding: 4px 10px; box-shadow: 0 2px 8px rgb(0 0 0 / 0.3)">Chip</span>`);
    expect(bones(root)).toHaveLength(1);
  });
});
