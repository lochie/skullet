import styles from "./styles.module.scss";
import { Avatar } from "@/components/avatar";
import { json, LiveSource } from "../parts/live-source";

type Issue = {
  id: number;
  number: number;
  title: string;
  comments: number;
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
};

const ISSUES: Issue[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  number: 30000 + i,
  title: "Bug: something renders twice when it shouldn’t",
  comments: 3,
  user: { login: "someone", avatar_url: "" },
  labels: [{ id: 1, name: "Status: Unconfirmed", color: "d4c5f9" }],
}));

const loadIssues = (round: number) =>
  json<Issue[]>(
    `https://api.github.com/repositories/10270250/issues?per_page=5&page=${round + 1}`,
  );

const Issues = ({ issues }: { issues: Issue[] }) => (
  <ul className={styles.issues}>
    {issues.map((issue) => (
      <li key={issue.id}>
        <Avatar
          name={issue.user.login}
          src={issue.user.avatar_url && `${issue.user.avatar_url}&s=48`}
          size={24}
        />
        <div>
          <p className={styles.feedName}>{issue.title}</p>
          {issue.labels.length > 0 && (
            <div className={styles.labels}>
              {issue.labels.map((label) => (
                <span
                  key={label.id}
                  style={{
                    color: `#${label.color}`,
                    background: `#${label.color}22`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          <p className={styles.feedMeta}>
            #{issue.number} by {issue.user.login} · {issue.comments} comments
          </p>
        </div>
      </li>
    ))}
  </ul>
);

export const GitHubDemo = () => (
  <LiveSource id="live-github" load={loadIssues} sample={ISSUES}>
    {(issues) => <Issues issues={issues} />}
  </LiveSource>
);
