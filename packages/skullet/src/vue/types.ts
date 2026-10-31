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
  class?: string;
  style?: Record<string, string | number>;
}
