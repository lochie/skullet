import { use, useState, useSyncExternalStore } from "react";
import { Skeleton, SkeletonSuspense } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import { Button, Field } from "../parts";

type Quote = { text: string; author: string };

const QUOTES: Quote[] = [
  { text: "Nothing should move when it loads.", author: "Lochie Axon" },
  {
    text: "A loading state is the first impression. Design it like the rest of the product.",
    author: "Alex Vanderzon",
  },
  {
    text: "Make the wait feel shorter than it is.",
    author: "Jack Skellington",
  },
];

const QuoteCard = ({ quote }: { quote: Quote }) => (
  <figure className={styles.quote}>
    <blockquote>{quote.text}</blockquote>
    <figcaption>{quote.author}</figcaption>
  </figure>
);

// Suspends until its quote arrives — no loading state of its own
const LoadedQuote = ({ quote }: { quote: Promise<Quote> }) => (
  <QuoteCard quote={use(quote)} />
);

const subscribe = () => () => {};

const FALLBACKS = ["skeleton", "id"] as const;

type Fallback = (typeof FALLBACKS)[number];

const FALLBACK_LABELS: Record<Fallback, string> = {
  skeleton: "skeleton",
  id: "id only",
};

export const SuspenseDemo = () => {
  // A promise made on the server can't reach the browser: fetched once hydrated, the same skeleton until then
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [round, setRound] = useState(0);
  const [fallback, setFallback] = useState<Fallback>("skeleton");
  const [quotes] = useState(() => new Map<string, Promise<Quote>>());
  const quoteFor = (key: string) => {
    if (!quotes.has(key)) {
      quotes.set(
        key,
        new Promise((resolve) =>
          window.setTimeout(
            () => resolve(QUOTES[round % QUOTES.length]!),
            1400,
          ),
        ),
      );
    }
    return quotes.get(key)!;
  };

  return (
    <Demo
      controls={
        <>
          <Field label="Fallback">
            <SegmentedControl
              label="Fallback"
              options={FALLBACKS}
              value={fallback}
              onChange={setFallback}
              format={(option) => FALLBACK_LABELS[option]}
            />
          </Field>
          <Button onClick={() => setRound(round + 1)}>Suspend again</Button>
        </>
      }
    >
      <div className={styles.frame}>
        {!hydrated ? (
          <Skeleton data={null} sample={QUOTES[0]!} label="Loading quote">
            {(quote) => <QuoteCard quote={quote} />}
          </Skeleton>
        ) : fallback === "skeleton" ? (
          <SkeletonSuspense
            key={round}
            skeleton={<QuoteCard quote={QUOTES[0]!} />}
            label="Loading quote"
          >
            <LoadedQuote quote={quoteFor(`given-${round}`)} />
          </SkeletonSuspense>
        ) : (
          <SkeletonSuspense key={round} id="docs-quote" label="Loading quote">
            <LoadedQuote quote={quoteFor(`remembered-${round}`)} />
          </SkeletonSuspense>
        )}
      </div>
    </Demo>
  );
};
