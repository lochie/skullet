import { ATTR_BONES, ATTR_EXITING } from "./constants";
import { prefersReducedTransparency } from "./motion";
import {
  BATCH_WINDOW,
  byContent,
  MAX_SWEEP_AREA,
  quickly,
  revealBox,
  SKELETON_DELAY,
  type RevealContext,
  type RevealSpec,
  type Wipe,
  type WipePane,
} from "./plan";
import {
  ease,
  paceOf,
  SLANT_ANGLE,
  SLANT_COS,
  SLANT_TAN,
  STEPS,
} from "./shimmer";

const WAVE_SPREAD = 360; // Most a sweep takes across the reveal that starts it
const WAVE_PACE = 2; // A sweep's front runs this many times the shimmer's pace
export const SWEEP_SPREAD = 600; // Most a sweep takes across a reveal that joins one under way
const FEATHER = 40; // px either side of the front, across the slant
const PAD = FEATHER / SLANT_COS; // The feather, along `u`
const GLOSS = 320; // px across the slant: the band trailing the front, as wide as the shimmer's widest
const GLOSS_LAG = 120; // px its centre trails the front by
const GLOSS_LIFT = 0.45; // How far, at its peak, it lifts the content it crosses toward white

// `u` is a point's x plus its y along the slant, in viewport px: the front is a line of one `u`
const uOf = (rect: DOMRect) => rect.left + rect.top * SLANT_TAN;
const spanOf = (rect: DOMRect) => rect.width + rect.height * SLANT_TAN;

// The front's `u` at `progress` — crossing the reveal from a feather before it to a feather past it
const frontAt = (progress: number, reveal: DOMRect) =>
  uOf(reveal) - PAD + (spanOf(reveal) + 2 * PAD) * progress;

let wave = { start: -Infinity, origin: 0, speed: 1 };

/** When the shared front reaches `reveal`, and how long it takes across — null without a shimmer to match. */
function timing(reveal: HTMLElement) {
  const layer = reveal.querySelector(
    `:scope > [${ATTR_EXITING}] [${ATTR_BONES}]`,
  );
  const pace = layer && paceOf(layer);
  if (!pace) return null;

  const rect = revealBox(reveal);
  if (rect.width * rect.height > innerWidth * innerHeight * MAX_SWEEP_AREA) {
    return null;
  }
  const from = uOf(rect);
  const to = from + spanOf(rect);
  const now = performance.now();
  // Reveals landing together share one front — if it hasn't reached this one yet, and won't keep it waiting
  const elapsed = now - wave.start;
  const joined =
    elapsed <= BATCH_WINDOW &&
    (from - wave.origin) / wave.speed >= elapsed &&
    (to - wave.origin) / wave.speed - elapsed <= SWEEP_SPREAD;
  if (!joined) {
    wave = {
      start: now,
      origin: from,
      speed: Math.max(WAVE_PACE / pace, (to - from) / WAVE_SPREAD),
    };
  }
  const { start, origin, speed } = wave;
  return {
    delay: (from - PAD - origin) / speed - (now - start),
    duration: (to - from + 2 * PAD) / speed,
  };
}

// The front's stops in the pane's own gradient, the content behind it and the skeleton ahead
const stops =
  (incoming: boolean) =>
  (progress: number, { rect, reveal }: WipePane) => {
    const at = (frontAt(progress, reveal) - uOf(rect)) * SLANT_COS;
    const ramp = Array.from({ length: STEPS + 1 }, (_, i) => {
      const shown = incoming ? 1 - ease(i / STEPS) : ease(i / STEPS);
      const offset = -FEATHER + (2 * FEATHER * i) / STEPS;
      return `rgb(0 0 0 / ${shown.toFixed(3)}) ${(at + offset).toFixed(2)}px`;
    });
    return `linear-gradient(${SLANT_ANGLE}, ${ramp.join(", ")})`;
  };

const SVG = "http://www.w3.org/2000/svg";
let host: SVGSVGElement | null = null;
let glosses = 0;

// One hidden svg on the page for the filters: `filter: url(#…)` can't reach into a shadow root
function filterHost() {
  if (!host?.isConnected) {
    host = document.createElementNS(SVG, "svg");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    document.body.append(host);
  }
  return host;
}

const svg = (tag: string, attributes: Record<string, string | number>) => {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, String(value));
  }
  return node;
};

/**
 * The band trailing the front: an SVG filter on the incoming pane that lifts
 * what the content paints toward white, so the surface around it —
 * transparent in the pane — never lights up.
 */
const gloss: Wipe["effect"] = (element, { rect, reveal, progress }) => {
  if (prefersReducedTransparency()) return;
  const from = uOf(rect);
  const span = spanOf(rect);
  const half = GLOSS / 2 / SLANT_COS;
  // The band's centre, in `u` from the pane's corner
  const centre = () =>
    frontAt(progress(), reveal) - from - GLOSS_LAG / SLANT_COS;
  if (centre() - half > span) return;

  // The band drawn once, slanted, in an image as tall as the pane; moving it along x moves it along the slant
  const width = 2 * half + rect.height * SLANT_TAN;
  const cx = width / 2;
  const cy = rect.height / 2;
  const dx = (GLOSS / 2) * SLANT_COS;
  const dy = (GLOSS / 2) * SLANT_TAN * SLANT_COS;
  // Drawn to a PNG: Safari's feImage renders no SVG, and the filter then hides what it's on
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(rect.height);
  const context = canvas.getContext("2d");
  if (!context) return;
  const gradient = context.createLinearGradient(
    cx - dx,
    cy - dy,
    cx + dx,
    cy + dy,
  );
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    gradient.addColorStop(
      t,
      `rgb(255 255 255 / ${ease(1 - Math.abs(t * 2 - 1)).toFixed(3)})`,
    );
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const id = `skullet-gloss-${++glosses}`;
  // In the pane's own box: WebKit doesn't measure a primitive's x and y from an HTML element's corner, and blanks it
  const filter = svg("filter", {
    id,
    "color-interpolation-filters": "sRGB",
    primitiveUnits: "objectBoundingBox",
  });
  const lit = svg("feComponentTransfer", {
    in: "SourceGraphic",
    result: "lit",
  });
  for (const channel of ["R", "G", "B"]) {
    lit.append(
      svg(`feFunc${channel}`, {
        type: "linear",
        slope: 1 - GLOSS_LIFT,
        intercept: GLOSS_LIFT,
      }),
    );
  }
  const image = svg("feImage", {
    href: canvas.toDataURL(),
    y: 0,
    width: width / rect.width,
    height: 1,
    preserveAspectRatio: "none",
    result: "band",
  });
  filter.append(
    lit,
    image,
    svg("feComposite", {
      in: "lit",
      in2: "band",
      operator: "in",
      result: "shine",
    }),
    svg("feComposite", { in: "shine", in2: "SourceGraphic", operator: "over" }),
  );
  filterHost().append(filter);
  element.style.filter = `url(#${id})`;

  const tick = () => {
    const at = centre();
    if (at - half > span || !element.isConnected) {
      // Off the pane before the filter goes: Safari doesn't render an element whose filter points at nothing.
      // By id, not exact text — the style reads back quoted
      if (element.style.filter.includes(id)) element.style.filter = "";
      filter.remove();
      return;
    }
    image.setAttribute(
      "x",
      ((at - cx - cy * SLANT_TAN) / rect.width).toFixed(4),
    );
    requestAnimationFrame(tick);
  };
  tick();
};

// Its own outgoing mask rather than a composited inverse: Safari 18 masks only the plainest gradient reliably
const wipe: Wipe = { mask: stops(true), out: stops(false), effect: gloss };

/** `smart`, wiping content in behind one band of the shimmer. */
export const sweep: RevealSpec = {
  hold: SKELETON_DELAY,
  choose: (context: RevealContext) => {
    const quick = quickly(context);
    if (quick) return quick;
    const swept = timing(context.reveal);
    return swept ? { wipe, ...swept } : byContent(context);
  },
};
