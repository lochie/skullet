import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

it("keeps a server-rendered skeleton's shape, but recalls one made on the client", async () => {
  const markup = `<div skele-loading><div skele-ghost><p>From the server</p></div></div>`;
  const server = document.body.appendChild(document.createElement("div"));
  server.innerHTML = markup;

  // Evaluated now, as it would be after the server's HTML has been parsed
  vi.resetModules();
  const { Ghost, Memory } = await import("..");

  const shown = document.body.appendChild(document.createElement("div"));
  shown.innerHTML = `<p>A remembered shape</p><p>two lines of it</p>`;
  new Memory(shown, { id: "served" }).destroy();

  const client = document.body.appendChild(document.createElement("div"));
  client.innerHTML = markup;

  const fromServer = server.firstElementChild as HTMLElement;
  const fromClient = client.firstElementChild as HTMLElement;
  new Ghost(fromServer, { id: "served" });
  new Ghost(fromClient, { id: "served" });

  expect(
    fromServer.querySelector("[skele-ghost]")!.hasAttribute("skele-inactive"),
  ).toBe(false);
  expect(
    fromClient.querySelector("[skele-ghost]")!.hasAttribute("skele-inactive"),
  ).toBe(true);
});

it("hides a painted chip's own colour from the first paint, without touching its markup", async () => {
  const { addStyles, Ghost, INLINE_SCRIPT } = await import("..");
  addStyles();
  const sheets = document.adoptedStyleSheets.length;
  const host = document.body.appendChild(document.createElement("div"));
  host.innerHTML = `<div skele-loading><div skele-ghost><span class="chip" style="display: inline-block; padding: 4px 8px; background: rgb(47 111 237)"><span>On</span></span></div><div skele-bones></div></div>`;
  const root = host.firstElementChild as HTMLElement;
  const script = document.createElement("script");
  script.textContent = INLINE_SCRIPT;
  root.after(script);

  const chip = host.querySelector(".chip")!;
  // Read where the first paint would: right after skele's own observer, in the same rendering step
  const firstPaint = await new Promise<string>((resolve) => {
    const after = new ResizeObserver(() => {
      after.disconnect();
      resolve(getComputedStyle(chip).visibility);
    });
    after.observe(root);
  });
  expect(firstPaint).toBe("hidden");
  expect(chip.hasAttribute("skele-covered")).toBe(false);

  new Ghost(root);
  expect(chip.hasAttribute("skele-covered")).toBe(true);
  expect(document.adoptedStyleSheets).toHaveLength(sheets);
});
