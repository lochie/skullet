"use client";

import Link from "next/link";

import styles from "./styles.module.scss";
import { Footer } from "@/components/footer";
import { ThemeCreator } from "./theme-creator";

const OPTIONS: [string, React.ReactNode][] = [
  [
    "light, dark",
    <>
      The bones&apos; fill and the highlight over them, for each colour scheme.
      The provider&apos;s <code>mode</code> picks one, or follows the system.
    </>,
  ],
  [
    "animation",
    <>
      <code>shimmer</code> sweeps one diagonal highlight across the whole page;{" "}
      <code>group-shimmer</code> gives each skeleton a sweep of its own;{" "}
      <code>pulse</code> fades every bone softly in and out; <code>none</code>{" "}
      holds still. Each keeps one phase across the page.
    </>,
  ],
  [
    "speed",
    <>
      <code>slow</code> or <code>fast</code>, set per animation: a shimmer loops
      in 4s or 2s, a pulse in 2.4s or 1.2s. A shimmer keeps the pace it has on a
      1280px screen at any width.
    </>,
  ],
  [
    "radius",
    <>
      Corners of text bars and single bars, as any CSS length. Images and chips
      keep their own.
    </>,
  ],
  [
    "text",
    <>
      Where text bars run, in the type&apos;s own lines: a <code>top</code> of{" "}
      <code>ascender</code>, <code>cap-height</code> or <code>x-height</code>,
      down to a <code>bottom</code> of <code>descender</code> or{" "}
      <code>baseline</code>.
    </>,
  ],
];

export const Theming = () => (
  <div className={styles.page}>
    <header className={styles.header}>
      <nav>
        <Link href="/">skele</Link>
        <Link href="/docs">Docs</Link>
      </nav>
      <h1>Theming</h1>
      <p>
        Change any option and the page below re-measures with it. Load the page
        to watch its regions arrive as a real page&apos;s would, then copy the
        provider when it looks right.
      </p>
    </header>

    <ThemeCreator />

    <section className={styles.options}>
      <h2>Options</h2>
      <dl>
        {OPTIONS.map(([term, description]) => (
          <div key={term}>
            <dt>
              <code>{term}</code>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <p>
        Every option is a custom property underneath — <code>--skele-base</code>
        , <code>--skele-highlight</code>, <code>--skele-radius</code>,{" "}
        <code>--skele-animation</code>, <code>--skele-speed</code>,{" "}
        <code>--skele-text-top</code> and <code>--skele-text-bottom</code> — so
        any part of a page can set its own, and plain CSS can set them without a
        provider.
      </p>
    </section>

    <Footer />
  </div>
);
