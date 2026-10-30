"use client";

import styles from "./styles.module.scss";

import { useState, useEffect } from "react";

import { Footer } from "@/components/footer";
import { CodeBlock } from "@/components/codeblock";
import { Demo } from "./demo";
import { Mascot } from "@/components/mascot";
import { SkeletonReveal } from "skullet/react";
import { Nav } from "@/components/nav";

export const Homepage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonReveal loading={loading}>
          <header className={styles.header}>
            <div className={styles.mascot}>
              <Mascot size={56} />
            </div>
            <h1>Skullet</h1>
            <p>Smart skeleton states</p>

            <Nav />

            <CodeBlock code="npm i skullet" />
          </header>
        </SkeletonReveal>

        <Demo />

        <Footer />
      </div>
    </div>
  );
};
