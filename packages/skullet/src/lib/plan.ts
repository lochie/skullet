import { ATTR_EXITING, CASCADE_SPREAD, FADE_DURATION } from "./constants";

/** Where one piece of a reveal sits: a piece of content arriving, or a bone of the skeleton leaving. */
export type Piece = {
  rect: DOMRect;
  /** Its row or card: the nearest ancestor with two or more siblings like it. Null for a bone outside any. */
  unit: DOMRect | null;
  /** Smaller text than the largest in its unit. */
  secondary: boolean;
  /** The whole reveal. */
  reveal: DOMRect;
  /** ms since the first of the reveals landing alongside this one. */
  late: number;
};

/** What a reveal knows as its content lands, for `choose`. */
export type RevealContext = {
  content: HTMLElement;
  reveal: HTMLElement;
  /** ms the skeleton was up; Infinity when it was server-rendered or there was none. */
  waited: number;
  /** Someone scrolled, typed or tapped in the last 400ms. */
  input: boolean;
  /** The skeleton was drawn from the data on screen. */
  refetch: boolean;
  height: number;
  /** How many pieces the content arrives in. */
  pieces: number;
};

/** One pane under a wipe: `rect` is its own box, `reveal` the box the front crosses, both in viewport px. */
export type WipePane = { rect: DOMRect; reveal: DOMRect };

/** A front crossing the whole reveal, as a mask drawn each frame. */
export type Wipe = {
  /** The incoming pane's `mask-image` at `progress`, 0 to 1. */
  mask: (progress: number, pane: WipePane) => string;
  /** The outgoing pane's; the inverse of `mask` when left out. */
  out?: (progress: number, pane: WipePane) => string;
  /** Runs once on the incoming pane; `progress` keeps counting past 1. */
  effect?: (
    element: HTMLElement,
    front: WipePane & { progress: () => number },
  ) => void;
};

/**
 * How content replaces its skeleton. `order` times each piece; `wipe` takes
 * the reveal whole instead. `choose` decides the rest as content lands —
 * whatever it returns wins, and the fields beside it fill what it leaves.
 */
export type RevealSpec = {
  order?: "together" | ((piece: Piece) => number | null);
  /** Where each piece starts from, on top of the fade: `{ filter: "blur(6px)" }`. */
  enter?: Keyframe;
  wipe?: Wipe;
  delay?: number;
  /** 0 is instant. */
  duration?: number;
  /** ms a skeleton waits before it shows, so data that beats it never shows one. */
  hold?: number;
  choose?: (context: RevealContext) => RevealSpec;
};

/** A built-in reveal by name, or one of your own. */
export type RevealMode =
  | "together"
  | "sequence"
  | "smart"
  | "sweep"
  | RevealSpec;

export const SKELETON_DELAY = 150; // A skeleton up for less than this is a flash — smart holds it back
export const QUICK_FADE = 120; // A refetch, already familiar
export const SMALL_HEIGHT = 72;
export const SMALL_PIECES = 3;
export const SECONDARY_DELAY = 60; // Smaller text follows the text it sits under
export const BATCH_WINDOW = 150; // Reveals landing this close share one top-to-bottom order
const ACTIVE_WINDOW = 400; // Input this recent means someone is mid-gesture
export const MAX_SWEEP_AREA = 1.5; // in screens — a wipe bigger than this crossfades: a front across it is mostly off screen, and costly
export const MAX_DELAY = 1000; // A custom order's latest piece
export const MAX_DURATION = 1000;

// What `enter` may set: nothing that changes layout, so no reveal moves the page
const ENTER = new Set([
  "filter",
  "transform",
  "translate",
  "scale",
  "rotate",
  "clipPath",
  "easing",
  "composite",
]);

export type SequencePlan = {
  kind: "sequence";
  /** When a piece of content appears; null to appear at once. */
  pieceDelay: (piece: Element) => number | null;
  /** When a bone at `rect` goes; null to go at once. */
  boneDelay: (rect: DOMRect) => number | null;
  duration: number;
  enter?: Keyframe;
};

export type WipePlan = {
  kind: "wipe";
  wipe: Wipe;
  /** performance.now() at progress 0. */
  start: number;
  duration: number;
  reveal: DOMRect;
  enter?: Keyframe;
  /** Set when frames drop mid-wipe: both panes finish as a crossfade instead. */
  stalled?: boolean;
};

export type Plan =
  | { kind: "instant" }
  | { kind: "together"; delay: number; duration: number; enter?: Keyframe }
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

/** The box a wipe crosses: the reveal, and any pane leaving it that stands taller or wider. */
export function revealBox(root: Element): DOMRect {
  let { left, top, right, bottom } = root.getBoundingClientRect();
  for (const pane of root.querySelectorAll(`:scope > [${ATTR_EXITING}]`)) {
    const rect = pane.getBoundingClientRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

let batch = -Infinity;

/** Times each piece of `content`, and each bone it replaces, by `order`. */
function sequencePlan(
  content: Element,
  root: Element,
  order: (piece: Piece) => number | null,
  spec: RevealSpec,
  duration: number,
): SequencePlan {
  const now = performance.now();
  if (now - batch > BATCH_WINDOW) batch = now;
  const late = now - batch;
  const reveal = root.getBoundingClientRect();

  type Unit = { rect: DOMRect; size: number };
  const units = new Map<Element, Unit>();
  const found = new Map<Element, { unit: Unit; size: number }>();
  const sizeOf = (element: Element) =>
    parseFloat(getComputedStyle(element).fontSize) || 16;

  for (const piece of pieces(content)) {
    const element = unitOf(piece, content);
    let unit = units.get(element);
    if (!unit) {
      unit = { rect: element.getBoundingClientRect(), size: 0 };
      units.set(element, unit);
    }
    const size = sizeOf(piece);
    unit.size = Math.max(unit.size, size);
    found.set(piece, { unit, size });
  }

  const at = (piece: Piece) => {
    const delay = order(piece);
    return delay === null ? null : clamp(delay, MAX_DELAY) + (spec.delay ?? 0);
  };

  return {
    kind: "sequence",
    duration,
    enter: spec.enter,
    pieceDelay: (element) => {
      const piece = found.get(element);
      if (!piece) return null;
      return at({
        rect: element.getBoundingClientRect(),
        unit: piece.unit.rect,
        secondary: piece.size < piece.unit.size,
        reveal,
        late,
      });
    },
    boneDelay: (rect) => {
      const unit = [...units.values()].find((unit) =>
        contains(unit.rect, rect),
      );
      return at({
        rect,
        unit: unit?.rect ?? null,
        // A bar shorter than its row's largest type stands for smaller text
        secondary: !!unit && rect.height < unit.size * 0.8,
        reveal,
        late,
      });
    },
  };
}

/** Keeps `enter` to what paints, warning in development about anything that would move the page. */
function enterOf(enter: Keyframe | undefined, warn: (key: string) => void) {
  if (!enter) return undefined;
  const kept: Keyframe = {};
  for (const [key, value] of Object.entries(enter)) {
    if (ENTER.has(key)) kept[key] = value;
    else if (key !== "opacity") warn(key);
  }
  return kept;
}

/** Decides how `content` replaces the skeleton in `root`, now that it has arrived. */
export function planReveal(
  content: HTMLElement,
  root: HTMLElement,
  reveal: RevealSpec,
  warn: (key: string) => void = () => {},
): Plan {
  const info = loading.get(root);
  loading.delete(root);

  let spec = reveal;
  while (spec.choose) {
    const { choose, ...rest } = spec;
    spec = {
      ...rest,
      ...choose({
        content,
        reveal: root,
        waited: info ? performance.now() - info.since : Infinity,
        input: performance.now() - lastInput < ACTIVE_WINDOW,
        refetch: !!info?.exact,
        height: content.getBoundingClientRect().height,
        pieces: pieces(content).length,
      }),
    };
  }

  const duration = clamp(spec.duration ?? FADE_DURATION, MAX_DURATION);
  if (!duration) return { kind: "instant" };
  const enter = enterOf(spec.enter, warn);

  if (spec.wipe) {
    const rect = revealBox(root);
    if (rect.width * rect.height <= innerWidth * innerHeight * MAX_SWEEP_AREA) {
      return {
        kind: "wipe",
        wipe: spec.wipe,
        start: performance.now() + (spec.delay ?? 0),
        duration,
        reveal: rect,
        enter,
      };
    }
  } else if (typeof spec.order === "function") {
    return sequencePlan(
      content,
      root,
      spec.order,
      { ...spec, enter },
      duration,
    );
  }
  return { kind: "together", delay: spec.delay ?? 0, duration, enter };
}

/** `sequence`: each piece timed by its place in the reveal, top to bottom, then a little left to right. */
export const byPosition = ({ rect, reveal }: Piece) => {
  const down = (rect.top - reveal.top) / Math.max(reveal.height, 1);
  const across = (rect.left - reveal.left) / Math.max(reveal.width, 1);
  return clamp(down * 0.8 + across * 0.2, 1) * CASCADE_SPREAD;
};

const onScreen = (rect: DOMRect) => rect.bottom > 0 && rect.top < innerHeight;

/** `smart`'s order: rows arrive whole, in page order, on screen only, main text first. */
export const byRow = ({ rect, unit, secondary, late }: Piece) => {
  if (!unit) return onScreen(rect) ? 0 : null;
  if (!onScreen(unit)) return null;
  // Timed against the screen, not the reveal, so reveals landing together read as one page
  const at = clamp(unit.top / innerHeight, 1) * CASCADE_SPREAD;
  return Math.max(at - late, 0) + (secondary ? SECONDARY_DELAY : 0);
};

export const instant: RevealSpec = { duration: 0 };
export const together: RevealSpec = { order: "together" };
export const sequence: RevealSpec = { order: byPosition };

/** The cases `smart` settles before looking at the content: instant, or a quick crossfade. */
export const quickly = (context: RevealContext): RevealSpec | null =>
  context.input || context.waited < SKELETON_DELAY
    ? instant
    : context.refetch
      ? { order: "together", duration: QUICK_FADE }
      : null;

/** `together` for a small reveal, else `byRow`. */
export const byContent = (context: RevealContext): RevealSpec =>
  context.height < SMALL_HEIGHT || context.pieces <= SMALL_PIECES
    ? together
    : { order: byRow };

/** Picks for each reveal from how it loaded and what it holds, holding its skeleton back a moment. */
export const smart: RevealSpec = {
  hold: SKELETON_DELAY,
  choose: (context) => quickly(context) ?? byContent(context),
};
