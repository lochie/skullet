import { useEffect, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { AUTHORS, Button } from "../parts";

type Outcome = "content" | "empty" | "error";

const TEAM = AUTHORS.map(([name, team]) => ({ name, team }));

export const States = () => {
  const [outcome, setOutcome] = useState<Outcome>("content");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [loading, outcome]);

  const load = (next: Outcome) => {
    setOutcome(next);
    setLoading(true);
  };

  const done = !loading;
  return (
    <Demo
      controls={
        <>
          <Button onClick={() => load("content")} disabled={loading}>
            Load the team
          </Button>
          <Button onClick={() => load("empty")} disabled={loading}>
            Load an empty team
          </Button>
          <Button onClick={() => load("error")} disabled={loading}>
            Load an error
          </Button>
        </>
      }
    >
      <div className={styles.frame}>
        <SkeletonReveal
          data={
            loading || outcome === "error"
              ? null
              : outcome === "empty"
                ? []
                : TEAM
          }
          sample={TEAM}
          empty={done && outcome === "empty"}
          emptyMessage={
            <p className={styles.feedMeta}>No one on this team yet.</p>
          }
          error={
            done &&
            outcome === "error" && (
              <p className={styles.stateError}>
                Couldn’t load the team.{" "}
                <button onClick={() => load("content")}>Retry</button>
              </p>
            )
          }
        >
          {(team) => (
            <ul className={styles.team}>
              {team.map((member) => (
                <li key={member.name}>
                  <span className={styles.feedName}>{member.name}</span>
                  <span className={styles.feedMeta}>{member.team}</span>
                </li>
              ))}
            </ul>
          )}
        </SkeletonReveal>
      </div>
    </Demo>
  );
};
