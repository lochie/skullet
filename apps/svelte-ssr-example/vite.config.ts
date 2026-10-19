import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "skele/svelte": path.resolve(
        __dirname,
        "../../packages/skele/src/svelte",
      ),
    },
  },
});
