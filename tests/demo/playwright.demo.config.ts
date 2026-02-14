import { defineConfig, devices } from "@playwright/test"
import * as path from "path"

const authFile = path.join(__dirname, ".auth/user.json")

export default defineConfig({
  testDir: __dirname,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3001",
    video: {
      mode: "on",
      size: { width: 1440, height: 900 },
    },
    launchOptions: {
      slowMo: 50, // Delay between actions
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    // Step 1: Login (manual OAuth required)
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Step 2: Demo recording WITHOUT login
    {
      name: "demo",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      testMatch: /demo-recording\.spec\.ts/,
    },
    // Step 3: Demo recording WITH login (requires setup first)
    {
      name: "demo-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: authFile,
      },
      testMatch: /demo-recording\.spec\.ts/,
    },
  ],
})
