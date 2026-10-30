import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";

type Track = {
  title: string;
  artist: string;
  elapsed: string;
  duration: string;
  progress: number;
};

const TRACK: Track = {
  title: "Skeletons",
  artist: "The Layout Janks",
  elapsed: "1:12",
  duration: "3:24",
  progress: 0.35,
};

// Filled and stroked alike with round joins, so every corner comes out soft
const Icon = ({ d, size = 26 }: { d: string; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

export const PlayerDemo = () => {
  const track = useLoad(TRACK, 950);

  return (
    <div>
      <SkeletonReveal data={track} sample={TRACK} label="Loading track">
        {(track) => (
          <div className={styles.player}>
            <div className={styles.art} />
            <div className={styles.track}>
              <span className={styles.title}>{track.title}</span>
              <span className={styles.label}>{track.artist}</span>
            </div>
            <div className={styles.progress}>
              <div
                className={styles.progressFill}
                style={{ width: `${track.progress * 100}%` }}
              />
            </div>
            <div className={styles.times}>
              <span>{track.elapsed}</span>
              <span>{track.duration}</span>
            </div>
            <div className={styles.transport}>
              <Icon d="M6 6.5v11M18 7v10l-7.5-5z" />
              <Icon d="M8 6v12l10-6z" size={34} />
              <Icon d="M18 6.5v11M6 7v10l7.5-5z" />
            </div>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
