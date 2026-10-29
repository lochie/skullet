import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { forgetShapes } from "skullet";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import { CHAINS, fetchReserves, SAMPLE, type Reserve } from "./aave";

const usd = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(2)}%`;

type Reveal = {
  chain: string;
  source: string;
  width: number;
  height: number;
};

const Reserves = ({ reserves }: { reserves: Reserve[] }) => (
  <div className={styles.reserves}>
    <div className={styles.reserveHead}>
      <span />
      <span>Asset</span>
      <span>Size</span>
      <span>Supply</span>
      <span>Borrow</span>
    </div>
    {reserves.map((reserve, i) => (
      <div key={`${reserve.symbol}-${i}`} className={styles.reserve}>
        <img src={reserve.icon || undefined} alt="" width={24} height={24} />
        <div className={styles.asset}>
          <span className={styles.symbol}>{reserve.symbol}</span>
          <span className={styles.assetName}>{reserve.name}</span>
        </div>
        <span>{usd.format(reserve.size)}</span>
        <span>{percent(reserve.supply)}</span>
        <span>{percent(reserve.borrow)}</span>
      </div>
    ))}
  </div>
);

export const Live = () => {
  const [chain, setChain] = useState<number>(CHAINS[0].id);
  const [reserves, setReserves] = useState<Reserve[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const requests = useRef(0);

  const request = useCallback((chainId: number) => {
    const id = ++requests.current;
    fetchReserves(chainId)
      .then((next) => {
        if (id === requests.current) setReserves(next);
      })
      .catch((reason: Error) => {
        if (id === requests.current) setError(reason.message);
      })
      .finally(() => {
        if (id === requests.current) setFetching(false);
      });
  }, []);

  const load = (chainId: number, keep: boolean) => {
    setChain(chainId);
    if (!keep) setReserves(null);
    setFetching(true);
    setError(null);
    request(chainId);
  };

  // The first chain's; switching and refetching start their own from the click
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => request(chain), []);

  // Sizes the skeleton as drawn, then the content that replaced it — any difference is a jump
  const frame = useRef<HTMLDivElement>(null);
  const skeleton = useRef<Omit<Reveal, "chain"> | null>(null);
  const shown = useRef<number | null>(null);
  // Not only while fetching: before the first fetch starts, there is nothing to show either
  const loading = fetching || (!reserves && !error);
  const name = CHAINS.find((c) => c.id === chain)!.name;

  useLayoutEffect(() => {
    const reveal =
      frame.current?.querySelector<HTMLElement>("[skullet-reveal]");
    if (!reveal) return;

    if (loading) {
      const recalled = reveal.querySelector(
        "[skullet-snapshot]:not([skullet-inactive]) *",
      );
      const source = reserves
        ? "data on screen"
        : shown.current === chain
          ? "last data"
          : recalled
            ? "remembered shape"
            : "sample";
      skeleton.current = {
        source,
        width: reveal.offsetWidth,
        height: reveal.offsetHeight,
      };
      return;
    }

    shown.current = chain;
    if (!skeleton.current) return;
    const before = skeleton.current;
    skeleton.current = null;
    // Measurement only — the jump log is what this effect exists to render
    setReveals((log) =>
      [
        {
          chain: name,
          source: before.source,
          width: reveal.offsetWidth - before.width,
          height: reveal.offsetHeight - before.height,
        },
        ...log,
      ].slice(0, 6),
    );
  }, [loading, chain, name, reserves]);

  return (
    <Demo
      controls={
        <>
          <SegmentedControl
            label="Chain"
            options={CHAINS.map((c) => c.id)}
            value={chain}
            onChange={(id) => load(id, false)}
            format={(id) => CHAINS.find((c) => c.id === id)?.name}
          />
          <div className={styles.actions}>
            <button onClick={() => load(chain, true)} disabled={loading}>
              Refetch, keeping data
            </button>
            <button onClick={() => forgetShapes()}>Forget shapes</button>
          </div>
        </>
      }
    >
      <div ref={frame} className={styles.liveFrame}>
        <SkeletonReveal
          id={`aave-${chain}`}
          data={reserves}
          sample={SAMPLE}
          loading={loading}
          error={
            error && (
              <div className={styles.error}>
                Couldn’t reach Aave: {error}
                <button onClick={() => load(chain, false)}>Retry</button>
              </div>
            )
          }
        >
          {(reserves) => <Reserves reserves={reserves} />}
        </SkeletonReveal>
      </div>

      <div className={styles.log}>
        {reveals.length ? (
          reveals.map((reveal, i) => (
            <div key={i} data-jump={reveal.width !== 0 || reveal.height !== 0}>
              <span>{reveal.chain}</span>
              <span>{reveal.source}</span>
              <span>
                {reveal.width === 0 && reveal.height === 0
                  ? "no movement"
                  : `moved ${reveal.width} × ${reveal.height}px`}
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
};
