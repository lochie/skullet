import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  DEFAULT_COLORS,
  sequence,
  smart,
  sweep,
  themeVariables,
  together,
  type RevealMode,
  type SkulletAnimation,
  type SkulletSpeed,
  type SkulletTheme,
  type TextBottom,
  type TextTop,
} from "skullet";
import { SkulletProvider } from "skullet/react";

import styles from "./theme-creator.module.scss";
import { ARRIVALS, PreviewPage, REGIONS, type Region } from "./preview-page";
import { CodeBlock } from "@/components/codeblock";
import { Range } from "@/components/range";
import { SegmentedControl } from "@/components/segmented-control";

type Mode = "light" | "dark";
type Color = { hex: string; alpha: number };
type Colors = Record<Mode, { base: Color; highlight: Color }>;

const ANIMATIONS: SkulletAnimation[] = [
  "shimmer",
  "group-shimmer",
  "pulse",
  "none",
];
const REVEALS = ["smart", "together", "sequence", "sweep"] as const;
type RevealName = (typeof REVEALS)[number];
const PRESETS = { smart, together, sequence, sweep };

// Where each piece starts from as it arrives, on top of the fade
const ENTERS = {
  none: null,
  blur: { filter: "blur(6px)" },
  rise: { translate: "0 8px" },
  zoom: { scale: "0.96" },
} as const;
type Enter = keyof typeof ENTERS;
const ENTER_NAMES = Object.keys(ENTERS) as Enter[];
const TOPS: TextTop[] = ["ascender", "cap-height", "x-height"];
const BOTTOMS: TextBottom[] = ["descender", "baseline"];

const INITIAL: Colors = {
  light: {
    base: { hex: "#000000", alpha: 7 },
    highlight: { hex: "#ffffff", alpha: 60 },
  },
  dark: {
    base: { hex: "#ffffff", alpha: 8 },
    highlight: { hex: "#ffffff", alpha: 10 },
  },
};

const rgb = ({ hex, alpha }: Color) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16} ${(value >> 8) & 255} ${value & 255} / ${alpha / 100})`;
};

const Choice = <T extends string>({
  label,
  ...props
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className={styles.field}>
    <span>{label}</span>
    <SegmentedControl label={label} {...props} />
  </div>
);

const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) => (
  <label className={styles.field}>
    <span>{label}</span>
    <div className={styles.slider}>
      <Range
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        aria-label={label || undefined}
      >
        {value}
        {unit}
      </Range>
    </div>
  </label>
);

const Swatch = ({
  label,
  color,
  onChange,
}: {
  label: string;
  color: Color;
  onChange: (color: Color) => void;
}) => (
  <div className={styles.field}>
    <span>{label}</span>
    <div className={styles.slider}>
      <Range
        value={color.alpha}
        onChange={(alpha) => onChange({ ...color, alpha })}
        aria-label={`${label} opacity`}
      >
        {color.alpha}%
      </Range>
    </div>
  </div>
);

export const ThemeCreator = () => {
  const [mode, setMode] = useState<Mode>("dark");
  const [colors, setColors] = useState(INITIAL);
  const [radius, setRadius] = useState<"auto" | "pill" | "px">("auto");
  const [pixels, setPixels] = useState(4);
  const [animation, setAnimation] = useState<SkulletAnimation>("shimmer");
  const [speed, setSpeed] = useState<SkulletSpeed>("slow");
  const [reveal, setReveal] = useState<RevealName>("smart");
  const [enter, setEnter] = useState<Enter>("none");
  const spec = useMemo<RevealMode>(() => {
    const keyframe = ENTERS[enter];
    return keyframe ? { ...PRESETS[reveal], enter: keyframe } : reveal;
  }, [reveal, enter]);
  const [top, setTop] = useState<TextTop>("ascender");
  const [bottom, setBottom] = useState<TextBottom>("descender");
  // Regions whose data has arrived; none at first, so the page opens as its skeleton
  const [arrived, setArrived] = useState<ReadonlySet<Region>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settle = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => settle, []);

  const load = () => {
    settle();
    setArrived(new Set());
    timers.current = REGIONS.map((region) =>
      setTimeout(
        () => setArrived((now) => new Set(now).add(region)),
        ARRIVALS[region],
      ),
    );
  };
  const reset = () => {
    settle();
    setArrived(new Set());
  };
  // Showing the skeleton, a click loads the page; loading or loaded, it goes back to the skeleton
  const toggle = () => (arrived.size === 0 ? load() : reset());

  const theme: SkulletTheme = {
    light: {
      base: rgb(colors.light.base),
      highlight: rgb(colors.light.highlight),
    },
    dark: {
      base: rgb(colors.dark.base),
      highlight: rgb(colors.dark.highlight),
    },
    ...(radius === "pill"
      ? { radius: "999px" }
      : radius === "px"
        ? { radius: `${pixels}px` }
        : {}),
    animation,
    speed,
    text: { top, bottom },
  };

  const edit = (key: "base" | "highlight") => (color: Color) =>
    setColors({ ...colors, [mode]: { ...colors[mode], [key]: color } });

  const isDefault =
    JSON.stringify(theme.light) === JSON.stringify(DEFAULT_COLORS.light) &&
    JSON.stringify(theme.dark) === JSON.stringify(DEFAULT_COLORS.dark);

  const keyframe = ENTERS[enter];
  const revealProp = keyframe
    ? `\n  reveal={{ ...${reveal}, enter: { ${Object.entries(keyframe)
        .map(([key, value]) => `${key}: "${value}"`)
        .join(", ")} } }}`
    : reveal === "smart"
      ? ""
      : `\n  reveal="${reveal}"`;

  const code = `${keyframe ? `import { ${reveal} } from "skullet";\n\n` : ""}<SkulletProvider
  mode="system"${revealProp}
  theme={${JSON.stringify(
    isDefault ? { ...theme, light: undefined, dark: undefined } : theme,
    null,
    2,
  )
    .replace(/"(\w+)":/g, "$1:")
    .replace(/\n/g, "\n  ")}}
>
  <App />
</SkulletProvider>`;

  return (
    <div className={styles.creator}>
      <div className={styles.workspace}>
        <div className={styles.view}>
          <div
            className={styles.stage}
            data-mode={mode}
            role="button"
            tabIndex={0}
            aria-label={
              arrived.size === 0 ? "Load the page" : "Show the skeleton"
            }
            onClick={toggle}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              toggle();
            }}
          >
            <div
              // Applied here only, so the theme stays inside the preview; remounted to measure each change
              key={JSON.stringify(theme) + mode}
              style={themeVariables(theme, mode) as CSSProperties}
            >
              <SkulletProvider reveal={spec}>
                <PreviewPage loading={(region) => !arrived.has(region)} />
              </SkulletProvider>
            </div>
          </div>

          <CodeBlock code={code} />
        </div>
        <div className={styles.panel}>
          <div className={styles.controls}>
            <div className={styles.group} role="group" aria-label="Colour">
              <span className={styles.heading}>Colour</span>
              <Choice
                label="Preview"
                options={["light", "dark"] as const}
                value={mode}
                onChange={setMode}
              />
              <Swatch
                label="Base"
                color={colors[mode].base}
                onChange={edit("base")}
              />
              <Swatch
                label="Highlight"
                color={colors[mode].highlight}
                onChange={edit("highlight")}
              />
            </div>
            <div className={styles.group} role="group" aria-label="Shape">
              <span className={styles.heading}>Shape</span>
              <Choice
                label="Radius"
                options={["auto", "px", "pill"] as const}
                value={radius}
                onChange={setRadius}
              />
              {radius === "px" && (
                <Slider
                  label="Radius in px"
                  value={pixels}
                  min={0}
                  max={32}
                  unit="px"
                  onChange={setPixels}
                />
              )}
              <Choice
                label="Text top"
                options={TOPS}
                value={top}
                onChange={setTop}
              />
              <Choice
                label="Text bottom"
                options={BOTTOMS}
                value={bottom}
                onChange={setBottom}
              />
            </div>
            <div className={styles.group} role="group" aria-label="Motion">
              <span className={styles.heading}>Motion</span>
              <Choice
                label="Animation"
                options={ANIMATIONS}
                value={animation}
                onChange={setAnimation}
              />
              <Choice
                label="Speed"
                options={["slow", "fast"] as const}
                value={speed}
                onChange={setSpeed}
              />
              <Choice
                label="Reveal"
                options={REVEALS}
                value={reveal}
                onChange={setReveal}
              />
              <Choice
                label="Enter"
                options={ENTER_NAMES}
                value={enter}
                onChange={setEnter}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
