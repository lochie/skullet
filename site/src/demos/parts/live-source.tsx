import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { forgetShapes } from "skullet";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { Button } from ".";

type Logged = { source: string; width: number; height: number };

/** One live API behind a reveal, its log saying what each skeleton was drawn from and whether it moved. */
export function LiveSource<T>({
  id,
  load,
  sample,
  children,
}: {
  id: string;
  load: (round: number) => Promise<T>;
  sample: T;
  children: (data: T) => React.JSX.Element;
}) {
  const [round, setRound] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Logged[]>([]);
  const requests = useRef(0);

  const request = useCallback(
    (next: number) => {
      const request = ++requests.current;
      load(next)
        .then((value) => {
          if (request === requests.current) setData(value);
        })
        .catch((reason: Error) => {
          if (request === requests.current) setError(reason.message);
        })
        .finally(() => {
          if (request === requests.current) setFetching(false);
        });
    },
    [load],
  );

  const start = (next: number, keep: boolean) => {
    setRound(next);
    if (!keep) setData(null);
    setFetching(true);
    setError(null);
    request(next);
  };

  // The first load; later ones start from the click
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => request(0), []);

  // Sizes the skeleton as drawn, then the content that replaced it — any difference is a jump
  const frame = useRef<HTMLDivElement>(null);
  const skeleton = useRef<Logged | null>(null);
  const shown = useRef(false);
  const loading = fetching || (!data && !error);

  useLayoutEffect(() => {
    const reveal =
      frame.current?.querySelector<HTMLElement>("[skullet-reveal]");
    if (!reveal) return;

    if (loading) {
      const recalled = reveal.querySelector(
        "[skullet-snapshot]:not([skullet-inactive]) *",
      );
      skeleton.current = {
        source: data
          ? "data on screen"
          : shown.current
            ? "last data"
            : recalled
              ? "remembered shape"
              : "sample",
        width: reveal.offsetWidth,
        height: reveal.offsetHeight,
      };
      return;
    }

    shown.current = true;
    if (!skeleton.current) return;
    const before = skeleton.current;
    skeleton.current = null;
    // Measurement only — the log is what this effect exists to render
    setLog((entries) =>
      [
        {
          source: before.source,
          width: reveal.offsetWidth - before.width,
          height: reveal.offsetHeight - before.height,
        },
        ...entries,
      ].slice(0, 4),
    );
  }, [loading, data]);

  return (
    <Demo
      hint="Click to load another"
      onClick={() => start(round + 1, false)}
      disabled={loading}
      controls={
        <>
          <Button onClick={() => start(round, true)} disabled={loading}>
            Refetch, keeping data
          </Button>
          <Button onClick={() => forgetShapes()}>Forget shapes</Button>
        </>
      }
    >
      <div ref={frame} className={styles.liveFrame}>
        <Skeleton
          id={id}
          data={data}
          sample={sample}
          loading={loading}
          error={
            error && (
              <div className={styles.error}>
                Couldn’t load: {error}
                <button onClick={() => start(round, false)}>Retry</button>
              </div>
            )
          }
        >
          {children}
        </Skeleton>
      </div>

      <div className={styles.sourceLog}>
        {log.length ? (
          log.map((entry, i) => (
            <div key={i} data-jump={entry.width !== 0 || entry.height !== 0}>
              <span>{entry.source}</span>
              <span>
                {entry.width === 0 && entry.height === 0
                  ? "no movement"
                  : `moved ${entry.width} × ${entry.height}px`}
              </span>
            </div>
          ))
        ) : (
          <div>
            <span>Waiting for the first reveal…</span>
          </div>
        )}
      </div>
    </Demo>
  );
}

export const json = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${response.status} from ${new URL(url).host}`);
  return response.json() as Promise<T>;
};
