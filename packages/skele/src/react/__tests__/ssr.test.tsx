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
    expect(html).toContain("skele-loading");
    expect(html).toContain("<p>Ada</p>");
  });

  it("renders plain children and content", () => {
    expect(
      renderToString(
        <SkeletonReveal loading>
          <p>Loading</p>
        </SkeletonReveal>,
      ),
    ).toContain("skele-ghost");
    expect(
      renderToString(
        <SkeletonReveal data={{ name: "Ada" }}>
          {(user: User) => <p>{user.name}</p>}
        </SkeletonReveal>,
      ),
    ).not.toContain("skele-loading");
  });

  it("renders a bar", () => {
    expect(renderToString(<Skeleton />)).toContain("skele-bar");
  });
});

describe("nonce", () => {
  it("is set on the inline script and the theme", async () => {
    const { SkeleProvider } = await import("../config");
    const html = renderToString(
      <SkeleProvider nonce="abc123" mode="dark">
        <SkeletonReveal loading>
          <p>Loading</p>
        </SkeletonReveal>
      </SkeleProvider>,
    );
    expect(html).toMatch(/<script nonce="abc123">/);
    expect(html).toMatch(/<style nonce="abc123">/);
    expect(html).toContain("inert");
  });
});
