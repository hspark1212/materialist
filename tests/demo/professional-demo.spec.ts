import { test, Page, Locator, expect } from "@playwright/test"

// --- Configuration ---
const CONFIG = {
    viewport: { width: 1920, height: 1080 },
}

// --- Visual Helpers (Shared) ---

async function injectProfessionalStyles(page: Page) {
    // Idempotency: Check if styles/cursor already exist
    const cursorExists = await page.evaluate(() => !!document.getElementById("pro-cursor"))
    if (cursorExists) return

    await page.addStyleTag({
        content: `
      body, a, button, input { cursor: none !important; }
      .pro-cursor {
        position: fixed; width: 20px; height: 20px;
        background: rgba(14, 165, 233, 0.6);
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%; pointer-events: none; z-index: 100000;
        transition: transform 0.1s ease-out;
        box-shadow: 0 0 15px rgba(14, 165, 233, 0.5);
        transform: translate(-50%, -50%);
        backdrop-filter: blur(2px);
      }
      .pro-cursor.active { background: rgba(14, 165, 233, 0.9); transform: translate(-50%, -50%) scale(0.8); }
      .pro-cursor.clicking { transform: translate(-50%, -50%) scale(1.5); background: rgba(255, 255, 255, 0.4); border-color: #0ea5e9; }
      ::-webkit-scrollbar { display: none; }
    `,
    })
    await page.evaluate(() => {
        const cursor = document.createElement("div")
        cursor.className = "pro-cursor"
        cursor.id = "pro-cursor"
        document.body.appendChild(cursor)
        cursor.style.left = "-100px"
        cursor.style.top = "-100px"
    })
}

async function humanMove(page: Page, x: number, y: number, steps = 30) {
    await page.mouse.move(x, y, { steps })
    await page.evaluate(({ x, y }) => {
        const cursor = document.getElementById("pro-cursor")
        if (cursor) {
            cursor.style.left = `${x}px`
            cursor.style.top = `${y}px`
        }
    }, { x, y })
}

async function smoothScroll(page: Page, y: number, duration = 1000) {
    await page.evaluate(async ({ y, duration }) => {
        const start = window.scrollY
        const distance = y - start
        const startTime = performance.now()
        return new Promise<void>((resolve) => {
            const animation = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
                window.scrollTo(0, start + distance * ease)
                if (elapsed < duration) requestAnimationFrame(animation)
                else resolve()
            }
            requestAnimationFrame(animation)
        })
    }, { y, duration })
}

async function elegantClick(page: Page, locator: Locator) {
    const box = await locator.boundingBox()
    if (!box) return
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await humanMove(page, x, y, 35)
    await page.evaluate(() => document.getElementById("pro-cursor")?.classList.add("active"))

    // Force hover/click to avoid "intercepts pointer events" errors from modal backdrops
    // The visual cursor (humanMove) provides the realism, so force is safe here.
    try {
        await locator.hover({ force: true, timeout: 2000 })
    } catch (e) {
        // Ignore hover fail, proceed to click
    }

    await page.waitForTimeout(300)
    await page.evaluate(() => document.getElementById("pro-cursor")?.classList.add("clicking"))
    await page.waitForTimeout(150)

    await locator.click({ force: true })

    await page.evaluate(() => {
        const c = document.getElementById("pro-cursor")
        c?.classList.remove("clicking", "active")
    })
    await page.waitForTimeout(500)
}

// --- The Redesigned Test ---

test.use({
    viewport: CONFIG.viewport,
    deviceScaleFactor: 2,
    hasTouch: false,
    isMobile: false,
    colorScheme: 'dark',
    video: 'on',
})

test.describe("Professional Demo Redesign", () => {
    test.setTimeout(180000); // 3 minutes

    test("scenario: anonymous block -> verify -> comment -> paper bot", async ({ page, browser }) => {
        // 0. Background Login (Hidden from Video)
        // We do this first so we have the "Verified State" ready to inject.
        const bgContext = await browser.newContext();
        const bgPage = await bgContext.newPage();
        await bgPage.goto(CONFIG.baseUrl + "/login");

        // Perform Real Login in Background
        const emailInput = bgPage.locator('input[type="email"]');
        await emailInput.fill(process.env.DEMO_EMAIL || "");
        await bgPage.locator('input[type="password"]').fill(process.env.DEMO_PASSWORD || "");

        const submitBtn = bgPage.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) await submitBtn.click();
        else await bgPage.keyboard.press("Enter");

        await bgPage.waitForURL("**/", { timeout: 15000 }).catch(() => { });
        // Ensure we are logged in by checking cookies or UI
        await bgPage.waitForTimeout(2000);

        const storageState = await bgContext.storageState();
        await bgContext.close();

        // 1. Start Demo (Recorded Page)
        await page.goto("/");
        await injectProfessionalStyles(page);
        await page.waitForLoadState("networkidle");

        // Intro: Smooth entrance
        await humanMove(page, CONFIG.viewport.width / 2, CONFIG.viewport.height / 2, 60);
        await page.waitForTimeout(1000);

        // === Scene 1: The Anonymous Barrier ===
        // Scroll to find a discussion-worthy post
        await smoothScroll(page, 300, 1500);

        // Find a post and click to view details
        const postLink = page.locator('a[href^="/post/"]').first();
        await elegantClick(page, postLink);
        await page.waitForLoadState("networkidle");

        // Scroll down to the comment section (composer)
        // Adjust scroll amount based on typical post length, or find the composer
        const composer = page.locator('[data-testid="comment-composer"]');
        await composer.waitFor();
        const composerBox = await composer.boundingBox();
        if (composerBox) {
            await smoothScroll(page, composerBox.y - 300, 1000);
        }
        await page.waitForTimeout(1000);

        // Attempt to write a comment
        const textarea = page.locator('textarea[placeholder*="Add your perspective"]');
        await elegantClick(page, textarea);

        // Simulate typing
        await page.keyboard.type("This analysis seems accurate, but I wonder if...", { delay: 50 });
        await page.waitForTimeout(800);

        // Click "Comment" button
        const commentBtn = page.getByRole("button", { name: "Comment", exact: true });
        await elegantClick(page, commentBtn);

        // VISUAL: Expect "Sign in to comment" toast/alert
        // We pause here to let the viewer see the rejection
        await page.waitForTimeout(1500);

        // === Scene 2: Verification (Magic Transition) ===
        // Move towards header
        await smoothScroll(page, 0, 1000);

        // OPEN USER MENU -> SIGN IN (Proven reliable flow)
        const userMenuBtn = page.getByRole("button", { name: "User menu" });
        if (await userMenuBtn.isVisible()) {
            await elegantClick(page, userMenuBtn);

            const signInItem = page.getByRole("menuitem", { name: "Sign In" });
            if (await signInItem.isVisible()) {
                await elegantClick(page, signInItem);

                // MAGIC CUT: Inject Auth State instantly
                // Instead of showing the modal/typing, we just "log in" via state
                await page.context().addCookies(storageState.cookies);

                // Simulate "Processing" then Reload as Verified
                await page.waitForTimeout(500);
                await page.reload();
                await injectProfessionalStyles(page); // Re-apply cursor
                await page.waitForLoadState("networkidle");

                // ASSERT LOGIN SUCCESS
                const avatar = page.locator('.avatar-verified-ring, .avatar-bot-ring, img[alt*="Avatar"]').first();
                await expect(avatar).toBeVisible({ timeout: 15000 });
            }
        }

        // === Scene 3: Verified Participation ===
        // We are now "Stark Mater" (Verified)
        // Go back to the same post (or we might be there if reload kept url, but let's ensure)
        // If we are on home, click the first post again
        // Just ensure we are on a post


        // Ensure we are on a post details page
        if (!page.url().includes("/post/")) {
            const p = page.locator('a[href^="/post/"]').first()
            await elegantClick(page, p)
            await page.waitForLoadState("networkidle")
        }

        // Scroll back to composer
        const composer2 = page.locator('[data-testid="comment-composer"]')
        await composer2.waitFor()
        const box2 = await composer2.boundingBox()
        if (box2) await smoothScroll(page, box2.y - 300, 1000)

        // Type the REAL comment
        const textarea2 = page.locator('textarea[placeholder*="Add your perspective"]')
        await elegantClick(page, textarea2)
        await page.keyboard.type("As a verified researcher, I can confirm these findings align with recent predictions.", { delay: 40 })
        await page.waitForTimeout(800)

        // Click Comment
        await elegantClick(page, commentBtn)

        // Wait for comment to appear
        await page.waitForTimeout(1500)

        // Find our new comment (Stark Mater) and highlight the Verified Badge
        // We look for the "Stark Mater" text and the checkmark nearby
        const myName = page.getByText("Stark Mater").first()
        if (await myName.isVisible()) {
            const myBox = await myName.boundingBox()
            if (myBox) {
                // Hover over the badge (to the right of name)
                await humanMove(page, myBox.x + myBox.width + 15, myBox.y + myBox.height / 2, 40)
                await page.waitForTimeout(2000) // Show off the badge
            }
        }

        // === Scene 4: The Paper Bot ===
        // Go back to Home/Feed
        const brand = page.locator('a[href="/"]').first()
        await elegantClick(page, brand)
        await page.waitForLoadState("networkidle")

        // Look for a post with the Bot Avatar Ring (.avatar-bot-ring)
        // We scroll a bit if needed
        let botPost = page.locator('article').filter({ has: page.locator('.avatar-bot-ring') }).first()

        if (!await botPost.isVisible()) {
            await smoothScroll(page, 500, 1000)
            botPost = page.locator('article').filter({ has: page.locator('.avatar-bot-ring') }).first()
        }

        if (await botPost.isVisible()) {
            // Move to it
            const postBox = await botPost.boundingBox()
            if (postBox) {
                await humanMove(page, postBox.x + postBox.width / 2, postBox.y + postBox.height / 3, 50)
                await page.waitForTimeout(1000)

                // Click to open
                await elegantClick(page, botPost.locator('a').first())
                await page.waitForLoadState("networkidle")

                // Scroll through the bot's structured analysis
                await smoothScroll(page, 300, 1500)
                await page.waitForTimeout(1000)
                await smoothScroll(page, 800, 2000)
                await page.waitForTimeout(2000)
            }
        }

        // Final Fade Out
        await page.evaluate(() => document.body.style.transition = "opacity 2s ease")
        await page.evaluate(() => document.body.style.opacity = "0")
        await page.waitForTimeout(2500)
    })
})
