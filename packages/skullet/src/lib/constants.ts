export const ATTR_REVEAL = "skullet-reveal";
export const ATTR_PANE = "skullet-pane";
export const ATTR_LOADING = "skullet-loading";
export const ATTR_GHOST = "skullet-ghost"; // The framework's render of the content, laid out but never seen
export const ATTR_SNAPSHOT = "skullet-snapshot"; // A remembered or fallback shape, standing in for the ghost
export const ATTR_LAYER = "skullet-layer";
export const ATTR_RECT = "skullet-rect";
export const ATTR_BAR = "skullet-bar";
export const ATTR_INACTIVE = "skullet-inactive";
export const ATTR_EXITING = "skullet-exiting"; // On a pane fading out — its skeleton holds still
export const ATTR_COVERED = "skullet-covered"; // Drawn as one block by a bone, so its own paint is hidden
export const ATTR_OWN = "skullet-own"; // A subtree that draws its own skeleton — measuring stops at it
export const ATTR_IGNORE = "skullet-ignore";
export const ATTR_BLOCK = "skullet-block";

export const GHOSTED = Symbol.for("skullet.ghost"); // On a loading root once its Ghost runs: the inline script stands down
export const UNCOVER = Symbol.for("skullet.uncover"); // On a served loading root: drops the inline script's sheet hiding covered paint, once Ghost marks it
export const BOOT = "skullet.boot"; // Symbol.for key on window: the inline script's measuring, sent once a page — later skeletons' stubs call it, or queue for it
export const ATTR_STATUS = "skullet-status"; // Read to screen readers in place of the skeleton
export const ATTR_XRAY = "skullet-xray"; // Debug, on any ancestor: shows the ghost through its bones
export const ATTR_DEBUG = "skullet-debug"; // Debug outlines for this subtree alone

// Themed by SkulletProvider; the fallbacks are translucent so one grey reads on light and dark pages alike
export const BASE = "var(--skullet-base, rgb(128 128 128 / 0.2))";
export const HIGHLIGHT = "var(--skullet-highlight, rgb(255 255 255 / 0.12))";
export const FADE_DURATION = 200;
export const CASCADE_SPREAD = 320; // From the first piece of a sequenced reveal to the last
export const RESIZE_DURATION = 280; // A reveal easing to its new height, when its skeleton guessed the content wrong
export const IMAGE_TIMEOUT = 10000; // Longest a reveal holds for an image — a stalled request mustn't keep a skeleton up for good
// One loop of each animation, by `speed`; a shimmer's is across a 1280px-wide screen
export const DURATIONS = {
  shimmer: { slow: 4000, fast: 2000 },
  pulse: { slow: 2400, fast: 1200 },
} as const;

// Leaves that hold text, so an empty one still stands for a line of it
export const TEXT_TAGS = [
  "a",
  "b",
  "code",
  "dd",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "label",
  "li",
  "p",
  "small",
  "span",
  "strong",
  "td",
  "th",
  "time",
];

// Drawn as one block at their box — there is no text inside to measure
export const MEDIA_TAGS = [
  "audio",
  "canvas",
  "embed",
  "iframe",
  "img",
  "input",
  "object",
  "picture",
  "select",
  "svg",
  "textarea",
  "video",
];
