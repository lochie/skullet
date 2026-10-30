/* eslint-disable @next/next/no-img-element -- plain images, so the skeleton measures them as such */
import styles from "./styles.module.scss";
import { json, LiveSource } from "../parts/live-source";

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

export const WikipediaDemo = () => (
  <LiveSource id="live-wikipedia" load={loadArticle} sample={ARTICLE}>
    {(article) => <ArticleCard article={article} />}
  </LiveSource>
);
