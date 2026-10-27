import { useLayoutEffect, useRef, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";

type Row = { id: number; name: string; amount: string; when: string };

const PAGE = 4;
const NAMES = [
  "Coffee",
  "Groceries",
  "Train fare",
  "Bookshop",
  "Lunch",
  "Cinema",
  "Gym",
  "Rent",
  "Flowers",
  "Taxi",
  "Bakery",
  "Records",
];

const page = (index: number): Row[] =>
  Array.from({ length: PAGE }, (_, i) => {
    const id = index * PAGE + i;
    return {
      id,
      name: NAMES[id % NAMES.length]!,
      amount: `$${((id * 37) % 90) + 4}.${String((id * 13) % 100).padStart(2, "0")}`,
      when: `${(id % 9) + 1}h ago`,
    };
  });

const SAMPLE = page(0);

const fetchPage = (index: number) =>
  new Promise<Row[]>((resolve) => setTimeout(() => resolve(page(index)), 1200));

const Rows = ({ rows }: { rows: Row[] }) => (
  <ul className={styles.rows}>
    {rows.map((row) => (
      <li key={row.id}>
        <span className={styles.rowName}>{row.name}</span>
        <span>{row.when}</span>
        <span className={styles.rowAmount}>{row.amount}</span>
      </li>
    ))}
  </ul>
);

// Whether the list's existing rows moved when the new ones arrived
function useMovement(loading: boolean) {
  const frame = useRef<HTMLDivElement>(null);
  const before = useRef<number | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useLayoutEffect(() => {
    const height = frame.current?.offsetHeight ?? 0;
    if (loading) {
      before.current = height;
      return;
    }
    if (before.current === null) return;
    const moved = height - before.current;
    before.current = null;
    // Measurement only — the log is what this effect exists to render
    setLog((entries) =>
      [moved ? `moved ${moved}px` : "no movement", ...entries].slice(0, 3),
    );
  }, [loading]);

  return { frame, log };
}

const Log = ({ log }: { log: string[] }) => (
  <div className={styles.listLog}>
    {log.length ? (
      log.map((entry, i) => (
        <span key={i} data-jump={entry !== "no movement"}>
          {entry}
        </span>
      ))
    ) : (
      <span>Load more to compare</span>
    )}
  </div>
);

/** One reveal per page: shown rows are never redrawn, and the next page's skeleton holds its own space. */
const PerPage = () => {
  const [pages, setPages] = useState<(Row[] | null)[]>([page(0)]);
  const loading = pages.at(-1) === null;
  const { frame, log } = useMovement(loading);

  const more = () => {
    const index = pages.length;
    setPages((current) => [...current, null]);
    fetchPage(index).then((rows) =>
      setPages((current) => current.map((p, i) => (i === index ? rows : p))),
    );
  };

  return (
    <div className={styles.listColumn}>
      <h4>One reveal per page</h4>
      <div ref={frame} className={styles.listFrame}>
        {pages.map((rows, i) => (
          <SkeletonReveal key={i} data={rows} sample={SAMPLE}>
            {(rows) => <Rows rows={rows} />}
          </SkeletonReveal>
        ))}
      </div>
      <button onClick={more} disabled={loading}>
        Load more
      </button>
      <Log log={log} />
    </div>
  );
};

/** One reveal for the whole list: the skeleton is the list on screen, so new rows can only arrive by pushing. */
const Whole = () => {
  const [rows, setRows] = useState<Row[]>(page(0));
  const [loading, setLoading] = useState(false);
  const { frame, log } = useMovement(loading);

  const more = () => {
    setLoading(true);
    fetchPage(rows.length / PAGE).then((next) => {
      setRows((current) => [...current, ...next]);
      setLoading(false);
    });
  };

  return (
    <div className={styles.listColumn}>
      <h4>One reveal for the whole list</h4>
      <div ref={frame} className={styles.listFrame}>
        <SkeletonReveal data={rows} loading={loading}>
          {(rows) => <Rows rows={rows} />}
        </SkeletonReveal>
      </div>
      <button onClick={more} disabled={loading}>
        Load more
      </button>
      <Log log={log} />
    </div>
  );
};

export const Lists = () => (
  <div className={styles.lists}>
    <PerPage />
    <Whole />
  </div>
);
