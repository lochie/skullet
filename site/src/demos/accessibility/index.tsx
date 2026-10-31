import { useEffect, useRef, useState } from "react";
import { Skeleton } from "skullet/react";

import styles from "./styles.module.scss";
import { Demo } from "@/components/demo";
import { ProfileCard, PROFILES, SAMPLE_PROFILE } from "../parts";

type Readout = {
  busy: boolean;
  status: string;
  hidden: boolean;
  inert: boolean;
};

const observeReadout = (frame: HTMLElement, onChange: (r: Readout) => void) => {
  const read = () => {
    const reveal = frame.querySelector("[skullet-reveal]");
    const loading = frame.querySelector(
      "[skullet-loading]:not([skullet-exiting] *)",
    );
    onChange({
      busy: reveal?.getAttribute("aria-busy") === "true",
      status: frame.querySelector("[skullet-status]")?.textContent ?? "",
      hidden: loading?.getAttribute("aria-hidden") === "true",
      inert: !!loading?.hasAttribute("inert"),
    });
  };
  read();
  const observer = new MutationObserver(read);
  observer.observe(frame, { subtree: true, childList: true, attributes: true });
  return () => observer.disconnect();
};

export const AccessibilityDemo = () => {
  const [loading, setLoading] = useState(true);
  const [readout, setReadout] = useState<Readout | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  useEffect(
    () =>
      frame.current ? observeReadout(frame.current, setReadout) : undefined,
    [],
  );

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Demo
      onClick={() => setLoading(true)}
      disabled={loading}
      hint="Click to reload"
    >
      <div ref={frame} className={styles.frame}>
        <Skeleton
          data={loading ? null : PROFILES[0]!}
          sample={SAMPLE_PROFILE}
          label="Loading profile"
        >
          {(profile) => <ProfileCard profile={profile} />}
        </Skeleton>
      </div>
      <dl className={styles.readout}>
        <dt>aria-busy</dt>
        <dd data-on={readout?.busy}>{readout?.busy ? "true" : "—"}</dd>
        <dt>Announced</dt>
        <dd data-on={!!readout?.busy}>
          {readout?.busy ? `“${readout.status}”` : "the content"}
        </dd>
        <dt>Skeleton</dt>
        <dd data-on={!!readout?.busy}>
          {readout?.busy
            ? [readout.inert && "inert", readout.hidden && "aria-hidden"]
                .filter(Boolean)
                .join(", ")
            : "—"}
        </dd>
        <dt>Reduced motion</dt>
        <dd data-on={reduced}>
          {reduced ? "on: still skeletons, instant reveals" : "off"}
        </dd>
      </dl>
    </Demo>
  );
};
