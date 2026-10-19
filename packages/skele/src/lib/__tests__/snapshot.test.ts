// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { autoKey, fill, restore, serialize } from "../snapshot";
import { sampleFrom } from "../dev";

const mount = (html: string) => {
  const element = document.body.appendChild(document.createElement("div"));
  element.innerHTML = html;
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("serialize", () => {
  it("keeps nothing that runs or loads", () => {
    const html = serialize(
      mount(
        `<img src="/a.png" srcset="/b.png 2x" onerror="alert(1)"><a href="javascript:alert(1)">x</a><script>alert(1)</script><iframe src="/x"></iframe>`,
      ),
      false,
    );

    expect(html).not.toMatch(/script|onerror|javascript:|src=|srcset|iframe/);
  });

  it("replaces text with filler when asked", () => {
    const html = serialize(mount(`<p>Ada Lovelace, 1815</p>`), true);
    expect(html).toContain("Xxx Xxxxxxxx, 0000");
    expect(html).not.toContain("Ada");
  });

  it("keeps real text otherwise", () => {
    expect(serialize(mount(`<p>Ada</p>`), false)).toContain("Ada");
  });

  it("drops form values", () => {
    const html = serialize(mount(`<input value="secret">`), false);
    expect(html).not.toContain("secret");
  });
});

describe("restore", () => {
  it("sanitizes markup it didn't write", () => {
    const fragment = restore(
      `<img src=x onerror="alert(1)"><script>1</script>`,
    );
    const holder = document.createElement("div");
    holder.append(fragment);

    expect(holder.innerHTML).toBe(`<img alt="">`);
  });
});

describe("autoKey", () => {
  it("matches markup with and without its data", () => {
    const loaded = mount(`<div class="card"><span>Ada</span><b>1</b></div>`);
    const empty = mount(`<div class="card"><span></span><b></b></div>`);
    expect(autoKey(loaded)).toBe(autoKey(empty));
  });

  it("tells different shapes apart", () => {
    const a = mount(`<div class="card"><span></span></div>`);
    const b = mount(`<div class="row"><span></span></div>`);
    expect(autoKey(a)).not.toBe(autoKey(b));
  });

  it("has nothing to key on an empty element", () => {
    expect(autoKey(mount(""))).toBeNull();
  });
});

describe("sampleFrom", () => {
  it("keeps keys and lengths, never values", () => {
    expect(
      sampleFrom({
        name: "Ada Lovelace",
        avatar: "https://example.com/ada.png",
        age: 36,
        tags: ["Maths"],
      }),
    ).toEqual({ name: "Xxx Xxxxxxxx", avatar: "", age: 36, tags: ["Xxxxx"] });
  });

  it("fills digits", () => {
    expect(fill("$12.50")).toBe("$00.00");
  });
});

describe("skeleCSS", () => {
  it("writes every token a theme sets", async () => {
    const { skeleCSS } = await import("../theme");
    expect(
      skeleCSS({
        theme: {
          radius: "4px",
          animation: "pulse",
          speed: "fast",
          text: { top: "x-height" },
        },
      }),
    ).toBe(
      ":root { --skele-radius: 4px; --skele-animation: pulse; --skele-speed: fast; --skele-text-top: x-height; }",
    );
  });

  it("switches colours with the system in system mode", async () => {
    const { skeleCSS } = await import("../theme");
    const css = skeleCSS({
      theme: {
        light: { base: "black", highlight: "white" },
        dark: { base: "white", highlight: "black" },
      },
    });
    expect(css).toContain(":root { --skele-base: black;");
    expect(css).toContain(
      "@media (prefers-color-scheme: dark) { :root { --skele-base: white;",
    );
  });

  it("leaves the page's colours alone when given none", async () => {
    const { skeleCSS } = await import("../theme");
    expect(skeleCSS({ theme: { radius: "2px" } })).not.toContain(
      "--skele-base",
    );
  });
});
