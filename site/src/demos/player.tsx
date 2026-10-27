import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";

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

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

export const PlayerDemo = () => {
  const [track] = useLoad(TRACK, 950);

  return (
    <div className={styles.frame}>
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
              <Icon d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              <Icon d="M8 5v14l11-7z" />
              <Icon d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
            </div>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
