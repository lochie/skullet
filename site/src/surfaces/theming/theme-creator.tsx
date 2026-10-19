import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  DEFAULT_COLORS,
  themeVariables,
  type SkeleAnimation,
  type SkeleSpeed,
  type SkeleTheme,
  type TextBottom,
  type TextTop,
} from "skele";

import styles from "./theme-creator.module.scss";
import { ARRIVALS, PreviewPage, REGIONS, type Region } from "./preview-page";
import { CodeBlock } from "@/components/codeblock";

type Mode = "light" | "dark";
type Color = { hex: string; alpha: number };
type Colors = Record<Mode, { base: Color; highlight: Color }>;

const ANIMATIONS: SkeleAnimation[] = [
  "shimmer",
  "group-shimmer",
  "pulse",
  "none",
];
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
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className={styles.field}>
    <span>{label}</span>
    <div className={styles.options}>
      {options.map((option) => (
        <button
          key={option}
          data-active={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>
        {value}
        {unit}
      </output>
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
      <input
        type="color"
        value={color.hex}
        onChange={(event) => onChange({ ...color, hex: event.target.value })}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={color.alpha}
        onChange={(event) =>
          onChange({ ...color, alpha: Number(event.target.value) })
        }
        aria-label={`${label} opacity`}
      />
      <output>{color.alpha}%</output>
    </div>
  </div>
);

export const ThemeCreator = () => {
  const [mode, setMode] = useState<Mode>("dark");
  const [colors, setColors] = useState(INITIAL);
  const [radius, setRadius] = useState<"auto" | "pill" | "px">("auto");
  const [pixels, setPixels] = useState(4);
  const [animation, setAnimation] = useState<SkeleAnimation>("shimmer");
  const [speed, setSpeed] = useState<SkeleSpeed>("slow");
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
  const loaded = arrived.size === REGIONS.length;

  const theme: SkeleTheme = {
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

  const code = `<SkeleProvider
  mode="system"
  theme={${JSON.stringify(
    isDefault ? { ...theme, light: undefined, dark: undefined } : theme,
    null,
    2,
  )
    .replace(/"(\w+)":/g, "$1:")
    .replace(/\n/g, "\n  ")}}
>
  <App />
</SkeleProvider>`;

  return (
    <div className={styles.creator}>
      <div className={styles.controls}>
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
        <Choice
          label="Radius"
          options={["auto", "px", "pill"] as const}
          value={radius}
          onChange={setRadius}
        />
        {radius === "px" && (
          <Slider
            label=""
            value={pixels}
            min={0}
            max={16}
            unit="px"
            onChange={setPixels}
          />
        )}
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
        <Choice label="Text top" options={TOPS} value={top} onChange={setTop} />
        <Choice
          label="Text bottom"
          options={BOTTOMS}
          value={bottom}
          onChange={setBottom}
        />
      </div>

      <div className={styles.stage} data-mode={mode}>
        <div className={styles.chrome}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.address}>lochie.me</span>
          <button onClick={load}>{loaded ? "Reload" : "Load page"}</button>
          <button onClick={reset} disabled={arrived.size === 0}>
            Skeleton
          </button>
        </div>
        <div
          // Applied here only, so the theme stays inside the preview; remounted to measure each change
          key={JSON.stringify(theme) + mode}
          style={themeVariables(theme, mode) as CSSProperties}
        >
          <PreviewPage loading={(region) => !arrived.has(region)} />
        </div>
      </div>

      <CodeBlock code={code} />
    </div>
  );
};
