import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "babel-stamp": "src/babel-stamp.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    platform: "node",
    external: ["@babel/core", "babel-loader", "next-inspect-ui-deprecated"],
  },
  {
    entry: { inspect: "src/inspect-ui.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    splitting: true,
    external: [
      "react",
      "react-dom",
      "next-inspect-ui-deprecated",
      "next-inspect-ui-deprecated/lib",
      "next-inspect-ui-deprecated/overlay",
    ],
    banner: {
      js: '"use client";',
    },
  },
])
