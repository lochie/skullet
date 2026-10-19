import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "skele/vue": path.resolve(__dirname, "../../packages/skele/src/vue"),
    },
  },
});
