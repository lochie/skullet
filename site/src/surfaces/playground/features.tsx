import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  forgetShapes,
  themeVariables,
  type RevealMode,
  type SkulletAnimation,
  type SkulletSpeed,
} from "skullet";
import {
  SkulletProvider,
  SkeletonReveal,
  SkeletonSuspense,
} from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";

type Post = { id: number; name: string; meta: string; text: string };

const AUTHORS = [
  ["Lochie Axon", "Design engineering"],
  ["Alex Vanderzon", "Design"],
  ["Jack Skellington", "Design"],
  ["Pugson", "Engineering"],
] as const;

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
        <span className={styles.avatar} data-hue={post.id % 4} />
        <div>
          <p className={styles.feedName}>{post.name}</p>
          <p className={styles.feedMeta}>{post.meta}</p>
          <p className={styles.feedText}>{post.text}</p>
        </div>
      </li>
    ))}
  </ul>
);

const Button = ({ children, ...props }: ComponentProps<"button">) => (
  <button className={styles.pill} {...props}>
    {children}
  </button>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className={styles.toolbarField}>
    {label}
    {children}
  </div>
);

// How far a frame's height moved between its skeleton and the content that replaced it
function useMovement(loading: boolean) {
  const frame = useRef<HTMLDivElement>(null);
  const before = useRef<number | null>(null);
  const [moved, setMoved] = useState<number | null>(null);

  useLayoutEffect(() => {
    const height = frame.current?.offsetHeight ?? 0;
    if (loading) {
      before.current = height;
      return;
    }
    if (before.current === null) return;
    const delta = height - before.current;
    before.current = null;
    // Measurement only — the result is what this effect exists to render
    setMoved(delta);
  }, [loading]);

  return { frame, moved };
}

const Moved = ({
  moved,
  loading,
}: {
  moved: number | null;
  loading: boolean;
}) => (
  <span
    className={styles.moved}
    data-jump={loading || moved === null ? undefined : moved !== 0}
  >
    {loading || moved === null
      ? "loading…"
      : moved === 0
        ? "no movement"
        : `moved ${moved}px`}
  </span>
);

/* Reveal modes */

const MODES: RevealMode[] = ["together", "sequence", "smart", "sweep"];
const DELAYS = { fast: 80, typical: 1200, slow: 2800 } as const;
type Delay = keyof typeof DELAYS;

export const RevealModes = () => {
  const [mode, setMode] = useState<RevealMode>("smart");
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
      controls={
        <>
          <Field label="Reveal">
            <SegmentedControl
              label="Reveal"
              options={MODES}
              value={mode}
              onChange={setMode}
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
          <Button onClick={() => load(false)} disabled={fetching}>
            Load feed
          </Button>
          <Button onClick={() => load(true)} disabled={fetching}>
            Refetch, keeping data
          </Button>
        </>
      }
    >
      <SkulletProvider reveal={mode}>
        <div className={styles.frame}>
          <SkeletonReveal data={posts} loading={fetching} sample={SAMPLE_FEED}>
            {(posts) => <Feed posts={posts} />}
          </SkeletonReveal>
        </div>
      </SkulletProvider>
    </Demo>
  );
};

/* Where a skeleton comes from */

type Profile = { name: string; role: string; bio: string };

const SAMPLE_PROFILE: Profile = {
  name: "Jack",
  role: "Design",
  bio: "A short bio.",
};

const PROFILES: Profile[] = [
  {
    name: "Lochie Axon",
    role: "Design engineer",
    bio: "Builds the libraries behind the interface: skeletons, text morphs and the small motion details that hold a page together.",
  },
  {
    name: "Jack Skellington",
    role: "Designer",
    bio: "Sweats every interaction. Has strong opinions about easing curves and corner radii.",
  },
];

const ProfileCard = ({ profile }: { profile: Profile }) => (
  <div className={styles.profile}>
    <span className={styles.avatar} data-hue={profile.name.length % 4} />
    <div>
      <p className={styles.feedName}>{profile.name}</p>
      <p className={styles.feedMeta}>{profile.role}</p>
    </div>
    <p className={styles.feedText}>{profile.bio}</p>
  </div>
);

const SOURCES = [
  {
    key: "markup",
    title: "Markup",
    detail:
      "Plain children with a loading prop. The content is its own skeleton.",
  },
  {
    key: "auto",
    title: "Remembered by place",
    detail:
      "Mounted fresh with no id: the shape last seen at this spot on the page.",
  },
  {
    key: "id",
    title: "Remembered by id",
    detail:
      "Mounted fresh with an id: the shape saved under it, wherever it renders.",
  },
  {
    key: "last",
    title: "Last data",
    detail:
      "The same reveal loading again: drawn from the data it showed before.",
  },
] as const;

type SourceKey = (typeof SOURCES)[number]["key"];

const Source = ({
  source,
  round,
  loading,
}: {
  source: SourceKey;
  round: number;
  loading: boolean;
}) => {
  const profile = PROFILES[0]!;
  const data = loading ? null : profile;
  const { frame, moved } = useMovement(loading);

  let reveal: ReactNode;
  if (source === "markup") {
    reveal = (
      <SkeletonReveal loading={loading}>
        <ProfileCard profile={profile} />
      </SkeletonReveal>
    );
  } else if (source === "last") {
    reveal = (
      <SkeletonReveal data={data} sample={SAMPLE_PROFILE}>
        {(profile) => <ProfileCard profile={profile} />}
      </SkeletonReveal>
    );
  } else {
    // Keyed by the round, so each load is a reveal that has never shown anything
    reveal = (
      <SkeletonReveal
        key={round}
        id={source === "id" ? "playground-profile" : undefined}
        data={data}
        sample={SAMPLE_PROFILE}
      >
        {(profile) => <ProfileCard profile={profile} />}
      </SkeletonReveal>
    );
  }

  return (
    <>
      <div ref={frame} className={styles.frame}>
        {reveal}
      </div>
      <Moved moved={moved} loading={loading} />
    </>
  );
};

export const Sources = () => {
  const [source, setSource] = useState<SourceKey>("markup");
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setRound((r) => r + 1);
    setLoading(true);
  };

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [loading, round]);

  const detail = SOURCES.find((s) => s.key === source)!.detail;

  return (
    <Demo
      controls={
        <>
          <SegmentedControl
            label="Source"
            options={SOURCES.map((s) => s.key)}
            value={source}
            onChange={setSource}
            format={(key) => SOURCES.find((s) => s.key === key)!.title}
          />
          <Button onClick={load} disabled={loading}>
            Load again
          </Button>
          <Button
            onClick={() => {
              forgetShapes();
              load();
            }}
            disabled={loading}
          >
            Forget shapes and load
          </Button>
        </>
      }
    >
      <p className={styles.demoNote}>{detail}</p>
      <Source key={source} source={source} round={round} loading={loading} />
    </Demo>
  );
};

/* Animation */

const ANIMATIONS: SkulletAnimation[] = [
  "shimmer",
  "group-shimmer",
  "pulse",
  "none",
];
const SPEEDS: SkulletSpeed[] = ["slow", "fast"];

export const Animations = () => {
  const [animation, setAnimation] = useState<SkulletAnimation>("shimmer");
  const [speed, setSpeed] = useState<SkulletSpeed>("slow");

  return (
    <Demo
      controls={
        <>
          <Field label="Animation">
            <SegmentedControl
              label="Animation"
              options={ANIMATIONS}
              value={animation}
              onChange={setAnimation}
            />
          </Field>
          <Field label="Speed">
            <SegmentedControl
              label="Speed"
              options={SPEEDS}
              value={speed}
              onChange={setSpeed}
            />
          </Field>
        </>
      }
    >
      <div
        className={styles.frame}
        style={themeVariables({ animation, speed }) as CSSProperties}
      >
        {/* Keyed by the theme: the animation is read from it as it starts */}
        <SkeletonReveal key={animation + speed} loading>
          <ProfileCard profile={PROFILES[1]!} />
        </SkeletonReveal>
      </div>
    </Demo>
  );
};

/* Suspense */

type Quote = { text: string; author: string };

const QUOTES: Quote[] = [
  { text: "Nothing should move when it loads.", author: "Lochie Axon" },
  {
    text: "A loading state is the first impression. Design it like the rest of the product.",
    author: "Alex Vanderzon",
  },
  {
    text: "Make the wait feel shorter than it is.",
    author: "Jack Skellington",
  },
];

const QuoteCard = ({ quote }: { quote: Quote }) => (
  <figure className={styles.quote}>
    <blockquote>{quote.text}</blockquote>
    <figcaption>{quote.author}</figcaption>
  </figure>
);

// Suspends until its quote arrives — no loading state of its own
const LoadedQuote = ({ quote }: { quote: Promise<Quote> }) => (
  <QuoteCard quote={use(quote)} />
);

const subscribe = () => () => {};

const FALLBACKS = ["skeleton", "id"] as const;
type Fallback = (typeof FALLBACKS)[number];
const FALLBACK_LABELS: Record<Fallback, string> = {
  skeleton: "skeleton",
  id: "id only",
};

export const Suspense = () => {
  // A promise made while rendering on the server can't reach the browser,
  // so quotes are fetched once hydrated; until then, the same skeleton
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [round, setRound] = useState(0);
  const [fallback, setFallback] = useState<Fallback>("skeleton");
  const [quotes] = useState(() => new Map<string, Promise<Quote>>());
  const quoteFor = (key: string) => {
    if (!quotes.has(key)) {
      quotes.set(
        key,
        new Promise((resolve) =>
          window.setTimeout(
            () => resolve(QUOTES[round % QUOTES.length]!),
            1400,
          ),
        ),
      );
    }
    return quotes.get(key)!;
  };

  return (
    <Demo
      controls={
        <>
          <Field label="Fallback">
            <SegmentedControl
              label="Fallback"
              options={FALLBACKS}
              value={fallback}
              onChange={setFallback}
              format={(option) => FALLBACK_LABELS[option]}
            />
          </Field>
          <Button onClick={() => setRound(round + 1)}>Suspend again</Button>
        </>
      }
    >
      <div className={styles.frame}>
        {!hydrated ? (
          <SkeletonReveal data={null} sample={QUOTES[0]!} label="Loading quote">
            {(quote) => <QuoteCard quote={quote} />}
          </SkeletonReveal>
        ) : fallback === "skeleton" ? (
          <SkeletonSuspense
            key={round}
            skeleton={<QuoteCard quote={QUOTES[0]!} />}
            label="Loading quote"
          >
            <LoadedQuote quote={quoteFor(`given-${round}`)} />
          </SkeletonSuspense>
        ) : (
          <SkeletonSuspense
            key={round}
            id="playground-quote"
            label="Loading quote"
          >
            <LoadedQuote quote={quoteFor(`remembered-${round}`)} />
          </SkeletonSuspense>
        )}
      </div>
    </Demo>
  );
};

/* Accessibility */

type Readout = {
  busy: boolean;
  status: string;
  hidden: boolean;
  inert: boolean;
};

const observeReadout = (frame: HTMLElement, onChange: (r: Readout) => void) => {
  const read = () => {
    const reveal = frame.querySelector("[skullet-reveal]");
    const loading = frame.querySelector(
      "[skullet-loading]:not([skullet-exiting] *)",
    );
    onChange({
      busy: reveal?.getAttribute("aria-busy") === "true",
      status: frame.querySelector("[skullet-status]")?.textContent ?? "",
      hidden: loading?.getAttribute("aria-hidden") === "true",
      inert: !!loading?.hasAttribute("inert"),
    });
  };
  read();
  const observer = new MutationObserver(read);
  observer.observe(frame, { subtree: true, childList: true, attributes: true });
  return () => observer.disconnect();
};

export const Accessibility = () => {
  const [loading, setLoading] = useState(true);
  const [readout, setReadout] = useState<Readout | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  useEffect(
    () =>
      frame.current ? observeReadout(frame.current, setReadout) : undefined,
    [],
  );

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Demo
      controls={
        <Button onClick={() => setLoading(true)} disabled={loading}>
          Load again
        </Button>
      }
    >
      <div ref={frame} className={styles.frame}>
        <SkeletonReveal
          data={loading ? null : PROFILES[0]!}
          sample={SAMPLE_PROFILE}
          label="Loading profile"
        >
          {(profile) => <ProfileCard profile={profile} />}
        </SkeletonReveal>
      </div>
      <dl className={styles.readout}>
        <dt>aria-busy</dt>
        <dd data-on={readout?.busy}>{readout?.busy ? "true" : "—"}</dd>
        <dt>Announced</dt>
        <dd data-on={!!readout?.busy}>
          {readout?.busy ? `“${readout.status}”` : "the content"}
        </dd>
        <dt>Skeleton</dt>
        <dd data-on={!!readout?.busy}>
          {readout?.busy
            ? [readout.inert && "inert", readout.hidden && "aria-hidden"]
                .filter(Boolean)
                .join(", ")
            : "—"}
        </dd>
        <dt>Reduced motion</dt>
        <dd data-on={reduced}>
          {reduced ? "on: still skeletons, instant reveals" : "off"}
        </dd>
      </dl>
    </Demo>
  );
};

// Loading for `ms` from mount and from every `start`
function useTimed(ms: number) {
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timeout);
  }, [loading, round, ms]);

  const start = () => {
    setRound((r) => r + 1);
    setLoading(true);
  };
  return { loading, round, start };
}

/* Images */

type Shot = { title: string; meta: string; image: string };

// A query of its own each load, so the images come over the network every time; the sample's stay put for the server render
const shots = (round: number, query?: number): Shot[] =>
  ["Launch week", "Offsite"].map((title, i) => ({
    title,
    meta: `${AUTHORS[i]![0]} · ${i + 2} photos`,
    image: `https://picsum.photos/seed/skullet-${round}-${i}/480/300${query === undefined ? "" : `?q=${query}`}`,
  }));

const Shots = ({ shots }: { shots: Shot[] }) => (
  <div className={styles.shots}>
    {shots.map((shot) => (
      <figure key={shot.image}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain image is what's measured */}
        <img src={shot.image} alt="" width={480} height={300} />
        <figcaption>
          <p className={styles.feedName}>{shot.title}</p>
          <p className={styles.feedMeta}>{shot.meta}</p>
        </figcaption>
      </figure>
    ))}
  </div>
);

export const Images = () => {
  const { loading, round, start } = useTimed(900);
  const [query, setQuery] = useState(() => Math.random());
  const load = () => {
    setQuery(Math.random());
    start();
  };

  return (
    <Demo
      controls={
        <Button onClick={load} disabled={loading}>
          Load with new images
        </Button>
      }
    >
      <div className={styles.frame}>
        <SkeletonReveal
          data={loading ? null : shots(round, query)}
          sample={shots(0)}
        >
          {(shots) => <Shots shots={shots} />}
        </SkeletonReveal>
      </div>
    </Demo>
  );
};

/* Changing size */

const BIOS = {
  short: "Builds skeletons.",
  long: "Builds the libraries behind the interface: skeletons, text morphs and the small motion details that hold a page together. Currently measuring every line of text on the page.",
};

export const Resizing = () => {
  const [bio, setBio] = useState<keyof typeof BIOS>("long");
  const [loading, setLoading] = useState(true);
  const { frame, moved } = useMovement(loading);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  const load = (next: keyof typeof BIOS) => {
    setBio(next);
    setLoading(true);
  };

  return (
    <Demo
      controls={
        <>
          <Button
            onClick={() => {
              load(bio === "short" ? "long" : "short");
            }}
            disabled={loading}
          >
            Load another
          </Button>
          <span
            className={styles.moved}
            data-jump={loading || moved === null ? undefined : moved !== 0}
          >
            {loading || moved === null
              ? "loading…"
              : moved === 0
                ? "no movement"
                : `eased ${moved > 0 ? "+" : ""}${moved}px`}
          </span>
        </>
      }
    >
      <div ref={frame} className={styles.frame}>
        <SkeletonReveal
          data={loading ? null : { ...PROFILES[0]!, bio: BIOS[bio] }}
          sample={PROFILES[0]!}
        >
          {(profile) => <ProfileCard profile={profile} />}
        </SkeletonReveal>
      </div>
    </Demo>
  );
};

/* States */

type Outcome = "content" | "empty" | "error";

const TEAM = AUTHORS.map(([name, team]) => ({ name, team }));

export const States = () => {
  const [outcome, setOutcome] = useState<Outcome>("content");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [loading, outcome]);

  const load = (next: Outcome) => {
    setOutcome(next);
    setLoading(true);
  };

  const done = !loading;
  return (
    <Demo
      controls={
        <>
          <Button onClick={() => load("content")} disabled={loading}>
            Load the team
          </Button>
          <Button onClick={() => load("empty")} disabled={loading}>
            Load an empty team
          </Button>
          <Button onClick={() => load("error")} disabled={loading}>
            Load an error
          </Button>
        </>
      }
    >
      <div className={styles.frame}>
        <SkeletonReveal
          data={
            loading || outcome === "error"
              ? null
              : outcome === "empty"
                ? []
                : TEAM
          }
          sample={TEAM}
          empty={done && outcome === "empty"}
          emptyMessage={
            <p className={styles.feedMeta}>No one on this team yet.</p>
          }
          error={
            done &&
            outcome === "error" && (
              <p className={styles.stateError}>
                Couldn’t load the team.{" "}
                <button onClick={() => load("content")}>Retry</button>
              </p>
            )
          }
        >
          {(team) => (
            <ul className={styles.team}>
              {team.map((member) => (
                <li key={member.name}>
                  <span className={styles.feedName}>{member.name}</span>
                  <span className={styles.feedMeta}>{member.team}</span>
                </li>
              ))}
            </ul>
          )}
        </SkeletonReveal>
      </div>
    </Demo>
  );
};

/* Hints */

const TAGS = ["Motion", "Type", "Systems"];

const Tagged = ({ hint }: { hint?: "skullet-block" | "skullet-ignore" }) => (
  <div className={styles.profile}>
    <span className={styles.avatar} data-hue={1} />
    <div>
      <p className={styles.feedName}>{PROFILES[1]!.name}</p>
      <p className={styles.feedMeta}>{PROFILES[1]!.role}</p>
    </div>
    <div className={styles.tags} {...(hint ? { [hint]: "" } : {})}>
      {TAGS.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  </div>
);

const HINTS = [
  {
    title: "Measured",
    hint: undefined,
    detail: "Each tag is a painted label, so each gets its own skeleton.",
  },
  {
    title: "skullet-block",
    hint: "skullet-block",
    detail: "The whole row is drawn as one block.",
  },
  {
    title: "skullet-ignore",
    hint: "skullet-ignore",
    detail: "The row keeps its space but draws nothing.",
  },
] as const;

export const Hints = () => {
  const [index, setIndex] = useState(0);
  const { hint, detail } = HINTS[index]!;

  return (
    <Demo
      controls={
        <SegmentedControl
          label="Hint"
          options={HINTS.map((_, i) => i)}
          value={index}
          onChange={setIndex}
          format={(i) => HINTS[i]!.title}
        />
      }
    >
      <p className={styles.demoNote}>{detail}</p>
      <div className={styles.frame}>
        <SkeletonReveal key={index} loading>
          <Tagged hint={hint} />
        </SkeletonReveal>
      </div>
    </Demo>
  );
};

/* Scoped themes */

const SCOPES = [
  {
    title: "Brand",
    detail: "Colours of its own.",
    style: themeVariables(
      {
        dark: {
          base: "rgb(47 111 237 / 0.28)",
          highlight: "rgb(150 190 255 / 0.3)",
        },
      },
      "dark",
    ),
  },
  {
    title: "Pills, pulsing",
    detail: "Round bars and a soft pulse.",
    style: themeVariables({ radius: "999px", animation: "pulse" }),
  },
  {
    title: "Warm, square, fast",
    detail: "Its own sweep, quickly.",
    style: themeVariables(
      {
        dark: {
          base: "rgb(255 122 89 / 0.2)",
          highlight: "rgb(255 206 68 / 0.25)",
        },
        radius: "2px",
        animation: "group-shimmer",
        speed: "fast",
      },
      "dark",
    ),
  },
];

export const ScopedThemes = () => {
  const [index, setIndex] = useState(0);
  const scope = SCOPES[index]!;

  return (
    <Demo
      controls={
        <SegmentedControl
          label="Theme"
          options={SCOPES.map((_, i) => i)}
          value={index}
          onChange={setIndex}
          format={(i) => SCOPES[i]!.title}
        />
      }
    >
      <p className={styles.demoNote}>{scope.detail}</p>
      <div className={styles.frame} style={scope.style as CSSProperties}>
        <SkeletonReveal key={index} loading>
          <ProfileCard profile={PROFILES[1]!} />
        </SkeletonReveal>
      </div>
    </Demo>
  );
};
