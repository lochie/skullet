import { useEffect, useState } from "react";

import styles from "./styles.module.scss";

const COPIED_FOR = 1500;

const Bone = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
    <g transform="rotate(-45 12 12)" fill="currentColor">
      <rect x="6" y="10" width="12" height="4" rx="1" />
      <circle cx="6" cy="9.5" r="2.5" />
      <circle cx="6" cy="14.5" r="2.5" />
      <circle cx="18" cy="9.5" r="2.5" />
      <circle cx="18" cy="14.5" r="2.5" />
    </g>
  </svg>
);

/** A docs section: an anchored heading over its prose, demos and code. */
export const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), COPIED_FOR);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = () => {
    const url = new URL(`#${id}`, location.href).href;
    history.replaceState(null, "", `#${id}`);
    navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => {},
    );
  };

  return (
    <section id={id} className={styles.section}>
      <h2>
        <a href={`#${id}`}>{title}</a>
      </h2>
      <button
        type="button"
        className={styles.anchor}
        onClick={copy}
        aria-label={`Copy link to ${title}`}
        data-copied={copied || undefined}
      >
        <Bone />
        <span className={styles.copied} aria-live="polite">
          {copied ? "Copied" : ""}
        </span>
      </button>
      {children}
    </section>
  );
};
