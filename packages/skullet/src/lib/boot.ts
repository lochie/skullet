import { ATTR_LAYER, ATTR_GHOST, BOOT, GHOSTED, UNCOVER } from "./constants";
import { measureSkeleton } from "./measure";
import { drawSkeleton } from "./shimmer";

/*
 * Inlined after a server-rendered skeleton (see build-inline.mjs). It measures in its
 * ResizeObserver's first callback, after layout and before paint, so the first paint
 * already shows the skeleton. It touches nothing a framework will hydrate: the skeleton
 * lives in a shadow root. Sent once a page where a provider can tell; the skeletons after
 * it carry a stub that calls the `boot` this leaves on window, or queues until it lands.
 */

// A path from the document root, so a painted chip's colour is hidden without an attribute hydration would see as a mismatch
const pathOf = (element: Element): string =>
  element.parentElement
    ? `${pathOf(element.parentElement)} > :nth-child(${[...element.parentElement.children].indexOf(element) + 1})`
    : ":root";

type Root = HTMLElement & { [GHOSTED]?: boolean; [UNCOVER]?: () => void };

function boot(script: Element | null) {
  const root = script?.previousElementSibling as Root | null | undefined;
  const ghost = root?.querySelector<HTMLElement>(`:scope > [${ATTR_GHOST}]`);
  const layer = root?.querySelector<HTMLElement>(`:scope > [${ATTR_LAYER}]`);
  if (!root || !ghost || !layer) return;

  const sheet =
    typeof CSSStyleSheet === "function" &&
    "replaceSync" in CSSStyleSheet.prototype
      ? new CSSStyleSheet()
      : null;
  if (sheet) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    root[UNCOVER] = () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (adopted) => adopted !== sheet,
      );
    };
  }
  const cover = (covered: Set<Element>) =>
    sheet?.replaceSync(
      covered.size
        ? `${[...covered].map(pathOf).join(", ")} { visibility: hidden !important; }`
        : "",
    );

  const draw = () => {
    if (!layer.isConnected || root[GHOSTED]) return observer.disconnect();
    // Streamed HTML is parsed into a hidden container first: nothing to measure until it's moved into place
    if (!ghost.getClientRects().length) return;
    drawSkeleton(
      layer,
      measureSkeleton(ghost, layer, { mark: false, onCovered: cover }),
    );
  };
  // Measures in the first callback, after layout and before paint, then until Ghost takes over
  const observer = new ResizeObserver(draw);
  observer.observe(root);
  document.fonts?.ready.then(draw);
}

const host = self as unknown as Record<symbol, unknown>;
const key = Symbol.for(BOOT);
const queued = host[key];
host[key] = boot;
if (Array.isArray(queued)) queued.forEach(boot);
boot(document.currentScript);
