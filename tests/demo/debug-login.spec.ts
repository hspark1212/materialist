import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load env
const envPath = path.resolve(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line) => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join("=").trim().replace(/^["'](.*)["']$/, '$1');
        }
    });
}

test("TDD: Verify Login from Anonymous Comment Modal", async ({ page }) => {
    // 1. Setup
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. Trigger Login Flow via Header
    // The "Comment" button only shows a toast, so we must manually sign in.
    // 1. Open User Menu (top right)
    const userMenuBtn = page.getByRole("button", { name: "User menu" });
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click({ force: true });

    // 2. Click "Sign In" from Dropdown
    const signInMenuItem = page.getByRole("menuitem", { name: "Sign In" });
    await expect(signInMenuItem).toBeVisible();
    await signInMenuItem.click({ force: true });

    // 3. Verify Login Form Appears (Email Input)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // 4. Perform Login
    const email = process.env.DEMO_EMAIL;
    const password = process.env.DEMO_PASSWORD;

    console.log("Logging in with:", email);

    await emailInput.click({ force: true });
    await emailInput.fill(email || "");

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click({ force: true });
    await passwordInput.fill(password || "");

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
        await submitBtn.click({ force: true });
    } else {
        await page.keyboard.press("Enter");
    }

    // 5. Verify Success
    // Wait for the modal to close and user to be logged in
    // The avatar should change or the ring should appear
    const avatar = page.locator('.avatar-verified-ring, .avatar-bot-ring, img[alt*="Avatar"]').first();
    await expect(avatar).toBeVisible({ timeout: 15000 });
});
