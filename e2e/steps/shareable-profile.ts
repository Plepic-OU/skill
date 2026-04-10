import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import {
  createTestUser,
  setFirestoreAssessment,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_DISPLAY_NAME,
} from '../helpers/emulator'
import { claimLevel } from '../helpers/claim'

const { Given, When, Then } = createBdd()

Then('the URL should contain {string}', async ({ page }, pattern: string) => {
  await page.waitForURL(`**${pattern}**`, { timeout: 5000 })
  expect(page.url()).toContain(pattern)
})

Then('the URL should be {string}', async ({ page }, path: string) => {
  await page.waitForURL(`**${path}`, { timeout: 5000 })
  expect(new URL(page.url()).pathname).toBe(path)
})

Then('I can still claim skills on my profile', async ({ page }) => {
  await claimLevel(page, 'Review Every Edit')
})

Given('I claim the {string} level on my profile', async ({ page }, name: string) => {
  await claimLevel(page, name)
})

When('I click the share button', async ({ page }) => {
  // Grant clipboard permissions
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy profile link' }).click()
})

Then('I see a {string} toast', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible({ timeout: 3000 })
})

Given('a user exists with skills claimed', async ({ page }) => {
  // Create user and set up profile in Firestore emulator
  const result = await createTestUser(TEST_EMAIL, TEST_PASSWORD)
  const userId = result.localId

  await setFirestoreAssessment(
    userId,
    { autonomy: 3, parallelExecution: 2, skillUsage: 1 },
    'normal',
  )

  // Store userId for later steps
  await page.evaluate((uid) => {
    ;(window as Record<string, unknown>).__testUserId = uid
  }, userId)
})

When('I navigate to their profile URL', async ({ page }) => {
  const userId = await page.evaluate(() => {
    return (window as Record<string, unknown>).__testUserId as string
  })
  await page.goto(`/profile/${userId}`)
})

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

Then('I see their display name', async ({ page }) => {
  // The profile banner should show the user's name from emulator helper
  await expect(page.locator('h2').filter({ hasText: TEST_DISPLAY_NAME })).toBeVisible({
    timeout: 5000,
  })
})

Then('I see their skill tree in read-only mode', async ({ page }) => {
  await page.waitForSelector('#questMap', { timeout: 5000 })
  // Verify nodes are present (3 quest paths)
  const paths = page.locator('#questMap > *')
  await expect(paths).toHaveCount(3)
})

Then('I do not see claim or unclaim buttons', async ({ page }) => {
  const claimBtns = page.getByRole('button', { name: 'This is me' })
  await expect(claimBtns).toHaveCount(0)
  const unclaimBtns = page.getByRole('button', { name: 'Not here yet' })
  await expect(unclaimBtns).toHaveCount(0)
})

Then('I see an {string} link', async ({ page }, text: string) => {
  await expect(page.getByRole('link', { name: text }).first()).toBeVisible({ timeout: 5000 })
})

Then('I see a {string} message', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 })
})
