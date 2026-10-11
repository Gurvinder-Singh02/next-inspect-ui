const { chromium, expect } = require('playwright/test');
const { mkdirSync } = require('node:fs');

async function verifyLandingPage() {
  const url = process.env.SITE_URL || 'http://localhost:3000';
  const evidence = '/tmp/verify-evidence';
  mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Usage', exact: true })).toBeVisible();
    const frameworks = page.getByRole('tablist', { name: 'Framework' });
    await expect(frameworks).toBeVisible();
    await expect(frameworks.getByRole('tab', { name: 'Next.js', exact: true })).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel');
    await expect(panel).toContainText(/layout\.tsx|main\.tsx|index\.js/);
    await frameworks.getByRole('tab', { name: 'React (Vite)', exact: true }).click();
    await expect(frameworks.getByRole('tab', { name: 'React (Vite)', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toContainText(/layout\.tsx|main\.tsx|index\.js/);
    await frameworks.getByRole('tab', { name: 'Next.js', exact: true }).click();
    await expect(frameworks.getByRole('tab', { name: 'Next.js', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('link', { name: 'Shortcuts', exact: true }).first()).toBeVisible();
    if (errors.length) throw new Error(errors.join('\n'));
    await page.screenshot({ path: `${evidence}/landing-page-verified.png`, fullPage: true });
    console.log(`Landing usage tabs verified: ${url}`);
  } catch (error) {
    await page.screenshot({ path: `${evidence}/landing-page-error.png`, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}
verifyLandingPage().catch(error => { console.error(error); process.exitCode = 1; });
