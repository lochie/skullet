"use client";

import React from "react";
import {
  setDebug,
  skeleCSS,
  type SkeleMode,
  type SkeleText,
  type SkeleTheme,
  type RevealMode,
} from "../lib";

export type SkeleConfig = {
  /** Set on the inline script and stylesheets skele renders, for a Content Security Policy. */
  nonce?: string;
  /** Colours for light and dark; `mode` picks between them. */
  theme?: SkeleTheme;
  mode?: SkeleMode;
  /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkeleText;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence` or `sweep`. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
};

const Config = React.createContext<SkeleConfig>({});

/** Per server render: whether the full inline script has gone out yet, so the skeletons after it send a stub. */
export type BootRecord = { sent: boolean };
const Boot = React.createContext<BootRecord | null>(null);

export const useSkele = () => React.useContext(Config);
export const useBoot = () => React.useContext(Boot);

/** The reveal a component inside should use. */
export const useReveal = () => useSkele().reveal;

/** Settings for every skele component inside — per request on the server, as a nonce must be. */
export function SkeleProvider({
  children,
  ...config
}: SkeleConfig & { children: React.ReactNode }) {
  const { debug, theme, mode, text, nonce } = config;
  const css = skeleCSS({ theme, mode, text });
  const [boot] = React.useState<BootRecord>(() => ({ sent: false }));

  React.useEffect(() => {
    if (debug !== undefined) setDebug(debug);
  }, [debug]);

  return (
    <Config.Provider value={config}>
      <Boot.Provider value={boot}>
        {css && <style nonce={nonce}>{css}</style>}
        {children}
      </Boot.Provider>
    </Config.Provider>
  );
}
