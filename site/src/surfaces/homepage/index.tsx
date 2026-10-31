"use client";

import styles from "./styles.module.scss";

import { useState, useEffect } from "react";

import { Footer } from "@/components/footer";
import { CodeBlock } from "@/components/codeblock";
import { Demo } from "./demo";
import { Mascot } from "@/components/mascot";
import { Skeleton } from "skullet/react";
import { Nav } from "@/components/nav";

export const Homepage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Long enough to see the top of the page as a skeleton first
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Skeleton loading={loading}>
          <div className={styles.topbar}>
            <header className={styles.header}>
              <div className={styles.mascot}>
                <Mascot size={56} />
              </div>
              <h1>Skullet</h1>
              <p>Smart skeleton states</p>
            </header>
            <div className={styles.nav}>
              <Nav />
              <CodeBlock code="npm i skullet" />
            </div>
          </div>
        </Skeleton>

        <Demo />

        <Footer />
      </div>
    </div>
  );
};
