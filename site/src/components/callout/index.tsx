import styles from "./styles.module.scss";

export const Callout = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.container}>{children}</div>;
};
