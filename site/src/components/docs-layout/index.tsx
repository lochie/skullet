import Link from "next/link";

import styles from "./styles.module.scss";
import { Footer } from "@/components/footer";
import { Mascot } from "@/components/mascot";
import { CHANGELOG_URL } from "@/utils/consts";

const NAV = [
  [
    "Skeletons",
    [
      ["/docs#data", "From data"],
      ["/docs#plain", "Plain children"],
      ["/docs#custom", "Your own skeleton"],
      ["/docs#hints", "Hints"],
      ["/docs#memory", "Memory"],
    ],
  ],
  [
    "Reveals",
    [
      ["/docs#reveals", "Reveal modes"],
      ["/docs#resizing", "Changing size"],
      ["/docs#own-reveal", "Your own reveal"],
      ["/docs#suspense", "Suspense"],
    ],
  ],
  ["Styling", [["/docs#theming", "Theming"]]],
  [
    "Reference",
    [
      ["/docs#server", "Server rendering"],
      ["/docs#accessibility", "Accessibility"],
      ["/docs#debug", "Debugging"],
      ["/docs#recipes", "Recipes"],
      ["/docs#troubleshooting", "Troubleshooting"],
      ["/docs#api", "API"],
      ["/docs#how", "How it works"],
      [CHANGELOG_URL, "Changelog"],
    ],
  ],
] as const;

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** The docs' pages: a sticky nav of the whole docs beside one column. */
export const DocsLayout = ({
  aside,
  sections,
  downloads,
  children,
}: {
  /** Room on the right of the text for a block that spans the main column, like the theme editor. */
  aside?: boolean;
  /** A page outside the docs lists its own sections first, like the lab. */
  sections?: readonly (readonly [id: string, title: string])[];
  downloads?: number;
  children: React.ReactNode;
}) => {
  return (
    <div className={styles.page} data-aside={aside}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.home}>
          <Mascot size={56} />
          <div className={styles.text}>
            <span className={styles.name}>Skullet</span>
            <span className={styles.tagline}>Smart skeleton states</span>
          </div>
        </Link>

        {sections && (
          <div className={styles.group}>
            {sections.map(([id, title]) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
          </div>
        )}

        {NAV.map(([heading, links]) => (
          <div key={heading} className={styles.group}>
            <h3>{heading}</h3>
            {links.map(([href, title]) =>
              href === CHANGELOG_URL ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {title}
                </a>
              ) : (
                <Link key={href} href={href}>
                  {title}
                </Link>
              ),
            )}
          </div>
        ))}

        {/* Shown once it's a number worth showing */}
        {downloads !== undefined && downloads > 10000 && (
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
