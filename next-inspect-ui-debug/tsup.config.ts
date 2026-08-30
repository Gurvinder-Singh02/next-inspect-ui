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
    external: ["@babel/core", "babel-loader", "next-inspect-ui"],
  },
  {
    entry: { inspect: "src/inspect-ui.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    external: ["react", "react-dom", "next-inspect-ui", "next-inspect-ui/lib"],
    banner: {
      js: '"use client";',
    },
  },
])
