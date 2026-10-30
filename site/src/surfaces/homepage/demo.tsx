import { useState } from "react";
import { SkulletProvider } from "skullet/react";

import styles from "./demo.module.scss";
import { useSfx } from "@/hooks/useSfx";
import { SOUNDS } from "@/utils/consts";
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
  [ProfileDemo, ArticleDemo, GalleryDemo],
  [ChatDemo, StatsDemo, SettingsDemo],
  [InboxDemo, PlayerDemo, WalletDemo],
];

// One column on a phone: these, in this order, so it's a sample rather than a scroll through nine
const ON_PHONES = [ArticleDemo, InboxDemo, ChatDemo];

export const Demo = () => {
  // One count per card: bumping it remounts just that demo, so its loader starts over
  const [loads, setLoads] = useState<Record<string, number>>({});
  const reloadSound = useSfx({ src: SOUNDS.blink });
  const reload = (card: string) => {
    reloadSound.play();
    setLoads((counts) => ({ ...counts, [card]: (counts[card] ?? 0) + 1 }));
  };

  return (
    <div className={styles.demo}>
      <SkulletProvider reveal="sweep">
        <div className={styles.grid}>
          {COLUMNS.map((column, i) => (
            <div key={i} className={styles.column}>
              {column.map((DemoComponent, j) => {
                const card = `${i}-${j}`;
                return (
                  <div
                    key={j}
                    className={styles.card}
                    data-phone={ON_PHONES.includes(DemoComponent) || undefined}
                    style={
                      {
                        "--phone-order": ON_PHONES.indexOf(DemoComponent),
                      } as React.CSSProperties
                    }
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
