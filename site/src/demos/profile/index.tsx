import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { TWITTER_INTENT } from "@/utils/consts";

type User = { name: string; handle: string };

const USER: User = { name: "Lochie Axon", handle: "@lochieaxon" };

export const ProfileDemo = () => {
  const user = useLoad(USER, 900);

  return (
    <div className={styles.card}>
      <SkeletonReveal data={user} sample={USER}>
        {(user) => (
          <div className={styles.cardInner}>
            <div className={styles.details}>
              <Avatar name={user.name} size={36} />
              <div className={styles.meta}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.handle}>{user.handle}</span>
              </div>
            </div>
            <div className={styles.follow}>
              <Button
                variant="secondary"
                href={TWITTER_INTENT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow
              </Button>
            </div>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
