import { chromium } from "playwright";
import { TEST_MANIFEST } from "../apps/react-grab-bench/e2e/test-cases";
import { NEEDS_INTERACTION } from "../apps/react-grab-bench/e2e/interactions";
import { hashTestId } from "../apps/react-grab-bench/lib/hash-test-id";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const url = process.env.SOURCE_BENCH_URL ?? "http://localhost:3106";
const libraries = (
  process.env.SOURCE_BENCH_LIBRARIES ??
  "next-inspect-ui,react-grab,show-component,click-to-react-component"
).split(",");
const browser = await chromium.launch({ headless: true });
const results: any[] =
  process.env.SOURCE_BENCH_RESUME === "1"
    ? JSON.parse(await Bun.file("docs/source-benchmark-partial.json").text())
    : [];
try {
  for (const library of libraries) {
    console.log("Starting", library);
    const page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    await page.addInitScript(() => {
      console.warn = () => {};
    });
    await page.goto(`${url}/?library=${library}`, {
      timeout: 120_000,
      waitUntil: "domcontentloaded",
    });
    console.log("Loaded", library);
    await page.waitForFunction(
      () => (window as any).__SOURCE_BENCH__ && (window as any).__inspectUI,
      null,
      { timeout: 120_000 },
    );
    console.log("Ready", library);
    for (const entry of TEST_MANIFEST) {
      if (entry.id % 50 === 0 || process.env.SOURCE_BENCH_VERBOSE === "1")
        console.log(library, entry.id);
      if (NEEDS_INTERACTION[entry.testId]) await NEEDS_INTERACTION[entry.testId](page);
      const measured = await page
        .evaluate(
          async ({ library, id }) => {
            const element = document.querySelector(`[data-testid="${id}"]`);
            if (!element) return { missing: true, ms: 0, filePath: null, nodes: [] };
            const start = performance.now();
            try {
              const value = await Promise.race([
                (window as any).__SOURCE_BENCH__(library, element),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Lookup timed out")), 10_000),
                ),
              ]);
              return { ...value, ms: performance.now() - start };
            } catch (error) {
              return {
                error: String(error),
                ms: performance.now() - start,
                filePath: null,
                nodes: [],
              };
            }
          },
          { library, id: hashTestId(entry.testId) },
        )
        .catch((error) => ({ error: String(error), ms: 0, filePath: null, nodes: [] }));
      if (measured.error?.includes("Execution context")) {
        await page.goto(url);
        await page.waitForFunction(
          () => (window as any).__SOURCE_BENCH__ && (window as any).__inspectUI,
        );
      }
      const matches = (path: string | null) =>
        Boolean(
          path
            ?.replaceAll("\\", "/")
            .split(/[?#]/)[0]
            .endsWith("/" + entry.filePath) || path === entry.filePath,
        );
      const hints =
        measured.nodes?.map(
          (node: any) => node.filePath ?? node.fileName ?? node.source?.replace(/:\d+(:\d+)?$/, ""),
        ) ?? [];
      results.push({
        library,
        testId: entry.testId,
        expected: entry.filePath,
        ...measured,
        exactFile: matches(measured.filePath),
        chainContainsFile: hints.some(matches),
      });
    }
    mkdirSync("docs", { recursive: true });
    writeFileSync("docs/source-benchmark-partial.json", JSON.stringify(results, null, 2));
    await page.close();
    console.log(
      `${library}: ${results.filter((row) => row.library === library && row.exactFile).length}/${TEST_MANIFEST.length} exact file matches`,
    );
  }
} finally {
  await browser.close();
}
const summary = [...new Set(results.map((row) => row.library))].map((library) => {
  const rows = results.filter((row) => row.library === library);
  const times = rows
    .filter((row) => !row.missing && !row.error)
    .map((row) => row.ms)
    .sort((a, b) => a - b);
  return {
    library,
    total: rows.length,
    exactFile: rows.filter((row) => row.exactFile).length,
    chainContainsFile: rows.filter((row) => row.chainContainsFile).length,
    missing: rows.filter((row) => row.missing).length,
    errors: rows.filter((row) => row.error).length,
    medianMs: times[Math.floor(times.length / 2)] ?? null,
    p95Ms: times[Math.floor(times.length * 0.95)] ?? null,
  };
});
mkdirSync("docs", { recursive: true });
writeFileSync(
  "docs/source-benchmark-results.json",
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      url,
      metric: "Direct source lookup, expected component definition file; not agent success",
      summary,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.table(summary);

rmSync("docs/source-benchmark-partial.json", { force: true });
