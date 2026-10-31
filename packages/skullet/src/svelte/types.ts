import type { Component, Snippet } from "svelte";
import type {
  SkulletMode,
  SkulletText,
  SkulletTheme,
  SkeletonBoxOptions,
  RevealMode,
} from "../lib";

export interface SkeletonBoxProps extends SkeletonBoxOptions {
  class?: string;
  style?: string;
}

export interface SkeletonProps<T = unknown> {
  /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
  loading?: boolean;
  /** Loading while `null`, `undefined` or a promise yet to settle; handed to `children`. */
  data?: T | null | PromiseLike<T>;
  /** Stands in for `data` to draw the skeleton before any has loaded. */
  sample?: T;
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
  empty?: boolean;
  error?: unknown;
  /** Called once content has come in over a skeleton. */
  onreveal?: () => void;
  children?: Snippet<[T]>;
  skeleton?: Snippet;
  emptyMessage?: Snippet;
  errorMessage?: Snippet<[unknown]>;
  class?: string;
  style?: string;
}

export interface SkulletProviderProps {
  /** Set on the inline script and stylesheets skullet renders, for a Content Security Policy. */
  nonce?: string;
  theme?: SkulletTheme;
  mode?: SkulletMode;
  /** How much of each line of text is drawn: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkulletText;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
  children?: Snippet;
}

export declare const SkeletonBox: Component<SkeletonBoxProps>;
export declare const SkulletProvider: Component<SkulletProviderProps>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare const Skeleton: Component<SkeletonProps<any>>;
