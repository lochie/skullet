"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Mascot } from "@/components/mascot";

type State = {
  scanning: boolean;
  xray: boolean;
  beamDone: boolean;
  guides: "in" | "out" | null;
  revealed: boolean;
  returning: boolean;
  happy: boolean;
};

const REST: State = {
  scanning: false,
  xray: false,
  beamDone: false,
  guides: null,
  revealed: true,
  returning: false,
  happy: false,
};

// A whole number of the mascot's 4s float and 1.6s tail, so the loop has no seam
const LOOP = 8000;
const SCAN = 1900;

const STEPS: [number, Partial<State>][] = [
  [700, { scanning: true, revealed: false }],
  [2700, { beamDone: true }],
  [2800, { xray: true }],
  [3500, { xray: false, guides: "in" }],
  [4500, { revealed: true, happy: true }],
  [5500, { happy: false }],
  [5700, { guides: "out" }],
  [6000, { returning: true }],
];

const EASE = (t: number) => t * t * (3 - 2 * t);

// The beam's trail, on eased stops so it fades without a band
const TRAIL = `linear-gradient(to bottom, ${Array.from(
  { length: 9 },
  (_, i) => {
    const t = i / 8;
    return `rgb(255 60 120 / ${(EASE(t) * 0.28).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
  },
).join(", ")})`;

export const Concept = () => {
  const [state, setState] = useState(REST);
  const [cycle, setCycle] = useState(-1);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = () => setCycle(0);
    // The recorder starts it once it's capturing; opened by hand, it plays at once
    if (new URLSearchParams(location.search).has("wait")) {
      Object.assign(window, { promoStart: start });
    } else start();
  }, []);

  useEffect(() => {
    if (cycle < 0) return;
    // The recorder takes the second loop, once every animation has run one full cycle
    if (cycle === 2) Object.assign(window, { promoDone: true });
    stage.current?.style.setProperty("--scan", "0");
    stage.current?.style.setProperty("--ride", "0");
    const timers = STEPS.map(([at, patch]) =>
      setTimeout(() => setState((state) => ({ ...state, ...patch })), at),
    );
    timers.push(
      setTimeout(() => {
        setState(REST);
        setCycle(cycle + 1);
      }, LOOP),
    );
    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  // The mascot follows the pointer, so a pointer kept on the most important thing on stage steers its eyes
  useEffect(() => {
    let frame = 0;
    const gaze = () => {
      const targets = [
        ...(stage.current?.querySelectorAll<HTMLElement>("[data-gaze]") ?? []),
      ];
      const target = targets.sort(
        (a, b) => Number(b.dataset.gaze) - Number(a.dataset.gaze),
      )[0];
      if (target) {
        const rect = target.getBoundingClientRect();
        dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        );
      }
      frame = requestAnimationFrame(gaze);
    };
    frame = requestAnimationFrame(gaze);
    return () => cancelAnimationFrame(frame);
  }, []);

  // The beam's depth into the card, 0 to 1, written straight to the stage so a sweep re-renders nothing
  useEffect(() => {
    if (!state.scanning) return;
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min((performance.now() - start) / SCAN, 1);
      stage.current?.style.setProperty("--scan", String(EASE(t)));
      stage.current?.style.setProperty("--ride", String(EASE(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.scanning]);

  useEffect(() => {
    if (state.returning) stage.current?.style.setProperty("--ride", "0");
  }, [state.returning]);

  return (
    <div
      ref={stage}
      className={styles.stage}
      data-xray={state.xray || undefined}
    >
      {cycle >= 0 && (
        <>
          <Scanner
            scanning={state.scanning}
            beamDone={state.beamDone}
            revealed={state.revealed}
            guides={state.guides}
          />
          <div
            className={styles.host}
            data-returning={state.returning || undefined}
          >
            <div className={styles.mood} data-happy={state.happy || undefined}>
              <Mascot size={112} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Card = () => (
  <article className={styles.card}>
    <header className={styles.byline} data-guide>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatars/pugson.jpg" alt="" width={40} height={40} />
      <div className={styles.who}>
        <span className={styles.name}>Pugson</span>
        <span className={styles.when}>2 hours ago</span>
      </div>
    </header>
    <h2 data-guide>A long weekend in the mountains, mostly uphill</h2>
    <p data-guide>Two days, three trails, one very tired dog.</p>
    <Art />
    <span className={styles.button} data-guide>
      Read the whole story
    </span>
  </article>
);

const Art = () => {
  // Two copies of the card are on stage at once, and a gradient's id must be unique to resolve
  const sky = useId();
  return (
    <svg
      className={styles.art}
      viewBox="0 0 400 160"
      height={120}
      preserveAspectRatio="xMidYMid slice"
      data-guide
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#ff5e62" />
        </linearGradient>
      </defs>
      <rect width="400" height="160" fill={`url(#${sky})`} />
      <circle cx="290" cy="78" r="30" fill="#fff3c4" />
      <path
        d="M0 120 L90 60 L170 115 L250 70 L400 130 V160 H0 Z"
        fill="#7a2848"
      />
      <path
        d="M0 145 L120 100 L230 140 L330 110 L400 140 V160 H0 Z"
        fill="#3d1530"
      />
    </svg>
  );
};

/** The card twice, exactly aligned: the real skeleton above the beam, the content below it. */
const Scanner = ({
  scanning,
  beamDone,
  revealed,
  guides,
}: {
  scanning: boolean;
  beamDone: boolean;
  revealed: boolean;
  guides: State["guides"];
}) => {
  const bones = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<number[]>([]);

  useLayoutEffect(() => {
    const el = bones.current;
    el?.parentElement?.parentElement?.style.setProperty(
      "--card-h",
      `${el.offsetHeight}px`,
    );
  }, []);

  // The card's edges, measured once: content and skeleton share every one of them
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const el = bones.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const found = new Set<number>();
      el.querySelectorAll("[data-guide]").forEach((guide) => {
        const rect = guide.getBoundingClientRect();
        found.add(Math.round(rect.top - top));
        found.add(Math.round(rect.bottom - top));
      });
      setEdges([...found].sort((a, b) => a - b));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.scanner} data-gaze={1}>
      <div
        ref={bones}
        className={styles.bones}
        data-revealed={revealed || undefined}
      >
        <Skeleton loading={!revealed}>
          <Card />
        </Skeleton>
      </div>
      {!revealed && (
        <div className={styles.content} aria-hidden>
          <Card />
        </div>
      )}
      {scanning && !revealed && (
        <div
          className={styles.beam}
          data-done={beamDone || undefined}
          style={{ backgroundImage: TRAIL }}
        >
          <span className={styles.ray} data-gaze={2} />
        </div>
      )}
      {guides &&
        edges.map((y, i) => (
          <span
            key={y}
            className={styles.guide}
            data-out={guides === "out" || undefined}
            style={{ top: y, animationDelay: `${i * 40}ms` }}
          />
        ))}
    </div>
  );
};
