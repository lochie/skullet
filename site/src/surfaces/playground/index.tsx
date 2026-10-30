"use client";

import Link from "next/link";

import { Callout } from "@/components/callout";
import { DocsLayout } from "@/components/docs-layout";
import { Section } from "@/components/section";
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
  ["wikipedia", "Unknown data"],
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
          Under <code>smart</code>, data that lands within 150ms shows at once
          with no skeleton. Slower data keeps the skeleton until it’s ready.
        </p>
      </Callout>
    </Section>

    <Section id="images" title="Images">
      <p>
        Text reveals as soon as it’s ready. Each image keeps its own skeleton
        until it has loaded.
      </p>
      <Images />
    </Section>

    <Section id="resizing" title="Changing size">
      <p>
        New data of a different length changes the reveal’s height. The reveal
        eases to the new size rather than snapping.
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
        A random article each load. Each skeleton is drawn from the last
        article, the hardest case for a remembered shape.
      </p>
      <Wikipedia />
    </Section>
  </DocsLayout>
);
