"use client";

import { SkeletonBox } from "skullet/react";

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
import { InstallCommands } from "./install-cmd";
import { Frameworks } from "./frameworks";
import { Section } from "@/components/section";
import { ResizingDemo } from "@/demos/resizing";
import { RevealModesDemo } from "@/demos/reveal-modes";
import { SuspenseDemo } from "@/demos/suspense";
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
    "Skeleton",
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
      [
        "onReveal",
        "() => void",
        "Called once content has come in over a skeleton.",
      ],
    ],
  ],
  [
    "SkeletonSuspense",
    [
      ["skeleton", "ReactNode", "The content, rendered from sample data."],
      ["id", "string", "Remembers the shape under this key."],
      ["label", "string", "Read to screen readers while suspended."],
      [
        "onReveal",
        "() => void",
        "Called once content has come in over the skeleton.",
      ],
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
      ["theme", "SkulletTheme", "Colours, animation, speed, radius and text."],
      ["mode", '"light" | "dark" | "system"', "Which colours to use."],
      [
        "text",
        "SkulletText",
        "How much of each line of text is drawn; overrides the theme’s.",
      ],
      ["nonce", "string", "For a Content Security Policy."],
      ["debug", "boolean", "Outlines every reveal and whether it moved."],
    ],
  ],
  [
    "SkeletonBox",
    [
      ["width", "number | string", "60% by default."],
      ["height", "number | string", "1em by default."],
      ["radius", "number | string", "The theme’s radius by default."],
    ],
  ],
  [
    "Reveal",
    [
      ["element", "HTMLElement", "Where the skeleton and content go."],
      ["id", "string", "Remembers the shape under this key."],
      ["reveal", "RevealMode", "How content replaces its skeleton."],
      ["label", "string", "Read to screen readers while loading."],
      [
        "onReveal",
        "() => void",
        "Called once content has come in over a skeleton.",
      ],
      [
        "load(content?)",
        "Node | string",
        "Shows a skeleton of the content, or of the shape last shown.",
      ],
      ["show(content)", "Node | string", "Reveals the content."],
      ["destroy()", "", "Stops measuring and remembering."],
    ],
  ],
  [
    "skullet-reveal",
    [
      ["id", "attribute", "Remembers the shape under this key."],
      ["loading", "attribute", "Starts with its children as a skeleton."],
      ["reveal", "attribute", "How content replaces its skeleton."],
      ["label", "attribute", "Read to screen readers while loading."],
      ["load(content?)", "Node | string", "Shows a skeleton."],
      ["show(content)", "Node | string", "Reveals the content."],
      ["reveal", "event", "Content has come in over a skeleton."],
    ],
  ],
  [
    "Functions",
    [
      ["forgetShapes()", "", "Clears every remembered shape, as on sign-out."],
      [
        "createSkeletonBox(options)",
        "HTMLSpanElement",
        "A SkeletonBox for vanilla JavaScript.",
      ],
      ["setDebug(on)", "", "Turns the debug overlay on for the whole page."],
      ["applyTheme(theme, mode)", "", "Sets a theme for the whole page."],
      [
        "themeVariables(theme, mode)",
        "Record<string, string>",
        "A theme as custom properties, for one element’s style.",
      ],
      [
        "skulletCSS({ theme, mode, text, selector })",
        "string",
        "A theme as CSS rules.",
      ],
      ["useReveal()", "RevealMode", "In React, the reveal the provider sets."],
    ],
  ],
];

const TROUBLES: [string, React.ReactNode][] = [
  [
    "The page jumps on reveal",
    <>
      Turn on <a href="#debug">debugging</a> to see where the skeleton came from
      and how far the content moved. Most often the <code>sample</code> is
      shorter or longer than real data: give it typical lengths.
    </>,
  ],
  [
    "An image moves when it loads",
    <>
      It had no size until it loaded, so its skeleton had no room for it. Give
      it a <code>width</code> and <code>height</code>, or an{" "}
      <code>aspect-ratio</code>.
    </>,
  ],
  [
    "Something is drawn the wrong way",
    <>
      Mark it with a <a href="#hints">hint</a>: <code>skullet-block</code> for
      one block, <code>skullet-ignore</code> for none, or in React, give a
      component <a href="#custom">its own skeleton</a>.
    </>,
  ],
  [
    "Three grey lines and a warning",
    <>
      There was nothing to measure. Pass <code>sample</code> data, or an{" "}
      <code>id</code> so the shape is remembered. For one placeholder box, use{" "}
      <code>&lt;SkeletonBox&gt;</code>.
    </>,
  ],
  [
    "Lines shift as a web font loads",
    <>
      Skeletons measure again once fonts load, so the first frame uses the
      fallback font. Preload the font to measure it from the start.
    </>,
  ],
  [
    "A Content Security Policy blocks the script",
    <>
      Pass your <code>nonce</code> to <code>SkulletProvider</code>; it goes on
      the inline script and stylesheets.
    </>,
  ],
];

const COMPONENTS = new Set([
  "Skeleton",
  "SkeletonSuspense",
  "SkulletProvider",
  "SkeletonBox",
]);

const SLOTS: [string, React.ReactNode][] = [
  [
    "Vue",
    <>
      The <code>default</code> slot with <code>{"{ data }"}</code>, then{" "}
      <code>skeleton</code>, <code>empty</code> and <code>error</code> with{" "}
      <code>{"{ error }"}</code>. <code>onReveal</code> is a <code>reveal</code>{" "}
      event.
    </>,
  ],
  [
    "Svelte",
    <>
      <code>children(data)</code>, <code>skeleton</code>,{" "}
      <code>emptyMessage</code> and <code>errorMessage(error)</code> snippets.{" "}
      <code>onReveal</code> is <code>onreveal</code>, and <code>data</code> can
      be a promise.
    </>,
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
      <Demo hint="Click to reload">
        <ProfileDemo />
      </Demo>
      <CodeBlock
        code={`<Skeleton data={user} sample={SAMPLE_USER}>
  {(user) => <Profile user={user} />}
</Skeleton>`}
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
        code={`<Skeleton loading={!user}>
  <h2>{user?.name}</h2>
  <p>{user?.bio}</p>
</Skeleton>`}
      />
    </Section>

    <Section id="custom" title="Your own skeleton">
      <p>
        Some things don’t measure well: a logo, a chart, a canvas. In React,
        give the component a static <code>.Skeleton</code> and Skullet draws
        that instead.
      </p>
      <CodeBlock
        code={`import { SkeletonBox } from "skullet/react";

Avatar.Skeleton = () => <SkeletonBox width={40} height={40} radius="50%" />;`}
      />
      <Demo still>
        <SkeletonBox width={40} height={40} radius="50%" />
        <SkeletonBox width="70%" />
        <SkeletonBox width="45%" />
      </Demo>
      <Callout>
        <p>
          Build your skeleton from Skullet’s exported{" "}
          <code>&lt;SkeletonBox&gt;</code> rather than a grey box of your own.
          Each bar joins the page’s one shimmer, in step with every other
          skeleton however late it mounts, and follows the theme’s colours,
          animation and reduced motion.
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
        or Skullet keys it by the page and the markup.
      </p>
      <CodeBlock
        code={`<Skeleton id="inbox" data={messages}>
  {(messages) => <Inbox messages={messages} />}
</Skeleton>`}
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

      <RevealModesDemo />
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
        A skeleton drawn from old data might not match the new data’s shape. The
        reveal eases to the new height rather than snapping.
      </p>
      <ResizingDemo />
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
        <code>SkeletonSuspense</code> is a{" "}
        <a
          href="https://react.dev/reference/react/Suspense"
          target="_blank"
          rel="nofollow"
        >
          Suspense
        </a>{" "}
        boundary with a measured skeleton as its fallback. Pass the content
        rendered from sample data, or only an <code>id</code> to draw the shape
        it last showed.
      </p>
      <SuspenseDemo />
      <CodeBlock
        code={`import { SkeletonSuspense } from "skullet/react";

<SkeletonSuspense skeleton={<Quote quote={SAMPLE_QUOTE} />}>
  <LoadedQuote />
</SkeletonSuspense>`}
      />
      <p>
        Vue’s wraps its own{" "}
        <a
          href="https://vuejs.org/guide/built-ins/suspense.html"
          target="_blank"
          rel="nofollow"
        >
          <code>&lt;Suspense&gt;</code>
        </a>
        : the content that suspends in the default slot, the sample in{" "}
        <code>#skeleton</code>.
      </p>
      <CodeBlock
        code={`<SkeletonSuspense>
  <LoadedQuote />
  <template #skeleton>
    <Quote :quote="SAMPLE_QUOTE" />
  </template>
</SkeletonSuspense>`}
      />
      <p>
        In Svelte, pass the promise itself as <code>data</code>. It loads until
        the promise settles, then shows its value, or its error.
      </p>
    </Section>

    <Section id="theming" title="Theming">
      <ThemeCreator />
      <Terms items={THEME_OPTIONS} code />
      <p>
        Each option is also a custom property, like <code>--skullet-base</code>,
        so any part of a page can set its own.
      </p>
    </Section>

    <Section id="server" title="Server rendering">
      <p>
        Wrap an async server component in <code>SkeletonSuspense</code>, in
        Next.js or any{" "}
        <a
          href="https://react.dev/reference/rsc/server-components"
          target="_blank"
          rel="nofollow"
        >
          React Server Components
        </a>{" "}
        setup. The skeleton is in the streamed HTML, measured before first
        paint, so it holds the content’s exact space until the content arrives.
      </p>
      <CodeBlock
        code={`import { SkeletonSuspense } from "skullet/react";

async function LoadedProfile() {
  const user = await getUser();
  return <Profile user={user} />;
}

export default function Page() {
  return (
    <SkeletonSuspense skeleton={<Profile user={SAMPLE_USER} />}>
      <LoadedProfile />
    </SkeletonSuspense>
  );
}`}
      />
      <Callout>
        <p>
          Skip the below step on React 19 or later: the stylesheet is imported
          for you.
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
        in its place. Under{" "}
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion"
          target="_blank"
          rel="nofollow"
        >
          <code>prefers-reduced-motion</code>
        </a>
        , skeletons hold still and every reveal is instant.
      </p>
      <p>
        To move focus once content has arrived, use <code>onReveal</code>.
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

    <Section id="fetching" title="Data fetching">
      <div className={styles.recipe}>
        <h3>TanStack Query and SWR</h3>
        <p>
          With{" "}
          <a href="https://tanstack.com/query" target="_blank" rel="nofollow">
            TanStack Query
          </a>{" "}
          or{" "}
          <a href="https://swr.vercel.app" target="_blank" rel="nofollow">
            SWR
          </a>
          , pass <code>data</code> as it comes. It’s empty until the first
          response, so the skeleton shows only then; a background refetch keeps
          the content on screen.
        </p>
        <CodeBlock
          code={`const { data } = useQuery({ queryKey: ["user", id], queryFn });

<Skeleton id="profile" data={data} sample={SAMPLE_USER}>
  {(user) => <Profile user={user} />}
</Skeleton>`}
        />
      </div>
      <div className={styles.recipe}>
        <h3>Nuxt</h3>
        <p>
          <a
            href="https://nuxt.com/docs/api/composables/use-lazy-fetch"
            target="_blank"
            rel="nofollow"
          >
            <code>useLazyFetch</code>
          </a>{" "}
          doesn’t block navigation, so the page shows at once with its skeleton.
        </p>
        <CodeBlock
          code={`<script setup>
import { Skeleton } from "skullet/vue";

const { data } = useLazyFetch("/api/user");
</script>

<template>
  <Skeleton :data="data" :sample="SAMPLE_USER">
    <template #default="{ data: user }">
      <Profile :user="user" />
    </template>
  </Skeleton>
</template>`}
        />
      </div>
      <div className={styles.recipe}>
        <h3>SvelteKit</h3>
        <p>
          Return the promise from <code>load</code> without awaiting it, so it{" "}
          <a
            href="https://svelte.dev/docs/kit/load#Streaming-with-promises"
            target="_blank"
            rel="nofollow"
          >
            streams
          </a>
          , and pass it straight to <code>data</code>.
        </p>
        <CodeBlock
          code={`<script>
  import { Skeleton } from "skullet/svelte";

  // +page.server.ts returns { user: getUser() }
  let { data } = $props();
</script>

<Skeleton data={data.user} sample={SAMPLE_USER}>
  {#snippet children(user)}
    <Profile {user} />
  {/snippet}
</Skeleton>`}
        />
      </div>
    </Section>

    <Section id="element" title="Web component">
      <p>
        For plain HTML, or a framework without a wrapper, import{" "}
        <code>skullet/element</code> once. With <code>loading</code>, the
        children are measured into a skeleton; call <code>show()</code> with the
        content.
      </p>
      <CodeBlock
        code={`<skullet-reveal id="profile" loading label="Loading profile">
  <div class="card">…sample markup…</div>
</skullet-reveal>

<script type="module">
  import "skullet/element";

  const reveal = document.getElementById("profile");
  reveal.show(await renderProfile());
</script>`}
      />
      <p>
        Its <code>id</code> doubles as the key for its remembered shape. Import{" "}
        <code>skullet/styles.css</code> in the page’s head too, so a skeleton
        waiting for the script stays blank rather than showing sample content.
      </p>
    </Section>

    <Section id="testing" title="Testing">
      <p>
        Skullet runs in{" "}
        <a href="https://github.com/jsdom/jsdom" target="_blank" rel="nofollow">
          jsdom
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/capricorn86/happy-dom"
          target="_blank"
          rel="nofollow"
        >
          happy-dom
        </a>
        . Neither has layout, so there’s nothing to measure and every reveal is
        instant, as under reduced motion. Content is in the document as soon as
        its data is.
      </p>
      <p>
        While loading, the sample’s text is in the document too, inside a
        skeleton that’s <code>aria-hidden</code>.{" "}
        <a
          href="https://testing-library.com/docs/queries/byrole"
          target="_blank"
          rel="nofollow"
        >
          Queries by role
        </a>{" "}
        skip it; queries by text don’t.
      </p>
      <CodeBlock
        code={`render(<Profile />);

// Not findByText: the sample's name is in the skeleton until then
await screen.findByRole("heading", { name: "Ada Lovelace" });`}
      />
    </Section>

    <Section id="troubleshooting" title="Troubleshooting">
      <Terms items={TROUBLES} />
    </Section>

    <Section id="api" title="API">
      {API.map(([title, rows]) => (
        <div key={title} className={styles.api}>
          <h3 id={title}>
            {title === "Functions" ? (
              title
            ) : (
              <code>
                {COMPONENTS.has(title)
                  ? `<${title} />`
                  : title.includes("-")
                    ? `<${title}>`
                    : `new ${title}()`}
              </code>
            )}
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
      <p>
        In Vue and Svelte, <code>&lt;Skeleton&gt;</code> takes the same props;
        what React passes as nodes comes as slots and snippets.
      </p>
      <Terms items={SLOTS} />
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
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects"
            target="_blank"
            rel="nofollow"
          >
            <code>Range.getClientRects()</code>
          </a>
          , which returns one box per line it wraps to. Images, controls and
          painted boxes such as buttons and chips are measured whole.
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
      <p>If you like this, you might also like these.</p>
      <Projects />
    </Section>
  </DocsLayout>
);
