import { afterEach, describe, expect, it } from "vitest";
import { Ghost } from "..";

const ghosts: Ghost[] = [];

function mount(markup: string) {
  const root = document.body.appendChild(document.createElement("div"));
  root.innerHTML = `<div skullet-ghost>${markup}</div>`;
  return root;
}

function load(root: HTMLElement) {
  ghosts.push(new Ghost(root, { exact: true }));
}

afterEach(() => {
  ghosts.splice(0).forEach((ghost) => ghost.destroy());
  document.body.replaceChildren();
});

describe("empty elements while loading", () => {
  it("does not add a text baseline to decorative and explicitly hinted boxes", () => {
    for (const attributes of ['aria-hidden="true"', "skullet-block"]) {
      const root =
        mount(`<div style="display:flex;align-items:baseline;gap:8px;font:16px/24px sans-serif">
        <span ${attributes} style="display:inline-block;width:10px;height:10px;background:#888"></span>
        <p style="margin:0">An activity</p>
      </div>`);
      const dot = root.querySelector("span")!;
      const text = root.querySelector("p")!;
      const before = {
        dot: dot.getBoundingClientRect().top,
        text: text.getBoundingClientRect().top,
      };
      load(root);
      expect(dot.getBoundingClientRect().top).toBeCloseTo(before.dot, 1);
      expect(text.getBoundingClientRect().top).toBeCloseTo(before.text, 1);
    }
  });

  it("still supplies a line for ordinary empty text", () => {
    const root = mount(`<span></span>`);
    load(root);
    expect(
      root.querySelector("span")!.getBoundingClientRect().width,
    ).toBeGreaterThan(0);
    expect(
      getComputedStyle(root.querySelector("span")!, "::before").content,
    ).toBe('"000000"');
  });
});
