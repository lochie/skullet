import { ATTR_BAR } from "./constants";
import { shimmer } from "./shimmer";
import { addStyles } from "./styles";

type Length = string | number;

export type SkeletonBoxOptions = {
  height?: Length;
  width?: Length;
  radius?: Length;
};

export const DEFAULT_SKELETON_BOX_OPTIONS = {
  height: "1em",
  width: "60%",
  radius: "var(--skullet-radius, 0.25em)",
} satisfies Required<SkeletonBoxOptions>;

const toCSS = (value: Length) =>
  typeof value === "number" ? `${value}px` : value;

export function skeletonBoxStyle({
  height = DEFAULT_SKELETON_BOX_OPTIONS.height,
  width = DEFAULT_SKELETON_BOX_OPTIONS.width,
  radius = DEFAULT_SKELETON_BOX_OPTIONS.radius,
}: SkeletonBoxOptions = {}) {
  return {
    height: toCSS(height),
    width: toCSS(width),
    borderRadius: toCSS(radius),
  };
}

/** A single bar, shimmering in step with every skeleton on the page once it is in the document. */
export function createSkeletonBox(
  options?: SkeletonBoxOptions,
): HTMLSpanElement {
  addStyles();
  const element = document.createElement("span");
  element.setAttribute(ATTR_BAR, "");
  Object.assign(element.style, skeletonBoxStyle(options));
  requestAnimationFrame(() => {
    if (element.isConnected) shimmer(element);
  });
  return element;
}
