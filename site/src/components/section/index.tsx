import { useEffect, useState } from "react";

import styles from "./styles.module.scss";
import { COPIED_FOR } from "@/utils/consts";

const Bone = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.5184 2.48166C12.3324 1.66756 13.627 1.64218 14.4098 2.42496C14.7293 2.74454 14.9116 3.14984 14.9631 3.57249C15.3857 3.62399 15.791 3.80621 16.1106 4.12579C16.8934 4.90857 16.868 6.2031 16.0539 7.01719C15.3407 7.73033 14.2588 7.83838 13.4753 7.32799L7.52039 13.2829C8.03079 14.0664 7.92274 15.1483 7.20959 15.8615C6.3955 16.6756 5.10098 16.701 4.31819 15.9182C3.99873 15.5987 3.8159 15.1937 3.76432 14.7712C3.34184 14.7196 2.93682 14.5368 2.61737 14.2174C1.83458 13.4346 1.85997 12.14 2.67406 11.326C3.3872 10.6128 4.4691 10.5048 5.25263 11.0152L11.2076 5.06023C10.6972 4.2767 10.8052 3.1948 11.5184 2.48166Z"
      fill="currentColor"
    />
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
