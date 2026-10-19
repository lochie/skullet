import {
  ATTR_BLOCK,
  ATTR_BONES,
  ATTR_EXITING,
  ATTR_GHOST,
  ATTR_INACTIVE,
  ATTR_LOADING,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
  GHOSTED,
  UNCOVER,
} from "./constants";
import { reportLoading } from "./debug";
import { noteSkeleton } from "./plan";
import { warnOnce } from "./dev";
import { measureBones } from "./measure";
import { flushShapes, recallShape } from "./shapes";
import { drawBones } from "./shimmer";
import { autoKey, restore } from "./snapshot";
import { addStyles, removeStyles } from "./styles";

export type GhostOptions = {
  /** Remembers the shape under this key; without it, one is derived from the markup. */
  id?: string;
  /** The ghost was rendered from real data, so it beats any remembered shape. */
  exact?: boolean;
};

type Source = "ghost" | "recall" | "fallback";

const FALLBACK = [100, 90, 60]
  .map(
    (width) =>
      `<div ${ATTR_BLOCK} style="width:${width}%;height:0.75em;margin:0.5em 0;border-radius:0.25em"></div>`,
  )
  .join("");

// In the document before any script ran: server-rendered, so already painted at the shape it has
const served = new WeakSet<Element>(
  typeof document === "undefined"
    ? []
    : document.querySelectorAll(`[${ATTR_LOADING}]`),
);

/** Whether a loading root came with the page's HTML. */
export const isServed = (root: Element) => served.has(root);

const loadingSizes = new WeakMap<
  Element,
  { width: number; height: number; guessed: boolean }
>();

/** The size a reveal's skeleton last measured at, taken once by whatever replaces it. */
export function takeLoadingSize(reveal: Element | null) {
  if (!reveal) return undefined;
  const size = loadingSizes.get(reveal);
  loadingSizes.delete(reveal);
  return size;
}

function child(root: HTMLElement, attribute: string) {
  for (const element of root.children) {
    if (element.hasAttribute(attribute)) return element as HTMLElement;
  }
  const element = document.createElement("div");
  element.setAttribute(attribute, "");
  root.append(element);
  return element;
}

const hasContent = (element: Element) =>
  !!element.firstElementChild || !!element.textContent?.trim();

/**
 * Draws a skeleton over the content `root` holds in its ghost: content laid out
 * for real but never seen, so the skeleton takes exactly the space the content
 * will. Falls back to a remembered shape, then to a few generic lines.
 */
export class Ghost {
  private ghost: HTMLElement;
  private snapshot: HTMLElement;
  private layer: HTMLElement;
  private source: Source | null = null;
  private hadContent = false;
  private frame = 0;
  private mutations: MutationObserver;
  private resize: ResizeObserver;

  constructor(
    private root: HTMLElement,
    private options: GhostOptions = {},
  ) {
    addStyles();
    (root as HTMLElement & { [GHOSTED]?: boolean })[GHOSTED] = true;
    root.setAttribute(ATTR_LOADING, "");
    root.setAttribute("aria-hidden", "true");
    root.inert = true;

    this.ghost = child(root, ATTR_GHOST);
    this.snapshot = child(root, ATTR_SNAPSHOT);
    this.layer = child(root, ATTR_BONES);

    this.hadContent = hasContent(this.ghost);

    const reveal = root.closest(`[${ATTR_REVEAL}]`);
    if (reveal) {
      noteSkeleton(reveal, {
        served: served.has(root),
        exact: !!options.exact && this.hadContent,
      });
    }
    this.choose();
    this.measure();
    // Covered paint is marked now; the inline script's stand-in sheet can go
    (root as HTMLElement & { [UNCOVER]?: () => void })[UNCOVER]?.();

    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(this.ghost, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    this.resize = new ResizeObserver(this.schedule);
    this.resize.observe(root);
    root.addEventListener("load", this.schedule, true);
    addEventListener("resize", this.schedule);
    document.fonts?.ready.then(this.schedule);
  }

  private schedule = () => {
    // Leaving: re-measuring a pane pinned at its last size would redraw what's fading out
    if (this.root.closest(`[${ATTR_EXITING}]`)) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const has = hasContent(this.ghost);
      if (has !== this.hadContent) {
        this.hadContent = has;
        this.choose();
      }
      this.measure();
    });
  };

  private choose() {
    let next: Source = "fallback";
    let html: string | null = null;

    // Re-shaping a skeleton already on screen would move the page — keep it
    const settled = this.options.exact || served.has(this.root);
    if (settled && this.hadContent) {
      next = "ghost";
    } else {
      const key = this.options.id ?? autoKey(this.ghost);
      if (key) {
        flushShapes(key);
        html = recallShape(key);
      }
      if (html) next = "recall";
      else if (this.hadContent) next = "ghost";
    }

    if (next !== this.source) {
      if (next === "recall" && html) {
        this.snapshot.replaceChildren(restore(html));
      } else if (next === "fallback") {
        this.snapshot.innerHTML = FALLBACK;
        warnOnce(
          `fallback:${this.options.id}`,
          `Nothing to draw a skeleton from${this.options.id ? ` for "${this.options.id}"` : ""}. Pass \`sample\` data, or an \`id\` so its shape is remembered after the first load.`,
        );
      } else {
        this.snapshot.replaceChildren();
      }
    }

    this.ghost.toggleAttribute(ATTR_INACTIVE, next !== "ghost");
    this.snapshot.toggleAttribute(ATTR_INACTIVE, next === "ghost");
    this.source = next;

    reportLoading(
      this.root.closest(`[${ATTR_REVEAL}]`),
      next === "recall"
        ? "remembered shape"
        : next === "fallback"
          ? "fallback"
          : this.options.exact
            ? "data"
            : served.has(this.root)
              ? "server render"
              : "sample",
    );
  }

  private measure() {
    const active = this.source === "ghost" ? this.ghost : this.snapshot;
    drawBones(this.layer, measureBones(active, this.layer));

    const reveal = this.root.closest(`[${ATTR_REVEAL}]`);
    if (reveal) {
      loadingSizes.set(reveal, {
        width: this.root.offsetWidth,
        height: this.root.offsetHeight,
        // Drawn from real data, so a sample would have changed nothing
        guessed: !(this.options.exact && this.source === "ghost"),
      });
    }
  }

  // Bones keep shimmering until they are removed, so a skeleton fading out stays alive
  destroy() {
    cancelAnimationFrame(this.frame);
    this.mutations.disconnect();
    this.resize.disconnect();
    this.root.removeEventListener("load", this.schedule, true);
    removeEventListener("resize", this.schedule);
    removeStyles();
  }
}
