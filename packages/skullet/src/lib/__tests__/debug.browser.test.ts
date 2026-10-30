import { afterEach, describe, expect, it } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { forgetShapes, Reveal, setDebug } from "..";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

const overlay = () =>
  [...document.body.children].find((element) =>
    element.shadowRoot?.querySelector(".boxes"),
  )?.shadowRoot ?? null;

const ROWS = `<p>One line of text</p><p>Another, a little longer</p>`;

const reveal = (scope: Element) => {
  const root = scope.appendChild(document.createElement("div"));
  root.style.width = "300px";
  const reveal = new Reveal(root, { reveal: "together" });
  reveal.load(html(ROWS));
  return { root, reveal, bones: bonesIn(root).length };
};

afterEach(() => {
  setDebug(false);
  forgetShapes();
  document.body.replaceChildren();
});

describe("debug", () => {
  it("outlines a reveal inside [skullet-debug], with no page-wide panel", async () => {
    const scope = document.body.appendChild(document.createElement("div"));
    scope.setAttribute("skullet-debug", "");
    const { reveal: r } = reveal(scope);
    await frame();

    expect(overlay()?.querySelectorAll(".box")).toHaveLength(1);
    expect(overlay()?.querySelector(".panel")).toBeNull();
    r.destroy();
  });

  it("leaves a reveal outside any scope alone", async () => {
    const { reveal: r } = reveal(document.body);
    await frame();
    expect(overlay()?.querySelectorAll(".box").length ?? 0).toBe(0);
    r.destroy();
  });

  it("shows the panel when debugging the whole page", async () => {
    setDebug(true);
    await frame();
    expect(overlay()?.querySelector(".panel")).not.toBeNull();
  });
});
