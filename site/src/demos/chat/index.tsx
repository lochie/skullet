import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";
import { Avatar } from "@/components/avatar";
import { Skeleton } from "skullet/react";
import { useSfx } from "@/hooks/useSfx";
import { SOUNDS } from "@/utils/consts";

type Preview = { href: string; title: string; site: string; image: string };
type Message = { mine: boolean; text?: string; preview?: Preview };
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

// A link sent on its own, which iMessage unfurls into a card
const DOCS: Preview = {
  href: "/docs",
  title: "Skullet docs",
  site: "skullet.lochie.me",
  image: "/opengraph-image.png",
};

// Each send is a question of mine, then Lochie's answers, one after another
const FOLLOW_UPS: { ask: string; replies: (string | Preview)[] }[] = [
  {
    ask: "What about server rendering?",
    replies: ["a tiny inline script measures the html before first paint"],
  },
  {
    ask: "And with no sample data?",
    replies: ["it remembers the shape it showed last time"],
  },
  { ask: "Does anything move when it loads?", replies: ["not a pixel"] },
  { ask: "Ok I’m sold", replies: ["check out the docs", DOCS] },
];

const REPLY_DELAY = 1200;
const NEXT_REPLY = 900; // A second reply follows the first after this
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
  const sendSound = useSfx({ src: SOUNDS.pop });
  const replySound = useSfx({ src: SOUNDS.send });
  // Not a dependency: the reply's timer would restart on every render
  const onReply = useEffectEvent(() => replySound.play());

  const [step, setStep] = useState(0);
  const next = FOLLOW_UPS[step];

  useEffect(() => {
    if (!replying || !next) return;
    const timeouts = next.replies.map((reply, i) =>
      setTimeout(
        () => {
          setExtra((messages) => [
            ...messages,
            typeof reply === "string"
              ? { mine: false, text: reply }
              : { mine: false, preview: reply },
          ]);
          onReply();
          if (i === next.replies.length - 1) {
            setStep((current) => current + 1);
            setReplying(false);
          }
        },
        REPLY_DELAY + i * NEXT_REPLY,
      ),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [replying, next]);

  const messages = useMemo(
    () => thread && [...thread, ...extra],
    [thread, extra],
  );

  // Mid-conversation a click anywhere sends; loading or finished, it reaches the card, which reloads
  const onClick = (event: React.MouseEvent) => {
    if (!thread || !next) return;
    event.stopPropagation();
    if (replying) return;
    setExtra((messages) => [...messages, { mine: true, text: next.ask }]);
    setReplying(true);
    sendSound.play();
  };

  return (
    <div onClick={onClick}>
      <Skeleton data={messages} sample={THREAD} label="Loading thread">
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
                      data-preview={!!message.preview || undefined}
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                        originY: 1,
                        originX: message.mine ? 1 : 0,
                      }}
                      // Delayed on its own target, so the bubbles above make room first; layout and exit keep the undelayed transition
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                          duration: 0.3,
                          ease: "easeOut",
                          delay: 0.15,
                        },
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                    >
                      {message.preview ? (
                        // Its own click: following it shouldn't also reload the card
                        <Link
                          href={message.preview.href}
                          className={styles.preview}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- a plain image is what's measured */}
                          <img
                            src={message.preview.image}
                            alt=""
                            width={1440}
                            height={760}
                          />
                          <span className={styles.previewTitle}>
                            {message.preview.title}
                          </span>
                          <span className={styles.previewSite}>
                            {message.preview.site}
                          </span>
                        </Link>
                      ) : (
                        message.text
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <button
              className={styles.chatInput}
              data-replying={replying}
              onKeyDown={(event) => event.stopPropagation()}
              disabled={!thread || !next || replying}
            >
              <div className={styles.input}>
                {replying || !next ? (
                  "Type a message…"
                ) : (
                  <Typed key={step} text={next.ask} />
                )}
              </div>
              <div className={styles.send}>Send</div>
            </button>
          </>
        )}
      </Skeleton>
    </div>
  );
};
