// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonReveal } from "../Skeleton";

type User = { name: string };

describe("server rendering", () => {
  it("renders a loading skeleton from a sample", () => {
    const html = renderToString(
      <SkeletonReveal data={null as User | null} sample={{ name: "Ada" }}>
        {(user) => <p>{user.name}</p>}
      </SkeletonReveal>,
    );
    expect(html).toContain("skullet-loading");
    expect(html).toContain("<p>Ada</p>");
  });

  it("renders plain children and content", () => {
    expect(
      renderToString(
        <SkeletonReveal loading>
          <p>Loading</p>
        </SkeletonReveal>,
      ),
    ).toContain("skullet-ghost");
    expect(
      renderToString(
        <SkeletonReveal data={{ name: "Ada" }}>
          {(user: User) => <p>{user.name}</p>}
        </SkeletonReveal>,
      ),
    ).not.toContain("skullet-loading");
  });

  it("renders a bar", () => {
    expect(renderToString(<Skeleton />)).toContain("skullet-bar");
  });
});

describe("nonce", () => {
  it("is set on the inline script and the theme", async () => {
    const { SkulletProvider } = await import("../config");
    const html = renderToString(
      <SkulletProvider nonce="abc123" mode="dark">
        <SkeletonReveal loading>
          <p>Loading</p>
        </SkeletonReveal>
      </SkulletProvider>,
    );
    expect(html).toMatch(/<script nonce="abc123">/);
    expect(html).toMatch(/<style nonce="abc123">/);
    expect(html).toContain("inert");
  });
});
