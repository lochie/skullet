/* eslint-disable @next/next/no-img-element -- plain images, so the skeleton measures them as such */
import { useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";

type Board = { title: string; shots: string[] };

// A query of its own each load, so the photos come over the network every time; the sample's stay put for the server render
const board = (query?: number): Board => ({
  title: "Moodboard",
  shots: Array.from(
    { length: 6 },
    (_, i) =>
      `https://picsum.photos/seed/skullet-${i}/240/240${query === undefined ? "" : `?q=${query}`}`,
  ),
});

const SAMPLE = board();

export const GalleryDemo = () => {
  const [fresh] = useState(() => board(Math.random()));
  const [loaded] = useLoad(fresh, 750);

  return (
    <div className={styles.frame}>
      <SkeletonReveal data={loaded} sample={SAMPLE} label="Loading moodboard">
        {(board) => (
          <div className={styles.gallery}>
            <div className={styles.top}>
              <span className={styles.from}>{board.title}</span>
              <span>{board.shots.length} shots</span>
            </div>
            <div className={styles.shots}>
              {board.shots.map((src) => (
                <img key={src} src={src} alt="" width={240} height={240} />
              ))}
            </div>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
