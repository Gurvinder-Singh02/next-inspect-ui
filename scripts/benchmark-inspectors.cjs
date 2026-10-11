const { createRequire } = require("node:module");
const { gzipSync } = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const req = createRequire(
  fs.realpathSync(`${root}/packages/next-inspect-ui/node_modules/tsup/package.json`)
);
const { build } = req("esbuild");

async function measure(contents, mode) {
  const result = await build({
    stdin: { contents, resolveDir: root },
    bundle: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "browser",
    external: ["react", "react/*", "react-dom", "react-dom/*"],
    define: { "process.env.NODE_ENV": JSON.stringify(mode) },
    metafile: true,
    logLevel: "silent",
  });
  const data = result.outputFiles[0].contents;
  return {
    raw: data.length,
    gzip: gzipSync(data).length,
    inputs: Object.keys(result.metafile.inputs).length - 1,
  };
}

(async () => {
  const entry = path.resolve(root, "packages/next-inspect-ui/dist/index.js");
  if (!fs.existsSync(entry)) {
    throw new Error("Build next-inspect-ui before running the bundle benchmark.");
  }
  const entryPath = JSON.stringify(entry);
  const production = await measure(
    `export { InspectUI } from ${entryPath}`,
    "production"
  );
  const development = await measure(
    `export { InspectUI } from ${entryPath}`,
    "development"
  );
  const guarded = await measure(
    `export const load = async () => process.env.NODE_ENV === "development" ? (await import(${entryPath})).InspectUI : null`,
    "production"
  );
  const oursScript = fs.readFileSync(
    `${root}/packages/next-inspect-ui/dist/index.global.js`
  );
  const report = {
    inspectUiScript: {
      raw: oursScript.length,
      gzip: gzipSync(oursScript).length,
    },
    measuredAt: new Date().toISOString(),
    method:
      "Standalone minified esbuild ESM; React/ReactDOM external; gzip bytes. Development is minified for comparison. Not application build delta or runtime benchmark.",
    results: [
      {
        name: "Next Inspect UI",
        production,
        development,
        guarded: { inputs: guarded.inputs, excluded: guarded.inputs === 0 },
      },
    ],
  };
  fs.writeFileSync(
    `${root}/docs/benchmark-results.json`,
    JSON.stringify(report, null, 2) + "\n"
  );
  console.table(
    report.results.map((row) => ({
      library: row.name,
      productionGzip: row.production.gzip,
      devGzip: row.development.gzip,
      guardedProduction: row.guarded.excluded
        ? "Library excluded by dev guard"
        : "Library included",
    }))
  );
  console.log("InspectUI global gzip:", report.inspectUiScript.gzip);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
