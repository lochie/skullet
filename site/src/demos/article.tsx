import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "./use-load";

type Post = { title: string; excerpt: string; author: string; read: string };

const POST: Post = {
  title: "Designing for the wait",
  excerpt:
    "Loading states are the first thing people see, and on a slow connection the thing they see most.",
  author: "Lochie Axon",
  read: "4 min read",
};

// Static here, so the first skeleton can be exact; a live app's last data and remembered shapes take over after
const SAMPLE = POST;

export const ArticleDemo = () => {
  const [post] = useLoad(POST, 1000);

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
