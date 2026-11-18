// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { Memory } from "../memory";
import { forgetShapes, recallShape } from "../shapes";

const mount = (html: string) => {
  const element = document.body.appendChild(document.createElement("div"));
  element.innerHTML = html;
  // save() only remembers a shape with real layout; happy-dom has none, so fake it.
  Object.defineProperty(element, "offsetHeight", {
    value: 40,
    configurable: true,
  });
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
  forgetShapes();
});

describe("Memory", () => {
  it("remembers a shape while mounted", () => {
    const memory = new Memory(mount(`<p>Ada</p>`), { id: "profile" });
    expect(recallShape("profile")).not.toBeNull();
    memory.destroy();
  });

  it("doesn't let destroy() write a shape back after forgetShapes() already ran", () => {
    // The sign-out race: forgetShapes() runs, then the signed-in tree unmounts and its Memory
    // instances (created before the forget) call destroy() -> save().
    const memory = new Memory(
      mount(`<a href="https://x.com/alice">alice</a>`),
      {
        id: "profile",
      },
    );
    forgetShapes();
    expect(recallShape("profile")).toBeNull();

    memory.destroy();
    expect(recallShape("profile")).toBeNull();
  });

  it("a Memory created after forgetShapes() saves normally", () => {
    forgetShapes();
    const memory = new Memory(mount(`<p>Bob</p>`), { id: "profile" });
    expect(recallShape("profile")).not.toBeNull();
    memory.destroy();
  });
});
