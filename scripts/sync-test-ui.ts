import { cp, mkdir } from "node:fs/promises"
import { resolve, dirname } from "node:path"

// Keep the suite UI identical; fixtures and source expectations stay app-local.
const root = resolve(import.meta.dirname, "..")
const canonical = resolve(root, "apps/test-next-js")
for (const name of ["test-next-js-webpack", "test-vite-react-19", "test-react-18"]) {
  const target = resolve(root, "apps", name)
  for (const path of ["components/accuracy", "components/ui/button.tsx", "components/ui/badge.tsx", "components/ui/card.tsx", "components/theme-provider.tsx", "lib/utils.ts"]) {
    await mkdir(dirname(resolve(target, path)), { recursive: true })
    await cp(resolve(canonical, path), resolve(target, path), { recursive: true })
  }
  await cp(resolve(canonical, "app/globals.css"), resolve(target, name.startsWith("test-next") ? "app/globals.css" : "src/style.css"))
}
console.log("Synced the Next.js suite UI to every test app.")
