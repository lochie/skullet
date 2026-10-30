import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import styles from "./install.module.scss";
import { TextMorph } from "torph/react";
import { CodeBlock } from "@/components/codeblock";

const COMMANDS = {
  npm: "npm i skullet",
  pnpm: "pnpm i skullet",
  yarn: "yarn add skullet",
  bun: "bun add skullet",
};

export const InstallCommands = () => {
  const [cmdIndex, setCmdIndex] = useState(0);
  const { trigger } = useWebHaptics();
  const command =
    COMMANDS[Object.keys(COMMANDS)[cmdIndex] as keyof typeof COMMANDS];
  return (
    <div className={styles.install}>
      <div className={styles.commands}>
        {Object.keys(COMMANDS).map((cmd, i) => (
          <button
            key={cmd}
            onClick={() => {
              trigger("selection");
              setCmdIndex(i);
            }}
            data-active={i === cmdIndex}
          >
            {cmd}
          </button>
        ))}
      </div>
      <div className={styles.cmd}>
        <CodeBlock code={command}>
          <span
            style={{
              opacity: 0.4,
              userSelect: "none",
            }}
          >
            {"$ "}
          </span>
          <TextMorph>{command}</TextMorph>
        </CodeBlock>
      </div>
    </div>
  );
};
