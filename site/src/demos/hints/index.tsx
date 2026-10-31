import { useState } from "react";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Avatar } from "@/components/avatar";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import { PROFILES } from "../parts";

const TAGS = ["Motion", "Type", "Systems"];

const Tagged = ({ hint }: { hint?: "skullet-block" | "skullet-ignore" }) => (
  <div className={styles.profile}>
    <Avatar name={PROFILES[1]!.name} />
    <div>
      <p className={styles.feedName}>{PROFILES[1]!.name}</p>
      <p className={styles.feedMeta}>{PROFILES[1]!.role}</p>
    </div>
    <div className={styles.tags} {...(hint ? { [hint]: "" } : {})}>
      {TAGS.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  </div>
);

const HINTS = [
  {
    title: "Measured",
    hint: undefined,
    detail: "Each tag is a painted label, so each gets its own skeleton.",
  },
  {
    title: "skullet-block",
    hint: "skullet-block",
    detail: "The whole row is drawn as one block.",
  },
  {
    title: "skullet-ignore",
    hint: "skullet-ignore",
    detail: "The row keeps its space but draws nothing.",
  },
] as const;

export const HintsDemo = () => {
  const [index, setIndex] = useState(0);
  const { hint, detail } = HINTS[index]!;

  return (
    <Demo
      controls={
        <SegmentedControl
          label="Hint"
          options={HINTS.map((_, i) => i)}
          value={index}
          onChange={setIndex}
          format={(i) => HINTS[i]!.title}
        />
      }
    >
      <p className={styles.demoNote}>{detail}</p>
      <div className={styles.frame}>
        <Skeleton key={index} loading>
          <Tagged hint={hint} />
        </Skeleton>
      </div>
    </Demo>
  );
};
