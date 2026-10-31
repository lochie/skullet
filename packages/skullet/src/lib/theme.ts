import type { TextBottom, TextTop } from "./measure";

export type SkulletColors = {
  /** The skeleton's fill. */
  base: string;
  /** The shimmer sweeping across it. */
  highlight: string;
};

/** `shimmer` sweeps the whole page, `group-shimmer` each skeleton, `pulse` fades; all hold still under reduced motion. */
export type SkulletAnimation = "shimmer" | "group-shimmer" | "pulse" | "none";

/** How quickly the animation loops — each animation has its own slow and fast. */
export type SkulletSpeed = "slow" | "fast";

/** How much of each line of text is drawn: from the font's `top` line down to its `bottom` line. */
export type SkulletText = { top?: TextTop; bottom?: TextBottom };

/** `system` follows `prefers-color-scheme`; the others pin one set of colours. */
export type SkulletMode = "light" | "dark" | "system";

export type SkulletTheme = {
  light?: SkulletColors;
  dark?: SkulletColors;
  /** How round each line of text, and any other single bar, is drawn — any CSS length; `999px` for pills. Images and chips keep their own. */
  radius?: string;
  animation?: SkulletAnimation;
  speed?: SkulletSpeed;
  text?: SkulletText;
};

export const DEFAULT_COLORS: { light: SkulletColors; dark: SkulletColors } = {
  light: { base: "rgb(0 0 0 / 0.07)", highlight: "rgb(255 255 255 / 0.6)" },
  dark: {
    base: "rgb(255 255 255 / 0.08)",
    highlight: "rgb(255 255 255 / 0.1)",
  },
};

export const DEFAULT_THEME = {
  ...DEFAULT_COLORS,
  animation: "shimmer",
  speed: "slow",
  text: { top: "ascender", bottom: "descender" },
} as const satisfies SkulletTheme;

/** A theme's custom properties for one set of colours, for a style attribute. */
export function themeVariables(
  theme: SkulletTheme = {},
  mode: "light" | "dark" | null = null,
): Record<string, string> {
  const variables: Record<string, string> = {};
  const colors = mode && (theme[mode] ?? DEFAULT_COLORS[mode]);
  if (colors) {
    variables["--skullet-base"] = colors.base;
    variables["--skullet-highlight"] = colors.highlight;
  }
  if (theme.radius) variables["--skullet-radius"] = theme.radius;
  if (theme.animation) variables["--skullet-animation"] = theme.animation;
  if (theme.speed) variables["--skullet-speed"] = theme.speed;
  if (theme.text?.top) variables["--skullet-text-top"] = theme.text.top;
  if (theme.text?.bottom)
    variables["--skullet-text-bottom"] = theme.text.bottom;
  return variables;
}

const declarations = (variables: Record<string, string>) =>
  Object.entries(variables)
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");

/** CSS for a theme on `selector`; colours follow `mode`, and are left out when neither is given. */
export function skulletCSS({
  theme = {},
  mode,
  text,
  selector = ":root",
}: {
  theme?: SkulletTheme;
  mode?: SkulletMode;
  text?: SkulletText;
  selector?: string;
}): string {
  const resolved = { ...theme, text: { ...theme.text, ...text } };
  const colored = mode ?? (theme.light || theme.dark ? "system" : null);
  const base = themeVariables(
    resolved,
    colored === "dark" ? "dark" : colored ? "light" : null,
  );

  const rules: string[] = [];
  if (Object.keys(base).length) {
    rules.push(`${selector} { ${declarations(base)} }`);
  }
  if (colored === "system") {
    const dark = themeVariables({ dark: theme.dark }, "dark");
    rules.push(
      `@media (prefers-color-scheme: dark) { ${selector} { ${declarations(dark)} } }`,
    );
  }
  return rules.join("\n");
}

let themeEl: HTMLStyleElement | null = null;

/** Sets a theme for the whole page, for setups without a provider. */
export function applyTheme(
  theme?: SkulletTheme,
  mode?: SkulletMode,
  { nonce }: { nonce?: string } = {},
) {
  themeEl ??= document.head.appendChild(document.createElement("style"));
  if (nonce) themeEl.nonce = nonce;
  themeEl.textContent = skulletCSS({ theme, mode });
}

/** The same CSS as a whole element, for templates that can only render HTML strings. */
export const themeStyleTag = (
  config: { theme?: SkulletTheme; mode?: SkulletMode; text?: SkulletText },
  nonce?: string,
) => {
  const css = skulletCSS(config);
  return css
    ? `<style${nonce ? ` nonce="${nonce.replace(/"/g, "&quot;")}"` : ""}>${css}</style>`
    : "";
};
