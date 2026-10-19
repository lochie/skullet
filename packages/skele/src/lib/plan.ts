import {
  ATTR_BONES,
  ATTR_EXITING,
  CASCADE_SPREAD,
  FADE_DURATION,
} from "./constants";
import { paceOf, SLANT_TAN } from "./shimmer";

/**
 * How content replaces its skeleton. `together` crossfades them whole;
 * `sequence` brings each piece in where its bone was, top to bottom; `smart`
 * picks for each reveal from how it loaded and what it holds; `sweep` is
 * `smart`, wiping content in behind one band of the shimmer.
 */
export type RevealMode = "together" | "sequence" | "smart" | "sweep";

export const SKELETON_DELAY = 150; // A skeleton up for less than this is a flash — smart holds it back
const QUICK_FADE = 120; // A refetch, already familiar
const SMALL_HEIGHT = 72;
const SMALL_PIECES = 3;
const SECONDARY_DELAY = 60; // Smaller text follows the text it sits under
const BATCH_WINDOW = 150; // Reveals landing this close share one top-to-bottom order
const ACTIVE_WINDOW = 400; // Input this recent means someone is mid-gesture
const WAVE_SPREAD = 360; // Most a sweep takes across the reveal that starts it
const WAVE_PACE = 2; // A sweep's front runs this many times the shimmer's pace
export const SWEEP_SPREAD = 600; // Most a sweep takes across a reveal that joins one under way

export type SequencePlan = {
  kind: "sequence";
  /** When a piece of content appears; null to appear at once. */
  pieceDelay: (piece: Element) => number | null;
  /** When a bone at `rect` goes; null to go at once. */
  boneDelay: (rect: DOMRect) => number | null;
  /** An image the bone at `rect` stands for, still loading — it waits for that instead. */
};

export type WipePlan = {
  kind: "wipe";
  /** ms from now until the front reaches `u` — a point's x, plus its y along the slant, in viewport px. */
  reach: (u: number) => number;
  /** px of `u` per ms. */
  speed: number;
};

export type Plan =
  | { kind: "instant" }
  | { kind: "together"; duration: number }
  | SequencePlan
  | WipePlan;

// Input, not scroll: a page restoring its scroll position isn't someone using it
let lastInput = -Infinity;
let listening = false;
function listen() {
  if (listening || typeof addEventListener === "undefined") return;
  listening = true;
  for (const type of ["wheel", "touchmove", "keydown", "pointerdown"]) {
    addEventListener(type, () => (lastInput = performance.now()), {
      passive: true,
      capture: true,
    });
  }
}

const loading = new WeakMap<Element, { since: number; exact: boolean }>();

/** Notes a skeleton going up in `reveal` — when, and whether it was drawn from the data on screen. */
export function noteSkeleton(
  reveal: Element,
  { served, exact }: { served: boolean; exact: boolean },
) {
  listen();
  const since = loading.get(reveal)?.since ?? performance.now();
  // Server-rendered: up since the page began, so never a flash
  loading.set(reveal, { since: served ? -Infinity : since, exact });
}

// What a reveal brings in one by one: anything holding text or media of its own
export function pieces(root: Element): Element[] {
  const found: Element[] = [];
  const visit = (element: Element) => {
    for (const child of element.children) {
      const ownText = [...child.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!child.firstElementChild || ownText || child.localName === "svg") {
        found.push(child);
      } else {
        visit(child);
      }
    }
  };
  visit(root);
  return found;
}

/** `sequence`: each piece timed by its place in the reveal, top to bottom, then a little left to right. */
export function positionPlan(area: DOMRect): SequencePlan {
  const delay = (rect: DOMRect) => {
    const down = (rect.top - area.top) / Math.max(area.height, 1);
    const across = (rect.left - area.left) / Math.max(area.width, 1);
    return Math.min(Math.max(down * 0.8 + across * 0.2, 0), 1) * CASCADE_SPREAD;
  };
  return {
    kind: "sequence",
    pieceDelay: (piece) => delay(piece.getBoundingClientRect()),
    boneDelay: delay,
  };
}

// A row of a list or a card of a grid: the piece's nearest ancestor with two or more siblings like it
function unitOf(piece: Element, root: Element): Element {
  for (
    let element: Element | null = piece;
    element && element !== root;
    element = element.parentElement
  ) {
    const parent = element.parentElement;
    if (!parent || parent === root.parentElement) break;
    const alike = [...parent.children].filter(
      (sibling) =>
        sibling.localName === element!.localName &&
        sibling.className === element!.className,
    );
    if (alike.length >= 3) return element;
  }
  return piece;
}

const contains = (outer: DOMRect, inner: DOMRect) => {
  const x = inner.left + inner.width / 2;
  const y = inner.top + inner.height / 2;
  return (
    x >= outer.left && x <= outer.right && y >= outer.top && y <= outer.bottom
  );
};

let batch = -Infinity;

/** `smart`, past its quick cases: rows arrive whole, in page order, on screen only, main text first. */
function smartSequence(content: Element): SequencePlan {
  const now = performance.now();
  if (now - batch > BATCH_WINDOW) batch = now;
  const late = now - batch;
  const view = innerHeight;

  type Unit = { rect: DOMRect; delay: number | null; size: number };
  const units = new Map<Element, Unit>();
  const pieceUnits = new Map<Element, Unit>();
  const sizeOf = (element: Element) =>
    parseFloat(getComputedStyle(element).fontSize) || 16;

  for (const piece of pieces(content)) {
    const element = unitOf(piece, content);
    let unit = units.get(element);
    if (!unit) {
      const rect = element.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < view;
      // Timed against the screen, not the reveal, so reveals landing together read as one page
      const at = Math.min(Math.max(rect.top / view, 0), 1) * CASCADE_SPREAD;
      unit = { rect, delay: onScreen ? Math.max(at - late, 0) : null, size: 0 };
      units.set(element, unit);
    }
    unit.size = Math.max(unit.size, sizeOf(piece));
    pieceUnits.set(piece, unit);
  }

  const unitAt = (rect: DOMRect) =>
    [...units.values()].find((unit) => contains(unit.rect, rect));

  return {
    kind: "sequence",
    pieceDelay: (piece) => {
      const unit = pieceUnits.get(piece);
      if (!unit || unit.delay === null) return null;
      return sizeOf(piece) < unit.size
        ? unit.delay + SECONDARY_DELAY
        : unit.delay;
    },
    boneDelay: (rect) => {
      const unit = unitAt(rect);
      if (!unit) return rect.bottom > 0 && rect.top < view ? 0 : null;
      if (unit.delay === null) return null;
      // A bar shorter than its row's largest type stands for smaller text
      return rect.height < unit.size * 0.8
        ? unit.delay + SECONDARY_DELAY
        : unit.delay;
    },
  };
}

let wave = { start: -Infinity, origin: 0, speed: 1 };

/** `sweep`: one front crosses the reveal at the shimmer's slant and pace, content behind it, skeleton ahead. */
function sweepPlan(reveal: Element): WipePlan | null {
  const layer = reveal.querySelector(
    `:scope > [${ATTR_EXITING}] [${ATTR_BONES}]`,
  );
  const pace =
    layer && typeof CSS.registerProperty === "function" && paceOf(layer);
  if (!pace) return null;

  const rect = reveal.getBoundingClientRect();
  const from = rect.left + rect.top * SLANT_TAN;
  const to = from + rect.width + rect.height * SLANT_TAN;
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
    kind: "wipe",
    reach: (u) => (u - origin) / speed - (performance.now() - start),
    speed,
  };
}

/** Decides how `content` replaces the skeleton in `reveal`, now that it has arrived. */
export function planReveal(
  content: HTMLElement,
  reveal: Element,
  sweep = false,
): Plan {
  const info = loading.get(reveal);
  loading.delete(reveal);
  const waited = info ? performance.now() - info.since : Infinity;

  if (
    performance.now() - lastInput < ACTIVE_WINDOW ||
    waited < SKELETON_DELAY
  ) {
    return { kind: "instant" };
  }
  if (info?.exact) return { kind: "together", duration: QUICK_FADE };
  const swept = sweep && sweepPlan(reveal);
  if (swept) return swept;

  const found = pieces(content);
  if (
    content.getBoundingClientRect().height < SMALL_HEIGHT ||
    found.length <= SMALL_PIECES
  ) {
    return { kind: "together", duration: FADE_DURATION };
  }
  return smartSequence(content);
}
