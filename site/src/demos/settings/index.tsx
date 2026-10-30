import { SkeletonReveal } from "skullet/react";

import styles from "./styles.module.scss";
import { useLoad } from "../parts/use-load";

type Setting = { label: string; hint: string; on: boolean };

const SETTINGS: Setting[] = [
  { label: "Mentions", hint: "When someone tags you", on: true },
  { label: "Pull requests", hint: "Reviews, merges and comments", on: true },
  { label: "Weekly digest", hint: "A summary every Monday", on: false },
];

export const SettingsDemo = () => {
  const settings = useLoad(SETTINGS, 700);

  return (
    <div>
      <SkeletonReveal
        data={settings}
        sample={SETTINGS}
        label="Loading settings"
      >
        {(settings) => (
          <ul className={styles.settings}>
            {settings.map((setting) => (
              <li key={setting.label}>
                <div className={styles.body}>
                  <span className={styles.from}>{setting.label}</span>
                  <span className={styles.label}>{setting.hint}</span>
                </div>
                <span className={styles.switch} data-on={setting.on}>
                  <span />
                </span>
              </li>
            ))}
          </ul>
        )}
      </SkeletonReveal>
    </div>
  );
};
