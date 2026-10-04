import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${process.env.SOURCE_BENCH_URL ?? "http://localhost:3106"}/?library=open`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => (window as any).__inspectUI);
  await page.keyboard.press("Alt+x");
  // Real pointer movement, with no substituted hit testing.
  const targets = page.locator("[data-testid]");
  const candidates = await targets.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 10 && rect.height > 10 && !element.getAttribute("class");
      })
      .slice(0, 4)
      .map((element) => element.getAttribute("data-testid")!),
  );
  for (const id of candidates) {
    const target = page.locator(`[data-testid="${id}"]`).first();
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await target.boundingBox();
    assert.ok(box);
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const expected = await page.evaluate(
      ({ x, y }) => {
        const previous = document.body.style.pointerEvents;
        document.body.style.pointerEvents = "auto";
        const hit = document.elementFromPoint(x, y)!;
        document.body.style.pointerEvents = previous;
        const rect = hit.getBoundingClientRect();
        return {
          tag: hit.tagName,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
      },
      { x, y },
    );
    if (expected.tag === "BODY" || expected.tag === "HTML") continue;
    await page.mouse.move(x, y);
    await page.waitForTimeout(200);
    const actual = await page.locator("[data-dev-inspector-overlay]").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });
    for (const key of ["left", "top", "width", "height"] as const)
      assert.ok(
        Math.abs(actual[key] - expected[key]) < 1,
        `${id} ${key}: ${actual[key]} != ${expected[key]}`,
      );
    console.log("Exact hover:", expected.tag, id);
  }
  await page.keyboard.press("Space");
  await page.locator("[data-dev-inspector-info]").waitFor({ state: "visible" });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  mkdirSync("/tmp/verify-evidence", { recursive: true });
  await page.screenshot({ path: "/tmp/verify-evidence/exact-hover.png" });
  console.log("Hover and info navigation verified");
} finally {
  await browser.close();
}
