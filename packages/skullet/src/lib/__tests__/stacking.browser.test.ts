import { bonesIn } from "@skullet/test-cases";
import { afterEach, expect, it } from "vitest";
import { forgetShapes, Ghost, Memory } from "..";

const ghosts: Ghost[] = [];

afterEach(() => {
  ghosts.forEach((ghost) => ghost.destroy());
  ghosts.length = 0;
  forgetShapes();
  document.body.replaceChildren();
});

it.each(["ghost", "snapshot"] as const)(
  "paints bones over sticky headers in the %s without moving the table",
  (source) => {
    const root = document.body.appendChild(document.createElement("div"));
    root.style.cssText =
      "width: 300px; margin: 80px 20px; font: 16px/20px sans-serif";
    const markup = `<table style="width: 100%; border-collapse: collapse">
      <thead><tr><th style="position: sticky; top: 0; z-index: 2000; background: white; padding: 12px">
        <span style="display: block">Monday</span><span style="display: block">12</span>
      </th></tr></thead>
      <tbody><tr><td style="height: 48px">Available</td></tr></tbody>
    </table>`;
    root.innerHTML = markup;
    const before = root.querySelector("tbody")!.getBoundingClientRect();
    if (source === "snapshot") new Memory(root, { id: "sticky" }).destroy();
    root.innerHTML = `<div skullet-ghost>${source === "ghost" ? markup : ""}</div>`;
    const ghost = new Ghost(
      root,
      source === "ghost" ? { exact: true } : { id: "sticky" },
    );
    ghosts.push(ghost);
    const after = root
      .querySelector(
        source === "ghost"
          ? "[skullet-ghost] tbody"
          : "[skullet-snapshot] tbody",
      )!
      .getBoundingClientRect();
    expect(after.top).toBeCloseTo(before.top, 1);
    expect(after.height).toBeCloseTo(before.height, 1);

    const header = root.querySelector(
      source === "ghost" ? "[skullet-ghost] th" : "[skullet-snapshot] th",
    )!;
    const headerBox = header.getBoundingClientRect();
    expect(getComputedStyle(header).visibility).toBe("visible");
    const bone = bonesIn(root).find((element) => {
      const box = element.getBoundingClientRect();
      return box.top >= headerBox.top && box.bottom <= headerBox.bottom;
    }) as HTMLElement;
    expect(bone).toBeDefined();
    const layer = root.querySelector<HTMLElement>("[skullet-layer]")!;
    root.inert = false;
    root.style.pointerEvents = "auto";
    bone.style.pointerEvents = "auto";
    const box = bone.getBoundingClientRect();
    const point = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    expect(document.elementFromPoint(point.x, point.y)).toBe(layer);

    const navigation = document.body.insertBefore(
      document.createElement("div"),
      root,
    );
    navigation.style.cssText = `position: fixed; z-index: 1; left: ${box.left}px; top: ${box.top}px; width: ${box.width}px; height: ${box.height}px; background: purple`;
    expect(document.elementFromPoint(point.x, point.y)).toBe(navigation);
  },
);

it("keeps absolutely positioned content anchored to its existing container", () => {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = "position: relative; width: 300px; padding: 20px";
  const markup = `<div style="height: 100px"><span style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; background: grey"></span></div>`;
  root.innerHTML = markup;
  const before = root.querySelector("span")!.getBoundingClientRect();
  root.innerHTML = `<div skullet-ghost>${markup}</div>`;
  ghosts.push(new Ghost(root, { exact: true }));
  const after = root.querySelector("span")!.getBoundingClientRect();
  expect(after.left).toBe(before.left);
  expect(after.top).toBe(before.top);
});

it("keeps an author's own skeleton painted beside the measured content", () => {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.width = "300px";
  root.innerHTML = `<div skullet-ghost><div skullet-own style="width: 48px; height: 32px; background: rgb(0, 128, 0)"></div><p>Measured text</p></div>`;
  ghosts.push(new Ghost(root, { exact: true }));
  const own = root.querySelector<HTMLElement>("[skullet-own]")!;
  expect(getComputedStyle(own).visibility).toBe("visible");
  expect(getComputedStyle(own).backgroundColor).toBe("rgb(0, 128, 0)");
  const box = own.getBoundingClientRect();
  expect(
    bonesIn(root).every(
      (element) => element.getBoundingClientRect().top >= box.bottom,
    ),
  ).toBe(true);
  root.inert = false;
  root.style.pointerEvents = "auto";
  root.querySelector<HTMLElement>("[skullet-layer]")!.style.pointerEvents =
    "none";
  expect(
    document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    ),
  ).toBe(own);
});
