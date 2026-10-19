import type { Component, Snippet } from "svelte";
import type {
  SkeleMode,
  SkeleText,
  SkeleTheme,
  SkeletonOptions,
  RevealMode,
} from "../lib";

export interface SkeletonProps extends SkeletonOptions {
  class?: string;
  style?: string;
}

export interface SkeletonRevealProps<T = unknown> {
  /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
  loading?: boolean;
  /** Loading while `null` or `undefined`; handed to `children`. */
  data?: T | null;
  /** Stands in for `data` to draw the skeleton before any has loaded. */
  sample?: T;
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
  empty?: boolean;
  error?: unknown;
  children?: Snippet<[T]>;
  skeleton?: Snippet;
  emptyMessage?: Snippet;
  errorMessage?: Snippet<[unknown]>;
  class?: string;
  style?: string;
}

export interface SkeleProviderProps {
  /** Set on the inline script and stylesheets skele renders, for a Content Security Policy. */
  nonce?: string;
  theme?: SkeleTheme;
  mode?: SkeleMode;
  /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkeleText;
  /** How content replaces its skeleton: `smart` (the default), `together` or `sequence`. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
  children?: Snippet;
}

export declare const Skeleton: Component<SkeletonProps>;
export declare const SkeleProvider: Component<SkeleProviderProps>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare const SkeletonReveal: Component<SkeletonRevealProps<any>>;
