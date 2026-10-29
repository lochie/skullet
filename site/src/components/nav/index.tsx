import styles from "./styles.module.scss";

import Link from "next/link";

export const Nav = () => {
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href="/docs#install">Usage</Link>
        </li>
        <li>
          <Link href="/docs/playground">Playground</Link>
        </li>
        <li>
          <Link href="/docs#theming">Theming</Link>
        </li>
      </ul>
    </nav>
  );
};
