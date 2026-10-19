import { createSSRApp, h, type App } from "vue";
import { renderToString } from "vue/server-renderer";
import { bonesIn } from "@skele/test-cases";
import { afterEach, expect, it, vi } from "vitest";
import { SkeletonReveal } from "../Skeleton";

let app: App | null = null;

afterEach(() => {
  app?.unmount();
  app = null;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

const create = () =>
  createSSRApp({
    render: () =>
      h(
        SkeletonReveal,
        { data: null, sample: { name: "Ada Lovelace" } },
        {
          default: ({ data }: { data: { name: string } }) =>
            h("p", { style: "margin: 0" }, data.name),
        },
      ),
  });

it("hydrates a server-rendered skeleton without a mismatch", async () => {
  const container = document.body.appendChild(document.createElement("div"));
  container.innerHTML = await renderToString(create());
  const ghost = container.querySelector("[skele-ghost]");

  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error");
  app = create();
  app.mount(container);

  const mismatches = warn.mock.calls.filter((call) =>
    String(call[0]).includes("Hydration"),
  );
  expect(mismatches).toEqual([]);
  expect(error).not.toHaveBeenCalled();
  expect(container.querySelector("[skele-ghost]")).toBe(ghost);
  expect(bonesIn(container)).toHaveLength(1);
});
