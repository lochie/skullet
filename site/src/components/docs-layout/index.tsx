import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

import styles from "./styles.module.scss";
import { Footer } from "@/components/footer";
import { Mascot } from "@/components/mascot";

const PAGES = [
  ["/docs", "Overview"],
  ["/docs#install", "Install"],
  ["/docs/playground", "Playground"],
] as const;

const GROUPS = [
  [
    "Skeletons",
    [
      ["data", "From data"],
      ["plain", "Plain children"],
      ["custom", "Your own skeleton"],
      ["hints", "Hints"],
      ["memory", "Memory"],
    ],
  ],
  [
    "Reveals",
    [
      ["reveals", "Reveal modes"],
      ["suspense", "Suspense"],
    ],
  ],
  ["Styling", [["theming", "Theming"]]],
  [
    "Reference",
    [
      ["server", "Server rendering"],
      ["accessibility", "Accessibility"],
      ["debug", "Debugging"],
      ["api", "API"],
      ["how", "How it works"],
    ],
  ],
] as const;

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** The docs' pages: a sticky nav of the whole docs beside one column. */
export const DocsLayout = ({
  wide,
  aside,
  sections,
  downloads,
  children,
}: {
  wide?: boolean;
  /** Keeps a column free on the right, for panels the page floats there. */
  aside?: boolean;
  /** This page's own sections, listed under its link. */
  sections?: readonly (readonly [id: string, title: string])[];
  downloads?: number;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  return (
    <div className={styles.page} data-wide={wide} data-aside={aside}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.home}>
          <Mascot size={48} />
          <span className={styles.name}>Skullet</span>
          <span className={styles.tagline}>Smart skeleton states</span>
        </Link>

        <div className={styles.group}>
          {PAGES.map(([href, title]) => (
            <Fragment key={href}>
              <Link href={href} data-active={href === pathname}>
                {title}
              </Link>
              {href === pathname &&
                sections?.map(([id, title]) => (
                  <a key={id} href={`#${id}`} className={styles.sub}>
                    {title}
                  </a>
                ))}
            </Fragment>
          ))}
        </div>

        {/* A page with no link of its own, like the lab, lists its sections on their own */}
        {!PAGES.some(([href]) => href === pathname) && sections && (
          <div className={styles.group}>
            {sections.map(([id, title]) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
          </div>
        )}

        {GROUPS.map(([heading, links]) => (
          <div key={heading} className={styles.group}>
            <h3>{heading}</h3>
            {links.map(([id, title]) => (
              <Link key={id} href={`/docs#${id}`}>
                {title}
              </Link>
            ))}
            {heading === "Reference" && (
              <a
                href="https://github.com/lochie/skullet/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                Changelog
              </a>
            )}
          </div>
        ))}

        {downloads !== undefined && (
          <span className={styles.downloads}>
            {compact.format(downloads)} downloads
          </span>
        )}
      </nav>

      <main className={styles.main}>
        {children}
        <Footer />
      </main>
    </div>
  );
};
