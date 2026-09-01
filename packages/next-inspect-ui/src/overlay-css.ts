import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

export default readFileSync(
  fileURLToPath(new URL("./overlay.css", import.meta.url)),
  "utf8"
)
