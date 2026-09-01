const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const EVIDENCE = "/tmp/verify-evidence"
const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "")

async function verifyLandingPage() {
  fs.mkdirSync(EVIDENCE, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  try {
    console.log("Navigating to landing page...", SITE_URL)
    await page.goto(SITE_URL, { waitUntil: "networkidle" })

    if (page.url().includes("/test")) {
      throw new Error(
        `SITE_URL redirected to ${page.url()} — that is the example app, not site`
      )
    }

    const title = await page.locator("h1", { hasText: "next-inspect-ui" }).count()
    if (title === 0) throw new Error("Page title not found")

    const version = (await page.getByText(/v\d+\.\d+\.\d+/).count()) > 0
    if (!version) throw new Error("Version not displayed")

    await page.screenshot({
      path: path.join(EVIDENCE, "landing-page-loaded.png"),
      fullPage: true,
    })

    for (const heading of ["What it does", "Installation", "Usage"]) {
      const found = await page.locator("h2", { hasText: heading }).count()
      if (found === 0) throw new Error(`"${heading}" section not found`)
    }

    const demoLink = await page.getByRole("link", { name: /live demo/i }).count()
    if (demoLink === 0) throw new Error("Demo link not found")

    console.log("Landing page sections verified")

    await page.getByRole("link", { name: /live demo/i }).first().click()
    await page.waitForLoadState("networkidle")
    const landed = page.url()
    await page.screenshot({
      path: path.join(EVIDENCE, "landing-page-demo-navigation.png"),
      fullPage: true,
    })
    if (!landed.includes("/components")) {
      throw new Error(`demo link did not go to /components (got ${landed})`)
    }
    console.log(
      "Demo href is /components on site (404 expected). Landed:",
      landed
    )
    return true
  } catch (error) {
    console.error("Landing page verification failed:", error)
    await page.screenshot({
      path: path.join(EVIDENCE, "landing-page-error.png"),
      fullPage: true,
    })
    throw error
  } finally {
    await browser.close()
  }
}

verifyLandingPage().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
