import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync, mount, unmount } from "svelte";
import { createApp, h } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { forgetShapes, Reveal } from "..";
import { Skeleton as ReactSkeleton, SkeletonBox } from "../../react/Skeleton";
import { Skeleton as VueSkeleton } from "../../vue/Skeleton";
import Harness from "../../svelte/__tests__/Harness.svelte";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// document.getAnimations() leaves out animations on elements no longer in the document
let loops: Animation[] = [];
const running = () => loops.filter((loop) => loop.playState === "running");
const allStop = () =>
  expect.poll(() => running().length, { timeout: 3000 }).toBe(0);

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

const stage = () => {
  const element = document.body.appendChild(document.createElement("div"));
  element.style.width = "300px";
  return element;
};

const PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const LINES = "<p>One</p><p>Two</p><p>Three</p>";

beforeEach(() => {
  loops = [];
  const animate = Element.prototype.animate;
  vi.spyOn(Element.prototype, "animate").mockImplementation(function (
    this: Element,
    ...args: Parameters<Element["animate"]>
  ) {
    const animation = animate.apply(this, args);
    if (animation.effect?.getTiming().iterations === Infinity) {
      loops.push(animation);
    }
    return animation;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
});

describe("looping animations", () => {
  it.each(["shimmer", "group-shimmer", "pulse"])(
    "stop a %s when its skeleton leaves the document",
    async (animation) => {
      const root = stage();
      root.style.setProperty("--skullet-animation", animation);
      const reveal = new Reveal(root);
      reveal.load(html(LINES));
      expect(running().length).toBeGreaterThan(0);

      reveal.destroy();
      root.remove();
      await allStop();
    },
  );

  it("stop on bones dropped by a re-measure, and only those", async () => {
    const root = stage();
    const reveal = new Reveal(root);
    reveal.load(html(LINES));
    const before = bonesIn(root).length;

    root.querySelector("[skullet-ghost] p:last-child")!.remove();
    await expect.poll(() => bonesIn(root).length).toBeLessThan(before);

    await expect
      .poll(() => running().length, { timeout: 3000 })
      .toBe(bonesIn(root).length);
    reveal.destroy();
  });

  it("carry on through the fade-out, and stop once the pane is gone", async () => {
    const root = stage();
    const reveal = new Reveal(root, { reveal: "together" });
    reveal.load(html(LINES));
    const bones = running().length;

    reveal.show(html(LINES));
    expect(running().length).toBe(bones);

    await allStop();
    expect(root.querySelectorAll("[skullet-pane]")).toHaveLength(1);
    reveal.destroy();
  });

  it("stop on the bone standing in for an image once the image is ready", async () => {
    const root = stage();
    const reveal = new Reveal(root, { reveal: "together" });
    reveal.load(html(`<img width="40" height="40" src="${PIXEL}" />`));
    reveal.show(html(`<img width="40" height="40" src="${PIXEL}#next" />`));

    await expect
      .poll(() =>
        loops.some((loop) => {
          const target = (loop.effect as KeyframeEffect).target;
          return target?.parentElement === root;
        }),
      )
      .toBe(true);
    await allStop();
    reveal.destroy();
  });

  it("start again when a skeleton comes back to the document", async () => {
    const root = stage();
    const reveal = new Reveal(root);
    reveal.load(html(LINES));

    root.remove();
    await allStop();

    document.body.append(root);
    await expect.poll(() => running().length).toBeGreaterThan(0);
    reveal.destroy();
  });
});

describe("looping animations in the wrappers", () => {
  const SAMPLE = { name: "Ada Lovelace", bio: "Wrote the first algorithm." };

  it.each<[string, ReactNode]>([
    [
      "Skeleton",
      <ReactSkeleton key="s" loading data={null} sample={SAMPLE}>
        {(user: typeof SAMPLE) => <p>{user.name}</p>}
      </ReactSkeleton>,
    ],
    ["SkeletonBox", <SkeletonBox key="b" />],
  ])("stop when a React %s unmounts", async (_name, ui) => {
    const root = createRoot(stage());
    act(() => root.render(ui));
    expect(running().length).toBeGreaterThan(0);

    act(() => root.unmount());
    await allStop();
  });

  it("stop when a Vue Skeleton unmounts", async () => {
    const app = createApp({
      render: () =>
        h(
          VueSkeleton,
          { loading: true, data: null, sample: SAMPLE },
          {
            default: ({ data }: { data: typeof SAMPLE }) =>
              h("p", {}, data.name),
          },
        ),
    });
    app.mount(stage());
    await expect.poll(() => running().length).toBeGreaterThan(0);

    app.unmount();
    await allStop();
  });

  it("stop when a Svelte Skeleton unmounts", async () => {
    const app = mount(Harness, {
      target: stage(),
      props: { sample: SAMPLE },
    });
    flushSync();
    await expect.poll(() => running().length).toBeGreaterThan(0);

    await unmount(app);
    await allStop();
  });
});
