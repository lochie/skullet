import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { bonesIn } from "@skele/test-cases";
import { SkeletonReveal } from "../Skeleton";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

it("hydrates a server-rendered skeleton without a mismatch, then measures it", () => {
  const ui = (
    <SkeletonReveal
      data={null as { name: string } | null}
      sample={{ name: "Ada Lovelace" }}
    >
      {(user) => <p style={{ margin: 0 }}>{user.name}</p>}
    </SkeletonReveal>
  );
  const container = document.body.appendChild(document.createElement("div"));
  container.innerHTML = renderToString(ui);
  const ghost = container.querySelector("[skele-ghost]");
  const height = container.offsetHeight;

  const error = vi.spyOn(console, "error");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  act(() => {
    root = hydrateRoot(container, ui);
  });

  expect(error).not.toHaveBeenCalled();
  expect(container.querySelector("[skele-ghost]")).toBe(ghost); // adopted, not re-rendered
  expect(bonesIn(container)).toHaveLength(1);
  expect(container.offsetHeight).toBe(height);
});
