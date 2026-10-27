const prefers = (query: string) =>
  typeof matchMedia !== "undefined" && matchMedia(query).matches;

export const prefersReducedMotion = () =>
  prefers("(prefers-reduced-motion: reduce)");

export const prefersReducedTransparency = () =>
  prefers("(prefers-reduced-transparency: reduce)");
