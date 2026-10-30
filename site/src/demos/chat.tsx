import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";
import { Avatar } from "@/components/avatar";
import { SkeletonReveal } from "skullet/react";

type Message = { mine: boolean; text: string };

const THREAD: Message[] = [
  { mine: true, text: "Wait, how does it know the content length?" },
  { mine: false, text: "it renders sample data invisibly" },
  {
    mine: false,
    text: "then measures each element and draws a skeleton in that shape while your content loads",
  },
  { mine: true, text: "Spooky" },
  { mine: false, text: "skeletons usually are 💀" },
];

// Each send is a question of mine, then Lochie's answer
const FOLLOW_UPS: [mine: string, reply: string][] = [
  [
    "What about server rendering?",
    "a tiny inline script measures the html before first paint",
  ],
  ["And with no sample data?", "it remembers the shape it showed last time"],
  ["Does anything move when it loads?", "not a pixel"],
  ["Ok I’m sold", "npm i skullet"],
];

const REPLY_DELAY = 900;
const TYPE_SPEED = 35;

// Keyed per message, so each one types in from empty
const Typed = ({ text }: { text: string }) => {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (length >= text.length) return;
    const timeout = setTimeout(() => setLength(length + 1), TYPE_SPEED);
    return () => clearTimeout(timeout);
  }, [length, text]);

  return text.slice(0, length);
};

export const ChatDemo = () => {
  const thread = useLoad(THREAD, 850);
  const [extra, setExtra] = useState<Message[]>([]);
  const [replying, setReplying] = useState(false);

  // Two messages per step, so a step is done once its reply is in
  const step = Math.floor(extra.length / 2);
  const next = FOLLOW_UPS[step];

  useEffect(() => {
    if (!replying || !next) return;
    const timeout = setTimeout(() => {
      setExtra((messages) => [...messages, { mine: false, text: next[1] }]);
      setReplying(false);
    }, REPLY_DELAY);
    return () => clearTimeout(timeout);
  }, [replying, next]);

  const messages = useMemo(
    () => thread && [...thread, ...extra],
    [thread, extra],
  );

  const onSend = (event: React.MouseEvent) => {
    // The card reloads on click
    event.stopPropagation();
    if (!next || replying) return;
    setExtra((messages) => [...messages, { mine: true, text: next[0] }]);
    setReplying(true);
  };

  return (
    <div>
      <SkeletonReveal data={messages} sample={THREAD} label="Loading thread">
        {(thread) => (
          <>
            <div className={styles.chatHeader}>
              <Avatar name="Lochie Axon" size={32} />
              <span className={styles.from}>Lochie</span>
            </div>
            <div className={styles.chatContainer}>
              <ul className={styles.chat}>
                <AnimatePresence initial={false} mode="popLayout">
                  {thread.map((message, i) => (
                    <motion.li
                      key={i}
                      className={styles.bubble}
                      layout="position"
                      layoutId={`message-${i}`}
                      data-mine={message.mine}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      {message.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <button
              className={styles.chatInput}
              data-replying={replying}
              onClick={onSend}
              onKeyDown={(event) => event.stopPropagation()}
              disabled={!thread || !next || replying}
            >
              <div className={styles.input}>
                {replying || !next ? (
                  "Type a message…"
                ) : (
                  <Typed key={step} text={next[0]} />
                )}
              </div>
              <div className={styles.send}>Send</div>
            </button>
          </>
        )}
      </SkeletonReveal>
    </div>
  );
};
