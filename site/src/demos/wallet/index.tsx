import { useState } from "react";
import { SkeletonReveal } from "skullet/react";
import { TextMorph } from "torph/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";
import { Avatar } from "@/components/avatar";

type Holding = { symbol: string; name: string; value: number; hue: number };

const HOLDINGS: Holding[] = [
  { symbol: "ETH", name: "Ether", value: 2420.17, hue: 270 },
  { symbol: "USDC", name: "USD Coin", value: 512.4, hue: 230 },
  { symbol: "AAVE", name: "Aave", value: 1144.62, hue: 300 },
];

// Each holding's range on a load: together never past $9,000
const RANGES: Record<string, [min: number, max: number]> = {
  ETH: [1200, 4800],
  USDC: [200, 1600],
  AAVE: [400, 2400],
};

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD" });

type Portfolio = { holdings: Holding[]; change: number };

const SAMPLE: Portfolio = { holdings: HOLDINGS, change: 2.4 };

const randomHoldings = (): Holding[] =>
  HOLDINGS.map((holding) => {
    const [min, max] = RANGES[holding.symbol]!;
    return { ...holding, value: min + Math.random() * (max - min) };
  });

const total = (holdings: Holding[]) =>
  holdings.reduce((sum, holding) => sum + holding.value, 0);

/** New holdings each load, so a reload shows the skeleton fitting different numbers. */
export const WalletDemo = () => {
  // Drawn once per mount; only shown once loaded, so the server's draw never renders
  const [fresh] = useState<Portfolio>(() => ({
    holdings: randomHoldings(),
    // The day's change: within a few percent either way
    change: Math.random() * 10 - 4,
  }));
  const portfolio = useLoad(fresh, 900);

  return (
    <div className={styles.wide}>
      <SkeletonReveal
        data={portfolio}
        sample={SAMPLE}
        label="Loading portfolio"
      >
        {({ holdings, change }) => (
          <div className={styles.wallet}>
            <div className={styles.walletTotal}>
              <span className={styles.label}>Portfolio</span>
              {/* Wrapped: TextMorph passes no attributes on, and the e2e goldens mask what varies */}
              <span className={styles.walletValue} data-varies>
                <TextMorph duration={1000}>
                  {usd.format(total(holdings))}
                </TextMorph>
              </span>
              <span className={styles.delta} data-up={change >= 0} data-varies>
                <TextMorph>{`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}</TextMorph>
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
                  <span className={styles.holdingValue} data-varies>
                    <TextMorph>{usd.format(holding.value)}</TextMorph>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
