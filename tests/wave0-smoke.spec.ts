import { test, expect } from "@playwright/test";

test.describe("Wave 0-3: Foundation + Home Feed", () => {
  test("app loads with dark theme and Materialist branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("body")).toBeVisible();
    const title = await page.title();
    expect(title).toContain("Materialist");
  });

  test("home feed shows post cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const posts = page.locator("[data-testid='post-card'], .post-card, article").first();
    await expect(posts).toBeVisible({ timeout: 10000 });
  });

  test("header is visible with logo and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByText("Materialist")).toBeVisible();
  });
});
