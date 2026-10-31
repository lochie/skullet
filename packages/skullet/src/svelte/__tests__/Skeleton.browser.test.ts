import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import Harness from "./Harness.svelte";
import Provided from "./Provided.svelte";
import Promised from "./Promised.svelte";
import {
  CASCADE_SPREAD,
  FADE_DURATION,
  forgetShapes,
  SKELETON_DELAY,
} from "../../lib";

const ADA = {
  name: "Ada Lovelace",
  bio: "Wrote the first algorithm meant to be carried out by a machine.",
};

let app: ReturnType<typeof mount> | null = null;

// Svelte holds an outgoing pane for the longest a smart reveal without images might take
const settle = () =>
  new Promise((resolve) =>
    setTimeout(resolve, SKELETON_DELAY + CASCADE_SPREAD + FADE_DURATION + 50),
  );

afterEach(() => {
  if (app) unmount(app);
  app = null;
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
});

describe("Svelte Skeleton", () => {
  it("crossfades from a measured skeleton to content without moving", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const target = document.body.appendChild(document.createElement("div"));
    app = mount(Harness, { target, props: { sample: ADA } });
    flushSync();

    const reveal = target.querySelector<HTMLElement>("[skullet-reveal]")!;
    expect(bonesIn(target).length).toBeGreaterThan(1);
    const before = reveal.offsetHeight;

    (app as { set: (user: typeof ADA) => void }).set(ADA);
    flushSync();
    expect(reveal.offsetHeight).toBe(before);

    await settle();
    expect(target.querySelectorAll("[skullet-pane]")).toHaveLength(1);
    expect(target.textContent).toContain("Ada Lovelace");
  });

  it("draws a reload from the data it last showed", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const target = document.body.appendChild(document.createElement("div"));
    app = mount(Harness, { target, props: {} });
    const harness = app as { set: (user: typeof ADA | null) => void };
    harness.set(ADA);
    flushSync();
    await settle();

    harness.set(null);
    flushSync();
    expect(target.querySelector("[skullet-ghost]")?.textContent).toContain(
      "Ada Lovelace",
    );
  });

  it("takes its theme, reveal and label from SkulletProvider", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const target = document.body.appendChild(document.createElement("div"));
    app = mount(Provided, { target, props: {} });
    flushSync();

    const reveal = target.querySelector<HTMLElement>("[skullet-reveal]")!;
    expect(reveal.getAttribute("aria-busy")).toBe("true");
    expect(target.querySelector("[skullet-status]")?.textContent).toBe(
      "Loading profile",
    );
    expect(getComputedStyle(bonesIn(target)[0]!).backgroundColor).toBe(
      "rgb(10, 20, 30)",
    );

    (app as { set: (user: { name: string }) => void }).set({
      name: "Ada Lovelace",
    });
    flushSync();
    expect(reveal.hasAttribute("aria-busy")).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const incoming = target.querySelector(
      "[skullet-pane]:not([skullet-exiting]) p",
    )!;
    expect(incoming.getAnimations().length).toBeGreaterThan(0); // cascading in
  });
});

describe("Svelte Skeleton with a promise", () => {
  it("loads while it's pending, then shows its value and calls onreveal", async () => {
    let resolve!: (user: typeof ADA) => void;
    const data = new Promise<typeof ADA>((done) => (resolve = done));
    const onreveal = vi.fn();
    const target = document.body.appendChild(document.createElement("div"));
    app = mount(Promised, { target, props: { data, sample: ADA, onreveal } });
    flushSync();
    expect(bonesIn(target).length).toBeGreaterThan(1);

    resolve(ADA);
    await data;
    flushSync();
    expect(target.textContent).toContain("Ada Lovelace");

    await settle();
    expect(onreveal).toHaveBeenCalledTimes(1);
  });

  it("shows the error a promise rejects with", async () => {
    const data = Promise.reject(new Error("offline"));
    data.catch(() => {});
    const target = document.body.appendChild(document.createElement("div"));
    app = mount(Promised, { target, props: { data, sample: ADA } });
    flushSync();
    await data.catch(() => {});
    flushSync();
    expect(target.textContent).toContain("Couldn’t load: Error: offline");
  });
});
