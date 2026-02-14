import { test, Page, Locator } from "@playwright/test"

// Inject custom cursor + highlight CSS
async function injectDemoStyles(page: Page) {
  await page.addStyleTag({
    content: `
      /* Custom cursor */
      .demo-cursor {
        position: fixed;
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, #ff6b35 0%, #ff6b35 40%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transition: transform 0.15s ease;
        box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
      }
      .demo-cursor.clicking {
        transform: scale(1.8);
      }

      /* Highlight effect */
      .demo-highlight {
        outline: 3px solid #ff6b35 !important;
        outline-offset: 4px;
        animation: pulse 1s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { outline-color: #ff6b35; }
        50% { outline-color: #ffa500; }
      }
    `,
  })

  // Create cursor element
  await page.evaluate(() => {
    const cursor = document.createElement("div")
    cursor.className = "demo-cursor"
    cursor.id = "demo-cursor"
    document.body.appendChild(cursor)
  })
}

// Smooth mouse movement + cursor update
async function smoothMove(page: Page, x: number, y: number, steps = 25) {
  await page.mouse.move(x, y, { steps })
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById("demo-cursor")
      if (cursor) {
        cursor.style.left = `${x - 12}px`
        cursor.style.top = `${y - 12}px`
      }
    },
    { x, y }
  )
}

// Click with visual effect on a locator
async function demoClickLocator(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) return

  const x = box.x + box.width / 2
  const y = box.y + box.height / 2

  await smoothMove(page, x, y)
  await page.evaluate(() => document.getElementById("demo-cursor")?.classList.add("clicking"))
  await page.waitForTimeout(200)
  await locator.click()
  await page.evaluate(() => document.getElementById("demo-cursor")?.classList.remove("clicking"))
}

// Highlight a locator
async function highlightLocator(page: Page, locator: Locator, duration = 1500) {
  await locator.evaluate((el) => el.classList.add("demo-highlight"))
  await page.waitForTimeout(duration)
  await locator.evaluate((el) => el.classList.remove("demo-highlight"))
}

test.describe("Demo Recording", () => {
  test.setTimeout(90000) // 90 second timeout

  test("20-second demo video recording", async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1440, height: 900 })

    // Navigate to papers section (has feed controls)
    await page.goto("/papers")
    await injectDemoStyles(page)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    // === Scene 1: Bot Filtering (0-10 seconds) ===
    // Find the author filter button - it's the button containing "All" text in the feed controls
    const authorFilterBtn = page.locator("button").filter({ hasText: /^All$/ }).first()

    // Highlight and click author filter dropdown
    await highlightLocator(page, authorFilterBtn, 1000)
    await demoClickLocator(page, authorFilterBtn)
    await page.waitForTimeout(600)

    // Wait for dropdown to appear and select AI Bot
    const botOption = page.locator('[role="menuitemradio"]').filter({ hasText: "AI Bot" }).first()
    await botOption.waitFor({ state: "visible", timeout: 3000 })
    await demoClickLocator(page, botOption)
    await page.waitForTimeout(1500)

    // Check if there are any posts after filtering (posts are links to /post/)
    // Wait a moment for the filter to apply
    await page.waitForTimeout(500)
    const postLinks = page.locator('a[href^="/post/"]')
    const postCount = await postLinks.count()

    if (postCount > 0) {
      // Highlight the first post card (find the parent container of the link)
      const firstPostLink = postLinks.first()
      await highlightLocator(page, firstPostLink, 1500)

      // Click post link to go to detail page
      await demoClickLocator(page, firstPostLink)
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1500)
    } else {
      // No bot posts - switch back to All and continue
      // Re-locate the filter button (now shows "AI Bot" instead of "All")
      const currentFilterBtn = page.locator("button").filter({ hasText: /AI Bot|Bot/ }).first()
      await demoClickLocator(page, currentFilterBtn)
      await page.waitForTimeout(400)
      const allOption = page.locator('[role="menuitemradio"]').filter({ hasText: "All" }).first()
      await allOption.waitFor({ state: "visible", timeout: 3000 })
      await demoClickLocator(page, allOption)
      await page.waitForTimeout(1000)

      // Wait for posts to load
      await page.waitForTimeout(500)

      // Click first post link
      const firstPostLink = page.locator('a[href^="/post/"]').first()
      await demoClickLocator(page, firstPostLink)
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1500)
    }

    // === Scene 2: Identity Switch (10-20 seconds) ===
    // Scroll down a bit
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }))
    await page.waitForTimeout(1000)

    // Find the IdentitySwitch buttons (they're in a container, not necessarily in header tag)
    const verifiedBtn = page.locator("button").filter({ hasText: "Verified" }).first()
    const anonymousBtn = page.locator("button").filter({ hasText: "Anonymous" }).first()

    // Highlight the Verified button
    await highlightLocator(page, verifiedBtn, 1000)

    // Switch to Anonymous mode
    await demoClickLocator(page, anonymousBtn)
    await page.waitForTimeout(1500)

    // Scroll back up to show the change
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await page.waitForTimeout(1000)

    // Switch back to Verified
    await demoClickLocator(page, verifiedBtn)
    await page.waitForTimeout(2000)
  })
})
