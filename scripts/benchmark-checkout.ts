import { existsSync } from "node:fs";
import { resolve } from "node:path";

const project = resolve(import.meta.dirname, "..");
const checkout = resolve(process.env.REACT_BENCH_DIR ?? resolve(project, "../react-grab-bench"));
const benchmark = resolve(checkout, "packages/benchmark");
const command = process.argv[2];
const scripts: Record<string, string> = { source: "benchmark-source.ts", open: "benchmark-open.ts", hover: "verify-exact-hover.ts" };
if (!existsSync(resolve(benchmark, "scripts/benchmark-source.ts"))) {
  throw new Error(`Updated benchmark checkout missing at ${benchmark}. Clone https://github.com/Gurvinder-Singh02/next-inspect-bench beside this repository, or set REACT_BENCH_DIR.`);
}
if (command !== "dev" && !scripts[command]) throw new Error("Expected dev, source, open, or hover.");
const children = new Set<ReturnType<typeof Bun.spawn>>();
const run = async (args: string[], cwd = project) => {
  const child = Bun.spawn(args, { cwd, env: { ...process.env, pnpm_config_verify_deps_before_run: "false" }, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  children.add(child);
  const code = await child.exited;
  children.delete(child);
  if (code) throw new Error(`${args.join(" ")} exited with ${code}`);
};
let server: ReturnType<typeof Bun.spawn> | undefined;
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => {
  for (const child of children) child.kill(signal);
  if (server?.pid) { try { process.kill(-server.pid, signal); } catch { server.kill(signal); } }
});
const url = process.env.SOURCE_BENCH_URL ?? "http://localhost:3106";
const ready = async () => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    await response.body?.cancel();
    return response.ok;
  } catch { return false; }
};
try {
  if (command === "dev" || !(await ready())) {
    if (url !== "http://localhost:3106" && command !== "dev") throw new Error(`Start your custom benchmark server at ${url} first.`);
    await run([process.execPath, "run", "build"]);
    await run([process.execPath, "x", "--package", "@antfu/ni", "ni", "--ignore-scripts"], checkout);
    server = Bun.spawn([process.execPath, "run", "--cwd", benchmark, "dev:inspect"], { cwd: benchmark, stdout: "inherit", stderr: "inherit", detached: true });
    if (command === "dev") process.exitCode = await server.exited;
    else {
      const deadline = Date.now() + 120_000;
      while (!(await ready())) {
        if (server.exitCode !== null) throw new Error("Benchmark server stopped before becoming ready.");
        if (Date.now() > deadline) throw new Error(`Benchmark server did not become ready at ${url}.`);
        await Bun.sleep(500);
      }
    }
  }
  if (command !== "dev") await run([process.execPath, "run", resolve(benchmark, "scripts", scripts[command])]);
} finally {
  if (server?.pid && server.exitCode === null) {
    try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill(); }
    await server.exited;
  }
}
