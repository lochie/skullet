import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "skullet/svelte": path.resolve(
        __dirname,
        "../../packages/skullet/src/svelte",
      ),
    },
  },
});
