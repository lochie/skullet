import { defineConfig, type Options } from "tsup";
import type { PluginBuild } from "esbuild";

const aliasCorePlugin = {
  name: "alias-core",
  setup(build: PluginBuild) {
    build.onResolve({ filter: /^\.\.\/lib$/ }, () => ({
      path: "skele",
      external: true,
    }));
  },
};

export default defineConfig((options) => {
  const configs: Options[] = [
    // Core
    {
      entry: {
        index: "src/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      clean: true,
      target: "es2022",
      treeshake: true,
      minify: !options.watch,
    },
    // React
    {
      entry: {
        "react/index": "src/react/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      target: "es2022",
      // No rollup treeshake pass — it strips the "use client" banner
      external: ["react", "react/jsx-runtime"],
      esbuildPlugins: [aliasCorePlugin],
      minify: !options.watch,
      banner: { js: '"use client";' },
    },
    // Vue
    {
      entry: {
        "vue/index": "src/vue/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      target: "es2022",
      treeshake: true,
      external: ["vue"],
      esbuildPlugins: [aliasCorePlugin],
      minify: !options.watch,
    },
    // Svelte - DTS build (from types.ts only)
    {
      entry: {
        "svelte/index": "src/svelte/types.ts",
      },
      format: ["cjs", "esm"],
      dts: {
        only: true,
      },
      external: ["svelte"],
    },
  ];

  return configs;
});
