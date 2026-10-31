import {
  ATTR_BLOCK,
  ATTR_COVERED,
  ATTR_IGNORE,
  ATTR_OWN,
  MEDIA_TAGS,
  TEXT_TAGS,
} from "./constants";

/** A box to draw, relative to the layer it was measured against. */
export type SkeletonRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: string;
};

type Rect = { left: number; right: number; top: number; bottom: number };

// Corner radii in px: top left, top right, bottom right, bottom left
type Corners = [number, number, number, number];

// Overflow a box hides, which a bone must not paint past, with the corners it rounds; null while nothing clips
type Clip = (Rect & { corners: Corners }) | null;

const intersect = (clip: Clip, rect: Rect): Rect =>
  clip
    ? {
        left: Math.max(clip.left, rect.left),
        right: Math.min(clip.right, rect.right),
        top: Math.max(clip.top, rect.top),
        bottom: Math.min(clip.bottom, rect.bottom),
      }
    : rect;

const cornersOf = (rect: Rect): [number, number][] => [
  [rect.left, rect.top],
  [rect.right, rect.top],
  [rect.right, rect.bottom],
  [rect.left, rect.bottom],
];

const near = (a: [number, number], b: [number, number]) =>
  Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1;

function radiiOf(style: CSSStyleDeclaration, rect: Rect): Corners {
  const size = Math.min(rect.right - rect.left, rect.bottom - rect.top);
  const px = (value: string) =>
    value.endsWith("%")
      ? (parseFloat(value) / 100) * size
      : parseFloat(value) || 0;
  return [
    px(style.borderTopLeftRadius),
    px(style.borderTopRightRadius),
    px(style.borderBottomRightRadius),
    px(style.borderBottomLeftRadius),
  ];
}

// A clip within a clip: each corner rounds as whichever box's corner it is
function clipWithin(clip: Clip, rect: Rect, style: CSSStyleDeclaration): Clip {
  const box = intersect(clip, rect);
  const own = radiiOf(style, rect);
  const outer = clip ? cornersOf(clip) : [];
  const ownCorners = cornersOf(rect);
  const corners = cornersOf(box).map((corner, i) =>
    near(corner, ownCorners[i]!)
      ? own[i]!
      : clip && near(corner, outer[i]!)
        ? clip.corners[i]!
        : 0,
  ) as Corners;
  // Sides by name: a DOMRect's are getters, which spreading leaves behind
  const { left, right, top, bottom } = box;
  return { left, right, top, bottom, corners };
}

// A block in a rounded corner of what clips it is cut by that corner, so takes it
function roundedBy(
  clip: Clip,
  box: Rect,
  own: string,
  style: CSSStyleDeclaration,
) {
  if (!clip) return own;
  const clipCorners = cornersOf(clip);
  const touching = cornersOf(box).map(
    (corner, i) => clip.corners[i]! > 0 && near(corner, clipCorners[i]!),
  );
  if (!touching.some(Boolean)) return own;
  const mine = radiiOf(style, box);
  return touching
    .map((touches, i) =>
      touches ? Math.max(mine[i]!, clip.corners[i]!) : mine[i]!,
    )
    .map((r) => `${r}px`)
    .join(" ");
}

// Clipped to a sliver, it isn't seen: a visually hidden label, say, cut to a 1px box
const clipped = (rect: Rect, clip: Clip): Rect | null => {
  const box = intersect(clip, rect);
  return box.right - box.left >= 2 && box.bottom - box.top >= 2 ? box : null;
};

type Line = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  fontSize: number;
  /** Where the bar goes, by the typography rules — within the line's box. */
  barTop: number;
  barBottom: number;
  /** The theme's `--skullet-radius`, if it sets one. */
  radius: string;
};

/** The font line each line of text is drawn from. */
export type TextTop = "ascender" | "cap-height" | "x-height";
/** The font line each line of text is drawn down to. */
export type TextBottom = "baseline" | "descender";

export const DEFAULT_TEXT = {
  top: "ascender",
  bottom: "descender",
} as const satisfies { top: TextTop; bottom: TextBottom };

type Metrics = {
  ascent: number; // the font's own box, above and below the baseline
  descent: number;
  ascender: number; // ink of b, d, h, l
  capHeight: number;
  xHeight: number;
  descender: number; // ink of g, p, y
};

const metricsByFont = new Map<string, Metrics | null>();
let context: CanvasRenderingContext2D | null | undefined;

function metricsOf(style: CSSStyleDeclaration): Metrics | null {
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if (metricsByFont.has(font)) return metricsByFont.get(font)!;

  context ??= document.createElement("canvas").getContext("2d");
  let metrics: Metrics | null = null;
  if (context) {
    context.font = font;
    const box = context.measureText("H");
    const up = (text: string) =>
      context!.measureText(text).actualBoundingBoxAscent;
    metrics = {
      ascent: box.fontBoundingBoxAscent,
      descent: box.fontBoundingBoxDescent,
      ascender: up("bdfhkl"),
      capHeight: box.actualBoundingBoxAscent,
      xHeight: up("xz"),
      descender: context.measureText("gjpqy").actualBoundingBoxDescent,
    };
  }
  metricsByFont.set(font, metrics);
  return metrics;
}

const TOPS: Record<TextTop, keyof Metrics> = {
  ascender: "ascender",
  "cap-height": "capHeight",
  "x-height": "xHeight",
};

const rule = <T extends string>(
  style: CSSStyleDeclaration,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  const value = style.getPropertyValue(name).trim() as T;
  return allowed.includes(value) ? value : fallback;
};

// Between the font lines `--skullet-text-top` and `--skullet-text-bottom` name, the baseline half-leading in
function barOf(rect: Rect, style: CSSStyleDeclaration, fontSize: number) {
  const metrics = metricsOf(style);
  if (!metrics) {
    // No canvas to read the type with: a bar centred in the line
    const height = Math.min(fontSize * 0.72, rect.bottom - rect.top);
    const middle = (rect.top + rect.bottom) / 2;
    return { barTop: middle - height / 2, barBottom: middle + height / 2 };
  }

  const top = rule(
    style,
    "--skullet-text-top",
    Object.keys(TOPS) as TextTop[],
    DEFAULT_TEXT.top,
  );
  const bottom = rule(
    style,
    "--skullet-text-bottom",
    ["baseline", "descender"] as const,
    DEFAULT_TEXT.bottom,
  );

  const box = metrics.ascent + metrics.descent;
  const baseline =
    rect.top + (rect.bottom - rect.top - box) / 2 + metrics.ascent;
  return {
    barTop: baseline - metrics[TOPS[top]],
    barBottom: baseline + (bottom === "descender" ? metrics.descender : 0),
  };
}

const MEDIA = new Set(MEDIA_TAGS);
const TEXT = new Set(TEXT_TAGS);

const LINE_GAP = 0.4; // of the font size — wider than a space, so one line of text stays one bar

// matches a zero alpha in both `rgba(0, 0, 0, 0)` and `color(srgb 0 0 0 / 0)`
const TRANSPARENT = /[,/]\s*0\)$/;

// Unset reads as "" outside a browser engine, which is no paint either
const isSet = (value: string, none: string) => value !== "" && value !== none;

// All the way round: a rule along one side divides, it doesn't make a box a chip
const SIDES = ["Top", "Right", "Bottom", "Left"] as const;
const bordered = (style: CSSStyleDeclaration) =>
  SIDES.every(
    (side) =>
      isSet(style[`border${side}Style`], "none") &&
      isSet(style[`border${side}Width`], "0px"),
  );

// An inset hairline along one side, drawn as a shadow, is a divider like a one-sided border
const isRule = (shadow: string) => {
  const [x = 0, y = 0, blur = 0, spread = 0] = (
    shadow.replace(/rgba?\([^)]*\)|#\w+/g, "").match(/-?[\d.]+px/g) ?? []
  ).map(parseFloat);
  return (
    shadow.includes("inset") &&
    !blur &&
    !spread &&
    (x === 0) !== (y === 0) &&
    Math.abs(x + y) <= 2
  );
};

const shadowPaints = (boxShadow: string) =>
  isSet(boxShadow, "none") && !boxShadow.split(/,(?![^(]*\))/).every(isRule);

const isPainted = (style: CSSStyleDeclaration) =>
  (isSet(style.backgroundColor, "transparent") &&
    !TRANSPARENT.test(style.backgroundColor)) ||
  isSet(style.backgroundImage, "none") ||
  shadowPaints(style.boxShadow) ||
  bordered(style);

const isMedia = (element: Element) => MEDIA.has(element.localName);

const isEmptyText = (element: Element) =>
  TEXT.has(element.localName) &&
  !element.firstElementChild &&
  !element.textContent?.trim();

/**
 * Labels inside: one per piece of text however many lines it wraps to, and
 * pieces side by side on a line joined — one label split across many nodes,
 * as a text morph renders it, is still one.
 */
const countLabels = (element: Element) => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  const range = document.createRange();
  const pieces: DOMRect[][] = [];
  let nodes = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!node.textContent?.trim() || !parent) continue;
      nodes++;
      // Visually hidden text, read to screen readers only
      const box = parent.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      range.selectNodeContents(node);
      pieces.push(
        [...range.getClientRects()].filter((r) => r.width || r.height),
      );
    } else if (isEmptyText(node as Element)) {
      nodes++;
      pieces.push([...(node as Element).getClientRects()]);
    }
  }
  // No layout to go by
  if (!pieces.some((rects) => rects.length)) return nodes;

  const reach =
    (parseFloat(getComputedStyle(element).fontSize) || 16) * LINE_GAP;
  const beside = (a: DOMRect, b: DOMRect) =>
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) >=
      Math.min(a.height, b.height) / 2 &&
    Math.max(a.left, b.left) - Math.min(a.right, b.right) <= reach;

  // Pieces joined into labels: each starts as its own, and merges with any beside it
  const label = pieces.map((_, i) => i);
  const find = (i: number): number =>
    label[i] === i ? i : (label[i] = find(label[i]!));
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[i]!.some((a) => pieces[j]!.some((b) => beside(a, b)))) {
        label[find(j)] = find(i);
      }
    }
  }
  return new Set(pieces.map((_, i) => find(i))).size;
};

// A painted box around one label (a button, a chip) fills as a block, a card keeps its surface
const isBlock = (element: Element, style: CSSStyleDeclaration) =>
  element.hasAttribute(ATTR_BLOCK) ||
  isMedia(element) ||
  (isPainted(style) && countLabels(element) <= 1);

// Media clipped by a rounded parent of the same size, like an avatar, takes the parent's corners
function radiusOf(element: Element, style: CSSStyleDeclaration) {
  if (parseFloat(style.borderRadius) || !element.parentElement) {
    return style.borderRadius || "0px";
  }
  const parent = element.parentElement;
  const parentStyle = getComputedStyle(parent);
  const a = element.getBoundingClientRect();
  const b = parent.getBoundingClientRect();
  const same =
    Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;
  return same && parentStyle.overflow !== "visible"
    ? parentStyle.borderRadius
    : style.borderRadius || "0px";
}

function toBars(lines: Line[]): SkeletonRect[] {
  // Left to right, so each fragment only ever extends a bar to its left
  lines.sort((a, b) => a.left - b.left);

  const merged: Line[] = [];
  for (const line of lines) {
    const last = merged.find((m) => {
      const overlap =
        Math.min(m.bottom, line.bottom) - Math.max(m.top, line.top);
      const shorter = Math.min(m.bottom - m.top, line.bottom - line.top);
      const gap = line.left - m.right;
      return (
        overlap >= shorter / 2 &&
        gap <= Math.max(m.fontSize, line.fontSize) * LINE_GAP
      );
    });

    if (last) {
      last.left = Math.min(last.left, line.left);
      last.right = Math.max(last.right, line.right);
      last.top = Math.min(last.top, line.top);
      last.bottom = Math.max(last.bottom, line.bottom);
      last.fontSize = Math.max(last.fontSize, line.fontSize);
      last.barTop = Math.min(last.barTop, line.barTop);
      last.barBottom = Math.max(last.barBottom, line.barBottom);
    } else {
      merged.push({ ...line });
    }
  }

  return merged.map((line) => {
    const height = line.barBottom - line.barTop;
    return {
      x: line.left,
      y: line.barTop,
      width: line.right - line.left,
      height,
      radius: line.radius || `${Math.round(height / 3)}px`,
    };
  });
}

/**
 * Measures what `root` holds as bones, positioned relative to `layer`. With
 * `mark`, elements drawn as one block are marked so their own paint is hidden;
 * without it, nothing in `root` changes — as before a framework has hydrated it.
 */
export function measureSkeleton(
  root: HTMLElement,
  layer: HTMLElement,
  {
    mark = true,
    onCovered,
  }: {
    mark?: boolean;
    /** What's drawn as one block, its own paint to hide — for a caller that can't mark it. */
    onCovered?: (covered: Set<Element>) => void;
  } = {},
): SkeletonRect[] {
  const origin = layer.getBoundingClientRect();
  // Rects are post-transform; bones are drawn inside the same transform
  const scaleX = layer.offsetWidth ? origin.width / layer.offsetWidth : 1;
  const scaleY = layer.offsetHeight ? origin.height / layer.offsetHeight : 1;

  const local = (rect: Rect) => ({
    left: (rect.left - origin.left) / scaleX,
    right: (rect.right - origin.left) / scaleX,
    top: (rect.top - origin.top) / scaleY,
    bottom: (rect.bottom - origin.top) / scaleY,
  });

  const blocks: SkeletonRect[] = [];
  const lines: Line[] = [];
  const covered = new Set<Element>();
  const range = document.createRange();

  const addLine = (rect: DOMRect, style: CSSStyleDeclaration, clip: Clip) => {
    const box = clipped(rect, clip);
    if (!box) return;
    const fontSize = parseFloat(style.fontSize) || 16;
    const line = local(box);
    lines.push({
      ...line,
      fontSize,
      ...barOf(line, style, fontSize),
      radius: style.getPropertyValue("--skullet-radius").trim(),
    });
  };

  const addText = (node: Text, clip: Clip) => {
    const start = node.data.search(/\S/);
    if (start < 0 || !node.parentElement) return;
    range.setStart(node, start);
    range.setEnd(node, node.data.trimEnd().length);
    const style = getComputedStyle(node.parentElement);
    for (const rect of range.getClientRects()) addLine(rect, style, clip);
  };

  const visit = (parent: Element, clip: Clip) => {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        addText(node as Text, clip);
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const element = node as Element;
      if (element.hasAttribute(ATTR_IGNORE) || element.hasAttribute(ATTR_OWN)) {
        continue;
      }

      const style = getComputedStyle(element);
      if (style.display === "none") continue;

      if (isBlock(element, style)) {
        const visible = clipped(element.getBoundingClientRect(), clip);
        if (visible) {
          const box = local(visible);
          blocks.push({
            x: box.left,
            y: box.top,
            width: box.right - box.left,
            height: box.bottom - box.top,
            radius: roundedBy(clip, visible, radiusOf(element, style), style),
          });
        }
        if (!isMedia(element)) covered.add(element);
        continue;
      }

      if (isEmptyText(element)) {
        for (const rect of element.getClientRects()) {
          addLine(rect, style, clip);
        }
        continue;
      }

      const clips =
        style.overflowX !== "visible" || style.overflowY !== "visible";
      visit(
        element,
        clips ? clipWithin(clip, element.getBoundingClientRect(), style) : clip,
      );
    }
  };

  visit(root, null);
  onCovered?.(covered);

  if (!mark) return [...blocks, ...toBars(lines)];

  // Only touched when they change, so a MutationObserver watching `root` settles
  for (const element of root.querySelectorAll(`[${ATTR_COVERED}]`)) {
    if (!covered.has(element)) element.removeAttribute(ATTR_COVERED);
  }
  for (const element of covered) {
    if (!element.hasAttribute(ATTR_COVERED)) {
      element.setAttribute(ATTR_COVERED, "");
    }
  }

  return [...blocks, ...toBars(lines)];
}
