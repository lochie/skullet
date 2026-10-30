"use client";

import Link from "next/link";

import styles from "./styles.module.scss";
import { Callout } from "@/components/callout";
import { DocsLayout } from "@/components/docs-layout";
import { Section } from "@/components/section";
import { DebugToggle } from "./parts";
import { Live } from "./live";
import { Lists } from "./lists";
import { Wikipedia } from "./sources";
import {
  Animations,
  Images,
  Resizing,
  RevealModes,
  Suspense,
} from "./features";

const SECTIONS = [
  ["reveals", "Reveal modes"],
  ["images", "Images"],
  ["resizing", "Changing size"],
  ["lists", "Load more"],
  ["suspense", "Suspense"],
  ["animation", "Animation"],
  ["aave", "Live: Aave"],
  ["wikipedia", "Live: Wikipedia"],
] as const;

export const Playground = ({ downloads }: { downloads?: number }) => (
  <DocsLayout aside sections={SECTIONS} downloads={downloads}>
    <Section id="reveals" title="Reveal modes">
      <p>
        See <Link href="/docs#reveals">reveal modes</Link> in the docs.
      </p>

      <RevealModes />

      <Callout>
        <p>
          If data is ready immediately content is shown instantly. Otherwise,
          the skeleton is displayed until the content is ready.
        </p>
      </Callout>
    </Section>

    <Section id="images" title="Images">
      <p>
        {`The text reveals when ready, but each image will load independently with
        it's own skeleton until it's ready to display.`}
      </p>
      <Images />
    </Section>

    <Section id="resizing" title="Changing size">
      <p>
        When new data of a different length to the skeleton changes the height
        of the container the reveal will ease to it rather than snapping to
        size.
      </p>
      <Resizing />
    </Section>

    <Section id="lists" title="Load more">
      <p>
        A growing list has two shapes. One reveal per page leaves shown rows
        alone and holds the next page’s space with its skeleton. One reveal for
        the whole list redraws every row, and the new ones push what’s below.
      </p>
      <Lists />
    </Section>

    <Section id="suspense" title="Suspense">
      <p>
        <code>SkeletonSuspense</code> measures its fallback like any skeleton.
        Give it <code>skeleton</code>, the content rendered from sample data, or
        only an <code>id</code> to draw the shape it showed last time. On a
        first visit, that’s nothing.
      </p>
      <Suspense />
    </Section>

    <Section id="animation" title="Animation">
      <p>
        Every animation keeps one phase across the page, and a shimmer moves at
        the same pace on any screen.
      </p>
      <Animations />
    </Section>

    <Section id="wikipedia" title="Unknown data">
      <p>
        Each skeleton is drawn from the last data, the hardest case for a
        remembered shape.
      </p>
      <Wikipedia />
    </Section>
  </DocsLayout>
);
