import {
  ATTR_BONE,
  ATTR_BONES,
  ATTR_EXITING,
  ATTR_GHOST,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_SNAPSHOT,
  BASE,
  FADE_DURATION,
  RESIZE_DURATION,
} from "./constants";
import { imageReady, pendingImages } from "./images";
import { prefersReducedMotion } from "./motion";
import { warnOnce } from "./dev";
import {
  planReveal,
  pieces,
  type Plan,
  type RevealMode,
  type SequencePlan,
  type WipePlan,
} from "./plan";
import { revealSpec } from "./reveals";
import { bonesOf, shimmer } from "./shimmer";

export { prefersReducedMotion };

const noop = () => {};

const settle = (animation: Animation) => animation.finished.then(noop, noop);

// How a reveal's incoming pane decided to arrive, for its outgoing pane to match
const plans = new WeakMap<Element, Plan | { kind: "skeleton"; hold: number }>();

function appear(
  element: Element,
  delay = 0,
  duration = FADE_DURATION,
  from = 0,
  enter?: Keyframe,
) {
  if (prefersReducedMotion()) return Promise.resolve();
  return settle(
    element.animate([{ ...enter, opacity: from }, { opacity: 1 }], {
      duration,
      delay,
      easing: "ease",
      fill: "backwards",
    }),
  );
}

// The bones layer, or the ghost a skeleton is drawn from — vanilla adds its layer a moment later
const isSkeleton = (element: Element) =>
  !!element.querySelector(
    `[${ATTR_BONES}], [${ATTR_GHOST}], :scope > [${ATTR_OWN}]`,
  );

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

// Each image still loading stays hidden behind a bone of its own until it's ready, so nothing else waits on it
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
      return appear(piece, delay, plan.duration, 0, plan.enter);
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
 * Brings a pane in. A skeleton fades up, held back for the reveal's `hold`,
 * so data that beats it never shows one. Content arrives as `reveal` plans,
 * each image still loading behind a bone of its own. `initial` is a reveal's
 * first pane, which has nothing to replace.
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
  const spec = revealSpec(reveal);

  if (isSkeleton(element)) {
    if (root) clearStandIns(root);
    const hold = Math.max(spec.hold ?? 0, 0);
    if (!hold) {
      if (root) plans.delete(root);
      return initial ? Promise.resolve() : appear(element);
    }
    if (root) plans.set(root, { kind: "skeleton", hold });
    // A reveal's first skeleton has nothing on screen to hold back for — held, it would only be a blank
    if (initial) return Promise.resolve();
    return appear(element, hold);
  }
  if (initial || !root) return Promise.resolve();

  const from = takeOver(root);
  if (from > 0.01) {
    const duration = FADE_DURATION * (1 - from);
    plans.set(root, { kind: "together", delay: 0, duration });
    return appear(element, 0, duration, from);
  }

  holdImages(element, root);

  const plan = planReveal(element, root, spec, (key) =>
    warnOnce(
      `enter:${key}`,
      `\`enter\` can't set \`${key}\`: only properties that change nothing's layout animate, so the reveal never moves the page.`,
    ),
  );
  plans.set(root, plan);
  if (plan.kind === "instant") {
    clearExiting(root);
    return Promise.resolve();
  }
  if (plan.kind === "sequence") return sequenceIn(element, plan);
  if (plan.kind === "wipe") return wipe(element, plan, true);
  return appear(element, plan.delay, plan.duration, 0, plan.enter);
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
  clearMask(element);
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
    const instant = prefersReducedMotion() || plan?.kind === "instant";
    if (parent && !instant) resize(parent, stood);

    // Content stays until the skeleton replacing it shows — which may be never
    if (plan?.kind === "skeleton") return fade(plan.hold, FADE_DURATION);
    if (instant) {
      element.style.opacity = "0";
      return;
    }
    if (plan?.kind === "sequence" && isSkeleton(element)) {
      return sequenceOut(element, plan);
    }
    if (plan?.kind === "wipe" && isSkeleton(element)) {
      return wipe(element, plan, false);
    }
    if (plan?.kind === "together") return fade(plan.delay, plan.duration);
    return fade(0, FADE_DURATION);
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
            duration: plan.duration,
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

const STALL = 100; // ms between frames that counts as frames dropping — the wipe gives way to a crossfade

// Running fronts, by pane — stopped when the pane's mask is cleared
const fronts = new WeakMap<HTMLElement, () => void>();

// Prefixed too: Safari before 15.4 masks with -webkit- only
function setMask(element: HTMLElement, image: string) {
  element.style.setProperty("mask-image", image);
  element.style.setProperty("-webkit-mask-image", image);
}

// The inverse of `image`: a full layer with `image` cut out of it
function setInverseMask(element: HTMLElement, image: string) {
  setMask(element, `linear-gradient(#000 0 0), ${image}`);
  // Prefixed first: WebKit aliases the two, and the later wins
  element.style.setProperty("-webkit-mask-composite", "xor");
  element.style.setProperty("mask-composite", "exclude");
}

function clearMask(element: HTMLElement) {
  fronts.get(element)?.();
  for (const property of [
    "mask-image",
    "-webkit-mask-image",
    "mask-composite",
    "-webkit-mask-composite",
  ]) {
    element.style.removeProperty(property);
  }
}

// A wipe across one pane on the plan's shared clock; the plainest mask, rewritten each frame, for Safari 18
function wipe(element: HTMLElement, plan: WipePlan, incoming: boolean) {
  const pane = { rect: element.getBoundingClientRect(), reveal: plan.reveal };
  const { mask, out } = plan.wipe;
  const draw = (at: number) => {
    if (incoming) setMask(element, mask(at, pane));
    else if (out) setMask(element, out(at, pane));
    else setInverseMask(element, mask(at, pane));
  };
  const progress = () => (performance.now() - plan.start) / plan.duration;
  if (progress() >= 1) {
    if (!incoming) element.style.opacity = "0";
    return Promise.resolve();
  }
  if (incoming) {
    plan.wipe.effect?.(element, { ...pane, progress });
    if (plan.enter) {
      element.animate([plan.enter, {}], {
        duration: plan.duration,
        delay: Math.max(plan.start - performance.now(), 0),
        easing: "ease",
        fill: "backwards",
      });
    }
  }

  // Resolves null once crossed, or with how far it got when frames dropped and the wipe gave way
  const run = new Promise<number | null>((resolve) => {
    let frame = 0;
    let last = performance.now();
    let at = 0;
    const tick = () => {
      const now = performance.now();
      if (now - last > STALL) plan.stalled = true;
      last = now;
      if (plan.stalled) return done(at);
      at = Math.min(Math.max(progress(), 0), 1);
      draw(at);
      if (at < 1) frame = requestAnimationFrame(tick);
      else done(null);
    };
    const done = (stalledAt: number | null = null) => {
      cancelAnimationFrame(frame);
      fronts.delete(element);
      resolve(stalledAt);
    };
    fronts.set(element, done);
    tick();
  });

  return run.then((stalledAt) => {
    clearMask(element);
    if (stalledAt === null) {
      if (!incoming) element.style.opacity = "0";
      return;
    }
    // Frames dropped: the rest as a crossfade, from as far as the front got
    const rest = FADE_DURATION * (1 - stalledAt);
    if (incoming) return appear(element, 0, rest, stalledAt);
    return settle(
      element.animate([{ opacity: 1 - stalledAt }, { opacity: 0 }], {
        duration: rest,
        easing: "ease",
        fill: "forwards",
      }),
    ).then(() => {
      element.style.opacity = "0";
    });
  });
}
