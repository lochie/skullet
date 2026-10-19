"use client";

import styles from "./styles.module.scss";

import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";

import { TextMorph } from "torph/react";

import { Footer } from "@/components/footer";
import { CodeBlock } from "@/components/codeblock";
import { Button } from "@/components/button";
import { InstallCommands } from "./install-cmd";
import { examples } from "./usage";
import { Demo } from "./demo";
import * as Logos from "./logos";

const frameworks = [
  {
    name: "React",
    imports: `import { SkeletonReveal } from 'skele/react'`,
    logo: <Logos.ReactLogo />,
    example: examples.react,
  },
  {
    name: "TypeScript",
    imports: `import { Reveal } from 'skele'`,
    logo: <Logos.TypeScriptLogo />,
    example: examples.vanilla,
  },
  {
    name: "Vue",
    imports: `import { SkeletonReveal } from 'skele/vue'`,
    logo: <Logos.VueLogo />,
    example: examples.vue,
  },
  {
    name: "Svelte",
    imports: `import { SkeletonReveal } from 'skele/svelte'`,
    logo: <Logos.SvelteLogo />,
    example: examples.svelte,
  },
];

export const Homepage = () => {
  const [frameworkIndex, setFrameworkIndex] = useState(0);
  const { trigger } = useWebHaptics();

  const framework = frameworks[frameworkIndex];
  const codeExample = `${framework.imports}

${framework.example}`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Demo />

        <section>
          <h3>Install</h3>
          <InstallCommands />
        </section>

        <section>
          <h3>Usage</h3>

          <div className={styles.example}>
            <div className={styles.controls}>
              {frameworks.map((f, i) => (
                <Button
                  key={f.name}
                  disabled={frameworkIndex === i}
                  onClick={() => {
                    trigger("selection");
                    setFrameworkIndex(i);
                  }}
                  aria-label={`View example for ${f.name}`}
                >
                  <span className={styles.logo}>{f.logo}</span>
                  <span className={styles.name}>{f.name}</span>
                </Button>
              ))}
            </div>

            <CodeBlock code={codeExample}>
              <TextMorph>{codeExample}</TextMorph>
            </CodeBlock>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};
