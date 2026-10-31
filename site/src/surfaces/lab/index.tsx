"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import {
  addStyles,
  forgetShapes,
  Ghost,
  Reveal,
  removeStyles,
  type TextBottom,
  type TextTop,
} from "skullet/internal";
import {
  bonesIn,
  CHECKS,
  GEOMETRY_CASES,
  verifyCoverage,
  type GeometryCase,
  type Result,
} from "@skullet/test-cases";

import styles from "./styles.module.scss";
import { Callout } from "@/components/callout";
import { Demo } from "@/components/demo";
import { DocsLayout } from "@/components/docs-layout";
import { Section } from "@/components/section";
import { SegmentedControl } from "@/components/segmented-control";
import { DebugToggle } from "./parts";
import { GitHubDemo } from "@/demos/github";
import { HackerNewsDemo } from "@/demos/hacker-news";
import { MetDemo } from "@/demos/met";
import { WikipediaDemo } from "@/demos/wikipedia";
import { AccessibilityDemo } from "@/demos/accessibility";
import { HintsDemo } from "@/demos/hints";
import { ScopedThemesDemo } from "@/demos/scoped-themes";
import { SkeletonSourcesDemo } from "@/demos/skeleton-sources";
import { StatesDemo } from "@/demos/states";

const api = { Ghost, Reveal, forgetShapes };

const SECTIONS = [
  ["states", "Empty and error"],
  ["sources", "Skeleton sources"],
  ["hints", "Hints"],
  ["scoped", "Scoped themes"],
  ["accessibility", "Accessibility"],
  ["hacker-news", "Live: Hacker News"],
  ["met", "Live: The Met"],
  ["github", "Live: GitHub"],
  ["wikipedia", "Live: Wikipedia"],
  ["geometry", "Geometry"],
  ["size", "Bundle sizes"],
] as const;

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
    <div className={styles.case}>
      <h3>{testCase.label}</h3>
      <p>{testCase.description}</p>
      <Demo
        controls={
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
        <div className={styles.stages} data-specimen>
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
      </Demo>
    </div>
  );
};

const TOPS: TextTop[] = ["ascender", "cap-height", "x-height"];
const BOTTOMS: TextBottom[] = ["baseline", "descender"];

/** The test bench: what the docs leave out, and the geometry corpus vitest runs, against the built package. */
export const Lab = ({
  bundleSizes,
  downloads,
}: {
  bundleSizes: BundleSize[];
  downloads?: number;
}) => {
  const [top, setTop] = useState<TextTop>("ascender");
  const [bottom, setBottom] = useState<TextBottom>("descender");

  // Every check destroys what it built; this keeps the drawn skeletons styled after
  useLayoutEffect(() => {
    addStyles();
    return removeStyles;
  }, []);

  return (
    <DocsLayout
      aside
      // Bundle sizes only exist once a build has measured them
      sections={SECTIONS.filter(([id]) => id !== "size" || bundleSizes.length)}
      downloads={downloads}
    >
      <header className={styles.header}>
        <h1>Lab</h1>
        <p>
          The test bench: demos the docs leave out, and the geometry corpus
          vitest runs, here against the built package.
        </p>
        <DebugToggle />
      </header>

      <Section id="states" title="Empty and error">
        <p>
          <code>empty</code> and <code>error</code> panes crossfade in the way
          content does, from the same skeleton.
        </p>
        <StatesDemo />
      </Section>

      <Section id="sources" title="Skeleton sources">
        <p>
          The closer the measured content is to the real thing, the less moves
          on reveal. A fresh reveal on a first visit can only guess from{" "}
          <code>sample</code>, and moves. Once anything has shown, every source
          holds still.
        </p>
        <SkeletonSourcesDemo />
      </Section>

      <Section id="hints" title="Hints">
        <p>
          Measuring gets most markup right. Where it doesn’t,{" "}
          <code>skullet-block</code> draws an element as one block and{" "}
          <code>skullet-ignore</code> leaves it out.
        </p>
        <HintsDemo />
      </Section>

      <Section id="scoped" title="Scoped themes">
        <p>
          Every theme option is a custom property, so any part of a page can set
          its own, with <code>themeVariables</code> as a style or in plain CSS.
        </p>
        <ScopedThemesDemo />
      </Section>

      <Section id="accessibility" title="Accessibility">
        <p>
          While loading, the reveal is <code>aria-busy</code> and its skeleton
          is hidden from assistive tech and focus, with a <code>label</code>{" "}
          read in its place.
        </p>
        <AccessibilityDemo />
      </Section>

      <Section id="hacker-news" title="Live: Hacker News">
        <p>
          The front page, six stories at a time: titles from three words to two
          lines, with a site or without.
        </p>
        <HackerNewsDemo />
      </Section>

      <Section id="met" title="Live: The Met">
        <p>
          Four artworks from a new search each load, out of the Met’s
          open-access collection. Titles run from a word to several lines, and
          some have no artist, date or image.
        </p>
        <MetDemo />
      </Section>

      <Section id="github" title="Live: GitHub">
        <p>
          React’s open issues, a page at a time, with any number of labels and
          titles of any length.
        </p>
        <GitHubDemo />
        <Callout>
          <p>
            These requests are unauthenticated, so GitHub allows about 60 loads
            an hour.
          </p>
        </Callout>
      </Section>

      <Section id="wikipedia" title="Live: Wikipedia">
        <p>
          A random article each load. Each skeleton is drawn from the last
          article, the hardest case for a remembered shape.
        </p>
        <WikipediaDemo />
      </Section>

      <Section id="geometry" title="Geometry">
        <p>
          Every case in the corpus, measured live. Each line of text is drawn
          between two of the font’s own lines, set with{" "}
          <code>--skullet-text-top</code> and <code>--skullet-text-bottom</code>
          ; every case re-measures as they change.
        </p>
        <div
          className={styles.cases}
          style={
            {
              "--skullet-text-top": top,
              "--skullet-text-bottom": bottom,
            } as CSSProperties
          }
        >
          <div className={styles.choices}>
            <SegmentedControl
              label="Text top"
              options={TOPS}
              value={top}
              onChange={setTop}
            />
            <SegmentedControl
              label="Text bottom"
              options={BOTTOMS}
              value={bottom}
              onChange={setBottom}
            />
          </div>
          {GEOMETRY_CASES.map((testCase) => (
            // Keyed by the rules, so a change measures every case again
            <Case
              key={`${testCase.label}:${top}:${bottom}`}
              testCase={testCase}
            />
          ))}
        </div>
      </Section>

      {bundleSizes.length > 0 && (
        <Section id="size" title="Bundle sizes">
          <p>Gzipped, against the version on npm.</p>
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
        </Section>
      )}
    </DocsLayout>
  );
};
