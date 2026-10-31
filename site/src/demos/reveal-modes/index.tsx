import { useEffect, useRef, useState } from "react";
import { Skeleton, SkulletProvider } from "skullet/react";

import styles from "./styles.module.scss";
import { Avatar } from "@/components/avatar";
import { CodeBlock } from "@/components/codeblock";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import { AUTHORS, Field } from "../parts";

type Post = { id: number; name: string; meta: string; text: string };

const TEXTS = [
  "Shipped the new shimmer. It finally moves at one pace on a wide monitor.",
  "Pushed the new site design, have a look when you get a sec.",
  "The skeletons are shimmering in sync now??",
  "Naming things is the hardest part, as always.",
  "Draft of the docs is ready for a second pair of eyes.",
];

// A different feed on every load, so each reveal has something new to replace
const feed = (seed: number): Post[] =>
  Array.from({ length: 3 }, (_, i) => {
    const n = seed * 3 + i;
    const [name, team] = AUTHORS[n % AUTHORS.length]!;
    return {
      id: n,
      name,
      meta: `${team} · ${(n % 7) + 1}h`,
      text: TEXTS[(n * 2) % TEXTS.length]!,
    };
  });

const SAMPLE_FEED = feed(0);

const Feed = ({ posts }: { posts: Post[] }) => (
  <ul className={styles.feed}>
    {posts.map((post) => (
      <li key={post.id}>
        <Avatar name={post.name} />
        <div>
          <p className={styles.feedName}>{post.name}</p>
          <p className={styles.feedMeta}>{post.meta}</p>
          <p className={styles.feedText}>{post.text}</p>
        </div>
      </li>
    ))}
  </ul>
);

const MODES = ["together", "sequence", "smart", "sweep"] as const;

const DELAYS = { fast: 80, typical: 1200, slow: 2800 } as const;

type Delay = keyof typeof DELAYS;

const ModesDemo = ({
  mode,
  onMode: setMode,
}: {
  mode: (typeof MODES)[number];
  onMode: (mode: (typeof MODES)[number]) => void;
}) => {
  const [delay, setDelay] = useState<Delay>("typical");
  const [seed, setSeed] = useState(1);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const timer = useRef<number>(undefined);

  const load = (keep: boolean, after = DELAYS[delay]) => {
    window.clearTimeout(timer.current);
    if (!keep) setPosts(null);
    setFetching(true);
    const next = seed + 1;
    setSeed(next);
    timer.current = window.setTimeout(() => {
      setPosts(feed(next));
      setFetching(false);
    }, after);
  };

  // The first load, on its own — not answering a click
  useEffect(() => {
    timer.current = window.setTimeout(() => {
      setPosts(feed(1));
      setFetching(false);
    }, DELAYS.typical);
    return () => window.clearTimeout(timer.current);
  }, []);

  return (
    <Demo
      hint="Click to reload"
      onClick={() => load(false)}
      disabled={fetching}
      controls={
        <>
          <Field label="Reveal">
            <SegmentedControl
              label="Reveal"
              options={MODES}
              value={mode}
              onChange={(value) => {
                setMode(value as (typeof MODES)[number]);
                load(false);
              }}
            />
          </Field>
          <Field label="Response">
            <SegmentedControl
              label="Response"
              options={Object.keys(DELAYS) as Delay[]}
              value={delay}
              onChange={setDelay}
            />
          </Field>
        </>
      }
    >
      <SkulletProvider reveal={mode}>
        <div className={styles.frame}>
          <Skeleton data={posts} loading={fetching} sample={SAMPLE_FEED}>
            {(posts) => <Feed posts={posts} />}
          </Skeleton>
        </div>
      </SkulletProvider>
    </Demo>
  );
};

/** The feed under each mode, with the code for the one chosen. */
export const RevealModesDemo = () => {
  const [mode, setMode] = useState<(typeof MODES)[number]>("smart");
  return (
    <>
      <ModesDemo mode={mode} onMode={setMode} />
      <CodeBlock
        code={`<SkulletProvider reveal="${mode}">
  <App />
</SkulletProvider>`}
      />
    </>
  );
};
