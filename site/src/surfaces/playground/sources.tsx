/* eslint-disable @next/next/no-img-element -- plain images, so the skeleton measures them as such */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { forgetShapes } from "skullet";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";

type Logged = { source: string; width: number; height: number };

/**
 * One live API behind a reveal: load another (a new shape, drawn from the last
 * one), refetch over the data on screen, or forget remembered shapes. Every
 * reveal is measured, and the log says what its skeleton was drawn from.
 */
function LiveSource<T>({
  id,
  load,
  sample,
  children,
}: {
  id: string;
  load: (round: number) => Promise<T>;
  sample: T;
  children: (data: T) => React.JSX.Element;
}) {
  const [round, setRound] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Logged[]>([]);
  const requests = useRef(0);

  const request = useCallback(
    (next: number) => {
      const request = ++requests.current;
      load(next)
        .then((value) => {
          if (request === requests.current) setData(value);
        })
        .catch((reason: Error) => {
          if (request === requests.current) setError(reason.message);
        })
        .finally(() => {
          if (request === requests.current) setFetching(false);
        });
    },
    [load],
  );

  const start = (next: number, keep: boolean) => {
    setRound(next);
    if (!keep) setData(null);
    setFetching(true);
    setError(null);
    request(next);
  };

  // The first load; the buttons start their own from the click
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => request(0), []);

  // Sizes the skeleton as drawn, then the content that replaced it — any difference is a jump
  const frame = useRef<HTMLDivElement>(null);
  const skeleton = useRef<Logged | null>(null);
  const shown = useRef(false);
  const loading = fetching || (!data && !error);

  useLayoutEffect(() => {
    const reveal =
      frame.current?.querySelector<HTMLElement>("[skullet-reveal]");
    if (!reveal) return;

    if (loading) {
      const recalled = reveal.querySelector(
        "[skullet-snapshot]:not([skullet-inactive]) *",
      );
      skeleton.current = {
        source: data
          ? "data on screen"
          : shown.current
            ? "last data"
            : recalled
              ? "remembered shape"
              : "sample",
        width: reveal.offsetWidth,
        height: reveal.offsetHeight,
      };
      return;
    }

    shown.current = true;
    if (!skeleton.current) return;
    const before = skeleton.current;
    skeleton.current = null;
    // Measurement only — the log is what this effect exists to render
    setLog((entries) =>
      [
        {
          source: before.source,
          width: reveal.offsetWidth - before.width,
          height: reveal.offsetHeight - before.height,
        },
        ...entries,
      ].slice(0, 4),
    );
  }, [loading, data]);

  return (
    <Demo
      controls={
        <div className={styles.actions}>
          <button onClick={() => start(round + 1, false)} disabled={loading}>
            Load another
          </button>
          <button onClick={() => start(round, true)} disabled={loading}>
            Refetch, keeping data
          </button>
          <button onClick={() => forgetShapes()}>Forget shapes</button>
        </div>
      }
    >
      <div ref={frame} className={styles.liveFrame}>
        <SkeletonReveal
          id={id}
          data={data}
          sample={sample}
          loading={loading}
          error={
            error && (
              <div className={styles.error}>
                Couldn’t load: {error}
                <button onClick={() => start(round, false)}>Retry</button>
              </div>
            )
          }
        >
          {children}
        </SkeletonReveal>
      </div>

      <div className={styles.sourceLog}>
        {log.length ? (
          log.map((entry, i) => (
            <div key={i} data-jump={entry.width !== 0 || entry.height !== 0}>
              <span>{entry.source}</span>
              <span>
                {entry.width === 0 && entry.height === 0
                  ? "no movement"
                  : `moved ${entry.width} × ${entry.height}px`}
              </span>
            </div>
          ))
        ) : (
          <div>
            <span>Waiting for the first reveal…</span>
          </div>
        )}
      </div>
    </Demo>
  );
}

const json = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${response.status} from ${new URL(url).host}`);
  return response.json() as Promise<T>;
};

/* Wikipedia: a random article — with or without a picture of any shape, one line of text or ten */

type Article = {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
};

const ARTICLE: Article = {
  title: "Skeleton screen",
  description: "Placeholder shown while content loads",
  extract:
    "A skeleton screen is a blank version of a page into which information is gradually loaded, giving people a sense of the layout before the content arrives.",
};

// The article each round landed on, so a refetch fetches that one again rather than another
const articles = new Map<number, string>();

const loadArticle = async (round: number) => {
  const title = articles.get(round);
  const article = await json<Article & { titles: { canonical: string } }>(
    title
      ? `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      : "https://en.wikipedia.org/api/rest_v1/page/random/summary",
  );
  articles.set(round, article.titles.canonical);
  return article;
};

const ArticleCard = ({ article }: { article: Article }) => (
  <article className={styles.wiki}>
    {article.thumbnail && (
      <img
        src={article.thumbnail.source}
        alt=""
        width={article.thumbnail.width}
        height={article.thumbnail.height}
      />
    )}
    <div>
      <h4>{article.title}</h4>
      {article.description && (
        <p className={styles.feedMeta}>{article.description}</p>
      )}
      <p className={styles.feedText}>{article.extract}</p>
    </div>
  </article>
);

export const Wikipedia = () => (
  <LiveSource id="live-wikipedia" load={loadArticle} sample={ARTICLE}>
    {(article) => <ArticleCard article={article} />}
  </LiveSource>
);

/* Hacker News: the front page, a page at a time — titles of any length, a site or none */

type Story = {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  descendants?: number;
};

const PER_PAGE = 6;

const STORIES: Story[] = Array.from({ length: PER_PAGE }, (_, i) => ({
  id: i,
  title: "Show HN: A skeleton loader that measures what’s coming",
  url: "https://example.com",
  score: 120,
  by: "someone",
  descendants: 42,
}));

const loadStories = async (round: number) => {
  const ids = await json<number[]>(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  );
  const page = ids.slice(
    (round * PER_PAGE) % ids.length,
    ((round * PER_PAGE) % ids.length) + PER_PAGE,
  );
  return Promise.all(
    page.map((id) =>
      json<Story>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
    ),
  );
};

const site = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const Stories = ({ stories }: { stories: Story[] }) => (
  <ol className={styles.stories}>
    {stories.map((story) => (
      <li key={story.id}>
        <p>
          <span className={styles.feedName}>{story.title}</span>
          {site(story.url) && (
            <span className={styles.feedMeta}> ({site(story.url)})</span>
          )}
        </p>
        <p className={styles.feedMeta}>
          {story.score} points by {story.by} · {story.descendants ?? 0} comments
        </p>
      </li>
    ))}
  </ol>
);

export const HackerNews = () => (
  <LiveSource id="live-hn" load={loadStories} sample={STORIES}>
    {(stories) => <Stories stories={stories} />}
  </LiveSource>
);

/* The Met: artworks from its open-access collection — some with no image, titles and credits of any length */

type Artwork = {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  primaryImageSmall: string;
};

const ARTWORKS: Artwork[] = Array.from({ length: 4 }, (_, i) => ({
  objectID: i,
  title: "Portrait of a Woman",
  artistDisplayName: "Unknown artist",
  objectDate: "ca. 1650",
  primaryImageSmall: "",
}));

const SEARCHES = ["portrait", "teapot", "armor", "landscape", "cat"];

// A search and a page per round — far apart, and the same again on a refetch
const loadArtworks = async (round: number) => {
  const q = SEARCHES[round % SEARCHES.length]!;
  const { objectIDs } = await json<{ objectIDs: number[] | null }>(
    `https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&q=${q}&offset=${(round * 4) % 40}&limit=4`,
  );
  return Promise.all(
    (objectIDs ?? []).map((id) =>
      json<Artwork>(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      ),
    ),
  );
};

const Artworks = ({ artworks }: { artworks: Artwork[] }) => (
  <div className={styles.artworks}>
    {artworks.map((artwork) => (
      <figure key={artwork.objectID}>
        {artwork.primaryImageSmall ? (
          <img
            src={artwork.primaryImageSmall}
            alt=""
            width={400}
            height={500}
          />
        ) : (
          <div className={styles.noImage}>No image</div>
        )}
        <figcaption>
          <p className={styles.feedName}>{artwork.title}</p>
          {artwork.artistDisplayName && (
            <p className={styles.feedMeta}>{artwork.artistDisplayName}</p>
          )}
          {artwork.objectDate && (
            <p className={styles.feedMeta}>{artwork.objectDate}</p>
          )}
        </figcaption>
      </figure>
    ))}
  </div>
);

export const Met = () => (
  <LiveSource id="live-met" load={loadArtworks} sample={ARTWORKS}>
    {(artworks) => <Artworks artworks={artworks} />}
  </LiveSource>
);

/* GitHub: React's open issues, a page at a time — titles of any length, any number of labels */

type Issue = {
  id: number;
  number: number;
  title: string;
  comments: number;
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
};

const ISSUES: Issue[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  number: 30000 + i,
  title: "Bug: something renders twice when it shouldn’t",
  comments: 3,
  user: { login: "someone", avatar_url: "" },
  labels: [{ id: 1, name: "Status: Unconfirmed", color: "d4c5f9" }],
}));

const loadIssues = (round: number) =>
  json<Issue[]>(
    `https://api.github.com/repositories/10270250/issues?per_page=5&page=${round + 1}`,
  );

const Issues = ({ issues }: { issues: Issue[] }) => (
  <ul className={styles.issues}>
    {issues.map((issue) => (
      <li key={issue.id}>
        {issue.user.avatar_url ? (
          <img
            src={`${issue.user.avatar_url}&s=48`}
            alt=""
            width={24}
            height={24}
          />
        ) : (
          <span className={styles.issueAvatar} />
        )}
        <div>
          <p className={styles.feedName}>{issue.title}</p>
          {issue.labels.length > 0 && (
            <div className={styles.labels}>
              {issue.labels.map((label) => (
                <span
                  key={label.id}
                  style={{
                    color: `#${label.color}`,
                    background: `#${label.color}22`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          <p className={styles.feedMeta}>
            #{issue.number} by {issue.user.login} · {issue.comments} comments
          </p>
        </div>
      </li>
    ))}
  </ul>
);

export const GitHub = () => (
  <LiveSource id="live-github" load={loadIssues} sample={ISSUES}>
    {(issues) => <Issues issues={issues} />}
  </LiveSource>
);
