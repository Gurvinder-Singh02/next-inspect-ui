import { registerHooks } from "node:module"
import { readFileSync } from "node:fs"

// Keep the actual stylesheet available to tests importing inspector source.
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".css")) {
      const css = readFileSync(new URL(url), "utf8")
      return {
        format: "module",
        source: `export default ${JSON.stringify(css)}`,
        shortCircuit: true,
      }
    }
    return nextLoad(url, context)
  },
})
