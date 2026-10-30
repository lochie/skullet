import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useSfx } from "@/hooks/useSfx";
import { SOUNDS } from "@/utils/consts";

import styles from "./styles.module.scss";
import { TextMorph } from "torph/react";

export const CodeBlock = ({
  code,
  children,
}: {
  code: string;
  children?: React.ReactNode;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { trigger } = useWebHaptics();
  const copySound = useSfx({ src: SOUNDS.click });

  return (
    <div className={styles.container}>
      <button
        className={styles.copy}
        onClick={() => {
          if (code) {
            setIsCopied(true);
            navigator.clipboard.writeText(code.toString());
            trigger("success");
            copySound.play();
            setTimeout(() => {
              setIsCopied(false);
            }, 2000);
          }
        }}
      >
        <TextMorph>{isCopied ? `Copied` : `Copy`}</TextMorph>
      </button>
      <pre>{children ?? code}</pre>
    </div>
  );
};
