const { createRequire } = require('node:module');
const { gzipSync } = require('node:zlib');
const fs = require('node:fs');
const root = process.cwd();
const path = require('node:path');
const benchmark = path.resolve(process.env.REACT_BENCH_DIR || path.resolve(root, '../react-grab-bench'), 'packages/benchmark');
const req = createRequire(fs.realpathSync(`${root}/packages/next-inspect-ui/node_modules/tsup/package.json`));
const { build } = req('esbuild');
const entries = [
  ['Next Inspect UI', 'packages/next-inspect-ui/dist/index.js', 'InspectUI'],
  ['Show Component 2.3.0', `${benchmark}/node_modules/show-component/dist/index.mjs`, 'ShowComponent'],
  ['Click to React Component 1.1.3', `${benchmark}/node_modules/click-to-react-component/src/index.js`, 'ClickToComponent'],
];
async function measure(contents, mode) {
  const result = await build({ stdin: { contents, resolveDir: root }, bundle: true, write: false, minify: true, format: 'esm', platform: 'browser', external: ['react', 'react/*', 'react-dom', 'react-dom/*'], define: { 'process.env.NODE_ENV': JSON.stringify(mode) }, metafile: true, logLevel: 'silent' });
  const data = result.outputFiles[0].contents;
  return { raw: data.length, gzip: gzipSync(data).length, inputs: Object.keys(result.metafile.inputs).length - 1 };
}
(async () => {
  const results = [];
  for (const [name, entry, symbol] of entries) {
    if (!fs.existsSync(path.resolve(root, entry))) continue;
    const entryPath = JSON.stringify(path.resolve(root, entry));
    const production = await measure(`export { ${symbol} } from ${entryPath}`, 'production');
    const development = await measure(`export { ${symbol} } from ${entryPath}`, 'development');
    const guarded = await measure(`export const load = async () => process.env.NODE_ENV === "development" ? (await import(${entryPath})).${symbol} : null`, 'production');
    results.push({ name, production, development, guarded: { inputs: guarded.inputs, excluded: guarded.inputs === 0 } });
  }
  const grabPath = `${benchmark}/node_modules/react-grab/dist/index.global.js`;
  const grab = fs.existsSync(grabPath) ? fs.readFileSync(grabPath) : null;
  const oursScript = fs.readFileSync(`${root}/packages/next-inspect-ui/dist/index.global.js`);
  const report = { inspectUiScript: { raw: oursScript.length, gzip: gzipSync(oursScript).length }, measuredAt: new Date().toISOString(), method: 'Standalone minified esbuild ESM; React/ReactDOM external; gzip bytes. Development is minified for comparison. Not application build delta or runtime benchmark.', results, reactGrab: grab ? { version: '0.2.0', raw: grab.length, gzip: gzipSync(grab).length } : null };
  fs.writeFileSync(`${root}/docs/benchmark-results.json`, JSON.stringify(report, null, 2) + '\n');
  console.table(results.map(row => ({ library: row.name, productionGzip: row.production.gzip, devGzip: row.development.gzip, guardedProduction: row.guarded.excluded ? "Library excluded by dev guard" : "Library included" })));
  console.log('InspectUI global gzip:', report.inspectUiScript.gzip);
  if (report.reactGrab) console.log('React Grab global gzip:', report.reactGrab.gzip);
})().catch(error => { console.error(error); process.exitCode = 1; });
