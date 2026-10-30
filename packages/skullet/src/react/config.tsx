"use client";

import React from "react";
import {
  setDebug,
  skulletCSS,
  type SkulletMode,
  type SkeleText,
  type SkeleTheme,
  type RevealMode,
} from "../lib";

export type SkulletConfig = {
  /** Set on the inline script and stylesheets skullet renders, for a Content Security Policy. */
  nonce?: string;
  /** Colours for light and dark; `mode` picks between them. */
  theme?: SkeleTheme;
  mode?: SkulletMode;
  /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
  text?: SkeleText;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
  reveal?: RevealMode;
  /** Outlines every reveal with where its skeleton came from and whether anything moved. */
  debug?: boolean;
};

const Config = React.createContext<SkulletConfig>({});

/** Per server render: whether the full inline script has gone out yet, so the skeletons after it send a stub. */
export type BootRecord = { sent: boolean };
const Boot = React.createContext<BootRecord | null>(null);

export const useSkullet = () => React.useContext(Config);
export const useBoot = () => React.useContext(Boot);

/** The reveal a component inside should use. */
export const useReveal = () => useSkullet().reveal;

/** Settings for every skullet component inside — per request on the server, as a nonce must be. */
export function SkulletProvider({
  children,
  ...config
}: SkulletConfig & { children: React.ReactNode }) {
  const { debug, theme, mode, text, nonce } = config;
  const css = skulletCSS({ theme, mode, text });
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
