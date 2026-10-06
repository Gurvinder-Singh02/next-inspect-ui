import { spawn, type ChildProcess } from "node:child_process"
import { createServer } from "node:net"
import { resolve } from "node:path"
import { createInterface } from "node:readline"

const root = resolve(import.meta.dirname, "..")
const apps = [
  { name: "test-next-js", port: 3001 },
  { name: "test-next-js-webpack", port: 3002 },
  { name: "test-vite-react-19", port: 5173 },
  { name: "test-react-18", port: 5174 },
]
const children: ChildProcess[] = []
let stopping = false
let exitCode = 0

function stop(code: number) {
  if (stopping) return
  stopping = true
  exitCode = code
  for (const child of children) {
    if (child.pid) {
      try { process.kill(-child.pid, "SIGTERM") } catch {}
    }
  }
  const timer = setTimeout(() => {
    for (const child of children) {
      if (child.pid) {
        try { process.kill(-child.pid, "SIGKILL") } catch {}
      }
    }
  }, 5000)
  timer.unref()
}

async function checkPort(port: number) {
  await new Promise<void>((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen({ port, host: "::", ipv6Only: false, exclusive: true }, () => server.close(error => error ? reject(error) : resolve()))
  })
}

// Check every port before starting any app, so a busy port leaves no partial run.
for (const app of apps) {
  try { await checkPort(app.port) }
  catch {
    console.error(`Cannot start ${app.name}: port ${app.port} is unavailable. Stop its existing server and retry.`)
    process.exit(1)
  }
}

process.on("SIGINT", () => stop(0))
process.on("SIGTERM", () => stop(0))
console.log("Starting all four test apps. Press Ctrl+C to stop them together.\n")
const exits = apps.map(app => {
  console.log(`${app.name}: http://localhost:${app.port}/test`)
  const child = spawn(process.execPath, ["run", "--cwd", `apps/${app.name}`, "dev"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  })
  children.push(child)
  for (const stream of [child.stdout!, child.stderr!]) {
    createInterface({ input: stream }).on("line", line => console.log(`[${app.name}] ${line}`))
  }
  return new Promise<void>(resolve => {
    child.on("error", error => {
      console.error(`[${app.name}] ${error.message}`)
      stop(1)
      resolve()
    })
    child.on("exit", (code, signal) => {
      if (!stopping) {
        console.error(`[${app.name}] stopped (${signal ?? code}). Stopping the other apps.`)
        stop(code || 1)
      }
      resolve()
    })
  })
})
await Promise.all(exits)
process.exitCode = exitCode
