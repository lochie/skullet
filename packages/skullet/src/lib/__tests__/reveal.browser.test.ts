import { afterEach, describe, expect, it, vi } from "vitest";
import { FADE_DURATION } from "../constants";
import { bonesIn } from "@skullet/test-cases";
import { fadeIn, forgetShapes, Reveal } from "..";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settle = () =>
  new Promise((resolve) => setTimeout(resolve, FADE_DURATION + 50));

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

const stage = (width = 300) => {
  const element = document.body.appendChild(document.createElement("div"));
  element.style.width = `${width}px`;
  return element;
};

const bones = (root: Element) => bonesIn(root);
const panes = (root: Element) => root.querySelectorAll("[skullet-pane]");

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  forgetShapes();
  document.body.replaceChildren();
});

describe("Reveal", () => {
  it("draws a generic skeleton when it has nothing to go on, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = stage();
    const reveal = new Reveal(root, { id: "unknown" });

    reveal.load();
    expect(bones(root)).toHaveLength(3);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Nothing to draw a skeleton from"),
    );
    reveal.destroy();
  });

  it.each(["smart", "sweep"] as const)(
    "shows a fresh reveal's skeleton at once under %s — there's nothing to hold back for",
    async (mode) => {
      const root = stage();
      const reveal = new Reveal(root, { reveal: mode });
      const skeleton = reveal.load(html(`<p>Hello there</p>`));
      await frame();
      expect(getComputedStyle(skeleton).opacity).toBe("1");
      reveal.destroy();
    },
  );

  it("crossfades from skeleton to content, then drops the skeleton", async () => {
    const root = stage();
    const reveal = new Reveal(root);
    reveal.load(html(`<p>Hello there</p>`));
    reveal.show(html(`<p>Hello there</p>`));

    expect(panes(root)).toHaveLength(2);
    await settle();
    expect(panes(root)).toHaveLength(1);
    expect(root.querySelector("[skullet-loading]")).toBeNull();
    reveal.destroy();
  });

  it("holds a shrink-to-fit skeleton exactly as it was while it fades out", async () => {
    const holder = document.body.appendChild(document.createElement("div"));
    holder.style.cssText = "display: inline-block; font-size: 15.3px";
    const reveal = new Reveal(holder, { reveal: "together" });
    const text = `<span style="white-space: normal">Lochie Axon</span>`;
    const skeleton = reveal.load(html(text));
    const width = skeleton.getBoundingClientRect().width;
    const before = bones(holder).map((bone) => bone.getAttribute("style"));

    reveal.show(html(text));
    // Read as it leaves: on a slow machine, two frames can outlast the whole fade
    await Promise.resolve();

    expect(skeleton.getBoundingClientRect().width).toBe(width);
    const ghost = skeleton.querySelector("span")!;
    expect(ghost.getClientRects()).toHaveLength(1); // not rewrapped
    expect(bones(skeleton).map((bone) => bone.getAttribute("style"))).toEqual(
      before,
    );
    reveal.destroy();
  });

  it("eases to the content's height when the skeleton guessed it wrong", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = stage();
    const reveal = new Reveal(root, { reveal: "together" });
    reveal.load(html(`<div style="height: 40px"></div>`));
    reveal.show(html(`<div style="height: 120px"></div>`));
    await Promise.resolve();

    // The animation, not a moment of it: a slow machine's frame can land at either end
    const heights = root
      .getAnimations()
      .flatMap((animation) =>
        (animation.effect as KeyframeEffect).getKeyframes(),
      )
      .map((keyframe) => keyframe.height);
    expect(heights).toEqual(["40px", "120px"]);
    expect(getComputedStyle(root).overflow).toBe("clip");

    await vi.waitFor(() => {
      expect(root.getBoundingClientRect().height).toBe(120);
      expect(root.style.overflow).toBe("");
    });
    reveal.destroy();
  });

  it.each([180, 250, 320])(
    "never dims content that lands %dms into a reload",
    async (after) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const root = stage();
      const reveal = new Reveal(root);
      reveal.show(html(`<p>Hello there</p>`));
      await settle();
      reveal.load();
      await new Promise((resolve) => setTimeout(resolve, after));
      reveal.show(html(`<p>Hello there</p>`));

      // Content panes stacked: how much content shows, frame by frame
      const shown = () =>
        1 -
        [...panes(root)]
          .filter((pane) => !pane.querySelector("[skullet-loading]"))
          .reduce(
            (hidden, pane) => hidden * (1 - +getComputedStyle(pane).opacity),
            1,
          );
      let last = shown();
      for (let i = 0; i < 30; i++) {
        await frame();
        const now = shown();
        expect(now).toBeGreaterThanOrEqual(last - 0.01);
        last = now;
      }
      reveal.destroy();
    },
  );

  it("arrives once, however many times it's brought in", () => {
    const root = stage();
    root.append(document.createElement("div"), document.createElement("div"));
    const pane = root.lastElementChild as HTMLElement;
    pane.innerHTML = "<p>Hello there</p>";

    const first = fadeIn(pane, "together");
    expect(fadeIn(pane, "sequence")).toBe(first);
    expect(pane.getAnimations()).toHaveLength(1);
  });

  it("sweeps with the plainest mask — a pane-sized gradient moved a frame at a time, which every Safari paints", async () => {
    const root = stage(400);
    const reveal = new Reveal(root, { reveal: "sweep" });
    const rows = Array.from(
      { length: 6 },
      (_, i) => `<p style="margin: 0 0 12px">Row ${i} of the content</p>`,
    ).join("");
    reveal.load(html(rows));
    await new Promise((resolve) => setTimeout(resolve, 400));
    const content = reveal.show(html(rows));

    const mask = () => content.style.getPropertyValue("mask-image");
    expect(mask()).toMatch(/^linear-gradient/);
    expect(mask()).not.toContain("var(");
    expect(content.style.getPropertyValue("mask-size")).toBe("");
    expect(content.style.getPropertyValue("mask-position")).toBe("");
    expect(content.getAnimations()).toHaveLength(0);

    const before = mask();
    await frame();
    await frame();
    await frame();
    expect(mask()).not.toBe(before);

    // Once it's crossed, nothing is left on the pane — Safari doesn't render one whose filter points at nothing
    await vi.waitFor(
      () => {
        expect(mask()).toBe("");
        expect(content.style.filter).toBe("");
      },
      { timeout: 4000, interval: 50 },
    );
    expect(document.querySelectorAll("filter[id^=skullet-gloss]")).toHaveLength(
      0,
    );
    reveal.destroy();
  });

  describe("sweep", () => {
    const rows = (count: number) =>
      Array.from(
        { length: count },
        (_, i) => `<p style="margin: 0 0 12px">Row ${i} of the content</p>`,
      ).join("");

    const sweep = async (count = 6) => {
      const root = stage(400);
      const reveal = new Reveal(root, { reveal: "sweep" });
      const skeleton = reveal.load(html(rows(count)));
      await new Promise((resolve) => setTimeout(resolve, 400));
      const content = reveal.show(html(rows(count)));
      return { reveal, skeleton, content };
    };

    it("gives way to a crossfade when frames drop, both panes together", async () => {
      const { reveal, skeleton, content } = await sweep();
      await Promise.resolve();
      expect(content.style.getPropertyValue("mask-image")).not.toBe("");
      // A long task: the next frame comes far too late
      const until = performance.now() + 250;
      while (performance.now() < until);
      await frame();
      await frame();
      expect(content.style.getPropertyValue("mask-image")).toBe("");
      expect(skeleton.style.getPropertyValue("mask-image")).toBe("");

      await new Promise((resolve) => setTimeout(resolve, FADE_DURATION + 100));
      expect(getComputedStyle(content).opacity).toBe("1");
      expect(skeleton.isConnected).toBe(false);
      reveal.destroy();
    });

    it("crossfades a reveal too big to sweep", async () => {
      const { reveal, content } = await sweep(80);
      expect(content.getBoundingClientRect().height).toBeGreaterThan(
        innerHeight * 1.5,
      );
      expect(content.style.getPropertyValue("mask-image")).toBe("");
      reveal.destroy();
    });

    it("leaves out the gloss under reduced transparency", async () => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("transparency"),
      }));
      const { reveal, content } = await sweep();
      expect(content.style.getPropertyValue("mask-image")).not.toBe("");
      expect(content.style.filter).toBe("");
      reveal.destroy();
    });
  });

  it("names the images nothing sized, when they make the reveal jump", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = stage();
    const reveal = new Reveal(root, { reveal: "together" });
    const photo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"/>')}`;
    reveal.load(html(`<img><p>Caption</p>`));
    await new Promise((resolve) => setTimeout(resolve, 200));
    reveal.show(html(`<img src="${photo}"><p>Caption</p>`));
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("had no room for an image"),
      ),
    );
    reveal.destroy();
  });

  it("re-measures when its width changes", async () => {
    const root = stage(400);
    const reveal = new Reveal(root);
    reveal.load(
      html(
        `<p style="margin: 0">A sentence long enough to wrap once narrowed</p>`,
      ),
    );
    const wide = bones(root).length;

    root.style.width = "120px";
    await frame();
    await frame();
    expect(bones(root).length).toBeGreaterThan(wide);
    reveal.destroy();
  });

  it("runs every bone on one clock, however late it mounts", async () => {
    const root = stage();
    const first = new Reveal(root.appendChild(document.createElement("div")));
    first.load(html(`<p>First</p>`));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const second = new Reveal(root.appendChild(document.createElement("div")));
    second.load(html(`<p>Second</p>`));

    const animations = bones(root).map(
      (bone) => (bone as HTMLElement).getAnimations()[0]!,
    );
    expect(animations).toHaveLength(2);
    expect(animations.map((a) => a.startTime)).toEqual([0, 0]);
    expect(animations[0]!.currentTime).toBe(animations[1]!.currentTime);
    first.destroy();
    second.destroy();
  });

  it.each(["together", "sequence", "smart", "sweep"] as const)(
    "under %s, brings text in on time and holds a bone over an image until it's ready",
    async (mode) => {
      const root = stage();
      const reveal = new Reveal(root, { reveal: mode });
      const skeleton = reveal.load(
        html(`<img width="40" height="40"><p>Photo</p>`),
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Never answers on its own — only the source swapped in below loads
      const content = reveal.show(
        html(
          `<img src="http://10.255.255.1/photo.png" width="40" height="40"><p>Photo</p>`,
        ),
      );
      const image = content.querySelector("img")!;
      const text = content.querySelector("p")!;
      const shown = (element: Element) => {
        let opacity = 1;
        for (let n: Element | null = element; n; n = n.parentElement) {
          opacity *= +getComputedStyle(n).opacity;
        }
        return opacity;
      };
      const standIn = () =>
        root.querySelector<HTMLElement>(":scope > [skullet-rect]");

      // Past the old caps — 600ms, and 2s for smart's image bones
      await new Promise((resolve) => setTimeout(resolve, 2500));
      expect(shown(text)).toBe(1);
      expect(skeleton.isConnected).toBe(false);
      expect(shown(image)).toBe(0);
      expect(shown(standIn()!)).toBe(1);
      expect(standIn()!.getBoundingClientRect().height).toBeCloseTo(40, 0);

      image.src =
        "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>`,
        );
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(shown(image)).toBe(1);
      expect(standIn()).toBeNull();
      reveal.destroy();
    },
  );

  it("holds still under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const root = stage();
    const reveal = new Reveal(root);
    reveal.load(html(`<p>Still</p>`));

    expect((bones(root)[0] as HTMLElement).getAnimations()).toHaveLength(0);
    reveal.destroy();
  });
});

describe("Reveal onReveal", () => {
  it("is called once content has come in over a skeleton, and not for content shown at once", async () => {
    const onReveal = vi.fn();
    const root = stage();
    const reveal = new Reveal(root, { onReveal });

    reveal.show(html(`<p>Hello there</p>`));
    await settle();
    expect(onReveal).not.toHaveBeenCalled();

    reveal.load();
    reveal.show(html(`<p>General Kenobi</p>`));
    await settle();
    expect(onReveal).toHaveBeenCalledTimes(1);
    reveal.destroy();
  });
});
