"use client";

import React from "react";
import {
  addStyles,
  ATTR_LAYER,
  ATTR_GHOST,
  ATTR_LOADING,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_SNAPSHOT,
  ATTR_STATUS,
  boxOf,
  fadeIn,
  fadeOut,
  Ghost,
  INLINE_SCRIPT,
  INLINE_STUB,
  Memory,
  removeStyles,
  SKULLET_CSS,
  type MemoryOptions,
  type PaneBox,
} from "../lib";
import { useBoot, useReveal, useSkullet } from "./config";

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export const useStyles = () =>
  React.useInsertionEffect(() => {
    addStyles();
    return removeStyles;
  }, []);

const REACT_19 = Number(React.version.split(".")[0]) >= 19;

// React 19 hoists a <style> with `href` and `precedence` into <head> once, server-rendered included
export const Styles = () => {
  const { nonce } = useSkullet();
  if (!REACT_19) return null;
  const hoisted = { href: "skullet", precedence: "medium", nonce };
  return <style {...(hoisted as object)}>{SKULLET_CSS}</style>;
};

// A boolean from React 19; before it, an unknown attribute that only renders as a string
const inert = (REACT_19 ? { inert: true } : { inert: "" }) as object;

type WithOwnSkeleton = {
  Skeleton?: React.ComponentType<Record<string, unknown>>;
};

// Only reaches elements passed as children, not what a component renders internally
const swapOwnSkeletons = (node: React.ReactNode): React.ReactNode =>
  React.Children.map(node, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return child;
    }

    const OwnSkeleton = (child.type as WithOwnSkeleton).Skeleton;
    if (OwnSkeleton) {
      return (
        <span {...{ [ATTR_OWN]: "" }}>
          <OwnSkeleton {...child.props} />
        </span>
      );
    }

    if (child.props.children && typeof child.props.children !== "function") {
      return React.cloneElement(
        child,
        undefined,
        swapOwnSkeletons(child.props.children),
      );
    }

    return child;
  });

const subscribe = () => () => {};

// True while rendering on the server and hydrating that markup; false for anything rendered on the client
const useServerRendered = () =>
  React.useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );

type LoadingProps = {
  children: React.ReactNode;
  id?: string;
  exact: boolean;
  refetch?: boolean;
  /** Read to screen readers in the skeleton's place. */
  label?: string;
};

export const Loading = ({
  children,
  id,
  exact,
  refetch,
  label,
}: LoadingProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { nonce } = useSkullet();
  const boot = useBoot();
  // Only server HTML needs it — React never runs a script it renders, and React 19 errors on one
  const serverRendered = useServerRendered();
  // The full script once a page, where a provider keeps count; the client never runs it, so a different pick there is harmless
  let script = INLINE_SCRIPT;
  if (serverRendered && boot) {
    if (boot.sent) script = INLINE_STUB;
    boot.sent = true;
  }

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const ghost = new Ghost(ref.current, { id, exact, refetch });
    return () => ghost.destroy();
  }, [id, exact, refetch]);

  // Snapshot and bones are Ghost's to fill, never React's
  return (
    <>
      {label && <span {...{ [ATTR_STATUS]: "" }}>{label}</span>}
      <div ref={ref} {...{ [ATTR_LOADING]: "" }} aria-hidden {...inert}>
        <div {...{ [ATTR_GHOST]: "" }}>{swapOwnSkeletons(children)}</div>
        <div {...{ [ATTR_SNAPSHOT]: "" }} />
        <div {...{ [ATTR_LAYER]: "" }} />
      </div>
      {serverRendered && (
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: script }}
        />
      )}
    </>
  );
};

type PaneEntry = { element: HTMLElement; memory: Memory | null; box?: PaneBox };

/** The panes of one reveal, by id — so they can be measured before React changes the DOM. */
export type PaneRegistry = Map<number, PaneEntry>;

type PaneProps = {
  children: React.ReactNode;
  id: number;
  registry: PaneRegistry;
  enter: boolean;
  exiting: boolean;
  onExited: () => void;
  memory?: MemoryOptions;
  onEntered?: () => void;
};

export const Pane = ({
  children,
  id,
  registry,
  enter,
  exiting,
  onExited,
  memory,
  onEntered,
}: PaneProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const reveal = useReveal();

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const entry: PaneEntry = { element: ref.current, memory: null };
    registry.set(id, entry);
    fadeIn(ref.current, reveal, { initial: !enter }).then(onEntered);
    if (memory) entry.memory = new Memory(ref.current, memory);
    return () => {
      entry.memory?.destroy();
      registry.delete(id);
    };
    // Mount only — a pane's role is fixed for its lifetime
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!exiting || !ref.current) return;
    fadeOut(ref.current, registry.get(id)?.box).then(onExited);
    // Not on `onExited`, a fresh closure every render — refiring would restart the fade
  }, [exiting]);

  return (
    <div ref={ref} {...{ [ATTR_PANE]: "" }}>
      {children}
    </div>
  );
};

type SettledProps = {
  children: React.ReactNode;
  exiting: number[];
  registry: PaneRegistry;
};

/** Measures leaving panes before React changes the DOM, while reading layout can't trip scroll anchoring. */
export class Settled extends React.Component<SettledProps> {
  getSnapshotBeforeUpdate(previous: SettledProps) {
    for (const id of this.props.exiting) {
      if (previous.exiting.includes(id)) continue;
      const entry = this.props.registry.get(id);
      if (!entry) continue;
      // So the next skeleton recalls the content as it stood
      entry.memory?.save();
      entry.box = boxOf(entry.element);
    }
    return null;
  }

  // Required beside getSnapshotBeforeUpdate, or React warns
  componentDidUpdate() {}

  render() {
    return this.props.children;
  }
}
