import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";
import { Avatar } from "@/components/avatar";

type Message = { mine: boolean; text: string };

const THREAD: Message[] = [
  { mine: false, text: "Did the skeleton just guess my bubble widths?" },
  { mine: true, text: "Measured them. Every one." },
  { mine: false, text: "And nothing moved?" },
  { mine: true, text: "Not a pixel" },
];

export const ChatDemo = () => {
  const [thread] = useLoad(THREAD, 850);

  return (
    <div className={styles.frame}>
      <SkeletonReveal data={thread} sample={THREAD} label="Loading thread">
        {(thread) => (
          <>
            <div className={styles.chatHeader}>
              <Avatar name="Alex Vanderzon" size={32} />
              <span className={styles.from}>Alex</span>
            </div>
            <ul className={styles.chat}>
              {thread.map((message, i) => (
                <li key={i} className={styles.bubble} data-mine={message.mine}>
                  {message.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </SkeletonReveal>
    </div>
  );
};
