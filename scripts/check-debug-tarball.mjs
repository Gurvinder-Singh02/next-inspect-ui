import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const repoRoot = new URL("..", import.meta.url).pathname
const pkgDir = join(repoRoot, "next-inspect-ui-debug")
const packDir = mkdtempSync(join(tmpdir(), "inspect-ui-debug-pack-"))

try {
  const packOut = execFileSync("pnpm", ["pack", "--pack-destination", packDir], {
    cwd: pkgDir,
    encoding: "utf8",
  })
  const tarball = packOut
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.endsWith(".tgz"))
  if (!tarball) {
    throw new Error(`pnpm pack printed no tarball\n${packOut}`)
  }

  const tarballPath = tarball.startsWith("/") ? tarball : join(packDir, tarball)
  execFileSync("tar", ["-xzf", tarballPath, "-C", packDir])
  const packed = JSON.parse(
    readFileSync(join(packDir, "package", "package.json"), "utf8")
  )
  const dep = packed.dependencies?.["next-inspect-ui"]
  if (typeof dep !== "string") {
    throw new Error("packed manifest is missing next-inspect-ui")
  }
  if (dep.includes("workspace:")) {
    throw new Error(
      `packed next-inspect-ui is still "${dep}". Publish with pnpm so the workspace protocol is rewritten.`
    )
  }
  console.log(`packed next-inspect-ui@${dep}`)
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
