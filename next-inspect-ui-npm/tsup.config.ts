import { defineConfig } from "tsup"

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  splitting: true,
  external: ["react", "react-dom"],
}

export default defineConfig([
  {
    ...shared,
    // Browser runtime. `index` is a lazy shim so production builds never
    // download the overlay; the real component arrives as a split chunk via
    // a development-only dynamic import. `lib` carries the pure helpers for
    // tooling surfaces (the website's fixture matrix, the settings toolbar).
    entry: { index: "src/index.ts", lib: "src/lib.ts" },
    clean: true,
    banner: {
      js: '"use client";',
    },
  },
  {
    ...shared,
    // Overlay engine for the debug package. No `"use client"` banner — the
    // barrel is functions and types. tsup runs this array in parallel, so this
    // entry must not clean.
    entry: { overlay: "src/overlay.ts" },
    clean: false,
  },
])
