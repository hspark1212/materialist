import { test as setup } from "@playwright/test"
import * as path from "path"
import { config } from "dotenv"

// Load .env.local
config({ path: path.join(__dirname, "../../.env.local") })

const authFile = path.join(__dirname, ".auth/user.json")

setup("authenticate", async ({ page }) => {
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD

  if (!email || !password) {
    throw new Error(
      "DEMO_EMAIL and DEMO_PASSWORD required. Add to .env.local or pass as env vars"
    )
  }

  // Navigate to login page
  await page.goto("/login")

  // Use email/password login
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in|log in/i }).click()

  // Wait for redirect to user profile (up to 30 seconds)
  await page.waitForURL("**/u/**", { timeout: 30000 })

  // Save login state
  await page.context().storageState({ path: authFile })
})
