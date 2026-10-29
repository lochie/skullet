import { useState } from "react";
import { SkeletonReveal } from "skullet/react";
import { TextMorph } from "torph/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";
import { Avatar } from "@/components/avatar";

type Holding = { symbol: string; name: string; value: number; hue: number };

const HOLDINGS: Holding[] = [
  { symbol: "ETH", name: "Ether", value: 8420.18, hue: 270 },
  { symbol: "USDC", name: "USD Coin", value: 2915.4, hue: 230 },
  { symbol: "AAVE", name: "Aave", value: 1144.62, hue: 300 },
];

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD" });

// The prices a tick later — deterministic, so server and client agree
const at = (tick: number): Holding[] =>
  HOLDINGS.map((holding, i) => ({
    ...holding,
    value: holding.value * (1 + Math.sin(tick * 1.7 + i * 2.3) * 0.04),
  }));

const total = (holdings: Holding[]) =>
  holdings.reduce((sum, holding) => sum + holding.value, 0);

/** The first load is a skeleton; every update after keeps the data on screen and morphs it. */
export const WalletDemo = () => {
  const loaded = useLoad(true, 900);
  const [tick] = useState(0);
  const holdings = loaded ? at(tick) : null;
  const change = (total(at(tick)) / total(at(tick - 1)) - 1) * 100;

  return (
    <div className={`${styles.frame} ${styles.wide}`}>
      <SkeletonReveal
        data={holdings}
        sample={HOLDINGS}
        label="Loading portfolio"
      >
        {(holdings) => (
          <div className={styles.wallet}>
            <div className={styles.walletTotal}>
              <span className={styles.label}>Portfolio</span>
              <TextMorph className={styles.walletValue}>
                {usd.format(total(holdings))}
              </TextMorph>
              <span className={styles.delta} data-up={change >= 0}>
                <TextMorph as="span">{`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}</TextMorph>
              </span>
            </div>
            <ul className={styles.holdings}>
              {holdings.map((holding) => (
                <li key={holding.symbol}>
                  <Avatar name={holding.symbol} hue={holding.hue} />
                  <div className={styles.body}>
                    <span className={styles.from}>{holding.symbol}</span>
                    <span className={styles.label}>{holding.name}</span>
                  </div>
                  <TextMorph className={styles.holdingValue}>
                    {usd.format(holding.value)}
                  </TextMorph>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
