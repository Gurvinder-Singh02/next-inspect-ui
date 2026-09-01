import { defineConfig } from "tsup"

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  splitting: true,
  external: ["react", "react-dom"],
  loader: {
    ".css": "text" as const,
  },
}

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
    clean: true,
  },
  {
    ...shared,
    entry: { lib: "src/lib/index.ts" },
    clean: false,
  },
])
