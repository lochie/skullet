// Real localStorage: under Node 25, happy-dom's is shadowed by Node's own
import { afterEach, describe, expect, it } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { Reveal } from "../reveal";
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

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

describe("remember: false", () => {
  it("stores nothing", () => {
    const reveal = new Reveal(mount(""), { id: "profile", remember: false });
    reveal.load(html(`<p>Sample</p>`));
    reveal.show(html(`<p>Ada</p>`));
    reveal.destroy();

    expect(recallShape("profile")).toBeNull();
    expect(localStorage.getItem("skullet:shapes")).toBeNull();
  });

  it("forgets the shape stored before it was turned off, and no other", () => {
    rememberShape("profile", mount(`<p>Earlier</p>`));
    rememberShape("inbox", mount(`<p>Messages</p>`));
    const reveal = new Reveal(mount(""), { id: "profile", remember: false });
    reveal.load(html(`<p>Sample</p>`));
    reveal.destroy();

    forgetShapes({ persisted: false });
    expect(recallShape("profile")).toBeNull();
    expect(recallShape("inbox")).not.toBeNull();
  });

  it("draws from no remembered shape", () => {
    rememberShape("profile", mount(`<p>Earlier</p>`));
    const root = mount("");
    const reveal = new Reveal(root, { id: "profile", remember: false });
    reveal.load(html(`<p>Mine</p><p>Mine</p>`));
    expect(bonesIn(root)).toHaveLength(2);
    reveal.destroy();
  });
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
