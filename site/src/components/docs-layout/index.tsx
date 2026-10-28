import Link from "next/link";

import styles from "./styles.module.scss";
import { Footer } from "@/components/footer";
import { Mascot } from "@/components/mascot";

/** The docs' page: a sticky nav of the page's sections beside one column. */
export const DocsLayout = ({
  sections,
  wide,
  children,
}: {
  sections: readonly (readonly [id: string, title: string])[];
  wide?: boolean;
  children: React.ReactNode;
}) => (
  <div className={styles.page} data-wide={wide}>
    <nav className={styles.nav}>
      <Link href="/" className={styles.home}>
        <Mascot size={32} />
        Skullet
      </Link>
      {sections.map(([id, title]) => (
        <a key={id} href={`#${id}`}>
          {title}
        </a>
      ))}
    </nav>

    <main className={styles.main}>
      {children}
      <Footer />
    </main>
  </div>
);
