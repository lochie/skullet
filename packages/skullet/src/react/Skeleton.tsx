"use client";

import React from "react";
import {
  ATTR_BAR,
  ATTR_OWN,
  ATTR_REVEAL,
  shimmer,
  skeletonBoxStyle,
  type MemoryOptions,
  type SkeletonBoxOptions,
} from "../lib";
import {
  Loading,
  Pane,
  Settled,
  Styles,
  type PaneRegistry,
  useIsomorphicLayoutEffect,
  useStyles,
} from "./parts";

export type SkeletonBoxProps = SkeletonBoxOptions & {
  className?: string;
  style?: React.CSSProperties;
};

export const SkeletonBox = ({
  height,
  width,
  radius,
  className,
  style,
}: SkeletonBoxProps) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  useStyles();

  useIsomorphicLayoutEffect(() => {
    if (ref.current) shimmer(ref.current);
  }, []);

  return (
    <>
      <Styles />
      <span
        ref={ref}
        {...{ [ATTR_BAR]: "" }}
        className={className}
        style={{ ...skeletonBoxStyle({ height, width, radius }), ...style }}
      />
    </>
  );
};

type PaneKey = "skeleton" | "error" | "empty" | "content";

type ExitingPane = { id: number; node: React.ReactNode };

type SharedProps = {
  /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
  loading?: boolean;
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
  /** Shown while loading instead of the measured skeleton. */
  skeleton?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: React.ReactNode;
  error?: React.ReactNode;
  /** Called once content has come in over a skeleton. */
  onReveal?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

type ChildrenProps = SharedProps & {
  children: React.ReactNode;
  data?: never;
  sample?: never;
};

type RenderProps<T> = SharedProps & {
  /** Loading while `null` or `undefined`, unless `loading` says otherwise. */
  data: T | null | undefined;
  /** Stands in for `data` to draw the skeleton before any has loaded. */
  sample?: T;
  children: (data: T) => React.ReactNode;
};

export type SkeletonProps<T = unknown> = ChildrenProps | RenderProps<T>;

export function Skeleton<T>(props: SkeletonProps<T>) {
  const { id, label, skeleton, empty, emptyMessage, error, className, style } =
    props;
  useStyles();

  const render =
    typeof props.children === "function"
      ? (props.children as (data: T) => React.ReactNode)
      : null;
  const data = render ? (props as RenderProps<T>).data : undefined;
  const sample = render ? (props as RenderProps<T>).sample : undefined;
  const plain = render ? null : (props.children as React.ReactNode);

  // The last data shown, so a reload's skeleton has its exact shape — of the same `id` only
  const last = React.useRef<{ id?: string; data: T } | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (data != null) last.current = { id, data };
  });

  const show = (value: T | null | undefined) =>
    render ? (value != null ? render(value) : null) : plain;

  // A render function has nothing to render without data, so that's a skeleton too
  const loading =
    !!props.loading || (!!render && data == null && !error && !empty);

  let key: PaneKey;
  let node: React.ReactNode;
  let memory: MemoryOptions | undefined;

  if (loading) {
    const previous = last.current;
    const real =
      data ?? (previous && previous.id === id ? previous.data : null);
    key = "skeleton";
    node = skeleton ? (
      // Marked as drawing its own skeleton, so the reveal treats it as one
      <div {...{ [ATTR_OWN]: "" }} aria-hidden>
        {skeleton}
      </div>
    ) : (
      <Loading
        id={id}
        exact={real != null}
        refetch={data != null}
        label={label}
      >
        {show(real ?? sample)}
      </Loading>
    );
  } else if (error) {
    key = "error";
    node = error;
  } else if (empty) {
    key = "empty";
    node = emptyMessage ?? show(data);
  } else {
    key = "content";
    node = show(data);
    memory = { id, data, rendered: !!render, sample: sample !== undefined };
  }

  const [current, setCurrent] = React.useState<{
    id: number;
    key: PaneKey;
    from?: PaneKey;
  }>({ id: 0, key });
  const [exiting, setExiting] = React.useState<ExitingPane[]>([]);
  const registry = React.useRef<PaneRegistry>(new Map()).current;

  // What the current pane last committed, so it can keep showing it on the way out
  const committed = React.useRef(node);
  useIsomorphicLayoutEffect(() => {
    committed.current = node;
  });

  if (current.key !== key) {
    const leaving = { id: current.id, node: committed.current };
    // Idempotent, because StrictMode runs this render twice
    setExiting((panes) =>
      panes.some((pane) => pane.id === leaving.id)
        ? panes
        : [...panes, leaving],
    );
    setCurrent({ id: current.id + 1, key, from: current.key });
  }

  // The latest, as a pane reads it once its fade ends
  const onReveal = React.useRef(props.onReveal);
  useIsomorphicLayoutEffect(() => {
    onReveal.current = props.onReveal;
  });
  const revealed =
    current.key === "content" && current.from === "skeleton"
      ? () => onReveal.current?.()
      : undefined;

  const remove = (id: number) =>
    setExiting((panes) => panes.filter((pane) => pane.id !== id));

  // One keyed list, so the current pane keeps its DOM as it moves into the exiting ones
  const panes = [
    ...exiting.map((pane) => (
      <Pane
        key={pane.id}
        id={pane.id}
        registry={registry}
        enter={false}
        exiting
        onExited={() => remove(pane.id)}
      >
        {pane.node}
      </Pane>
    )),
    <Pane
      key={current.id}
      id={current.id}
      registry={registry}
      enter={current.id > 0}
      exiting={false}
      onExited={() => {}}
      memory={memory}
      onEntered={revealed}
    >
      {node}
    </Pane>,
  ];

  return (
    <div
      {...{ [ATTR_REVEAL]: "" }}
      aria-busy={key === "skeleton" || undefined}
      className={className}
      style={style}
    >
      <Styles />
      <Settled exiting={exiting.map((pane) => pane.id)} registry={registry}>
        {panes}
      </Settled>
    </div>
  );
}
