import { useEffect, useState } from "react";
import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { ProfileCard, PROFILES, useMovement } from "../parts";

const BIOS = {
  short: "Builds skeletons.",
  long: "Builds the libraries behind the interface: skeletons, text morphs and the small motion details that hold a page together. Currently measuring every line of text on the page.",
};

export const ResizingDemo = () => {
  const [bio, setBio] = useState<keyof typeof BIOS>("long");
  const [loading, setLoading] = useState(true);
  const { frame } = useMovement(loading);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  const load = (next: keyof typeof BIOS) => {
    setBio(next);
    setLoading(true);
  };

  return (
    <Demo
      onClick={() => {
        load(bio === "short" ? "long" : "short");
      }}
      disabled={loading}
      hint="Click to reload"
    >
      <div ref={frame} className={styles.frame}>
        <SkeletonReveal
          data={loading ? null : { ...PROFILES[0]!, bio: BIOS[bio] }}
          sample={PROFILES[0]!}
        >
          {(profile) => <ProfileCard profile={profile} />}
        </SkeletonReveal>
      </div>
    </Demo>
  );
};
