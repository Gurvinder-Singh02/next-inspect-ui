import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
    dedupe: ["react", "react-dom"],
  },
  define: { __PROJECT_ROOT__: JSON.stringify(import.meta.dirname) },
  build: { sourcemap: true, target: "es2022" },
})
