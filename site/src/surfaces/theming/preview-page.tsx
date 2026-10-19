import { SkeletonReveal } from "skele/react";

import styles from "./preview-page.module.scss";

export const REGIONS = [
  "topbar",
  "sidebar",
  "header",
  "stats",
  "chart",
  "activity",
  "article",
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
  article: 1000,
};

const NAV = ["Overview", "Payments", "Customers", "Reports", "Settings"];
const STATS = [
  { label: "Revenue", value: "$48,210", delta: "+12.4%" },
  { label: "Customers", value: "2,314", delta: "+3.1%" },
  { label: "Refunds", value: "$1,092", delta: "-0.8%" },
  { label: "Churn", value: "1.9%", delta: "-0.2%" },
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
    <SkeletonReveal loading={loading("topbar")}>
      <header className={styles.topbar}>
        <span className={styles.logo}>Ledger</span>
        <nav>
          <span>Dashboard</span>
          <span>Docs</span>
          <span>Support</span>
        </nav>
        <span className={styles.search}>Search…</span>
        <span className={styles.avatar}>LA</span>
      </header>
    </SkeletonReveal>

    <div className={styles.body}>
      <SkeletonReveal loading={loading("sidebar")}>
        <aside className={styles.sidebar}>
          {NAV.map((item, i) => (
            <span key={item} data-active={i === 0}>
              <i />
              {item}
            </span>
          ))}
        </aside>
      </SkeletonReveal>

      <main className={styles.main}>
        <SkeletonReveal loading={loading("header")}>
          <div className={styles.heading}>
            <div>
              <h2>Good morning, Lochie</h2>
              <p>Here&apos;s what happened with your business this week.</p>
            </div>
            <span className={styles.button}>New invoice</span>
          </div>
        </SkeletonReveal>

        <SkeletonReveal loading={loading("stats")}>
          <div className={styles.stats}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <em data-up={!stat.delta.startsWith("-")}>{stat.delta}</em>
              </div>
            ))}
          </div>
        </SkeletonReveal>

        <div className={styles.columns}>
          <SkeletonReveal loading={loading("chart")}>
            <section className={styles.card}>
              <h3>Revenue</h3>
              <p>Last 12 weeks</p>
              <div className={styles.chart}>
                {BARS.map((height, i) => (
                  <span key={i} style={{ height: `${height}%` }} />
                ))}
              </div>
            </section>
          </SkeletonReveal>

          <SkeletonReveal loading={loading("activity")}>
            <section className={styles.card}>
              <h3>Activity</h3>
              <ul className={styles.activity}>
                {ACTIVITY.map((item) => (
                  <li key={item.who}>
                    <span className={styles.initials}>
                      {item.who
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className={styles.line}>
                      <b>{item.who}</b> {item.what}
                    </span>
                    <time>{item.when}</time>
                  </li>
                ))}
              </ul>
            </section>
          </SkeletonReveal>
        </div>

        <SkeletonReveal loading={loading("article")}>
          <article className={styles.article}>
            <div className={styles.cover} />
            <div>
              <h3>Closing the books faster</h3>
              <p>
                Reconciling a month of payments shouldn&apos;t take a week. Here
                is how teams on Ledger close in a day — matching payouts as they
                land, and flagging only what needs a person.
              </p>
              <span className={styles.meta}>Guides · 6 min read</span>
            </div>
          </article>
        </SkeletonReveal>
      </main>
    </div>
  </div>
);
