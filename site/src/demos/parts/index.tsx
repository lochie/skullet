import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";

import styles from "./styles.module.scss";
import { Avatar } from "@/components/avatar";

export const AUTHORS = [
  ["Lochie Axon", "Design engineering"],
  ["Alex Vanderzon", "Design"],
  ["Jack Skellington", "Product"],
  ["Pugson", "Design engineering"],
] as const;

export const Button = ({ children, ...props }: ComponentProps<"button">) => (
  <button className={styles.pill} {...props}>
    {children}
  </button>
);

export const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className={styles.toolbarField}>
    {label}
    {children}
  </div>
);

// How far a frame's height moved between its skeleton and the content that replaced it
export function useMovement(loading: boolean) {
  const frame = useRef<HTMLDivElement>(null);
  const before = useRef<number | null>(null);
  const [moved, setMoved] = useState<number | null>(null);

  useLayoutEffect(() => {
    const height = frame.current?.offsetHeight ?? 0;
    if (loading) {
      before.current = height;
      return;
    }
    if (before.current === null) return;
    const delta = height - before.current;
    before.current = null;
    // Measurement only — the result is what this effect exists to render
    setMoved(delta);
  }, [loading]);

  return { frame, moved };
}

export type Profile = { name: string; role: string; bio: string };

export const SAMPLE_PROFILE: Profile = {
  name: "Jack",
  role: "Design",
  bio: "A short bio.",
};

export const PROFILES: Profile[] = [
  {
    name: "Lochie Axon",
    role: "Design engineer",
    bio: "Builds the libraries behind the interface: skeletons, text morphs and the small motion details that hold a page together.",
  },
  {
    name: "Jack Skellington",
    role: "Designer",
    bio: "Sweats every interaction. Has strong opinions about easing curves and corner radii.",
  },
];

export const ProfileCard = ({ profile }: { profile: Profile }) => (
  <div className={styles.profile}>
    <Avatar name={profile.name} />
    <div>
      <p className={styles.feedName}>{profile.name}</p>
      <p className={styles.feedMeta}>{profile.role}</p>
    </div>
    <p className={styles.feedText}>{profile.bio}</p>
  </div>
);
