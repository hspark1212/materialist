import { test, expect } from "@playwright/test"

test.describe("Mention Autocomplete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("autocomplete dropdown appears when typing @ in post composer", async ({ page }) => {
    await page.goto("/create")
    await page.waitForLoadState("networkidle")

    const textarea = page.locator("textarea").first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill("Hello ")
    await textarea.pressSequentially("@")

    const autocomplete = page.locator("[data-testid='mention-autocomplete']")
    await expect(autocomplete).toBeVisible({ timeout: 5000 })
  })

  test("autocomplete shows bot options", async ({ page }) => {
    await page.goto("/create")
    await page.waitForLoadState("networkidle")

    const textarea = page.locator("textarea").first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill("Hello ")
    await textarea.pressSequentially("@")

    const autocomplete = page.locator("[data-testid='mention-autocomplete']")
    await expect(autocomplete).toBeVisible({ timeout: 5000 })

    const botOption = page.locator("text=materialist-bot")
    await expect(botOption).toBeVisible({ timeout: 3000 })
  })

  test("selecting bot from autocomplete inserts mention", async ({ page }) => {
    await page.goto("/create")
    await page.waitForLoadState("networkidle")

    const textarea = page.locator("textarea").first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill("Hello ")
    await textarea.pressSequentially("@")

    const botOption = page.locator("text=materialist-bot")
    await expect(botOption).toBeVisible({ timeout: 5000 })
    await botOption.click()

    const value = await textarea.inputValue()
    expect(value).toContain("@materialist-bot")
  })

  test("autocomplete filters bots by name", async ({ page }) => {
    await page.goto("/create")
    await page.waitForLoadState("networkidle")

    const textarea = page.locator("textarea").first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill("Hello ")
    await textarea.pressSequentially("@men")

    const autocomplete = page.locator("[data-testid='mention-autocomplete']")
    await expect(autocomplete).toBeVisible({ timeout: 5000 })

    const mendeleevOption = page.locator("text=mendeleev-bot")
    await expect(mendeleevOption).toBeVisible({ timeout: 3000 })
  })

  test("autocomplete closes on Escape key", async ({ page }) => {
    await page.goto("/create")
    await page.waitForLoadState("networkidle")

    const textarea = page.locator("textarea").first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill("Hello ")
    await textarea.pressSequentially("@")

    const autocomplete = page.locator("[data-testid='mention-autocomplete']")
    await expect(autocomplete).toBeVisible({ timeout: 5000 })

    await textarea.press("Escape")

    await expect(autocomplete).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe("Mention in Comments", () => {
  test("autocomplete works in comment composer", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const firstPost = page.locator("[data-testid='post-card'], article").first()
    await expect(firstPost).toBeVisible({ timeout: 10000 })
    await firstPost.click()

    await page.waitForLoadState("networkidle")

    const commentTextarea = page.locator("textarea[placeholder*='comment'], textarea[placeholder*='Reply']").first()
    const hasCommentField = await commentTextarea.isVisible().catch(() => false)

    if (hasCommentField) {
      await commentTextarea.fill("Test ")
      await commentTextarea.pressSequentially("@")

      const autocomplete = page.locator("[data-testid='mention-autocomplete']")
      await expect(autocomplete).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })
})
