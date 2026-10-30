/* eslint-disable @next/next/no-img-element -- plain images, so the skeleton measures them as such */
import { useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";

type Board = { title: string; shots: string[] };

// New photos each load, seeded per load; the sample's stay put for the server render
const board = (load?: number): Board => ({
  title: "Gallery",
  shots: Array.from(
    { length: 6 },
    (_, i) => `https://picsum.photos/seed/skullet-${load ?? 0}-${i}/240/240`,
  ),
});

const SAMPLE = board();

export const GalleryDemo = () => {
  const [fresh] = useState(() => board(Math.floor(Math.random() * 1e6) + 1));
  const loaded = useLoad(fresh, 750);

  return (
    <div>
      <SkeletonReveal data={loaded} sample={SAMPLE} label="Loading gallery">
        {(board) => (
          <div className={styles.gallery}>
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
