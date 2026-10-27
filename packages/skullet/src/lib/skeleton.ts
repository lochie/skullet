import { ATTR_BAR } from "./constants";
import { shimmer } from "./shimmer";
import { addStyles } from "./styles";

type Length = string | number;

export type SkeletonOptions = {
  height?: Length;
  width?: Length;
  radius?: Length;
};

export const DEFAULT_SKELETON_OPTIONS = {
  height: "1em",
  width: "60%",
  radius: "var(--skullet-radius, 0.25em)",
} satisfies Required<SkeletonOptions>;

const toCSS = (value: Length) =>
  typeof value === "number" ? `${value}px` : value;

export function skeletonStyle({
  height = DEFAULT_SKELETON_OPTIONS.height,
  width = DEFAULT_SKELETON_OPTIONS.width,
  radius = DEFAULT_SKELETON_OPTIONS.radius,
}: SkeletonOptions = {}) {
  return {
    height: toCSS(height),
    width: toCSS(width),
    borderRadius: toCSS(radius),
  };
}

/** A single bar, shimmering in step with every skeleton on the page once it is in the document. */
export function createSkeleton(options?: SkeletonOptions): HTMLSpanElement {
  addStyles();
  const element = document.createElement("span");
  element.setAttribute(ATTR_BAR, "");
  Object.assign(element.style, skeletonStyle(options));
  requestAnimationFrame(() => {
    if (element.isConnected) shimmer(element);
  });
  return element;
}
