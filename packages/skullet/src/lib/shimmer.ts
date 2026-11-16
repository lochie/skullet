import { ATTR_RECT, ATTR_SWEEP, BASE, DURATIONS, HIGHLIGHT } from "./constants";
import type { SkulletAnimation, SkulletSpeed } from "./theme";
import { animationsOf, prefersReducedMotion } from "./motion";
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

const streams = new Map<number, { width: number; image: string }>();

/** Highlights `SPACING` band-widths apart, in px from the box's corner, so every rect draws the same stream. */
function highlights(band: number) {
  const cached = streams.get(band);
  if (cached) return cached;
  const period = band * SPACING;
  const stop = (at: number, alpha: number) =>
    `color-mix(in srgb, ${HIGHLIGHT} ${(alpha * 100).toFixed(1)}%, transparent) ${(at * band).toFixed(2)}px`;
  const stops: string[] = [];
  for (let i = 0; i <= STEPS; i++)
    stops.push(stop((i / STEPS) * PEAK, ease(i / STEPS)));
  for (let i = 1; i <= STEPS; i++) {
    stops.push(stop(PEAK + (i / STEPS) * (1 - PEAK), ease(1 - i / STEPS)));
  }

  const stream = {
    // Across, the stream repeats every `period` along the slant
    width: period / COS,
    image: `repeating-linear-gradient(${SLANT_ANGLE}, ${stops.join(", ")}, transparent ${period.toFixed(2)}px)`,
  };
  streams.set(band, stream);
  return stream;
}

const sweepOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(`:scope > [${ATTR_SWEEP}]`);

type Start = () => void;

/** Reads what `element`'s shimmer needs and returns its writes, which return its start — so a batch reads, writes, then starts. */
function prepare(
  element: HTMLElement,
  group?: Span,
  motion: Motion = motionOf(element),
): () => Start | void {
  const old = sweepOf(element);
  const running = [...animationsOf(element), ...(old ? animationsOf(old) : [])];
  const still =
    prefersReducedMotion() ||
    typeof element.animate !== "function" ||
    motion.animation === "none";
  const rect =
    still || motion.animation === "pulse"
      ? null
      : element.getBoundingClientRect();
  const page = document.documentElement.clientWidth || innerWidth;
  const height = innerHeight;
  const x = (rect?.left ?? 0) + scrollX;

  return () => {
    for (const animation of running) animation.cancel();
    old?.remove();
    if (still) return;

    const timing = { duration: motion.duration, iterations: Infinity };

    if (!rect) {
      element.animate(
        [
          { opacity: 1, easing: "ease-in-out" },
          { opacity: PULSE_LOW, easing: "ease-in-out" },
          { opacity: 1 },
        ],
        timing,
      ).startTime = 0;
      return;
    }

    const area: Span =
      motion.animation === "group-shimmer"
        ? (group ?? {
            left: x,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
        : { left: 0, top: 0, width: page, height };
    const band = Math.min(Math.max(area.width * 0.4, 80), MAX_BAND);
    const { width: tile, image } = highlights(band);

    // Where this bone sits in the area's one stream: further right, and lower down the slant, is further along it
    const along = x - area.left + (rect.top - area.top) * SLANT_TAN;
    // One pace on any screen, as a sweep across the reference width took
    const pace = (motion.duration * SWEEP) / (REFERENCE_WIDTH + MAX_BAND);

    // A tile wider than the element, moved by transform so the compositor runs it: a moving background repaints every frame
    const sweep = document.createElement("span");
    sweep.setAttribute(ATTR_SWEEP, "");
    sweep.style.cssText = `position:absolute;top:0;bottom:0;left:${-tile}px;width:calc(100% + ${tile}px);pointer-events:none;background-image:${image};background-size:${tile}px 100%;background-repeat:repeat-x;background-position:${tile - along}px 0`;
    element.style.overflow = "hidden";
    element.append(sweep);
    // Started after every write in a batch: animating a node with no style yet forces a recalc
    return () => {
      sweep.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${tile}px)` },
        ],
        { duration: tile * pace, iterations: Infinity },
      ).startTime = 0;
    };
  };
}

/** Animates `element` as its slice of one sweep, on the document clock, so however late it mounts it joins the sweep under way. */
export function shimmer(element: HTMLElement, group?: Span, motion?: Motion) {
  prepare(element, group, motion)()?.();
}

const queued = new Set<HTMLElement>();

function flush() {
  const writes = [...queued]
    .filter((element) => element.isConnected)
    .map((element) => prepare(element));
  queued.clear();
  const starts = writes.map((write) => write());
  for (const start of starts) start?.();
}

/** Shimmers `element` next frame, with every other one queued by then, so mounting many forces one style recalc rather than one each. */
export function queueShimmer(element: HTMLElement) {
  if (!queued.size) requestAnimationFrame(flush);
  queued.add(element);
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
  layer.shadowRoot ? ([...layer.shadowRoot.children] as HTMLElement[]) : [];

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

  rects.forEach((part, index) => {
    let element = root.children[index] as HTMLElement | undefined;
    if (!element) {
      element = document.createElement("div");
      element.setAttribute(ATTR_RECT, "");
      // Inline: no page stylesheet reaches into the shadow root
      element.style.cssText = `position:absolute;display:block;pointer-events:none;background-color:${BASE};background-repeat:no-repeat`;
      root.append(element);
    }

    Object.assign(element.style, {
      left: `${part.x}px`,
      top: `${part.y}px`,
      width: `${part.width}px`,
      height: `${part.height}px`,
      borderRadius: part.radius,
    });

    // Restarted only when its place, group, the page's width or the motion changes
    const key = `${Math.round(group.left + part.x)}|${Math.round(part.y)}|${Math.round(part.height)}|${Math.round(group.left)}|${Math.round(group.width)}|${Math.round(group.height)}|${document.documentElement.clientWidth}|${motion.animation}|${motion.duration}`;
    if (element.dataset.motion !== key) {
      element.dataset.motion = key;
      shimmer(element, group, motion);
    }
  });

  while (root.children.length > rects.length) root.lastElementChild!.remove();
}
