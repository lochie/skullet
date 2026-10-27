// @vitest-environment node
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { expect, it } from "vitest";
import { SkeletonReveal } from "../Skeleton";

it("renders a loading skeleton on the server", async () => {
  const app = createSSRApp({
    render: () =>
      h(
        SkeletonReveal,
        { data: null, sample: { name: "Ada" } },
        {
          default: ({ data }: { data: { name: string } }) => h("p", data.name),
        },
      ),
  });
  const html = await renderToString(app);
  expect(html).toContain("skullet-loading");
  expect(html).toContain("<p>Ada</p>");
});

it("sets the provider's nonce and theme on the server", async () => {
  const { SkulletProvider } = await import("../config");
  const app = createSSRApp({
    render: () =>
      h(SkulletProvider, { nonce: "abc123", mode: "dark" }, () =>
        h(SkeletonReveal, { loading: true, label: "Loading" }, () =>
          h("p", "Ada"),
        ),
      ),
  });
  const html = await renderToString(app);
  expect(html).toContain('<script nonce="abc123">');
  expect(html).toContain('<style nonce="abc123">');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("inert");
  expect(html).toContain("skullet-status");
});
