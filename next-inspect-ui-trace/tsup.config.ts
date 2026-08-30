import { defineConfig } from "tsup"

export default defineConfig({
  // Node-only. Must not carry a "use client" banner — Babel would choke on
  // it, and Turbopack would treat the loader config as a client module.
  entry: {
    index: "src/index.ts",
    "babel-stamp": "src/babel-stamp.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  platform: "node",
  external: ["@babel/core", "babel-loader"],
})
