import { bonesIn } from "@skullet/test-cases";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  addStyles,
  createSkeletonBox,
  DURATIONS,
  Ghost,
  removeStyles,
} from "..";
import { PEAK, sheenOf, SLANT_TAN } from "../shimmer";

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

const animation = (element: Element) => element.getAnimations()[0];
const sheenIn = (root: Element) => sheenOf(root.querySelector("[skullet-layer]")!);

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
    const { root, bones } = skeleton("--skullet-animation: none");
    expect(bones[0]!.getAnimations()).toHaveLength(0);
    expect(sheenIn(root)).toBeNull();
  });

  it("leaves the bones still, with one highlight sweeping them all", () => {
    const { root, bones } = skeleton(
      "",
      `<p style="margin: 0">First line</p><p style="margin: 40px 0 0">Lower line</p>`,
    );
    expect(bones.every((bone) => bone.getAnimations().length === 0)).toBe(true);
    const sheen = sheenIn(root)!;
    // A path per bone in the mask it shows through
    const mask = decodeURIComponent(sheen.style.maskImage);
    expect(mask.match(/M[\d.]/g)).toHaveLength(bones.length);
    // Moved by transform, which the compositor runs without repainting
    const keyframes = (
      animation(sheen.firstElementChild!)!.effect as KeyframeEffect
    ).getKeyframes();
    expect(keyframes.every((frame) => frame.transform)).toBe(true);
  });

  // The band's background offset and how far it travels per loop, in the layer's own terms
  const sweep = (root: Element) => {
    const band = sheenIn(root)!.firstElementChild as HTMLElement;
    const effect = animation(band)!.effect as KeyframeEffect;
    const [start, end] = effect.getKeyframes();
    const shift = (frame: Keyframe | undefined) =>
      parseFloat(String(frame!.transform).replace("translateX(", "")) || 0;
    return {
      offset: parseFloat(band.style.backgroundPosition),
      travel: shift(end) - shift(start),
      tile: parseFloat(band.style.backgroundSize),
      duration: Number(effect.getTiming().duration),
      image: band.style.backgroundImage,
    };
  };

  // Where along the stream a layer's corner starts, wrapped into one period
  const phase = (root: Element) => {
    const { offset, tile } = sweep(root);
    return ((-offset % tile) + tile) % tile;
  };

  it("runs one stream across the page — a layer further right is further along it", () => {
    const left = skeleton("").root;
    const right = skeleton("padding-left: 140px").root;
    const { tile } = sweep(left);
    const a = left.querySelector("[skullet-layer]")!.getBoundingClientRect();
    const b = right.querySelector("[skullet-layer]")!.getBoundingClientRect();
    const apart = b.left - a.left + (b.top - a.top) * SLANT_TAN;
    // How far off one stream they are, either way round the period
    const off = (((phase(right) - phase(left) - apart) % tile) + tile) % tile;
    expect(Math.min(off, tile - off)).toBeCloseTo(0, 1);
    // Each loop moves the stream on by exactly one period, so it repeats seamlessly
    expect(sweep(left).travel).toBeCloseTo(tile, 1);
  });

  it("runs each group's stream from its own corner with group-shimmer", () => {
    const { root } = skeleton("--skullet-animation: group-shimmer");
    const { tile } = sweep(root);
    const off = phase(root);
    expect(Math.min(off, tile - off)).toBeCloseTo(0, 1);
  });

  it("draws a diagonal stream of scrimmed highlights, each peaking at PEAK", () => {
    const { root } = skeleton("");
    const { image } = sweep(root);
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

  it("sweeps at one pace, however wide its span", () => {
    const pace = (width: number) => {
      const { root } = skeleton(
        `--skullet-animation: group-shimmer; width: ${width}px`,
      );
      const { travel, duration } = sweep(root);
      return travel / duration;
    };
    expect(pace(200)).toBeCloseTo(pace(600), 3);
  });

  it("takes each animation's own slow and fast", () => {
    const loop = (variables: string) => {
      const { root, bones } = skeleton(variables);
      const animated = sheenIn(root)?.firstElementChild ?? bones[0]!;
      return Number(animation(animated)!.effect!.getTiming().duration);
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
