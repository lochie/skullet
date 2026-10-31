import { useEffect, useState } from "react";
import { Skeleton } from "skullet/react";

type User = { name: string; role: string };

const LOCHIE: User = { name: "Lochie Axon", role: "Design engineer" };

const load = () =>
  new Promise<User>((resolve) => setTimeout(() => resolve(LOCHIE), 1500));

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const reload = () => {
    setUser(null);
    load().then(setUser);
  };

  useEffect(reload, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        height: "100vh",
        fontFamily: "system-ui",
      }}
    >
      <Skeleton data={user} sample={LOCHIE}>
        {(user) => (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#ddd",
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div style={{ color: "#666" }}>{user.role}</div>
            </div>
          </div>
        )}
      </Skeleton>
      <button onClick={reload}>Reload</button>
    </div>
  );
}
