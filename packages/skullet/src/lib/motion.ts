const prefers = (query: string) =>
  typeof matchMedia !== "undefined" && matchMedia(query).matches;

// Not in jsdom, where every fade is instant
export const canAnimate = () =>
  typeof Element !== "undefined" &&
  typeof Element.prototype.animate === "function";

export const prefersReducedMotion = () =>
  !canAnimate() || prefers("(prefers-reduced-motion: reduce)");

export const prefersReducedTransparency = () =>
  prefers("(prefers-reduced-transparency: reduce)");

export const animationsOf = (element: Element): Animation[] =>
  element.getAnimations?.() ?? [];
