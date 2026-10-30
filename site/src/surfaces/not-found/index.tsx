"use client";

import styles from "./styles.module.scss";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/button";

export const NotFound = () => (
  <main className={styles.page}>
    <Mascot size={80} />
    <div className={styles.content}>
      <h1>Not found</h1>
      <p>Nothing here but bones.</p>
    </div>
    <Button href="/docs" variant="secondary">
      Go to the docs &rarr;
    </Button>
  </main>
);
