import { act, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { Skeleton, SkeletonReveal } from "../Skeleton";
import { FADE_DURATION, forgetShapes } from "../../lib";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement;

function render(ui: ReactNode) {
  if (!root) {
    container = document.body.appendChild(document.createElement("div"));
    container.style.width = "320px";
    root = createRoot(container);
  }
  act(() => root!.render(ui));
}

function unmount() {
  act(() => root?.unmount());
  root = null;
}

const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, FADE_DURATION + 50)));

const reveal = () => container.querySelector<HTMLElement>("[skullet-reveal]")!;
const panes = () => container.querySelectorAll("[skullet-pane]");
const bones = () => bonesIn(container);

afterEach(() => {
  unmount();
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
});

type User = { name: string; bio: string };

const ADA: User = {
  name: "Ada Lovelace",
  bio: "Wrote the first algorithm meant to be carried out by a machine, a century early.",
};
// Shaped exactly like the real thing; filler of the same length can wrap differently
const SAMPLE: User = { ...ADA };

const Card = ({ user }: { user?: User | null }) => (
  <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
    <h3 style={{ margin: 0 }}>{user?.name}</h3>
    <p style={{ margin: "4px 0 0" }}>{user?.bio}</p>
  </div>
);

describe("SkeletonReveal", () => {
  it("shows content on mount without a skeleton or a fade", () => {
    render(
      <SkeletonReveal>
        <Card user={ADA} />
      </SkeletonReveal>,
    );

    expect(panes()).toHaveLength(1);
    expect(bones()).toHaveLength(0);
    expect(container.textContent).toContain("Ada Lovelace");
  });

  it("crossfades from a skeleton of its own, rather than swapping it out at once", async () => {
    const custom = (loading: boolean) => (
      <SkeletonReveal
        loading={loading}
        skeleton={<Skeleton width={80} height={80} />}
      >
        <p>Hello there</p>
      </SkeletonReveal>
    );
    render(custom(true));
    await settle();
    render(custom(false));
    // Mid-fade: the skeleton is still leaving, the content still arriving
    await act(
      () => new Promise((resolve) => setTimeout(resolve, FADE_DURATION / 3)),
    );
    expect(panes()).toHaveLength(2);
    const content = [...panes()].find(
      (pane) => pane.textContent === "Hello there",
    )!;
    expect(+getComputedStyle(content).opacity).toBeLessThan(1);
    await settle();
    expect(panes()).toHaveLength(1);
  });

  it("renders no inline script on the client — that's for server HTML", () => {
    const error = vi.spyOn(console, "error");
    render(
      <SkeletonReveal loading>
        <Card user={ADA} />
      </SkeletonReveal>,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it("measures its children into bones while loading", () => {
    render(
      <SkeletonReveal loading>
        <Card user={ADA} />
      </SkeletonReveal>,
    );

    expect(container.querySelector("[skullet-loading]")).not.toBeNull();
    expect(bones().length).toBeGreaterThanOrEqual(3); // name, then the bio's lines
  });

  it("doesn't move when content replaces a skeleton of the same shape", () => {
    render(
      <SkeletonReveal data={null as User | null} sample={SAMPLE}>
        {(user) => <Card user={user} />}
      </SkeletonReveal>,
    );
    const before = reveal().offsetHeight;

    render(
      <SkeletonReveal data={ADA} sample={SAMPLE}>
        {(user) => <Card user={user} />}
      </SkeletonReveal>,
    );
    expect(reveal().offsetHeight).toBe(before);
  });

  it("draws a reload from the data it last showed", () => {
    const ui = (user: User | null) => (
      <SkeletonReveal data={user}>{(u) => <Card user={u} />}</SkeletonReveal>
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(ui(ADA));
    const shown = reveal().offsetHeight;
    render(ui(null));

    const ghost = container.querySelector("[skullet-ghost]");
    expect(ghost?.textContent).toContain("Ada Lovelace");
    expect(reveal().offsetHeight).toBe(shown);
  });

  it("reveals a reload drawn from the last data as a new load, a refetch as a quick crossfade", async () => {
    const ui = (user: User | null, loading = false) => (
      <SkeletonReveal data={user} loading={loading}>
        {(u) => <Card user={u} />}
      </SkeletonReveal>
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const wait = () =>
      act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    const arriving = () =>
      container
        .querySelector("[skullet-pane]:not([skullet-exiting])")!
        .getAnimations()
        .map((animation) => animation.effect!.getTiming().duration);

    render(ui(ADA));
    await settle();
    render(ui(null));
    await wait();
    render(ui(ADA));
    expect(arriving()).toEqual([FADE_DURATION]);

    await settle();
    render(ui(ADA, true));
    await wait();
    render(ui(ADA));
    expect(arriving()[0]).toBeLessThan(FADE_DURATION);
  });

  it("draws from the last data only for the same id", () => {
    const ui = (id: string, user: User | null) => (
      <SkeletonReveal id={id} data={user} sample={SAMPLE}>
        {(u) => (
          <Card user={{ ...u, name: u === SAMPLE ? "Sample" : u.name }} />
        )}
      </SkeletonReveal>
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(ui("first", ADA));
    render(ui("second", null));
    expect(container.querySelector("[skullet-ghost]")?.textContent).toContain(
      "Sample",
    );
  });

  it("remembers a shape across visits under an id", () => {
    const ui = (user: User | null) => (
      <SkeletonReveal id="profile" data={user}>
        {(u) => <Card user={u} />}
      </SkeletonReveal>
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(ui(ADA));
    const shown = reveal().offsetHeight;
    unmount();
    forgetShapes({ persisted: false }); // a fresh visit: only storage is left

    render(ui(null));
    expect(
      container.querySelector("[skullet-snapshot]")?.textContent,
    ).not.toContain("Ada");
    expect(reveal().offsetHeight).toBe(shown);
  });

  it("suggests a sample, shaped from the first data it sees", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SkeletonReveal id="suggest" data={null as User | null}>
        {(user) => <Card user={user} />}
      </SkeletonReveal>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Nothing to draw a skeleton from"),
    );

    render(
      <SkeletonReveal id="suggest" data={ADA}>
        {(user) => <Card user={user} />}
      </SkeletonReveal>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`sample={{"name":"Xxx Xxxxxxxx"`),
    );
  });

  it("finds the shape plain children left, with no id", () => {
    const ui = (user: User | null) => (
      <SkeletonReveal loading={!user}>
        <Card user={user} />
      </SkeletonReveal>
    );

    render(ui(ADA));
    const shown = reveal().offsetHeight;
    render(ui(null));
    expect(reveal().offsetHeight).toBe(shown);
  });

  it("crossfades, then drops the skeleton", async () => {
    render(
      <SkeletonReveal loading>
        <Card user={ADA} />
      </SkeletonReveal>,
    );
    render(
      <SkeletonReveal loading={false}>
        <Card user={ADA} />
      </SkeletonReveal>,
    );

    expect(panes()).toHaveLength(2);
    await settle();
    expect(panes()).toHaveLength(1);
    expect(bones()).toHaveLength(0);
  });

  it("exits one pane per change under StrictMode", async () => {
    const ui = (loading: boolean) => (
      <StrictMode>
        <SkeletonReveal loading={loading}>
          <Card user={ADA} />
        </SkeletonReveal>
      </StrictMode>
    );

    render(ui(true));
    render(ui(false));
    expect(panes()).toHaveLength(2);
    await settle();
    expect(panes()).toHaveLength(1);
  });

  it("swaps in a child's own skeleton", () => {
    const Avatar = () => <img alt="" width={40} height={40} />;
    Avatar.Skeleton = function AvatarSkeleton() {
      return <Skeleton width={40} height={40} radius="50%" />;
    };

    render(
      <SkeletonReveal loading>
        <div>
          <Avatar />
        </div>
      </SkeletonReveal>,
    );

    expect(
      container.querySelector("[skullet-own] [skullet-bar]"),
    ).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps a child's own skeleton over a remembered shape", async () => {
    const Avatar = () => <img alt="" width={40} height={40} />;
    Avatar.Skeleton = function AvatarSkeleton() {
      return <Skeleton width={40} height={40} radius="50%" />;
    };
    const ui = (loading: boolean) => (
      <SkeletonReveal loading={loading}>
        <header>
          <div>
            <Avatar />
          </div>
          <h1>Ada Lovelace</h1>
        </header>
      </SkeletonReveal>
    );

    render(ui(true));
    render(ui(false));
    await settle();
    // A visit to another page and back: the header's shape is remembered
    unmount();
    render(ui(true));
    await act(() => new Promise(requestAnimationFrame));

    expect(
      container.querySelector(
        "[skullet-ghost]:not([skullet-inactive]) [skullet-own] [skullet-bar]",
      ),
    ).not.toBeNull();
  });

  it("shows error over empty over content", () => {
    render(
      <SkeletonReveal empty emptyMessage="Nothing yet" error="Failed">
        <Card user={ADA} />
      </SkeletonReveal>,
    );
    expect(container.textContent).toBe("Failed");
  });
});
