import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";
import { Avatar } from "@/components/avatar";

type Message = {
  from: string;
  name: string;
  preview: string;
  time: string;
  hue: number;
};

const MESSAGES: Message[] = [
  {
    from: "Alex",
    name: "Alex Vanderzon",
    preview: "Pushed the new site design, have a look when you get a sec",
    time: "2m",
    hue: 45,
  },
  {
    from: "Pugson",
    name: "Pugson",
    preview: "The skeletons are shimmering in sync now??",
    time: "1h",
    hue: 200,
  },
  {
    from: "Jack",
    name: "Jack Skellington",
    preview: "Naming things is the hardest part, as always",
    time: "3d",
    hue: 320,
  },
];

const SAMPLE = MESSAGES;

export const InboxDemo = () => {
  const [messages] = useLoad(MESSAGES, 800);

  return (
    <div className={styles.frame}>
      {/* `id` remembers the shape across visits, so a return visit's first load is exact */}
      <SkeletonReveal id="demo-inbox" data={messages} sample={SAMPLE}>
        {(messages) => (
          <ul className={styles.inbox}>
            {messages.map((message) => (
              <li key={message.name} className={styles.message}>
                <Avatar name={message.name} hue={message.hue} />
                <div className={styles.body}>
                  <div className={styles.top}>
                    <span className={styles.from}>{message.from}</span>
                    <time>{message.time}</time>
                  </div>
                  <div className={styles.preview}>{message.preview}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SkeletonReveal>
    </div>
  );
};
