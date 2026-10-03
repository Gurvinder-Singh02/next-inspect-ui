import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export const runtime = "nodejs";

// Serve the pinned, installed package locally; no CDN or custom build plugin.
export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const require = createRequire(`${process.cwd()}/package.json`);
  const script = await readFile(require.resolve("react-grab/dist/index.global.js"));
  return new Response(script, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" },
  });
}
