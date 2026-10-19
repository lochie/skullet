import { SkeletonReveal } from "skele/react";

import styles from "./profile.module.scss";
import { useLoad } from "./use-load";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";

type User = { name: string; handle: string };

const USER: User = { name: "Lochie Axon", handle: "@lochieaxon" };

export const ProfileDemo = () => {
  const [user, reload] = useLoad(USER, 900);

  return (
    <div className={styles.card}>
      <SkeletonReveal data={user} sample={USER}>
        {(user) => (
          <div className={styles.cardInner}>
            <div className={styles.details}>
              <Avatar name={user.name} size={40} />
              <div className={styles.meta}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.handle}>{user.handle}</span>
              </div>
            </div>
            <div className={styles.follow}>
              <Button variant="secondary" disabled>
                Follow
              </Button>
            </div>
          </div>
        )}
      </SkeletonReveal>
    </div>
  );
};
