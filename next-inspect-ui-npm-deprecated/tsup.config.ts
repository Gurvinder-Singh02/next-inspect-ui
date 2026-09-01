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
    entry: { index: "src/index.ts" },
    clean: true,
    banner: {
      js: '"use client";',
    },
  },
  {
    ...shared,
    // tsup runs this array in parallel, so a second clean would wipe index.
    entry: { lib: "src/lib.ts" },
    clean: false,
  },
  {
    ...shared,
    // Overlay engine for the debug package. No `"use client"` banner — the
    // barrel is functions and types.
    entry: { overlay: "src/overlay.ts" },
    clean: false,
  },
])
