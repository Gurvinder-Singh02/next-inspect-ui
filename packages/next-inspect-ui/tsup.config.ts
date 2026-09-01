import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "tsup"

const overlayCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "src/overlay.css"),
  "utf8"
)

const inlineOverlayCss = {
  name: "inline-overlay-css",
  setup(build) {
    build.onLoad({ filter: /overlay-css\.ts$/ }, () => ({
      contents: `export default ${JSON.stringify(overlayCss)}`,
      loader: "ts",
    }))
  },
}

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  splitting: true,
  external: ["react", "react-dom"],
  esbuildPlugins: [inlineOverlayCss],
}

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts" },
    clean: true,
  },
  {
    ...shared,
    entry: { lib: "src/lib.ts" },
    clean: false,
  },
])
