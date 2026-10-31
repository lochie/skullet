import { type CSSProperties, useState } from "react";
import { themeVariables } from "skullet";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import { Field, ProfileCard, PROFILES } from "../parts";

const SCOPES = [
  {
    title: "Brand",
    detail: "Colours of its own.",
    style: themeVariables(
      {
        dark: {
          base: "rgb(47 111 237 / 0.28)",
          highlight: "rgb(150 190 255 / 0.3)",
        },
      },
      "dark",
    ),
  },
  {
    title: "Pills, pulsing",
    detail: "Round bars and a soft pulse.",
    style: themeVariables({ radius: "999px", animation: "pulse" }),
  },
  {
    title: "Warm, square, fast",
    detail: "Its own sweep, quickly.",
    style: themeVariables(
      {
        dark: {
          base: "rgb(255 122 89 / 0.2)",
          highlight: "rgb(255 206 68 / 0.25)",
        },
        radius: "2px",
        animation: "group-shimmer",
        speed: "fast",
      },
      "dark",
    ),
  },
];

export const ScopedThemesDemo = () => {
  const [index, setIndex] = useState(0);
  const scope = SCOPES[index]!;

  return (
    <Demo
      controls={
        <Field label="Theme">
          <SegmentedControl
            label="Theme"
            options={SCOPES.map((_, i) => i)}
            value={index}
            onChange={setIndex}
            format={(i) => SCOPES[i]!.title}
          />
        </Field>
      }
    >
      <p className={styles.demoNote}>{scope.detail}</p>
      <div className={styles.frame} style={scope.style as CSSProperties}>
        <Skeleton key={index} loading>
          <ProfileCard profile={PROFILES[1]!} />
        </Skeleton>
      </div>
    </Demo>
  );
};
