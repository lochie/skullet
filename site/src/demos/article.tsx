import { useEffect, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";

type Post = { title: string; excerpt: string; author: string; read: string };

const api = "https://en.wikipedia.org/api/rest_v1/page/random/summary";

const AUTHORS = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];

const pick = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)]!;

// Some extracts run to paragraphs: two sentences at most, to read as an excerpt
const excerpt = (text: string) =>
  text
    .match(/[^.!?]+[.!?]+(\s|$)/g)
    ?.slice(0, 2)
    .join("")
    .trim() ?? text;

const getRandomPost = async (): Promise<Post> => {
  const response = await fetch(api, { cache: "no-store" });
  const data = await response.json();

  return {
    title: data.title,
    excerpt: excerpt(data.extract),
    author: pick(AUTHORS),
    read: `${Math.floor(Math.random() * 10) + 1} min read`,
  };
};

const DELAY = 1000;

const SAMPLE: Post = {
  title: "Designing for the wait",
  excerpt:
    "Loading states are the first thing people see, and on a slow connection the thing they see most.",
  author: "John Doe",
  read: "4 min read",
};

export const ArticleDemo = () => {
  const [post, setPost] = useState<Post | null>(null);

  // A new post per mount, so a reload fetches again
  useEffect(() => {
    let current = true;
    // Never sooner than the delay, so a fast response still shows its skeleton, and the sample if the APIs fail
    Promise.all([
      getRandomPost().catch(() => SAMPLE),
      new Promise((resolve) => setTimeout(resolve, DELAY)),
    ]).then(([next]) => {
      if (current) setPost(next);
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className={styles.frame}>
      <SkeletonReveal data={post} sample={SAMPLE}>
        {(post) => (
          <article className={styles.article}>
            <div className={styles.cover} />
            <h4 className={styles.title}>{post.title}</h4>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <div className={styles.meta}>
              <span>{post.author}</span>
              <span>{post.read}</span>
            </div>
          </article>
        )}
      </SkeletonReveal>
    </div>
  );
};
