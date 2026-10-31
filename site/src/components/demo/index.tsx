import { useState } from "react";

import styles from "./styles.module.scss";

/** A live demo: a click remounts it, or runs `onClick`; `still`, or `controls` (under it) without `onClick`, and it isn't clickable. */
export const Demo = ({
  children,
  hint,
  controls,
  onClick,
  disabled,
  still,
}: {
  children: React.ReactNode;
  hint?: string;
  controls?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  still?: boolean;
}) => {
  const [loads, setLoads] = useState(0);
  const clickable = !still && (!!onClick || !controls);
  const reload = () => {
    if (disabled) return;
    if (onClick) onClick();
    else setLoads((count) => count + 1);
  };

  const box = clickable ? (
    <div
      className={styles.container}
      role="button"
      tabIndex={0}
      aria-label={hint ?? "Reload this demo"}
      aria-disabled={disabled || undefined}
      onClick={reload}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        reload();
      }}
    >
      <div key={loads} className={styles.content}>
        {children}
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  ) : (
    <div className={styles.container} data-still>
      <div className={styles.content}>{children}</div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );

  if (!controls) return box;
  return (
    <div className={styles.stack}>
      {box}
      <div className={styles.controls}>{controls}</div>
    </div>
  );
};
