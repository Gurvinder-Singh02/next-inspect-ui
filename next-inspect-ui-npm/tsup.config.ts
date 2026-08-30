import { defineConfig } from "tsup"

export default defineConfig([
  {
    // Browser runtime. `index` is a lazy shim so production builds never
    // download the overlay; the real component arrives as a split chunk via
    // a development-only dynamic import. `lib` carries the pure helpers for
    // tooling surfaces (the website's fixture matrix, the settings toolbar).
    entry: { index: "src/index.ts", lib: "src/lib.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    // Dynamic imports must stay dynamic in the ESM output or the shim would
    // pull the overlay back into the entry and defeat its own purpose.
    splitting: true,
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
