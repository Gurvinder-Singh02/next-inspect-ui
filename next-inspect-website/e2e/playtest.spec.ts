import { test, expect } from "@playwright/test"

test.describe("playtest page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playtest")
  })

  test("shows the playground heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Playtest" })).toBeVisible()
  })

  test("clicks the counter", async ({ page }) => {
    await expect(page.getByTestId("counter-value")).toHaveText("count: 0")
    await page.getByTestId("counter-btn").click()
    await expect(page.getByTestId("counter-value")).toHaveText("count: 1")
    await page.getByTestId("counter-btn").click()
    await expect(page.getByTestId("counter-value")).toHaveText("count: 2")
  })

  test("types a name into the greeting", async ({ page }) => {
    await page.getByTestId("name-input").fill("Guri")
    await expect(page.getByTestId("greeting")).toHaveText("Hello, Guri")
  })

  test("hovers Target B and reads the status", async ({ page }) => {
    await page.getByTestId("hover-target-b").hover()
    await expect(page.getByTestId("hover-status")).toHaveText("hovered: b")
    await expect(page.getByTestId("hover-target-b")).toHaveAttribute(
      "data-active",
      "true"
    )
  })
})
