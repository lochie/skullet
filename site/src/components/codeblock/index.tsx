import { useEffect, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useSfx } from "@/hooks/useSfx";
import { COPIED_FOR, SOUNDS } from "@/utils/consts";

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

  useEffect(() => {
    if (!isCopied) return;
    const timeout = window.setTimeout(() => setIsCopied(false), COPIED_FOR);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  return (
    <div className={styles.container}>
      <button
        className={styles.copy}
        onClick={() => {
          setIsCopied(true);
          navigator.clipboard.writeText(code);
          trigger("success");
          copySound.play();
        }}
      >
        <TextMorph>{isCopied ? `Copied` : `Copy`}</TextMorph>
      </button>
      <pre>{children ?? code}</pre>
    </div>
  );
};
