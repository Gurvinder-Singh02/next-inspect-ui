import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"

export const runtime = "nodejs"

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 })
  const require = createRequire(`${process.cwd()}/package.json`)
  const script = await readFile(require.resolve("next-inspect-ui/script"))
  return new Response(script, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" },
  })
}
