const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const EVIDENCE = "/tmp/verify-evidence"
const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "")
const EXAMPLE_URL = (process.env.EXAMPLE_URL || "http://localhost:3001").replace(
  /\/$/,
  ""
)
const DASHBOARD_URL = (
  process.env.DASHBOARD_URL || "http://localhost:3002"
).replace(/\/$/, "")

fs.mkdirSync(EVIDENCE, { recursive: true })

const shot = (page, name) =>
  page.screenshot({ path: path.join(EVIDENCE, name), fullPage: true })

const activateInspect = (page) =>
  page.evaluate(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "x",
        code: "KeyX",
        altKey: true,
        bubbles: true,
        cancelable: true,
      })
    )
  })

const overlayVisible = () => {
  const o = document.querySelector("[data-dev-inspector-overlay]")
  const t = document.querySelector("[data-dev-inspector-tooltip]")
  return (
    !!o &&
    !!t &&
    getComputedStyle(o).display !== "none" &&
    getComputedStyle(t).display !== "none"
  )
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const results = []

  try {
    await page.goto(SITE_URL, { waitUntil: "networkidle" })
    if (page.url().includes("/test")) {
      throw new Error(`SITE_URL is the example app (${page.url()})`)
    }
    const h1 = await page.locator("h1", { hasText: "next-inspect-ui" }).count()
    const version = await page.getByText(/v\d+\.\d+\.\d+/).count()
    const what = await page.locator("h2", { hasText: "What it does" }).count()
    const install = await page.locator("h2", { hasText: "Installation" }).count()
    const usage = await page.locator("h2", { hasText: "Usage" }).count()
    const demoLink = await page.getByRole("link", { name: /live demo/i }).count()
    await shot(page, "landing-page-loaded.png")
    if (!h1 || !version || !what || !install || !usage || !demoLink) {
      throw new Error(
        `landing missing pieces h1=${h1} ver=${version} what=${what} install=${install} usage=${usage} demo=${demoLink}`
      )
    }
    await page.getByRole("link", { name: /live demo/i }).first().click()
    await page.waitForLoadState("networkidle")
    const afterDemo = page.url()
    await shot(page, "landing-page-demo-navigation.png")
    results.push({
      feature: "landing-page",
      ok: true,
      note: `demo link exists; click landed on ${afterDemo} (404 on site)`,
    })

    await page.goto(`${SITE_URL}/shortcuts`, { waitUntil: "networkidle" })
    const shortcutsH1 = await page.locator("h1", { hasText: "Shortcuts" }).count()
    const desc = await page.getByText(/Keyboard and pointer controls/i).count()
    const kbd = await page.locator('[data-slot="kbd"]').count()
    await shot(page, "shortcuts-page-loaded.png")
    if (!shortcutsH1 || !desc || kbd < 3) {
      throw new Error(
        `shortcuts drift: h1=${shortcutsH1} desc=${desc} kbd=${kbd}`
      )
    }
    await shot(page, "shortcuts-page-verified.png")
    results.push({
      feature: "shortcuts-documentation",
      ok: true,
      note: `h1+lead+${kbd} kbd slots`,
    })

    await page.goto(SITE_URL, { waitUntil: "networkidle" })
    await page.waitForFunction(
      () =>
        !!document.querySelector("[data-dev-inspector-overlay]") &&
        !!window.__inspectUI
    )
    await activateInspect(page)
    await page.waitForFunction(() => document.body.style.cursor === "crosshair")
    await page.locator("h1", { hasText: "next-inspect-ui" }).hover()
    await page.waitForFunction(overlayVisible, null, { timeout: 5000 })
    await shot(page, "overlay-site-hover.png")
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => document.body.style.cursor !== "crosshair")
    results.push({
      feature: "inspect-overlay-toggle",
      ok: true,
      note: "site: Alt+X → crosshair, hover h1 shows overlay+tooltip, Esc clears",
    })

    await page.goto(`${DASHBOARD_URL}/components`, { waitUntil: "networkidle" })
    const instruction = await page.getByText(/Press.*⌥.*x.*inspector/i).count()
    const vega = await page.getByText("Vega").count()
    const traffic = await page.getByText("Traffic channels").count()
    await shot(page, "components-gallery-loaded.png")
    if (!instruction || !vega || !traffic) {
      throw new Error(
        `gallery missing instruction=${instruction} vega=${vega} traffic=${traffic}`
      )
    }
    await shot(page, "components-gallery-verified.png")
    results.push({
      feature: "components-demo-gallery",
      ok: true,
      note: "instruction+Vega+Traffic channels",
    })

    await page.waitForFunction(
      () =>
        !!document.querySelector("[data-dev-inspector-overlay]") &&
        !!window.__inspectUI
    )
    await activateInspect(page)
    await page.waitForFunction(() => document.body.style.cursor === "crosshair")
    await page.getByText("Traffic channels").first().hover()
    await page.waitForFunction(overlayVisible, null, { timeout: 5000 })
    await shot(page, "overlay-gallery-hover.png")
    await page.keyboard.press("Escape")
    results.push({
      feature: "inspect-overlay-toggle-gallery",
      ok: true,
      note: "dashboard /components hover Traffic channels",
    })

    await page.goto(`${EXAMPLE_URL}/test`, { waitUntil: "networkidle" })
    await shot(page, "test-suite-loaded.png")
    const groups = await page.locator("[data-suite-group]").count()
    const runAll = page.getByRole("button", { name: /^Run all$/ })
    if (!(await runAll.count())) throw new Error("Run all button missing")
    await runAll.click()
    await page.getByRole("button", { name: "Running…" }).waitFor({
      timeout: 15000,
    })
    await page.getByRole("button", { name: /^Run all$/ }).waitFor({
      timeout: 180000,
    })
    const failText = await page.getByText(/\d+ fail/).first().innerText()
    const passText = await page.getByText(/\d+ pass/).first().innerText()
    await shot(page, "test-suite-verified.png")
    const failN = Number(failText.replace(/\D/g, ""))
    const passN = Number(passText.replace(/\D/g, ""))
    if (failN !== 0 || passN < 1) {
      throw new Error(`accuracy suite ${passText} / ${failText}`)
    }
    results.push({
      feature: "accuracy-test-suite",
      ok: true,
      note: `${passText}, ${failText}, ${groups} data-suite-group`,
    })

    fs.writeFileSync(
      path.join(EVIDENCE, "run-results.json"),
      JSON.stringify(results, null, 2)
    )
    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    await shot(page, "error.png").catch(() => {})
    fs.writeFileSync(
      path.join(EVIDENCE, "error.txt"),
      String(error && error.stack ? error.stack : error)
    )
    console.error(error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
