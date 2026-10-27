import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createApp, h, nextTick, ref } from "vue";
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { forgetShapes, Reveal } from "..";
import { SkeletonReveal as ReactReveal } from "../../react";
import { SkeletonReveal as VueReveal } from "../../vue/Skeleton";
import Harness from "../../svelte/__tests__/Harness.svelte";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const frames = async (count = 3) => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const ADA = {
  name: "Ada Lovelace",
  bio: "Wrote the first algorithm meant to be carried out by a machine.",
};

/** A reveal near the top, and enough below it to scroll past it. */
function page() {
  document.body.style.margin = "0";
  const top = document.body.appendChild(document.createElement("div"));
  top.style.width = "320px";
  const below = document.body.appendChild(document.createElement("div"));
  below.style.height = "4000px";
  below.textContent = "Below the reveal, where the browser anchors scrolling";
  return top;
}

async function scrolledDown() {
  await frames();
  scrollTo(0, 120);
  await frames();
  return scrollY;
}

afterEach(() => {
  scrollTo(0, 0);
  forgetShapes();
  document.body.replaceChildren();
});

// The reveal's content, inserted while its skeleton was still in flow, used to
// push what's below down for one layout — and scroll anchoring scrolled to follow
describe("a reveal doesn't scroll the page", () => {
  it("in React", async () => {
    const container = page();
    const root = createRoot(container);
    const ui = (user: typeof ADA | null) =>
      createElement(ReactReveal<typeof ADA>, {
        data: user,
        sample: ADA,
        children: (u: typeof ADA) => createElement("p", null, u.bio),
      });
    act(() => root.render(ui(null)));
    const before = await scrolledDown();

    act(() => root.render(ui(ADA)));
    await frames();
    expect(scrollY).toBe(before);
    act(() => root.unmount());
  });

  it("in Vue", async () => {
    const container = page();
    const user = ref<typeof ADA | null>(null);
    const app = createApp({
      render: () =>
        h(
          VueReveal,
          { data: user.value, sample: ADA },
          { default: ({ data }: { data: typeof ADA }) => h("p", data.bio) },
        ),
    });
    app.mount(container);
    const before = await scrolledDown();

    user.value = ADA;
    await nextTick();
    await frames();
    expect(scrollY).toBe(before);
    app.unmount();
  });

  it("in Svelte", async () => {
    const container = page();
    const app = mount(Harness, { target: container, props: { sample: ADA } });
    flushSync();
    const before = await scrolledDown();

    (app as { set: (user: typeof ADA) => void }).set(ADA);
    flushSync();
    await frames();
    expect(scrollY).toBe(before);
    unmount(app);
  });

  it("in vanilla", async () => {
    const container = page();
    const reveal = new Reveal(container);
    const content = () => {
      const p = document.createElement("p");
      p.textContent = ADA.bio;
      return p;
    };
    reveal.load(content());
    const before = await scrolledDown();

    reveal.show(content());
    await frames();
    expect(scrollY).toBe(before);
    reveal.destroy();
  });
});
