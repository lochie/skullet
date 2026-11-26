import { bonesIn } from "@skullet/test-cases";
import { afterEach, expect, it } from "vitest";
import { Ghost } from "..";

const ghosts: Ghost[] = [];

function mount(markup: string) {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = "width: 320px; font: 16px/24px sans-serif";
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

it("keeps ignored table spacers at their authored height without adding bones", () => {
  const root = mount(`<table style="width: 100%; border-spacing: 0">
    <thead><tr><th skullet-ignore style="width: 56px; padding: 0"></th><th>Monday</th></tr></thead>
    <tbody><tr skullet-ignore style="height: 4px"><td colspan="2" style="height: 4px; padding: 0"></td></tr>
    <tr><th>07:00</th><td style="padding-left: 24px">Available</td></tr></tbody>
  </table>`);
  const spacer = root.querySelector("tbody tr")!;
  const row = root.querySelector("tbody tr:nth-child(2)")!;
  const before = {
    spacer: spacer.getBoundingClientRect(),
    row: row.getBoundingClientRect(),
  };
  expect(before.spacer.height).toBe(4);

  load(root);

  const after = spacer.getBoundingClientRect();
  expect(after.height).toBe(before.spacer.height);
  expect(row.getBoundingClientRect().top).toBeCloseTo(before.row.top, 1);
  expect(getComputedStyle(root.querySelector("th")!, "::before").content).toBe(
    "none",
  );
  const bones = bonesIn(root);
  expect(bones).toHaveLength(3);
  expect(
    bones.every((bone) => {
      const box = bone.getBoundingClientRect();
      return box.bottom <= after.top || box.top >= after.bottom;
    }),
  ).toBe(true);
});

it("does not fill empty descendants of an ignored element", () => {
  const root = mount(`<div skullet-ignore><span></span></div>`);
  load(root);
  expect(
    getComputedStyle(root.querySelector("span")!, "::before").content,
  ).toBe("none");
  expect(bonesIn(root)).toHaveLength(0);
});

it("keeps placeholder text for unmarked empty spans and table cells", () => {
  const root = mount(
    `<span></span><table><tbody><tr><td></td></tr></tbody></table>`,
  );
  load(root);
  for (const element of root.querySelectorAll("span, td")) {
    expect(getComputedStyle(element, "::before").content).toBe('"000000"');
  }
});
