const { chromium, expect } = require('playwright/test');
const { mkdirSync, appendFileSync } = require('node:fs');
mkdirSync('/tmp/verify-evidence', { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/test', { waitUntil: 'domcontentloaded' });
  await page.locator('body').click({ position: { x: 8, y: 8 } });
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyX');
  await page.keyboard.up('Alt');
  await page.locator('button').nth(1).hover({ force: true });
  await page.waitForTimeout(400);
  const tip = page.locator('[data-dev-inspector-tooltip]');
  await expect(tip).toContainText(/\.tsx|\.jsx|\.ts|\.js/);
  const text = await tip.innerText();
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  const info = page.locator('[data-dev-inspector-info]');
  const infoDisplay = await info.evaluate(el => getComputedStyle(el).display);
  await page.screenshot({ path: '/tmp/verify-evidence/overlay-tree-proof.png', fullPage: true });
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const tipAfter = await tip.evaluate(el => getComputedStyle(el).display).catch(() => 'missing');
  const line = [
    `overlay proof tooltip=${JSON.stringify(text.trim())}`,
    `info open display=${infoDisplay}`,
    `after Escape tooltip display=${tipAfter}`,
  ].join('\n');
  appendFileSync('/tmp/verify-evidence/live-pass.txt', line + '\n');
  console.log(line);
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
