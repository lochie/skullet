"use client";

import Link from "next/link";
import { useState } from "react";
import { Skeleton, SkulletProvider } from "skullet/react";

import styles from "./styles.module.scss";
import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/codeblock";
import { Demo } from "@/components/demo";
import { DocsLayout } from "@/components/docs-layout";
import { ArticleDemo } from "@/demos/article";
import { ProfileDemo } from "@/demos/profile";

import { ThemeCreator } from "./theme-creator";
import { InstallCommands } from "../homepage/install-cmd";
import { Frameworks } from "../homepage/frameworks";
import { Section } from "@/components/section";
import { SegmentedControl } from "@/components/segmented-control";

const HOW: [string, React.ReactNode][] = [
  [
    "Real layout",
    <>
      Your content is rendered unseen, in place, so the skeleton takes exactly
      its space.
    </>,
  ],
  ["A bar per line", <>Each line of text gets a bar as wide as that line.</>],
  [
    "Heights from the type",
    <>Bars run between the font’s own lines, ascender to descender.</>,
  ],
  [
    "Boxes for the rest",
    <>
      Images, controls, buttons and chips become a block the size of their box.
    </>,
  ],
  [
    "The closest data",
    <>
      It renders from the data on screen, the data last shown under the same{" "}
      <code>id</code>, a shape remembered from an earlier visit, or your{" "}
      <code>sample</code>, whichever is nearest the real thing.
    </>,
  ],
];

const REVEALS: [string, React.ReactNode][] = [
  [
    "smart",
    <>
      The default. Instant for a fast load, a crossfade for something small, a
      sequence for the rest.
    </>,
  ],
  ["together", <>Crossfades the whole skeleton into the content.</>],
  ["sequence", <>Brings each piece in where its bone was, top to bottom.</>],
  ["sweep", <>Uncovers the content behind the shimmer’s front.</>],
];

const THEME_OPTIONS: [string, React.ReactNode][] = [
  ["light, dark", <>The bones’ fill and highlight, per colour scheme.</>],
  [
    "animation",
    <>
      <code>shimmer</code>, <code>group-shimmer</code>, <code>pulse</code> or{" "}
      <code>none</code>. Every skeleton on the page keeps one phase, however
      late it mounts.
    </>,
  ],
  [
    "speed",
    <>
      <code>slow</code> or <code>fast</code>.
    </>,
  ],
  ["radius", <>Corners of text bars, as any CSS length.</>],
  [
    "reveal",
    <>
      How content replaces its skeleton. Set on the provider, not the theme; see{" "}
      <a href="#reveals">reveals</a>.
    </>,
  ],
  [
    "text",
    <>
      Where text bars run: a <code>top</code> of <code>ascender</code>,{" "}
      <code>cap-height</code> or <code>x-height</code>, to a <code>bottom</code>{" "}
      of <code>descender</code> or <code>baseline</code>.
    </>,
  ],
];

type Row = [name: string, type: string, description: string];

const API: [title: string, rows: Row[]][] = [
  [
    "SkeletonReveal",
    [
      ["data", "T | null", "Loading while empty; passed to children once set."],
      ["sample", "T", "Stands in for data to draw the first skeleton."],
      ["loading", "boolean", "Shows the skeleton, even over data."],
      ["id", "string", "Remembers the shape under this key."],
      ["label", "string", "Read to screen readers while loading."],
      ["skeleton", "ReactNode", "Shown instead of the measured skeleton."],
      ["empty", "boolean", "Shows emptyMessage in place of the content."],
      ["error", "ReactNode", "Shown in place of the content."],
    ],
  ],
  [
    "SkeletonSuspense",
    [
      ["skeleton", "ReactNode", "The content, rendered from sample data."],
      ["id", "string", "Remembers the shape under this key."],
      ["label", "string", "Read to screen readers while suspended."],
    ],
  ],
  [
    "SkulletProvider",
    [
      [
        "reveal",
        '"smart" | "sequence" | "together" | "sweep"',
        "How content replaces its skeleton.",
      ],
      ["theme", "SkeleTheme", "Colours, animation, speed, radius and text."],
      ["mode", '"light" | "dark" | "system"', "Which colours to use."],
      ["nonce", "string", "For a Content Security Policy."],
      ["debug", "boolean", "Outlines every reveal and whether it moved."],
    ],
  ],
  [
    "Skeleton",
    [
      ["width", "number | string", "60% by default."],
      ["height", "number | string", "1em by default."],
      ["radius", "number | string", "The theme’s radius by default."],
    ],
  ],
];

const MODES = ["smart", "together", "sequence", "sweep"] as const;

const RevealModes = () => {
  const [reveal, setReveal] = useState<(typeof MODES)[number]>("smart");

  return (
    <>
      <Demo>
        {/* Keyed by mode, so a new choice loads again under it */}
        <SkulletProvider key={reveal} reveal={reveal}>
          <ArticleDemo />
        </SkulletProvider>
      </Demo>
      <SegmentedControl
        label="Reveal"
        options={MODES}
        value={reveal}
        onChange={setReveal}
      />
      <CodeBlock
        code={`<SkulletProvider reveal="${reveal}">
  <App />
</SkulletProvider>`}
      />
    </>
  );
};

const Terms = ({
  items,
  code,
}: {
  items: [string, React.ReactNode][];
  code?: boolean;
}) => (
  <dl className={styles.terms}>
    {items.map(([term, description]) => (
      <div key={term}>
        <dt>{code ? <code>{term}</code> : term}</dt>
        <dd>{description}</dd>
      </div>
    ))}
  </dl>
);

export const Docs = ({ downloads }: { downloads?: number }) => (
  <DocsLayout aside downloads={downloads}>
    <header className={styles.header}>
      <h1>Skullet</h1>
      <p>
        Skullet draws a skeleton of exactly what is about to load, for React,
        Vue, Svelte and vanilla JavaScript. Your content is laid out unseen and
        covered in <em>bones</em>, a bar for each line of text and a block for
        each image or control, so nothing moves when it arrives.
      </p>
    </header>

    <Section id="install" title="Install">
      <InstallCommands />
      <Frameworks />
    </Section>

    <Section id="data" title="From data">
      <p>
        Before data arrives there’s nothing to measure. Pass a{" "}
        <code>sample</code> of the same shape: while <code>data</code> is{" "}
        <code>null</code>, the sample is rendered unseen and measured in its
        place. Your function only ever receives real data.
      </p>
      <Demo>
        <ProfileDemo />
      </Demo>
      <CodeBlock
        code={`<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {(user) => <Profile user={user} />}
</SkeletonReveal>`}
      />
      <p>
        In development, content without a <code>sample</code> logs one to paste:
        your data’s keys and lengths, with every value replaced.
      </p>
    </Section>

    <Section id="plain" title="Plain children">
      <p>
        Toggle <code>loading</code> yourself and the children are measured as
        they are. Empty text gets a typical line until a reveal remembers the
        real shape.
      </p>
      <CodeBlock
        code={`<SkeletonReveal loading={!user}>
  <Profile user={user} />
</SkeletonReveal>`}
      />
    </Section>

    <Section id="custom" title="Your own skeleton">
      <p>
        Some things don’t measure well: a logo, a chart, a canvas. In React,
        give the component a static <code>.Skeleton</code> and Skullet draws
        that instead.
      </p>
      <CodeBlock
        code={`import { Skeleton } from "skullet/react";

Avatar.Skeleton = () => <Skeleton width={40} height={40} radius="50%" />;`}
      />
      <Demo>
        <Skeleton width={40} height={40} radius="50%" />
        <Skeleton width="70%" />
        <Skeleton width="45%" />
      </Demo>
      <p>
        Build your skeleton from Skullet&apos;s exported{" "}
        <code>&lt;Skeleton&gt;</code> rather than a grey box of your own. Each
        bar joins the page’s one shimmer, in step with every other skeleton
        however late it mounts, and follows the theme’s colours, animation and
        reduced motion.
      </p>
    </Section>

    <Section id="hints" title="Hints">
      <p>
        Measuring gets most markup right. Where it doesn’t, mark the element:{" "}
        <code>skullet-block</code> draws it as one block, and{" "}
        <code>skullet-ignore</code> leaves it out.
      </p>
      <CodeBlock
        code={`<div skullet-block>…</div>
<span skullet-ignore>New</span>`}
      />
      <p>
        An image with no size is flat until it loads, so its skeleton has no
        room for it. Give images a <code>width</code> and <code>height</code>,
        or an <code>aspect-ratio</code>.
      </p>
    </Section>

    <Section id="memory" title="Memory">
      <p>
        A reveal remembers the shape it showed, so its next skeleton is exact.
        Within a visit it keeps the real content; across visits, only the
        layout, in <code>localStorage</code>. Pass an <code>id</code> to key it,
        or skullet keys it by the page and the markup.
      </p>
      <CodeBlock
        code={`<SkeletonReveal id="inbox" data={messages}>
  {(messages) => <Inbox messages={messages} />}
</SkeletonReveal>`}
      />
      <Callout>
        <p>
          Shapes stay in <code>localStorage</code> after sign-out, so the next
          person on the device would see the outline of the last one’s inbox.
          Call <code>forgetShapes()</code> on sign-out to clear them.
        </p>
      </Callout>
    </Section>

    <Section id="reveals" title="Reveal modes">
      <p>
        A <em>reveal</em> is the moment content replaces its skeleton. The
        provider’s <code>reveal</code> sets how it looks.
      </p>
      <Terms items={REVEALS} code />

      <RevealModes />
      <p>
        Images never hold a reveal back. Each one still loading keeps its own
        bone until it has decoded, then fades in. It works with any{" "}
        <code>&lt;img&gt;</code>, <code>next/image</code> included, with no
        wrapper to swap in.
      </p>
    </Section>

    <Section id="suspense" title="Suspense">
      <p>
        <code>SkeletonSuspense</code> is a Suspense boundary with a measured
        skeleton as its fallback. Pass the content rendered from sample data, or
        only an <code>id</code> to draw the shape it last showed.
      </p>
      <CodeBlock
        code={`import { SkeletonSuspense } from "skullet/react";

<SkeletonSuspense skeleton={<Quote quote={SAMPLE_QUOTE} />}>
  <LoadedQuote />
</SkeletonSuspense>`}
      />
    </Section>

    <Section id="theming" title="Theming">
      <p>
        Change any option and the page below re-measures with it, then copy the
        provider.
      </p>
      <ThemeCreator />
      <Terms items={THEME_OPTIONS} code />
      <p>
        Each option is also a custom property, like <code>--skullet-base</code>,
        so any part of a page can set its own.
      </p>
    </Section>

    <Section id="server" title="Server rendering">
      <Callout>
        <p>
          Skip this step on React 19 or later, the stylesheet is imported for
          you.
        </p>
      </Callout>
      <p>
        Server HTML paints before any JavaScript runs. An inline script measures
        each skeleton before that first paint, so nothing changes on hydration.
        The stylesheet has the same problem: import it once, so the server’s
        HTML is styled before any script runs.
      </p>
      <CodeBlock code={`import "skullet/styles.css";`} />
    </Section>

    <Section id="accessibility" title="Accessibility">
      <p>
        A loading reveal is <code>aria-busy</code>, and its skeleton is hidden
        from screen readers and <code>inert</code>. A <code>label</code> is read
        in its place. Under <code>prefers-reduced-motion</code>, bones hold
        still and every reveal is instant.
      </p>
      <CodeBlock
        code={`<SkeletonReveal data={user} sample={SAMPLE_USER} label="Loading profile">
  {(user) => <Profile user={user} />}
</SkeletonReveal>`}
      />
    </Section>

    <Section id="debug" title="Debugging">
      <p>
        A skeleton that doesn’t match its content makes the page jump when it
        reveals. The debug overlay finds those: it outlines every reveal, blue
        while it loads, with where its skeleton came from, then green if nothing
        moved or red with how far it did. Turn it on with <code>debug</code> on
        the provider, or add <code>?skullet-debug</code> to the URL.
      </p>
      <p>
        Try it in the <Link href="/docs/playground">playground</Link>.
      </p>
    </Section>

    <Section id="api" title="API">
      {API.map(([title, rows]) => (
        <div key={title} className={styles.api}>
          <h3>
            <code>{title}</code>
          </h3>
          <table className={styles.table}>
            <tbody>
              {rows.map(([name, type, description]) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>{type && <code>{type}</code>}</td>
                  <td>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Section>

    <Section id="how" title="How it works">
      <Terms items={HOW} />
    </Section>
  </DocsLayout>
);
