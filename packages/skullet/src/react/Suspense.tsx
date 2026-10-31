"use client";

import React from "react";
import {
  ATTR_LOADING,
  ATTR_PANE,
  ATTR_REVEAL,
  boxOf,
  fadeIn,
  fadeOut,
  Ghost,
  Memory,
} from "../lib";
import { useReveal } from "./config";
import { Loading, Styles, useIsomorphicLayoutEffect, useStyles } from "./parts";

type Waited = React.MutableRefObject<boolean>;

const Fallback = ({
  children,
  id,
  label,
  waited,
}: {
  children: React.ReactNode;
  id?: string;
  label?: string;
  waited: Waited;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const mode = useReveal();

  useIsomorphicLayoutEffect(() => {
    const pane = ref.current;
    const reveal = pane?.parentElement;
    if (!pane || !reveal) return;
    waited.current = true;
    fadeIn(pane, mode, { initial: true });
    reveal.setAttribute("aria-busy", "true");

    return () => {
      reveal.removeAttribute("aria-busy");
      if (!pane.isConnected) return;

      // A copy stays to fade out over the content, placed only once React has really removed the fallback: StrictMode rehearses this
      const box = boxOf(pane);
      const copy = pane.cloneNode(true) as HTMLElement;
      queueMicrotask(() => {
        if (pane.isConnected) return;
        Object.assign(copy.style, {
          position: "absolute",
          top: `${box.top}px`,
          left: `${box.left}px`,
          width: `${box.width}px`,
        });
        reveal.prepend(copy);

        // A clone leaves its bones' shadow root behind; draw them again
        const loading = copy.querySelector<HTMLElement>(`[${ATTR_LOADING}]`);
        if (loading) new Ghost(loading, { id, exact: true }).destroy();
        fadeOut(copy, box).then(() => copy.remove());
      });
    };
    // Mount only — this fallback is gone the moment the content resolves
  }, []);

  return (
    <div ref={ref} {...{ [ATTR_PANE]: "" }}>
      {/* A skeleton given is what the content will be — drawn as given, not swapped for a remembered shape */}
      <Loading id={id} exact={children != null} label={label}>
        {children}
      </Loading>
    </div>
  );
};

const Content = ({
  children,
  id,
  waited,
  onReveal,
}: {
  children: React.ReactNode;
  id?: string;
  waited: Waited;
  onReveal?: () => void;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const mode = useReveal();

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    const arrival = fadeIn(ref.current, mode, { initial: !waited.current });
    if (waited.current && onReveal) arrival.then(onReveal);
    const memory = new Memory(ref.current, { id });
    return () => memory.destroy();
    // Mount only — React keeps resolved content mounted, hiding it if it suspends again
  }, []);

  return (
    <div ref={ref} {...{ [ATTR_PANE]: "" }}>
      {children}
    </div>
  );
};

export type SkeletonSuspenseProps = {
  children: React.ReactNode;
  /** The content rendered from sample data, measured into the fallback; without it, the shape last shown. */
  skeleton?: React.ReactNode;
  /** Remembers the shape under this key across visits. */
  id?: string;
  /** Read to screen readers while suspended, in place of the skeleton. */
  label?: string;
  /** Called once content has come in over the skeleton. */
  onReveal?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

/** A Suspense boundary whose fallback is a measured skeleton, crossfading into the content. */
export function SkeletonSuspense({
  children,
  skeleton,
  id,
  label,
  onReveal,
  className,
  style,
}: SkeletonSuspenseProps) {
  useStyles();
  const waited = React.useRef(false);

  return (
    <div {...{ [ATTR_REVEAL]: "" }} className={className} style={style}>
      <Styles />
      <React.Suspense
        fallback={
          <Fallback id={id} label={label} waited={waited}>
            {skeleton}
          </Fallback>
        }
      >
        <Content id={id} waited={waited} onReveal={onReveal}>
          {children}
        </Content>
      </React.Suspense>
    </div>
  );
}
