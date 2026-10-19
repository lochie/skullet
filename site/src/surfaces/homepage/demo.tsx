import { useState } from "react";
import { SkeleProvider } from "skele/react";

import styles from "./demo.module.scss";
import { Button } from "@/components/button";
import { ArticleDemo } from "@/demos/article";
import { ChatDemo } from "@/demos/chat";
import { GalleryDemo } from "@/demos/gallery";
import { InboxDemo } from "@/demos/inbox";
import { PlayerDemo } from "@/demos/player";
import { ProfileDemo } from "@/demos/profile";
import { SettingsDemo } from "@/demos/settings";
import { StatsDemo } from "@/demos/stats";
import { WalletDemo } from "@/demos/wallet";

// Columns are fixed rather than CSS `columns`, which would rebalance cards between columns as heights settle
const COLUMNS = [
  [ProfileDemo, ArticleDemo, SettingsDemo],
  [StatsDemo, ChatDemo, GalleryDemo],
  [InboxDemo, PlayerDemo, WalletDemo],
];

export const Demo = () => {
  // Remounting the grid is a reload: every demo starts over on its own delay
  const [round, setRound] = useState(0);
  const [reveal, setReveal] = useState<"smart" | "sweep">("sweep");

  return (
    <div className={styles.demo}>
      <SkeleProvider reveal={reveal}>
        <div className={styles.grid} key={round}>
          {COLUMNS.map((column, i) => (
            <div key={i} className={styles.column}>
              {column.map((DemoComponent, j) => (
                <div key={j} className={styles.card}>
                  <DemoComponent />
                </div>
              ))}
            </div>
          ))}
        </div>
      </SkeleProvider>
      <div className={styles.controls}>
        {(["smart", "sweep"] as const).map((mode) => (
          <Button
            key={mode}
            disabled={reveal === mode}
            onClick={() => {
              setReveal(mode);
              setRound((r) => r + 1);
            }}
          >
            {mode}
          </Button>
        ))}
        <Button onClick={() => setRound((r) => r + 1)}>Reload</Button>
      </div>
    </div>
  );
};
