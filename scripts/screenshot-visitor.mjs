#!/usr/bin/env node
/*
 * Capture visitor-view screenshots of Alice's profile from the local dev
 * server, both mobile and desktop. Produces /tmp/critique-mobile.png and
 * /tmp/critique-desktop.png which can be read back with the Read tool.
 *
 * Assumes `pnpm emulators` + `pnpm dev` are already running, and Alice has
 * been seeded (e.g. via `cd preview && node seed.mjs`).
 */
import { chromium } from '@playwright/test'

const URL = 'http://localhost:5173/profile/demo-alice'

// Cloud sessions may ship a prebuilt chromium at a different version than
// Playwright expects. Set PLAYWRIGHT_CHROMIUM_PATH to point at it; locally,
// the default Playwright download works.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH
const browser = await chromium.launch(executablePath ? { executablePath } : {})

async function shot(viewport, outPath, fullPage) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'load' })
  // Let React render + Firestore fetch resolve + animations settle.
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: outPath, fullPage })
  await ctx.close()
  console.log(`  wrote ${outPath}`)
}

await shot({ width: 390, height: 844 }, '/tmp/critique-mobile-fold.png', false)
await shot({ width: 390, height: 844 }, '/tmp/critique-mobile-full.png', true)
await shot({ width: 1280, height: 800 }, '/tmp/critique-desktop-fold.png', false)
await shot({ width: 1280, height: 800 }, '/tmp/critique-desktop-full.png', true)

// Close-up on the stakes section at the bottom of each viewport.
async function stakesCloseup(viewport, outPath) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'load' })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 })
  const stakes = page.getByText(/Stakes/).first()
  await stakes.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  const box = await stakes.locator('..').boundingBox()
  if (box) {
    const pad = 40
    await page.screenshot({
      path: outPath,
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(viewport.width - Math.max(0, box.x - pad), box.width + pad * 2),
        height: box.height + pad * 2,
      },
    })
  }
  await ctx.close()
  console.log(`  wrote ${outPath}`)
}
await stakesCloseup({ width: 390, height: 844 }, '/tmp/critique-mobile-stakes.png')
await stakesCloseup({ width: 1280, height: 800 }, '/tmp/critique-desktop-stakes.png')

await browser.close()
console.log('Done.')
