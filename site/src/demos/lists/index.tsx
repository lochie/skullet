import { useRef, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";

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

/** One reveal per page: shown rows are never redrawn, and the next page's skeleton holds its own space. */
function usePerPage() {
  const [pages, setPages] = useState<(Row[] | null)[]>([page(0)]);
  const loading = pages.at(-1) === null;
  // A second click can land before the render that disables the first
  const busy = useRef(false);

  const more = () => {
    if (busy.current) return;
    busy.current = true;
    const index = pages.length;
    setPages((current) => [...current, null]);
    fetchPage(index).then((rows) => {
      busy.current = false;
      setPages((current) => current.map((p, i) => (i === index ? rows : p)));
    });
  };

  const view = (
    <div className={styles.listFrame}>
      {pages.map((rows, i) => (
        <SkeletonReveal key={i} data={rows} sample={SAMPLE}>
          {(rows) => <Rows rows={rows} />}
        </SkeletonReveal>
      ))}
    </div>
  );
  return { view, more, loading };
}

/** One reveal for the whole list: the skeleton is the list on screen, so new rows can only arrive by pushing. */
function useWhole() {
  const [rows, setRows] = useState<Row[]>(page(0));
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const more = () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    fetchPage(rows.length / PAGE).then((next) => {
      busy.current = false;
      setRows((current) => [...current, ...next]);
      setLoading(false);
    });
  };

  const view = (
    <div className={styles.listFrame}>
      <SkeletonReveal data={rows} loading={loading}>
        {(rows) => <Rows rows={rows} />}
      </SkeletonReveal>
    </div>
  );
  return { view, more, loading };
}

const KINDS = ["page", "list"] as const;

const KIND_LABELS = {
  page: "One reveal per page",
  list: "One for the whole list",
};

export const ListsDemo = () => {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("page");
  const perPage = usePerPage();
  const whole = useWhole();
  const list = kind === "page" ? perPage : whole;

  return (
    <Demo
      onClick={list.more}
      disabled={list.loading}
      hint="Click to load more"
      controls={
        <SegmentedControl
          label="Reveals"
          options={KINDS}
          value={kind}
          onChange={setKind}
          format={(option) => KIND_LABELS[option]}
        />
      }
    >
      {list.view}
    </Demo>
  );
};
