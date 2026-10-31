// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Skeleton } from "../Skeleton";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type User = { name: string };

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

// No layout, no ResizeObserver, no Web Animations, no canvas: what most component tests run in
describe("in jsdom", () => {
  it("loads, reveals and reloads without an error", async () => {
    const errors = vi.spyOn(console, "error");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
    const onReveal = vi.fn();
    const ui = (user: User | null) => (
      <Skeleton data={user} sample={{ name: "Sample" }} onReveal={onReveal}>
        {(user) => <p>{user.name}</p>}
      </Skeleton>
    );
    const busy = () =>
      container.querySelector("[skullet-reveal]")!.getAttribute("aria-busy");

    act(() => root!.render(ui(null)));
    expect(busy()).toBe("true");

    act(() => root!.render(ui({ name: "Ada" })));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(container.textContent).toContain("Ada");
    expect(container.querySelectorAll("[skullet-pane]")).toHaveLength(1);
    expect(onReveal).toHaveBeenCalledTimes(1);

    act(() => root!.render(ui(null)));
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(busy()).toBe("true");
    expect(errors).not.toHaveBeenCalled();
  });
});
