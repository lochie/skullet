import { GITHUB_URL } from "@/utils/consts";
import styles from "./styles.module.scss";

import Link from "next/link";

export const Nav = () => {
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href="/docs">Install</Link>
        </li>
        <li>
          <Link href="/docs#theming">Theming</Link>
        </li>
        <li>
          <Link href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </Link>
        </li>
      </ul>
    </nav>
  );
};
