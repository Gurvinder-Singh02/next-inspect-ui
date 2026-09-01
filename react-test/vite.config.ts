import path from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // InspectUI needs an absolute project root (Next usually passes process.cwd()).
    __INSPECT_PROJECT_ROOT__: JSON.stringify(rootDir),
  },
  server: {
    port: 5173,
  },
})
