import { use, useState, useSyncExternalStore } from "react";
import { SkeletonReveal, SkeletonSuspense } from "skullet/react";

import styles from "./styles.module.scss";

type Quote = { text: string; author: string };

const QUOTES: Quote[] = [
  { text: "Nothing should move when it loads.", author: "Lochie Axon" },
  {
    text: "Make the wait feel shorter than it is.",
    author: "Jack Skellington",
  },
  {
    text: "Ship it, then make it feel right.",
    author: "Alex Vanderzon",
  },
];

const fetchQuote = (index: number) =>
  new Promise<Quote>((resolve) =>
    setTimeout(() => resolve(QUOTES[index % QUOTES.length]!), 850),
  );

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

export const QuoteDemo = () => {
  // A promise made while rendering on the server can't reach the browser,
  // so the quote is fetched once hydrated; until then, the same skeleton
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [index] = useState(0);
  const [quotes] = useState(() => new Map<number, Promise<Quote>>());
  const quoteFor = (i: number) => {
    if (!quotes.has(i)) quotes.set(i, fetchQuote(i));
    return quotes.get(i)!;
  };
  const sample = QUOTES[index % QUOTES.length]!;

  return (
    <div className={styles.frame}>
      {hydrated ? (
        <SkeletonSuspense
          key={index}
          skeleton={<QuoteCard quote={sample} />}
          label="Loading quote"
        >
          <LoadedQuote quote={quoteFor(index)} />
        </SkeletonSuspense>
      ) : (
        <SkeletonReveal data={null} sample={sample} label="Loading quote">
          {(quote) => <QuoteCard quote={quote} />}
        </SkeletonReveal>
      )}
    </div>
  );
};
