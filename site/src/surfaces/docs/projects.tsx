import { useEffect, useState } from "react";
import { TextMorph } from "torph/react";

import styles from "./projects.module.scss";

const WORDS = ["Torph", "Text Morph", "TextMorph"];

const Morphing = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(
      () => setIndex((i) => (i + 1) % WORDS.length),
      1800,
    );
    return () => window.clearInterval(interval);
  }, []);
  return (
    <span className={styles.word}>
      <TextMorph>{WORDS[index]!}</TextMorph>
    </span>
  );
};

const Tap = () => (
  <span className={styles.tap}>
    <i />
    <i />
  </span>
);

// The curve the dot rides: cubic-bezier(0.2, 0, 0, 1), drawn in a 100×60 box
const Curve = () => (
  <span className={styles.curve}>
    <svg viewBox="0 0 100 60" aria-hidden>
      <path d="M 0 60 C 20 60, 0 0, 100 0" />
    </svg>
    <i />
  </span>
);

const PROJECTS = [
  {
    name: "Torph",
    href: "https://torph.lochie.me",
    description: "An opinionated text morphing library.",
    preview: <Morphing />,
  },
  {
    name: "Web Haptics",
    href: "https://haptics.lochie.me",
    description: "Haptic feedback for interactions on the web.",
    preview: <Tap />,
  },
  {
    name: "Easing",
    href: "https://easing.dev",
    description: "Explore easing curves for your projects.",
    preview: <Curve />,
  },
];

export const Projects = () => (
  <div className={styles.projects}>
    {PROJECTS.map((project) => (
      <a
        key={project.name}
        href={project.href}
        className={styles.card}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.preview} aria-hidden>
          {project.preview}
        </span>
        <span className={styles.name}>{project.name}</span>
        <span className={styles.description}>{project.description}</span>
      </a>
    ))}
  </div>
);
