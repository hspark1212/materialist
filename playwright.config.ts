import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

// Manually load .env.local to avoid dependency issues
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join("=").trim().replace(/^["'](.*)["']$/, '$1');
    }
  });
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "Tablet",
      use: { ...devices["iPad Mini"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "Mobile",
      use: { ...devices["iPhone 13"], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: "npm run dev -- -p 3002",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
  },
});
