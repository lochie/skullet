import { SkeletonReveal } from "skele/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";

type Stat = { label: string; value: string; delta: string; up: boolean };

const STATS: Stat[] = [
  { label: "Visitors", value: "12,480", delta: "+12%", up: true },
  { label: "Signups", value: "1,204", delta: "+4%", up: true },
  { label: "Churn", value: "2.1%", delta: "-0.3%", up: false },
  { label: "Revenue", value: "$9.6k", delta: "+18%", up: true },
];

// Each tile loads on its own; they join one shimmer however late each mounts
const Tile = ({ stat, delay }: { stat: Stat; delay: number }) => {
  const [data] = useLoad(stat, delay);

  return (
    <SkeletonReveal data={data} sample={stat}>
      {(stat) => (
        <div className={styles.tile}>
          <span className={styles.label}>{stat.label}</span>
          <span className={styles.value}>{stat.value}</span>
          <span className={styles.delta} data-up={stat.up}>
            {stat.delta}
          </span>
        </div>
      )}
    </SkeletonReveal>
  );
};

export const StatsDemo = () => {
  return (
    <div className={styles.frame}>
      <div className={styles.tiles}>
        {STATS.map((stat, i) => (
          <Tile key={stat.label} stat={stat} delay={500 + i * 250} />
        ))}
      </div>
    </div>
  );
};
