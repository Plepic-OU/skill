import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { clearEmulatorData } from '../helpers/emulator'
import { waitForQuestMap } from '../helpers/claim'

const { Given, Then, Before } = createBdd()

Then('I should see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible({ timeout: 5000 })
})

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
  await waitForQuestMap(page)
})
