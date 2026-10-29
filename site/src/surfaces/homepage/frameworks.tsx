import { Button } from "@/components/button";
import { TextMorph } from "torph/react";
import { useState } from "react";
import styles from "./styles.module.scss";
import { useWebHaptics } from "web-haptics/react";
import { examples } from "./usage";
import * as Logos from "./logos";
import { CodeBlock } from "@/components/codeblock";

const frameworks = [
  {
    name: "React",
    imports: `import { SkeletonReveal } from 'skullet/react'`,
    logo: <Logos.ReactLogo />,
    example: examples.react,
  },
  {
    name: "TypeScript",
    imports: `import { Reveal } from 'skullet'`,
    logo: <Logos.TypeScriptLogo />,
    example: examples.vanilla,
  },
  {
    name: "Vue",
    imports: `import { SkeletonReveal } from 'skullet/vue'`,
    logo: <Logos.VueLogo />,
    example: examples.vue,
  },
  {
    name: "Svelte",
    imports: `import { SkeletonReveal } from 'skullet/svelte'`,
    logo: <Logos.SvelteLogo />,
    example: examples.svelte,
  },
];

export const Frameworks = () => {
  const [frameworkIndex, setFrameworkIndex] = useState(0);
  const { trigger } = useWebHaptics();

  const framework = frameworks[frameworkIndex];
  const codeExample = `${framework.imports}

${framework.example}`;
  return (
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
  );
};
