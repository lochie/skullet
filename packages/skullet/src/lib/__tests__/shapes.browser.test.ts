// Real localStorage: under Node 25, happy-dom's is shadowed by Node's own
import { afterEach, describe, expect, it } from "vitest";
import { forgetShapes, recallShape, rememberShape } from "../shapes";
import { restore } from "../snapshot";

const mount = (html: string) => {
  const element = document.body.appendChild(document.createElement("div"));
  element.innerHTML = html;
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
  forgetShapes();
});

describe("shapes", () => {
  it("recalls real text within a visit and filler across visits", () => {
    rememberShape("profile", mount(`<p>Ada Lovelace</p>`));
    expect(recallShape("profile")).toContain("Ada Lovelace");

    forgetShapes({ persisted: false });
    expect(recallShape("profile")).toContain("Xxx Xxxxxxxx");
    expect(recallShape("profile")).not.toContain("Ada");
  });

  it("keeps an image's proportions, so a shape restored narrower scales it down", async () => {
    const shown = mount(
      `<img src="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"/>')}" style="display: block; width: 100%">`,
    );
    shown.style.width = "400px";
    await shown.querySelector("img")!.decode();
    rememberShape("photo", shown);

    const narrow = mount("");
    narrow.style.width = "200px";
    narrow.append(restore(recallShape("photo")!));
    const box = narrow.querySelector("img")!.getBoundingClientRect();
    expect(box.width).toBeCloseTo(200, 0);
    expect(box.height).toBeCloseTo(100, 0);
  });

  it("forgets everything", () => {
    rememberShape("profile", mount(`<p>Ada</p>`));
    forgetShapes();
    expect(recallShape("profile")).toBeNull();
  });

  it("keeps the 50 most recent", () => {
    const element = mount(`<p>x</p>`);
    for (let i = 0; i < 55; i++) rememberShape(`shape-${i}`, element);
    forgetShapes({ persisted: false });

    expect(recallShape("shape-0")).toBeNull();
    expect(recallShape("shape-54")).not.toBeNull();
  });
});
