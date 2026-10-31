import { Skeleton } from "skullet/react";

import styles from "./preview-page.module.scss";
import { Avatar } from "@/components/avatar";
import { Mascot } from "@/components/mascot";

export const REGIONS = [
  "topbar",
  "sidebar",
  "header",
  "stats",
  "chart",
  "activity",
] as const;

export type Region = (typeof REGIONS)[number];

// When each region's data lands after a reload, as a page's requests would
export const ARRIVALS: Record<Region, number> = {
  topbar: 200,
  sidebar: 280,
  header: 380,
  stats: 520,
  chart: 700,
  activity: 820,
};

const NAV = ["Overview", "Payments", "Customers", "Reports", "Settings"];
const STATS = [
  { label: "Revenue", value: "$48,210", delta: "+12.4%" },
  { label: "Customers", value: "2,314", delta: "+3.1%" },
];
const BARS = [42, 58, 51, 66, 73, 61, 80, 77, 88, 70, 92, 85];
const ACTIVITY = [
  { who: "Alex Vanderzon", what: "paid invoice #2041", when: "2m" },
  { who: "Jack Skellington", what: "upgraded to Team", when: "18m" },
  { who: "Pugson", what: "requested a refund", when: "1h" },
  { who: "Jack Skellington", what: "added a payment method", when: "3h" },
  { who: "Alex Vanderzon", what: "paid invoice #2038", when: "5h" },
];

/** A dashboard of the kinds of things a skeleton has to stand in for. */
export const PreviewPage = ({
  loading,
}: {
  loading: (region: Region) => boolean;
}) => (
  <div className={styles.page}>
    <Skeleton loading={loading("topbar")}>
      <header className={styles.topbar}>
        <span className={styles.logo}>
          <Mascot size={24} />
        </span>
        <span className={styles.search}>Search…</span>
        <Avatar name="Lochie Axon" size={18} />
      </header>
    </Skeleton>

    <div className={styles.body}>
      <Skeleton loading={loading("sidebar")}>
        <aside className={styles.sidebar}>
          {NAV.map((item) => (
            <span key={item}>
              <i />
              {item}
            </span>
          ))}
        </aside>
      </Skeleton>

      <main className={styles.main}>
        <Skeleton loading={loading("header")}>
          <div className={styles.heading}>
            <div>
              <h2>Good morning</h2>
              <p>Here’s what happened with your business this week.</p>
            </div>
            <span className={styles.button}>New invoice</span>
          </div>
        </Skeleton>

        <div className={styles.columns}>
          <Skeleton loading={loading("stats")}>
            <div className={styles.stats}>
              {STATS.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <em data-up={!stat.delta.startsWith("-")}>{stat.delta}</em>
                </div>
              ))}
            </div>
          </Skeleton>

          <section className={styles.card}>
            <Skeleton loading={loading("chart")}>
              <h3>Revenue</h3>
              <p>Last 12 weeks</p>
              <div className={styles.chart}>
                {BARS.map((height, i) => (
                  // Not a span: an empty text tag gets filler to measure, which would widen it
                  <div key={i} style={{ height: `${height}%` }} />
                ))}
              </div>
            </Skeleton>
          </section>
        </div>

        <Skeleton loading={loading("activity")}>
          <section className={styles.card}>
            <h3>Activity</h3>
            <ul className={styles.activity}>
              {ACTIVITY.map((item) => (
                <li key={item.who + item.when}>
                  <Avatar name={item.who} size={18} />
                  <span className={styles.line}>
                    <b>{item.who.split(" ")[0]}</b> {item.what}
                  </span>
                  <time>{item.when}</time>
                </li>
              ))}
            </ul>
          </section>
        </Skeleton>
      </main>
    </div>
  </div>
);
