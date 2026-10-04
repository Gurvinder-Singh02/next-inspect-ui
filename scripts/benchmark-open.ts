import { chromium } from "playwright";
import { TEST_MANIFEST } from "../apps/react-grab-bench/e2e/test-cases";
import { NEEDS_INTERACTION } from "../apps/react-grab-bench/e2e/interactions";
import { hashTestId } from "../apps/react-grab-bench/lib/hash-test-id";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results: any[] = [];
try {
  // Stub only the final editor-protocol transport in the delivered dev bundle.
  // Source lookup, target selection, and all click handlers remain unchanged.
  await page.route("**/*.js*", async route => {
    const response = await route.fetch();
    const original = await response.text();
    const body = original.replace(/window\.location\.href\s*=\s*[^;\n]+\.url\(source\.filePath,\s*source\.line,\s*source\.column\);?/g,
      'window.__OPEN_REQUESTS__.push({file: source.filePath, line1: String(source.line), column1: String(source.column), transport: "editor-protocol"});');
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    const original = window.fetch;
    (window as any).__OPEN_REQUESTS__ = [];
    window.fetch = async (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof Request ? input.url : input.toString(),
        location.href,
      );
      if (url.pathname === "/__nextjs_launch-editor" || url.pathname === "/__open-in-editor") {
        (window as any).__OPEN_REQUESTS__.push(Object.fromEntries(url.searchParams));
        return new Response("", { status: 200 });
      }
      return original(input, init);
    };
  });
  await page.goto(`${process.env.SOURCE_BENCH_URL ?? "http://localhost:3106"}/?library=open`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => (window as any).__inspectUI, null, { timeout: 120_000 });
  await page.keyboard.press("Alt+x");
  for (const entry of TEST_MANIFEST) {
    if (NEEDS_INTERACTION[entry.testId]) {
      await page.keyboard.press("Alt+x");
      await NEEDS_INTERACTION[entry.testId](page);
      await page.keyboard.press("Alt+x");
    }
    const modes: any = {};
    for (const option of [false, true]) {
      modes[option ? "optionClick" : "click"] = await page.evaluate(
        async ({ id, option }) => {
          const target = document.querySelector(`[data-testid="${id}"]`);
          if (!target) return { missing: true };
          (window as any).__OPEN_REQUESTS__ = [];
          const rect = target.getBoundingClientRect();
          const clientX = rect.left + rect.width / 2;
          const clientY = rect.top + rect.height / 2;
          // Controlled DOM hit: exercise the real hover/pointer/click handlers,
          // even when a fixture is outside the viewport or covered by a portal.
          const original = document.elementFromPoint;
          const originalStack = document.elementsFromPoint;
          document.elementsFromPoint = () => [target];
          document.elementFromPoint = () => target;
          try {
            target.dispatchEvent(
              new PointerEvent("pointermove", {
                bubbles: true,
                clientX,
                clientY,
                altKey: option,
              }),
            );
            target.dispatchEvent(
              new PointerEvent("pointerdown", {
                bubbles: true,
                clientX,
                clientY,
                altKey: option,
              }),
            );
            target.dispatchEvent(
              new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
                altKey: option,
              }),
            );
            const deadline = performance.now() + 2000;
            while (!(window as any).__OPEN_REQUESTS__.length && performance.now() < deadline)
              await new Promise((resolve) => setTimeout(resolve, 10));
            return { destination: (window as any).__OPEN_REQUESTS__[0] ?? null };
          } finally {
            document.elementFromPoint = original;
            document.elementsFromPoint = originalStack;
          }
        },
        { id: hashTestId(entry.testId), option },
      );
      const file = modes[option ? "optionClick" : "click"].destination?.file;
      modes[option ? "optionClick" : "click"].expectedDefinitionFile = Boolean(
        file && (file === entry.filePath || file.endsWith("/" + entry.filePath)),
      );
    }
    results.push({ testId: entry.testId, expectedDefinition: entry.filePath, ...modes });
    if (entry.id % 50 === 0) console.log("Completed", entry.id);
  }
} finally {
  await browser.close();
}
const summary = ["click", "optionClick"].map((mode) => ({
  mode,
  total: results.length,
  expectedDefinitionFile: results.filter((row) => row[mode].expectedDefinitionFile).length,
  missing: results.filter((row) => row[mode].missing).length,
  noCapturedDestination: results.filter((row) => !row[mode].missing && !row[mode].destination)
    .length,
}));
writeFileSync(
  "docs/open-benchmark-results.json",
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      method:
        "Actual click handler; endpoint interception and final editor-protocol transport stub; controlled DOM hit; definition-file expectations only",
      summary,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.table(summary);
