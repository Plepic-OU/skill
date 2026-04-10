import { createBdd } from 'playwright-bdd'
import { clearEmulatorData } from '../helpers/emulator'

const { Given, Before } = createBdd()

Before(async ({ page }) => {
  // Clear emulator data for test isolation
  try {
    await clearEmulatorData()
  } catch {
    // Emulators may not be running for non-auth tests — that's fine
  }
  // Clear localStorage
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

Given('I open the skill tree page', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('#questMap')
})
