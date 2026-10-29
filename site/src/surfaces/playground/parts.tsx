import { useState, useSyncExternalStore } from "react";
import { debugging, setDebug } from "skullet";

import styles from "./styles.module.scss";

const subscribe = () => () => {};

export const DebugToggle = () => {
  // What the URL or storage turned on — off on the server, which has neither
  const initial = useSyncExternalStore(subscribe, debugging, () => false);
  const [toggled, setOn] = useState<boolean | null>(null);
  const on = toggled ?? initial;

  return (
    <button
      className={styles.debugToggle}
      data-active={on}
      onClick={() => {
        setDebug(!on);
        setOn(!on);
      }}
    >
      {on ? "Hide" : "Show"} debug overlay
    </button>
  );
};
