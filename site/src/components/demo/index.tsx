import { useState } from "react";

import styles from "./styles.module.scss";

/**
 * A live demo in the docs. Clicking remounts it, so its loader starts over —
 * unless it has `controls`, which sit under the box and drive it instead.
 */
export const Demo = ({
  children,
  hint,
  controls,
}: {
  children: React.ReactNode;
  hint?: string;
  controls?: React.ReactNode;
}) => {
  const [loads, setLoads] = useState(0);
  const reload = () => setLoads((count) => count + 1);

  if (controls) {
    return (
      <div className={styles.stack}>
        <div className={styles.container} data-still>
          {hint && <span className={styles.hint}>{hint}</span>}

          <div className={styles.controls}>{controls}</div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      role="button"
      tabIndex={0}
      aria-label="Reload this demo"
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
  );
};
