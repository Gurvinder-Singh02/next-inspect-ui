import { defineConfig } from "tsup"

export default defineConfig({
  entry: { "index.global": "src/script.ts" },
  format: ["iife"],
  platform: "browser",
  splitting: false,
  dts: false,
  minify: true,
  clean: false,
  noExternal: [/.*/],
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".css": "text" },
  outExtension: () => ({ js: ".js" }),
})
