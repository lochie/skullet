"use client";

import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/codeblock";
import { Demo } from "@/components/demo";
import { DocsLayout } from "@/components/docs-layout";
import { ArticleDemo } from "@/demos/article";
import { GalleryDemo } from "@/demos/gallery";
import { ProfileDemo } from "@/demos/profile";

import { Projects } from "./projects";
import { ThemeCreator } from "./theme-creator";
import { InstallCommands } from "../homepage/install-cmd";
import { Frameworks } from "../homepage/frameworks";
import { Section } from "@/components/section";
import { Resizing } from "@/demos/resizing";
import { RevealModes } from "@/demos/reveal-modes";
import { Suspense } from "@/demos/suspense";
import Link from "next/link";

const REVEALS: [string, React.ReactNode][] = [
  [
    "smart",
    <>
      The default. Instant for a fast load, a crossfade for something small, a
      sequence for the rest.
    </>,
  ],
  ["together", <>Crossfades the whole skeleton into the content.</>],
  [
    "sequence",
    <>Brings each piece in where its skeleton was, top to bottom.</>,
  ],
  ["sweep", <>Uncovers the content behind the shimmer’s front.</>],
];

const THEME_OPTIONS: [string, React.ReactNode][] = [
  ["light, dark", <>The skeleton’s fill and highlight, per colour scheme.</>],
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
  ["radius", <>How round each line of text is drawn, as any CSS length.</>],
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
      How much of each line of text is drawn: from its <code>ascender</code>,{" "}
      <code>cap-height</code> or <code>x-height</code> as the <code>top</code>,
      down to its <code>baseline</code> or <code>descender</code> as the{" "}
      <code>bottom</code>.
    </>,
  ],
];

type Row = [name: string, type: string, description: string];

const API: [title: string, rows: Row[]][] = [
  [
    "SkeletonReveal",
    [
      [
        "data",
        "T | null | undefined",
        "Loading while empty; passed to children once set.",
      ],
      ["sample", "T", "Stands in for data to draw the first skeleton."],
      ["loading", "boolean", "Shows the skeleton, even over data."],
      ["id", "string", "Remembers the shape under this key."],
      ["label", "string", "Read to screen readers while loading."],
      ["skeleton", "ReactNode", "Shown instead of the measured skeleton."],
      ["empty", "boolean", "Shows emptyMessage in place of the content."],
      [
        "emptyMessage",
        "ReactNode",
        "Shown while empty; the content if left out.",
      ],
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
        '"smart" | "sequence" | "together" | "sweep" | RevealSpec',
        "How content replaces its skeleton.",
      ],
      ["theme", "SkeleTheme", "Colours, animation, speed, radius and text."],
      ["mode", '"light" | "dark" | "system"', "Which colours to use."],
      [
        "text",
        "SkeleText",
        "How much of each line of text is drawn; overrides the theme’s.",
      ],
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

const SPEC: [string, React.ReactNode][] = [
  [
    "order",
    <>
      <code>&quot;together&quot;</code>, or a function from each piece to its
      delay in ms. A piece knows its box, its row, the whole reveal’s box,
      whether it’s smaller text and how late its reveal landed.
    </>,
  ],
  [
    "enter",
    <>
      Where each piece starts, on top of the fade. Only what paints:{" "}
      <code>filter</code>, <code>translate</code>, <code>scale</code>,{" "}
      <code>rotate</code>, <code>transform</code> and <code>clipPath</code>.
    </>,
  ],
  [
    "wipe",
    <>
      A mask across the whole reveal, drawn each frame from progress 0 to 1. The
      outgoing skeleton gets its inverse unless you pass <code>out</code>, and{" "}
      <code>effect</code> runs on the incoming pane.
    </>,
  ],
  ["delay", <>In ms, before the whole reveal starts.</>],
  ["duration", <>In ms. 0 is instant.</>],
  [
    "hold",
    <>
      How long a skeleton waits before it shows, so fast data never shows one.
    </>,
  ],
  [
    "choose",
    <>
      Decides as content lands, from how long the skeleton was up, recent input,
      refetches and size. What it returns wins, and the fields beside it fill
      the rest.
    </>,
  ],
];

/** A new article each click, under the debug overlay and x-ray, scoped to it. */
const DebugExample = () => (
  <div skullet-debug="" skullet-xray="">
    <Demo hint="Click to reload">
      <ArticleDemo />
    </Demo>
  </div>
);

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
        traced, a bar for each line of text and a block for each image or
        control, so nothing moves when it arrives.
      </p>
    </header>

    <Section id="install" title="Install">
      <InstallCommands />
      <Frameworks />
      <Callout>
        <p>
          Optional: Add a <code>SkulletProvider</code> to set a{" "}
          <Link href="#theming">theme</Link>, a{" "}
          <Link href="#reveals">reveal mode</Link> or a CSP nonce for the whole
          app. <Link href="#SkulletProvider">Learn more &rarr;</Link>
        </p>
      </Callout>
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
  <h2>{user?.name}</h2>
  <p>{user?.bio}</p>
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
      <Callout>
        <p>
          Build your skeleton from Skullet&apos;s exported{" "}
          <code>&lt;Skeleton&gt;</code> rather than a grey box of your own. Each
          bar joins the page’s one shimmer, in step with every other skeleton
          however late it mounts, and follows the theme’s colours, animation and
          reduced motion.
        </p>
      </Callout>
    </Section>

    <Section id="hints" title="Hints">
      <p>
        Measuring gets most markup right. Where it doesn’t, mark the element:{" "}
        <code>skullet-block</code> draws it as one block, and{" "}
        <code>skullet-ignore</code> leaves it out.
      </p>
      <CodeBlock
        code={`<div skullet-block="">…</div>
<span skullet-ignore="">New</span>`}
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
      <Callout>
        <p>
          Under <code>smart</code>, data that lands within 150ms shows at once
          with no skeleton. Set the response to fast to see it.
        </p>
      </Callout>
    </Section>

    <Section id="images" title="Images">
      <p>
        Images never hold a reveal back. Each one still loading keeps its own
        skeleton until it has decoded, then fades in. It works with any{" "}
        <code>&lt;img&gt;</code>, <code>next/image</code> included, with no
        wrapper to swap in.
      </p>
      <Demo hint="Click to reload">
        <GalleryDemo />
      </Demo>
    </Section>

    <Section id="resizing" title="Changing size">
      <p>
        {`A skeleton drawn from old data might not match the new data's shape. The reveal eases to the new height
        rather than snapping.`}
      </p>
      <Resizing />
    </Section>

    <Section id="own-reveal" title="Your own reveal">
      <p>
        Every built-in is a <code>RevealSpec</code> exported from{" "}
        <code>skullet</code>. Spread one and change what you need.
      </p>
      <CodeBlock
        code={`import { sequence } from "skullet";

<SkulletProvider reveal={{ ...sequence, enter: { filter: "blur(6px)" } }}>
  <App />
</SkulletProvider>`}
      />
      <Terms items={SPEC} code />
      <p>A wipe needs only the incoming mask:</p>
      <CodeBlock
        code={`import type { RevealSpec } from "skullet";

const wipeDown: RevealSpec = {
  wipe: {
    mask: (progress) => {
      const at = progress * 120;
      return \`linear-gradient(#000 \${at - 20}%, transparent \${at}%)\`;
    },
  },
  duration: 400,
};

<SkulletProvider reveal={wipeDown}>`}
      />
      <Callout>
        <p>
          A reveal of your own still can’t move the page. Images wait behind
          their own skeleton, a wipe that drops frames finishes as a crossfade,
          delays and durations stop at 1s, and reduced motion is always instant.
        </p>
      </Callout>
    </Section>

    <Section id="suspense" title="Suspense">
      <p>
        <code>SkeletonSuspense</code> is a Suspense boundary with a measured
        skeleton as its fallback. Pass the content rendered from sample data, or
        only an <code>id</code> to draw the shape it last showed.
      </p>
      <Suspense />
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
        Under a <code>SkulletProvider</code>, the script goes out once a page;
        without one, each skeleton carries its own copy. The stylesheet has the
        same problem: import it once, so the server’s HTML is styled before any
        script runs.
      </p>
      <CodeBlock code={`import "skullet/styles.css";`} />
    </Section>

    <Section id="accessibility" title="Accessibility">
      <p>
        A loading reveal is <code>aria-busy</code>, and its skeleton is hidden
        from screen readers and <code>inert</code>. A <code>label</code> is read
        in its place. Under <code>prefers-reduced-motion</code>, skeletons hold
        still and every reveal is instant.
      </p>
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
        To outline one part of the page instead, put <code>skullet-debug</code>{" "}
        on any element around it. Add <code>skullet-xray</code> to see what was
        measured: the hidden content shows through the skeleton while it loads.
      </p>
      <DebugExample />
    </Section>

    <Section id="api" title="API">
      {API.map(([title, rows]) => (
        <div key={title} className={styles.api}>
          <h3 id={title}>
            {/* Components read as their tag, functions by name */}
            <code>{/^[A-Z]/.test(title) ? `<${title} />` : title}</code>
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
      <p>
        Skullet doesn’t guess at sizes. It lets the browser lay out the real
        content, then reads the result.
      </p>
      <ul>
        <li>
          <strong>Layout by the browser.</strong> Your content renders in place
          from the closest data there is, with its text made transparent and its
          media hidden. Every size and line break is the browser’s own.
        </li>
        <li>
          <strong>Lines from the DOM.</strong> Each text node is measured with{" "}
          <code>Range.getClientRects()</code>, which returns one box per line it
          wraps to. Images, controls and painted boxes such as buttons and chips
          are measured whole.
        </li>
        <li>
          <strong>Heights from the font.</strong> A line box is taller than its
          letters, so each bar is trimmed to the font’s own metrics, read once
          per font with canvas <code>measureText</code>: ascender to descender
          by default.
        </li>
        <li>
          <strong>Drawn on top.</strong> The bars are absolutely positioned over
          the unseen content, in a shadow root the page’s CSS can’t reach. Every
          bar shares one shimmer, timed by the document clock and its place on
          the page.
        </li>
        <li>
          <strong>Kept current.</strong> A <code>ResizeObserver</code>, a{" "}
          <code>MutationObserver</code>, image loads and font loads trigger a
          re-measure. On the server, an inline script measures before the first
          paint.
        </li>
      </ul>
      <p>
        The unseen content comes from the closest data Skullet has: the data on
        screen, the data last shown under the same <code>id</code>, a shape
        remembered from an earlier visit, then your{" "}
        <span style={{ whiteSpace: "nowrap" }}>
          <code>sample</code>.
        </span>
      </p>
    </Section>

    <Section id="thanks" title="More by Lochie">
      <p>If you like this you might also like my other projects</p>
      <Projects />
    </Section>
  </DocsLayout>
);
