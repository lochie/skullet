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
    <header className={styles.header}>
      <h1>Playground</h1>
      <p>
        Every demo here runs the real library. Turn on the debug overlay to
        outline each reveal with where its skeleton came from and whether it
        moved.
      </p>
      <DebugToggle />
    </header>

    <Section id="reveals" title="Reveal modes">
      <p>
        The same feed under each <code>reveal</code>. Set the response to fast
        and <code>smart</code> shows no skeleton at all; refetch, and it
        crossfades over the data on screen.
      </p>
      <RevealModes />
      <p>
        See <Link href="/docs#reveals">reveal modes</Link> in the docs.
      </p>
    </Section>

    <Section id="images" title="Images">
      <p>
        Images take their own time. The text reveals on schedule, and each image
        still loading keeps its own bone until it has decoded.
      </p>
      <Images />
    </Section>

    <Section id="resizing" title="Changing size">
      <p>
        A reload draws its skeleton from the data on screen, so new data of a
        different length changes the height. The reveal eases to it rather than
        snapping, and still counts as a miss.
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
      <Callout>
        <p>
          Load more under each and compare the logs, or turn on the debug
          overlay.
        </p>
      </Callout>
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

    <Section id="aave" title="Live: Aave">
      <p>
        The largest reserves of each chain’s Aave market, from its public API.
        Switch chains, refetch over the data on screen, or forget shapes to see
        a first visit.
      </p>
      <Live />
      <Callout>
        <p>
          The log under each live demo records what the skeleton was drawn from
          and whether the reveal moved anything.
        </p>
      </Callout>
    </Section>

    <Section id="wikipedia" title="Live: Wikipedia">
      <p>
        A random article each load: a picture of any shape or none, one line of
        text or ten. Each skeleton is drawn from the last article, the hardest
        case for a remembered shape.
      </p>
      <Wikipedia />
    </Section>
  </DocsLayout>
);
