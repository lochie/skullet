import {
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type App,
  type Ref,
} from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { Skeleton } from "../Skeleton";
import { SkeletonSuspense } from "../Suspense";
import { FADE_DURATION, forgetShapes } from "../../lib";

type User = { name: string; bio: string };

const ADA: User = {
  name: "Ada Lovelace",
  bio: "Wrote the first algorithm meant to be carried out by a machine.",
};

let app: App | null = null;

const card = (user?: User | null) =>
  h("div", { style: "padding: 16px; border: 1px solid #ccc" }, [
    h("h3", { style: "margin: 0" }, user?.name),
    h("p", { style: "margin: 4px 0 0" }, user?.bio),
  ]);

function mount(render: () => ReturnType<typeof h>) {
  const container = document.body.appendChild(document.createElement("div"));
  container.style.width = "320px";
  app = createApp({ render });
  app.mount(container);
  return container;
}

const settle = () =>
  new Promise((resolve) => setTimeout(resolve, FADE_DURATION + 50));

afterEach(() => {
  app?.unmount();
  app = null;
  vi.restoreAllMocks();
  forgetShapes();
  document.body.replaceChildren();
});

describe("Vue Skeleton", () => {
  it("crossfades from a measured skeleton to content without moving", async () => {
    const user: Ref<User | null> = ref(null);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = mount(() =>
      h(
        Skeleton,
        { data: user.value, sample: ADA },
        { default: ({ data }: { data: User }) => card(data) },
      ),
    );
    const reveal = container.querySelector<HTMLElement>("[skullet-reveal]")!;

    expect(bonesIn(container).length).toBeGreaterThan(1);
    const before = reveal.offsetHeight;

    user.value = ADA;
    await nextTick();
    expect(reveal.offsetHeight).toBe(before);

    await settle();
    expect(container.querySelectorAll("[skullet-pane]")).toHaveLength(1);
    expect(container.textContent).toContain("Ada Lovelace");
  });

  it("draws plain children while loading", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const loading = ref(true);
    const container = mount(() =>
      h(Skeleton, { loading: loading.value }, () => card(null)),
    );

    expect(container.querySelector("[skullet-loading]")).not.toBeNull();
    loading.value = false;
    await nextTick();
    await settle();
    expect(container.querySelector("[skullet-loading]")).toBeNull();
  });
});

describe("Vue reveal event", () => {
  it("is emitted once content has come in over a skeleton", async () => {
    const user: Ref<User | null> = ref(null);
    const onReveal = vi.fn();
    mount(() =>
      h(
        Skeleton,
        { data: user.value, sample: ADA, onReveal },
        { default: ({ data }: { data: User }) => card(data) },
      ),
    );
    user.value = ADA;
    await nextTick();
    await settle();
    expect(onReveal).toHaveBeenCalledTimes(1);
  });
});

describe("Vue SkeletonSuspense", () => {
  it("measures its fallback, then crossfades into the content without moving", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    let resolve!: () => void;
    const ready = new Promise<void>((done) => (resolve = done));
    const Loaded = defineComponent({
      async setup() {
        await ready;
        return () => card(ADA);
      },
    });
    const onReveal = vi.fn();
    const container = mount(() =>
      h(
        SkeletonSuspense,
        { label: "Loading profile", onReveal },
        { default: () => h(Loaded), skeleton: () => card(ADA) },
      ),
    );
    await nextTick();
    const reveal = container.querySelector<HTMLElement>("[skullet-reveal]")!;
    expect(bonesIn(container).length).toBeGreaterThan(1);
    expect(reveal.getAttribute("aria-busy")).toBe("true");
    const before = reveal.offsetHeight;

    resolve();
    await ready;
    await nextTick();
    await nextTick();
    expect(container.textContent).toContain("Ada Lovelace");
    expect(reveal.hasAttribute("aria-busy")).toBe(false);
    expect(reveal.offsetHeight).toBe(before);

    await settle();
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("[skullet-pane]")).toHaveLength(1);
  });
});
