// The package's public types; the runtime exports all of ./lib, which the wrappers import as "skullet"
export { Reveal } from "./lib";
export type { RevealOptions } from "./lib";
export { forgetShapes } from "./lib";
export { createSkeletonBox } from "./lib";
export type { SkeletonBoxOptions } from "./lib";
export { debugging, setDebug } from "./lib";
export {
  applyTheme,
  DEFAULT_COLORS,
  DEFAULT_THEME,
  skulletCSS,
  themeVariables,
} from "./lib";
export type {
  SkulletAnimation,
  SkulletColors,
  SkulletMode,
  SkulletSpeed,
  SkulletText,
  SkulletTheme,
  TextBottom,
  TextTop,
} from "./lib";
export {
  byPosition,
  byRow,
  instant,
  sequence,
  smart,
  sweep,
  together,
} from "./lib";
export type {
  Piece,
  RevealContext,
  RevealMode,
  RevealSpec,
  Wipe,
  WipePane,
} from "./lib";
