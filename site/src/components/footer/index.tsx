import styles from "./styles.module.scss";
import { AVATAR_URL, GITHUB_URL, TWITTER_URL } from "@/utils/consts";

import { version } from "./../../../../packages/skullet/package.json";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.credits}>
        Crafted for the web by
        <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">
          <img src={AVATAR_URL} alt="Avatar of Lochie" width={20} height={20} />
          Lochie
        </a>
      </div>
      <div className={styles.details}>
        <span>v{version}</span>
        {" • "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
};
