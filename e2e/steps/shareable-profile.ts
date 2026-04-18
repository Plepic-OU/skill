import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import {
  createTestUser,
  setFirestoreAssessment,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_DISPLAY_NAME,
} from '../helpers/emulator'
import { claimLevel, waitForQuestMap } from '../helpers/claim'

const { Given, When, Then } = createBdd()

// Module-level variable to share userId between steps (survives page navigation, unlike window)
let testUserId: string

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

When('I click the share button', async ({ page }) => {
  // Grant clipboard permissions
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy profile link' }).click()
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- playwright-bdd requires destructured fixtures
Given('a user exists with skills claimed', async ({ page }) => {
  // Create user and set up profile in Firestore emulator
  const result = await createTestUser(TEST_EMAIL, TEST_PASSWORD)
  testUserId = result.localId

  await setFirestoreAssessment(
    testUserId,
    { autonomy: 3, parallelExecution: 2, skillUsage: 1 },
    'normal',
  )
})

When('I navigate to their profile URL', async ({ page }) => {
  if (!testUserId) throw new Error('testUserId not set — run the profile creation step first')
  await page.goto(`/profile/${testUserId}`)
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
  await waitForQuestMap(page)
  // Verify all 3 quest paths are present using semantic data attributes
  const paths = page.locator('[data-quest-path]')
  await expect(paths).toHaveCount(3)
})

Then('I do not see claim or unclaim buttons', async ({ page }) => {
  await waitForQuestMap(page)
  // Expand a node first — claim/unclaim buttons are only visible in expanded nodes
  const firstNode = page.locator('[data-skill-name]').first()
  await firstNode.click()
  await expect(firstNode).toHaveAttribute('aria-expanded', 'true')
  // Now assert that no claim/unclaim buttons are visible within the expanded view
  const claimBtns = page.getByRole('button', { name: 'This is me' })
  await expect(claimBtns).toHaveCount(0)
  const unclaimBtns = page.getByRole('button', { name: 'Step back one' })
  await expect(unclaimBtns).toHaveCount(0)
})

Then('I see an {string} link', async ({ page }, text: string) => {
  await expect(page.getByRole('link', { name: text }).first()).toBeVisible({ timeout: 5000 })
})
