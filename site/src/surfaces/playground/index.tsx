"use client";

import {
  type CSSProperties,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  addStyles,
  debugging,
  forgetShapes,
  Ghost,
  Reveal,
  removeStyles,
  setDebug,
  type TextBottom,
  type TextTop,
} from "skullet";
import {
  bonesIn,
  CHECKS,
  GEOMETRY_CASES,
  verifyCoverage,
  type GeometryCase,
  type Result,
} from "@skullet/test-cases";

import styles from "./styles.module.scss";
import { DocsLayout } from "@/components/docs-layout";
import { Live } from "./live";
import { Lists } from "./lists";
import { GitHub, HackerNews, Met, Wikipedia } from "./sources";
import {
  Accessibility,
  Animations,
  Hints,
  Images,
  Resizing,
  RevealModes,
  ScopedThemes,
  Sources,
  States,
  Suspense,
} from "./features";

const SECTIONS = [
  ["reveal", "Reveal"],
  ["skeleton", "Skeleton"],
  ["live", "Live data"],
  ["geometry", "Geometry"],
  ["size", "Size"],
] as const;

const subscribe = () => () => {};

const DebugToggle = () => {
  // What the URL or storage turned on — off on the server, which has neither
  const initial = useSyncExternalStore(subscribe, debugging, () => false);
  const [toggled, setOn] = useState<boolean | null>(null);
  const on = toggled ?? initial;

  return (
    <button
      className={styles.debugToggle}
      data-active={on}
      onClick={() => {
        setDebug(!on);
        setOn(!on);
      }}
    >
      {on ? "Hide" : "Show"} debug overlay
    </button>
  );
};

const api = { Ghost, Reveal, forgetShapes };

type BundleSize = {
  name: string;
  raw: number;
  gzip: number;
  publishedRaw: number | null;
  publishedGzip: number | null;
};

const kb = (bytes: number | null) =>
  bytes === null ? "—" : `${(bytes / 1024).toFixed(2)} kB`;

type Results = [name: string, result: Result][];

const Row = ({
  title,
  description,
  info,
  children,
}: {
  title: string;
  description: React.ReactNode;
  info?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className={styles.row}>
    <div className={styles.info}>
      <h3>{title}</h3>
      <p>{description}</p>
      {info}
    </div>
    <div className={styles.visual}>{children}</div>
  </section>
);

const Case = ({ testCase }: { testCase: GeometryCase }) => {
  const content = useRef<HTMLDivElement>(null);
  const skeleton = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Results>([]);

  useLayoutEffect(() => {
    if (!content.current || !skeleton.current || !overlay.current) return;
    const width = `${testCase.width ?? 360}px`;

    content.current.style.width = width;
    content.current.innerHTML = testCase.html;

    // Every check but coverage needs a stage of its own, out of sight
    const scratch = document.body.appendChild(document.createElement("div"));
    scratch.style.cssText = "position: absolute; left: -10000px; top: 0";
    const next: Results = Object.entries(CHECKS)
      .filter(([name]) => name !== "coverage")
      .map(([name, check]) => [name, check(api, testCase, scratch)]);
    scratch.remove();

    // Coverage last: its stage is left drawn, so it doubles as the skeleton shown here
    next.unshift(["coverage", verifyCoverage(api, testCase, skeleton.current)]);

    overlay.current.style.width = width;
    overlay.current.innerHTML = testCase.html;
    // Bones live in a shadow root, which neither cloning nor page CSS reaches — redraw them plainly
    for (const bone of bonesIn(skeleton.current)) {
      const copy = document.createElement("div");
      copy.className = styles.overlayBone!;
      const { left, top, width, height, borderRadius } = (bone as HTMLElement)
        .style;
      Object.assign(copy.style, { left, top, width, height, borderRadius });
      overlay.current.append(copy);
    }

    // Checks measure the DOM, so their results can only render in a second pass
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(next);
  }, [testCase]);

  return (
    <Row
      title={testCase.label}
      description={testCase.description}
      info={
        <ul className={styles.checks}>
          {results.map(([name, result]) => (
            <li key={name} data-pass={result.pass} title={result.detail}>
              <span>{result.pass ? "✓" : "✗"}</span>
              <span>{name}</span>
              {!result.pass && <code>{result.detail}</code>}
            </li>
          ))}
        </ul>
      }
    >
      <div className={styles.stages}>
        <figure>
          <figcaption>Content</figcaption>
          <div ref={content} className={styles.stage} />
        </figure>
        <figure>
          <figcaption>Skeleton</figcaption>
          <div ref={skeleton} className={styles.stage} />
        </figure>
        <figure>
          <figcaption>Overlay</figcaption>
          <div ref={overlay} className={styles.stage} />
        </figure>
      </div>
    </Row>
  );
};

const TOPS: TextTop[] = ["ascender", "cap-height", "x-height"];
const BOTTOMS: TextBottom[] = ["baseline", "descender"];

const Choice = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className={styles.choice}>
    <span>{label}</span>
    {options.map((option) => (
      <button
        key={option}
        data-active={option === value}
        onClick={() => onChange(option)}
      >
        {option}
      </button>
    ))}
  </div>
);

export const Playground = ({ bundleSizes }: { bundleSizes: BundleSize[] }) => {
  const [top, setTop] = useState<TextTop>("ascender");
  const [bottom, setBottom] = useState<TextBottom>("descender");

  // Every check destroys what it built; this keeps the drawn skeletons styled after
  useLayoutEffect(() => {
    addStyles();
    return removeStyles;
  }, []);

  return (
    <DocsLayout sections={SECTIONS} wide>
      <div
        className={styles.playground}
        style={
          {
            "--skullet-text-top": top,
            "--skullet-text-bottom": bottom,
          } as CSSProperties
        }
      >
        <header className={styles.header}>
          <h1>Playground</h1>
          <DebugToggle />
          <p>
            Every feature of skullet, one at a time — how content reveals, where
            a skeleton comes from, how it looks — then live data, and the
            geometry corpus vitest runs in Chromium, run here against the built
            package.
          </p>
        </header>

        <h2 id="reveal" className={styles.heading}>
          <a href="#reveal">Reveal</a>
        </h2>
        <Row
          title="Reveal modes"
          description={
            <>
              The same feed under each <code>reveal</code>.{" "}
              <code>together</code> fades everything at once;{" "}
              <code>sequence</code> brings it in from the top, a row at a time;{" "}
              <code>smart</code>, the default, picks for the case — try a fast
              response, where it shows no skeleton at all, and a refetch, where
              it swaps quickly over the data on screen.
            </>
          }
        >
          <RevealModes />
        </Row>
        <Row
          title="Images"
          description={
            <>
              Images take their own time. A reveal holds for them so nothing
              pops in after the skeleton has gone — whole under{" "}
              <code>together</code>, one image at a time under{" "}
              <code>smart</code>.
            </>
          }
        >
          <Images />
        </Row>
        <Row
          title="Changing size"
          description={
            <>
              A reload draws its skeleton from the data on screen, so when the
              new data is a different size, the reveal can&apos;t help but
              change height. It eases there instead of snapping — a softer miss,
              and still logged as one.
            </>
          }
        >
          <Resizing />
        </Row>
        <Row
          title="Empty and error"
          description={
            <>
              <code>empty</code> and <code>error</code> panes crossfade in like
              content does, from the same skeleton.
            </>
          }
        >
          <States />
        </Row>
        <Row
          title="Load more"
          description={
            <>
              Two ways to grow a list. One reveal per page leaves shown rows
              alone and holds the next page&apos;s space with its skeleton, so
              nothing moves. One reveal for the whole list redraws every shown
              row as a skeleton, and the new rows can only arrive by pushing
              what&apos;s below. Load more on each and compare the logs, or turn
              on the debug overlay.
            </>
          }
        >
          <Lists />
        </Row>

        <Row
          title="Suspense"
          description={
            <>
              <code>SkeletonSuspense</code> is a Suspense boundary whose
              fallback is a measured skeleton. Give it a <code>skeleton</code>{" "}
              rendered from sample data, or only an <code>id</code> to draw what
              the content looked like last time.
            </>
          }
        >
          <Suspense />
        </Row>

        <h2 id="skeleton" className={styles.heading}>
          <a href="#skeleton">Skeleton</a>
        </h2>
        <Row
          title="Where it comes from"
          description={
            <>
              A skeleton is measured from content rendered unseen, and the
              closer that content is to the real thing, the less moves on
              reveal. On a first visit, or after forgetting shapes, a fresh
              reveal can only guess from <code>sample</code> — and moves. Once
              anything has shown, every column holds still.
            </>
          }
        >
          <Sources />
        </Row>
        <Row
          title="Author hints"
          description={
            <>
              Measuring gets most things right on its own. Where it
              doesn&apos;t, mark the markup: <code>skullet-block</code> draws an
              element as one block, <code>skullet-ignore</code> leaves it out.
            </>
          }
        >
          <Hints />
        </Row>
        <Row
          title="Animation"
          description={
            <>
              Set with <code>animation</code> and <code>speed</code> on the
              theme. <code>shimmer</code> sweeps one highlight across the whole
              page; <code>group-shimmer</code> gives each skeleton its own;{" "}
              <code>pulse</code> breathes. All keep one phase, and the sweep
              moves at the same pace on any screen.
            </>
          }
        >
          <Animations />
        </Row>
        <Row
          title="Scoped themes"
          description={
            <>
              Every theme option is a custom property, so any part of a page can
              set its own — with <code>themeVariables</code> as a style, or in
              your own CSS.
            </>
          }
        >
          <ScopedThemes />
        </Row>
        <Row
          title="Accessibility"
          description={
            <>
              While loading, the reveal is <code>aria-busy</code> and its
              skeleton is hidden from assistive tech and focus, with a{" "}
              <code>label</code> read in its place. Reduced motion stills the
              bones and makes every reveal instant.
            </>
          }
        >
          <Accessibility />
        </Row>

        <h2 id="live" className={styles.heading}>
          <a href="#live">Live data</a>
        </h2>
        <Row
          title="Aave markets"
          description={
            <>
              The largest reserves of each chain&apos;s Aave v3 market, fetched
              from Aave&apos;s public API. Switch chains, refetch over the data
              on screen, or forget remembered shapes to see a first visit. Every
              reveal is measured: the log shows what the skeleton was drawn from
              and whether anything moved.
            </>
          }
        >
          <Live />
        </Row>
        <Row
          title="Wikipedia"
          description={
            <>
              A random article each load: a picture of any shape or none, a
              description or none, one line of text or ten. Load another to see
              how a skeleton drawn from the last article copes with the next.
            </>
          }
        >
          <Wikipedia />
        </Row>
        <Row
          title="Hacker News"
          description={
            <>
              The front page, six stories at a time — titles from three words to
              two lines, with a site or without.
            </>
          }
        >
          <HackerNews />
        </Row>
        <Row
          title="The Met"
          description={
            <>
              Four artworks from a different search each load, out of the
              Met&apos;s open-access collection: titles from a word to several
              lines, an artist or none, a date or none, and some with no image
              at all.
            </>
          }
        >
          <Met />
        </Row>
        <Row
          title="GitHub issues"
          description={
            <>
              React&apos;s open issues, a page at a time — any number of
              coloured labels, titles of any length. Unauthenticated, so GitHub
              allows about sixty loads an hour.
            </>
          }
        >
          <GitHub />
        </Row>

        <h2 id="geometry" className={styles.heading}>
          <a href="#geometry">Geometry</a>
        </h2>
        <Row
          title="Text bars"
          description={
            <>
              Where each bar runs, in the type&apos;s own lines — set with{" "}
              <code>--skullet-text-top</code> and{" "}
              <code>--skullet-text-bottom</code>, or <code>text</code> on the
              provider. Every case below re-measures as you change them.
            </>
          }
        >
          <div className={styles.choices}>
            <Choice label="Top" options={TOPS} value={top} onChange={setTop} />
            <Choice
              label="Bottom"
              options={BOTTOMS}
              value={bottom}
              onChange={setBottom}
            />
          </div>
        </Row>
        {GEOMETRY_CASES.map((testCase) => (
          // Keyed by the rules, so a change measures every case again
          <Case
            key={`${testCase.label}:${top}:${bottom}`}
            testCase={testCase}
          />
        ))}

        {bundleSizes.length > 0 && (
          <>
            <h2 id="size" className={styles.heading}>
              <a href="#size">Size</a>
            </h2>
            <Row
              title="Bundle sizes"
              description="Gzipped, against the version on npm."
            >
              <table className={styles.sizes}>
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th>gzip</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {bundleSizes.map((size) => (
                    <tr key={size.name}>
                      <td>{size.name}</td>
                      <td>{kb(size.gzip)}</td>
                      <td>{kb(size.publishedGzip)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Row>
          </>
        )}
      </div>
    </DocsLayout>
  );
};
