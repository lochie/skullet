import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { bonesIn } from "@skullet/test-cases";
import { afterEach, expect, it, vi } from "vitest";
import { Skeleton } from "../Skeleton";
import { INLINE_SCRIPT, INLINE_STUB, SKULLET_CSS } from "../../lib";
import { SkulletProvider } from "../config";

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

type User = { name: string };

const ui = (
  <Skeleton data={null as User | null} sample={{ name: "Ada Lovelace" }}>
    {(user) => (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <p style={{ margin: 0 }}>{user.name}</p>
        <span className="chip" style={{ padding: 4, background: "gold" }}>
          Follow
        </span>
      </div>
    )}
  </Skeleton>
);

it("draws a server-rendered skeleton's bones as the HTML is parsed, then hydrates onto them", async () => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.style.width = "400px";
  // skullet's script measures in the rendering step; an observer made after it runs right after it there, before the first paint
  frame.srcdoc = `<!doctype html><html><head><style>${SKULLET_CSS}</style></head><body>
<div id="root">${renderToString(ui)}</div>
<script>
  const layer = document.querySelector("[skullet-layer]");
  const after = new ResizeObserver(() => {
    after.disconnect();
    window.atParse = {
      bones: layer.shadowRoot ? layer.shadowRoot.children.length : 0,
      chip: getComputedStyle(document.querySelector(".chip")).visibility,
    };
  });
  after.observe(document.querySelector("[skullet-loading]"));
</script>
</body></html>`;
  await new Promise((resolve) =>
    frame.addEventListener("load", resolve, { once: true }),
  );
  const view = frame.contentWindow as Window & {
    atParse?: { bones: number; chip: string };
  };
  // Load can fire before the first rendering step, where the reading is taken
  await vi.waitFor(() => expect(view.atParse).toBeDefined());

  const doc = frame.contentDocument!;
  expect(view.atParse).toEqual({ bones: 2, chip: "hidden" });
  const drawn = bonesIn(doc);

  const error = vi.spyOn(console, "error");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  act(() => {
    root = hydrateRoot(doc.getElementById("root")!, ui);
  });

  expect(error).not.toHaveBeenCalled();
  expect(bonesIn(doc)).toEqual(drawn); // the same elements, measured again in place
});

it("sends the full script once a page under a provider — every skeleton after it a stub, all drawn by the first paint", async () => {
  const page = (
    <SkulletProvider>
      {ui}
      {ui}
      {ui}
    </SkulletProvider>
  );
  const html = renderToString(page);
  expect(html.split(INLINE_SCRIPT).length - 1).toBe(1);
  expect(html.split(INLINE_STUB).length - 1).toBe(2);

  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.style.width = "400px";
  frame.srcdoc = `<!doctype html><html><head><style>${SKULLET_CSS}</style></head><body>
<div id="root">${html}</div>
<script>
  const after = new ResizeObserver(() => {
    after.disconnect();
    window.atParse = [...document.querySelectorAll("[skullet-layer]")].map(
      (layer) => (layer.shadowRoot ? layer.shadowRoot.children.length : 0),
    );
  });
  after.observe(document.querySelectorAll("[skullet-loading]")[2]);
</script>
</body></html>`;
  await new Promise((resolve) =>
    frame.addEventListener("load", resolve, { once: true }),
  );
  const view = frame.contentWindow as Window & { atParse?: number[] };
  await vi.waitFor(() => expect(view.atParse).toBeDefined());
  expect(view.atParse).toEqual([2, 2, 2]);

  const error = vi.spyOn(console, "error");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  act(() => {
    root = hydrateRoot(frame.contentDocument!.getElementById("root")!, page);
  });
  expect(error).not.toHaveBeenCalled();
});

it("boots a stub that lands before the full script, once the full script arrives", async () => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.style.width = "400px";
  // Out of order, as streamed segments can land: a stub first, the full script after it
  const full = renderToString(ui);
  const stub = full.replace(INLINE_SCRIPT, INLINE_STUB);
  frame.srcdoc = `<!doctype html><html><head><style>${SKULLET_CSS}</style></head><body>
${stub}
${full}
</body></html>`;
  await new Promise((resolve) =>
    frame.addEventListener("load", resolve, { once: true }),
  );
  await vi.waitFor(() =>
    expect(
      [...frame.contentDocument!.querySelectorAll("[skullet-layer]")].map(
        (layer) => layer.shadowRoot?.children.length ?? 0,
      ),
    ).toEqual([2, 2]),
  );
});
