import { useState, useSyncExternalStore } from "react";
import { debugging, setDebug } from "skullet";

import { Button } from "@/demos/parts";

const subscribe = () => () => {};

export const DebugToggle = () => {
  // What the URL or storage turned on — off on the server, which has neither
  const initial = useSyncExternalStore(subscribe, debugging, () => false);
  const [toggled, setOn] = useState<boolean | null>(null);
  const on = toggled ?? initial;

  return (
    <Button
      data-active={on}
      onClick={() => {
        setDebug(!on);
        setOn(!on);
      }}
    >
      {on ? "Hide" : "Show"} debug overlay
    </Button>
  );
};
