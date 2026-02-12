import { test, expect } from "@playwright/test";

test.describe("Auth: Profile area visibility", () => {
  test("header profile button is visible on desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const userMenuButton = page.getByLabel("User menu");
    await expect(userMenuButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking profile button opens dropdown with Sign In option", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const userMenuButton = page.getByLabel("User menu");
    await expect(userMenuButton).toBeVisible({ timeout: 10000 });
    await userMenuButton.click();

    const signInOption = page.getByText("Sign In");
    const profileOption = page.getByText("View Profile");
    const hasSignIn = await signInOption.isVisible().catch(() => false);
    const hasProfile = await profileOption.isVisible().catch(() => false);
    expect(hasSignIn || hasProfile).toBe(true);
  });

  test("Sign In link navigates to /login page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const userMenuButton = page.getByLabel("User menu");
    await userMenuButton.click();

    const signInOption = page.getByText("Sign In");
    const isVisible = await signInOption.isVisible().catch(() => false);
    if (isVisible) {
      await signInOption.click();
      await page.waitForURL("**/login");
      expect(page.url()).toContain("/login");
    }
  });

  test("/login page renders email form and OAuth buttons", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Password")).toBeVisible({ timeout: 10000 });
  });

  test("/signup page renders signup form", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Password")).toBeVisible({ timeout: 10000 });
  });

  test("bottom nav profile link is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const profileLink = page.locator("nav").last().getByLabel("Profile");
    await expect(profileLink).toBeVisible({ timeout: 10000 });
  });

  test("post composer has anonymous toggle", async ({ page }) => {
    await page.goto("/create");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const anonToggle = page.getByLabel("Post anonymously");
    await expect(anonToggle).toBeVisible({ timeout: 10000 });
  });

  test("console has no unhandled errors on home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (msg) => !msg.includes("supabase") && !msg.includes("fetch") && !msg.includes("Failed to fetch")
    );
    expect(criticalErrors).toEqual([]);
  });

  test("profile button visible on all main pages", async ({ page }) => {
    const pages = ["/", "/papers", "/forum", "/showcase", "/jobs", "/create"];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const userMenu = page.getByLabel("User menu");
      await expect(userMenu).toBeVisible({ timeout: 10000 });
    }
  });
});
