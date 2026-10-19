import {
  ATTR_BLOCK,
  ATTR_COVERED,
  ATTR_IGNORE,
  ATTR_OWN,
  MEDIA_TAGS,
  TEXT_TAGS,
} from "./constants";

/** A box to draw, relative to the layer it was measured against. */
export type Bone = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: string;
};

type Rect = { left: number; right: number; top: number; bottom: number };

// Overflow a box hides, which a bone must not paint past; null while nothing clips
type Clip = Rect | null;

const intersect = (clip: Clip, rect: Rect): Rect =>
  clip
    ? {
        left: Math.max(clip.left, rect.left),
        right: Math.min(clip.right, rect.right),
        top: Math.max(clip.top, rect.top),
        bottom: Math.min(clip.bottom, rect.bottom),
      }
    : rect;

const clipped = (rect: Rect, clip: Clip): Rect | null => {
  const box = intersect(clip, rect);
  return box.right - box.left >= 1 && box.bottom - box.top >= 1 ? box : null;
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
  /** The theme's `--skele-radius`, if it sets one. */
  radius: string;
};

/** Where a text bar's top sits, in the type's own terms. */
export type TextTop = "ascender" | "cap-height" | "x-height";
/** Where a text bar's bottom sits. */
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

/**
 * The bar for text laid out in `rect`, between the lines the typography rules
 * name: `--skele-text-top` and `--skele-text-bottom`. The baseline sits where
 * the font's box puts it, half-leading in from the rect's edges.
 */
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
    "--skele-text-top",
    Object.keys(TOPS) as TextTop[],
    DEFAULT_TEXT.top,
  );
  const bottom = rule(
    style,
    "--skele-text-bottom",
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

export const isPainted = (style: CSSStyleDeclaration) =>
  (isSet(style.backgroundColor, "transparent") &&
    !TRANSPARENT.test(style.backgroundColor)) ||
  isSet(style.backgroundImage, "none") ||
  isSet(style.boxShadow, "none") ||
  bordered(style);

const isMedia = (element: Element) => MEDIA.has(element.localName);

const isEmptyText = (element: Element) =>
  TEXT.has(element.localName) &&
  !element.firstElementChild &&
  !element.textContent?.trim();

/** Labels inside an element, counting text leaves left empty by missing data. */
/**
 * Labels inside: one per piece of text however many lines it wraps to, and
 * pieces side by side on a line joined — one label split across many nodes,
 * as a text morph renders it, is still one.
 */
export const countLabels = (element: Element) => {
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

function toBars(lines: Line[]): Bone[] {
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
export function measureBones(
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
): Bone[] {
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

  const blocks: Bone[] = [];
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
      radius: style.getPropertyValue("--skele-radius").trim(),
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
            radius: radiusOf(element, style),
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
        clips ? intersect(clip, element.getBoundingClientRect()) : clip,
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
