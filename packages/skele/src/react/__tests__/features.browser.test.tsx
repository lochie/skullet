import { act, Suspense, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { bonesIn } from "@skele/test-cases";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkeleProvider } from "../config";
import { SkeletonReveal } from "../Skeleton";
import { SkeletonSuspense } from "../Suspense";
import {
  CASCADE_SPREAD,
  FADE_DURATION,
  forgetShapes,
  setDebug,
} from "../../lib";

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

const wait = (ms: number) =>
  act(() => new Promise((resolve) => setTimeout(resolve, ms)));

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  setDebug(false);
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
  document.documentElement.removeAttribute("skele-xray");
});

type User = { name: string; bio: string };
const ADA: User = {
  name: "Ada Lovelace",
  bio: "Wrote the first algorithm meant to be carried out by a machine.",
};

const Card = ({ user }: { user: User }) => (
  <div style={{ padding: 16 }}>
    <h3 style={{ margin: 0 }}>{user.name}</h3>
    <p style={{ margin: "4px 0 0" }}>{user.bio}</p>
  </div>
);

const reveal = () => container.querySelector<HTMLElement>("[skele-reveal]")!;

describe("accessibility", () => {
  it("is busy while loading, with its label read in the skeleton's place", async () => {
    const ui = (user: User | null) => (
      <SkeletonReveal data={user} sample={ADA} label="Loading profile">
        {(u) => <Card user={u} />}
      </SkeletonReveal>
    );
    render(ui(null));

    expect(reveal().getAttribute("aria-busy")).toBe("true");
    const status = container.querySelector("[skele-status]")!;
    expect(status.textContent).toBe("Loading profile");
    expect(status.closest("[aria-hidden]")).toBeNull();
    expect(
      container.querySelector("[skele-loading]")!.hasAttribute("inert"),
    ).toBe(true);

    render(ui(ADA));
    expect(reveal().hasAttribute("aria-busy")).toBe(false);
  });
});

describe("sequence", () => {
  it("brings content in top to bottom as the bones go", async () => {
    const ui = (user: User | null) => (
      <SkeleProvider reveal="sequence">
        <SkeletonReveal data={user} sample={ADA}>
          {(u) => <Card user={u} />}
        </SkeletonReveal>
      </SkeleProvider>
    );
    render(ui(null));
    const bones = bonesIn(container);
    render(ui(ADA));
    await wait(0);

    const delays = (elements: Element[]) =>
      elements.map((element) => {
        // Not the shimmer, which loops forever
        const timing = element
          .getAnimations()
          .map((animation) => animation.effect?.getTiming())
          .find((t) => t && t.iterations !== Infinity);
        return Number(timing?.delay ?? -1);
      });

    const incoming = container.querySelector(
      "[skele-pane]:not([skele-exiting])",
    )!;
    const content = [...incoming.querySelectorAll("h3, p")];
    const [title, body] = delays(content);
    expect(title).toBeGreaterThanOrEqual(0);
    expect(body).toBeGreaterThan(title!);

    const boneDelays = delays(bones);
    expect(boneDelays.every((delay) => delay >= 0)).toBe(true);
    expect(Math.max(...boneDelays)).toBeGreaterThan(Math.min(...boneDelays));

    await wait(CASCADE_SPREAD + FADE_DURATION + 50);
    expect(container.querySelectorAll("[skele-pane]")).toHaveLength(1);
  });
});

describe("theme", () => {
  it("colours bones from the provider, through their shadow root", () => {
    render(
      <SkeleProvider
        mode="dark"
        theme={{
          light: { base: "rgb(1, 2, 3)", highlight: "white" },
          dark: { base: "rgb(10, 20, 30)", highlight: "white" },
        }}
      >
        <SkeletonReveal loading>
          <Card user={ADA} />
        </SkeletonReveal>
      </SkeleProvider>,
    );

    const bone = bonesIn(container)[0]!;
    expect(getComputedStyle(bone).backgroundColor).toBe("rgb(10, 20, 30)");
  });
});

describe("debug", () => {
  it("outlines a reveal with its source, then whether it moved", async () => {
    setDebug(true);
    const ui = (user: User | null) => (
      <SkeletonReveal data={user} sample={ADA}>
        {(u) => <Card user={u} />}
      </SkeletonReveal>
    );
    render(ui(null));
    await wait(32);

    const overlay = [...document.body.children].find((element) =>
      element.shadowRoot?.querySelector(".boxes"),
    )!;
    const label = () =>
      overlay.shadowRoot!.querySelector(".label")?.textContent;
    expect(label()).toBe("skeleton · sample");

    render(ui(ADA));
    await wait(32);
    expect(label()).toBe("✓ no movement · sample");

    overlay.shadowRoot!.querySelector<HTMLInputElement>(".xray")!.click();
    expect(document.documentElement.hasAttribute("skele-xray")).toBe(true);
  });
});

describe("SkeletonSuspense", () => {
  it("measures its fallback, then crossfades into the content without moving", async () => {
    let resolve!: () => void;
    let ready = false;
    const promise = new Promise<void>((done) => {
      resolve = () => {
        ready = true;
        done();
      };
    });
    const Profile = () => {
      if (!ready) throw promise;
      return <Card user={ADA} />;
    };

    // Crossfaded, to see the copy it leaves — smart would swap this fast load instantly
    render(
      <SkeleProvider reveal="together">
        <SkeletonSuspense
          skeleton={<Card user={ADA} />}
          label="Loading profile"
        >
          <Profile />
        </SkeletonSuspense>
      </SkeleProvider>,
    );
    expect(bonesIn(container).length).toBeGreaterThan(1);
    expect(reveal().getAttribute("aria-busy")).toBe("true");
    const height = reveal().offsetHeight;

    await act(async () => {
      resolve();
      await promise;
    });

    expect(container.textContent).toContain("Ada Lovelace");
    expect(reveal().hasAttribute("aria-busy")).toBe(false);
    expect(reveal().offsetHeight).toBe(height);
    expect(container.querySelectorAll("[skele-exiting]")).toHaveLength(1);

    await wait(FADE_DURATION * 2 + 50);
    expect(container.querySelectorAll("[skele-exiting]")).toHaveLength(0);
  });

  it("works inside an app's own Suspense too", () => {
    render(
      <Suspense fallback="outer">
        <SkeletonSuspense skeleton={<Card user={ADA} />}>
          <Card user={ADA} />
        </SkeletonSuspense>
      </Suspense>,
    );
    expect(container.textContent).toContain("Ada Lovelace");
  });
});
