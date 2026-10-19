import {
  ATTR_BONE,
  ATTR_BONES,
  ATTR_EXITING,
  ATTR_GHOST,
  ATTR_PANE,
  ATTR_SNAPSHOT,
  BASE,
  FADE_DURATION,
  RESIZE_DURATION,
} from "./constants";
import { imageReady, pendingImages } from "./images";
import { prefersReducedMotion } from "./motion";
import {
  planReveal,
  positionPlan,
  pieces,
  SKELETON_DELAY,
  type Plan,
  type RevealMode,
  type SequencePlan,
  type WipePlan,
} from "./plan";
import {
  bonesOf,
  shimmer,
  ease,
  SLANT_ANGLE,
  SLANT_COS,
  SLANT_TAN,
  STEPS,
} from "./shimmer";

export { prefersReducedMotion };

const noop = () => {};

const settle = (animation: Animation) => animation.finished.then(noop, noop);

// How a reveal's incoming pane decided to arrive, for its outgoing pane to match;
// "skeleton" when a skeleton is arriving, which smart holds back for a moment
const plans = new WeakMap<Element, Plan | "skeleton">();

function appear(
  element: Element,
  delay = 0,
  duration = FADE_DURATION,
  from = 0,
) {
  if (prefersReducedMotion()) return Promise.resolve();
  return settle(
    element.animate([{ opacity: from }, { opacity: 1 }], {
      duration,
      delay,
      easing: "ease",
      fill: "backwards",
    }),
  );
}

// The bones layer, or the ghost a skeleton is drawn from — vanilla adds its layer a moment later
const isSkeleton = (element: Element) =>
  !!element.querySelector(`[${ATTR_BONES}], [${ATTR_GHOST}]`);

const sameBox = (a: DOMRect, b: DOMRect) =>
  Math.abs(a.left - b.left) < 2 &&
  Math.abs(a.top - b.top) < 2 &&
  Math.abs(a.width - b.width) < 2 &&
  Math.abs(a.height - b.height) < 2;

// Bones standing in for images still loading, by reveal
const standIns = new WeakMap<Element, Set<HTMLElement>>();

function clearStandIns(root: Element) {
  for (const stand of standIns.get(root) ?? []) stand.remove();
  standIns.delete(root);
}

/**
 * Content landing over a skeleton with images still loading: each image stays
 * hidden behind a bone of its own until it's ready, so nothing else waits on it.
 */
function holdImages(element: HTMLElement, root: HTMLElement) {
  const images = pendingImages(element);
  const overSkeleton = [...root.children].some(
    (pane) =>
      pane !== element && pane.hasAttribute(ATTR_PANE) && isSkeleton(pane),
  );
  if (!images.length || !overSkeleton) return;
  for (const image of images) image.style.opacity = "0";

  // A microtask on, once the skeleton has popped out — layout read any sooner moves the page
  queueMicrotask(() => {
    if (!element.isConnected) return;
    const origin = root.getBoundingClientRect();
    const bones = [
      ...root.querySelectorAll(`:scope > [${ATTR_EXITING}] [${ATTR_BONES}]`),
    ].flatMap(bonesOf);
    const stands = standIns.get(root) ?? new Set<HTMLElement>();
    standIns.set(root, stands);

    for (const image of images) {
      const rect = image.getBoundingClientRect();
      // Its bone in the skeleton, which the stand-in takes over exactly
      const bone = bones.find((b) => sameBox(b.getBoundingClientRect(), rect));
      const box = bone?.getBoundingClientRect() ?? rect;
      const stand = document.createElement("div");
      stand.setAttribute(ATTR_BONE, "");
      Object.assign(stand.style, {
        position: "absolute",
        left: `${box.left - origin.left - root.clientLeft}px`,
        top: `${box.top - origin.top - root.clientTop}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        borderRadius:
          bone?.style.borderRadius || getComputedStyle(image).borderRadius,
        backgroundColor: BASE,
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
      });
      root.append(stand);
      stands.add(stand);
      if (bone) bone.style.visibility = "hidden";
      shimmer(stand);

      imageReady(image).then(() => {
        if (!stands.has(stand)) return;
        stands.delete(stand);
        image.style.opacity = "";
        appear(image);
        if (prefersReducedMotion()) return stand.remove();
        settle(
          stand.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: FADE_DURATION,
            easing: "ease",
            fill: "forwards",
          }),
        ).then(() => stand.remove());
      });
    }
  });
}

function sequenceIn(element: HTMLElement, plan: SequencePlan) {
  if (prefersReducedMotion()) return Promise.resolve();
  return Promise.all(
    pieces(element).map((piece) => {
      const delay = plan.pieceDelay(piece);
      if (delay === null) return;
      return appear(piece, delay);
    }),
  ).then(noop);
}

// Content arriving at once: anything still on its way out goes now too
function clearExiting(root: Element) {
  for (const pane of root.querySelectorAll<HTMLElement>(
    `:scope > [${ATTR_EXITING}]`,
  )) {
    for (const animation of pane.getAnimations()) animation.finish();
    pane.style.opacity = "0";
  }
}

// Content still fading out as content lands again — what the new pane takes over from, so the two never dip together
function takeOver(root: Element) {
  let from = 0;
  for (const pane of root.querySelectorAll<HTMLElement>(
    `:scope > [${ATTR_EXITING}]`,
  )) {
    if (isSkeleton(pane)) continue;
    from = Math.max(from, parseFloat(getComputedStyle(pane).opacity) || 0);
    for (const animation of pane.getAnimations()) animation.finish();
    pane.style.opacity = "0";
  }
  return from;
}

/**
 * Brings a pane in. A skeleton fades up — held back a moment under `smart`,
 * so data that beats it never shows one. Content arrives as `reveal` says,
 * after its images unless `smart` gives each image its own moment.
 * `initial` is a reveal's first pane, which has nothing to replace.
 */
export function fadeIn(
  element: HTMLElement,
  reveal: RevealMode = "smart",
  { initial = false } = {},
): Promise<void> {
  let arriving = arrivals.get(element);
  if (!arriving) {
    arriving = arrive(element, reveal, initial);
    arrivals.set(element, arriving);
  }
  return arriving;
}

// One arrival per pane: StrictMode mounts twice, and a second plan would part from the first, which the outgoing pane already matched
const arrivals = new WeakMap<HTMLElement, Promise<void>>();

function arrive(
  element: HTMLElement,
  reveal: RevealMode,
  initial: boolean,
): Promise<void> {
  const root = element.parentElement;

  if (isSkeleton(element)) {
    if (root) clearStandIns(root);
    if (reveal !== "smart" && reveal !== "sweep") {
      if (root) plans.delete(root);
      return initial ? Promise.resolve() : appear(element);
    }
    if (root) plans.set(root, "skeleton");
    // A reveal's first skeleton has nothing on screen to hold back for — held, it would only be a blank
    if (initial) return Promise.resolve();
    return appear(element, SKELETON_DELAY);
  }
  if (initial || !root) return Promise.resolve();

  const from = takeOver(root);
  if (from > 0.01) {
    const duration = FADE_DURATION * (1 - from);
    plans.set(root, { kind: "together", duration });
    return appear(element, 0, duration, from);
  }

  holdImages(element, root);

  if (reveal === "smart" || reveal === "sweep") {
    const plan = planReveal(element, root, reveal === "sweep");
    plans.set(root, plan);
    if (plan.kind === "instant") {
      clearExiting(root);
      return Promise.resolve();
    }
    if (plan.kind === "sequence") return sequenceIn(element, plan);
    if (plan.kind === "wipe") return wipe(element, plan, true);
    return appear(element, 0, plan.duration);
  }

  if (reveal === "sequence") {
    const plan = positionPlan(root.getBoundingClientRect());
    plans.set(root, plan);
    return sequenceIn(element, plan);
  }

  plans.set(root, { kind: "together", duration: FADE_DURATION });
  return appear(element);
}

/** Where a pane stands within its reveal — what it's pinned to when it pops out. */
export type PaneBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Measures `element` for `fadeOut`. Taken before the pane replacing it is in
 * the document, it reads a settled page: measured after, the layout it forces
 * has both panes in flow at once, and the browser's scroll anchoring corrects
 * for content that seemed to move — scrolling the page as reveals land.
 */
export function boxOf(element: HTMLElement): PaneBox {
  // Fractional, not offset*: a width rounded down rewraps a shrink-to-fit pane's text as it leaves
  const rect = element.getBoundingClientRect();
  const parent = element.offsetParent ?? document.documentElement;
  const origin = parent.getBoundingClientRect();
  return {
    top: rect.top - origin.top - parent.clientTop,
    left: rect.left - origin.left - parent.clientLeft,
    width: rect.width,
    height: rect.height,
  };
}

// Takes the element out of flow where it stands, so what replaces it lays out at once
function popOut(element: HTMLElement, box = boxOf(element)) {
  Object.assign(element.style, {
    position: "absolute",
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    margin: "0",
    boxSizing: "border-box",
    pointerEvents: "none",
  });
  element.inert = true;
  element.setAttribute(ATTR_EXITING, "");
  return box;
}

type Resize = { animation: Animation; overflow: string; boxSizing: string };

// A reveal's running resize, so the next starts from where it got to and restores the styles it found
const resizes = new WeakMap<HTMLElement, Resize>();

// Eases a reveal from the height the outgoing pane gave it to the incoming one's; the outgoing pane is already out of flow
function resize(root: HTMLElement, box: PaneBox) {
  const incoming = root.querySelector<HTMLElement>(
    `:scope > [${ATTR_PANE}]:not([${ATTR_EXITING}])`,
  );
  if (!incoming) return;
  const running = resizes.get(root);
  const shown = root.getBoundingClientRect().height;
  running?.animation.cancel();
  const to = root.getBoundingClientRect().height;
  const from = running
    ? shown
    : to - incoming.getBoundingClientRect().height + box.height;
  if (Math.abs(from - to) < 0.5) {
    if (running) restore(root, running);
    return;
  }

  const { overflow, boxSizing } = running ?? root.style;
  Object.assign(root.style, { overflow: "clip", boxSizing: "border-box" });
  const animation = root.animate(
    [{ height: `${from}px` }, { height: `${to}px` }],
    { duration: RESIZE_DURATION, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  );
  const current = { animation, overflow, boxSizing };
  resizes.set(root, current);
  settle(animation).then(() => {
    if (resizes.get(root) === current) restore(root, current);
  });
}

function restore(root: HTMLElement, { overflow, boxSizing }: Resize) {
  resizes.delete(root);
  Object.assign(root.style, { overflow, boxSizing });
}

/**
 * Resolves once the element can be removed. Its parent must be positioned.
 * How it leaves matches the pane replacing it, which decides.
 */
export function fadeOut(element: HTMLElement, box?: PaneBox): Promise<void> {
  // Read before cancelling, so an interrupted fade-in leaves from where it got to
  const opacity = parseFloat(getComputedStyle(element).opacity);
  const from = Number.isNaN(opacity) ? 1 : opacity;
  for (const animation of element.getAnimations()) animation.cancel();
  element.style.maskImage = "";
  element.style.filter = "";

  const parent = element.parentElement;
  // Content moving on: the bones standing in for its images go with it
  if (parent && !isSkeleton(element)) clearStandIns(parent);
  const stood = popOut(element, box);

  const fade = (delay: number, duration: number) =>
    settle(
      element.animate([{ opacity: from }, { opacity: 0 }], {
        duration: duration * from,
        delay,
        easing: "ease",
        fill: "forwards",
      }),
    );

  // A microtask on, so the pane replacing it has registered how it arrives
  return Promise.resolve().then(() => {
    const plan = parent && plans.get(parent);
    const instant =
      prefersReducedMotion() ||
      (plan !== "skeleton" && plan?.kind === "instant");
    if (parent && !instant) resize(parent, stood);

    // Content stays until the skeleton replacing it shows — which may be never
    if (plan === "skeleton") return fade(SKELETON_DELAY, FADE_DURATION);
    if (prefersReducedMotion() || plan?.kind === "instant") {
      element.style.opacity = "0";
      return;
    }
    if (plan?.kind === "sequence" && isSkeleton(element)) {
      return sequenceOut(element, plan);
    }
    if (plan?.kind === "wipe" && isSkeleton(element)) {
      return wipe(element, plan, false);
    }
    return fade(0, plan?.kind === "together" ? plan.duration : FADE_DURATION);
  });
}

function sequenceOut(element: HTMLElement, plan: SequencePlan) {
  // The content's own surfaces arrive whole; only the bones go piece by piece
  for (const ghost of element.querySelectorAll<HTMLElement>(
    `[${ATTR_GHOST}], [${ATTR_SNAPSHOT}]`,
  )) {
    ghost.style.visibility = "hidden";
  }

  const bones = [...element.querySelectorAll(`[${ATTR_BONES}]`)].flatMap(
    bonesOf,
  );
  return Promise.all(
    bones.map((bone) => {
      const rect = bone.getBoundingClientRect();
      const go = (delay: number) =>
        settle(
          bone.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: FADE_DURATION,
            delay,
            easing: "ease",
            fill: "forwards",
          }),
        );
      const delay = plan.boneDelay(rect);
      if (delay === null) {
        bone.style.opacity = "0";
        return;
      }
      return go(delay);
    }),
  ).then(noop);
}

const WIPE = "--skele-wipe";
const FEATHER = 40; // px either side of a wipe's front, across the slant

let registered = false;
function registerWipe() {
  if (registered) return;
  registered = true;
  // Registered, so it animates as a length rather than flipping at the end
  try {
    CSS.registerProperty({
      name: WIPE,
      syntax: "<length>",
      inherits: false,
      initialValue: "0px",
    });
  } catch {
    // Already registered, by another copy of skele
  }
}

const GLOSS = 320; // px across the slant: the band trailing a wipe's front, as wide as the shimmer's widest
const GLOSS_LAG = 120; // px its centre trails the front by
const GLOSS_LIFT = 0.45; // How far, at its peak, it lifts the content it crosses toward white

// When a front crosses `rect`, starting and ending `margin` px across the slant beyond it
function crossing(rect: DOMRect, plan: WipePlan, margin: number) {
  const from = rect.left + rect.top * SLANT_TAN;
  const span = rect.width + rect.height * SLANT_TAN;
  const pad = margin / SLANT_COS;
  return {
    begin: plan.reach(from - pad),
    end: plan.reach(from + span + pad),
    length: span * SLANT_COS,
  };
}

// Animates `element`'s front across it; `stop(i)` places the i-th of STEPS + 1 stops against it
function front(
  element: HTMLElement,
  plan: WipePlan,
  margin: number,
  stop: (i: number) => string,
) {
  const { begin, end, length } = crossing(
    element.getBoundingClientRect(),
    plan,
    margin,
  );
  if (end <= 0) return null;
  const image = `linear-gradient(${SLANT_ANGLE}, ${Array.from({ length: STEPS + 1 }, (_, i) => stop(i)).join(", ")})`;
  const animation = element.animate(
    [{ [WIPE]: `${-margin}px` }, { [WIPE]: `${length + margin}px` }],
    { duration: end - begin, delay: begin, fill: "both" },
  );
  return { image, animation };
}

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
 * The band trailing a wipe's front: an SVG filter on the incoming pane that
 * lifts what the content paints toward white, so the surface around it —
 * transparent in the pane — never lights up.
 */
function gloss(element: HTMLElement, plan: WipePlan) {
  const rect = element.getBoundingClientRect();
  const from = rect.left + rect.top * SLANT_TAN;
  const span = rect.width + rect.height * SLANT_TAN;
  const half = GLOSS / 2 / SLANT_COS;
  // The band's centre, in `u` from the pane's corner
  const centre = () => -plan.reach(from) * plan.speed - GLOSS_LAG / SLANT_COS;
  if (centre() - half > span) return;

  // The band drawn once, slanted, in an image as tall as the pane; moving it along x moves it along the slant
  const width = 2 * half + rect.height * SLANT_TAN;
  const cx = width / 2;
  const cy = rect.height / 2;
  const dx = (GLOSS / 2) * SLANT_COS;
  const dy = (GLOSS / 2) * SLANT_TAN * SLANT_COS;
  const stops = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const alpha = ease(1 - Math.abs(t * 2 - 1));
    return `<stop offset="${t.toFixed(3)}" stop-color="#fff" stop-opacity="${alpha.toFixed(3)}"/>`;
  }).join("");
  const band = `<svg xmlns="${SVG}" width="${width}" height="${rect.height}"><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${cx - dx}" y1="${cy - dy}" x2="${cx + dx}" y2="${cy + dy}">${stops}</linearGradient><rect width="100%" height="100%" fill="url(#g)"/></svg>`;

  const id = `skele-gloss-${++glosses}`;
  const filter = svg("filter", {
    id,
    "color-interpolation-filters": "sRGB",
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
    href: `data:image/svg+xml,${encodeURIComponent(band)}`,
    y: 0,
    width,
    height: rect.height,
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
      filter.remove();
      if (element.style.filter === `url(#${id})`) element.style.filter = "";
      return;
    }
    image.setAttribute("x", (at - cx - cy * SLANT_TAN).toFixed(1));
    requestAnimationFrame(tick);
  };
  tick();
}

/**
 * A sweep's front crossing one pane: incoming content shows behind it, the
 * skeleton ahead of it. Both panes share the plan's clock, so the two masks
 * meet exactly; the incoming one brings the band that trails it.
 */
function wipe(element: HTMLElement, plan: WipePlan, incoming: boolean) {
  registerWipe();
  const run = front(element, plan, FEATHER, (i) => {
    const shown = incoming ? 1 - ease(i / STEPS) : ease(i / STEPS);
    const at = -FEATHER + (2 * FEATHER * i) / STEPS;
    return `rgb(0 0 0 / ${shown.toFixed(3)}) calc(var(${WIPE}) + ${at.toFixed(2)}px)`;
  });
  if (!run) {
    if (!incoming) element.style.opacity = "0";
    return Promise.resolve();
  }
  if (incoming) gloss(element, plan);

  element.style.maskImage = run.image;
  return settle(run.animation).then(() => {
    if (incoming) {
      run.animation.cancel();
      element.style.maskImage = "";
    } else {
      element.style.opacity = "0";
    }
  });
}
