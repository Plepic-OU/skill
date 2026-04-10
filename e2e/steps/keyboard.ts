import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { When, Then } = createBdd()

When('I focus the first skill node', async ({ page }) => {
  const firstNode = page.locator('[role="button"][aria-expanded]').first()
  await firstNode.focus()
})

When('I press Enter', async ({ page }) => {
  await page.keyboard.press('Enter')
})

Then('the node detail should be visible', async ({ page }) => {
  const expanded = page.locator('[aria-expanded="true"]')
  await expect(expanded).toHaveCount(1)
})
