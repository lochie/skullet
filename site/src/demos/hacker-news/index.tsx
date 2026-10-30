import styles from "./styles.module.scss";
import { json, LiveSource } from "../parts/live-source";

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

export const HackerNewsDemo = () => (
  <LiveSource id="live-hn" load={loadStories} sample={STORIES}>
    {(stories) => <Stories stories={stories} />}
  </LiveSource>
);
