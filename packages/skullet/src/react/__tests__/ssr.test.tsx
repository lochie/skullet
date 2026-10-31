// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SkeletonBox, Skeleton } from "../Skeleton";

type User = { name: string };

describe("server rendering", () => {
  it("renders a loading skeleton from a sample", () => {
    const html = renderToString(
      <Skeleton data={null as User | null} sample={{ name: "Ada" }}>
        {(user) => <p>{user.name}</p>}
      </Skeleton>,
    );
    expect(html).toContain("skullet-loading");
    expect(html).toContain("<p>Ada</p>");
  });

  it("renders plain children and content", () => {
    expect(
      renderToString(
        <Skeleton loading>
          <p>Loading</p>
        </Skeleton>,
      ),
    ).toContain("skullet-ghost");
    expect(
      renderToString(
        <Skeleton data={{ name: "Ada" }}>
          {(user: User) => <p>{user.name}</p>}
        </Skeleton>,
      ),
    ).not.toContain("skullet-loading");
  });

  it("renders a bar", () => {
    expect(renderToString(<SkeletonBox />)).toContain("skullet-bar");
  });
});

describe("nonce", () => {
  it("is set on the inline script and the theme", async () => {
    const { SkulletProvider } = await import("../config");
    const html = renderToString(
      <SkulletProvider nonce="abc123" mode="dark">
        <Skeleton loading>
          <p>Loading</p>
        </Skeleton>
      </SkulletProvider>,
    );
    expect(html).toMatch(/<script nonce="abc123">/);
    expect(html).toMatch(/<style nonce="abc123">/);
    expect(html).toContain("inert");
  });
});
