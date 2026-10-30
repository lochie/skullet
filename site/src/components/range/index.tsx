import styles from "./styles.module.scss";

/** A slider as a pill filled to its value, over the native range input so keys and screen readers still work. */
export const Range = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  children,
  ...props
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** The value as shown, inside the pill on the right. */
  children?: React.ReactNode;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "children"
>) => (
  <span
    className={styles.pill}
    style={
      { "--fill": (value - min) / (max - min || 1) } as React.CSSProperties
    }
  >
    <span className={styles.fill} />
    <input
      {...props}
      type="range"
      className={styles.range}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    {children !== undefined && (
      <span className={styles.value} aria-hidden>
        {children}
      </span>
    )}
  </span>
);
