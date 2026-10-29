import styles from "./styles.module.scss";

/** A docs section: an anchored heading over its prose, demos and code. */
export const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className={styles.section}>
    <h2>
      <a href={`#${id}`}>{title}</a>
    </h2>
    {children}
  </section>
);
