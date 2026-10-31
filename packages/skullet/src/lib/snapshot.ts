import { textContext } from "./canvas";
import { ATTR_COVERED, MEDIA_TAGS } from "./constants";

const MEDIA = new Set(MEDIA_TAGS);
const REMOVED = "script, noscript, template, base, meta, link";
const REPLACED = new Set(["iframe", "object", "embed"]);
const STRIPPED = new Set([
  "src",
  "srcset",
  "sizes",
  "poster",
  "data",
  "srcdoc",
  "action",
  "formaction",
  "value",
  "alt",
  ATTR_COVERED,
]);

export const fill = (value: string) =>
  value.replace(/[A-Z]/g, "X").replace(/[a-z]/g, "x").replace(/\d/g, "0");

// Filler has different glyphs to the text it replaces; letter-spacing makes up the difference, so it wraps the same
function fillText(original: Text, copy: Text) {
  const filled = fill(copy.data);
  copy.data = filled;

  const parent = original.parentElement;
  const context = textContext();
  if (!parent || !context || !filled.trim()) return;

  const style = getComputedStyle(parent);
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const shape = (value: string) => {
    const collapsed = value.replace(/\s+/g, " ");
    if (style.textTransform === "uppercase") return collapsed.toUpperCase();
    if (style.textTransform === "lowercase") return collapsed.toLowerCase();
    return collapsed;
  };

  const target = context.measureText(shape(original.data)).width;
  const current = context.measureText(shape(filled)).width;
  const delta = (target - current) / shape(filled).length;
  if (Math.abs(delta) < 0.01) return;

  const span = document.createElement("span");
  span.style.letterSpacing = `${(parseFloat(style.letterSpacing) || 0) + delta}px`;
  copy.replaceWith(span);
  span.append(copy);
}

function sanitize(root: ParentNode) {
  for (const element of root.querySelectorAll(REMOVED)) element.remove();

  for (const element of root.querySelectorAll("*")) {
    if (REPLACED.has(element.localName)) {
      const stand = document.createElement("span");
      stand.style.cssText = element.getAttribute("style") ?? "";
      stand.style.display ||= "inline-block";
      element.replaceWith(stand);
      continue;
    }

    for (const { name, value } of [...element.attributes]) {
      const lower = name.toLowerCase();
      const unsafe =
        lower.startsWith("on") ||
        STRIPPED.has(lower) ||
        (lower.endsWith("href") && /^\s*javascript:/i.test(value));
      if (unsafe) element.removeAttribute(name);
    }

    if (element.localName === "img") element.setAttribute("alt", "");
  }

  for (const source of root.querySelectorAll("video source, picture source")) {
    source.remove();
  }
}

/** The markup in `root`, safe to keep: no scripts, handlers or media sources; `filler` replaces its text too. */
export function serialize(root: HTMLElement, filler: boolean): string {
  const clone = root.cloneNode(true) as HTMLElement;
  const show = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT;
  const original = document.createTreeWalker(root, show);
  const copy = document.createTreeWalker(clone, show);

  const texts: [Text, Text][] = [];
  const media: [Element, HTMLElement][] = [];
  while (original.nextNode() && copy.nextNode()) {
    const a = original.currentNode;
    const b = copy.currentNode;
    if (a.nodeType === Node.TEXT_NODE) {
      if (filler) texts.push([a as Text, b as Text]);
    } else if (
      MEDIA.has((a as Element).localName) ||
      REPLACED.has((a as Element).localName)
    ) {
      media.push([a as Element, b as HTMLElement]);
    }
  }

  // Applied after the walk, which would lose its place in a tree changing under it
  for (const [a, b] of media) {
    const rect = a.getBoundingClientRect();
    b.style.boxSizing = "border-box";
    b.style.width = `${rect.width}px`;
    if (rect.width && rect.height) {
      // Its proportions, not its pixels: restored somewhere narrower, it scales down as the real one would
      b.style.maxWidth = "100%";
      b.style.height = "auto";
      b.style.aspectRatio = `${rect.width} / ${rect.height}`;
    } else {
      b.style.height = `${rect.height}px`;
    }
  }
  for (const [a, b] of texts) fillText(a, b);

  sanitize(clone);
  return clone.innerHTML;
}

export function restore(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  sanitize(template.content);
  return template.content;
}

const signature = (element: Element, depth: number): string =>
  [...element.children]
    .map((child) => {
      const classes = [...child.classList].sort().join(".");
      const inner =
        depth > 1 && child.firstElementChild
          ? `(${signature(child, depth - 1)})`
          : "";
      return `${child.localName}${classes ? `.${classes}` : ""}${inner}`;
    })
    .join(",");

const hash = (value: string) => {
  let h = 5381;
  for (let i = 0; i < value.length; i++) h = (h * 33) ^ value.charCodeAt(i);
  return (h >>> 0).toString(36);
};

/** Identifies content by its page and the shape of its top two levels — the parts that rarely hang on data. */
export function autoKey(element: Element): string | null {
  const shape = signature(element, 2);
  return shape ? `${location.pathname}|${hash(shape)}` : null;
}
