import styles from "./styles.module.scss";

/** One choice from a few, as a row of segments. */
export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (option) => option,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (option: T) => React.ReactNode;
}) => (
  <div className={styles.control} role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <button
        key={option}
        type="button"
        role="radio"
        aria-checked={option === value}
        onClick={() => onChange(option)}
      >
        {format(option)}
      </button>
    ))}
  </div>
);
