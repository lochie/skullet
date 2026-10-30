import { useState } from "react";

import styles from "./styles.module.scss";

/** A live demo: a click remounts it, or runs `onClick`; with `controls` (under it) and no `onClick`, it's still. */
export const Demo = ({
  children,
  hint,
  controls,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  hint?: string;
  controls?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const [loads, setLoads] = useState(0);
  const clickable = !!onClick || !controls;
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
