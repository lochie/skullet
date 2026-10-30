export type SkulletColors = {
  /** The bones' fill. */
  base: string;
  /** The shimmer sweeping across them. */
  highlight: string;
};

/**
 * `shimmer` sweeps one highlight across the whole page; `group-shimmer` gives
 * each skeleton a sweep of its own; `pulse` fades every bone softly in and out.
 * All of them keep one phase across the page, and hold still under reduced motion.
 */
export type SkulletAnimation = "shimmer" | "group-shimmer" | "pulse" | "none";

/** How quickly the animation loops — each animation has its own slow and fast. */
export type SkulletSpeed = "slow" | "fast";

/** How much of each line of text is drawn: from the font's `top` line down to its `bottom` line. */
export type SkeleText = {
  top?: "ascender" | "cap-height" | "x-height";
  bottom?: "baseline" | "descender";
};

/** `system` follows `prefers-color-scheme`; the others pin one set of colours. */
export type SkulletMode = "light" | "dark" | "system";

export type SkeleTheme = {
  light?: SkulletColors;
  dark?: SkulletColors;
  /** How round each line of text, and any other single bar, is drawn — any CSS length; `999px` for pills. Images and chips keep their own. */
  radius?: string;
  animation?: SkulletAnimation;
  speed?: SkulletSpeed;
  text?: SkeleText;
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
} as const satisfies SkeleTheme;

/**
 * The custom properties a theme sets, for one set of colours — ready for a
 * style attribute, so a theme can apply to one part of a page.
 */
export function themeVariables(
  theme: SkeleTheme = {},
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

/**
 * CSS for a theme on `selector`. Colours follow `mode` — `system` switches
 * with `prefers-color-scheme` — and are left out when neither colours nor a
 * mode are given, so the page's own stay.
 */
export function skulletCSS({
  theme = {},
  mode,
  text,
  selector = ":root",
}: {
  theme?: SkeleTheme;
  mode?: SkulletMode;
  text?: SkeleText;
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
  theme?: SkeleTheme,
  mode?: SkulletMode,
  { nonce }: { nonce?: string } = {},
) {
  themeEl ??= document.head.appendChild(document.createElement("style"));
  if (nonce) themeEl.nonce = nonce;
  themeEl.textContent = skulletCSS({ theme, mode });
}

/** The same CSS as a whole element, for templates that can only render HTML strings. */
export const themeStyleTag = (
  config: { theme?: SkeleTheme; mode?: SkulletMode; text?: SkeleText },
  nonce?: string,
) => {
  const css = skulletCSS(config);
  return css
    ? `<style${nonce ? ` nonce="${nonce.replace(/"/g, "&quot;")}"` : ""}>${css}</style>`
    : "";
};
