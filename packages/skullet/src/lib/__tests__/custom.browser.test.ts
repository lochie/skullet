import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { FADE_DURATION } from "../constants";
import {
  exitDuration,
  forgetShapes,
  Reveal,
  smart,
  together,
  type RevealSpec,
} from "..";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

const stage = () => {
  const element = document.body.appendChild(document.createElement("div"));
  element.style.width = "300px";
  return element;
};

const ROWS = `<p>One</p><p>Two</p><p>Three</p><p>Four</p>`;

const reveal = (spec: RevealSpec, markup = ROWS) => {
  const root = stage();
  const reveal = new Reveal(root, { reveal: spec });
  const skeleton = reveal.load(html(markup));
  const content = reveal.show(html(markup));
  return { root, reveal, skeleton, content };
};

// The fade, not a bone's shimmer
const timing = (element: Element) => {
  const effect = element
    .getAnimations()
    .map((animation) => animation.effect as KeyframeEffect)
    .find((effect) => effect.getKeyframes().some((key) => "opacity" in key));
  return effect && { ...effect.getTiming(), keyframes: effect.getKeyframes() };
};

afterEach(() => {
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
});

describe("a reveal of your own", () => {
  it("starts content from `enter`, on top of the fade", () => {
    const { reveal: r, content } = reveal({
      order: "together",
      enter: { filter: "blur(6px)" },
    });
    const [from] = timing(content)!.keyframes;
    expect(from!.filter).toBe("blur(6px)");
    expect(from!.opacity).toBe("0");
    r.destroy();
  });

  it("leaves out of `enter` anything that would move the page, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { reveal: r, content } = reveal({
      order: "together",
      enter: { height: "0px", marginTop: "20px", scale: "0.9" },
    });
    const [from] = timing(content)!.keyframes;
    expect(from!.scale).toBe("0.9");
    expect(from).not.toHaveProperty("height");
    expect(from).not.toHaveProperty("marginTop");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`height`"));
    r.destroy();
  });

  it("times each piece by `order`, the same for content and bones", async () => {
    const order = vi.fn(() => 80);
    const { reveal: r, root, content } = reveal({ order });
    const rows = content.querySelectorAll("p");
    for (const row of rows) expect(timing(row)!.delay).toBe(80);

    await Promise.resolve();
    const bones = bonesIn(root);
    expect(bones.length).toBeGreaterThan(0);
    for (const bone of bones) expect(timing(bone)!.delay).toBe(80);
    expect((order.mock.calls[0] as unknown[])[0]).toMatchObject({
      rect: expect.any(DOMRect),
      reveal: expect.any(DOMRect),
      secondary: false,
    });
    r.destroy();
  });

  it("keeps a custom order's delays in bounds", () => {
    const { reveal: r, content } = reveal({ order: () => 60_000 });
    expect(timing(content.querySelector("p")!)!.delay).toBe(1000);
    r.destroy();
  });

  it("wipes the outgoing pane with the inverse of the incoming one's mask", async () => {
    const mask = vi.fn(
      (progress: number) =>
        `linear-gradient(black ${(progress * 100).toFixed(0)}%, transparent 0%)`,
    );
    const {
      reveal: r,
      skeleton,
      content,
    } = reveal({ wipe: { mask }, duration: 400 });
    await frame();
    await frame();
    expect(content.style.getPropertyValue("mask-image")).toMatch(
      /^linear-gradient\(black \d+%, transparent 0%\)$/,
    );
    // A full layer, with the incoming pane's mask cut out of it
    const outgoing = skeleton.style.getPropertyValue("mask-image");
    expect(outgoing.match(/linear-gradient/g)).toHaveLength(2);
    expect(outgoing).toMatch(/black \d+%, transparent 0%\)$/);
    expect(getComputedStyle(skeleton).maskComposite).toMatch(/^exclude/);

    await wait(500);
    expect(content.style.getPropertyValue("mask-image")).toBe("");
    expect(mask).toHaveBeenCalledWith(1, expect.anything());
    r.destroy();
  });

  it("uses a wipe's own outgoing mask when it has one", async () => {
    const { reveal: r, skeleton } = reveal({
      wipe: {
        mask: () => "linear-gradient(black, transparent)",
        out: () => "linear-gradient(transparent, white)",
      },
      duration: 400,
    });
    await frame();
    await frame();
    expect(skeleton.style.getPropertyValue("mask-image")).toBe(
      "linear-gradient(transparent, white)",
    );
    r.destroy();
  });

  it("runs a wipe's effect on the incoming pane only", async () => {
    const effect = vi.fn();
    const { reveal: r, content } = reveal({
      wipe: { mask: () => "none", effect },
    });
    await frame();
    expect(effect).toHaveBeenCalledOnce();
    expect(effect.mock.calls[0]![0]).toBe(content);
    r.destroy();
  });

  it("lets `choose` decide as content lands, the fields beside it filling the rest", () => {
    const choose = vi.fn(() => together);
    const { reveal: r, content } = reveal({
      enter: { filter: "blur(2px)" },
      choose,
    });
    expect(choose).toHaveBeenCalledWith(
      expect.objectContaining({ content, pieces: 4, refetch: false }),
    );
    expect(timing(content)!.keyframes[0]!.filter).toBe("blur(2px)");
    r.destroy();
  });

  it("builds on a built-in", () => {
    const { reveal: r, content } = reveal({
      ...smart,
      enter: { filter: "blur(2px)" },
    });
    // Data straight after its skeleton: smart's instant case wins over the blur
    expect(content.getAnimations()).toHaveLength(0);
    r.destroy();
  });

  it("holds a skeleton replacing content for `hold`", async () => {
    const { reveal: r } = reveal({ order: "together", hold: 90 });
    await wait(FADE_DURATION + 50);
    const skeleton = r.load(html(ROWS));
    expect(timing(skeleton)!.delay).toBe(90);
    r.destroy();
  });

  it("is instant with no duration", () => {
    const {
      reveal: r,
      skeleton,
      content,
    } = reveal({
      order: "together",
      duration: 0,
    });
    expect(content.getAnimations()).toHaveLength(0);
    return Promise.resolve().then(() => {
      expect(skeleton.style.opacity).toBe("0");
      r.destroy();
    });
  });

  it("keeps a leaving pane long enough for any spec", () => {
    expect(exitDuration({ order: () => 0, hold: 100 })).toBeGreaterThanOrEqual(
      100 + 1000 + FADE_DURATION,
    );
    expect(exitDuration("together")).toBe(FADE_DURATION);
  });
});
