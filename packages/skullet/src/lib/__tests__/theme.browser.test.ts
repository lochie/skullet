import { bonesIn } from "@skullet/test-cases";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  addStyles,
  createSkeletonBox,
  DURATIONS,
  Ghost,
  removeStyles,
} from "..";
import { PEAK, SLANT_TAN } from "../shimmer";

// Held for the file, as a mounted component would: each Ghost here is destroyed straight away
beforeAll(addStyles);
afterAll(removeStyles);

afterEach(() => {
  document.body.replaceChildren();
});

function skeleton(
  variables: string,
  html = `<p style="margin: 0">Some text</p>`,
) {
  const root = document.body.appendChild(document.createElement("div"));
  root.style.cssText = `width: 300px; padding-left: 40px; ${variables}`;
  root.innerHTML = `<div skullet-ghost>${html}</div>`;
  new Ghost(root, { exact: true }).destroy();
  return { root, bones: bonesIn(root) as HTMLElement[] };
}

const animation = (element: Element) =>
  element.getAnimations({ subtree: true })[0];
const sweepOf = (bone: Element) =>
  bone.querySelector<HTMLElement>("[skullet-sweep]")!;

describe("animation", () => {
  it("pulses softly, every bone in one phase", () => {
    const { bones } = skeleton(
      "--skullet-animation: pulse; --skullet-speed: fast",
    );
    const pulse = animation(bones[0]!)!;
    const keyframes = (pulse.effect as KeyframeEffect).getKeyframes();

    expect(keyframes.map((frame) => Number(frame.opacity))).toEqual([
      1, 0.45, 1,
    ]);
    expect(pulse.effect!.getTiming().duration).toBe(DURATIONS.pulse.fast);
    expect(pulse.startTime).toBe(0);
  });

  it("holds still with none", () => {
    const { bones } = skeleton("--skullet-animation: none");
    expect(bones[0]!.getAnimations()).toHaveLength(0);
  });

  // The tile's left edge at each keyframe, in the bone's own terms
  const sweep = (bone: HTMLElement) => {
    const band = sweepOf(bone);
    const frames = (animation(bone)!.effect as KeyframeEffect).getKeyframes();
    const tile = parseFloat(band.style.backgroundSize);
    const origin = parseFloat(band.style.backgroundPosition) - tile;
    const shift = (frame: ComputedKeyframe) =>
      new DOMMatrix(String(frame.transform)).m41;
    return {
      from: origin + shift(frames[0]!),
      to: origin + shift(frames[1]!),
      tile,
    };
  };

  // Where along the stream a bone starts, wrapped into one period
  const phase = (bone: HTMLElement) => {
    const { from, tile } = sweep(bone);
    return ((-from % tile) + tile) % tile;
  };

  it("moves the highlight by transform, never repainting the bone", () => {
    const { bones } = skeleton("");
    expect(bones[0]!.getAnimations()).toHaveLength(0);
    const frames = (
      animation(bones[0]!)!.effect as KeyframeEffect
    ).getKeyframes();
    expect(frames.every((frame) => frame.transform)).toBe(true);
    expect(frames.some((frame) => frame.backgroundPosition)).toBe(false);
  });

  it("runs one stream across the page — a bone further right is further along it", () => {
    const { bones } = skeleton(
      "",
      `<p style="display: flex; gap: 100px; margin: 0"><span>Left</span><span>Right</span></p>`,
    );
    const [left, right] = bones as [HTMLElement, HTMLElement];
    const { tile } = sweep(left);
    const apart =
      right.getBoundingClientRect().left - left.getBoundingClientRect().left;
    // How far off one stream they are, either way round the period
    const off = (((phase(right) - phase(left) - apart) % tile) + tile) % tile;
    expect(Math.min(off, tile - off)).toBeCloseTo(0, 1);
    // Each loop moves the stream on by exactly one period, so it repeats seamlessly
    expect(sweep(left).to - sweep(left).from).toBeCloseTo(tile, 1);
  });

  it("runs each group's stream from its own corner with group-shimmer", () => {
    const { root, bones } = skeleton("--skullet-animation: group-shimmer");
    const layer = root
      .querySelector("[skullet-layer]")!
      .getBoundingClientRect();
    const bone = bones[0]!.getBoundingClientRect();
    const { tile } = sweep(bones[0]!);
    const along = bone.left - layer.left + (bone.top - layer.top) * SLANT_TAN;
    expect(phase(bones[0]!)).toBeCloseTo(((along % tile) + tile) % tile, 1);
  });

  it("draws a diagonal stream of scrimmed highlights, each peaking at PEAK", () => {
    const { bones } = skeleton("");
    const image = sweepOf(bones[0]!).style.backgroundImage;
    expect(image).toMatch(/^repeating-linear-gradient\(110deg/);

    // Opacity at each stop, along one band
    const alphas = [
      ...image.matchAll(/(\d+(?:\.\d+)?)%, transparent\) (\d+(?:\.\d+)?)px/g),
    ].map((match) => ({ alpha: Number(match[1]), at: Number(match[2]) }));
    expect(alphas.length).toBeGreaterThan(20);
    const peak = alphas.reduce((a, b) => (b.alpha > a.alpha ? b : a));
    const first = alphas[0]!.at;
    const last = alphas.at(-1)!.at;
    expect((peak.at - first) / (last - first)).toBeCloseTo(PEAK, 2);
    // Then a gap before the next band
    const period = Number(image.match(/transparent ([\d.]+)px\)$/)![1]);
    expect(period).toBeGreaterThan(last);
  });

  it("lags the band for bones lower down, so the sweep is one diagonal", () => {
    const { bones } = skeleton(
      "",
      `<p style="margin: 0">First line</p><p style="margin: 40px 0 0">Lower line</p>`,
    );
    const upper = sweep(bones[0]!);
    const lower = sweep(bones[1]!);
    // Same left edge, so a lower bone's tile starts further left at the same moment
    expect(lower.from).toBeLessThan(upper.from);
  });

  it("sweeps at one pace, however wide its span", () => {
    const pace = (width: number) => {
      const { bones } = skeleton(
        `--skullet-animation: group-shimmer; width: ${width}px`,
      );
      const effect = animation(bones[0]!)!.effect as KeyframeEffect;
      const { from, to } = sweep(bones[0]!);
      return (to - from) / Number(effect.getTiming().duration);
    };
    expect(pace(200)).toBeCloseTo(pace(600), 3);
  });

  it("takes each animation's own slow and fast", () => {
    const loop = (variables: string) => {
      const { bones } = skeleton(variables);
      return Number(animation(bones[0]!)!.effect!.getTiming().duration);
    };
    expect(loop("--skullet-animation: pulse")).toBe(DURATIONS.pulse.slow);
    expect(loop("--skullet-animation: pulse; --skullet-speed: fast")).toBe(
      DURATIONS.pulse.fast,
    );
    // A shimmer's loop is one period of the stream, at a pace set for 1280px
    const slow = loop("--skullet-speed: slow");
    const fast = loop("--skullet-speed: fast");
    expect(slow / fast).toBeCloseTo(
      DURATIONS.shimmer.slow / DURATIONS.shimmer.fast,
      5,
    );
  });

  it("falls back to slow for a speed it doesn't know", () => {
    const { bones } = skeleton(
      "--skullet-animation: pulse; --skullet-speed: 900ms",
    );
    expect(animation(bones[0]!)!.effect!.getTiming().duration).toBe(
      DURATIONS.pulse.slow,
    );
  });
});

describe("radius", () => {
  it("rounds text bars and single bars, but leaves media its own corners", () => {
    const { bones } = skeleton(
      "--skullet-radius: 999px",
      `<p style="margin: 0">Some text</p><img width="40" height="40" style="display: block; border-radius: 4px">`,
    );
    const [image, text] = bones;
    expect(text!.style.borderRadius).toBe("999px");
    expect(image!.style.borderRadius).toBe("4px");

    document.body.style.setProperty("--skullet-radius", "6px");
    const bar = document.body.appendChild(createSkeletonBox());
    expect(getComputedStyle(bar).borderTopLeftRadius).toBe("6px");
    document.body.style.removeProperty("--skullet-radius");
  });
});

describe("SkeletonBox", () => {
  it("starts every box queued in a frame together, joining the sweep", async () => {
    const boxes = [1, 2, 3].map(() =>
      document.body.appendChild(createSkeletonBox()),
    );
    await new Promise(requestAnimationFrame);
    for (const box of boxes) {
      expect(box.querySelectorAll("[skullet-sweep]")).toHaveLength(1);
      expect(animation(box)!.startTime).toBe(0);
    }
  });
});
