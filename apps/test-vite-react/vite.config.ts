import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"] },
  define: { __PROJECT_ROOT__: JSON.stringify(import.meta.dirname) },
  build: { sourcemap: true },
})
