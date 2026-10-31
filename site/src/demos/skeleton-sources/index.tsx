import { type ReactNode, useEffect, useState } from "react";
import { forgetShapes } from "skullet";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { SegmentedControl } from "@/components/segmented-control";
import {
  Button,
  Field,
  ProfileCard,
  PROFILES,
  SAMPLE_PROFILE,
  useMovement,
} from "../parts";

const Moved = ({
  moved,
  loading,
}: {
  moved: number | null;
  loading: boolean;
}) => (
  <span
    className={styles.moved}
    data-jump={loading || moved === null ? undefined : moved !== 0}
  >
    {loading || moved === null
      ? "loading…"
      : moved === 0
        ? "no movement"
        : `moved ${moved}px`}
  </span>
);

const SOURCES = [
  {
    key: "markup",
    title: "Markup",
    detail:
      "Plain children with a loading prop. The content is its own skeleton.",
  },
  {
    key: "auto",
    title: "Remembered by place",
    detail:
      "Mounted fresh with no id: the shape last seen at this spot on the page.",
  },
  {
    key: "id",
    title: "Remembered by id",
    detail:
      "Mounted fresh with an id: the shape saved under it, wherever it renders.",
  },
  {
    key: "last",
    title: "Last data",
    detail:
      "The same reveal loading again: drawn from the data it showed before.",
  },
] as const;

type SourceKey = (typeof SOURCES)[number]["key"];

const Source = ({
  source,
  round,
  loading,
}: {
  source: SourceKey;
  round: number;
  loading: boolean;
}) => {
  const profile = PROFILES[0]!;
  const data = loading ? null : profile;
  const { frame, moved } = useMovement(loading);

  let reveal: ReactNode;
  if (source === "markup") {
    reveal = (
      <Skeleton loading={loading}>
        <ProfileCard profile={profile} />
      </Skeleton>
    );
  } else if (source === "last") {
    reveal = (
      <Skeleton data={data} sample={SAMPLE_PROFILE}>
        {(profile) => <ProfileCard profile={profile} />}
      </Skeleton>
    );
  } else {
    // Keyed by the round, so each load is a reveal that has never shown anything
    reveal = (
      <Skeleton
        key={round}
        id={source === "id" ? "lab-profile" : undefined}
        data={data}
        sample={SAMPLE_PROFILE}
      >
        {(profile) => <ProfileCard profile={profile} />}
      </Skeleton>
    );
  }

  return (
    <>
      <div ref={frame} className={styles.frame}>
        {reveal}
      </div>
      <Moved moved={moved} loading={loading} />
    </>
  );
};

export const SkeletonSourcesDemo = () => {
  const [source, setSource] = useState<SourceKey>("markup");
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setRound((r) => r + 1);
    setLoading(true);
  };

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [loading, round]);

  const detail = SOURCES.find((s) => s.key === source)!.detail;

  return (
    <Demo
      hint="Click to reload"
      onClick={load}
      disabled={loading}
      controls={
        <>
          <Field label="Source">
            <SegmentedControl
              label="Source"
              options={SOURCES.map((s) => s.key)}
              value={source}
              onChange={setSource}
              format={(key) => SOURCES.find((s) => s.key === key)!.title}
            />
          </Field>
          <Button
            onClick={() => {
              forgetShapes();
              load();
            }}
            disabled={loading}
          >
            Forget shapes and load
          </Button>
        </>
      }
    >
      <p className={styles.demoNote}>{detail}</p>
      <Source key={source} source={source} round={round} loading={loading} />
    </Demo>
  );
};
