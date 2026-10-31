import { createApp, h, nextTick, ref, type App, type Ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { Skeleton } from "../Skeleton";
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
