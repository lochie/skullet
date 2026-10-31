import type { SkeletonBoxOptions } from "../lib";

export interface SkeletonBoxProps extends SkeletonBoxOptions {
  class?: string;
  style?: Record<string, string | number>;
}

/** Slots: `default` (with `{ data }` when `data` is bound), `skeleton`, `empty`, `error` (with `{ error }`). */
export interface SkeletonProps<T = unknown> {
  loading?: boolean;
  data?: T | null;
  sample?: T;
  id?: string;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
  empty?: boolean;
  error?: unknown;
  /** Called once content has come in over a skeleton; `@reveal` in a template. */
  onReveal?: () => void;
  class?: string;
  style?: Record<string, string | number>;
}

/** Slots: `default`, the content that suspends; `skeleton`, the content rendered from sample data. */
export interface SkeletonSuspenseProps {
  id?: string;
  /** Read to screen readers while suspended, in place of the skeleton. */
  label?: string;
  /** Called once content has come in over the skeleton; `@reveal` in a template. */
  onReveal?: () => void;
}
