import { useEffect, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";

type Post = { title: string; excerpt: string; author: string; read: string };

const api = "https://api.adviceslip.com/";
const jokeApi = "https://icanhazdadjoke.com/";

const getRandomAdvice = async () => {
  // The API caches its slip for a couple of seconds; a fresh one per load
  const response = await fetch(`${api}advice`, { cache: "no-store" });
  const data = await response.json();
  return data.slip.advice;
};

const getRandomJoke = async () => {
  const response = await fetch(jokeApi, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  return data.joke;
};

const getRandomPost = async (): Promise<Post> => {
  const [advice, joke] = await Promise.all([
    getRandomAdvice(),
    getRandomJoke(),
  ]);
  return {
    title: advice,
    excerpt: joke,
    author: "Lochie Axon",
    read: "4 min read",
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
