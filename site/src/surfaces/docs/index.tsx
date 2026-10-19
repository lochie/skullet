"use client";

import Link from "next/link";
import { SkeleProvider, Skeleton } from "skele/react";

import styles from "./styles.module.scss";
import { CodeBlock } from "@/components/codeblock";
import { Footer } from "@/components/footer";
import { ArticleDemo } from "@/demos/article";
import { InboxDemo } from "@/demos/inbox";
import { ProfileDemo } from "@/demos/profile";
import { QuoteDemo } from "@/demos/quote";
import { StatsDemo } from "@/demos/stats";

const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className={styles.section}>
    <h2>
      <a href={`#${id}`}>{title}</a>
    </h2>
    {children}
  </section>
);

const Demo = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.demo}>
    {children}
    <span className={styles.hint}>Click to reload</span>
  </div>
);

const TECHNIQUES: [string, React.ReactNode][] = [
  [
    "Real layout",
    <>
      Your content is rendered unseen, in place, so the skeleton takes exactly
      the space it will.
    </>,
  ],
  [
    "Widths from the text",
    <>
      Each line of text gets a bar as wide as that line, so a paragraph that
      wraps to three lines gets three bars.
    </>,
  ],
  [
    "Heights from the type",
    <>
      Bars run between the font&apos;s own lines — ascender to descender by
      default — so they sit on the text the way the letters do.
    </>,
  ],
  [
    "Boxes for the rest",
    <>
      Images, controls, buttons and chips become a block the size of their box.
    </>,
  ],
  [
    "Filled with the closest data",
    <>
      The content is rendered from the data on screen, the data it last showed,
      a shape remembered from an earlier visit, or your <code>sample</code> —
      whichever is nearest the real thing.
    </>,
  ],
];

const SECTIONS = [
  ["sizing", "How sizing works"],
  ["start", "Getting started"],
  ["data", "Data and samples"],
  ["plain", "Plain children"],
  ["shapes", "Remembered shapes"],
  ["shimmer", "One shimmer"],
  ["reveals", "Reveals"],
  ["suspense", "Suspense"],
  ["accessibility", "Accessibility"],
  ["provider", "Provider"],
  ["theming", "Theming"],
  ["debug", "Debugging"],
  ["server", "Server rendering"],
  ["frameworks", "Vue, Svelte and vanilla"],
  ["api", "API"],
  ["hints", "Hints"],
  ["bars", "Single bars"],
] as const;

export const Docs = () => (
  <div className={styles.page}>
    <nav className={styles.nav}>
      <Link href="/" className={styles.home}>
        skele
      </Link>
      {SECTIONS.map(([id, title]) => (
        <a key={id} href={`#${id}`}>
          {title}
        </a>
      ))}
    </nav>

    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Docs</h1>
        <p>
          Skele shows a skeleton of exactly what is about to load. It lays your
          content out unseen and draws over it: a bar for every line of text, a
          block for every image, control and button. The skeleton takes the
          space the content will, so nothing moves when it arrives.
        </p>
      </header>

      <Section id="sizing" title="How sizing works">
        <p>
          Skele measures your content rather than guessing at it, so nothing
          moves when it arrives:
        </p>
        <dl className={styles.techniques}>
          {TECHNIQUES.map(([term, description]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="start" title="Getting started">
        <CodeBlock code="pnpm i skele" />
        <p>
          Wrap what you would render once the data arrives. Pass the data and
          render from it: while it&apos;s <code>null</code>, you see its
          skeleton.
        </p>
        <Demo>
          <ProfileDemo />
        </Demo>
        <CodeBlock
          code={`import { SkeletonReveal } from "skele/react";

<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {(user) => <Profile user={user} />}
</SkeletonReveal>`}
        />
      </Section>

      <Section id="data" title="Data and samples">
        <p>
          Your function only ever receives real data, so it never deals in{" "}
          <code>user?.name</code>. While loading, skele calls it with the best
          stand-in it has, and measures what comes back:
        </p>
        <ol>
          <li>
            the data on screen, when you force <code>loading</code> over it;
          </li>
          <li>
            the data it last showed under the same <code>id</code>, so a reload
            is exact;
          </li>
          <li>the shape remembered from a previous visit;</li>
          <li>
            your <code>sample</code>;
          </li>
          <li>a few generic lines, with a warning in development.</li>
        </ol>
        <Demo>
          <ArticleDemo />
        </Demo>
        <p>
          A <code>sample</code> shaped like the real thing makes the very first
          skeleton exact. In development, skele checks: when a skeleton and its
          content differ in size, it warns, and when data-driven content has no
          sample, it logs one to paste — your data&apos;s keys and lengths, with
          every value replaced.
        </p>
        <CodeBlock
          code={`<SkeletonReveal data={post} sample={SAMPLE_POST}>
  {(post) => <Article post={post} />}
</SkeletonReveal>

// Refetching: keep the data, force the skeleton — drawn from what's on screen
<SkeletonReveal data={post} loading={isRefetching}>
  {(post) => <Article post={post} />}
</SkeletonReveal>`}
        />
      </Section>

      <Section id="plain" title="Plain children">
        <p>
          If you&apos;d rather toggle it yourself, pass children and{" "}
          <code>loading</code>. The children are rendered without their data and
          measured — empty text gets a typical line — until a reveal remembers
          the real shape.
        </p>
        <CodeBlock
          code={`<SkeletonReveal loading={!user}>
  <Profile user={user} />
</SkeletonReveal>`}
        />
      </Section>

      <Section id="shapes" title="Remembered shapes">
        <p>
          Every reveal remembers the shape of what it showed. Within a visit,
          that&apos;s exact; across visits it&apos;s kept in{" "}
          <code>localStorage</code> as layout only — text replaced with filler
          spaced to wrap where the real text did, media sources and form values
          dropped. Pass an <code>id</code> to key it; without one, skele keys it
          by the page and the markup&apos;s shape.
        </p>
        <Demo>
          <InboxDemo />
        </Demo>
        <CodeBlock
          code={`<SkeletonReveal id="inbox" data={messages}>
  {(messages) => <Inbox messages={messages} />}
</SkeletonReveal>

// On sign-out
import { forgetShapes } from "skele";
forgetShapes();`}
        />
      </Section>

      <Section id="shimmer" title="One shimmer">
        <p>
          Every skeleton on the page shares one highlight sweeping across it,
          however late each mounts — these tiles load one after another. It
          holds still under <code>prefers-reduced-motion</code>.
        </p>
        <Demo>
          <StatsDemo />
        </Demo>
      </Section>

      <Section id="reveals" title="Reveals">
        <p>
          How content replaces its skeleton. <code>together</code> crossfades
          the two whole. <code>sequence</code> brings each piece in where its
          bone was, top to bottom. <code>smart</code>, the default, decides for
          each reveal as it lands:
        </p>
        <ol>
          <li>
            Someone scrolling, typing or tapping — or asking for reduced motion
            — gets the content at once.
          </li>
          <li>
            Data back within 150ms swaps straight in: a skeleton is held back
            that long, so a fast load never flashes one. A server-rendered
            skeleton is already on screen, and isn&apos;t held.
          </li>
          <li>
            A refetch drawn from the data on screen crossfades quickly — the
            shape is already familiar.
          </li>
          <li>Something small, a line or a chip, crossfades whole.</li>
          <li>
            Anything larger arrives in sequence: list rows and grid cards as
            units, in screen order shared with any other reveal landing at the
            same time, smaller text a beat behind the text it sits under.
            What&apos;s off screen appears at once, and each image fades in when
            it loads rather than holding up the text.
          </li>
        </ol>
        <div className={styles.compare}>
          {(["together", "sequence", "smart"] as const).map((reveal) => (
            <Demo key={reveal}>
              <SkeleProvider reveal={reveal}>
                <ArticleDemo />
              </SkeleProvider>
              <code>reveal=&quot;{reveal}&quot;</code>
            </Demo>
          ))}
        </div>
        <CodeBlock
          code={`<SkeleProvider reveal="sequence">
  <App />
</SkeleProvider>`}
        />
      </Section>

      <Section id="suspense" title="Suspense">
        <p>
          <code>SkeletonSuspense</code> is a Suspense boundary whose fallback is
          a measured skeleton. Give it the content rendered from sample data, or
          nothing to draw the shape it last showed; when the content resolves,
          the skeleton fades out over it.
        </p>
        <Demo>
          <QuoteDemo />
        </Demo>
        <CodeBlock
          code={`import { SkeletonSuspense } from "skele/react";

<SkeletonSuspense skeleton={<Quote quote={SAMPLE_QUOTE} />}>
  <LoadedQuote />  {/* calls use(promise) */}
</SkeletonSuspense>`}
        />
      </Section>

      <Section id="accessibility" title="Accessibility">
        <ul>
          <li>
            A loading reveal is <code>aria-busy</code>, and its skeleton is
            hidden from screen readers and <code>inert</code> — nothing in it
            can be focused, server-rendered or not.
          </li>
          <li>
            A <code>label</code> is read in the skeleton&apos;s place:{" "}
            <code>label=&quot;Loading profile&quot;</code>.
          </li>
          <li>
            Reveals and the shimmer all hold still under{" "}
            <code>prefers-reduced-motion</code>.
          </li>
          <li>Content arriving never moves focus.</li>
        </ul>
        <CodeBlock
          code={`<SkeletonReveal data={user} sample={SAMPLE_USER} label="Loading profile">
  {(user) => <Profile user={user} />}
</SkeletonReveal>`}
        />
      </Section>

      <Section id="provider" title="Provider">
        <p>
          <code>SkeleProvider</code> sets skele up for everything inside it. It
          is per render, not global, so a nonce can differ per request.
        </p>
        <ul>
          <li>
            <code>theme</code> and <code>mode</code> — colours for light and
            dark, and which to use: <code>light</code>, <code>dark</code>, or{" "}
            <code>system</code> to follow the visitor.
          </li>
          <li>
            <code>nonce</code> — set on the inline script and stylesheets skele
            renders, for a Content Security Policy.
          </li>
          <li>
            <code>text</code> — where text bars run, in the type&apos;s own
            lines: a <code>top</code> of <code>ascender</code>,{" "}
            <code>cap-height</code> or <code>x-height</code>, and a{" "}
            <code>bottom</code> of <code>baseline</code> or{" "}
            <code>descender</code>. The default, ascender to descender, takes in
            hanging letters. They&apos;re the <code>--skele-text-top</code> and{" "}
            <code>--skele-text-bottom</code> custom properties too, so a section
            of a page can differ — try them in the{" "}
            <Link href="/playground">playground</Link>.
          </li>
          <li>
            <code>reveal</code> — how content replaces its skeleton, for every
            reveal inside.
          </li>
          <li>
            <code>debug</code> — the overlay below.
          </li>
        </ul>
        <CodeBlock
          code={`import { SkeleProvider } from "skele/react";

<SkeleProvider
  nonce={nonce}
  mode="system"
  theme={{
    light: { base: "rgb(0 0 0 / 0.07)", highlight: "rgb(255 255 255 / 0.6)" },
    dark: { base: "rgb(255 255 255 / 0.08)", highlight: "rgb(255 255 255 / 0.1)" },
  }}
  reveal="smart"
>
  <App />
</SkeleProvider>`}
        />
        <p>
          Without a provider, colours are the <code>--skele-base</code> and{" "}
          <code>--skele-highlight</code> custom properties, so plain CSS can set
          them too.
        </p>
      </Section>

      <Section id="theming" title="Theming">
        <p>
          A theme sets colours for light and dark, how bones animate and how
          fast, their corners, and where text bars run. Every option is a custom
          property underneath, so any part of a page can set its own.
        </p>
        <p>
          <Link href="/theming">Try them in the theme creator →</Link>
        </p>
      </Section>

      <Section id="debug" title="Debugging">
        <p>
          The debug overlay outlines every reveal on the page: blue while it
          loads, with where its skeleton came from — data, sample, remembered
          shape, server render — then green if the content arrived without
          moving anything, or red with how far it moved. Its x-ray shows the
          content each skeleton was measured from, through its bones.
        </p>
        <p>
          Turn it on with <code>debug</code> on the provider, by adding{" "}
          <code>?skele-debug</code> to the URL, or from the{" "}
          <Link href="/playground">playground</Link>.
        </p>
      </Section>

      <Section id="server" title="Server rendering">
        <p>
          A server-rendered skeleton is measured as the HTML is parsed: a small
          inline script follows each one, so the page&apos;s first paint already
          shows its bones, and nothing changes when it hydrates. With JavaScript
          off, each line of text is struck through with a bar instead.
        </p>
        <p>
          On React 19 the stylesheet is rendered into the page for you. Anywhere
          else, import it once:
        </p>
        <CodeBlock code={`import "skele/styles.css";`} />
      </Section>

      <Section id="frameworks" title="Vue, Svelte and vanilla">
        <CodeBlock
          code={`<!-- Vue -->
<SkeletonReveal :data="user" :sample="SAMPLE_USER">
  <template #default="{ data }">
    <Profile :user="data" />
  </template>
</SkeletonReveal>`}
        />
        <CodeBlock
          code={`<!-- Svelte -->
<SkeletonReveal data={user} sample={SAMPLE_USER}>
  {#snippet children(user)}
    <Profile {user} />
  {/snippet}
</SkeletonReveal>`}
        />
        <CodeBlock
          code={`import { Reveal } from "skele";

const reveal = new Reveal(element, { id: "profile" });
reveal.load(renderProfile(SAMPLE_USER));
reveal.show(renderProfile(user));
reveal.load(); // drawn from the profile last shown`}
        />
      </Section>

      <Section id="api" title="API">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "data",
                "T | null",
                "Loading while empty; passed to children once it isn't.",
              ],
              ["sample", "T", "Stands in for data to draw the first skeleton."],
              ["loading", "boolean", "Shows the skeleton. Wins over data."],
              ["label", "string", "Read to screen readers while loading."],
              [
                "id",
                "string",
                "Remembers the shape across visits under this key.",
              ],
              [
                "skeleton",
                "ReactNode",
                "Shown while loading instead of the measured skeleton.",
              ],
              ["error", "ReactNode", "Shown instead of the content when set."],
              [
                "empty",
                "boolean",
                "Shows emptyMessage, or the content if there's none.",
              ],
              ["emptyMessage", "ReactNode", ""],
            ].map(([prop, type, description]) => (
              <tr key={prop}>
                <td>
                  <code>{prop}</code>
                </td>
                <td>
                  <code>{type}</code>
                </td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="hints" title="Hints">
        <ul>
          <li>
            <code>skele-block</code> draws an element as one block.
          </li>
          <li>
            <code>skele-ignore</code> draws nothing for an element.
          </li>
          <li>
            In React, a component with a static <code>Skeleton</code> is
            rendered as that instead.
          </li>
          <li>Give images a size, so their box is known before they load.</li>
        </ul>
        <CodeBlock
          code={`<div skele-block>…</div>

Avatar.Skeleton = () => <Skeleton width={40} height={40} radius="50%" />;`}
        />
      </Section>

      <Section id="bars" title="Single bars">
        <p>For a skeleton of your own, a bar on the same shimmer.</p>
        <div className={styles.bars}>
          <Skeleton width="70%" />
          <Skeleton width="45%" />
          <Skeleton width={40} height={40} radius="50%" />
        </div>
        <CodeBlock
          code={`import { SkeleProvider, Skeleton } from "skele/react";

<Skeleton width="70%" height="1em" radius="0.25em" />`}
        />
      </Section>

      <Footer />
    </main>
  </div>
);
