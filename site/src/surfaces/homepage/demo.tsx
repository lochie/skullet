import { useState } from "react";
import { SkulletProvider } from "skullet/react";

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
  // One count per card: bumping it remounts just that demo, so its loader starts over
  const [loads, setLoads] = useState<Record<string, number>>({});
  const reload = (card: string) =>
    setLoads((counts) => ({ ...counts, [card]: (counts[card] ?? 0) + 1 }));

  return (
    <div className={styles.demo}>
      <SkulletProvider reveal={reveal}>
        <div className={styles.grid} key={round}>
          {COLUMNS.map((column, i) => (
            <div key={i} className={styles.column}>
              {column.map((DemoComponent, j) => {
                const card = `${i}-${j}`;
                return (
                  <div
                    key={j}
                    className={styles.card}
                    role="button"
                    tabIndex={0}
                    aria-label="Reload this demo"
                    onClick={() => reload(card)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      reload(card);
                    }}
                  >
                    <DemoComponent key={loads[card] ?? 0} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </SkulletProvider>
    </div>
  );
};
