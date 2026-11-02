import {
  ATTR_RECT,
  ATTR_SHEEN,
  BASE,
  DURATIONS,
  HIGHLIGHT,
} from "./constants";
import type { SkulletAnimation, SkulletSpeed } from "./theme";
import { prefersReducedMotion } from "./motion";
import type { SkeletonRect } from "./measure";

const SWEEP = 0.7; // of a duration a sweep takes at the reference width — sweeps run back to back, so this sets the pace
const REFERENCE_WIDTH = 1280; // A shimmer's duration is one loop across this; any other width keeps its pace
const MAX_BAND = 320; // The highlight's width, so it doesn't grow heavier on a wide screen
const SPACING = 2.5; // bands follow each other this many band-widths apart, start to start — the gap between sweeps
const PULSE_LOW = 0.45; // opacity at the bottom of a pulse

const ANIMATIONS: readonly SkulletAnimation[] = [
  "shimmer",
  "group-shimmer",
  "pulse",
  "none",
];

export type Motion = { animation: SkulletAnimation; duration: number };

/** The animation an element inherits from the theme: `--skullet-animation` and `--skullet-speed`. */
export function motionOf(element: Element): Motion {
  const style = getComputedStyle(element);
  const read = <T extends string>(
    name: string,
    allowed: readonly T[],
    fallback: T,
  ): T => {
    const value = style.getPropertyValue(name).trim() as T;
    return allowed.includes(value) ? value : fallback;
  };
  const animation = read("--skullet-animation", ANIMATIONS, "shimmer");
  const speed = read<SkulletSpeed>("--skullet-speed", ["slow", "fast"], "slow");
  return {
    animation,
    duration: DURATIONS[animation === "pulse" ? "pulse" : "shimmer"][speed],
  };
}

type Span = { left: number; top: number; width: number; height: number };

const SLANT = 20; // degrees from vertical: the highlight is a diagonal, top right to bottom left
const SIN = Math.sin((SLANT * Math.PI) / 180);
const COS = Math.cos((SLANT * Math.PI) / 180);
export const SLANT_TAN = SIN / COS;
export const SLANT_COS = COS;
export const SLANT_ANGLE = `${90 + SLANT}deg`;
export const PEAK = 0.85; // Where across the band the highlight is brightest: 0 → PEAK eases up, PEAK → 1 eases down — later is a harder leading edge
export const STEPS = 12; // stops per ramp — enough for an eased curve to read as one, with no banding

// Every gradient ramps on this (a scrim), so no stop shows as a hard line
export const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Highlights `SPACING` band-widths apart, in px from the box's corner, so every rect draws the same stream. */
function highlights(band: number) {
  const period = band * SPACING;
  const stop = (at: number, alpha: number) =>
    `color-mix(in srgb, ${HIGHLIGHT} ${(alpha * 100).toFixed(1)}%, transparent) ${(at * band).toFixed(2)}px`;
  const stops: string[] = [];
  for (let i = 0; i <= STEPS; i++)
    stops.push(stop((i / STEPS) * PEAK, ease(i / STEPS)));
  for (let i = 1; i <= STEPS; i++) {
    stops.push(stop(PEAK + (i / STEPS) * (1 - PEAK), ease(1 - i / STEPS)));
  }

  return {
    // Across, the stream repeats every `period` along the slant
    width: period / COS,
    image: `repeating-linear-gradient(${SLANT_ANGLE}, ${stops.join(", ")}, transparent ${period.toFixed(2)}px)`,
  };
}

const NO_MOTION: Motion = { animation: "none", duration: 0 };

// The shimmer each element runs: `getAnimations()` would flush style, once per bone after every write
const running = new WeakMap<Element, Animation>();

/** Animates `element` as its slice of one sweep, on the document clock, so however late it mounts it joins the sweep under way. */
export function shimmer(
  element: HTMLElement,
  group?: Span,
  motion: Motion = motionOf(element),
  /** Its box on screen and the page's width, when the caller knows them — read here, each forces a layout after every write. */
  box?: Span,
  pageWidth?: number,
) {
  running.get(element)?.cancel();
  running.delete(element);
  element.style.backgroundImage = "";
  element.style.backgroundRepeat = "";
  if (prefersReducedMotion() || typeof element.animate !== "function") return;
  if (motion.animation === "none") return;

  const timing = { duration: motion.duration, iterations: Infinity };

  if (motion.animation === "pulse") {
    const pulse = element.animate(
      [
        { opacity: 1, easing: "ease-in-out" },
        { opacity: PULSE_LOW, easing: "ease-in-out" },
        { opacity: 1 },
      ],
      timing,
    );
    pulse.startTime = 0;
    running.set(element, pulse);
    return;
  }

  const rect = box ?? element.getBoundingClientRect();
  const x = rect.left + scrollX;
  const area: Span =
    motion.animation === "group-shimmer"
      ? (group ?? {
          left: x,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
      : {
          left: 0,
          top: 0,
          width:
            pageWidth ?? (document.documentElement.clientWidth || innerWidth),
          height: innerHeight,
        };
  const band = Math.min(Math.max(area.width * 0.4, 80), MAX_BAND);
  const { width: tile, image } = highlights(band);

  // Where this bone sits in the area's one stream: further right, and lower down the slant, is further along it
  const along = x - area.left + (rect.top - area.top) * SLANT_TAN;
  // One pace on any screen, as a sweep across the reference width took
  const pace = (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);

  element.style.backgroundImage = image;
  element.style.backgroundSize = `${tile}px 100%`;
  element.style.backgroundRepeat = "repeat-x";
  const sweep = element.animate(
    [
      { backgroundPosition: `${-along}px 0` },
      { backgroundPosition: `${tile - along}px 0` },
    ],
    { duration: tile * pace, iterations: Infinity },
  );
  sweep.startTime = 0;
  running.set(element, sweep);
}

/** ms per px of the band in `element`'s shimmer; null when it has no band. */
export function paceOf(element: Element): number | null {
  if (prefersReducedMotion()) return null;
  const motion = motionOf(element);
  if (motion.animation !== "shimmer" && motion.animation !== "group-shimmer")
    return null;
  return (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);
}

// In a shadow root, so a framework hydrating `layer` never meets bones it didn't render
const shadow = (layer: HTMLElement) =>
  layer.shadowRoot ?? layer.attachShadow({ mode: "open" });

/** The rect elements drawn into `layer`. */
export const rectsOf = (layer: Element): HTMLElement[] =>
  layer.shadowRoot
    ? ([...layer.shadowRoot.children].filter((element) =>
        element.hasAttribute(ATTR_RECT),
      ) as HTMLElement[])
    : [];

/** The highlight sweeping `layer`'s rects, when its motion is a shimmer. */
export const sheenOf = (layer: Element): HTMLElement | null =>
  layer.shadowRoot?.querySelector<HTMLElement>(`[${ATTR_SHEEN}]`) ?? null;

const px = (value: number) => Math.round(value * 100) / 100;

// Each corner of a CSS `border-radius` in px, clamped as the browser would
function cornersOf({ width, height, radius }: SkeletonRect) {
  const size = Math.min(width, height);
  const values = (radius.split("/")[0] ?? "")
    .trim()
    .split(/\s+/)
    .map((value) =>
      value.endsWith("%")
        ? (parseFloat(value) / 100) * size
        : parseFloat(value) || 0,
    );
  const [tl = 0, tr = tl, br = tl, bl = tr] = values;
  return [tl, tr, br, bl].map((r) => Math.min(Math.max(r, 0), size / 2)) as [
    number,
    number,
    number,
    number,
  ];
}

function pathOf(part: SkeletonRect) {
  const { x, y, width: w, height: h } = part;
  const [tl, tr, br, bl] = cornersOf(part).map(px) as [
    number,
    number,
    number,
    number,
  ];
  return (
    `M${px(x + tl)} ${px(y)}H${px(x + w - tr)}A${tr} ${tr} 0 0 1 ${px(x + w)} ${px(y + tr)}` +
    `V${px(y + h - br)}A${br} ${br} 0 0 1 ${px(x + w - br)} ${px(y + h)}` +
    `H${px(x + bl)}A${bl} ${bl} 0 0 1 ${px(x)} ${px(y + h - bl)}` +
    `V${px(y + tl)}A${tl} ${tl} 0 0 1 ${px(x + tl)} ${px(y)}Z`
  );
}

/** The rects as a mask: what the highlight shows through. */
function maskOf(rects: SkeletonRect[], width: number, height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px(width)}" height="${px(height)}"><path d="${rects.map(pathOf).join("")}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

type Sheen = {
  group: Span;
  motion: Motion;
  pageWidth: number;
  width: number;
  height: number;
};

/**
 * The shimmer as one highlight over all of a layer's rects, masked to them and moved by `transform`, so
 * the compositor runs it: a background-position sweep on every rect would repaint each of them every frame.
 */
function drawSheen(
  root: ShadowRoot,
  rects: SkeletonRect[],
  { group, motion, pageWidth, width, height }: Sheen,
) {
  let sheen = root.querySelector<HTMLElement>(`[${ATTR_SHEEN}]`);
  if (!sheen) {
    sheen = document.createElement("div");
    sheen.setAttribute(ATTR_SHEEN, "");
    sheen.style.cssText =
      "position:absolute;left:0;top:0;overflow:hidden;pointer-events:none;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat";
    sheen.append(document.createElement("div"));
    root.append(sheen);
  }
  const band = sheen.firstElementChild as HTMLElement;

  const mask = maskOf(rects, width, height);
  if (sheen.dataset.mask !== mask) {
    sheen.dataset.mask = mask;
    sheen.style.width = `${width}px`;
    sheen.style.height = `${height}px`;
    sheen.style.maskImage = mask;
    sheen.style.setProperty("-webkit-mask-image", mask);
  }

  // The same stream the rects would each draw: one sweep across the page, or across the group
  const area: Span =
    motion.animation === "group-shimmer"
      ? group
      : { left: 0, top: 0, width: pageWidth, height: innerHeight };
  const bandWidth = Math.min(Math.max(area.width * 0.4, 80), MAX_BAND);
  const { width: tile, image } = highlights(bandWidth);
  const along = group.left - area.left + (group.top - area.top) * SLANT_TAN;
  const pace = (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);

  const key = `${px(tile)}|${px(along % tile)}|${motion.duration}`;
  if (band.dataset.motion === key) return;
  band.dataset.motion = key;

  running.get(band)?.cancel();
  // A tile wider on the left, so translating by one tile never uncovers an edge
  band.style.cssText = `position:absolute;top:0;bottom:0;left:${-px(tile)}px;width:calc(100% + ${px(tile)}px);background-image:${image};background-size:${px(tile)}px 100%;background-repeat:repeat-x;background-position:${px(-along)}px 0;will-change:transform`;
  const sweep = band.animate(
    [{ transform: "translateX(0)" }, { transform: `translateX(${px(tile)}px)` }],
    { duration: tile * pace, iterations: Infinity },
  );
  sweep.startTime = 0;
  running.set(band, sweep);
}

/** Draws `rects` into `layer`, reusing the elements already there. */
export function drawSkeleton(layer: HTMLElement, rects: SkeletonRect[]) {
  const root = shadow(layer);
  const rect = layer.getBoundingClientRect();
  const group = {
    left: rect.left + scrollX,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  // Read once for the layer: every rect in it inherits the same theme
  const motion = motionOf(layer);
  // Rects are local to the layer; on screen they scale with any transform on it
  const width = layer.offsetWidth;
  const height = layer.offsetHeight;
  const scaleX = width ? rect.width / width : 1;
  const scaleY = height ? rect.height / height : 1;
  const pageWidth = document.documentElement.clientWidth || innerWidth;
  const sheen =
    (motion.animation === "shimmer" || motion.animation === "group-shimmer") &&
    !prefersReducedMotion() &&
    typeof layer.animate === "function";

  const bones = rectsOf(layer);
  const before = sheenOf(layer);
  rects.forEach((part, index) => {
    let element = bones[index];
    if (!element) {
      element = document.createElement("div");
      element.setAttribute(ATTR_RECT, "");
      // Inline: no page stylesheet reaches into the shadow root
      element.style.cssText = `position:absolute;display:block;pointer-events:none;background-color:${BASE};background-repeat:no-repeat`;
      root.insertBefore(element, before);
    }

    Object.assign(element.style, {
      left: `${part.x}px`,
      top: `${part.y}px`,
      width: `${part.width}px`,
      height: `${part.height}px`,
      borderRadius: part.radius,
    });

    // Restarted only when its place, group, the page's width or the motion changes
    const key = sheen
      ? "sheen"
      : `${Math.round(group.left + part.x)}|${Math.round(part.y)}|${Math.round(part.height)}|${Math.round(group.left)}|${Math.round(group.width)}|${Math.round(group.height)}|${pageWidth}|${motion.animation}|${motion.duration}`;
    if (element.dataset.motion !== key) {
      element.dataset.motion = key;
      const box = {
        left: rect.left + part.x * scaleX,
        top: rect.top + part.y * scaleY,
        width: part.width * scaleX,
        height: part.height * scaleY,
      };
      shimmer(element, group, sheen ? NO_MOTION : motion, box, pageWidth);
    }
  });

  for (const extra of bones.slice(rects.length)) extra.remove();

  if (sheen) {
    drawSheen(root, rects, { group, motion, pageWidth, width, height });
  } else {
    before?.remove();
  }
}
