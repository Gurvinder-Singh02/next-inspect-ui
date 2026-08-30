import { defineConfig } from "tsup"

export default defineConfig([
  {
    // Browser runtime — the overlay itself.
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    // Keep React out of the bundle — it comes from the consumer's app.
    external: ["react", "react-dom"],
    // The inspector is a client component; bundlers strip the directive by
    // default, which breaks it in the Next App Router. Re-add it to the output.
    banner: {
      js: '"use client";',
    },
  },
  {
    // Build-time entries. These run in Node during `next dev` and must NOT
    // carry the "use client" banner — Babel would choke on it, and Turbopack
    // would treat the loader config as a client module.
    entry: {
      plugin: "src/plugin/with-inspect-ui.ts",
      "babel-stamp": "src/plugin/babel-stamp.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    platform: "node",
    external: ["@babel/core", "babel-loader"],
  },
])
